"""Unit tests for prediction outputs, metrics matching, and report generation."""

import os
import sys
import json
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.metrics import compute_iou, match_detections_to_ground_truth
from src.reporting import generate_json_report, generate_csv_report
from src.severity import SeverityAssessment, DefectDetection


class TestPredictionsAndReporting(unittest.TestCase):

    def test_compute_iou_identical(self):
        box1 = [10.0, 10.0, 50.0, 50.0]
        box2 = [10.0, 10.0, 50.0, 50.0]
        self.assertAlmostEqual(compute_iou(box1, box2), 1.0)

    def test_compute_iou_disjoint(self):
        box1 = [0.0, 0.0, 10.0, 10.0]
        box2 = [20.0, 20.0, 30.0, 30.0]
        self.assertAlmostEqual(compute_iou(box1, box2), 0.0)

    def test_compute_iou_half_overlap(self):
        box1 = [0.0, 0.0, 20.0, 10.0]  # area 200
        box2 = [10.0, 0.0, 30.0, 10.0] # area 200, intersection [10,0,20,10]=100
        # union = 200+200-100 = 300, iou = 100/300 = 0.3333
        self.assertAlmostEqual(compute_iou(box1, box2), 1.0 / 3.0, places=3)

    def test_match_detections_tp_and_fp(self):
        preds = [
            {"bbox": [10, 10, 50, 50], "class_id": 0, "confidence": 0.9},
            {"bbox": [100, 100, 120, 120], "class_id": 0, "confidence": 0.8}
        ]
        gts = [
            {"bbox": [12, 12, 48, 48], "class_id": 0}
        ]
        res = match_detections_to_ground_truth(preds, gts, iou_threshold=0.5)
        self.assertEqual(res["tp"], 1)
        self.assertEqual(res["fp"], 1)
        self.assertEqual(res["fn"], 0)
        self.assertEqual(res["precision"], 0.5)
        self.assertEqual(res["recall"], 1.0)

    def test_json_reporting(self):
        dummy_det = DefectDetection(
            class_id=0,
            class_name="Scratch",
            confidence=0.88,
            bbox=[10, 10, 50, 50],
            area_pixels=1600,
            area_percentage=1.6
        )
        dummy_sev = SeverityAssessment(
            severity_score=42.5,
            severity_grade="Minor Defect",
            area_percentage_total=1.6,
            defect_count=1,
            max_hazard_class="Scratch",
            area_component_score=16.0,
            count_component_score=20.0,
            type_component_score=45.0
        )
        detection_result = {
            "severity": dummy_sev,
            "detections": [dummy_det]
        }
        json_str = generate_json_report("test_specimen.jpg", detection_result)
        parsed = json.loads(json_str)
        self.assertEqual(parsed["inspection_verdict"]["overall_status"], "Minor Defect")
        self.assertEqual(len(parsed["detected_defects"]), 1)

    def test_csv_reporting(self):
        dummy_sev = SeverityAssessment(
            severity_score=0.0,
            severity_grade="Safe",
            area_percentage_total=0.0,
            defect_count=0,
            max_hazard_class="None",
            area_component_score=0.0,
            count_component_score=0.0,
            type_component_score=0.0
        )
        detection_result = {
            "severity": dummy_sev,
            "detections": []
        }
        csv_str = generate_csv_report("safe_specimen.jpg", detection_result)
        self.assertIn("Safe", csv_str)
        self.assertIn("safe_specimen.jpg", csv_str)


if __name__ == "__main__":
    unittest.main()
