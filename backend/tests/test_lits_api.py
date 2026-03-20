"""
LITS (Love In The Sky) Backend API Tests
Features tested:
- Auth endpoints (signup, login, email verification)
- AWS S3 verification upload
- Admin Dashboard endpoints (pending verifications, approve/reject)
- Profile setup and management
- OAuth session exchange
"""
import pytest
import requests
import os
import uuid
import time

# Get BASE URL from environment - MUST use actual API URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Try reading from .env file
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL'):
                    BASE_URL = line.split('=')[1].strip().rstrip('/')
                    break
    except:
        pass

API = f"{BASE_URL}/api"

# Test credentials
TEST_USER_EMAIL = "testpilot@united.com"
TEST_USER_PASSWORD = "Test123!"
TEST_USER_EMAIL_2 = "flightattendant@delta.com"
TEST_USER_PASSWORD_2 = "Test123!"

# Session for tests
session = requests.Session()
session.headers.update({"Content-Type": "application/json"})


class TestHealthCheck:
    """Basic API health check tests"""
    
    def test_api_root_endpoint(self):
        """Test that API root returns correct message"""
        response = session.get(f"{API}/")
        assert response.status_code == 200, f"API root failed: {response.text}"
        data = response.json()
        assert "message" in data
        assert "LITS" in data["message"]
        print(f"✓ API root endpoint working: {data['message']}")


