"""Command line inference script for VisionGuard."""

import os
import sys
import argparse
from pathlib import Path
import cv2

# Add root to pythonpath
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.detection import DefectDetector
from src.reporting import generate_json_report, generate_csv_report
from src.preprocessing import validate_image_file


def run_prediction(
    image_path: str,
    weights_path: str = "models/best.pt",
    output_dir: str = "outputs/predictions",
    report_dir: str = "outputs/reports"
):
    """Run defect inspection on a single image and save results."""
    valid, err = validate_image_file(image_path)
    if not valid:
        print(f"[ERROR] Image validation failed: {err}")
        return

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(report_dir, exist_ok=True)

    print(f"Inspecting image: {image_path} ...")
    detector = DefectDetector(model_path=weights_path)
    
    result = detector.detect(image_path)
    severity = result["severity"]
    detections = result["detections"]
    annotated = result["annotated_image"]

    # Save annotated image
    filename = Path(image_path).name
    stem = Path(image_path).stem
    out_img_path = os.path.join(output_dir, f"inspected_{filename}")
    cv2.imwrite(out_img_path, cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))

    # Save JSON and CSV reports
    json_path = os.path.join(report_dir, f"report_{stem}.json")
    with open(json_path, "w") as f:
        f.write(generate_json_report(filename, result))

    csv_path = os.path.join(report_dir, f"report_{stem}.csv")
    with open(csv_path, "w") as f:
        f.write(generate_csv_report(filename, result))

    print("=" * 60)
    print(" Inspection Complete")
    print("=" * 60)
    print(f" Status:              {severity.severity_grade.upper()}")
    print(f" Severity Score:      {severity.severity_score}/100")
    print(f" Defects Detected:    {severity.defect_count}")
    print(f" Surface Defect Area: {severity.area_percentage_total}%")
    print(f" Primary Hazard:      {severity.max_hazard_class}")
    print(f" Annotated Image:     {out_img_path}")
    print(f" Inspection Report:   {json_path}")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VisionGuard CLI Image Inspection")
    parser.add_argument("image", type=str, help="Path to input image")
    parser.add_argument("--weights", type=str, default="models/best.pt", help="Path to model weights")
    args = parser.parse_args()

    run_prediction(args.image, weights_path=args.weights)
