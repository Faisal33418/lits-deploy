# 🔧 AWS Automated Setup Guide

## ✅ What I CAN Set Up Automatically

If you provide AWS credentials, I can configure:

### 1. **Amazon S3** ✅ FULLY AUTOMATED
- ✅ Create buckets (`lits-photos`, `lits-verification`)
- ✅ Set bucket policies and permissions
- ✅ Configure CORS for web uploads
- ✅ Set up lifecycle rules (auto-delete old files)
- ✅ Enable versioning
- ✅ Configure encryption

**Commands I'll run:**
```bash
aws s3 mb s3://lits-photos
aws s3 mb s3://lits-verification
aws s3api put-bucket-cors --bucket lits-photos --cors-configuration file://cors.json
aws s3api put-bucket-policy --bucket lits-photos --policy file://policy.json
```

---

### 2. **Amazon SES** ⚠️ SEMI-AUTOMATED
- ✅ Configure SES in region
- ✅ Create email templates
- ✅ Set up DKIM
- ❌ **YOU MUST:** Click verification link in email (AWS sends it)
- ❌ **YOU MUST:** Request production access (manual approval)

**What I'll do:**
```bash
aws ses verify-email-identity --email-address noreply@lits.com
# AWS will email you - YOU must click the link
```

**What you do:**
1. Check email inbox for verification link
2. Click to verify
3. Request production access in AWS Console (initially 200 emails/day limit)

---

### 3. **IAM Roles & Policies** ✅ FULLY AUTOMATED
- ✅ Create service roles
- ✅ Set up Lambda execution roles
- ✅ Configure S3 access policies
- ✅ Set up least-privilege permissions

---

### 4. **AWS Lambda Functions** ✅ FULLY AUTOMATED
- ✅ Create functions
- ✅ Upload code
- ✅ Set environment variables
- ✅ Configure triggers
- ✅ Set memory/timeout

---

### 5. **CloudFront CDN** ✅ FULLY AUTOMATED
- ✅ Create distribution
- ✅ Point to S3 bucket
- ✅ Configure caching
- ✅ Set up SSL certificate

---

### 6. **CloudWatch** ✅ FULLY AUTOMATED
- ✅ Create log groups
- ✅ Set up alarms
- ✅ Configure metrics
- ✅ Create dashboards

---

### 7. **API Gateway** ✅ FULLY AUTOMATED
- ✅ Create REST API
- ✅ Create WebSocket API
- ✅ Configure routes
- ✅ Deploy stages

---

### 8. **SNS** ✅ FULLY AUTOMATED
- ✅ Create topics
- ✅ Set up subscriptions
- ✅ Configure endpoints

---

### 9. **Secrets Manager** ✅ FULLY AUTOMATED
- ✅ Store API keys
- ✅ Configure rotation
- ✅ Set permissions

---

### 10. **Update Backend Code** ✅ FULLY AUTOMATED
- ✅ Install boto3
- ✅ Replace storage.py with S3
- ✅ Add SES email sending
- ✅ Configure all AWS integrations
- ✅ Update environment variables

---

## ⚠️ What You MUST Do Manually

### 1. **Create AWS Account** (If you don't have one)
- Go to aws.amazon.com
- Sign up (requires credit card)
- Verify email/phone

### 2. **Create IAM User for Me** (IMPORTANT!)
**DO NOT give me your root account password!**

Instead:
1. Log into AWS Console
2. Go to IAM → Users → Create User
3. Name: `lits-setup-bot`
4. Enable "Access key - Programmatic access"
5. Attach policy: `AdministratorAccess` (or custom policy below)
6. Save Access Key ID and Secret Access Key
7. Give me those keys (NOT root password)

**Custom Policy (More Secure):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "ses:*",
        "lambda:*",
        "cloudfront:*",
        "cloudwatch:*",
        "iam:*",
        "apigateway:*",
        "sns:*",
        "secretsmanager:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. **Verify SES Email** (Click link in email)
After I run the command, AWS will email you. Click the verification link.

### 4. **Request SES Production Access**
- Go to AWS Console → SES → Account Dashboard
- Click "Request production access"
- Fill form (takes 24 hours for approval)

---

## 🔐 What Credentials I Need