class TestAuthEndpoints:
    """Authentication endpoints tests"""
    
    @pytest.fixture(autouse=True)
    def setup_unique_email(self):
        """Generate unique email for signup tests"""
        self.unique_email = f"test_pilot_{uuid.uuid4().hex[:8]}@united.com"
    
    def test_signup_with_airline_email(self):
        """Test signup with valid airline email"""
        response = session.post(f"{API}/auth/signup", json={
            "email": self.unique_email,
            "password": "Test123!",
            "full_name": "Test Pilot"
        })
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        assert "verification_code_demo" in data
        assert data["email"] == self.unique_email
        print(f"✓ Signup successful for {self.unique_email}")
    
    def test_signup_rejects_non_airline_email(self):
        """Test that non-airline emails are rejected"""
        response = session.post(f"{API}/auth/signup", json={
            "email": "test@gmail.com",
            "password": "Test123!",
            "full_name": "Test User"
        })
        assert response.status_code == 400, "Should reject non-airline email"
        data = response.json()
        assert "airline" in data["detail"].lower()
        print("✓ Non-airline email correctly rejected")
    
    def test_email_verification_flow(self):
        """Test email verification with code"""
        # First signup
        signup_response = session.post(f"{API}/auth/signup", json={
            "email": self.unique_email,
            "password": "Test123!",
            "full_name": "Test Pilot"
        })
        assert signup_response.status_code == 200
        verification_code = signup_response.json()["verification_code_demo"]
        
        # Then verify
        verify_response = session.post(f"{API}/auth/verify-email", json={
            "email": self.unique_email,
            "code": verification_code
        })
        assert verify_response.status_code == 200, f"Verification failed: {verify_response.text}"
        data = verify_response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["verified"] == True
        print(f"✓ Email verification successful")
    
    def test_login_existing_user(self):
        """Test login with existing verified user"""
        response = session.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        # User may not exist - check for either success or user not found
        if response.status_code == 401:
            print("⚠ Test user not found - need to create test user first")
            pytest.skip("Test user doesn't exist")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = session.post(f"{API}/auth/login", json={
            "email": "wrong@united.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should reject invalid credentials"
        print("✓ Invalid credentials correctly rejected")


class TestVerificationUpload:
    """AWS S3 verification upload tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        # First try to login existing user
        response = session.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # If user doesn't exist, create new one
        unique_email = f"test_verify_{uuid.uuid4().hex[:8]}@delta.com"
        signup_response = session.post(f"{API}/auth/signup", json={
            "email": unique_email,
            "password": "Test123!",
            "full_name": "Test Verification User"
        })
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        code = signup_response.json()["verification_code_demo"]
        verify_response = session.post(f"{API}/auth/verify-email", json={
            "email": unique_email,
            "code": code
        })
        if verify_response.status_code != 200:
            pytest.skip("Could not verify test user")
        
        return verify_response.json()["token"]
    
    def test_verification_status_endpoint(self, auth_token):
        """Test getting verification status"""
        response = session.get(
            f"{API}/verification/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Verification status failed: {response.text}"
        data = response.json()
        assert "verification_level" in data
        assert "verification_status" in data
        print(f"✓ Verification status: level={data['verification_level']}, status={data['verification_status']}")
    
    def test_verification_upload_badge(self, auth_token):
        """Test uploading badge photo to S3"""
        # Create a test image (1x1 pixel PNG)
        import base64
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test_badge.png', test_image, 'image/png')
        }
        
        response = requests.post(
            f"{API}/verification/upload?verification_type=badge",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert response.status_code == 200, f"Badge upload failed: {response.text}"
        data = response.json()
        assert data["status"] == "pending"
        assert "photo_url" in data
        assert "lits/verification" in data["photo_url"]
        print(f"✓ Badge uploaded to S3: {data['photo_url']}")
    
    def test_verification_upload_invalid_type(self, auth_token):
        """Test upload with invalid verification type"""
        import base64
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test.png', test_image, 'image/png')
        }
        
        response = requests.post(
            f"{API}/verification/upload?verification_type=invalid",
            headers={"Authorization": f"Bearer {auth_token}"},
            files=files
        )
        
        assert response.status_code == 400, "Should reject invalid verification type"
        print("✓ Invalid verification type correctly rejected")


class TestAdminDashboard:
    """Admin Dashboard endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = session.post(f"{API}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # Create a new user if test user doesn't exist
        unique_email = f"test_admin_{uuid.uuid4().hex[:8]}@united.com"
        signup_response = session.post(f"{API}/auth/signup", json={
            "email": unique_email,
            "password": "Test123!",
            "full_name": "Test Admin"
        })
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        code = signup_response.json()["verification_code_demo"]
        verify_response = session.post(f"{API}/auth/verify-email", json={
            "email": unique_email,
            "code": code
        })
        return verify_response.json()["token"]
    
    def test_get_pending_verifications(self, auth_token):
        """Test fetching pending verification requests"""
        response = session.get(
            f"{API}/verification/admin/pending",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get pending failed: {response.text}"
        data = response.json()
        assert "pending_requests" in data
        assert isinstance(data["pending_requests"], list)
        print(f"✓ Pending verifications: {len(data['pending_requests'])} requests")
    
    def test_admin_review_approve(self, auth_token):
        """Test approving a verification request"""
        # First get pending requests
        pending_response = session.get(
            f"{API}/verification/admin/pending",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if pending_response.status_code != 200:
            pytest.skip("Could not get pending requests")
        
        pending_data = pending_response.json()
        if not pending_data["pending_requests"]:
            print("⚠ No pending requests to approve")
            pytest.skip("No pending verification requests")
        
        # Approve the first pending request
        user_id = pending_data["pending_requests"][0]["user_id"]
        response = session.post(
            f"{API}/verification/admin/review",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "user_id": user_id,
                "approved": True
            }
        )
        
        assert response.status_code == 200, f"Approve failed: {response.text}"
        data = response.json()
        assert "approved" in data["message"].lower()
        print(f"✓ Verification approved for user: {user_id}")
    
    def test_admin_review_reject(self, auth_token):
        """Test rejecting a verification request"""
        # First get pending requests
        pending_response = session.get(
            f"{API}/verification/admin/pending",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        pending_data = pending_response.json()
        if not pending_data["pending_requests"]:
            print("⚠ No pending requests to reject")
            pytest.skip("No pending verification requests")
        
        # Reject the first pending request
        user_id = pending_data["pending_requests"][0]["user_id"]
        response = session.post(
            f"{API}/verification/admin/review",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "user_id": user_id,
                "approved": False,
                "reason": "Test rejection - photo quality insufficient"
            }
        )
        
        assert response.status_code == 200, f"Reject failed: {response.text}"
        data = response.json()
        assert "rejected" in data["message"].lower()
        print(f"✓ Verification rejected for user: {user_id}")
    
    def test_get_presigned_url(self, auth_token):
        """Test getting presigned URL for verification photo"""
        # First get pending requests to get a photo path
        pending_response = session.get(
            f"{API}/verification/admin/pending",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        pending_data = pending_response.json()
        if not pending_data["pending_requests"]:
            print("⚠ No pending requests with photos")
            pytest.skip("No pending verification requests")
        
        photo_path = pending_data["pending_requests"][0]["photo_url"]
        
        response = session.get(
            f"{API}/verification/photo/{photo_path}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Get presigned URL failed: {response.text}"
        data = response.json()
        assert "url" in data
        assert "s3" in data["url"].lower() or "amazonaws" in data["url"]
        print(f"✓ Presigned URL generated successfully")


class TestProfileSetup:
    """Profile setup endpoint tests"""
    
    @pytest.fixture
    def auth_token_and_user(self):
        """Create a new user and return token"""
        unique_email = f"test_profile_{uuid.uuid4().hex[:8]}@southwest.com"
        
        signup_response = session.post(f"{API}/auth/signup", json={
            "email": unique_email,
            "password": "Test123!",
            "full_name": "Test Profile User"
        })
        
        if signup_response.status_code != 200:
            pytest.skip("Could not create test user")
        
        code = signup_response.json()["verification_code_demo"]
        verify_response = session.post(f"{API}/auth/verify-email", json={
            "email": unique_email,
            "code": code
        })
        
        if verify_response.status_code != 200:
            pytest.skip("Could not verify test user")
        
        return verify_response.json()["token"], verify_response.json()["user"]
    
    def test_profile_setup(self, auth_token_and_user):
        """Test setting up user profile"""
        token, user = auth_token_and_user
        
        profile_data = {
            "airline": "Southwest",
            "base": "DAL",
            "role": "pilot",
            "bio": "Test bio for pilot",
            "age": 35,
            "photos": [],
            "preferences": {"min_age": 25, "max_age": 45}
        }
        
        response = session.post(
            f"{API}/profile/setup",
            headers={"Authorization": f"Bearer {token}"},
            json=profile_data
        )
        
        assert response.status_code == 200, f"Profile setup failed: {response.text}"
        data = response.json()
        assert data["user"]["profile_complete"] == True
        assert data["user"]["airline"] == "Southwest"
        assert data["user"]["role"] == "pilot"
        print(f"✓ Profile setup successful")
    
    def test_get_profile(self, auth_token_and_user):
        """Test getting user profile"""
        token, _ = auth_token_and_user
        
        response = session.get(
            f"{API}/profile/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        assert "email" in data
        assert "id" in data
        print(f"✓ Profile retrieved: {data['email']}")


class TestOAuthSession:
    """OAuth session exchange tests"""
    
    def test_session_exchange_invalid_session(self):
        """Test session exchange with invalid session ID"""
        response = session.post(f"{API}/auth/session", json={
            "session_id": "invalid_session_id"
        })
        
        assert response.status_code == 400, "Should reject invalid session"
        print("✓ Invalid session correctly rejected")
    
    def test_auth_me_no_token(self):
        """Test /auth/me without token"""
        response = session.get(f"{API}/auth/me")
        assert response.status_code == 401, "Should reject unauthenticated request"
        print("✓ Unauthenticated request correctly rejected")


class TestSubscriptionEndpoints:
    """Subscription pricing and upgrade tests"""
    
    def test_get_pricing(self):
        """Test getting subscription pricing tiers"""
        response = session.get(f"{API}/subscription/pricing")
        assert response.status_code == 200, f"Get pricing failed: {response.text}"
        data = response.json()
        assert "tiers" in data
        assert len(data["tiers"]) == 4  # free, cruising_altitude, first_class, captains_choice
        
        tier_ids = [t["id"] for t in data["tiers"]]
        assert "free" in tier_ids
        assert "cruising_altitude" in tier_ids
        assert "first_class" in tier_ids
        assert "captains_choice" in tier_ids
        print(f"✓ Subscription pricing: {len(data['tiers'])} tiers available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
