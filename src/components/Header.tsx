import React from 'react';
import { Download } from 'lucide-react';
import { downloadPythonZip } from '../utils/defectEngine';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPythonZip();
    } finally {
      setDownloading(false);
    }
  };

  const navItems = [
    { id: 'inspect', label: 'Inspection' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'evaluation', label: 'Model Evaluation' },
    { id: 'dataset', label: 'Dataset Studio' },
    { id: 'training', label: 'Training' },
    { id: 'code', label: 'Python Source' },
    { id: 'presentation', label: 'Defense Guide' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white shrink-0 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => onTabChange('inspect')}
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span>
        <span>VisionGuard AOI</span>
      </div>

      {/* Zone 2: Clean single-line text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 text-xs uppercase tracking-wider ${
              currentTab === item.id
                ? 'text-white border-indigo-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 active:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? 'Exporting...' : 'Export Python Zip'}</span>
        </button>
      </div>
    </header>
  );
};
