# 🚧 LITS - What's Left To Do

## ✅ What's DONE

### Core Features
- ✅ User authentication (email/password + JWT)
- ✅ Email verification (6-digit code)
- ✅ Profile setup (all aviation fields)
- ✅ Discovery/swipe interface
- ✅ Match system (mutual likes)
- ✅ Chat messaging
- ✅ AI compatibility scoring (OpenAI GPT-5.2)
- ✅ Pricing system (3 tiers)
- ✅ Subscription management
- ✅ 3-tier verification structure
- ✅ Badge upload backend
- ✅ Admin dashboard UI
- ✅ OAuth session backend
- ✅ Storage integration structure
- ✅ All 9 airline roles
- ✅ Travel profiles (trips, bucket list)
- ✅ Days off scheduling
- ✅ Standalone positioning

---

## ❌ HIGH PRIORITY - Core Functionality

### 1. OAuth Frontend Integration 🔥
**Status:** Backend ready, frontend missing
**What's needed:**
- [ ] Add "Sign in with Google" button to AuthPage
- [ ] Integrate Emergent Google Auth widget
- [ ] Handle OAuth callback and session exchange
- [ ] Store session token in localStorage/cookie
- [ ] Update AuthContext to handle OAuth flow

**Why:** Much better UX than 6-digit code, instant verification

**Effort:** 2-3 hours

---

### 2. Verification Badges Display 🔥
**Status:** Data exists, UI missing
**What's needed:**
- [ ] Add badge icons to profile cards in Discover
- [ ] Show verification level on user profiles
- [ ] Display badges in matches list
- [ ] Add badges to chat headers
- [ ] Visual distinction: Blue (email), Gold (badge), Purple (full)

**Why:** Users can't see who's verified!

**Effort:** 2-3 hours

---

### 3. "Verified Only" Filter Toggle 🔥
**Status:** Backend working, frontend missing
**What's needed:**
- [ ] Add toggle in Discover page header
- [ ] Add filter in Settings/Preferences
- [ ] Visual indicator when filter is active
- [ ] Save preference to backend
- [ ] Update discover feed when toggled

**Why:** Premium feature that drives subscriptions

**Effort:** 2 hours

---

### 4. Profile Photo Upload 🔥
**Status:** Placeholder only
**What's needed:**
- [ ] Add photo upload in profile setup
- [ ] Integrate with storage API
- [ ] Show uploaded photos on profiles
- [ ] Allow multiple photos (up to 6)
- [ ] Photo cropping/editing
- [ ] Delete/reorder photos

**Why:** No one will swipe without photos!

**Effort:** 4-5 hours

---

### 5. Real Email Sending 🔥
**Status:** Console logs only
**What's needed:**
- [ ] Integrate SendGrid or AWS SES
- [ ] Create email templates
- [ ] Send verification codes
- [ ] Send match notifications
- [ ] Send verification approval/rejection
- [ ] Welcome emails

**Why:** Users can't actually verify emails in production

**Effort:** 3-4 hours

---

## ⚠️ MEDIUM PRIORITY - Enhanced Features

### 6. Stripe Payment Integration
**Status:** Demo instant activation
**What's needed:**
- [ ] Integrate Stripe Checkout
- [ ] Handle payment webhooks
- [ ] Subscription creation/cancellation
- [ ] Payment history
- [ ] Invoice generation
- [ ] Failed payment handling

**Effort:** 5-6 hours

---

### 7. Profile Editing
**Status:** View only
**What's needed:**
- [ ] Edit profile page
- [ ] Update bio, photos, aviation info
- [ ] Update trips and bucket list
- [ ] Update days off
- [ ] Save changes endpoint

**Effort:** 3 hours

---

### 8. Admin Authentication
**Status:** Open to everyone
**What's needed:**
- [ ] Admin role in user model
- [ ] Admin login/protection
- [ ] Role-based access control
- [ ] Admin user management

**Effort:** 2-3 hours

---

### 9. Swipe Limit Enforcement
**Status:** Visual indicator only
**What's needed:**
- [ ] Track daily swipes in database
- [ ] Reset swipes at midnight
- [ ] Block swipes when limit reached
- [ ] Show "upgrade" modal
- [ ] Countdown timer to reset

**Effort:** 2-3 hours

---

### 10. Real-time Chat
**Status:** Polling every 3 seconds
**What's needed:**
- [ ] WebSocket integration
- [ ] Socket.io or similar
- [ ] Real-time message delivery
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Online status

**Effort:** 5-6 hours

---

### 11. Schedule Overlap Algorithm
**Status:** Basic structure only
**What's needed:**
- [ ] Actual layover matching logic
- [ ] Date/time overlap detection
- [ ] City matching
- [ ] Notify when overlaps found
- [ ] "Meet up" suggestions

**Effort:** 4-5 hours

---

### 12. Layover Discovery Implementation
**Status:** Endpoint exists, needs work
**What's needed:**
- [ ] Better schedule parsing
- [ ] Real-time layover feed
- [ ] "Who's here tonight?" feature
- [ ] Location-based sorting
- [ ] Layover countdown timers

**Effort:** 4 hours

---

## 📱 LOW PRIORITY - Nice to Have

### 13. Push Notifications
- [ ] Browser push notifications
- [ ] Match notifications
- [ ] Message notifications
- [ ] Verification status updates

**Effort:** 4 hours

---