### Option 1: IAM Access Keys (RECOMMENDED)
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xyz123...
AWS_DEFAULT_REGION=us-east-1
```

**Give me these in the chat, and I'll:**
1. Configure AWS CLI
2. Run all setup commands
3. Test everything
4. Delete credentials after setup

### Option 2: Temporary Credentials (MOST SECURE)
Generate temporary credentials (valid 1 hour):
```bash
aws sts get-session-token --duration-seconds 3600
```
Give me the temporary credentials - they expire automatically.

---

## 🚀 What I'll Do Step-by-Step

### Step 1: Verify Credentials
```bash
aws sts get-caller-identity
# Confirms credentials work
```

### Step 2: Create S3 Buckets
```bash
aws s3 mb s3://lits-photos-prod --region us-east-1
aws s3 mb s3://lits-verification-prod --region us-east-1
```

### Step 3: Configure S3 CORS
```bash
aws s3api put-bucket-cors --bucket lits-photos-prod --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }]
}'
```

### Step 4: Set Up SES
```bash
aws ses verify-email-identity --email-address noreply@lits.com
# You'll get verification email - click link!
```

### Step 5: Create IAM Roles
```bash
aws iam create-role --role-name lits-lambda-role --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name lits-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Step 6: Update Backend Code
```bash
pip install boto3
# Update storage.py to use S3
# Update email sending to use SES
# Add environment variables
```

### Step 7: Test Everything
```bash
# Upload test photo to S3
# Send test email via SES
# Verify all services working
```

### Step 8: Clean Up
```bash
# Remove my access (you can delete the IAM user after)
```

---

## ✅ Complete Setup Checklist

**Before starting (You do):**
- [ ] Create AWS account (if needed)
- [ ] Add payment method
- [ ] Create IAM user `lits-setup-bot`
- [ ] Generate access keys
- [ ] Share keys with me securely

**During setup (I do):**
- [ ] Configure AWS CLI
- [ ] Create S3 buckets
- [ ] Set up SES (you verify email)
- [ ] Create IAM roles
- [ ] Set up CloudFront (optional)
- [ ] Create Lambda functions (optional)
- [ ] Update backend code
- [ ] Test all integrations
- [ ] Document everything

**After setup (You do):**
- [ ] Click SES verification email link
- [ ] Request SES production access
- [ ] Review AWS costs/billing alerts
- [ ] Delete my IAM user (revoke access)
- [ ] Change any shared passwords

---

## 💰 Expected Costs

**Setup Process:** $0 (free tier)
**Monthly Ongoing:**
- S3: $5-10
- SES: $10
- CloudFront: $10 (optional)
- Lambda: $2-5 (optional)

**Total:** $15-35/month

---

## 🔒 Security Best Practices

### ✅ DO:
- Create IAM user (not root)
- Use access keys (not passwords)
- Enable MFA on root account
- Set up billing alerts
- Review IAM policies
- Rotate keys after setup
- Use least-privilege permissions

### ❌ DON'T:
- Share root account password
- Give console access
- Use long-lived credentials
- Skip billing alerts
- Leave unused resources running

---

## ⏱️ Time Estimate

**If you give me credentials:**
- S3 setup: 10 minutes
- SES setup: 5 minutes (+ you click email)
- IAM setup: 10 minutes
- Backend update: 30 minutes
- Testing: 15 minutes

**Total: 1-1.5 hours**

---

## 📋 What I Need From You

1. **AWS Access Credentials:**
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_DEFAULT_REGION=us-east-1
   ```

2. **Your preferred email for SES:**
   ```
   noreply@lits.com
   ```

3. **Your LITS domain (if you have one):**
   ```
   lits.com
   ```

4. **Confirmation:**
   - You'll click the SES verification email
   - You'll request SES production access
   - You'll revoke my access after setup

---

## 🎯 What We'll Achieve

**After I'm done:**
✅ Profile photos working (S3)
✅ Email verification working (SES)
✅ Fast photo delivery (CloudFront optional)
✅ Secure credential storage (Secrets Manager)
✅ Monitoring and alerts (CloudWatch)
✅ Production-ready infrastructure
✅ Cost-optimized setup
✅ Documented and tested

**You'll have:**
- Working photo uploads
- Real email sending
- AWS best practices
- ~70% cheaper than alternatives
- Scalable infrastructure

---

## 🚨 Important Notes

1. **I will see your AWS account** - I'll have access during setup
2. **Revoke my access after** - Delete the IAM user when done
3. **Don't share root password** - Only IAM access keys
4. **Review billing** - Set up billing alerts before we start
5. **Trust but verify** - Review what I do (I'll explain each step)

---

## ✅ Ready to Start?

**Share with me:**
1. AWS Access Key ID
2. AWS Secret Access Key  
3. Preferred AWS region (us-east-1 recommended)
4. Email address for SES

**I'll set up:**
- S3 (photos)
- SES (emails)
- IAM (security)
- CloudWatch (monitoring)
- Update code
- Test everything

**Time:** 1-1.5 hours
**Cost:** $0 setup, ~$15-35/month ongoing

Let me know when you're ready! 🚀
