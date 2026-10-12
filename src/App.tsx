import React, { useState } from 'react';
import { Header } from './components/Header';
import { InspectionStation } from './components/InspectionStation';
import { DashboardView } from './components/DashboardView';
import { ModelEvaluationView } from './components/ModelEvaluationView';
import { DatasetManagementView } from './components/DatasetManagementView';
import { TrainingConsoleView } from './components/TrainingConsoleView';
import { CodeExportView } from './components/CodeExportView';
import { PresentationGuideView } from './components/PresentationGuideView';
import { InspectionRecord } from './types/inspection';
import { BENCHMARK_SAMPLES } from './data/benchmarkSamples';
import { computeSeverity } from './utils/defectEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('inspect');

  // Initial inspection history populated with benchmark samples
  const [inspectionHistory, setInspectionHistory] = useState<InspectionRecord[]>(() => {
    return BENCHMARK_SAMPLES.map((sample, idx) => ({
      id: `record-init-${idx}`,
      timestamp: new Date(Date.now() - (idx * 180000)).toLocaleTimeString(),
      sampleName: sample.title,
      severity: computeSeverity(sample.defaultDetections),
      detections: sample.defaultDetections,
      inferenceTimeMs: 14.2 + (idx * 0.4),
      imageUrl: sample.imageUrl,
    }));
  });

  const handleRecordInspection = (newRecord: InspectionRecord) => {
    setInspectionHistory((prev) => {
      // Avoid duplicate consecutive identical timestamps
      if (prev.length > 0 && prev[prev.length - 1].sampleName === newRecord.sampleName) {
        return prev;
      }
      return [...prev.slice(-49), newRecord];
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="flex-1 flex flex-col">
        {currentTab === 'inspect' && (
          <InspectionStation onRecordInspection={handleRecordInspection} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView records={inspectionHistory} onSelectRecord={() => setCurrentTab('inspect')} />
        )}

        {currentTab === 'evaluation' && (
          <ModelEvaluationView />
        )}

        {currentTab === 'dataset' && (
          <DatasetManagementView />
        )}

        {currentTab === 'training' && (
          <TrainingConsoleView />
        )}

        {currentTab === 'code' && (
          <CodeExportView />
        )}

        {currentTab === 'presentation' && (
          <PresentationGuideView />
        )}
      </main>

      {/* Clean quiet footer per Anti-slop guidelines */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">VisionGuard AOI</span>
          <span>·</span>
          <span>YOLOv8 Computer Vision & Severity Scoring Engine</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Python 3.11+</span>
          <span>·</span>
          <span>PyTorch / Ultralytics</span>
          <span>·</span>
          <span>Streamlit</span>
          <span>·</span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  );
}
