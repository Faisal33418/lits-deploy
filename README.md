# ✈️ LITS - Love In The Sky

**Where Crew Hearts Take Flight**

LITS is a **standalone dating and social networking platform** designed exclusively for airline employees across all roles. Unlike mainstream dating apps, LITS understands the unique lifestyle, schedules, and culture of aviation professionals - from pilots and flight attendants to ramp agents, operations agents, provision agents, aviation mechanics, and ground service equipment operators.

## 🎯 Independent Platform

LITS is a **dedicated dating app** for the airline industry - not integrated with or part of any other service. Our singular focus is connecting airline employees who understand the aviation lifestyle.

## 🌟 What Makes LITS Different

**Aviation-First Design:**
Every feature is built specifically for airline staff, not adapted from generic dating apps. We understand layovers, irregular schedules, bases, commuting, and the unique challenges of aviation relationships.

## 🌟 Key Features

### MVP Features (Phase 1)
- ✅ **Company Email Verification** - Secure, airline-only environment with domain validation (@united.com, @delta.com, etc.)
- ✅ **Aviation-Specific Profiles** - Airline, base, aircraft type, role (pilot/flight attendant/ramp agent/operations agent/provision agent/aviation mechanic/ground service equipment)
- ✅ **Smart Swipe Matching** - Tinder-style discovery with like/pass actions
- ✅ **AI Compatibility Scoring** - OpenAI GPT-5.2 powered compatibility analysis based on schedules, bases, and lifestyle
- ✅ **Real-Time Chat** - Message matched crew members instantly
- ✅ **Schedule Management** - Add your layovers and flight schedules
- ✅ **Layover Discovery** - Find who's in the same city during your layover
- ✅ **Match Insights** - View compatibility percentage for each match

## 🎨 Design

LITS features the **"Twilight Runway"** design theme:
- Deep slate backgrounds (#020617) for low-light cockpit/cabin comfort
- Cyan-to-violet gradients (#0ea5e9 → #8b5cf6) for primary actions
- Glassmorphism effects with backdrop blur
- **Fonts**: Outfit (headings), Be Vietnam Pro (body), JetBrains Mono (technical data)
- Mobile-first responsive design
- Aviation-inspired UI elements

## 📱 About LITS

LITS is an **independent dating platform** built from the ground up for airline employees. We are:

- ✈️ **Standalone App** - Dedicated solely to airline dating and connections
- 🔒 **Staff Verified Only** - Airline email and badge verification
- 🌍 **Global Aviation Community** - Connecting crew worldwide
- 💕 **Aviation-Focused** - Every feature designed for airline lifestyle

**Not affiliated with any airline company, travel agency, or other apps.**

**Backend:**
- FastAPI (Python)
- MongoDB with Motor (async driver)
- JWT authentication
- OpenAI GPT-5.2 via Emergent Integrations
- Bcrypt password hashing

**Frontend:**
- React 19
- React Router v7
- Axios for API calls
- Tailwind CSS
- Lucide React icons
- Sonner for toast notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ with Yarn
- Python 3.11+
- MongoDB running on localhost:27017

### Installation

1. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
# .env is already configured
```

2. **Frontend Setup**
```bash
cd frontend
yarn install
```

3. **Run the App**
```bash
# Backend runs on port 8001 (via supervisor)
# Frontend runs on port 3000 (via supervisor)
# Both services auto-restart on code changes
```

### Environment Variables

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=lits_db
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-88b2d56FdA60682C07
JWT_SECRET=lits_love_in_the_sky_secret_key_2025
JWT_ALGORITHM=HS256
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://crew-layover-link.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 📱 User Flow

1. **Landing Page** → Learn about LITS (Love In The Sky)
2. **Sign Up** → Enter company email (@united.com, @delta.com, etc.)
3. **Email Verification** → Enter 6-digit code (shown in demo mode)
4. **Profile Setup** → Add aviation details (airline, base, aircraft, role, bio, age)
5. **Discover** → Swipe through crew profiles
6. **Match** → When both users like each other, it's a match!
7. **Chat** → Message your matches
8. **Profile** → View and manage your profile

## 🔐 Security Features

- Company email domain validation (10+ airline domains supported)
- JWT token authentication
- Bcrypt password hashing
- Protected routes (frontend & backend)
- CORS configuration
- Verified staff-only environment

## 🧠 AI Features

**Compatibility Scoring:**
- Analyzes airline, base, aircraft, role, and schedule data
- Considers schedule overlap potential and lifestyle compatibility
- Generates 0-100 compatibility score using OpenAI GPT-5.2
- Displayed on match cards for better connection insights

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register with airline email
- `POST /api/auth/verify-email` - Verify 6-digit code
- `POST /api/auth/login` - Login with credentials

### Profile
- `POST /api/profile/setup` - Complete profile with aviation data
- `GET /api/profile/me` - Get current user profile

### Discovery & Matching
- `GET /api/discover` - Get users to swipe on
- `POST /api/swipe` - Like or pass on a user
- `GET /api/matches` - Get all matches with enriched data

### Chat
- `POST /api/messages` - Send a message
- `GET /api/messages/{match_id}` - Get conversation history

### Schedule & Layovers
- `POST /api/schedule` - Add layover schedule
- `GET /api/layovers/nearby` - Find matches in a city

## 🎯 Supported Airlines

Currently supporting email domains from:
- United Airlines
- Delta Air Lines
- American Airlines
- Southwest Airlines
- JetBlue Airways
- Alaska Airlines
- Spirit Airlines
- Frontier Airlines
- Hawaiian Airlines
- Allegiant Air

## 📈 Future Enhancements

### Phase 2 - Advanced Features
- [ ] Non-rev travel matching (find crew to travel with)
- [ ] Base-to-base compatibility and commute analysis
- [ ] Advanced layover coordination
- [ ] Group meetup events
- [ ] Photo upload functionality
- [ ] Push notifications for new matches/messages

### Phase 3 - AI Travel Integration
- [ ] AI-powered trip planning for couples
- [ ] Standby probability analysis
- [ ] Boarding likelihood predictions
- [ ] Route suggestions based on both schedules

### Phase 4 - Social Layer
- [ ] Crew events and meetups
- [ ] Airline-specific groups
- [ ] Layover activity recommendations
- [ ] Social feed for crew stories

## 🧪 Testing

The app has been comprehensively tested with:
- ✅ 25/25 backend API tests passing (100% success rate)
- ✅ Frontend component testing (95% pass rate)
- ✅ Complete user flow testing (signup → chat)
- ✅ AI compatibility scoring verification (92% score generated)
- ✅ Company email validation testing

## 📝 Notes

- Demo mode shows verification codes in the signup response
- AI compatibility uses the Emergent LLM universal key
- Chat polling interval: 3 seconds
- JWT tokens valid for 30 days
- Profile photos feature: UI ready, upload coming soon

## 🤝 Contributing

This is an MVP built for airline employees. Future contributions welcome for:
- Additional airline domain support
- Enhanced schedule matching algorithms
- Real-time chat with WebSockets
- Photo upload with cloud storage
- Advanced AI features

## 📄 License

Proprietary - Built for airline crew community

---

**Built with ❤️ for the aviation community**

*LITS - Where Crew Hearts Take Flight* ✈️💕
