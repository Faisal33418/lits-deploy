from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks, UploadFile, File, Query, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import secrets
import requests
from storage import init_storage, put_object, get_object, generate_upload_path, is_storage_available, generate_presigned_url
from ai_scoring import calculate_lifestyle_score, get_profile_insights

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize storage on startup
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("✓ Storage initialized")
    except Exception as e:
        logger.warning(f"⚠ Storage init failed (will use demo mode): {e}")

# Airline domains for verification
AIRLINE_DOMAINS = [
    "united.com", "delta.com", "aa.com", "southwest.com",
    "jetblue.com", "alaska-air.com", "spirit.com", "frontier.com",
    "hawaiian.com", "allegiant.com"
]

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class ProfileSetup(BaseModel):
    airline: str
    base: Optional[str] = None  # Optional for non-flight crew
    city: Optional[str] = None  # For ground crew
    aircraft: Optional[str] = None  # Only for pilots/FAs
    role: str
    bio: Optional[str] = None
    age: int
    photos: List[str] = []
    preferences: dict = {}
    time_with_company: Optional[str] = None
    days_off: List[str] = []
    trips_taken: List[str] = []
    bucket_list_trips: List[str] = []

class ScheduleEntry(BaseModel):
    date: str
    city: str
    arrival_time: str
    departure_time: str
    layover_hours: float

class SwipeAction(BaseModel):
    target_user_id: str
    action: str  # "like" or "pass"

class Message(BaseModel):
    match_id: str
    content: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    verified: bool = False
    profile_complete: bool = False
    airline: Optional[str] = None
    base: Optional[str] = None
    city: Optional[str] = None
    aircraft: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    photos: List[str] = []
    preferences: dict = {}
    subscription_tier: str = "free"  # free, cruising_altitude, first_class, captains_choice
    subscription_expires: Optional[str] = None
    daily_swipes_used: int = 0
    last_swipe_reset: Optional[str] = None
    time_with_company: Optional[str] = None
    days_off: List[str] = []
    trips_taken: List[str] = []
    bucket_list_trips: List[str] = []
    verification_level: str = "email"  # email, badge, full
    verification_status: str = "approved"  # pending, approved, rejected
    badge_photo_url: Optional[str] = None
    id_photo_url: Optional[str] = None
    verified_matches_only: bool = False
    is_gold_verified: bool = False  # True if verified via Google OAuth + airline email OR badge/ID
    verification_sources: List[str] = []  # ["google_oauth", "airline_email", "badge", "id"]
    created_at: str

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user1_id: str
    user2_id: str
    compatibility_score: Optional[float] = None
    matched_at: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    match_id: str
    sender_id: str
    content: str
    sent_at: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "LITS (Love In The Sky) API"}

# OAuth Session Management
class SessionExchange(BaseModel):
    session_id: str

