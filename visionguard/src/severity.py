"""Defect severity calculation and classification module for VisionGuard.

Separates detection confidence (probabilistic classification belief) from
physical defect severity (engineering risk assessment based on physical area,
defect count, and defect structural hazard).
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import math


DEFAULT_CLASS_HAZARD = {
    "Crack": 95.0,        # Critical structural risk (fracture propagation)
    "Hole": 90.0,         # Structural perforation risk
    "Dent": 70.0,         # Mechanical deformation / stress concentration
    "Scratch": 45.0,      # Surface abrasion / coating compromise
    "Stain": 35.0,        # Cosmetic / chemical residue
    "Other Defect": 40.0  # General unclassified anomaly
}

DEFAULT_WEIGHTS = {
    "area_weight": 0.45,
    "count_weight": 0.25,
    "type_weight": 0.30
}

SEVERITY_THRESHOLDS = {
    "Safe": (0.0, 19.99),
    "Minor Defect": (20.0, 49.99),
    "Moderate Defect": (50.0, 79.99),
    "Critical Defect": (80.0, 100.0)
}


@dataclass
class DefectDetection:
    """Represents a localized defect detection."""
    class_id: int
    class_name: str
    confidence: float  # Uncalibrated model confidence [0.0, 1.0]
    bbox: List[float]  # [x1, y1, x2, y2] in pixel coords
    area_pixels: float
    area_percentage: float  # % of visible surface area


@dataclass
class SeverityAssessment:
    """Complete evaluation report for an inspected specimen."""
    severity_score: float                  # Final score [0.0, 100.0]
    severity_grade: str                    # 'Safe', 'Minor Defect', 'Moderate Defect', 'Critical Defect'
    area_percentage_total: float          # Combined defect area / surface area %
    defect_count: int                      # Total number of detected defects
    max_hazard_class: str                  # Most dangerous defect detected
    area_component_score: float           # Contribution from defect area
    count_component_score: float          # Contribution from defect quantity
    type_component_score: float           # Contribution from defect structural hazard
    is_heuristic: bool = True              # Clearly flagged as engineering heuristic
    confidence_disclaimer: str = (
        "Note: Model confidence represents detector belief, not defect severity. "
        "Severity is calculated using geometric area and engineering hazard heuristics."
    )


def calculate_severity_score(
    detections: List[DefectDetection],
    surface_area_pixels: float,
    class_hazard_weights: Optional[Dict[str, float]] = None,
    weights: Optional[Dict[str, float]] = None
) -> SeverityAssessment:
    """Calculate an interpretable defect severity score between 0 and 100.
    
    Formula:
        Score = (W_area * Area_Score) + (W_count * Count_Score) + (W_type * Type_Score)
        
    Where:
        - Area_Score: Scaled defect surface coverage (capped at 100)
        - Count_Score: Scaled defect count penalty (min(count * 15, 100))
        - Type_Score: Maximum hazard score among all detected defect types
    
    Args:
        detections: List of DefectDetection instances.
        surface_area_pixels: Total visible surface area in pixels.
        class_hazard_weights: Dictionary mapping class name to hazard multiplier [0-100].
        weights: Dictionary specifying 'area_weight', 'count_weight', 'type_weight' (must sum to ~1.0).
        
    Returns:
        SeverityAssessment dataclass.
    """
    if class_hazard_weights is None:
        class_hazard_weights = DEFAULT_CLASS_HAZARD
        
    if weights is None:
        weights = DEFAULT_WEIGHTS

    w_area = weights.get("area_weight", 0.45)
    w_count = weights.get("count_weight", 0.25)
    w_type = weights.get("type_weight", 0.30)

    # Normalization safeguard for weights
    total_w = w_area + w_count + w_type
    if total_w > 0:
        w_area /= total_w
        w_count /= total_w
        w_type /= total_w

    if not detections or len(detections) == 0:
        return SeverityAssessment(
            severity_score=0.0,
            severity_grade="Safe",
            area_percentage_total=0.0,
            defect_count=0,
            max_hazard_class="None",
            area_component_score=0.0,
            count_component_score=0.0,
            type_component_score=0.0
        )

    # 1. Defect Area Component
    total_defect_pixels = sum(d.area_pixels for d in detections)
    safe_surface = max(surface_area_pixels, 1.0)
    area_pct = (total_defect_pixels / safe_surface) * 100.0
    
    # Non-linear scaling: even 5% surface defect is major in precision manufacturing
    # 0% -> 0, 2% -> 35, 5% -> 65, 10%+ -> 100
    area_score = min(100.0, area_pct * 10.0)

    # 2. Defect Count Component
    count = len(detections)
    # 1 defect = 20, 2 defects = 40, 5+ defects = 100
    count_score = min(100.0, count * 20.0)

    # 3. Defect Hazard Component
    max_hazard = 0.0
    most_severe_class = "None"
    for d in detections:
        hazard = class_hazard_weights.get(d.class_name, 50.0)
        if hazard > max_hazard:
            max_hazard = hazard
            most_severe_class = d.class_name

    type_score = max_hazard

    # Composite Heuristic Severity
    raw_score = (w_area * area_score) + (w_count * count_score) + (w_type * type_score)
    final_score = round(max(0.0, min(100.0, raw_score)), 1)

    # Categorize into grading tiers
    if final_score < 20.0:
        grade = "Safe"
    elif final_score < 50.0:
        grade = "Minor Defect"
    elif final_score < 80.0:
        grade = "Moderate Defect"
    else:
        grade = "Critical Defect"

    return SeverityAssessment(
        severity_score=final_score,
        severity_grade=grade,
        area_percentage_total=round(area_pct, 2),
        defect_count=count,
        max_hazard_class=most_severe_class,
        area_component_score=round(area_score, 1),
        count_component_score=round(count_score, 1),
        type_component_score=round(type_score, 1)
    )
