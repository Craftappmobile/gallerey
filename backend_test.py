import requests
import unittest
import sys
import json
import time
from datetime import datetime

class GalleryAPITester(unittest.TestCase):
    base_url = "https://e58f9837-0d74-410b-8b57-dfe3f91ff1d2.preview.emergentagent.com/api"
    tests_run = 0
    tests_passed = 0

    def setUp(self):
        # Setup for each test
        GalleryAPITester.tests_run += 1
        print(f"\n🔍 Running test: {self._testMethodName}")

    def tearDown(self):
        # Cleanup after each test
        if self._outcome.success:
            GalleryAPITester.tests_passed += 1
            print(f"✅ Test passed: {self._testMethodName}")
        else:
            print(f"❌ Test failed: {self._testMethodName}")

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Hello World")

    def test_status_endpoint_post(self):
        """Test creating a status check"""
        client_name = f"test_client_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        payload = {"client_name": client_name}
        
        response = requests.post(f"{self.base_url}/status", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["client_name"], client_name)
        self.assertTrue("id" in data)
        self.assertTrue("timestamp" in data)
        
        # Store the ID for the next test
        self.status_id = data["id"]

    def test_status_endpoint_get(self):
        """Test retrieving status checks"""
        response = requests.get(f"{self.base_url}/status")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # If we created a status in the previous test, check if it's in the list
        if hasattr(self, 'status_id'):
            status_ids = [item["id"] for item in data]
            self.assertIn(self.status_id, status_ids)

def run_tests():
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(unittest.makeSuite(GalleryAPITester))
    
    # Print summary
    print(f"\n📊 Tests passed: {GalleryAPITester.tests_passed}/{GalleryAPITester.tests_run}")
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests())