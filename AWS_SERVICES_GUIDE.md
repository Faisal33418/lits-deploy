# ☁️ AWS Products for LITS Application

## Complete AWS Architecture for LITS

---

## 🎯 Core AWS Services Needed

### 1. **Amazon S3** - Photo Storage 📸
**Use for:**
- Profile photos
- Verification badge photos
- ID verification documents
- User-uploaded content

**Benefits:**
- Unlimited scalable storage
- 99.999999999% durability
- Built-in CDN integration
- Cheap ($0.023/GB/month)

**Implementation:**
```python
import boto3

s3 = boto3.client('s3')
s3.upload_file('photo.jpg', 'lits-photos', 'users/123/profile.jpg')
presigned_url = s3.generate_presigned_url('get_object', 
    Params={'Bucket': 'lits-photos', 'Key': 'users/123/profile.jpg'},
    ExpiresIn=3600)
```

**Cost:** ~$5-10/month for 1000 users

**Priority:** 🔥 **CRITICAL** (Photo upload needed for MVP)

---

### 2. **Amazon SES** - Email Service 📧
**Use for:**
- Email verification codes
- Welcome emails
- Match notifications
- Verification approval/rejection
- Password resets
- Marketing emails

**Benefits:**
- $0.10 per 1,000 emails
- High deliverability
- Built-in bounce/complaint handling
- Email templates

**Implementation:**
```python
import boto3

ses = boto3.client('ses', region_name='us-east-1')
ses.send_email(
    Source='noreply@lits.com',
    Destination={'ToAddresses': ['user@united.com']},
    Message={
        'Subject': {'Data': 'Verify Your Email'},
        'Body': {'Text': {'Data': f'Your code: {code}'}}
    }
)
```

**Cost:** $10/month for 100,000 emails

**Priority:** 🔥 **CRITICAL** (Email sending needed for MVP)

---

### 3. **Amazon RDS** or **DocumentDB** - Database 🗄️
**Use for:**
- Replace self-hosted MongoDB
- User data
- Matches, messages
- Subscriptions

**Benefits:**
- Automatic backups
- Multi-AZ failover
- Managed scaling
- Security patches

**RDS (PostgreSQL):**
- Better for relational data
- ACID compliance
- $15-30/month (db.t3.micro)

**DocumentDB (MongoDB compatible):**
- Drop-in MongoDB replacement
- Better for document model
- $50-100/month

**Priority:** ⚠️ **MEDIUM** (Current MongoDB works, but production needs managed)

---

### 4. **AWS Lambda** - Serverless Functions ⚡
**Use for:**
- Background jobs
- Image processing (resize photos)
- Daily swipe reset
- Compatibility calculations
- Webhook processing (Stripe)

**Benefits:**
- No servers to manage
- Pay per execution
- Auto-scaling
- $0.20 per million requests

**Use cases:**
```python
# Lambda 1: Resize uploaded photos
def resize_handler(event, context):
    # Triggered by S3 upload
    # Resize to 800x800, 400x400, 100x100
    
# Lambda 2: Reset daily swipes
def reset_swipes(event, context):
    # CloudWatch cron: daily at midnight
    # Reset all users' daily_swipes_used to 0

# Lambda 3: Process Stripe webhooks
def stripe_webhook(event, context):
    # Handle subscription.created, payment.succeeded
```

**Cost:** ~$5-10/month

**Priority:** ⚠️ **MEDIUM** (Nice to have, not critical)

---

### 5. **AWS Cognito** - Authentication 🔐
**Use for:**
- OAuth/social login (Google, Facebook)
- User management
- JWT token management
- Password resets

**Benefits:**
- Built-in OAuth flows
- Social login integration
- MFA support
- User pools

**Implementation:**
- Replace custom JWT with Cognito
- Get Google OAuth for free
- Handle session management

**Cost:** Free for first 50,000 users

**Priority:** ⚠️ **MEDIUM** (Current auth works, but Cognito is better)

---

