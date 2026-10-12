"""Dataset acquisition helper and license documentation script for VisionGuard.

Covers publicly available defect databases:
1. NEU Surface Defect Database (Northeastern University, Steel sheet defects)
2. MVTec Anomaly Detection (MVTec AD) Dataset (Industrial inspection benchmark)
3. Kolektor Surface-Defect Dataset (KolektorSDD / KolektorSDD2)
"""

import os
import sys
import argparse
import urllib.request
import zipfile


DATASET_CATALOG = {
    "neu_surface": {
        "name": "NEU Surface Defect Database",
        "description": "Six kinds of typical surface defects of hot-rolled steel strip (crazing, inclusion, patches, pitted_surface, rolled-in_scale, scratches).",
        "license": "Academic / Non-commercial Research Use Only (Northeastern University).",
        "url_reference": "http://faculty.neu.edu.cn/yunhyan/NEU_surface_defect_database.html",
        "annotation_type": "Bounding boxes in XML/YOLO format"
    },
    "mvtec_ad": {
        "name": "MVTec Anomaly Detection (MVTec AD)",
        "description": "5354 high-resolution images across 15 categories (bottle, cable, capsule, carpet, grid, hazelnut, leather, metal_nut, pill, screw, tile, toothbrush, transistor, wood, zipper).",
        "license": "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0).",
        "url_reference": "https://www.mvtec.com/company/research/datasets/mvtec-ad",
        "annotation_type": "Pixel-accurate segmentation masks + anomaly labels"
    },
    "kolektor_sdd": {
        "name": "Kolektor Surface-Defect Dataset (KolektorSDD)",
        "description": "Images of microscopic defect fractures and cracks on electrical commutators.",
        "license": "Research Use Only (University of Ljubljana & Kolektor Group).",
        "url_reference": "https://www.vicos.si/resources/kolektorsdd/",
        "annotation_type": "Pixel-level segmentation masks"
    }
}


def print_catalog():
    print("=" * 80)
    print(" VisionGuard Public Defect Dataset Catalog & Licensing Information")
    print("=" * 80)
    for key, info in DATASET_CATALOG.items():
        print(f"\n[{key.upper()}] - {info['name']}")
        print(f"  Description:  {info['description']}")
        print(f"  License:      {info['license']}")
        print(f"  Reference:    {info['url_reference']}")
        print(f"  Annotations:  {info['annotation_type']}")
    print("\n" + "=" * 80)
    print("NOTE: Per academic terms of service, users must review and agree to each")
    print("dataset's specific non-commercial research license before downloading.")
    print("VisionGuard provides synthetic dataset generation to test immediately.")
    print("=" * 80)


def create_directory_structure(base_dir: str = "data"):
    """Create directory structure for datasets."""
    dirs = [
        os.path.join(base_dir, "raw"),
        os.path.join(base_dir, "processed", "images", "train"),
        os.path.join(base_dir, "processed", "images", "val"),
        os.path.join(base_dir, "processed", "images", "test"),
        os.path.join(base_dir, "processed", "labels", "train"),
        os.path.join(base_dir, "processed", "labels", "val"),
        os.path.join(base_dir, "processed", "labels", "test"),
        os.path.join(base_dir, "synthetic"),
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    print(f"[OK] Initialized directory structure under '{base_dir}/'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VisionGuard Dataset Manager")
    parser.add_argument("--info", action="store_true", help="Print catalog and licenses")
    parser.add_argument("--init-dirs", action="store_true", help="Initialize data directories")
    args = parser.parse_args()

    create_directory_structure()
    print_catalog()
