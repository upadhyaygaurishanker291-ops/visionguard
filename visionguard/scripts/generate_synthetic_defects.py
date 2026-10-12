"""Synthetic Defect Generator for VisionGuard.

Generates realistic industrial defect samples (scratches, cracks, dents, stains, holes)
with exact YOLO-format bounding-box annotations and provenance tracking metadata.
Distinguishes real vs synthetic data to prevent data leakage and validity overclaims.
"""

import os
import random
import json
import argparse
import numpy as np
import cv2
from PIL import Image


CLASS_MAP = {
    "Scratch": 0,
    "Crack": 1,
    "Dent": 2,
    "Stain": 3,
    "Hole": 4
}


def create_base_surface(width: int = 640, height: int = 640, surface_type: str = "metal") -> np.ndarray:
    """Generate realistic background base textures (metal, ceramic, fabric)."""
    if surface_type == "metal":
        # Brushed metal texture with directional streaks
        base = np.random.normal(160, 12, (height, width)).astype(np.float32)
        # Apply horizontal brushing filter
        kernel = np.ones((1, 15), dtype=np.float32) / 15.0
        brushed = cv2.filter2D(base, -1, kernel)
        noise = np.random.normal(0, 5, (height, width)).astype(np.float32)
        final_gray = np.clip(brushed + noise, 40, 230).astype(np.uint8)
        return cv2.cvtColor(final_gray, cv2.COLOR_GRAY2RGB)
        
    elif surface_type == "ceramic":
        # Fine matte ceramic texture
        base = np.random.normal(210, 8, (height, width)).astype(np.float32)
        blur = cv2.GaussianBlur(base, (7, 7), 0)
        noise = np.random.normal(0, 4, (height, width)).astype(np.float32)
        final_gray = np.clip(blur + noise, 100, 250).astype(np.uint8)
        return cv2.cvtColor(final_gray, cv2.COLOR_GRAY2RGB)
        
    else:  # dark steel
        base = np.random.normal(90, 10, (height, width)).astype(np.float32)
        final_gray = np.clip(base, 20, 180).astype(np.uint8)
        return cv2.cvtColor(final_gray, cv2.COLOR_GRAY2RGB)


