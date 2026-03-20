# LITS (Love In The Sky) - Product Requirements Document

## Overview
A standalone dating application exclusively for airline and airport employees. The app caters to the unique lifestyle of aviation professionals, enabling connections based on schedules, layovers, and shared industry experiences.

## Target Users
- Pilots, flight attendants, ramp agents, mechanics
- Operations agents, provision agents, ground service operators
- Corporate aviation staff and all airline professionals

## Technical Stack
- **Backend**: FastAPI, MongoDB (Motor async driver)
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Storage**: AWS S3 (bucket: idbucket92100)
- **Auth**: JWT (email/password) + Emergent Google OAuth
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key

---

## Phase 1: Core Features ✅ COMPLETED

### Authentication
- [x] Email/password registration with airline email validation
- [x] 6-digit email verification code system
- [x] JWT token-based authentication
- [x] Emergent Google OAuth integration
- [x] Session management for OAuth users

### User Profiles
- [x] Inclusive profile fields for all airline roles
- [x] Fields: Role, Company, Base, City, Time with Company
- [x] Days Off, Trips Taken, Bucket List Trips
- [x] Photo uploads (placeholder - needs S3 integration for profile photos)

### 3-Phase Verification System
- [x] **Level 1 - Email**: Automatic for airline domain emails
- [x] **Level 2 - Badge**: Upload badge photo for manual review
- [x] **Level 3 - Full**: Upload government ID for VIP status
- [x] AWS S3 storage for verification documents
- [x] Presigned URLs for secure image access
- [x] Admin Dashboard for verification review

### Basic Dating Flow
- [x] Discover page with profile cards
- [x] Swipe to like/pass functionality
- [x] Mutual match creation
- [x] Chat messaging between matches

### Subscription Tiers (UI Complete)
- [x] Ground Level (Free): 10 swipes/day
- [x] Cruising Altitude ($10.99): Unlimited swipes, see likes
- [x] First Class ($15.99): Priority likes, advanced filters
- [x] Captain's Choice ($22.99): AI Trip Planner, VIP badge

### Layover Notifications ✅ NEW
- [x] Notification system with multiple types (layover_match, new_match)
- [x] Check for layover matches with matching schedules
- [x] Auto-create notifications for both users when layovers overlap
- [x] New match notifications when mutual likes occur
- [x] Unread count badge in bottom navigation
- [x] Mark as read / Mark all as read functionality
- [x] Notifications page with clickable items

### Schedule Management ✅ NEW
- [x] Dedicated Schedule page (/schedule) for managing layovers
- [x] Add layover form with date, city, arrival/departure times
- [x] Auto-calculate layover duration
- [x] City autocomplete with popular destinations
- [x] View upcoming and past layovers
- [x] Delete layovers
- [x] Quick check for layover matches button
- [x] Link from Profile page ("My Layovers" button)

### Calendar Sharing Permissions ✅ NEW
- [x] Privacy-focused calendar sharing with mutual consent
- [x] Grant/revoke calendar access per match (direct toggle)
- [x] **Both users must approve** to see each other's layovers
- [x] Calendar access status shown on match cards:
  - Lock icon = not shared
  - Calendar icon (yellow) = you shared, waiting for them
  - Unlock icon (green) = mutual access enabled
- [x] "Calendar Shared" badge when mutual access established
- [x] Layover matching only works with mutual calendar access
- [x] Info banner explaining how calendar sharing works

### Gold Verification Badge ✅ NEW
- [x] Gold plane icon displayed next to verified users' names
- [x] Users get gold verified status via:
  - Google OAuth with airline email domain
  - Airline email verification
  - Badge/ID verification approval by admin
- [x] "Gold Verified Airline Staff" badge on profile
- [x] Gold badge shown on:
  - Profile page
  - Discover cards
  - Match cards
- [x] `is_gold_verified` field in user model
- [x] `verification_sources` array tracking how user was verified

---

## Phase 2: Aviation-Specific Features (UPCOMING)

### P0: Smart Schedule Matching ✅ COMPLETED
- [x] Schedule entry system via dedicated Schedule page
- [x] Layover notifications when schedules overlap

