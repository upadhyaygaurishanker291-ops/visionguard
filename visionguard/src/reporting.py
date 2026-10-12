"""Report generation module for VisionGuard (JSON and CSV quality inspection logs)."""

import json
import csv
import io
import time
from typing import Dict, Any, List
from src.severity import SeverityAssessment, DefectDetection


def generate_json_report(
    image_name: str,
    detection_result: Dict[str, Any],
    metadata: Dict[str, Any] = None
) -> str:
    """Generate industrial-grade JSON quality inspection record.
    
    Args:
        image_name: Filename of the inspected image.
        detection_result: Dictionary output from DefectDetector.detect().
        metadata: Optional dictionary with batch ID, operator, workstation.
        
    Returns:
        JSON string.
    """
    severity: SeverityAssessment = detection_result["severity"]
    detections: List[DefectDetection] = detection_result["detections"]
    
    report = {
        "inspection_header": {
            "system": "VisionGuard AI Defect Inspection System",
            "version": "1.0.0",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "image_filename": image_name,
            "operator_id": metadata.get("operator_id", "OPERATOR-01") if metadata else "OPERATOR-01",
            "station_id": metadata.get("station_id", "QC-LINE-A") if metadata else "QC-LINE-A"
        },
        "inspection_verdict": {
            "overall_status": severity.severity_grade,
            "severity_score": severity.severity_score,
            "score_scale": "0 to 100 (0-19: Safe, 20-49: Minor, 50-79: Moderate, 80-100: Critical)",
            "defect_count": severity.defect_count,
            "total_defect_area_pct": severity.area_percentage_total,
            "primary_hazard_type": severity.max_hazard_class,
            "disclaimer": (
                "No defect detected by the model" if severity.defect_count == 0
                else severity.confidence_disclaimer
            )
        },
        "score_decomposition": {
            "area_component": severity.area_component_score,
            "count_component": severity.count_component_score,
            "hazard_component": severity.type_component_score
        },
        "detected_defects": [
            {
                "defect_index": idx + 1,
                "class_name": d.class_name,
                "class_id": d.class_id,
                "uncalibrated_model_confidence": d.confidence,
                "bounding_box": {
                    "x1": d.bbox[0],
                    "y1": d.bbox[1],
                    "x2": d.bbox[2],
                    "y2": d.bbox[3]
                },
                "defect_area_pixels": d.area_pixels,
                "surface_area_percentage": d.area_percentage
            }
            for idx, d in enumerate(detections)
        ]
    }
    
    return json.dumps(report, indent=2)


def generate_csv_report(
    image_name: str,
    detection_result: Dict[str, Any]
) -> str:
    """Generate industrial-grade CSV inspection record.
    
    Args:
        image_name: Filename of the inspected image.
        detection_result: Output from DefectDetector.detect().
        
    Returns:
        CSV string content.
    """
    severity: SeverityAssessment = detection_result["severity"]
    detections: List[DefectDetection] = detection_result["detections"]
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Image_Name", "Timestamp", "Severity_Grade", "Severity_Score", 
        "Defect_Count", "Total_Defect_Area_Pct", "Defect_ID", 
        "Class_Name", "Model_Confidence", "BBox_X1", "BBox_Y1", "BBox_X2", "BBox_Y2", "Defect_Area_Pixels"
    ])
    
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    
    if not detections:
        writer.writerow([
            image_name, timestamp, severity.severity_grade, severity.severity_score,
            0, 0.0, "N/A", "None", 0.0, 0, 0, 0, 0, 0
        ])
    else:
        for idx, d in enumerate(detections):
            writer.writerow([
                image_name, timestamp, severity.severity_grade, severity.severity_score,
                severity.defect_count, severity.area_percentage_total, idx + 1,
                d.class_name, d.confidence, d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3], d.area_pixels
            ])
            
    return output.getvalue()
