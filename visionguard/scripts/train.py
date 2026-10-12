"""Model training pipeline for VisionGuard with YOLOv8 transfer learning."""

import os
import sys
import yaml
import argparse
from pathlib import Path

try:
    from ultralytics import YOLO
    import torch
except ImportError:
    print("[ERROR] PyTorch or Ultralytics not installed. Install via 'pip install ultralytics torch torchvision'")
    sys.exit(1)


def load_config(config_path: str = "config.yaml") -> dict:
    """Load configuration YAML file."""
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def train_defect_detector(
    config_path: str = "config.yaml",
    resume: bool = False,
    override_epochs: int = None
):
    """Execute model training on the defect dataset.
    
    Args:
        config_path: Path to config.yaml.
        resume: Whether to resume from last checkpoint.
        override_epochs: Optional command line override for number of epochs.
    """
    cfg = load_config(config_path)
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("=" * 70)
    print(" VisionGuard Defect Detection Training Pipeline")
    print("=" * 70)
    print(f" Compute Device:  {device.upper()} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'System CPU'})")
    print(f" Dataset Config:  {cfg['dataset']['dataset_yaml']}")
    print(f" Pretrained Base: {cfg['model']['architecture']}")
    
    epochs = override_epochs if override_epochs is not None else cfg['training']['epochs']
    batch_size = cfg['training']['batch_size']
    img_size = cfg['model']['imgsz']
    lr0 = cfg['training']['lr0']
    patience = cfg['training']['patience']
    optimizer = cfg['training']['optimizer']
    output_dir = cfg['training']['output_dir']

    os.makedirs("models", exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    if resume:
        last_ckpt = Path(output_dir) / "weights" / "last.pt"
        if not last_ckpt.exists():
            raise FileNotFoundError(f"Checkpoint for resume not found at {last_ckpt}")
        print(f" Resuming from:   {last_ckpt}")
        model = YOLO(str(last_ckpt))
        results = model.train(resume=True)
    else:
        # Transfer learning from pretrained backbone
        base_model_name = cfg['model']['architecture']
        print(f" Loading backbone: {base_model_name}")
        model = YOLO(base_model_name)

        # Train model
        results = model.train(
            data=cfg['dataset']['dataset_yaml'],
            epochs=epochs,
            batch=batch_size,
            imgsz=img_size,
            lr0=lr0,
            optimizer=optimizer,
            patience=patience,
            device=device,
            project="models",
            name="defect_model",
            exist_ok=True,
            verbose=True,
            val=True,
            plots=True
        )

    # Copy best weights to models/best.pt for easy reference
    best_source = Path("models/defect_model/weights/best.pt")
    if best_source.exists():
        import shutil
        shutil.copy2(best_source, "models/best.pt")
        print(f"\n[SUCCESS] Best model weights exported to models/best.pt")
    
    print("\n" + "=" * 70)
    print(" Training Finished Successfully!")
    print(" Training logs, loss curves, and PR charts saved to: models/defect_model/")
    print("=" * 70)
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train VisionGuard YOLO model")
    parser.add_argument("--config", type=str, default="config.yaml", help="Path to config.yaml")
    parser.add_argument("--epochs", type=int, default=None, help="Override epochs count")
    parser.add_argument("--resume", action="store_true", help="Resume interrupted training")
    args = parser.parse_args()

    train_defect_detector(config_path=args.config, resume=args.resume, override_epochs=args.epochs)
