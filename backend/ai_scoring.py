"""
AI Lifestyle Scoring Service
Uses OpenAI GPT-5.2 to analyze aviation lifestyle compatibility between users
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

def get_llm_key():
    """Get EMERGENT_LLM_KEY at runtime (after dotenv loads)"""
    return os.environ.get("EMERGENT_LLM_KEY")

async def calculate_lifestyle_score(user1: Dict[str, Any], user2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate AI-powered lifestyle compatibility score between two users.
    Returns a score (0-100) and detailed analysis.
    """
    llm_key = get_llm_key()
    if not llm_key:
        logger.warning("EMERGENT_LLM_KEY not configured, using fallback scoring")
        return fallback_scoring(user1, user2)
    
    try:
        # Build profile summaries
        profile1 = build_profile_summary(user1)
        profile2 = build_profile_summary(user2)
        
        # Create AI prompt
        prompt = f"""You are an expert matchmaker for airline industry professionals. Analyze the compatibility between these two aviation crew members based on their lifestyle, schedules, and interests.

**Person 1:**
{profile1}

**Person 2:**
{profile2}

Analyze their compatibility considering:
1. Schedule Alignment - Do their work schedules (days off, bases) allow for quality time together?
2. Lifestyle Match - Similar interests, travel preferences, and bucket list destinations?
3. Career Compatibility - Do their roles and airlines create opportunities to connect?
4. Long-term Potential - Can they realistically build a relationship given aviation lifestyle demands?

Respond in this exact JSON format:
{{
    "overall_score": <number 0-100>,
    "schedule_compatibility": <number 0-100>,
    "lifestyle_match": <number 0-100>,
    "career_synergy": <number 0-100>,
    "highlight": "<one exciting thing they have in common>",
    "challenge": "<one potential challenge to be aware of>",
    "tip": "<one actionable dating tip for these two>",
    "summary": "<2-3 sentence summary of their compatibility>"
}}

Only respond with valid JSON, no other text."""

        # Initialize chat with GPT-5.2
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"lifestyle-{user1.get('id', 'u1')}-{user2.get('id', 'u2')}",
            system_message="You are an AI matchmaking analyst specializing in airline industry relationships. Always respond with valid JSON only."
        ).with_model("openai", "gpt-5.2")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Clean response - remove any markdown code blocks
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            clean_response = clean_response.strip()
            
            result = json.loads(clean_response)
            result["ai_generated"] = True
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            logger.error(f"Response was: {response[:500]}")
            return fallback_scoring(user1, user2)
            
    except Exception as e:
        logger.error(f"AI scoring failed: {e}")
        return fallback_scoring(user1, user2)


def build_profile_summary(user: Dict[str, Any]) -> str:
    """Build a text summary of a user's profile for AI analysis"""
    parts = []
    
    if user.get("full_name"):
        parts.append(f"Name: {user['full_name']}")
    if user.get("age"):
        parts.append(f"Age: {user['age']}")
    if user.get("role"):
        role_display = user['role'].replace('_', ' ').title()
        parts.append(f"Role: {role_display}")
    if user.get("airline"):
        parts.append(f"Airline: {user['airline']}")
    if user.get("base"):
        parts.append(f"Home Base: {user['base']}")
    if user.get("time_with_company"):
        parts.append(f"Experience: {user['time_with_company']}")
    if user.get("days_off"):
        days = user['days_off'] if isinstance(user['days_off'], list) else [user['days_off']]
        parts.append(f"Days Off: {', '.join(days)}")
    if user.get("trips_taken"):
        trips = user['trips_taken'] if isinstance(user['trips_taken'], list) else [user['trips_taken']]
        parts.append(f"Recent Trips: {', '.join(trips[:5])}")
    if user.get("bucket_list_trips"):
        bucket = user['bucket_list_trips'] if isinstance(user['bucket_list_trips'], list) else [user['bucket_list_trips']]
        parts.append(f"Bucket List: {', '.join(bucket[:5])}")
    if user.get("bio"):
        parts.append(f"About: {user['bio']}")
    
    return "\n".join(parts) if parts else "Profile information not available"


def fallback_scoring(user1: Dict[str, Any], user2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback scoring when AI is unavailable.
    Uses simple heuristics based on profile data.
    """
    score = 50  # Base score
    
    # Same airline bonus
    if user1.get("airline") == user2.get("airline"):
        score += 10
    
    # Same base bonus
    if user1.get("base") == user2.get("base"):
        score += 15
    
    # Overlapping days off
    days1 = set(user1.get("days_off", []) if isinstance(user1.get("days_off"), list) else [])
    days2 = set(user2.get("days_off", []) if isinstance(user2.get("days_off"), list) else [])
    if days1 & days2:
        score += 10
    
    # Shared bucket list destinations
    bucket1 = set(user1.get("bucket_list_trips", []) if isinstance(user1.get("bucket_list_trips"), list) else [])
    bucket2 = set(user2.get("bucket_list_trips", []) if isinstance(user2.get("bucket_list_trips"), list) else [])
    shared_destinations = bucket1 & bucket2
    if shared_destinations:
        score += min(len(shared_destinations) * 5, 15)
    
    # Cap score at 100
    score = min(score, 100)
    
    return {
        "overall_score": score,
        "schedule_compatibility": 50 + (15 if days1 & days2 else 0),
        "lifestyle_match": 50 + (15 if shared_destinations else 0),
        "career_synergy": 50 + (10 if user1.get("airline") == user2.get("airline") else 0),
        "highlight": "Both work in aviation - you understand the lifestyle!",
        "challenge": "Coordinating schedules may require extra effort",
        "tip": "Compare your layover cities to find overlap opportunities",
        "summary": f"Based on profile data, you have a {score}% compatibility score. Your shared aviation background gives you a unique understanding of each other's lifestyle.",
        "ai_generated": False
    }


async def get_profile_insights(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate AI insights about a single user's dating profile.
    Provides suggestions for profile optimization.
    """
    llm_key = get_llm_key()
    if not llm_key:
        return {"insights": [], "ai_generated": False}
    
    try:
        profile = build_profile_summary(user)
        
        prompt = f"""Analyze this airline professional's dating profile and provide brief insights:

{profile}

Respond in JSON format:
{{
    "strengths": ["<strength 1>", "<strength 2>"],
    "suggestions": ["<suggestion to improve profile>"],
    "conversation_starters": ["<topic someone could ask about>", "<another topic>"],
    "ideal_match_traits": ["<trait 1>", "<trait 2>"]
}}

Only respond with valid JSON."""

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"insights-{user.get('id', 'user')}",
            system_message="You are a dating profile analyst for aviation professionals. Be concise and helpful."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        
        result = json.loads(clean_response.strip())
        result["ai_generated"] = True
        return result
        
    except Exception as e:
        logger.error(f"Profile insights failed: {e}")
        return {"insights": [], "ai_generated": False}