@api_router.post("/auth/session")
async def exchange_session(data: SessionExchange):
    """Exchange session_id for user data and create session"""
    try:
        # Call Emergent Auth to get user data
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
            timeout=10
        )
        resp.raise_for_status()
        oauth_data = resp.json()
        
        email = oauth_data["email"]
        domain = email.split("@")[1]
        
        # Check if email domain is a known airline domain
        is_airline_email = domain in AIRLINE_DOMAINS
        
        # Determine verification sources and gold status
        verification_sources = ["google_oauth"]
        if is_airline_email:
            verification_sources.append("airline_email")
        
        # Gold verified = Google OAuth + airline email
        is_gold_verified = is_airline_email
        
        # Find or create user
        user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if not user:
            # Create new user
            user_id = str(uuid.uuid4())
            user_doc = {
                "id": user_id,
                "email": email,
                "full_name": oauth_data.get("name", ""),
                "verified": is_airline_email,  # Auto-verified only for airline emails
                "profile_complete": False,
                "verification_level": "email" if is_airline_email else "none",
                "verification_status": "approved" if is_airline_email else "pending",
                "verification_sources": verification_sources,
                "is_gold_verified": is_gold_verified,
                "subscription_tier": "free",
                "daily_swipes_used": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user_doc)
            user = user_doc
        else:
            # Update existing user with Google OAuth verification
            existing_sources = user.get("verification_sources", [])
            if "google_oauth" not in existing_sources:
                existing_sources.append("google_oauth")
            if is_airline_email and "airline_email" not in existing_sources:
                existing_sources.append("airline_email")
            
            # Check if now gold verified
            is_gold = ("google_oauth" in existing_sources and "airline_email" in existing_sources) or \
                      "badge" in existing_sources or "id" in existing_sources
            
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "verification_sources": existing_sources,
                    "is_gold_verified": is_gold
                }}
            )
            user["verification_sources"] = existing_sources
            user["is_gold_verified"] = is_gold
        
        # Create session
        session_token = oauth_data["session_token"]
        session_doc = {
            "user_id": user["id"],
            "session_token": session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_sessions.insert_one(session_doc)
        
        # Return user data (frontend will set cookie)
        user_data = {k: v for k, v in user.items() if k != "password"}
        return {
            "user": user_data,
            "session_token": session_token
        }
        
    except requests.RequestException as e:
        logger.error(f"OAuth session exchange failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid session")

@api_router.get("/auth/me")
async def get_current_user_oauth(authorization: str = Query(None)):
    """Get current user from session token (supports cookie or query param)"""
    # Check Authorization header or query param
    token = None
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
        else:
            token = authorization
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@api_router.post("/auth/logout")
async def logout_oauth(current_user: dict = Depends(get_current_user)):
    """Logout and delete session"""
    # Delete all sessions for this user
    await db.user_sessions.delete_many({"user_id": current_user["id"]})
    return {"message": "Logged out successfully"}

@api_router.post("/auth/signup")
async def signup(data: SignupRequest, background_tasks: BackgroundTasks):
    # Check if email domain is valid
    domain = data.email.split("@")[1]
    if domain not in AIRLINE_DOMAINS:
        raise HTTPException(status_code=400, detail="Please use a valid airline company email")
    
    # Check if user exists
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(data.password)
    verification_code = str(secrets.randbelow(900000) + 100000)  # 6-digit code
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hashed_pwd,
        "full_name": data.full_name,
        "verified": False,
        "profile_complete": False,
        "verification_code": verification_code,
        "verification_sources": ["airline_email"],  # Will be gold when verified
        "is_gold_verified": False,  # Will become True after email verification
        "verification_level": "email",
        "verification_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # In production, send email with verification_code
    logger.info(f"Verification code for {data.email}: {verification_code}")
    
    return {
        "message": "Signup successful. Please verify your email.",
        "email": data.email,
        "verification_code_demo": verification_code  # Remove in production
    }

@api_router.post("/auth/verify-email")
async def verify_email(data: VerifyEmailRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("verification_code") != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Email verified with airline domain = gold verified
    await db.users.update_one(
        {"email": data.email},
        {
            "$set": {
                "verified": True,
                "is_gold_verified": True,
                "verification_status": "approved"
            },
            "$unset": {"verification_code": ""}
        }
    )
    
    token = create_access_token({"user_id": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "password" and k != "verification_code"}
    user_data["verified"] = True
    user_data["is_gold_verified"] = True
    
    return AuthResponse(token=token, user=user_data)

@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first")
    
    token = create_access_token({"user_id": user["id"]})
    user_data = {k: v for k, v in user.items() if k != "password"}
    
    return AuthResponse(token=token, user=user_data)

@api_router.post("/profile/setup")
async def setup_profile(data: ProfileSetup, current_user: dict = Depends(get_current_user)):
    update_data = data.model_dump()
    update_data["profile_complete"] = True
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return {"message": "Profile updated", "user": updated_user}

@api_router.get("/profile/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return {k: v for k, v in current_user.items() if k != "password"}

@api_router.post("/schedule")
async def add_schedule(entries: List[ScheduleEntry], current_user: dict = Depends(get_current_user)):
    # Delete existing schedules
    await db.schedules.delete_many({"user_id": current_user["id"]})
    
    # Add new schedules
    schedule_docs = []
    for entry in entries:
        doc = entry.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["user_id"] = current_user["id"]
        schedule_docs.append(doc)
    
    if schedule_docs:
        await db.schedules.insert_many(schedule_docs)
    
    return {"message": "Schedule updated", "count": len(schedule_docs)}

@api_router.get("/discover")
async def discover_users(
    verified_only: bool = Query(False, description="Filter to only show gold verified users"),
    current_user: dict = Depends(get_current_user)
):
    """Get users to discover. Premium feature: verified_only filter."""
    # Get users I haven't swiped on yet
    swipes = await db.swipes.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    swiped_ids = [s["target_user_id"] for s in swipes]
    
    # Find users (exclude self and already swiped)
    exclude_ids = swiped_ids + [current_user["id"]]
    
    # Build base query
    query = {
        "id": {"$nin": exclude_ids},
        "profile_complete": True,
        "verified": True
    }
    
    # Check if user can use verified_only filter (premium feature)
    user_tier = current_user.get("subscription_tier", "free")
    premium_tiers = ["first_class", "captains_choice"]
    can_use_filter = user_tier in premium_tiers
    
    # Apply verified_only filter if requested AND user has premium
    filter_applied = False
    if verified_only:
        if can_use_filter:
            query["is_gold_verified"] = True
            filter_applied = True
        # If not premium, we still return results but without filter
    
    candidates = await db.users.find(
        query,
        {"_id": 0, "password": 0, "verification_code": 0}
    ).limit(20).to_list(20)
    
    return {
        "users": candidates,
        "filter_applied": filter_applied,
        "can_use_verified_filter": can_use_filter,
        "verified_only_requested": verified_only
    }

@api_router.post("/swipe")
async def swipe(action: SwipeAction, current_user: dict = Depends(get_current_user)):
    # Record swipe
    swipe_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "target_user_id": action.target_user_id,
        "action": action.action,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.swipes.insert_one(swipe_doc)
    
    # Check for match if action is "like"
    if action.action == "like":
        # Check if target also liked me
        mutual = await db.swipes.find_one({
            "user_id": action.target_user_id,
            "target_user_id": current_user["id"],
            "action": "like"
        }, {"_id": 0})
        
        if mutual:
            # Create match
            match_id = str(uuid.uuid4())
            match_doc = {
                "id": match_id,
                "user1_id": current_user["id"],
                "user2_id": action.target_user_id,
                "matched_at": datetime.now(timezone.utc).isoformat()
            }
            await db.matches.insert_one(match_doc)
            
            # Calculate compatibility score in background
            try:
                score = await calculate_compatibility(current_user["id"], action.target_user_id)
                await db.matches.update_one({"id": match_id}, {"$set": {"compatibility_score": score}})
            except Exception as e:
                logger.error(f"Error calculating compatibility: {e}")
            
            # Create notifications for both users about the new match
            target_user = await db.users.find_one({"id": action.target_user_id}, {"_id": 0, "password": 0})
            if target_user:
                # Notification for current user
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": current_user["id"],
                    "type": "new_match",
                    "title": "New Match!",
                    "message": f"You matched with {target_user['full_name']}! Start a conversation.",
                    "data": {
                        "match_id": match_id,
                        "match_user_id": target_user["id"],
                        "match_user_name": target_user["full_name"],
                        "match_user_photo": target_user.get("photos", [None])[0]
                    },
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
                
                # Notification for target user
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": action.target_user_id,
                    "type": "new_match",
                    "title": "New Match!",
                    "message": f"You matched with {current_user['full_name']}! Start a conversation.",
                    "data": {
                        "match_id": match_id,
                        "match_user_id": current_user["id"],
                        "match_user_name": current_user["full_name"],
                        "match_user_photo": current_user.get("photos", [None])[0]
                    },
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })
            
            return {"match": True, "match_id": match_id}
    
    return {"match": False}

async def calculate_compatibility(user1_id: str, user2_id: str) -> float:
    """Use OpenAI to calculate compatibility score"""
    user1 = await db.users.find_one({"id": user1_id}, {"_id": 0})
    user2 = await db.users.find_one({"id": user2_id}, {"_id": 0})
    
    # Get schedules
    schedule1 = await db.schedules.find({"user_id": user1_id}, {"_id": 0}).to_list(100)
    schedule2 = await db.schedules.find({"user_id": user2_id}, {"_id": 0}).to_list(100)
    
    prompt = f"""
Analyze compatibility between two airline employees for a dating match.

User 1:
- Airline: {user1.get('airline', 'N/A')}
- Base: {user1.get('base', 'N/A')}
- Role: {user1.get('role', 'N/A')}
- Aircraft: {user1.get('aircraft', 'N/A')}
- Schedule cities: {', '.join([s.get('city', '') for s in schedule1[:5]])}

User 2:
- Airline: {user2.get('airline', 'N/A')}
- Base: {user2.get('base', 'N/A')}
- Role: {user2.get('role', 'N/A')}
- Aircraft: {user2.get('aircraft', 'N/A')}
- Schedule cities: {', '.join([s.get('city', '') for s in schedule2[:5]])}

Rate their compatibility on a scale of 0-100 based on:
- Schedule overlap potential
- Base proximity
- Lifestyle compatibility (same airline culture, similar routes)
- Layover city matches

Respond with ONLY a number between 0 and 100.
"""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"compat-{user1_id}-{user2_id}",
            system_message="You are an expert at analyzing airline employee compatibility."
        ).with_model("openai", "gpt-5.2")
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        score = float(response.strip())
        return min(max(score, 0), 100)
    except Exception as e:
        logger.error(f"AI compatibility error: {e}")
        return 50.0

@api_router.get("/matches")
async def get_matches(current_user: dict = Depends(get_current_user)):
    # Find all matches
    matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["id"]},
            {"user2_id": current_user["id"]}
        ]
    }, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    enriched = []
    for match in matches:
        other_id = match["user2_id"] if match["user1_id"] == current_user["id"] else match["user1_id"]
        other_user = await db.users.find_one({"id": other_id}, {"_id": 0, "password": 0})
        if other_user:
            enriched.append({
                **match,
                "matched_user": other_user
            })
    
    return {"matches": enriched}

@api_router.post("/messages")
async def send_message(msg: Message, current_user: dict = Depends(get_current_user)):
    # Verify match exists
    match = await db.matches.find_one({"id": msg.match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Verify user is part of match
    if current_user["id"] not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "match_id": msg.match_id,
        "sender_id": current_user["id"],
        "content": msg.content,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    return {"message": "Sent", "data": {k: v for k, v in message_doc.items() if k != "_id"}}

@api_router.get("/messages/{match_id}")
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    # Verify match
    match = await db.matches.find_one({"id": match_id}, {"_id": 0})
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    if current_user["id"] not in [match["user1_id"], match["user2_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = await db.messages.find({"match_id": match_id}, {"_id": 0}).sort("sent_at", 1).to_list(1000)
    return {"messages": messages}

@api_router.get("/layovers/nearby")
async def nearby_layovers(city: str, current_user: dict = Depends(get_current_user)):
    """Find who's on layover in the same city"""
    # Find matches' schedules in this city
    my_matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["id"]},
            {"user2_id": current_user["id"]}
        ]
    }, {"_id": 0}).to_list(100)
    
    match_user_ids = []
    for m in my_matches:
        other_id = m["user2_id"] if m["user1_id"] == current_user["id"] else m["user1_id"]
        match_user_ids.append(other_id)
    
    # Find schedules in this city
    today = datetime.now(timezone.utc).date().isoformat()
    schedules = await db.schedules.find({
        "user_id": {"$in": match_user_ids},
        "city": city,
        "date": {"$gte": today}
    }, {"_id": 0}).to_list(100)
    
    # Enrich with user data
    result = []
    for sched in schedules:
        user = await db.users.find_one({"id": sched["user_id"]}, {"_id": 0, "password": 0})
        if user:
            result.append({
                "user": user,
                "schedule": sched
            })
    
    return {"layovers": result}

