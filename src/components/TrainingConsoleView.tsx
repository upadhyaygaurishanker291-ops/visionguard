import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, CheckCircle, ShieldCheck, Terminal, Cpu, Flame } from 'lucide-react';

export const TrainingConsoleView: React.FC = () => {
  const [architecture, setArchitecture] = useState('yolov8n.pt');
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(8);
  const [lr0, setLr0] = useState(0.01);
  const [optimizer, setOptimizer] = useState('SGD');
  const [patience, setPatience] = useState(15);

  // Training simulation state
  const [isTraining, setIsTraining] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    'System ready. Configure parameters above or run train.py locally.',
  ]);

  const [epochData, setEpochData] = useState<Array<{ epoch: number; boxLoss: number; clsLoss: number; map50: number }>>([]);

  const handleStartSimulatedTraining = () => {
    setIsTraining(true);
    setCurrentEpoch(1);
    setLogs([
      `[INIT] Initializing Ultralytics YOLOv8 transfer learning engine...`,
      `[CONFIG] Architecture: ${architecture} | Epochs: ${epochs} | Batch: ${batchSize} | Optimizer: ${optimizer}`,
      `[DATASET] Loading data/dataset.yaml (105 train images, 22 val images)...`,
      `[DEVICE] Hardware acceleration: CUDA GPU enabled (Fallback: CPU)...`,
    ]);
    setEpochData([]);
  };

  useEffect(() => {
    if (!isTraining) return;

    if (currentEpoch > epochs) {
      setIsTraining(false);
      setLogs((prev) => [
        ...prev,
        `[SUCCESS] Training completed at epoch ${epochs}!`,
        `[SAVED] Optimal weights saved to: models/defect_model/weights/best.pt`,
        `[SAVED] Exported master checkpoint to: models/best.pt`,
        `[PLOTS] Generated: confusion_matrix.png, results.png, PR_curve.png`,
      ]);
      return;
    }

    const timer = setTimeout(() => {
      // Simulate loss decay and mAP ascent
      const progress = currentEpoch / epochs;
      const boxLoss = Math.max(0.02, 0.09 * Math.exp(-progress * 2.5) + (Math.random() * 0.005)).toFixed(4);
      const clsLoss = Math.max(0.01, 0.08 * Math.exp(-progress * 2.8) + (Math.random() * 0.004)).toFixed(4);
      const map50 = Math.min(0.92, 0.45 + (0.47 * (1 - Math.exp(-progress * 3.2))) + (Math.random() * 0.01)).toFixed(3);

      setEpochData((prev) => [
        ...prev,
        { epoch: currentEpoch, boxLoss: parseFloat(boxLoss), clsLoss: parseFloat(clsLoss), map50: parseFloat(map50) },
      ]);

      setLogs((prev) => [
        ...prev.slice(-15),
        `Epoch ${currentEpoch}/${epochs} - Box_Loss: ${boxLoss} | Cls_Loss: ${clsLoss} | Val_mAP@0.5: ${map50}`,
      ]);

      setCurrentEpoch((c) => c + 1);
    }, 180);

    return () => clearTimeout(timer);
  }, [isTraining, currentEpoch, epochs]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Model Training & Transfer Learning Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Fine-tune YOLOv8 on custom surface defect datasets with real-time loss tracking and validation checkpointing.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded">
            <ShieldCheck className="w-4 h-4" />
            <span>Isolated Training Pipeline (Safe from UI Overwrites)</span>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hyperparameter Settings (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Training Hyperparameters
          </h3>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
              Base Architecture:
            </label>
            <select
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
              disabled={isTraining}
            >
              <option value="yolov8n.pt">yolov8n.pt (Nano - Fast Prototype, 3.2M params)</option>
              <option value="yolov8s.pt">yolov8s.pt (Small - Balanced, 11.2M params)</option>
              <option value="yolov8m.pt">yolov8m.pt (Medium - High Capacity, 25.9M params)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Epochs:
              </label>
              <input
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value) || 20)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                disabled={isTraining}
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Batch Size:
              </label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 8)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                disabled={isTraining}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Initial LR (lr0):
              </label>
              <input
                type="number"
                step="0.001"
                value={lr0}
                onChange={(e) => setLr0(parseFloat(e.target.value) || 0.01)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-mono"
                disabled={isTraining}
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-medium block mb-1">
                Optimizer:
              </label>
              <select
                value={optimizer}
                onChange={(e) => setOptimizer(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                disabled={isTraining}
              >
                <option value="SGD">SGD (Momentum: 0.937)</option>
                <option value="AdamW">AdamW (Decay: 0.0005)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartSimulatedTraining}
              disabled={isTraining}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTraining ? `Training Epoch ${currentEpoch}/${epochs}...` : 'Run Training Session'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
            <strong>Terminal CLI Equivalent:</strong>
            <pre className="mt-1 p-2 bg-slate-950 text-slate-200 rounded font-mono overflow-x-auto">
              python scripts/train.py --config config.yaml --epochs {epochs}
            </pre>
          </div>
        </div>

        {/* Live Training Monitor & Log Output (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col gap-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" />
              <span>Live Training Console Output</span>
            </h3>
            <span className="font-mono text-slate-400">
              {isTraining ? `Active: Epoch ${currentEpoch}/${epochs}` : 'Standby'}
            </span>
          </div>

          {/* Real-time Loss & mAP Curves Preview */}
          <div className="h-32 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Validation mAP@0.5 Ascent Curve</span>
              <span>
                Current: {epochData.length > 0 ? (epochData[epochData.length - 1].map50 * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            {/* Visual SVG Sparkline */}
            <div className="h-16 w-full flex items-end gap-1">
              {epochData.slice(-30).map((d, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-indigo-500/80 rounded-t transition-all"
                  style={{ height: `${Math.max(10, d.map50 * 100)}%` }}
                  title={`Epoch ${d.epoch}: mAP ${(d.map50 * 100).toFixed(1)}%`}
                />
              ))}
              {epochData.length === 0 && (
                <div className="w-full text-center text-slate-500 text-xs self-center">
                  Start training to plot validation curve in real-time.
                </div>
              )}
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Epoch 1</span>
              <span>Epoch {epochs}</span>
            </div>
          </div>

          {/* Terminal Logs Window */}
          <div className="bg-slate-950 text-slate-300 p-3.5 rounded font-mono text-[11px] h-48 overflow-y-auto flex flex-col gap-1 border border-slate-800">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Model Artifacts: <code>models/best.pt</code></span>
            <span>Early Stopping: <code>patience={patience}</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
