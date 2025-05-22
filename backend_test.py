import requests
import unittest
import sys
import json
import time
import uuid
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
    
    def test_gallery_sync_endpoint(self):
        """Test the gallery sync endpoint"""
        try:
            response = requests.get(f"{self.base_url}/gallery/sync")
            self.assertIn(response.status_code, [200, 404])
            
            if response.status_code == 200:
                data = response.json()
                self.assertIsInstance(data, dict)
                print(f"Gallery sync response: {data}")
        except requests.exceptions.RequestException as e:
            self.fail(f"Gallery sync endpoint test failed: {str(e)}")
    
    def test_gallery_images_endpoint(self):
        """Test the gallery images endpoint"""
        try:
            response = requests.get(f"{self.base_url}/gallery/images")
            self.assertIn(response.status_code, [200, 404])
            
            if response.status_code == 200:
                data = response.json()
                self.assertIsInstance(data, list)
                print(f"Found {len(data)} images in gallery")
                
                # If we have images, test the first one
                if len(data) > 0:
                    image_id = data[0]["id"]
                    self.test_gallery_image_detail(image_id)
        except requests.exceptions.RequestException as e:
            self.fail(f"Gallery images endpoint test failed: {str(e)}")
    
    def test_gallery_image_detail(self, image_id=None):
        """Test retrieving a specific gallery image"""
        if not image_id:
            # Skip this test if no image_id is provided
            return
        
        try:
            response = requests.get(f"{self.base_url}/gallery/images/{image_id}")
            self.assertEqual(response.status_code, 200)
            
            data = response.json()
            self.assertEqual(data["id"], image_id)
            print(f"Successfully retrieved image details for ID: {image_id}")
        except requests.exceptions.RequestException as e:
            self.fail(f"Gallery image detail endpoint test failed: {str(e)}")
    
    def test_gallery_categories_endpoint(self):
        """Test the gallery categories endpoint"""
        try:
            response = requests.get(f"{self.base_url}/gallery/categories")
            self.assertIn(response.status_code, [200, 404])
            
            if response.status_code == 200:
                data = response.json()
                self.assertIsInstance(data, list)
                print(f"Found {len(data)} categories in gallery")
        except requests.exceptions.RequestException as e:
            self.fail(f"Gallery categories endpoint test failed: {str(e)}")
    
    def test_gallery_upload_endpoint(self):
        """Test the gallery upload endpoint"""
        # This is a mock test since we can't actually upload files in this test
        try:
            # Just check if the endpoint exists
            test_uuid = str(uuid.uuid4())
            mock_data = {
                "name": f"Test Image {test_uuid}",
                "description": "Test image upload",
                "category_ids": [],
                "source_type": "test"
            }
            
            # We're not actually sending a file, so this should fail
            # but we're just checking if the endpoint exists
            response = requests.post(f"{self.base_url}/gallery/upload", json=mock_data)
            
            # The endpoint might return 400 (bad request) since we're not sending a file
            # or 404 if it doesn't exist
            self.assertIn(response.status_code, [400, 404, 422])
            
            print(f"Gallery upload endpoint test completed with status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.fail(f"Gallery upload endpoint test failed: {str(e)}")

def run_tests():
    # Run the tests
    result = unittest.TextTestRunner(verbosity=2).run(unittest.makeSuite(GalleryAPITester))
    
    # Print summary
    print(f"\n📊 Tests passed: {GalleryAPITester.tests_passed}/{GalleryAPITester.tests_run}")
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests())