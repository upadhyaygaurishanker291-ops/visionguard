"""Evaluation script for VisionGuard on held-out test dataset."""

import os
import sys
import json
import time
import yaml
import argparse
from pathlib import Path
import numpy as np

try:
    from ultralytics import YOLO
    import torch
except ImportError:
    print("[ERROR] PyTorch or Ultralytics not installed.")
    sys.exit(1)


def evaluate_on_test_set(
    weights_path: str = "models/best.pt",
    config_path: str = "config.yaml",
    output_dir: str = "outputs/evaluation"
):
    """Run comprehensive evaluation on held-out test split."""
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)

    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(weights_path):
        print(f"[WARNING] Trained model '{weights_path}' not found. Using pretrained backbone 'yolov8n.pt' for baseline evaluation.")
        weights_path = "yolov8n.pt"

    print("=" * 70)
    print(" VisionGuard Model Evaluation on Held-Out Test Set")
    print("=" * 70)
    print(f" Model Weights: {weights_path}")
    print(f" Dataset Config: {cfg['dataset']['dataset_yaml']}")

    model = YOLO(weights_path)
    
    # Run official validation on the 'test' split
    t0 = time.time()
    metrics = model.val(
        data=cfg['dataset']['dataset_yaml'],
        split="test",
        imgsz=cfg['model']['imgsz'],
        conf=cfg['model']['conf_threshold'],
        iou=cfg['model']['iou_threshold'],
        plots=True,
        project=output_dir,
        name="test_results",
        exist_ok=True
    )
    eval_duration = time.time() - t0

    # Extract metrics
    mp = float(metrics.box.mp)  # mean precision
    mr = float(metrics.box.mr)  # mean recall
    map50 = float(metrics.box.map50)  # mAP@0.5
    map50_95 = float(metrics.box.map)  # mAP@0.5:0.95
    f1 = 2 * (mp * mr) / (mp + mr) if (mp + mr) > 0 else 0.0

    # Per-class metrics
    class_names = cfg['classes']['names']
    per_class = {}
    if hasattr(metrics.box, 'p') and metrics.box.p is not None:
        for idx, (p, r, ap50) in enumerate(zip(metrics.box.p, metrics.box.r, metrics.box.ap50)):
            name = class_names.get(idx, f"Class {idx}")
            f1_cls = 2 * (p * r) / (p + r) if (p + r) > 0 else 0.0
            per_class[name] = {
                "precision": round(float(p), 4),
                "recall": round(float(r), 4),
                "f1_score": round(float(f1_cls), 4),
                "mAP_50": round(float(ap50), 4)
            }

    report = {
        "evaluation_summary": {
            "model_evaluated": weights_path,
            "split": "test (held-out)",
            "mean_precision": round(mp, 4),
            "mean_recall": round(mr, 4),
            "f1_score": round(f1, 4),
            "mAP_50": round(map50, 4),
            "mAP_50_95": round(map50_95, 4),
            "total_inference_time_sec": round(eval_duration, 2),
            "avg_latency_ms_per_image": round(float(metrics.speed.get('inference', 12.0)), 2)
        },
        "per_class_metrics": per_class,
        "methodology": {
            "iou_threshold_standard": 0.5,
            "sample_size_disclaimer": (
                "Evaluation performed strictly on held-out test data. "
                "Accuracy is reflective of the tested dataset distribution. "
                "For mission-critical production lines, test size should exceed 1,000 real parts."
            )
        }
    }

    report_path = os.path.join(output_dir, "test_evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 70)
    print(" Test Evaluation Results Summary")
    print("=" * 70)
    print(f" Precision:       {mp:.4f}")
    print(f" Recall:          {mr:.4f}")
    print(f" F1-Score:        {f1:.4f}")
    print(f" mAP@0.5:         {map50:.4f}")
    print(f" mAP@0.5:0.95:    {map50_95:.4f}")
    print(f" Report Saved to: {report_path}")
    print("=" * 70)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate VisionGuard on held-out test dataset")
    parser.add_argument("--weights", type=str, default="models/best.pt")
    parser.add_argument("--config", type=str, default="config.yaml")
    args = parser.parse_args()

    evaluate_on_test_set(weights_path=args.weights, config_path=args.config)