# Subscription endpoints
class SubscriptionRequest(BaseModel):
    tier: str  # cruising_altitude, first_class, captains_choice
    duration: str  # monthly, quarterly, annually

@api_router.get("/subscription/pricing")
async def get_pricing():
    """Get all pricing tiers"""
    return {
        "tiers": [
            {
                "id": "free",
                "name": "Ground Level",
                "price": 0,
                "features": [
                    "10 swipes per day",
                    "See mutual matches",
                    "Basic chat",
                    "View profiles in your base"
                ]
            },
            {
                "id": "cruising_altitude",
                "name": "Cruising Altitude",
                "price_monthly": 10.99,
                "price_quarterly": 8.99,
                "price_annually": 6.99,
                "features": [
                    "Unlimited swipes",
                    "See who liked you",
                    "5 Super Likes/day",
                    "Rewind swipes",
                    "Layover Discovery",
                    "Schedule-based matching",
                    "Ad-free",
                    "1 Profile boost/month"
                ]
            },
            {
                "id": "first_class",
                "name": "First Class",
                "price_monthly": 15.99,
                "price_quarterly": 13.99,
                "price_annually": 11.99,
                "features": [
                    "All Cruising Altitude features",
                    "Priority likes",
                    "Unlimited Super Likes",
                    "Advanced filters (airline, base, aircraft)",
                    "Message before matching",
                    "3 Profile boosts/month",
                    "Passport Mode",
                    "Read receipts"
                ]
            },
            {
                "id": "captains_choice",
                "name": "Captain's Choice",
                "price_monthly": 22.99,
                "price_quarterly": 19.99,
                "price_annually": 17.99,
                "features": [
                    "All First Class features",
                    "AI Trip Planner",
                    "Enhanced AI compatibility",
                    "Unlimited boosts",
                    "VIP badge",
                    "Message anyone before matching",
                    "Exclusive events",
                    "Priority support"
                ]
            }
        ]
    }

@api_router.post("/subscription/upgrade")
async def upgrade_subscription(sub: SubscriptionRequest, current_user: dict = Depends(get_current_user)):
    """Upgrade user subscription (demo - no payment processing yet)"""
    # Calculate expiration
    now = datetime.now(timezone.utc)
    if sub.duration == "monthly":
        expires = now + timedelta(days=30)
    elif sub.duration == "quarterly":
        expires = now + timedelta(days=90)
    else:  # annually
        expires = now + timedelta(days=365)
    
    # Update user subscription
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "subscription_tier": sub.tier,
                "subscription_expires": expires.isoformat()
            }
        }
    )
    
    updated_user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    
    return {
        "message": "Subscription upgraded successfully",
        "subscription": {
            "tier": sub.tier,
            "expires": expires.isoformat()
        },
        "user": updated_user
    }

