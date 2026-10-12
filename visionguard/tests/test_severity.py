"""Unit tests for defect severity scoring and grade classification."""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.severity import calculate_severity_score, DefectDetection, DEFAULT_CLASS_HAZARD


class TestSeverity(unittest.TestCase):

    def test_zero_defects_returns_safe(self):
        res = calculate_severity_score(
            detections=[],
            surface_area_pixels=100000
        )
        self.assertEqual(res.severity_score, 0.0)
        self.assertEqual(res.severity_grade, "Safe")
        self.assertEqual(res.defect_count, 0)
        self.assertEqual(res.area_percentage_total, 0.0)

    def test_critical_crack_classification(self):
        crack = DefectDetection(
            class_id=1,
            class_name="Crack",
            confidence=0.92,
            bbox=[100, 100, 400, 400],
            area_pixels=90000,
            area_percentage=30.0
        )
        res = calculate_severity_score(
            detections=[crack],
            surface_area_pixels=300000
        )
        # Large crack should trigger Critical Defect (>= 80)
        self.assertGreaterEqual(res.severity_score, 70.0)
        self.assertIn(res.severity_grade, ["Moderate Defect", "Critical Defect"])
        self.assertEqual(res.max_hazard_class, "Crack")

    def test_minor_scratch_classification(self):
        scratch = DefectDetection(
            class_id=0,
            class_name="Scratch",
            confidence=0.45,
            bbox=[10, 10, 30, 30],
            area_pixels=400,
            area_percentage=0.1
        )
        res = calculate_severity_score(
            detections=[scratch],
            surface_area_pixels=400000
        )
        self.assertLess(res.severity_score, 50.0)
        self.assertIn(res.severity_grade, ["Safe", "Minor Defect"])

    def test_custom_weights(self):
        custom_weights = {"area_weight": 0.1, "count_weight": 0.1, "type_weight": 0.8}
        det = DefectDetection(
            class_id=1,
            class_name="Crack",
            confidence=0.8,
            bbox=[0, 0, 10, 10],
            area_pixels=100,
            area_percentage=0.01
        )
        res = calculate_severity_score(
            detections=[det],
            surface_area_pixels=100000,
            weights=custom_weights
        )
        # Heavy type weight should make it high despite tiny area
        self.assertGreater(res.severity_score, 70.0)


if __name__ == "__main__":
    unittest.main()
