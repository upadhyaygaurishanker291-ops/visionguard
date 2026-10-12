"""Unit tests for image preprocessing and surface estimation."""

import os
import sys
import unittest
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.preprocessing import validate_image_file, load_and_preprocess_image, estimate_surface_area


class TestPreprocessing(unittest.TestCase):

    def setUp(self):
        self.test_img_path = "tests/temp_test_image.jpg"
        os.makedirs("tests", exist_ok=True)
        # Create a synthetic 100x100 test image
        arr = (np.random.rand(100, 100, 3) * 255).astype(np.uint8)
        Image.fromarray(arr).save(self.test_img_path)

    def tearDown(self):
        if os.path.exists(self.test_img_path):
            os.remove(self.test_img_path)

    def test_validate_image_file_valid(self):
        valid, err = validate_image_file(self.test_img_path)
        self.assertTrue(valid)
        self.assertEqual(err, "")

    def test_validate_image_file_nonexistent(self):
        valid, err = validate_image_file("non_existent_file_xyz.jpg")
        self.assertFalse(valid)
        self.assertIn("does not exist", err)

    def test_load_and_preprocess_image(self):
        rgb, letterbox, scale, padding = load_and_preprocess_image(self.test_img_path, target_size=(640, 640))
        self.assertEqual(rgb.shape, (100, 100, 3))
        self.assertEqual(letterbox.shape, (640, 640, 3))
        self.assertGreater(scale, 0)
        self.assertEqual(len(padding), 2)

    def test_estimate_surface_area(self):
        synthetic = np.full((200, 200, 3), 128, dtype=np.uint8)
        pixels, mask = estimate_surface_area(synthetic)
        self.assertGreaterEqual(pixels, 0)
        self.assertEqual(mask.shape, (200, 200))


if __name__ == "__main__":
    unittest.main()
