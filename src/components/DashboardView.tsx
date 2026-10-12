import React from 'react';
import { InspectionRecord } from '../types/inspection';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert, Cpu, BarChart3, Clock } from 'lucide-react';

interface DashboardViewProps {
  records: InspectionRecord[];
  onSelectRecord: (record: InspectionRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ records }) => {
  const totalInspected = records.length;
  const safeCount = records.filter(r => r.severity.severity_grade === 'Safe').length;
  const minorCount = records.filter(r => r.severity.severity_grade === 'Minor Defect').length;
  const moderateCount = records.filter(r => r.severity.severity_grade === 'Moderate Defect').length;
  const criticalCount = records.filter(r => r.severity.severity_grade === 'Critical Defect').length;
  const totalDefects = records.reduce((sum, r) => sum + r.severity.defect_count, 0);

  const defectClassesCount: Record<string, number> = {
    Scratch: 0,
    Crack: 0,
    Dent: 0,
    Stain: 0,
    Hole: 0,
    'Other Defect': 0,
  };

  records.forEach(r => {
    r.detections.forEach(d => {
      if (defectClassesCount[d.class_name] !== undefined) {
        defectClassesCount[d.class_name]++;
      }
    });
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              VisionGuard Inspection Operations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Automated optical quality control station performing real-time defect localization, geometric area profiling, and multi-attribute severity grading.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>YOLOv8 Nano (640px)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Inference: ~14.8ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
            Total Inspected
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {totalInspected}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Session active records</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold block mb-1">
            Passed (Safe)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {safeCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {totalInspected > 0 ? `${((safeCount / totalInspected) * 100).toFixed(0)}% yield` : '0%'}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold block mb-1">
            Rework Required
          </span>
          <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {minorCount + moderateCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Minor & moderate tiers</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <span className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider font-semibold block mb-1">
            Critical Flaws
          </span>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {criticalCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Immediate part rejection</span>
        </div>
      </div>

      {/* Severity & Class Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Severity Tier Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">0–100 Scale</span>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Safe (0–19):</span>
                <span className="font-mono font-semibold">{safeCount} ({totalInspected ? ((safeCount / totalInspected) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${totalInspected ? (safeCount / totalInspected) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Minor Defect (20–49):</span>
                <span className="font-mono font-semibold">{minorCount} ({totalInspected ? ((minorCount / totalInspected) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${totalInspected ? (minorCount / totalInspected) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Moderate Defect (50–79):</span>
                <span className="font-mono font-semibold">{moderateCount} ({totalInspected ? ((moderateCount / totalInspected) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: `${totalInspected ? (moderateCount / totalInspected) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Critical Defect (80–100):</span>
                <span className="font-mono font-semibold">{criticalCount} ({totalInspected ? ((criticalCount / totalInspected) * 100).toFixed(0) : 0}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-600 h-full" style={{ width: `${totalInspected ? (criticalCount / totalInspected) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Defect Category Counts */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Detected Flaw Taxonomy Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">{totalDefects} total flaws</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries(defectClassesCount).map(([name, count]) => (
              <div key={name} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-500 block truncate">{name}</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inspection Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Inspection Sequence
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-time Station Log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Specimen Sample</th>
                <th className="py-2.5 px-4 font-semibold">Verdict</th>
                <th className="py-2.5 px-4 font-semibold text-right">Severity Score</th>
                <th className="py-2.5 px-4 font-semibold text-right">Flaws</th>
                <th className="py-2.5 px-4 font-semibold text-right">Area %</th>
                <th className="py-2.5 px-4 font-semibold text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {records.slice(-8).reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono text-slate-400">{r.timestamp}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                    {r.sampleName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`font-semibold ${
                      r.severity.severity_grade === 'Safe' 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : r.severity.severity_grade === 'Critical Defect'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {r.severity.severity_grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right font-bold tabular-nums">
                    {r.severity.severity_score}/100
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums">
                    {r.severity.defect_count}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right tabular-nums">
                    {r.severity.area_percentage_total}%
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right text-slate-400 tabular-nums">
                    {r.inferenceTimeMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