@api_router.get("/subscription/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    """Get current subscription status"""
    tier = current_user.get("subscription_tier", "free")
    expires = current_user.get("subscription_expires")
    
    # Check if expired
    is_active = True
    if expires and tier != "free":
        expire_date = datetime.fromisoformat(expires)
        if expire_date < datetime.now(timezone.utc):
            is_active = False
            # Reset to free tier
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"subscription_tier": "free", "subscription_expires": None}}
            )
            tier = "free"
    
    return {
        "tier": tier,
        "expires": expires,
        "is_active": is_active,
        "features": get_tier_features(tier)
    }

def get_tier_features(tier: str) -> dict:
    """Get features for a subscription tier"""
    features = {
        "free": {
            "daily_swipes": 10,
            "see_likes": False,
            "super_likes_per_day": 1,
            "rewind": False,
            "layover_discovery": False,
            "schedule_matching": False,
            "boosts_per_month": 0,
            "priority_likes": False,
            "advanced_filters": False,
            "message_before_match": False,
            "passport_mode": False,
            "ai_trip_planner": False,
            "vip_badge": False
        },
        "cruising_altitude": {
            "daily_swipes": float('inf'),
            "see_likes": True,
            "super_likes_per_day": 5,
            "rewind": True,
            "layover_discovery": True,
            "schedule_matching": True,
            "boosts_per_month": 1,
            "priority_likes": False,
            "advanced_filters": False,
            "message_before_match": False,
            "passport_mode": False,
            "ai_trip_planner": False,
            "vip_badge": False
        },
        "first_class": {
            "daily_swipes": float('inf'),
            "see_likes": True,
            "super_likes_per_day": float('inf'),
            "rewind": True,
            "layover_discovery": True,
            "schedule_matching": True,
            "boosts_per_month": 3,
            "priority_likes": True,
            "advanced_filters": True,
            "message_before_match": True,
            "passport_mode": True,
            "ai_trip_planner": False,
            "vip_badge": False
        },
        "captains_choice": {
            "daily_swipes": float('inf'),
            "see_likes": True,
            "super_likes_per_day": float('inf'),
            "rewind": True,
            "layover_discovery": True,
            "schedule_matching": True,
            "boosts_per_month": float('inf'),
            "priority_likes": True,
            "advanced_filters": True,
            "message_before_match": True,
            "passport_mode": True,
            "ai_trip_planner": True,
            "vip_badge": True
        }
    }
    return features.get(tier, features["free"])

# Verification endpoints
@api_router.post("/verification/upload")
async def upload_verification(
    file: UploadFile = File(...),
    verification_type: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload verification document (badge or ID photo) to AWS S3"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")
    
    # Validate verification type
    if verification_type not in ["badge", "id"]:
        raise HTTPException(status_code=400, detail="Invalid verification type. Use 'badge' or 'id'")
    
    # Get file extension
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    
    # Check if S3 storage is available
    if not is_storage_available():
        raise HTTPException(status_code=503, detail="Storage service unavailable. Please try again later.")
    
    try:
        path = generate_upload_path(current_user["id"], verification_type, ext)
        data = await file.read()
        result = put_object(path, data, file.content_type)
        photo_url = result["path"]  # Store the S3 key path
        s3_url = result["url"]  # Full S3 URL
    except Exception as e:
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file. Please try again.")
    
    # Update user record
    update_data = {}
    if verification_type == "badge":
        update_data["badge_photo_url"] = photo_url
        update_data["verification_level"] = "badge"
        update_data["verification_status"] = "pending"
    elif verification_type == "id":
        update_data["id_photo_url"] = photo_url
        update_data["verification_level"] = "full"
        update_data["verification_status"] = "pending"
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    # Create verification request record
    verification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "verification_type": verification_type,
        "photo_url": photo_url,
        "s3_url": s3_url,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.verification_requests.insert_one(verification_doc)
    
    return {
        "message": "Verification submitted for review",
        "status": "pending",
        "review_time": "24-48 hours",
        "photo_url": photo_url
    }

@api_router.get("/verification/photo/{path:path}")
async def get_verification_photo(
    path: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a presigned URL for verification photo (admin viewing)"""
    # Generate presigned URL for secure temporary access
    presigned_url = generate_presigned_url(path, expiration=3600)  # 1 hour expiry
    
    if not presigned_url:
        raise HTTPException(status_code=404, detail="Photo not found or storage unavailable")
    
    return {"url": presigned_url}

@api_router.get("/verification/status")
async def get_verification_status(current_user: dict = Depends(get_current_user)):
    """Get current verification status"""
    return {
        "verification_level": current_user.get("verification_level", "email"),
        "verification_status": current_user.get("verification_status", "approved"),
        "badge_photo_url": current_user.get("badge_photo_url"),
        "id_photo_url": current_user.get("id_photo_url")
    }

class VerificationApproval(BaseModel):
    user_id: str
    approved: bool
    reason: Optional[str] = None

@api_router.post("/verification/admin/review")
async def review_verification(data: VerificationApproval, current_user: dict = Depends(get_current_user)):
    """Admin endpoint to approve/reject verification (demo - no real admin auth)"""
    # In production, check if current_user is admin
    
    status = "approved" if data.approved else "rejected"
    
    # Get user to check verification type
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_fields = {"verification_status": status}
    
    # If approved, update verification sources and gold status
    if data.approved:
        existing_sources = user.get("verification_sources", [])
        verification_level = user.get("verification_level", "email")
        
        if verification_level == "badge" and "badge" not in existing_sources:
            existing_sources.append("badge")
        elif verification_level == "full" and "id" not in existing_sources:
            existing_sources.append("id")
        
        update_fields["verification_sources"] = existing_sources
        update_fields["is_gold_verified"] = True  # Badge or ID verification = gold verified
    
    await db.users.update_one(
        {"id": data.user_id},
        {"$set": update_fields}
    )
    
    await db.verification_requests.update_many(
        {"user_id": data.user_id, "status": "pending"},
        {"$set": {
            "status": status,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "rejection_reason": data.reason
        }}
    )
    
    return {"message": f"Verification {status}"}

@api_router.get("/verification/admin/pending")
async def get_pending_verifications(current_user: dict = Depends(get_current_user)):
    """Admin endpoint to get pending verification requests"""
    requests = await db.verification_requests.find(
        {"status": "pending"},
        {"_id": 0}
    ).sort("submitted_at", -1).to_list(100)
    
    # Enrich with user data
    enriched = []
    for req in requests:
        user = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "password": 0})
        if user:
            enriched.append({
                **req,
                "user": user
            })
    
    return {"pending_requests": enriched}