### 14. Stripe Identity Integration
**Status:** Placeholder only
**What's needed:**
- [ ] Stripe Identity setup
- [ ] ID verification flow
- [ ] Biometric liveness check
- [ ] Handle verification results
- [ ] Update verification level

**Effort:** 3-4 hours

---

### 15. Enhanced Profile Features
- [ ] Video profiles
- [ ] Voice notes
- [ ] Profile questions/prompts
- [ ] Personality badges
- [ ] Interests/hobbies

**Effort:** 6-8 hours

---

### 16. Social Features
- [ ] Success stories section
- [ ] Testimonials
- [ ] Crew events calendar
- [ ] Group meetups
- [ ] Share profiles with friends

**Effort:** 8-10 hours

---

### 17. Advanced Filters
- [ ] Filter by airline
- [ ] Filter by base
- [ ] Filter by aircraft type
- [ ] Filter by age range
- [ ] Filter by distance
- [ ] Filter by days off compatibility

**Effort:** 4 hours

---

### 18. Analytics Dashboard
- [ ] User growth metrics
- [ ] Match success rates
- [ ] Engagement metrics
- [ ] Revenue analytics
- [ ] Verification completion rates

**Effort:** 6 hours

---

### 19. Mobile App
- [ ] React Native app
- [ ] iOS deployment
- [ ] Android deployment
- [ ] App store optimization
- [ ] Push notifications

**Effort:** 40-60 hours

---

## 🐛 BUGS & POLISH

### Known Issues
- [ ] Fix OAuth session expiry handling
- [ ] Improve error messages
- [ ] Add loading states everywhere
- [ ] Mobile responsive improvements
- [ ] Form validation improvements
- [ ] Better empty states
- [ ] Skeleton loaders
- [ ] Toast notification improvements

**Effort:** 4-6 hours

---

## 🧪 TESTING

### Quality Assurance
- [ ] End-to-end testing (full user flows)
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Load testing

**Effort:** 8-10 hours

---

## 📊 Priority Order (Recommended)

### Sprint 1 (Week 1) - Make it Work
1. **OAuth Frontend** - Better signup UX
2. **Verification Badges** - Show verification status
3. **Profile Photos** - Critical for dating app
4. **Verified Only Filter** - Premium feature

**Estimated:** 12-15 hours

---

### Sprint 2 (Week 2) - Make it Real
5. **Email Sending** - Production ready
6. **Stripe Payments** - Actual revenue
7. **Admin Auth** - Security
8. **Profile Editing** - User control

**Estimated:** 13-16 hours

---

### Sprint 3 (Week 3) - Make it Better
9. **Real-time Chat** - Better UX
10. **Swipe Limits** - Enforce free tier
11. **Schedule Overlap** - Core feature
12. **Layover Discovery** - Unique value prop

**Estimated:** 15-18 hours

---

### Sprint 4 (Week 4) - Polish & Launch
13. **Bug Fixes** - Quality
14. **Testing** - Reliability
15. **Push Notifications** - Engagement
16. **Advanced Filters** - Premium feature

**Estimated:** 12-16 hours

---

## 💰 MVP Launch Checklist (Absolute Minimum)

To launch LITS and start getting users:

### Must Have ✅
- [x] Auth system
- [x] Profile creation
- [x] Swipe/match
- [x] Chat
- [ ] **Photo upload** ← CRITICAL
- [ ] **Verification badges display** ← CRITICAL
- [ ] **Email sending** ← CRITICAL
- [ ] **Stripe payments** ← CRITICAL

### Should Have
- [ ] OAuth login
- [ ] Profile editing
- [ ] Real-time chat
- [ ] Swipe limits

### Nice to Have
- [ ] Schedule overlap
- [ ] Layover discovery
- [ ] Advanced filters
- [ ] Push notifications

---

## 🎯 Absolute Minimum to Launch

**4 Critical Features (30-40 hours total):**

1. **Profile Photos** (5 hours)
   - Without photos, no one swipes
   - Use Emergent Storage API
   - Upload/crop/display

2. **Verification Badges** (3 hours)
   - Show who's verified
   - Build trust
   - Simple icons on cards

3. **Email Sending** (4 hours)
   - SendGrid integration
   - Verification codes
   - Welcome emails

4. **Stripe Payments** (6 hours)
   - Real subscriptions
   - Actual revenue
   - Payment handling

**With these 4 done, LITS is launchable!**

---

## 📈 Post-Launch Priorities

After launch, focus on:
1. User feedback
2. Bug fixes
3. Onboarding improvements
4. Retention features (push notifications, real-time chat)
5. Growth features (referrals, viral loops)

---

## 🔥 Quick Wins (Can Do in 1-2 Hours Each)

1. **Verification badge icons** - Easy visual improvement
2. **"Edit Profile" link** - Currently grayed out
3. **Better error messages** - User experience
4. **Loading states** - Polish
5. **Empty states** - Better UX when no matches
6. **Skeleton loaders** - Perceived performance
7. **Toast improvements** - Better feedback
8. **Footer links** - About, Privacy, Terms
9. **Help/Support page** - User assistance
10. **FAQ page** - Reduce support burden

---

## 💡 Summary

**Status:** ~70% complete

**MVP Launch needs:** 4 critical features (30-40 hours)
**Full feature parity:** ~80-100 hours
**Production ready:** ~120-150 hours

**Next 3 things to build:**
1. 📸 **Profile photo upload** (most critical)
2. 🏅 **Verification badges display** (trust signal)
3. 📧 **Email sending** (production requirement)

**Start with these 3, and LITS becomes viable!**