### 6. **API Gateway + WebSockets** - Real-time Chat 💬
**Use for:**
- Replace polling with WebSockets
- Real-time message delivery
- Online presence
- Typing indicators

**Benefits:**
- Managed WebSocket connections
- Auto-scaling
- $1 per million messages

**Architecture:**
```
Frontend WebSocket
    ↓
API Gateway WebSocket
    ↓
Lambda (message handler)
    ↓
DynamoDB (connection IDs)
    ↓
Send to recipient
```

**Cost:** ~$5-10/month

**Priority:** ⚠️ **MEDIUM** (Better UX, not critical)

---

### 7. **Amazon SNS** - Push Notifications 📱
**Use for:**
- Browser push notifications
- Match notifications
- New message alerts
- Verification updates

**Benefits:**
- Multi-platform (web, iOS, Android)
- $0.50 per million notifications
- Built-in topic subscriptions

**Cost:** ~$5/month

**Priority:** 📱 **LOW** (Nice to have)

---

### 8. **CloudFront** - CDN 🌍
**Use for:**
- Serve profile photos globally
- Cache static assets
- Reduce latency
- HTTPS

**Benefits:**
- Fast global delivery
- Integrates with S3
- $0.085 per GB
- Free SSL certificates

**Cost:** ~$10-20/month

**Priority:** ⚠️ **MEDIUM** (Performance boost)

---

### 9. **Amazon Rekognition** - AI Photo Verification 🤖
**Use for:**
- Verify badge photos (logo detection)
- Face detection in profile photos
- Content moderation (inappropriate images)
- ID verification (face matching)

**Benefits:**
- Pre-trained models
- $0.001 per image
- Face comparison API
- Celebrity/logo detection

**Use cases:**
```python
rekognition = boto3.client('rekognition')

# Verify badge has airline logo
response = rekognition.detect_labels(
    Image={'S3Object': {'Bucket': 'lits', 'Name': 'badge.jpg'}},
    MinConfidence=80
)
# Check if "Logo", "Badge", "ID Card" detected

# Compare ID photo to profile selfie
response = rekognition.compare_faces(
    SourceImage={'S3Object': {'Bucket': 'lits', 'Name': 'id.jpg'}},
    TargetImage={'S3Object': {'Bucket': 'lits', 'Name': 'selfie.jpg'}}
)
# Get similarity percentage
```

**Cost:** $1-5/month

**Priority:** 📱 **LOW** (Automate verification, save admin time)

---

### 10. **Amazon OpenSearch** - Advanced Search 🔍
**Use for:**
- Advanced profile filtering
- Search by airline, base, city
- Full-text bio search
- Elasticsearch-compatible

**Benefits:**
- Fast full-text search
- Complex queries
- Analytics

**Cost:** ~$20-50/month

**Priority:** 📱 **LOW** (PostgreSQL search works for now)

---

### 11. **AWS Secrets Manager** - API Keys 🔑
**Use for:**
- Store OpenAI key
- Store Stripe keys
- Store AWS credentials
- Rotate secrets automatically

**Benefits:**
- Encrypted storage
- Automatic rotation
- Access logging
- $0.40 per secret/month

**Cost:** ~$5/month

**Priority:** ⚠️ **MEDIUM** (Security best practice)

---

### 12. **Amazon EventBridge** - Scheduled Jobs ⏰
**Use for:**
- Daily swipe reset (midnight)
- Weekly inactive user emails
- Monthly analytics reports
- Subscription renewal checks

**Benefits:**
- Serverless cron jobs
- Event-driven architecture
- $1 per million events

**Cost:** ~$2/month

**Priority:** ⚠️ **MEDIUM** (Better than cron)

---

### 13. **Amazon SQS** - Message Queue 📬
**Use for:**
- Background job processing
- Email queue
- Photo processing queue
- Webhook processing

**Benefits:**
- Decouple services
- Retry failed jobs
- $0.40 per million requests

**Cost:** ~$2-5/month

