'use client';
 
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Map, Layers } from 'lucide-react';
 
const MapInner = dynamic(() => import('./MapInner'), { ssr: false });
 
interface MapViewProps {
  data: { kecamatan: string; kabupaten: string; lat: number; lng: number; score: number }[];
  activeLegendFilters?: string[];
  onToggleLegendFilter?: (label: string) => void;
}
 
const legendItems = [
  { color: '#EF4444', label: '< 40', name: 'very_low' },
  { color: '#F59E0B', label: '40-60', name: 'low' },
  { color: '#EAB308', label: '60-75', name: 'medium' },
  { color: '#10B981', label: '> 75', name: 'high' },
];
 
export default function MapView({ data, activeLegendFilters = [], onToggleLegendFilter }: MapViewProps) {
  const [visMode, setVisMode] = useState<'pin' | 'heatmap'>('pin');

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Peta Skor Potensi Kecamatan</h3>
          <p className="text-xs text-slate-400">Peta sebaran wilayah potensial UMKM</p>
        </div>
        
        {/* Toggle Mode Visualisasi */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg self-start">
          <button
            onClick={() => setVisMode('pin')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visMode === 'pin'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Pin Standard</span>
          </button>
          <button
            onClick={() => setVisMode('heatmap')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              visMode === 'heatmap'
                ? 'bg-accent/90 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="flex items-center gap-0.5">
              <span>Heatmap Density</span>
              <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
            </span>
          </button>
        </div>
      </div>

      <div className="relative h-[450px] rounded-lg overflow-hidden border border-slate-800 shadow-inner">
        <MapInner data={data} visualizationMode={visMode} />
        
        {/* Legend Interaktif */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl max-w-[160px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Legend</p>
          <div className="space-y-2">
            {legendItems.map((item) => {
              const isExcluded = activeLegendFilters.includes(item.name);
              return (
                <button
                  key={item.label}
                  onClick={() => onToggleLegendFilter?.(item.name)}
                  className={`flex items-center gap-2.5 w-full text-left transition-all ${
                    isExcluded ? 'opacity-30 line-through scale-95' : 'hover:translate-x-1'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-md shadow-md flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-300 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[8px] text-slate-500 mt-2.5 text-center italic">Klik untuk memfilter peta</p>
        </div>
      </div>
    </div>
  );
}
