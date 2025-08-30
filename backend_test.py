#!/usr/bin/env python3
"""
Kriptogram Backend API Test Suite
Tests all cryptogram-related endpoints and functionality
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://puzzledayi-levels.preview.emergentagent.com/api"
TEST_USER_ID = str(uuid.uuid4())

class KriptogramAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_user_id = TEST_USER_ID
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_basic_connection(self):
        """Test 1: Basic API Connection - GET /api/"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Basic API Connection", True, "API endpoint is accessible")
                    return True
                else:
                    self.log_test("Basic API Connection", False, "Unexpected response format", data)
                    return False
            else:
                self.log_test("Basic API Connection", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Basic API Connection", False, f"Connection error: {str(e)}")
            return False
    
    def test_level_initialization(self):
        """Test 2: Kriptogram Level Initialization - POST /api/cryptogram/init-levels"""
        try:
            response = self.session.post(f"{self.base_url}/cryptogram/init-levels")
            if response.status_code == 200:
                data = response.json()
                if "count" in data:
                    count = data.get("count", 0)
                    if count == 40:
                        self.log_test("Level Initialization", True, f"Successfully initialized {count} levels")
                        return True
                    elif count > 0:
                        self.log_test("Level Initialization", True, f"Levels already exist ({count} levels)")
                        return True
                    else:
                        self.log_test("Level Initialization", False, "No levels created", data)
                        return False
                else:
                    self.log_test("Level Initialization", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Level Initialization", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Level Initialization", False, f"Request error: {str(e)}")
            return False
    
    def test_level_listing(self):
        """Test 3: Level Listing - GET /api/cryptogram/levels"""
        try:
            response = self.session.get(f"{self.base_url}/cryptogram/levels")
            if response.status_code == 200:
                levels = response.json()
                if isinstance(levels, list) and len(levels) == 40:
                    # Verify difficulty distribution
                    easy_count = sum(1 for level in levels if level.get("difficulty") == "easy" and 1 <= level.get("level", 0) <= 10)
                    medium_count = sum(1 for level in levels if level.get("difficulty") == "medium" and 11 <= level.get("level", 0) <= 20)
                    hard_count = sum(1 for level in levels if level.get("difficulty") == "hard" and 21 <= level.get("level", 0) <= 30)
                    expert_count = sum(1 for level in levels if level.get("difficulty") == "expert" and 31 <= level.get("level", 0) <= 40)
                    
                    if easy_count == 10 and medium_count == 10 and hard_count == 10 and expert_count == 10:
                        self.log_test("Level Listing", True, f"Retrieved 40 levels with correct difficulty distribution")
                        return levels
                    else:
                        self.log_test("Level Listing", False, f"Incorrect difficulty distribution: easy={easy_count}, medium={medium_count}, hard={hard_count}, expert={expert_count}")
                        return None
                else:
                    self.log_test("Level Listing", False, f"Expected 40 levels, got {len(levels) if isinstance(levels, list) else 'invalid format'}")
                    return None
            else:
                self.log_test("Level Listing", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Level Listing", False, f"Request error: {str(e)}")
            return None
    
    def test_specific_level(self, level_num=1):
        """Test 4: Specific Level - GET /api/cryptogram/level/{level_num}"""
        try:
            response = self.session.get(f"{self.base_url}/cryptogram/level/{level_num}")
            if response.status_code == 200:
                level = response.json()
                required_fields = ["level", "difficulty", "original_text", "encrypted_text", "cipher_map", "hint", "time_limit"]
                missing_fields = [field for field in required_fields if field not in level]
                
                if not missing_fields:
                    # Verify time limits based on difficulty
                    expected_time_limits = {
                        "easy": 300,    # 5 minutes
                        "medium": 450,  # 7.5 minutes
                        "hard": 600,    # 10 minutes
                        "expert": 900   # 15 minutes
                    }
                    
                    difficulty = level.get("difficulty")
                    time_limit = level.get("time_limit")
                    expected_time = expected_time_limits.get(difficulty)
                    
                    if time_limit == expected_time:
                        # Verify Turkish content
                        original_text = level.get("original_text", "")
                        if original_text and any(char in "ÇĞIİÖŞÜ" for char in original_text):
                            self.log_test("Specific Level", True, f"Level {level_num} has correct structure, time limit ({time_limit}s), and Turkish content")
                            return level
                        else:
                            self.log_test("Specific Level", False, f"Level {level_num} missing Turkish characters in content")
                            return None
                    else:
                        self.log_test("Specific Level", False, f"Level {level_num} incorrect time limit: expected {expected_time}s, got {time_limit}s")
                        return None
                else:
                    self.log_test("Specific Level", False, f"Level {level_num} missing fields: {missing_fields}")
                    return None
            else:
                self.log_test("Specific Level", False, f"HTTP {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_test("Specific Level", False, f"Request error: {str(e)}")
            return None
    
    def test_solution_check(self, level_data):
        """Test 5: Solution Check - POST /api/cryptogram/check-solution"""
        if not level_data:
            self.log_test("Solution Check", False, "No level data provided for testing")
            return False
            
        try:
            level_num = level_data.get("level")
            correct_cipher_map = level_data.get("cipher_map", {})
            
            # Test with correct solution
            correct_payload = {
                "level": level_num,
                "solution": correct_cipher_map
            }
            
            response = self.session.post(f"{self.base_url}/cryptogram/check-solution", json=correct_payload)
            if response.status_code == 200:
                result = response.json()
                if result.get("is_correct") == True:
                    self.log_test("Solution Check (Correct)", True, f"Correctly identified valid solution for level {level_num}")
                    
                    # Test with incorrect solution
                    incorrect_cipher_map = {k: "X" for k in correct_cipher_map.keys()}
                    incorrect_payload = {
                        "level": level_num,
                        "solution": incorrect_cipher_map
                    }
                    
                    response2 = self.session.post(f"{self.base_url}/cryptogram/check-solution", json=incorrect_payload)
                    if response2.status_code == 200:
                        result2 = response2.json()
                        if result2.get("is_correct") == False and "correct_mapping" in result2:
                            self.log_test("Solution Check (Incorrect)", True, f"Correctly identified invalid solution and provided correct mapping")
                            return True
                        else:
                            self.log_test("Solution Check (Incorrect)", False, f"Failed to handle incorrect solution properly", result2)
                            return False
                    else:
                        self.log_test("Solution Check (Incorrect)", False, f"HTTP {response2.status_code}", response2.text)
                        return False
                else:
                    self.log_test("Solution Check (Correct)", False, f"Failed to identify correct solution", result)
                    return False
            else:
                self.log_test("Solution Check", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Solution Check", False, f"Request error: {str(e)}")
            return False
    
    def test_progress_tracking(self):
        """Test 6: Progress Tracking - POST /api/cryptogram/progress"""
        try:
            # Create test progress data
            progress_data = {
                "user_id": self.test_user_id,
                "level": 1,
                "is_completed": False,
                "current_solution": {"A": "B", "B": "C"},
                "hints_used": 1
            }
            
            response = self.session.post(f"{self.base_url}/cryptogram/progress", json=progress_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    self.log_test("Progress Tracking", True, f"Successfully saved progress for user {self.test_user_id}")
                    return True
                else:
                    self.log_test("Progress Tracking", False, f"Unexpected response format", result)
                    return False
            else:
                self.log_test("Progress Tracking", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Progress Tracking", False, f"Request error: {str(e)}")
            return False
    
    def test_progress_retrieval(self):
        """Test 7: Progress Retrieval - GET /api/cryptogram/progress/{user_id}"""
        try:
            response = self.session.get(f"{self.base_url}/cryptogram/progress/{self.test_user_id}")
            if response.status_code == 200:
                progress_list = response.json()
                if isinstance(progress_list, list):
                    if len(progress_list) > 0:
                        # Verify the progress we just saved
                        found_progress = any(p.get("user_id") == self.test_user_id and p.get("level") == 1 for p in progress_list)
                        if found_progress:
                            self.log_test("Progress Retrieval", True, f"Successfully retrieved progress for user {self.test_user_id}")
                            return True
                        else:
                            self.log_test("Progress Retrieval", False, f"Could not find expected progress data")
                            return False
                    else:
                        self.log_test("Progress Retrieval", True, f"No progress found for user {self.test_user_id} (empty list is valid)")
                        return True
                else:
                    self.log_test("Progress Retrieval", False, f"Expected list, got {type(progress_list)}")
                    return False
            else:
                self.log_test("Progress Retrieval", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Progress Retrieval", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Kriptogram Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Test User ID: {self.test_user_id}")
        print("=" * 60)
        
        # Test 1: Basic Connection
        if not self.test_basic_connection():
            print("❌ Basic connection failed. Stopping tests.")
            return False
        
        # Test 2: Level Initialization
        self.test_level_initialization()
        
        # Test 3: Level Listing
        levels = self.test_level_listing()
        
        # Test 4: Specific Level
        level_data = self.test_specific_level(1)
        
        # Test 5: Solution Check
        if level_data:
            self.test_solution_check(level_data)
        
        # Test 6: Progress Tracking
        self.test_progress_tracking()
        
        # Test 7: Progress Retrieval
        self.test_progress_retrieval()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        print("=" * 60)
        print(f"📈 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Kriptogram backend is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed. Please check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = KriptogramAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()