### P1: "Verified Matches Only" Filter ✅ COMPLETED
- [x] Filter toggle button on Discover page
- [x] Premium feature (First Class & Captain's Choice tiers only)
- [x] Free users see lock + crown icon, clicking redirects to pricing
- [x] Premium users can toggle filter on/off
- [x] Backend filters by `is_gold_verified` field
- [x] Filter state persists during session
- [x] Feature highlighted in pricing page for First Class tier

### P2: Stripe Payment Integration
- [ ] Connect subscription UI to Stripe
- [ ] Implement payment processing
- [ ] Manage subscription lifecycle

### P3: AI Lifestyle Scoring ✅ COMPLETED
- [x] OpenAI GPT-5.2 integration via Emergent LLM Key
- [x] Calculate compatibility scores (0-100) between users
- [x] Analyze three dimensions: Schedule alignment, Lifestyle match, Career synergy
- [x] Generate personalized AI insights:
  - HIGHLIGHT: What they have in common
  - CONSIDER: Potential challenges
  - TIP: Actionable dating advice
  - Summary: Overall compatibility analysis
- [x] AI score badge on Discover cards ("66% Match AI")
- [x] Full AI Compatibility panel in Chat page (expandable)
- [x] Score caching with 24-hour TTL
- [x] Fallback heuristic scoring when AI unavailable
- [x] Profile insights endpoint (/api/ai/profile-insights)

---

## Phase 3: AI & Monetization (FUTURE)

### Non-Rev Trip Matching
- [ ] AI suggestions for shared trips
- [ ] Consider non-rev travel compatibility

### Layover Social Mode
- [ ] Real-time presence in layover cities
- [ ] Quick connect feature for nearby crew

---

## Phase 4: Social Layer (BACKLOG)

### Group Features
- [ ] Crew meetup events
- [ ] Airline-specific groups
- [ ] Event calendar integration

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register with airline email
- `POST /api/auth/verify-email` - Verify email code
- `POST /api/auth/login` - JWT login
- `POST /api/auth/session` - OAuth session exchange
- `GET /api/auth/me` - Get current user (OAuth)
- `POST /api/auth/logout` - Logout (OAuth)

### Profile
- `POST /api/profile/setup` - Complete profile
- `GET /api/profile/me` - Get own profile

### Discovery & Matching
- `GET /api/discover` - Get potential matches
- `POST /api/swipe` - Like or pass
- `GET /api/matches` - Get all matches
- `POST /api/messages` - Send message
- `GET /api/messages/{match_id}` - Get chat history

### Verification
- `POST /api/verification/upload` - Upload badge/ID to S3
- `GET /api/verification/status` - Get verification level
- `GET /api/verification/photo/{path}` - Get presigned URL
- `GET /api/verification/admin/pending` - Admin: pending requests
- `POST /api/verification/admin/review` - Admin: approve/reject

### Subscription
- `GET /api/subscription/pricing` - Get tier details
- `POST /api/subscription/upgrade` - Upgrade tier (demo)
- `GET /api/subscription/status` - Current subscription

### Notifications
- `GET /api/notifications` - Get all notifications with unread count
- `POST /api/notifications/read` - Mark single notification as read
- `POST /api/notifications/read-all` - Mark all notifications as read
- `GET /api/layovers/check-matches` - Check for overlapping layovers and create notifications

---

## Database Collections

### users
```json
{
  "id": "uuid",
  "email": "string",
  "full_name": "string",
  "verified": "boolean",
  "profile_complete": "boolean",
  "airline": "string",
  "base": "string",
  "role": "string",
  "verification_level": "email|badge|full",
  "verification_status": "pending|approved|rejected",
  "subscription_tier": "free|cruising_altitude|first_class|captains_choice"
}
```

### verification_requests
```json
{
  "id": "uuid",
  "user_id": "string",
  "verification_type": "badge|id",
  "photo_url": "s3_path",
  "status": "pending|approved|rejected",
  "submitted_at": "datetime"
}
```

### user_sessions (OAuth)
```json
{
  "user_id": "string",
  "session_token": "string",
  "expires_at": "datetime"
}
```

---

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (lits_db)
- `JWT_SECRET` - JWT signing key
- `EMERGENT_LLM_KEY` - OpenAI access via Emergent
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `S3_BUCKET_NAME` - S3 bucket (idbucket92100)
- `AWS_REGION` - AWS region (us-east-1)

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - API base URL

---

## Known Limitations
1. Admin endpoints lack role-based access control (demo mode)
2. Profile photo upload uses URLs, not S3 (only verification docs use S3)
3. Subscription payments are mocked (no Stripe integration yet)
4. AI compatibility scoring is implemented but could be enhanced

---

## File Structure
```
/app/
├── backend/
│   ├── .env
│   ├── requirements.txt
│   ├── server.py          # Main FastAPI application
│   ├── storage.py         # AWS S3 integration
│   └── tests/
├── frontend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── contexts/
│       │   └── AuthContext.js
│       └── pages/
│           ├── AuthPage.js
│           ├── AuthCallback.js
│           ├── VerificationPage.js
│           ├── AdminDashboard.js
│           └── ...
└── memory/
    └── PRD.md
```
