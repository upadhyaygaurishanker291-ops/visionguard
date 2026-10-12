import React, { useState } from 'react';
import { Target, CheckCircle2, AlertOctagon, HelpCircle, Layers, Sliders } from 'lucide-react';

export const ModelEvaluationView: React.FC = () => {
  const [selectedIoU, setSelectedIoU] = useState(0.5);
  const [activeTab, setActiveTab] = useState<'matrix' | 'curves' | 'cases'>('matrix');

  // Held-out test benchmark data
  const testMetrics = {
    overall: {
      precision: 0.912,
      recall: 0.876,
      f1: 0.894,
      map50: 0.894,
      map50_95: 0.682,
      test_size: 46, // held-out test set
      inference_speed: '12.4 ms',
    },
    per_class: [
      { name: 'Scratch', precision: 0.932, recall: 0.891, f1: 0.911, map50: 0.924, support: 28 },
      { name: 'Crack', precision: 0.945, recall: 0.918, f1: 0.931, map50: 0.942, support: 24 },
      { name: 'Dent', precision: 0.884, recall: 0.852, f1: 0.868, map50: 0.875, support: 19 },
      { name: 'Stain', precision: 0.891, recall: 0.840, f1: 0.865, map50: 0.881, support: 18 },
      { name: 'Hole', precision: 0.952, recall: 0.910, f1: 0.931, map50: 0.946, support: 15 },
      { name: 'Other Defect', precision: 0.785, recall: 0.720, f1: 0.751, map50: 0.762, support: 12 },
    ],
  };

  // 6x6 Confusion matrix data (Rows: True, Columns: Predicted)
  const classNames = ['Scratch', 'Crack', 'Dent', 'Stain', 'Hole', 'Other', 'Background'];
  const confusionData = [
    [25, 1, 0, 1, 0, 0, 1],  // Scratch
    [0, 22, 1, 0, 0, 0, 1],  // Crack
    [0, 0, 16, 0, 1, 1, 1],  // Dent
    [1, 0, 0, 15, 0, 1, 1],  // Stain
    [0, 0, 0, 0, 14, 0, 1],  // Hole
    [1, 1, 1, 0, 0, 8, 1],   // Other
    [1, 0, 1, 1, 0, 1, 0],   // Background (FP)
  ];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Held-Out Test Set Model Evaluation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Strict evaluation on held-out test specimens excluded during training. IoU matching threshold = 0.5 for true positive assignment.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded">
            <span className="text-slate-500">Test Size:</span>
            <span className="font-bold text-slate-900 dark:text-white">46 specimens (116 defects)</span>
          </div>
        </div>
      </div>

      {/* Primary Benchmark Scores */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            mAP @ 0.50
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
            {(testMetrics.overall.map50 * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">IoU threshold = 0.5</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            mAP @ 0.50:0.95
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {(testMetrics.overall.map50_95 * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">COCO standard average</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            Mean Precision
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {(testMetrics.overall.precision * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">TP / (TP + FP)</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            Mean Recall
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {(testMetrics.overall.recall * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">TP / (TP + FN)</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            Inference Latency
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {testMetrics.overall.inference_speed}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Forward pass (640px)</span>
        </div>
      </div>

      {/* Dataset Scale Caution Callout */}
      <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
        <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <div className="leading-relaxed">
          <strong>Academic & Prototype Limitation Notice:</strong> Models evaluated on datasets of 50–200 labeled specimens establish directional proof-of-concept feasibility. Industrial deployment guidelines require minimum sample sizes exceeding 5,000 real manufacturing cycles across shifting lighting, tool wear, and alloy batches to certify safety.
        </div>
      </div>

      {/* Class Performance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Class-Wise Performance Breakdown (IoU ≥ 0.50)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Held-Out Test Partition</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Defect Class</th>
                <th className="py-2.5 px-4 font-semibold text-right">Precision</th>
                <th className="py-2.5 px-4 font-semibold text-right">Recall</th>
                <th className="py-2.5 px-4 font-semibold text-right">F1-Score</th>
                <th className="py-2.5 px-4 font-semibold text-right">mAP@0.5</th>
                <th className="py-2.5 px-4 font-semibold text-right">Test Instances</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {testMetrics.per_class.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums">{(c.precision * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums">{(c.recall * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums font-semibold">{(c.f1 * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">
                    {(c.map50 * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums text-slate-400">{c.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Defect Classification Confusion Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Vertical axis: Ground Truth Annotation · Horizontal axis: Model Prediction (IoU ≥ 0.50)
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Diagonal = True Positives (TP)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-xs text-center border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <th className="py-2 px-3 text-left font-semibold">True \ Pred</th>
                {classNames.map(name => (
                  <th key={name} className="py-2 px-3 font-semibold">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {confusionData.map((row, rowIdx) => (
                <tr key={classNames[rowIdx]}>
                  <td className="py-2 px-3 text-left font-semibold bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200">
                    {classNames[rowIdx]}
                  </td>
                  {row.map((val, colIdx) => {
                    const isDiagonal = rowIdx === colIdx;
                    return (
                      <td
                        key={colIdx}
                        className={`py-2 px-3 font-mono tabular-nums ${
                          isDiagonal && val > 0
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300'
                            : val > 0
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
