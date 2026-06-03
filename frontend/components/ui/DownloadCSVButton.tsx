'use client';

import { Download } from 'lucide-react';
import { downloadCSV } from '@/lib/csv-export';

interface DownloadCSVButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  label?: string;
}

export default function DownloadCSVButton({ data, filename, label }: DownloadCSVButtonProps) {
  return (
    <button
      onClick={() => downloadCSV(data, filename)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 hover:text-white transition-colors"
      title={label || `Download ${filename}`}
    >
      <Download className="w-3.5 h-3.5" />
      {label || 'CSV'}
    </button>
  );
}