**Priority:** 📱 **LOW** (Nice for scale)

---

### 14. **CloudWatch** - Monitoring & Logs 📊
**Use for:**
- Application logs
- Error tracking
- Performance metrics
- Alerts

**Benefits:**
- Centralized logging
- Alarms for errors
- Dashboard

**Cost:** ~$10/month

**Priority:** ⚠️ **MEDIUM** (Production essential)

---

### 15. **AWS Systems Manager** - Parameter Store 🔧
**Use for:**
- Configuration management
- Environment variables
- Feature flags

**Benefits:**
- Free for standard parameters
- Versioning
- Easy updates

**Cost:** FREE

**Priority:** ⚠️ **MEDIUM** (Better than .env files)

---

## 🏗️ Recommended AWS Architecture

### **Tier 1: MVP Launch** (Critical)

```
┌─────────────────────────────────────┐
│         Frontend (React)             │
│  Hosted on: Vercel/Netlify          │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      API (FastAPI)                   │
│  Hosted on: EC2 or ECS              │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────┐
    │   Amazon S3     │ ← Profile photos
    │   (Critical)    │   Verification docs
    └─────────────────┘
              ↓
    ┌─────────────────┐
    │   Amazon SES    │ ← Email sending
    │   (Critical)    │   Verification codes
    └─────────────────┘
              ↓
    ┌─────────────────┐
    │   MongoDB       │ ← User data
    │   (Current)     │   Matches, messages
    └─────────────────┘
```

**Services needed:**
- ✅ **S3** - Photo storage
- ✅ **SES** - Email sending
- ✅ Keep current MongoDB for now

**Cost:** ~$20-30/month

---

### **Tier 2: Production Ready**

```
Frontend (React on CloudFront + S3)
    ↓
API Gateway (REST + WebSocket)
    ↓
Lambda Functions (Python)
    ├── User management
    ├── Matching engine
    ├── Chat handler
    └── Background jobs
    ↓
┌──────────────┬─────────────┬──────────────┐
│  RDS/DocDB   │  ElastiCache│   S3         │
│  (Database)  │  (Sessions) │  (Photos)    │
└──────────────┴─────────────┴──────────────┘
    ↓
Amazon SES (Email) + SNS (Notifications)
```

**Services needed:**
- ✅ All from Tier 1
- ✅ **API Gateway** - Better routing
- ✅ **Lambda** - Serverless compute
- ✅ **RDS/DocumentDB** - Managed database
- ✅ **CloudFront** - CDN
- ✅ **ElastiCache** - Session cache
- ✅ **SNS** - Push notifications

**Cost:** ~$100-200/month

---

### **Tier 3: Scale & Advanced**

Add:
- ✅ **Rekognition** - Auto photo verification
- ✅ **OpenSearch** - Advanced search
- ✅ **SageMaker** - Custom ML models for matching
- ✅ **Kinesis** - Real-time analytics
- ✅ **WAF** - Web application firewall

**Cost:** ~$300-500/month

---

## 💰 Cost Breakdown by Feature

### Feature: Photo Upload
**AWS Services:**
- S3: $5/month
- Lambda (resize): $2/month
- CloudFront: $10/month
**Total:** $17/month

---

### Feature: Email Sending
**AWS Services:**
- SES: $10/month (100k emails)
**Total:** $10/month

---

### Feature: Real-time Chat
**AWS Services:**
- API Gateway WebSocket: $5/month
- Lambda: $3/month
- DynamoDB (connection tracking): $5/month
**Total:** $13/month

---

### Feature: Push Notifications
**AWS Services:**
- SNS: $5/month
**Total:** $5/month

---

### Feature: Auto Badge Verification
**AWS Services:**
- Rekognition: $3/month
- Lambda: $2/month
**Total:** $5/month

---

## 🎯 Recommended Implementation Order

### Phase 1: MVP Launch (Week 1-2)
1. **S3** - Photo storage
2. **SES** - Email sending

**Cost:** $15-20/month
**Effort:** 8-10 hours

