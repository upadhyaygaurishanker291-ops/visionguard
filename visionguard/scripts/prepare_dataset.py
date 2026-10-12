"""Dataset preparation, train/val/test splitting, and data leakage prevention for VisionGuard."""

import os
import shutil
import random
import glob
from typing import Dict, List, Tuple


def prepare_dataset_splits(
    source_images_dir: str = "data/synthetic/images",
    source_labels_dir: str = "data/synthetic/labels",
    output_processed_dir: str = "data/processed",
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42
) -> Dict[str, Any]:
    """Partition dataset into train/val/test sets while enforcing zero data leakage.
    
    Ensures that identical specimens/objects never cross between training and test sets.
    """
    random.seed(seed)
    
    # Target directories
    splits = ["train", "val", "test"]
    for split in splits:
        os.makedirs(os.path.join(output_processed_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(output_processed_dir, "labels", split), exist_ok=True)

    image_files = sorted(glob.glob(os.path.join(source_images_dir, "*.*")))
    if not image_files:
        raise FileNotFoundError(f"No images found in {source_images_dir}. Run generate_synthetic_defects.py first!")

    # Group by physical object / specimen ID to prevent data leakage
    # e.g., 'sample_01_view1.jpg' and 'sample_01_view2.jpg' stay in the same split
    grouped_items: Dict[str, List[str]] = {}
    for img_path in image_files:
        basename = os.path.splitext(os.path.basename(img_path))[0]
        # Extract object stem (e.g. synthetic_0001 -> object synthetic_0001)
        object_key = basename.split("_view")[0] if "_view" in basename else basename
        grouped_items.setdefault(object_key, []).append(img_path)

    object_keys = list(grouped_items.keys())
    random.shuffle(object_keys)

    n_total = len(object_keys)
    n_train = int(n_total * train_ratio)
    n_val = int(n_total * val_ratio)

    train_objs = set(object_keys[:n_train])
    val_objs = set(object_keys[n_train:n_train + n_val])
    test_objs = set(object_keys[n_train + n_val:])

    split_counts = {"train": 0, "val": 0, "test": 0}

    for obj_key, img_paths in grouped_items.items():
        if obj_key in train_objs:
            target_split = "train"
        elif obj_key in val_objs:
            target_split = "val"
        else:
            target_split = "test"

        for img_path in img_paths:
            base_name = os.path.splitext(os.path.basename(img_path))[0]
            label_src = os.path.join(source_labels_dir, f"{base_name}.txt")

            dst_img = os.path.join(output_processed_dir, "images", target_split, os.path.basename(img_path))
            dst_label = os.path.join(output_processed_dir, "labels", target_split, f"{base_name}.txt")

            shutil.copy2(img_path, dst_img)

            if os.path.exists(label_src):
                shutil.copy2(label_src, dst_label)
            else:
                # Defect-free image empty label file
                with open(dst_label, "w") as f:
                    pass

            split_counts[target_split] += 1

    print("=" * 60)
    print(" VisionGuard Dataset Partition Completed (Zero Data Leakage)")
    print("=" * 60)
    print(f" Train Split:      {split_counts['train']} images")
    print(f" Validation Split: {split_counts['val']} images")
    print(f" Test Split:       {split_counts['test']} images")
    print(f" Output Location:  {output_processed_dir}")
    print("=" * 60)
    
    return split_counts


if __name__ == "__main__":
    prepare_dataset_splits()