class PreferenceUpdate(BaseModel):
    verified_matches_only: bool

@api_router.post("/preferences/verified-only")
async def set_verified_only_preference(data: PreferenceUpdate, current_user: dict = Depends(get_current_user)):
    """Set preference to only see verified matches"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"verified_matches_only": data.verified_matches_only}}
    )
    return {"message": "Preference updated", "verified_matches_only": data.verified_matches_only}


# Notification Models
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    type: str  # layover_match, new_match, message, verification_approved
    title: str
    message: str
    data: dict = {}
    read: bool = False
    created_at: str

class MarkNotificationRead(BaseModel):
    notification_id: str

# Notification endpoints
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    """Get all notifications for current user"""
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    unread_count = await db.notifications.count_documents({
        "user_id": current_user["id"],
        "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@api_router.post("/notifications/read")
async def mark_notification_read(data: MarkNotificationRead, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read"""
    result = await db.notifications.update_one(
        {"id": data.notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All notifications marked as read"}

# Calendar Permission Models
class CalendarPermissionToggle(BaseModel):
    match_user_id: str

# Calendar Permission Endpoints
@api_router.post("/calendar/grant-access")
async def grant_calendar_access(data: CalendarPermissionToggle, current_user: dict = Depends(get_current_user)):
    """Grant calendar access to a specific match"""
    # Verify they are actually matched
    match = await db.matches.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": data.match_user_id},
            {"user1_id": data.match_user_id, "user2_id": current_user["id"]}
        ]
    }, {"_id": 0})
    
    if not match:
        raise HTTPException(status_code=400, detail="You can only share calendar with matches")
    
    # Upsert the permission record
    await db.calendar_permissions.update_one(
        {"granter_id": current_user["id"], "grantee_id": data.match_user_id},
        {"$set": {
            "granter_id": current_user["id"],
            "grantee_id": data.match_user_id,
            "granted_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Check if mutual access is now established
    reverse_permission = await db.calendar_permissions.find_one({
        "granter_id": data.match_user_id,
        "grantee_id": current_user["id"]
    }, {"_id": 0})
    
    mutual_access = reverse_permission is not None
    
    return {
        "message": "Calendar access granted",
        "mutual_access": mutual_access
    }

@api_router.post("/calendar/revoke-access")
async def revoke_calendar_access(data: CalendarPermissionToggle, current_user: dict = Depends(get_current_user)):
    """Revoke calendar access from a specific match"""
    await db.calendar_permissions.delete_one({
        "granter_id": current_user["id"],
        "grantee_id": data.match_user_id
    })
    
    return {"message": "Calendar access revoked"}

@api_router.get("/calendar/permissions")
async def get_calendar_permissions(current_user: dict = Depends(get_current_user)):
    """Get all calendar permissions for current user"""
    # Who I've granted access to
    granted_to = await db.calendar_permissions.find(
        {"granter_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Who has granted access to me
    granted_by = await db.calendar_permissions.find(
        {"grantee_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    granted_to_ids = [p["grantee_id"] for p in granted_to]
    granted_by_ids = [p["granter_id"] for p in granted_by]
    
    # Find mutual access (both have granted)
    mutual_access_ids = list(set(granted_to_ids) & set(granted_by_ids))
    
    return {
        "granted_to": granted_to_ids,
        "granted_by": granted_by_ids,
        "mutual_access": mutual_access_ids
    }

@api_router.get("/calendar/access-status/{match_user_id}")
async def get_access_status(match_user_id: str, current_user: dict = Depends(get_current_user)):
    """Check calendar access status with a specific match"""
    # Have I granted them access?
    i_granted = await db.calendar_permissions.find_one({
        "granter_id": current_user["id"],
        "grantee_id": match_user_id
    }, {"_id": 0})
    
    # Have they granted me access?
    they_granted = await db.calendar_permissions.find_one({
        "granter_id": match_user_id,
        "grantee_id": current_user["id"]
    }, {"_id": 0})
    
    return {
        "i_granted": i_granted is not None,
        "they_granted": they_granted is not None,
        "mutual_access": i_granted is not None and they_granted is not None
    }



@api_router.get("/layovers/check-matches")
async def check_layover_matches(current_user: dict = Depends(get_current_user)):
    """Check for matches with overlapping layovers and create notifications.
    Only shows matches where BOTH users have granted mutual calendar access."""
    # Get user's upcoming schedules
    today = datetime.now(timezone.utc).date().isoformat()
    my_schedules = await db.schedules.find({
        "user_id": current_user["id"],
        "date": {"$gte": today}
    }, {"_id": 0}).to_list(100)
    
    if not my_schedules:
        return {"layover_matches": [], "notifications_created": 0, "message": "No upcoming schedules"}
    
    # Get all my matches
    my_matches = await db.matches.find({
        "$or": [
            {"user1_id": current_user["id"]},
            {"user2_id": current_user["id"]}
        ]
    }, {"_id": 0}).to_list(100)
    
    match_user_ids = []
    for m in my_matches:
        other_id = m["user2_id"] if m["user1_id"] == current_user["id"] else m["user1_id"]
        match_user_ids.append(other_id)
    
    if not match_user_ids:
        return {"layover_matches": [], "notifications_created": 0, "message": "No matches yet"}
    
    # Filter to only matches with MUTUAL calendar access
    # Get who I've granted access to
    my_grants = await db.calendar_permissions.find(
        {"granter_id": current_user["id"], "grantee_id": {"$in": match_user_ids}},
        {"_id": 0}
    ).to_list(100)
    i_granted_to = {p["grantee_id"] for p in my_grants}
    
    # Get who has granted access to me
    their_grants = await db.calendar_permissions.find(
        {"grantee_id": current_user["id"], "granter_id": {"$in": match_user_ids}},
        {"_id": 0}
    ).to_list(100)
    they_granted_to_me = {p["granter_id"] for p in their_grants}
    
    # Mutual access = intersection of both sets
    mutual_access_ids = list(i_granted_to & they_granted_to_me)
    
    if not mutual_access_ids:
        return {
            "layover_matches": [], 
            "notifications_created": 0, 
            "message": "No matches with mutual calendar access. Grant calendar access to your matches first!"
        }
    
    # Find overlapping layovers only with mutual access matches
    layover_matches = []
    notifications_created = 0
    
    for my_sched in my_schedules:
        # Find matches in the same city on the same date (only mutual access matches)
        matching_schedules = await db.schedules.find({
            "user_id": {"$in": mutual_access_ids},
            "city": my_sched["city"],
            "date": my_sched["date"]
        }, {"_id": 0}).to_list(100)
        
        for match_sched in matching_schedules:
            # Get match user details
            match_user = await db.users.find_one(
                {"id": match_sched["user_id"]},
                {"_id": 0, "password": 0}
            )
            
            if match_user:
                layover_match = {
                    "city": my_sched["city"],
                    "date": my_sched["date"],
                    "my_schedule": my_sched,
                    "match_schedule": match_sched,
                    "match_user": match_user
                }
                layover_matches.append(layover_match)
                
                # Check if notification already exists for this layover
                existing_notification = await db.notifications.find_one({
                    "user_id": current_user["id"],
                    "type": "layover_match",
                    "data.city": my_sched["city"],
                    "data.date": my_sched["date"],
                    "data.match_user_id": match_user["id"]
                }, {"_id": 0})
                
                if not existing_notification:
                    # Create notification
                    notification_doc = {
                        "id": str(uuid.uuid4()),
                        "user_id": current_user["id"],
                        "type": "layover_match",
                        "title": f"Layover Match in {my_sched['city']}!",
                        "message": f"{match_user['full_name']} will be in {my_sched['city']} on {my_sched['date']} - same as you!",
                        "data": {
                            "city": my_sched["city"],
                            "date": my_sched["date"],
                            "match_user_id": match_user["id"],
                            "match_user_name": match_user["full_name"],
                            "match_user_photo": match_user.get("photos", [None])[0]
                        },
                        "read": False,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.notifications.insert_one(notification_doc)
                    notifications_created += 1
                    
                    # Also create notification for the match
                    match_notification_doc = {
                        "id": str(uuid.uuid4()),
                        "user_id": match_user["id"],
                        "type": "layover_match",
                        "title": f"Layover Match in {my_sched['city']}!",
                        "message": f"{current_user['full_name']} will be in {my_sched['city']} on {my_sched['date']} - same as you!",
                        "data": {
                            "city": my_sched["city"],
                            "date": my_sched["date"],
                            "match_user_id": current_user["id"],
                            "match_user_name": current_user["full_name"],
                            "match_user_photo": current_user.get("photos", [None])[0]
                        },
                        "read": False,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.notifications.insert_one(match_notification_doc)
    
    return {
        "layover_matches": layover_matches,
        "notifications_created": notifications_created
    }

# Helper function to create notification (for use in other endpoints)
async def create_notification(user_id: str, notification_type: str, title: str, message: str, data: dict = {}):
    """Create a notification for a user"""
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "data": data,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification_doc)
    return notification_doc


# AI Lifestyle Scoring Endpoints
@api_router.get("/ai/compatibility/{target_user_id}")
async def get_ai_compatibility(target_user_id: str, current_user: dict = Depends(get_current_user)):
    """Get AI-powered lifestyle compatibility score with another user"""
    # Get target user
    target_user = await db.users.find_one({"id": target_user_id}, {"_id": 0, "password": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if we already have a cached score (less than 24 hours old)
    cache_key = f"{min(current_user['id'], target_user_id)}_{max(current_user['id'], target_user_id)}"
    cached = await db.ai_scores.find_one({"cache_key": cache_key}, {"_id": 0})
    
    if cached:
        cache_time = datetime.fromisoformat(cached.get("calculated_at", "2000-01-01"))
        if datetime.now(timezone.utc) - cache_time < timedelta(hours=24):
            return cached["score_data"]
    
    # Calculate new score
    score_data = await calculate_lifestyle_score(current_user, target_user)
    
    # Cache the result
    await db.ai_scores.update_one(
        {"cache_key": cache_key},
        {"$set": {
            "cache_key": cache_key,
            "user1_id": current_user["id"],
            "user2_id": target_user_id,
            "score_data": score_data,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return score_data

@api_router.get("/ai/profile-insights")
async def get_my_profile_insights(current_user: dict = Depends(get_current_user)):
    """Get AI-powered insights about your own profile"""
    # Check cache
    cached = await db.ai_insights.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if cached:
        cache_time = datetime.fromisoformat(cached.get("calculated_at", "2000-01-01"))
        if datetime.now(timezone.utc) - cache_time < timedelta(hours=24):
            return cached["insights_data"]
    
    # Generate new insights
    insights = await get_profile_insights(current_user)
    
    # Cache
    await db.ai_insights.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "user_id": current_user["id"],
            "insights_data": insights,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return insights

@api_router.post("/ai/refresh-compatibility/{target_user_id}")
async def refresh_ai_compatibility(target_user_id: str, current_user: dict = Depends(get_current_user)):
    """Force refresh AI compatibility score (bypasses cache)"""
    target_user = await db.users.find_one({"id": target_user_id}, {"_id": 0, "password": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate new score
    score_data = await calculate_lifestyle_score(current_user, target_user)
    
    # Update cache
    cache_key = f"{min(current_user['id'], target_user_id)}_{max(current_user['id'], target_user_id)}"
    await db.ai_scores.update_one(
        {"cache_key": cache_key},
        {"$set": {
            "cache_key": cache_key,
            "user1_id": current_user["id"],
            "user2_id": target_user_id,
            "score_data": score_data,
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return score_data




# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