---

### Phase 2: Production Ready (Week 3-4)
3. **CloudFront** - CDN for photos
4. **Lambda** - Background jobs
5. **Secrets Manager** - API key management
6. **CloudWatch** - Monitoring

**Cost:** $30-40/month
**Effort:** 10-12 hours

---

### Phase 3: Enhanced (Month 2)
7. **API Gateway WebSocket** - Real-time chat
8. **SNS** - Push notifications
9. **RDS/DocumentDB** - Managed database
10. **ElastiCache** - Session cache

**Cost:** $100-150/month
**Effort:** 15-20 hours

---

### Phase 4: Advanced (Month 3+)
11. **Rekognition** - Auto verification
12. **OpenSearch** - Advanced search
13. **Cognito** - Better auth
14. **SageMaker** - ML matching

**Cost:** $200-300/month
**Effort:** 20-30 hours

---

## 📋 Quick Start Guide

### Step 1: Set up AWS Account
1. Create AWS account
2. Set up IAM user with appropriate permissions
3. Install AWS CLI: `pip install awscli`
4. Configure: `aws configure`

---

### Step 2: Create S3 Bucket
```bash
aws s3 mb s3://lits-photos
aws s3 mb s3://lits-verification

# Set CORS for web uploads
aws s3api put-bucket-cors --bucket lits-photos --cors-configuration file://cors.json
```

---

### Step 3: Set up SES
```bash
# Verify sender email
aws ses verify-email-identity --email-address noreply@lits.com

# Create email template
aws ses create-template --cli-input-json file://welcome-template.json
```

---

### Step 4: Update Backend
```python
# Update backend/server.py
import boto3

# S3 client
s3 = boto3.client('s3')

# SES client
ses = boto3.client('ses', region_name='us-east-1')

# Replace storage.py with boto3 S3 calls
```

---

## 🔧 AWS vs Alternatives

| Service | AWS Option | Alternative | Winner |
|---------|------------|-------------|--------|
| Storage | S3 | Cloudinary, Cloudflare R2 | **S3** (cheapest, most reliable) |
| Email | SES | SendGrid, Mailgun | **SES** (10x cheaper) |
| Database | RDS/DocumentDB | MongoDB Atlas | **Atlas** (easier for now) |
| Auth | Cognito | Auth0, Firebase | **Cognito** (cheaper at scale) |
| CDN | CloudFront | Cloudflare | **Cloudflare** (free tier) |
| Real-time | API Gateway WS | Pusher, Ably | **API Gateway** (pay per use) |
| Notifications | SNS | OneSignal, Firebase | **SNS** (integrated) |

---

## 💡 Best Practices

### 1. Use AWS SDK for Python (boto3)
```bash
pip install boto3
```

### 2. Store credentials in environment
```python
# Don't hardcode!
AWS_ACCESS_KEY = os.environ['AWS_ACCESS_KEY_ID']
```

### 3. Use S3 presigned URLs
```python
# Let users upload directly to S3
url = s3.generate_presigned_post(
    Bucket='lits-photos',
    Key=f'users/{user_id}/photo.jpg',
    ExpiresIn=3600
)
```

### 4. Set up CloudWatch alarms
- Alert on high error rates
- Alert on high costs
- Alert on low email deliverability

---

## 🎯 Bottom Line

**For LITS MVP (Next 2 weeks):**

✅ **Must Use:**
1. **Amazon S3** - Photo storage ($5/month)
2. **Amazon SES** - Email sending ($10/month)

⚠️ **Should Use:**
3. **CloudFront** - CDN ($10/month)
4. **Lambda** - Background jobs ($5/month)
5. **CloudWatch** - Monitoring ($10/month)

📱 **Nice to Have:**
6. API Gateway WebSocket - Real-time chat
7. SNS - Push notifications
8. Rekognition - Auto verification

**Total MVP Cost:** $40-50/month
**Time to Implement:** 15-20 hours

**Start with S3 + SES, add others as needed.**
