"""Image preprocessing, validation, and surface extraction module for VisionGuard."""

import os
from typing import Tuple, Optional, Dict, Any
import numpy as np
import cv2
from PIL import Image


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MAX_IMAGE_DIMENSION = 4096
MIN_IMAGE_DIMENSION = 32


def validate_image_file(file_path: str) -> Tuple[bool, str]:
    """Validate that an image file exists, is non-empty, and has an allowed extension.
    
    Args:
        file_path: Path to the image file.
        
    Returns:
        Tuple of (is_valid: bool, error_message: str)
    """
    if not os.path.exists(file_path):
        return False, f"File does not exist: {file_path}"
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return False, f"Unsupported file extension '{ext}'. Supported: {SUPPORTED_EXTENSIONS}"
    
    if os.path.getsize(file_path) == 0:
        return False, "File is empty (0 bytes)."
    
    try:
        with Image.open(file_path) as img:
            img.verify()
    except Exception as e:
        return False, f"Corrupted or invalid image file: {str(e)}"
    
    return True, ""


def load_and_preprocess_image(
    image_input,
    target_size: Tuple[int, int] = (640, 640)
) -> Tuple[np.ndarray, np.ndarray, float, Tuple[int, int]]:
    """Load image, convert to RGB, and compute letterbox scaling for YOLO inference.
    
    Args:
        image_input: Either a file path string or a numpy array/PIL Image.
        target_size: Desired model input resolution (width, height).
        
    Returns:
        Tuple of:
            - rgb_original: np.ndarray (H, W, 3) in uint8
            - letterboxed: np.ndarray (target_h, target_w, 3) in uint8
            - scale_ratio: float
            - (pad_w, pad_h): Tuple[int, int]
    """
    if isinstance(image_input, str):
        img_bgr = cv2.imread(image_input)
        if img_bgr is None:
            raise ValueError(f"Failed to read image at: {image_input}")
        rgb_img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    elif isinstance(image_input, Image.Image):
        rgb_img = np.array(image_input.convert("RGB"))
    elif isinstance(image_input, np.ndarray):
        if len(image_input.shape) == 2:
            rgb_img = cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
        elif image_input.shape[2] == 4:
            rgb_img = cv2.cvtColor(image_input, cv2.COLOR_RGBA2RGB)
        else:
            rgb_img = image_input.copy()
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")

    orig_h, orig_w = rgb_img.shape[:2]
    target_w, target_h = target_size

    # Calculate letterbox scale
    scale = min(target_w / orig_w, target_h / orig_w if orig_w != 0 else 1.0, target_h / orig_h)
    new_w, new_h = int(orig_w * scale), int(orig_h * scale)
    
    resized = cv2.resize(rgb_img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    letterboxed = np.full((target_h, target_w, 3), 114, dtype=np.uint8)
    
    pad_w = (target_w - new_w) // 2
    pad_h = (target_h - new_h) // 2
    letterboxed[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized

    return rgb_img, letterboxed, scale, (pad_w, pad_h)


def estimate_surface_area(rgb_image: np.ndarray) -> Tuple[int, np.ndarray]:
    """Estimate the visible surface/object area in pixels to calculate defect percentage.
    
    Uses Otsu adaptive thresholding and morphological closing to segment the
    workpiece/object from the inspection background. If no clear foreground is
    isolated, defaults to the total image pixel count.
    
    Args:
        rgb_image: RGB image numpy array.
        
    Returns:
        Tuple of (surface_pixel_count: int, surface_mask: np.ndarray boolean)
    """
    h, w = rgb_image.shape[:2]
    total_pixels = h * w
    
    gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Check contrast variance
    variance = np.var(blurred)
    if variance < 30:
        # Uniform or low-contrast background - entire image is surface
        mask = np.ones((h, w), dtype=np.uint8) * 255
        return total_pixels, mask > 0

    # Otsu thresholding
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    # Clean up small noise with morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Check if foreground is darker or lighter than background corners
    corner_samples = np.array([
        closed[0:10, 0:10].mean(),
        closed[0:10, -10:].mean(),
        closed[-10:, 0:10].mean(),
        closed[-10:, -10:].mean()
    ])
    if corner_samples.mean() > 127:
        closed = cv2.bitwise_not(closed)
        
    surface_pixels = int(np.count_nonzero(closed))
    
    # If the segmented mask is too small (<5% of viewport), assume the whole frame is the specimen
    if surface_pixels < (0.05 * total_pixels):
        surface_pixels = total_pixels
        closed = np.ones((h, w), dtype=np.uint8) * 255
        
    return surface_pixels, closed > 0
