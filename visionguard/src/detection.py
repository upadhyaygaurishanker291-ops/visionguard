"""Inference and defect detection localization engine for VisionGuard."""

import os
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import cv2
from PIL import Image

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

from src.preprocessing import load_and_preprocess_image, estimate_surface_area
from src.severity import DefectDetection, calculate_severity_score, SeverityAssessment


DEFAULT_CLASSES = {
    0: "Scratch",
    1: "Crack",
    2: "Dent",
    3: "Stain",
    4: "Hole",
    5: "Other Defect"
}

CLASS_BGR_COLORS = {
    0: (68, 68, 239),     # Scratch: Reddish
    1: (22, 115, 249),    # Crack: Orange
    2: (8, 179, 234),     # Dent: Amber/Yellow
    3: (246, 130, 59),    # Stain: Blue
    4: (247, 85, 168),    # Hole: Purple
    5: (128, 114, 107)    # Other: Gray
}


class DefectDetector:
    """VisionGuard Defect Detection model wrapper."""

    def __init__(
        self,
        model_path: Optional[str] = "models/best.pt",
        class_names: Optional[Dict[int, str]] = None,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: str = "cpu"
    ):
        """Initialize the detector.
        
        Args:
            model_path: Path to PyTorch model weights (.pt).
            class_names: Mapping of class index to defect label.
            conf_threshold: Confidence threshold for bounding boxes.
            iou_threshold: NMS intersection-over-union threshold.
            device: 'cuda' or 'cpu'.
        """
        self.model_path = model_path
        self.class_names = class_names or DEFAULT_CLASSES
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.device = device
        self.model = None
        self.is_loaded = False
        self.load_error = None
        
        self._load_model()

    def _load_model(self):
        """Safely load YOLO model with clear error reporting and pretrained fallback."""
        if not ULTRALYTICS_AVAILABLE:
            self.load_error = (
                "Ultralytics library is not installed. Install via 'pip install ultralytics' "
                "or run using synthetic testing mode."
            )
            return

        # Check primary custom weights path
        if self.model_path and os.path.exists(self.model_path):
            try:
                self.model = YOLO(self.model_path)
                self.is_loaded = True
                return
            except Exception as e:
                self.load_error = f"Failed to load weights at {self.model_path}: {e}"

        # Check fallback base yolov8n.pt
        fallback_path = "yolov8n.pt"
        try:
            self.model = YOLO(fallback_path)
            self.is_loaded = True
        except Exception as e:
            self.load_error = (
                f"No custom model found at '{self.model_path}' and unable to download base model: {e}. "
                "Please train a model using 'python scripts/train.py' first."
            )

    def detect(
        self,
        image_input,
        severity_weights: Optional[Dict[str, float]] = None,
        class_hazard_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Perform full detection, localization, and severity assessment on an image.
        
        Args:
            image_input: Image file path, numpy array (RGB), or PIL Image.
            severity_weights: Custom area/count/type weights.
            class_hazard_weights: Custom class hazard multipliers.
            
        Returns:
            Dictionary containing:
                - detections: List[DefectDetection]
                - severity: SeverityAssessment
                - annotated_image: np.ndarray (RGB)
                - surface_pixels: int
                - total_pixels: int
                - model_status: str
        """
        rgb_img, letterbox_img, scale, padding = load_and_preprocess_image(image_input)
        h, w = rgb_img.shape[:2]
        total_pixels = h * w
        
        # Estimate inspected surface area
        surface_pixels, surface_mask = estimate_surface_area(rgb_img)

        detections: List[DefectDetection] = []

        if self.is_loaded and self.model is not None:
            results = self.model.predict(
                source=rgb_img,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False
            )
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    xyxy = box.xyxy[0].cpu().numpy().tolist()
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    cls_name = self.class_names.get(cls_id, f"Class {cls_id}")
                    
                    x1, y1, x2, y2 = xyxy
                    box_w = max(0.0, x2 - x1)
                    box_h = max(0.0, y2 - y1)
                    box_area = box_w * box_h
                    area_pct = (box_area / max(surface_pixels, 1.0)) * 100.0
                    
                    detections.append(DefectDetection(
                        class_id=cls_id,
                        class_name=cls_name,
                        confidence=round(conf, 3),
                        bbox=[round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                        area_pixels=round(box_area, 1),
                        area_percentage=round(area_pct, 2)
                    ))
        
        # Calculate Severity Assessment
        severity_report = calculate_severity_score(
            detections=detections,
            surface_area_pixels=surface_pixels,
            class_hazard_weights=class_hazard_weights,
            weights=severity_weights
        )

        # Render Annotated Image
        annotated_bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
        annotated_rgb = self._draw_annotations(annotated_bgr, detections, severity_report)

        return {
            "detections": detections,
            "severity": severity_report,
            "annotated_image": annotated_rgb,
            "surface_pixels": surface_pixels,
            "total_pixels": total_pixels,
            "model_status": "loaded" if self.is_loaded else f"offline: {self.load_error}"
        }

    def _draw_annotations(
        self,
        bgr_image: np.ndarray,
        detections: List[DefectDetection],
        severity: SeverityAssessment
    ) -> np.ndarray:
        """Render high-contrast bounding boxes, masks, and status banners on the image."""
        img = bgr_image.copy()
        overlay = img.copy()

        for det in detections:
            x1, y1, x2, y2 = map(int, det.bbox)
            color = CLASS_BGR_COLORS.get(det.class_id, (0, 0, 255))
            
            # Semi-transparent defect region highlight
            cv2.rectangle(overlay, (x1, y1), (x2, y2), color, -1)
            
            # High-visibility bounding box
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # Label banner
            label = f"{det.class_name} | Conf: {det.confidence:.2f} (Area: {det.area_percentage:.1f}%)"
            (label_w, label_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            
            top_y = max(y1 - label_h - 6, 0)
            cv2.rectangle(img, (x1, top_y), (x1 + label_w + 8, top_y + label_h + 6), color, -1)
            cv2.putText(
                img, label, (x1 + 4, top_y + label_h + 2),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA
            )

        # Blend semi-transparent masks with 30% alpha
        cv2.addWeighted(overlay, 0.25, img, 0.75, 0, img)

        # Top status banner
        banner_h = 36
        banner_bg = (30, 41, 59)  # Dark slate
        grade_colors = {
            "Safe": (60, 160, 60),            # Green
            "Minor Defect": (50, 150, 220),   # Yellow/Amber
            "Moderate Defect": (20, 100, 230),# Orange
            "Critical Defect": (30, 30, 220)  # Red
        }
        status_color = grade_colors.get(severity.severity_grade, (100, 100, 100))

        cv2.rectangle(img, (0, 0), (img.shape[1], banner_h), banner_bg, -1)
        
        status_text = f"VisionGuard QC | Severity: {severity.severity_score}/100 [{severity.severity_grade}] | Defects: {severity.defect_count}"
        cv2.putText(
            img, status_text, (12, 23),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA
        )

        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
