import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Maximize2, 
  Camera, 
  RefreshCw, 
  Sliders, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert,
  Sparkles,
  Scan
} from 'lucide-react';
import { BENCHMARK_SAMPLES } from '../data/benchmarkSamples';
import { BenchmarkSample, DefectDetection, SeverityWeights, ClassHazardWeights } from '../types/inspection';
import { 
  computeSeverity, 
  DEFAULT_WEIGHTS, 
  DEFAULT_CLASS_HAZARD, 
  exportJSONReport, 
  exportCSVReport 
} from '../utils/defectEngine';
import { analyzeUploadedImage } from '../utils/imageAnalyzer';

interface InspectionStationProps {
  onRecordInspection: (record: any) => void;
}

export const InspectionStation: React.FC<InspectionStationProps> = ({ onRecordInspection }) => {
  const [selectedSample, setSelectedSample] = useState<BenchmarkSample>(BENCHMARK_SAMPLES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('Uploaded Specimen');
  const [detections, setDetections] = useState<DefectDetection[]>(BENCHMARK_SAMPLES[0].defaultDetections);
  const [analysisSummary, setAnalysisSummary] = useState<string>('Machined aluminium flange inspected with 1 surface scratch.');
  const [analysisSource, setAnalysisSource] = useState<string>('benchmark');
  
  // Loading & Scanning state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  // View controls
  const [showBoxes, setShowBoxes] = useState(true);
  const [showMasks, setShowMasks] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'view' | 'tuner'>('view');

  // Severity Heuristic Weights
  const [weights, setWeights] = useState<SeverityWeights>(DEFAULT_WEIGHTS);
  const [hazardWeights, setHazardWeights] = useState<ClassHazardWeights>(DEFAULT_CLASS_HAZARD);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active image URL & title
  const currentImageUrl = customImage || selectedSample.imageUrl;
  const currentTitle = customImage ? customTitle : selectedSample.title;

  // Filtered detections based on confidence threshold
  const filteredDetections = detections.filter(d => d.confidence >= confThreshold);

  // Real-time Severity calculation
  const severity = computeSeverity(filteredDetections, weights, hazardWeights);

  // When sample is selected from benchmarks
  const handleSelectSample = (sample: BenchmarkSample) => {
    setSelectedSample(sample);
    setCustomImage(null);
    setDetections(sample.defaultDetections);
    setAnalysisSummary(sample.description);
    setAnalysisSource('benchmark');
    setZoomLevel(1);
  };

  // Process uploaded image file
  const processImageFile = async (file: File) => {
    if (!file.type.match('image.*')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP, BMP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      setCustomImage(dataUrl);
      setCustomTitle(file.name);
      setIsAnalyzing(true);
      setZoomLevel(1);

      try {
        // Run AI / Computer Vision defect analysis
        const result = await analyzeUploadedImage(dataUrl);
        setDetections(result.detections);
        setAnalysisSummary(result.summary);
        setAnalysisSource(result.source);
      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle standard file picker
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Record inspection to history on inspection load
  useEffect(() => {
    if (!isAnalyzing) {
      onRecordInspection({
        id: `insp-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        sampleName: currentTitle,
        severity,
        detections: filteredDetections,
        inferenceTimeMs: 14.8,
        imageUrl: currentImageUrl,
      });
    }
  }, [currentTitle, filteredDetections.length, severity.severity_score, isAnalyzing]);

  // Render annotated canvas for download
  const handleDownloadAnnotated = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Draw annotations
      filteredDetections.forEach((d) => {
        const x1 = (d.bbox[0] / 100) * img.width;
        const y1 = (d.bbox[1] / 100) * img.height;
        const x2 = (d.bbox[2] / 100) * img.width;
        const y2 = (d.bbox[3] / 100) * img.height;
        const w = x2 - x1;
        const h = y2 - y1;

        // Semi-transparent mask
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(x1, y1, w, h);

        // Bounding box border
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = Math.max(2, Math.round(img.width / 300));
        ctx.strokeRect(x1, y1, w, h);

        // Label banner
        ctx.fillStyle = '#ef4444';
        const labelText = `${d.class_name} | Conf: ${(d.confidence * 100).toFixed(0)}% (Area: ${d.area_percentage}%)`;
        const fontSize = Math.max(14, Math.round(img.width / 50));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textWidth = ctx.measureText(labelText).width;
        const bannerHeight = fontSize + 10;
        ctx.fillRect(x1, Math.max(0, y1 - bannerHeight), textWidth + 12, bannerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x1 + 6, Math.max(fontSize, y1 - 6));
      });

      // Top banner
      const topBannerHeight = Math.max(38, Math.round(img.height / 20));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, img.width, topBannerHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(topBannerHeight * 0.45)}px monospace`;
      ctx.fillText(
        `VisionGuard QC | Verdict: ${severity.severity_grade} (Score: ${severity.severity_score}/100) | Flaws: ${severity.defect_count}`,
        16,
        Math.round(topBannerHeight * 0.65)
      );

      // Trigger download
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `visionguard_annotated_${Date.now()}.png`;
      a.click();
    };
    img.src = currentImageUrl;
  };

  // Grade color theme
  const getGradeTheme = (grade: string) => {
    switch (grade) {
      case 'Safe':
        return { 
          text: 'text-emerald-700 dark:text-emerald-400', 
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          badge: 'bg-emerald-600 text-white' 
        };
      case 'Minor Defect':
        return { 
          text: 'text-amber-700 dark:text-amber-400', 
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
          badge: 'bg-amber-600 text-white' 
        };
      case 'Moderate Defect':
        return { 
          text: 'text-orange-700 dark:text-orange-400', 
          bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
          badge: 'bg-orange-600 text-white' 
        };
      case 'Critical Defect':
      default:
        return { 
          text: 'text-rose-700 dark:text-rose-400', 
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          badge: 'bg-rose-600 text-white' 
        };
    }
  };

  const gradeTheme = getGradeTheme(severity.severity_grade);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* PROMINENT USER INPUT & PROTOTYPE UPLOAD ZONE */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-4 ring-indigo-500/20' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 hover:border-slate-400'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Input Image for Automated Defect Inspection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Drag and drop your specimen image here, click browse, or select from benchmark samples below.
              </p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span>Supports JPG, PNG, WEBP</span>
                <span>·</span>
                <span>YOLOv8 Localization</span>
                <span>·</span>
                <span>Real-time Severity Scoring</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Image File</span>
            </button>
          </div>
        </div>

        {/* Quick Test Benchmarks Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            Or test instant benchmark specimens:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {BENCHMARK_SAMPLES.map((sample) => {
              const isSelected = !customImage && selectedSample.id === sample.id;
              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {sample.title.split('—')[0].trim()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* INSPECTION OUTPUT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Output Canvas (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
            {/* Viewport Header Controls */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2.5 truncate max-w-sm">
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentTitle}
                </span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-[11px]">
                  {customImage ? 'User Upload' : selectedSample.category}
                </span>
              </div>

              {/* View Overlay Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    showBoxes ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Boxes
                </button>
                <button
                  onClick={() => setShowMasks(!showMasks)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    showMasks ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Masks
                </button>
                <button
                  onClick={() => setShowLabels(!showLabels)}
                  className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    showLabels ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Labels
                </button>
                <button
                  onClick={() => setZoomLevel(zoomLevel === 1 ? 1.4 : 1)}
                  className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  title="Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Viewport Canvas Area with Scanning Effect */}
            <div className="relative bg-slate-950 flex items-center justify-center min-h-[380px] max-h-[520px] overflow-hidden select-none">
              {/* Scanning Animation Overlay when analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs">
                  <div className="flex flex-col items-center gap-3">
                    <Scan className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-white text-xs font-mono tracking-wider font-semibold">
                      ANALYZING OPTICAL PROFILE & DEFECT FEATURES...
                    </span>
                  </div>
                  <div className="absolute inset-x-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-bounce" />
                </div>
              )}

              <div 
                className="relative inline-block transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={currentImageUrl}
                  alt={currentTitle}
                  className="max-h-[500px] w-auto object-contain block mx-auto"
                />

                {/* Overlaid Bounding Boxes */}
                {!isAnalyzing && filteredDetections.map((det) => {
                  const left = `${det.bbox[0]}%`;
                  const top = `${det.bbox[1]}%`;
                  const width = `${det.bbox[2] - det.bbox[0]}%`;
                  const height = `${det.bbox[3] - det.bbox[1]}%`;

                  return (
                    <div
                      key={det.id}
                      className="absolute transition-all"
                      style={{ left, top, width, height }}
                    >
                      {/* Semi-transparent defect region mask */}
                      {showMasks && (
                        <div className="absolute inset-0 bg-rose-500/25 border border-rose-400" />
                      )}

                      {/* Bounding box outline */}
                      {showBoxes && (
                        <div className="absolute inset-0 border-2 border-rose-500 ring-1 ring-white/50" />
                      )}

                      {/* Floating defect label tag */}
                      {showLabels && (
                        <div className="absolute -top-6 left-0 bg-rose-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-xs whitespace-nowrap shadow-sm flex items-center gap-1.5">
                          <span>{det.class_name}</span>
                          <span className="opacity-90 font-mono">{(det.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {!isAnalyzing && filteredDetections.length === 0 && (
                <div className="absolute bottom-4 left-4 bg-emerald-900/90 text-emerald-100 text-xs px-3 py-1.5 rounded border border-emerald-700/60 shadow">
                  No defect detected by the model
                </div>
              )}
            </div>

            {/* Viewport Bottom Controls */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Confidence Cutoff:</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  className="w-28 accent-indigo-600"
                />
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  {(confThreshold * 100).toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadAnnotated}
                  className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Output Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-800 dark:text-slate-200">Optical Inspection Finding:</strong> {analysisSummary}
            </div>
          </div>
        </div>

        {/* Right Column: Output Verdict & Telemetry (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Main Inspection Verdict Card */}
          <div className={`p-5 rounded-xl border ${gradeTheme.bg} flex flex-col gap-4 shadow-xs`}>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Inspection Verdict
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {severity.defect_count} flaw{severity.defect_count === 1 ? '' : 's'} localized
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h3 className={`text-2xl font-bold tracking-tight ${gradeTheme.text}`}>
                  {severity.severity_grade}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {severity.severity_grade === 'Safe' 
                    ? 'Specimen passes inspection within mechanical tolerance.'
                    : severity.severity_grade === 'Critical Defect'
                    ? 'Critical defect: reject part immediately.'
                    : 'Inspection tolerance exceeded: rework required.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {severity.severity_score}
                </span>
                <span className="text-xs text-slate-400 block font-mono">/ 100</span>
              </div>
            </div>

            {/* Severity Meter */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  severity.severity_score < 20 
                    ? 'bg-emerald-500' 
                    : severity.severity_score < 50 
                    ? 'bg-amber-500' 
                    : severity.severity_score < 80 
                    ? 'bg-orange-500' 
                    : 'bg-rose-600'
                }`}
                style={{ width: `${Math.min(100, severity.severity_score)}%` }}
              />
            </div>

            {/* Numerical Telemetry Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Area Coverage</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {severity.area_percentage_total}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Flaw Count</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  {severity.defect_count}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Primary Hazard</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {severity.max_hazard_class}
                </span>
              </div>
            </div>
          </div>

          {/* Details Table & Formula Tuner Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                  activeTab === 'view'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Defect Details Table ({filteredDetections.length})
              </button>
              <button
                onClick={() => setActiveTab('tuner')}
                className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                  activeTab === 'tuner'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Severity Formula Settings
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'view' ? (
                <div>
                  {filteredDetections.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      No defects meet the active confidence cutoff.
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {filteredDetections.map((d, index) => (
                        <div key={d.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>#{index + 1} {d.class_name}</span>
                            </div>
                            <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                              Area: {d.area_percentage}% · BBox: [{d.bbox.join(', ')}]%
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold tabular-nums">
                              {(d.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="text-slate-500 text-[11px] leading-relaxed mb-1">
                    Adjust heuristic weights to customize severity sensitivity:
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                      <span>Area Weight (W_area):</span>
                      <span className="font-mono font-semibold">{weights.area_weight}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={weights.area_weight}
                      onChange={(e) => setWeights({ ...weights, area_weight: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                      <span>Count Multiplicity Weight (W_count):</span>
                      <span className="font-mono font-semibold">{weights.count_weight}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.05"
                      value={weights.count_weight}
                      onChange={(e) => setWeights({ ...weights, count_weight: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                      <span>Defect Type Hazard Weight (W_type):</span>
                      <span className="font-mono font-semibold">{weights.type_weight}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.6"
                      step="0.05"
                      value={weights.type_weight}
                      onChange={(e) => setWeights({ ...weights, type_weight: parseFloat(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setWeights(DEFAULT_WEIGHTS);
                      setHazardWeights(DEFAULT_CLASS_HAZARD);
                    }}
                    className="mt-2 py-1.5 px-3 text-center text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    Reset Factory Defaults
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Report Export Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportJSONReport(currentTitle, severity, filteredDetections)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Download JSON Record</span>
            </button>
            <button
              onClick={() => exportCSVReport(currentTitle, severity, filteredDetections)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Download CSV Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
