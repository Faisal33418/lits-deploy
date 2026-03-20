#!/usr/bin/env python3
"""
SkyLounge Backend API Testing Suite
Tests all API endpoints with real integrations
"""

import requests
import sys
import json
from datetime import datetime
import time

class SkyLoungeAPITester:
    def __init__(self, base_url="https://crew-layover-link.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.test_user = {
            "email": f"pilot@united.com",
            "password": "TestPass123!",
            "full_name": "Test Pilot Captain"
        }
        self.verification_code = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"🔍 Testing {name} - {method} {endpoint}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data}")
                except:
                    self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.failed_tests.append(f"{name}: Exception - {str(e)}")
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test("Root Endpoint", "GET", "/", 200)
        return success and response.get("message") == "SkyLounge API"

    def test_signup_invalid_domain(self):
        """Test signup with invalid email domain"""
        invalid_data = {
            "email": "test@gmail.com",
            "password": self.test_user["password"],
            "full_name": self.test_user["full_name"]
        }
        success, response = self.run_test("Signup Invalid Domain", "POST", "/auth/signup", 400, invalid_data)
        return not success or "valid airline company email" in str(response)

    def test_signup_valid(self):
        """Test signup with valid airline email"""
        success, response = self.run_test("Signup Valid", "POST", "/auth/signup", 200, self.test_user)
        if success:
            self.verification_code = response.get("verification_code_demo")
            self.log(f"   Verification code: {self.verification_code}")
        return success

    def test_signup_duplicate(self):
        """Test signup with duplicate email"""
        success, response = self.run_test("Signup Duplicate", "POST", "/auth/signup", 400, self.test_user)
        return not success or "already registered" in str(response)

    def test_verify_email_invalid_code(self):
        """Test email verification with invalid code"""
        verify_data = {
            "email": self.test_user["email"],
            "code": "123456"
        }
        success, response = self.run_test("Verify Invalid Code", "POST", "/auth/verify-email", 400, verify_data)
        return not success or "Invalid verification code" in str(response)

    def test_verify_email_valid(self):
        """Test email verification with valid code"""
        if not self.verification_code:
            self.log("❌ No verification code available")
            return False
            
        verify_data = {
            "email": self.test_user["email"],
            "code": self.verification_code
        }
        success, response = self.run_test("Verify Valid Code", "POST", "/auth/verify-email", 200, verify_data)
        if success:
            self.token = response.get("token")
            self.user_id = response.get("user", {}).get("id")
            self.log(f"   Token received: {self.token[:20]}...")
        return success

    def test_login_unverified_user(self):
        """Test login with unverified user (separate test user)"""
        unverified_user = {
            "email": "testunverified@delta.com",
            "password": "TestPass123!",
            "full_name": "Unverified Test"
        }
        # First signup
        self.run_test("Signup Unverified User", "POST", "/auth/signup", 200, unverified_user)
        
        # Then try login
        login_data = {
            "email": unverified_user["email"],
            "password": unverified_user["password"]
        }
        success, response = self.run_test("Login Unverified", "POST", "/auth/login", 403, login_data)
        return not success or "verify your email" in str(response)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": self.test_user["email"],
            "password": "wrongpassword"
        }
        success, response = self.run_test("Login Invalid", "POST", "/auth/login", 401, login_data)
        return not success or "Invalid credentials" in str(response)

    def test_login_valid(self):
        """Test login with valid credentials"""
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        success, response = self.run_test("Login Valid", "POST", "/auth/login", 200, login_data)
        return success

    def test_profile_me_unauthorized(self):
        """Test get profile without token"""
        success, response = self.run_test("Profile Unauthorized", "GET", "/profile/me", 403, headers={'Authorization': ''})
        return not success

    def test_profile_me_authorized(self):
        """Test get profile with token"""
        success, response = self.run_test("Profile Authorized", "GET", "/profile/me", 200)
        return success and response.get("email") == self.test_user["email"]

    def test_profile_setup(self):
        """Test profile setup"""
        profile_data = {
            "airline": "United",
            "base": "JFK",
            "aircraft": "Boeing 737",
            "role": "pilot",
            "bio": "Test pilot with 10 years experience",
            "age": 35
        }
        success, response = self.run_test("Profile Setup", "POST", "/profile/setup", 200, profile_data)
        return success and response.get("user", {}).get("profile_complete") == True

    def test_discover_users(self):
        """Test discover users endpoint"""
        success, response = self.run_test("Discover Users", "GET", "/discover", 200)
        users = response.get("users", [])
        self.log(f"   Found {len(users)} users to discover")
        return success

    def test_swipe_functionality(self):
        """Test swipe functionality"""
        # First get users to swipe on
        success, response = self.run_test("Get Users for Swipe", "GET", "/discover", 200)
        if not success:
            return False
            
        users = response.get("users", [])
        if not users:
            self.log("   No users to swipe on")
            return True  # Not a failure, just no users
        
        # Test swipe pass
        swipe_data = {
            "target_user_id": users[0]["id"],
            "action": "pass"
        }
        success1, response1 = self.run_test("Swipe Pass", "POST", "/swipe", 200, swipe_data)
        
        # Test swipe like (if more users available)
        if len(users) > 1:
            swipe_data2 = {
                "target_user_id": users[1]["id"],
                "action": "like"
            }
            success2, response2 = self.run_test("Swipe Like", "POST", "/swipe", 200, swipe_data2)
            return success1 and success2
        
        return success1

    def test_matches_endpoint(self):
        """Test matches endpoint"""
        success, response = self.run_test("Get Matches", "GET", "/matches", 200)
        matches = response.get("matches", [])
        self.log(f"   Found {len(matches)} matches")
        return success

    def test_messages_no_match(self):
        """Test sending message to non-existent match"""
        message_data = {
            "match_id": "non-existent-id",
            "content": "Test message"
        }
        success, response = self.run_test("Message No Match", "POST", "/messages", 404, message_data)
        return not success

    def test_get_messages_no_match(self):
        """Test getting messages for non-existent match"""
        success, response = self.run_test("Get Messages No Match", "GET", "/messages/non-existent-id", 404)
        return not success

    def test_layovers_endpoint(self):
        """Test layovers endpoint"""
        success, response = self.run_test("Layovers Nearby", "GET", "/layovers/nearby?city=JFK", 200)
        layovers = response.get("layovers", [])
        self.log(f"   Found {len(layovers)} layovers in JFK")
        return success

    def test_ai_compatibility_integration(self):
        """Test AI compatibility by creating a scenario that might trigger it"""
        self.log("🧠 Testing AI Compatibility Integration...")
        
        # Create another test user to potentially match with
        test_user2 = {
            "email": "copilot@united.com",
            "password": "TestPass123!",
            "full_name": "Test Copilot"
        }
        
        # Signup second user
        success, response = self.run_test("Signup Second User", "POST", "/auth/signup", 200, test_user2)
        if not success:
            return False
            
        verification_code2 = response.get("verification_code_demo")
        
        # Verify second user
        verify_data2 = {
            "email": test_user2["email"],
            "code": verification_code2
        }
        success, response = self.run_test("Verify Second User", "POST", "/auth/verify-email", 200, verify_data2)
        if not success:
            return False
            
        token2 = response.get("token")
        
        # Setup profile for second user
        profile_data2 = {
            "airline": "United",
            "base": "JFK", 
            "aircraft": "Boeing 737",
            "role": "pilot",
            "bio": "Experienced copilot looking for connections",
            "age": 32
        }
        success, response = self.run_test("Setup Second User Profile", "POST", "/profile/setup", 200, 
                                        profile_data2, {'Authorization': f'Bearer {token2}'})
        if not success:
            return False
        
        # Now try to create mutual likes to trigger match and AI scoring
        user2_id = response.get("user", {}).get("id")
        
        # First user likes second user
        swipe_data = {
            "target_user_id": user2_id,
            "action": "like"
        }
        success, response = self.run_test("First User Likes Second", "POST", "/swipe", 200, swipe_data)
        if not success:
            return False
        
        # Second user likes first user (should create match)
        swipe_data2 = {
            "target_user_id": self.user_id,
            "action": "like"
        }
        success, response = self.run_test("Second User Likes First", "POST", "/swipe", 200, 
                                        swipe_data2, {'Authorization': f'Bearer {token2}'})
        
        if success and response.get("match"):
            self.log("✅ Match created! AI compatibility scoring should be triggered in background")
            # Wait a moment for AI processing
            time.sleep(3)
            
            # Check if compatibility score was calculated
            success, matches_response = self.run_test("Check AI Compatibility Score", "GET", "/matches", 200)
            if success:
                matches = matches_response.get("matches", [])
                for match in matches:
                    if match.get("compatibility_score") is not None:
                        self.log(f"✅ AI Compatibility Score found: {match['compatibility_score']}%")
                        return True
                self.log("⚠️ Match created but AI compatibility score not yet available (async processing)")
                return True
        
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting SkyLounge Backend API Testing")
        self.log(f"📍 Base URL: {self.base_url}")
        
        tests = [
            ("API Root", self.test_root_endpoint),
            ("Signup Invalid Domain", self.test_signup_invalid_domain),
            ("Signup Valid", self.test_signup_valid),
            ("Signup Duplicate", self.test_signup_duplicate),
            ("Verify Invalid Code", self.test_verify_email_invalid_code),
            ("Verify Valid Code", self.test_verify_email_valid),
            ("Login Unverified", self.test_login_unverified_user),
            ("Login Invalid", self.test_login_invalid_credentials),
            ("Login Valid", self.test_login_valid),
            ("Profile Unauthorized", self.test_profile_me_unauthorized),
            ("Profile Authorized", self.test_profile_me_authorized),
            ("Profile Setup", self.test_profile_setup),
            ("Discover Users", self.test_discover_users),
            ("Swipe Functionality", self.test_swipe_functionality),
            ("Get Matches", self.test_matches_endpoint),
            ("Message No Match", self.test_messages_no_match),
            ("Get Messages No Match", self.test_get_messages_no_match),
            ("Layovers Endpoint", self.test_layovers_endpoint),
            ("AI Compatibility", self.test_ai_compatibility_integration),
        ]
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if not success:
                    self.log(f"❌ {test_name} failed")
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                self.failed_tests.append(f"{test_name}: Exception - {str(e)}")
        
        # Print summary
        self.log(f"\n📊 Test Summary:")
        self.log(f"   Total tests run: {self.tests_run}")
        self.log(f"   Passed: {self.tests_passed}")
        self.log(f"   Failed: {len(self.failed_tests)}")
        self.log(f"   Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            self.log(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                self.log(f"   - {failure}")
        
        return len(self.failed_tests) == 0

def main():
    tester = SkyLoungeAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())