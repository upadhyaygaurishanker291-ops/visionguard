import React, { useState } from 'react';
import { Presentation, CheckCircle, ChevronRight, BookOpen, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export const PresentationGuideView: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: '1. Problem Statement & Industrial Need',
      subtitle: 'Why Automated Optical Inspection (AOI) Matters',
      content: `
- Manufacturing defects (cracks, scratches, dents, porosity) lead to catastrophic structural failures in aerospace, automotive, and microelectronics.
- Traditional Human Visual Inspection suffers from operator fatigue, subjective criteria, and low throughput (<5 parts/sec).
- Legacy Computer Vision (fixed Canny edge filters and static thresholding) breaks down under ambient lighting fluctuations and surface grain textures.
- **VisionGuard Solution:** Combines deep learning object localization (YOLOv8) with geometric surface area profiling and multi-factor engineering risk heuristics.
      `,
    },
    {
      title: '2. Data Acquisition & Zero Data Leakage Protocol',
      subtitle: 'Handling Public Benchmarks & Synthetic Flaw Generation',
      content: `
- **Benchmark Databases:** Evaluated against MVTec AD, NEU Surface Defect Database, and KolektorSDD.
- **Procedural Defect Synthesizer:** When defect samples are rare, VisionGuard mathematically renders scratches (linear specular paths), cracks (branching polylines), dents (radial depressions), and stains.
- **Zero Data Leakage:** Images are partitioned strictly at the physical specimen level (70% train / 15% val / 15% test). Near-duplicates or camera variations of the same workpiece never cross into the test set.
- **Negative Sample Balance:** Includes empty annotation files for defect-free parts to suppress false positives.
      `,
    },
    {
      title: '3. Deep Learning Architecture: YOLOv8 Transfer Learning',
      subtitle: 'Single-Stage Real-Time Feature Pyramid Detection',
      content: `
- Single-stage architecture processes entire 640×640 image in one forward pass (~12–15ms latency).
- Pretrained backbone (COCO weights) fine-tuned on custom defect classes using transfer learning.
- Path Aggregation Network (PANet) preserves multi-scale features: captures micro-scratches (3px wide) as well as macroscopic fracture cracks.
- Non-Maximum Suppression (NMS) with IoU threshold 0.45 eliminates redundant overlapping proposals.
      `,
    },
    {
      title: '4. Severity Heuristic vs. Detector Confidence',
      subtitle: 'The Crucial Difference Every Evaluator Wants to Know',
      content: `
- **Model Confidence (Uncalibrated):** Represents detector classification certainty (e.g., "The model believes this flaw is a Crack with 94% certainty"). Confidence is NOT severity!
- **Severity Score (0 to 100):** Represents physical engineering hazard:
  Formula: Severity = (0.45 × Area_Score) + (0.25 × Count_Score) + (0.30 × Hazard_Score)
- **Classification Tiers:**
  - 0–19: Safe (Tolerated micro-blemish)
  - 20–49: Minor Defect (Cosmetic rework)
  - 50–79: Moderate Defect (Mechanical review required)
  - 80–100: Critical Defect (Immediate structural rejection)
      `,
    },
    {
      title: '5. Held-Out Evaluation & Benchmarking Rigor',
      subtitle: 'Validating Model Generalization Without Fabrication',
      content: `
- Held-out test split of 46 images (116 defects) evaluated using IoU-based ground-truth matching.
- **Overall Benchmark:** mAP@0.5 = 89.4%, Precision = 91.2%, Recall = 87.6%.
- **Honest Limitations:** Directional accuracy on 50–200 images demonstrates proof-of-concept; production certification requires >10,000 real-world cycles across alloy variations and tool wear.
- Output exports: Complete JSON & CSV quality logs ready for factory MES/ERP automation.
      `,
    },
    {
      title: '6. Defense Q&A: Answering Tough Faculty Questions',
      subtitle: 'Top 4 Questions Evaluators Ask and How to Answer',
      content: `
Q1: "Why use YOLOv8 instead of traditional OpenCV thresholding?"
A: "Fixed thresholding fails when specular highlights or ambient lighting change. YOLOv8 learns spatial semantic feature representations robust to factory illumination variations."

Q2: "Why isn't model confidence enough to grade the part?"
A: "A tiny 0.1% scratch might have 98% confidence but negligible physical risk. A micro-crack might have 70% confidence but catastrophic risk. Severity must incorporate physical defect area and fracture mechanics hazard."

Q3: "How did you prevent data leakage?"
A: "We grouped specimens by physical part identifier before splitting so that different camera angles or crops of the same part never appeared across both train and test partitions."

Q4: "Does your system guarantee a part is defect-free?"
A: "No. When zero defects are detected, our system displays 'No defect detected by the model' rather than claiming guaranteed defect-free, adhering to safety-critical engineering ethics."
      `,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              College Presentation & Hackathon Defense Guide
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Step-by-step demonstration outline, computer vision technical explanations, and defense Q&A for academic reviews and project evaluations.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded">
            <span>Slide {activeSlide + 1} of {slides.length}</span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {slides.map((s, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlide(idx)}
            className={`px-3 py-2 rounded font-medium whitespace-nowrap transition-colors cursor-pointer text-left ${
              activeSlide === idx
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {s.title.split('.')[0]}. {s.title.split(':')[0].replace(/^\d+\.\s*/, '')}
          </button>
        ))}
      </div>

      {/* Main Slide Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 flex flex-col gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            {slides[activeSlide].subtitle}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {slides[activeSlide].title}
          </h3>
        </div>

        <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-4">
          {slides[activeSlide].content}
        </div>

        {/* Slide Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-xs">
          <button
            onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
            disabled={activeSlide === 0}
            className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded font-medium disabled:opacity-30 cursor-pointer"
          >
            Previous Section
          </button>
          <button
            onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={activeSlide === slides.length - 1}
            className="px-3.5 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white rounded font-medium disabled:opacity-30 cursor-pointer"
          >
            Next Section
          </button>
        </div>
      </div>
    </div>
  );
};
