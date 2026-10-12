# VisionGuard — AI-Based Industrial Defect Detection System

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![YOLOv8](https://img.shields.io/badge/YOLO-v8-green.svg)](https://docs.ultralytics.com/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.32+-red.svg)](https://streamlit.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An end-to-end computer vision and deep learning system engineered for industrial automated optical inspection (AOI). VisionGuard detects and localizes defects in images using YOLOv8 transfer learning, extracts surface geometries, calculates an interpretable defect severity score (0–100), and classifies inspected parts into **Safe**, **Minor Defect**, **Moderate Defect**, or **Critical Defect**.

---

## 1. System Architecture

```
[Input Specimen Image]
         │
         ▼
[Preprocessing & Validation] ──▶ [Workpiece Surface Area Extraction (Otsu & Contours)]
         │                                                      │
         ▼                                                      │
[YOLOv8 Transfer Learning Detector]                             │
         │                                                      │
         ├─── Bounding Boxes [x1, y1, x2, y2]                   │
         ├─── Class Identifiers (Scratch, Crack, Dent, etc.)    │
         └─── Model Confidence Scores                           │
         │                                                      │
         ▼                                                      ▼
[Defect Metrics Engine] ◀───────────────────────────────────────┘
         │
         ├─── Defect Surface Area Coverage (%)
         ├─── Defect Multi-Attribute Hazard Weighting
         │
         ▼
[Heuristic Severity Calculation (0–100)]
         │
         ├── 0–19:   Safe
         ├── 20–49:  Minor Defect
         ├── 50–79:  Moderate Defect
         └── 80–100: Critical Defect
         │
         ▼
[Export & Quality Logs] ──▶ Annotated Image (PNG) + Quality Records (JSON / CSV)
```

---

## 2. Directory Structure

```
visionguard/
├── app.py                     # Interactive Streamlit Web Application
├── requirements.txt           # Python dependencies
├── README.md                  # System manual and presentation guide
├── config.yaml                # Master configuration (classes, weights, hyperparameters)
├── data/
│   ├── raw/                   # Raw downloaded benchmarks (NEU, MVTec, Kolektor)
│   ├── processed/             # Partitioned train/val/test images and labels
│   │   ├── images/            # {train, val, test} splits
│   │   └── labels/            # YOLO format {train, val, test} .txt files
│   ├── synthetic/             # Procedurally generated defects with YOLO tags
│   └── dataset.yaml           # Ultralytics dataset specification
├── models/
│   ├── README.md              # Weight file conventions
│   └── best.pt                # Checkpoint with optimal validation mAP@0.5
├── scripts/
│   ├── download_dataset.py    # Public dataset catalog & directory initializer
│   ├── generate_synthetic_defects.py  # Procedural flaw generator
│   ├── prepare_dataset.py     # Train/val/test splitting with zero data leakage
│   ├── validate_annotations.py# Bounding box coordinate sanity checker
│   ├── train.py               # YOLOv8 transfer learning with early stopping
│   ├── evaluate.py            # Held-out test evaluation & IoU matching
│   └── predict.py             # CLI batch inference and report generator
├── src/
│   ├── preprocessing.py       # Aspect-ratio letterboxing & surface area estimation
│   ├── detection.py           # Model loading, inference, and OpenCV rendering
│   ├── severity.py            # Physical severity calculation & grading
│   ├── metrics.py             # IoU matching, Precision/Recall, and Confusion Matrix
│   └── reporting.py           # Industrial JSON and CSV report generators
└── tests/
    ├── test_preprocessing.py  # Unit tests for preprocessing & surface segmentation
    ├── test_severity.py       # Unit tests for severity scoring & edge cases
    └── test_predictions.py    # Unit tests for IoU and quality reports
```

---

## 3. Quickstart & Execution Instructions

### Step 1: Create and Activate Virtual Environment

**Linux / macOS (Bash):**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Initialize and Prepare Dataset
Generate synthetic prototype samples or import public benchmarks:
```bash
# 1. Initialize folders
python scripts/download_dataset.py --init-dirs

# 2. Synthesize 100 prototype samples with YOLO annotations
python scripts/generate_synthetic_defects.py --count 100

# 3. Partition into Train (70%), Val (15%), Test (15%) splits
python scripts/prepare_dataset.py

# 4. Verify annotation integrity
python scripts/validate_annotations.py
```

### Step 4: Run Unit Tests
```bash
pytest tests/ -v
# or using built-in unittest
python -m unittest discover tests
```

### Step 5: Train YOLOv8 Model
```bash
# Uses config.yaml hyperparameters (epochs=50, batch_size=8, lr0=0.01)
python scripts/train.py --config config.yaml

# To resume interrupted training:
python scripts/train.py --config config.yaml --resume
```

### Step 6: Evaluate on Held-Out Test Split
```bash
python scripts/evaluate.py --weights models/best.pt --config config.yaml
```

### Step 7: Launch Interactive Web Application
```bash
streamlit run app.py
```
Open `http://localhost:8501` in your browser.

### Step 8: CLI Inference Example
```bash
python scripts/predict.py data/synthetic/images/synthetic_0001.jpg --weights models/best.pt
```

---

## 4. Defect Taxonomy and Severity Formula

### Supported Defect Classes
1. **Scratch:** Thin linear abrasion compromise on surface coating.
2. **Crack:** Structural fracture with branching stress propagation risk.
3. **Dent:** Surface impact depression causing dimensional deviation.
4. **Stain:** Chemical residue or fluid contamination.
5. **Hole:** Perforation void through specimen surface.
6. **Other Defect:** Miscellaneous unclassified surface anomaly.

### Severity Scoring Heuristic Formula
$$\text{Severity} = \left( W_{\text{area}} \times S_{\text{area}} \right) + \left( W_{\text{count}} \times S_{\text{count}} \right) + \left( W_{\text{type}} \times S_{\text{hazard}} \right)$$

- $W_{\text{area}} = 0.45$: Weight of physical defect area coverage.
- $W_{\text{count}} = 0.25$: Weight of total defect multiplicity.
- $W_{\text{type}} = 0.30$: Weight of the most critical structural flaw type detected.

### Grade Tiers
- **0 – 19:** `Safe` (Negligible flaw, within mechanical tolerance)
- **20 – 49:** `Minor Defect` (Cosmetic flaw, functional integrity maintained)
- **50 – 79:** `Moderate Defect` (Rework required before release)
- **80 – 100:** `Critical Defect` (Immediate rejection; structural hazard)

> **Crucial Difference: Model Confidence vs. Severity Score:**
> Model confidence represents detector classification belief (e.g., "The model is 91% confident this anomaly is a Scratch").
> Defect severity represents engineering risk (e.g., "A 0.1% scratch poses low severity (score: 22/100), whereas a 0.1% structural crack poses high severity (score: 78/100)").

---

## 5. College Project & Presentation Demonstration Workflow

When presenting VisionGuard to faculty, evaluators, or hackathon judges:

1. **Slide 1: Problem Statement & Industrial Need**
   - High-speed manufacturing lines suffer from operator fatigue in manual inspection.
   - Traditional computer vision (fixed edge filters) fails under shifting factory illumination.
2. **Slide 2: System Architecture & Zero-Leakage Dataset**
   - YOLOv8 transfer learning trained on multi-class surface defects.
   - Strict specimen-level partitioning to guarantee zero data leakage between train and test sets.
3. **Slide 3: Real-Time Live Demo (`streamlit run app.py`)**
   - Inspect a **Safe** specimen: Show model output ("No defect detected by the model").
   - Inspect a **Minor Scratch**: Show low severity score (25/100).
   - Inspect a **Critical Structural Crack**: Highlight why severity rises to 82/100 despite similar pixel area.
   - Demonstrate 1-click **JSON and CSV Export** for factory MES/ERP integration.
4. **Slide 4: Evaluation Rigor & Honest Limitations**
   - Present mAP@0.5 and held-out test confusion matrix.
   - Explain the difference between synthetic prototyping data (50–200 images) and factory production scale (>10,000 real images).

---

## 6. Dataset Licensing and Credits
- **MVTec Anomaly Detection (MVTec AD):** CC BY-NC-SA 4.0 license (MVTec Software GmbH).
- **NEU Surface Defect Database:** Academic Research Use Only (Northeastern University).
- **KolektorSDD:** Research Use Only (University of Ljubljana & Kolektor Group).
- **Ultralytics YOLOv8:** AGPL-3.0 License (Ultralytics Inc.).
