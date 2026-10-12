import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Folder, FileText } from 'lucide-react';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';
import { downloadPythonZip } from '../utils/defectEngine';

export const CodeExportView: React.FC = () => {
  const fileKeys = Object.keys(PYTHON_PROJECT_FILES);
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const activeContent = PYTHON_PROJECT_FILES[selectedFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPythonZip();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              VisionGuard Python Repository & Code Inspector
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Complete, production-ready Python codebase adhering to PEP-8 standards with full type hints, modular source packages, and unit tests.
            </p>
          </div>
          <div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Packing Zip...' : 'Download Full Project (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* File Tree Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col gap-2 text-xs">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-2 px-2">
            Project Tree Structure:
          </span>

          <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto">
            {fileKeys.map((filename) => {
              const isSelected = selectedFile === filename;
              return (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer font-mono text-[12px] ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{filename}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Content Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-300 font-semibold">
              visionguard/{selectedFile}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Viewer */}
          <div className="p-4 text-slate-300 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed select-text">
            <pre>
              <code>{activeContent}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