def draw_synthetic_scratch(img: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Draw a thin linear scratch with metallic highlight."""
    h, w = img.shape[:2]
    x1 = random.randint(int(w * 0.15), int(w * 0.75))
    y1 = random.randint(int(h * 0.15), int(h * 0.75))
    length = random.randint(60, 200)
    angle = random.uniform(-0.8, 0.8)
    
    x2 = int(x1 + length * np.cos(angle))
    y2 = int(y1 + length * np.sin(angle))
    x2 = max(10, min(w - 10, x2))
    y2 = max(10, min(h - 10, y2))
    
    # Dark core scratch
    cv2.line(img, (x1, y1), (x2, y2), (40, 40, 40), thickness=random.randint(2, 4))
    # Specular white edge reflection
    cv2.line(img, (x1 + 1, y1 + 1), (x2 + 1, y2 + 1), (240, 240, 240), thickness=1)

    min_x, max_x = min(x1, x2), max(x1, x2)
    min_y, max_y = min(y1, y2), max(y1, y2)
    # Add margin for bounding box
    pad = 8
    bbox = [max(0, min_x - pad), max(0, min_y - pad), min(w, max_x + pad), min(h, max_y + pad)]
    return img, bbox


def draw_synthetic_crack(img: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Draw a jagged fracture crack with branching segments."""
    h, w = img.shape[:2]
    curr_x = random.randint(int(w * 0.2), int(w * 0.6))
    curr_y = random.randint(int(h * 0.2), int(h * 0.6))
    points = [(curr_x, curr_y)]
    
    steps = random.randint(6, 14)
    for _ in range(steps):
        curr_x += random.randint(-15, 30)
        curr_y += random.randint(10, 28)
        curr_x = max(10, min(w - 10, curr_x))
        curr_y = max(10, min(h - 10, curr_y))
        points.append((curr_x, curr_y))

    pts_arr = np.array(points, dtype=np.int32).reshape((-1, 1, 2))
    cv2.polylines(img, [pts_arr], isClosed=False, color=(25, 25, 25), thickness=random.randint(2, 4))

    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    pad = 8
    bbox = [max(0, min(xs) - pad), max(0, min(ys) - pad), min(w, max(xs) + pad), min(h, max(ys) + pad)]
    return img, bbox


def draw_synthetic_dent(img: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Draw a circular/elliptical surface depression with directional shadow & highlight."""
    h, w = img.shape[:2]
    cx = random.randint(int(w * 0.2), int(w * 0.8))
    cy = random.randint(int(h * 0.2), int(h * 0.8))
    radius_x = random.randint(20, 50)
    radius_y = random.randint(18, 45)

    overlay = img.copy()
    # Dark depression shadow
    cv2.ellipse(overlay, (cx - 2, cy - 2), (radius_x, radius_y), 0, 0, 360, (50, 50, 50), -1)
    # Glancing rim highlight
    cv2.ellipse(overlay, (cx + 4, cy + 4), (radius_x - 4, radius_y - 4), 0, 0, 360, (220, 220, 220), 2)
    
    cv2.addWeighted(overlay, 0.45, img, 0.55, 0, img)
    pad = 6
    bbox = [max(0, cx - radius_x - pad), max(0, cy - radius_y - pad),
            min(w, cx + radius_x + pad), min(h, cy + radius_y + pad)]
    return img, bbox


def draw_synthetic_stain(img: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Draw an organic fluid / oil residue blotch."""
    h, w = img.shape[:2]
    cx = random.randint(int(w * 0.25), int(w * 0.75))
    cy = random.randint(int(h * 0.25), int(h * 0.75))
    r = random.randint(25, 60)
    
    overlay = img.copy()
    # Organic irregular blob using convex hull of random points
    num_pts = random.randint(10, 16)
    pts = []
    for i in range(num_pts):
        angle = i * (2 * np.pi / num_pts)
        radius = r * random.uniform(0.7, 1.25)
        px = int(cx + radius * np.cos(angle))
        py = int(cy + radius * np.sin(angle))
        pts.append([px, py])
        
    pts = np.array(pts, dtype=np.int32)
    hull = cv2.convexHull(pts)
    cv2.fillPoly(overlay, [hull], (35, 45, 55))
    
    # Soft feathered alpha blending
    cv2.addWeighted(overlay, 0.5, img, 0.5, 0, img)
    x, y, bw, bh = cv2.boundingRect(hull)
    bbox = [max(0, x - 4), max(0, y - 4), min(w, x + bw + 4), min(h, y + bh + 4)]
    return img, bbox


def draw_synthetic_hole(img: np.ndarray) -> tuple[np.ndarray, list[float]]:
    """Draw a perforated hole defect with dark interior and burred edge."""
    h, w = img.shape[:2]
    cx = random.randint(int(w * 0.2), int(w * 0.8))
    cy = random.randint(int(h * 0.2), int(h * 0.8))
    radius = random.randint(12, 30)

    # Burred metallic ring
    cv2.circle(img, (cx, cy), radius + 2, (210, 210, 210), 2)
    # Deep dark void
    cv2.circle(img, (cx, cy), radius, (15, 15, 20), -1)

    pad = 4
    bbox = [max(0, cx - radius - pad), max(0, cy - radius - pad),
            min(w, cx + radius + pad), min(h, cy + radius + pad)]
    return img, bbox


def bbox_to_yolo(bbox: list[float], img_w: int, img_h: int) -> tuple[float, float, float, float]:
    """Convert [x1, y1, x2, y2] pixel coordinates to YOLO normalized [xc, yc, w, h]."""
    x1, y1, x2, y2 = bbox
    bw = x2 - x1
    bh = y2 - y1
    xc = x1 + (bw / 2.0)
    yc = y1 + (bh / 2.0)
    return round(xc / img_w, 6), round(yc / img_h, 6), round(bw / img_w, 6), round(bh / img_h, 6)


def generate_synthetic_dataset(
    output_dir: str = "data/synthetic",
    num_samples: int = 100,
    defect_free_ratio: float = 0.25
) -> dict:
    """Generate synthetic dataset of images with YOLO format labels.
    
    Args:
        output_dir: Folder to save generated images and annotations.
        num_samples: Number of images to generate (default: 100).
        defect_free_ratio: Fraction of images that must be defect-free (empty labels).
        
    Returns:
        Manifest summary dictionary.
    """
    images_dir = os.path.join(output_dir, "images")
    labels_dir = os.path.join(output_dir, "labels")
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(labels_dir, exist_ok=True)

    class_counts = {name: 0 for name in CLASS_MAP}
    class_counts["Defect-Free"] = 0
    records = []

    defect_drawers = {
        "Scratch": draw_synthetic_scratch,
        "Crack": draw_synthetic_crack,
        "Dent": draw_synthetic_dent,
        "Stain": draw_synthetic_stain,
        "Hole": draw_synthetic_hole
    }

    surface_types = ["metal", "ceramic", "dark_steel"]

    for i in range(num_samples):
        img_id = f"synthetic_{i+1:04d}"
        surf = random.choice(surface_types)
        img = create_base_surface(640, 640, surf)

        is_defect_free = (random.random() < defect_free_ratio)
        img_filename = f"{img_id}.jpg"
        label_filename = f"{img_id}.txt"
        
        img_path = os.path.join(images_dir, img_filename)
        label_path = os.path.join(labels_dir, label_filename)

        annotations_yolo = []
        annotations_meta = []

        if is_defect_free:
            class_counts["Defect-Free"] += 1
            # Empty annotation file for defect-free images (standard YOLO convention)
            with open(label_path, "w") as f:
                pass
        else:
            # 1 to 3 defects per defective specimen
            num_defects = random.randint(1, 2)
            for _ in range(num_defects):
                def_name = random.choice(list(defect_drawers.keys()))
                class_id = CLASS_MAP[def_name]
                img, bbox = defect_drawers[def_name](img)
                xc, yc, w_norm, h_norm = bbox_to_yolo(bbox, 640, 640)
                annotations_yolo.append(f"{class_id} {xc} {yc} {w_norm} {h_norm}")
                annotations_meta.append({
                    "class_name": def_name,
                    "class_id": class_id,
                    "bbox_pixels": bbox,
                    "bbox_yolo": [xc, yc, w_norm, h_norm]
                })
                class_counts[def_name] += 1

            with open(label_path, "w") as f:
                f.write("\n".join(annotations_yolo) + "\n")

        # Save image
        cv2.imwrite(img_path, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))

        records.append({
            "image_id": img_id,
            "filename": img_filename,
            "provenance": "synthetic",
            "surface_type": surf,
            "defect_free": is_defect_free,
            "defects": annotations_meta
        })

    manifest = {
        "dataset_name": "VisionGuard Synthetic Defect Prototype",
        "total_images": num_samples,
        "class_counts": class_counts,
        "disclaimer": (
            "Synthetic images generated using mathematical noise, brush filters, and geometric models. "
            "Suitable for prototype verification, pipeline testing, and presentation demonstrations. "
            "Does not replace real-world physical benchmark validation."
        ),
        "records": records
    }

    manifest_path = os.path.join(output_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"[OK] Generated {num_samples} synthetic images in '{output_dir}'.")
    print(f"     Class Distribution: {class_counts}")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic defects for VisionGuard")
    parser.add_argument("--count", type=int, default=60, help="Number of synthetic images")
    parser.add_argument("--output", type=str, default="data/synthetic", help="Output directory")
    args = parser.parse_args()

    generate_synthetic_dataset(output_dir=args.output, num_samples=args.count)
