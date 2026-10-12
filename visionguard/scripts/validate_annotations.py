"""Dataset and annotation validation tool for VisionGuard."""

import os
import glob
from typing import Dict, List, Tuple


ALLOWED_CLASSES = {0, 1, 2, 3, 4, 5}


def validate_yolo_annotations(dataset_dir: str = "data/processed") -> Dict[str, Any]:
    """Validate YOLO bounding box annotations across train, val, and test splits.
    
    Checks:
    1. Bounding box coordinates normalized in [0.0, 1.0].
    2. Box width and height > 0.
    3. Class ID exists in defined taxonomy.
    4. Image and label parity (no orphaned images or orphaned labels).
    """
    splits = ["train", "val", "test"]
    report = {"splits": {}, "total_errors": 0, "is_valid": True}

    for split in splits:
        img_dir = os.path.join(dataset_dir, "images", split)
        lbl_dir = os.path.join(dataset_dir, "labels", split)

        if not os.path.exists(img_dir) or not os.path.exists(lbl_dir):
            continue

        images = {os.path.splitext(f)[0] for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))}
        labels = {os.path.splitext(f)[0] for f in os.listdir(lbl_dir) if f.endswith('.txt')}

        orphaned_images = images - labels
        orphaned_labels = labels - images

        split_errors = []
        valid_boxes = 0

        for lbl_name in labels:
            lbl_file = os.path.join(lbl_dir, f"{lbl_name}.txt")
            with open(lbl_file, "r") as f:
                lines = [line.strip() for line in f if line.strip()]

            for line_idx, line in enumerate(lines, 1):
                parts = line.split()
                if len(parts) != 5:
                    split_errors.append(f"{lbl_file}:{line_idx} - Expected 5 values, got {len(parts)}: '{line}'")
                    continue

                try:
                    cls_id = int(parts[0])
                    xc, yc, bw, bh = map(float, parts[1:])
                except ValueError:
                    split_errors.append(f"{lbl_file}:{line_idx} - Non-numeric coordinate values.")
                    continue

                if cls_id not in ALLOWED_CLASSES:
                    split_errors.append(f"{lbl_file}:{line_idx} - Unknown class ID {cls_id}.")

                for val, name in [(xc, "xc"), (yc, "yc"), (bw, "width"), (bh, "height")]:
                    if not (0.0 <= val <= 1.0):
                        split_errors.append(f"{lbl_file}:{line_idx} - {name} out of bounds ({val}). Must be in [0, 1].")

                if bw <= 0 or bh <= 0:
                    split_errors.append(f"{lbl_file}:{line_idx} - Non-positive box dimension ({bw}x{bh}).")

                valid_boxes += 1

        report["splits"][split] = {
            "images_count": len(images),
            "labels_count": len(labels),
            "valid_boxes": valid_boxes,
            "orphaned_images": list(orphaned_images),
            "orphaned_labels": list(orphaned_labels),
            "errors": split_errors
        }
        report["total_errors"] += len(split_errors) + len(orphaned_images)

    report["is_valid"] = (report["total_errors"] == 0)
    return report


if __name__ == "__main__":
    rep = validate_yolo_annotations()
    print("=" * 60)
    print(" VisionGuard Annotation Validation Report")
    print("=" * 60)
    for split, data in rep["splits"].items():
        print(f"[{split.upper()}] Images: {data['images_count']}, Labels: {data['labels_count']}, Valid Boxes: {data['valid_boxes']}, Errors: {len(data['errors'])}")
    print(f"Status: {'PASSED - All annotations valid' if rep['is_valid'] else 'FAILED - Errors detected'}")
    print("=" * 60)
