import React, { useState } from 'react';
import { Database, FileCheck, Layers, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { BENCHMARK_SAMPLES } from '../data/benchmarkSamples';

export const DatasetManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'splits' | 'annotations' | 'synthetic'>('splits');
  const [selectedSplit, setSelectedSplit] = useState<'train' | 'val' | 'test'>('train');

  // Synthetic generator interactive state
  const [synthSurface, setSynthSurface] = useState<'metal' | 'ceramic' | 'steel'>('metal');
  const [synthDefect, setSynthDefect] = useState<'Scratch' | 'Crack' | 'Dent' | 'Stain'>('Scratch');
  const [generatedCoords, setGeneratedCoords] = useState<string>('0 0.428512 0.381294 0.158201 0.042109');

  const handleGenerateSynth = () => {
    const classId = synthDefect === 'Scratch' ? 0 : synthDefect === 'Crack' ? 1 : synthDefect === 'Dent' ? 2 : 3;
    const xc = (0.2 + Math.random() * 0.6).toFixed(6);
    const yc = (0.2 + Math.random() * 0.6).toFixed(6);
    const w = (0.05 + Math.random() * 0.2).toFixed(6);
    const h = (0.05 + Math.random() * 0.2).toFixed(6);
    setGeneratedCoords(`${classId} ${xc} ${yc} ${w} ${h}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dataset Studio & Annotation Integrity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Strict partition management (70% train / 15% val / 15% test) with physical object grouping to prevent data leakage.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-500">Total Dataset:</span>
            <span className="font-bold text-slate-900 dark:text-white">150 Images (320 Annotations)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('splits')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeTab === 'splits'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Partitions & Splits
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeTab === 'annotations'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          YOLO Annotation Inspector
        </button>
        <button
          onClick={() => setActiveTab('synthetic')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
            activeTab === 'synthetic'
              ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Procedural Defect Synthesizer
        </button>
      </div>

      {activeTab === 'splits' && (
        <div className="flex flex-col gap-6">
          {/* Split KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Training Split (70%)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                105 Images
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">224 defect instances + 28 defect-free</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Validation Split (15%)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                22 Images
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">48 defect instances for hyperparameter tuning</span>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                Held-Out Test Split (15%)
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                23 Images
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Zero data leakage held-out benchmark</span>
            </div>
          </div>

          {/* Data Leakage Safeguard Protocol */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex items-start gap-3">
            <FileCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-slate-600 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">Zero Data Leakage Enforcement:</strong> Dataset partitioning script groups images by physical object stem (e.g., all camera angles, zooms, and lighting shifts of specimen <code>AL-3104</code> stay in the training split). No identical or near-duplicate physical part is allowed to appear in the test set.
            </div>
          </div>

          {/* Benchmark Specimen Gallery */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Dataset Benchmark Specimens & Provenance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BENCHMARK_SAMPLES.map((sample) => (
                <div key={sample.id} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
                  <div className="h-40 bg-slate-950 overflow-hidden">
                    <img src={sample.imageUrl} alt={sample.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 text-xs flex flex-col gap-1">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {sample.title}
                    </span>
                    <span className="text-slate-500 text-[11px]">{sample.material}</span>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>{sample.category}</span>
                      <span className="font-mono">{sample.defaultDetections.length} flaw(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'annotations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ultralytics YOLO Format Specification
            </h3>
            <span className="font-mono text-slate-400">data/processed/labels/*.txt</span>
          </div>

          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Every training image has a matching <code>.txt</code> file containing normalized space-separated values:
          </p>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded font-mono text-[11px] overflow-x-auto">
{`# Format: <class_id> <x_center> <y_center> <width> <height>
# All spatial coordinates are normalized in the range [0.0, 1.0] relative to image dimensions.

# Example 1: Machined Scratch (Class 0)
0 0.451562 0.538802 0.613281 0.513021

# Example 2: Structural Crack (Class 1)
1 0.528125 0.470052 0.692187 0.590104

# Example 3: Defect-Free Specimen
# (Empty 0-byte file: Crucial for training negative background samples to prevent false positives)`}
          </pre>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300">
            <strong>Annotation Validation Passed:</strong> 100% of bounding boxes in the processed dataset adhere to boundary constraints ($0.0 \le x, y, w, h \le 1.0$) with zero orphaned image or label pairs.
          </div>
        </div>
      )}

      {activeTab === 'synthetic' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Interactive Procedural Defect Synthesizer
            </h3>
            <p className="text-slate-500 mt-1">
              Simulates synthetic scratches, cracks, dents, and stains directly onto engineered base textures to augment scarce physical defect data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Base Substrate Material:
              </label>
              <select
                value={synthSurface}
                onChange={(e) => setSynthSurface(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="metal">Brushed Aluminium (Directional Streaks)</option>
                <option value="ceramic">Matte Industrial Ceramic</option>
                <option value="steel">Cold-Rolled Dark Steel Sheet</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Procedural Defect Type:
              </label>
              <select
                value={synthDefect}
                onChange={(e) => setSynthDefect(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
              >
                <option value="Scratch">Linear Surface Scratch (with Specular Highlight)</option>
                <option value="Crack">Jagged Fracture Crack (Polygonal Branches)</option>
                <option value="Dent">Circular Impact Dent (Elliptical Shadow)</option>
                <option value="Stain">Fluid Oil Contamination (Feathered Blob)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateSynth}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Synthesize Flaw & Generate YOLO Box</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950 text-slate-200 rounded font-mono text-[11px]">
            <span className="text-slate-400">Generated YOLO Label Vector:</span>
            <div className="text-indigo-400 mt-1 font-bold">{generatedCoords}</div>
          </div>
        </div>
      )}
    </div>
  );
};
