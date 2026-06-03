'use client';

import dynamic from 'next/dynamic';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

interface MapViewProps {
  data: { kecamatan: string; kabupaten: string; lat: number; lng: number; score: number }[];
}

const legendItems = [
  { color: '#EF4444', label: '< 40' },
  { color: '#F59E0B', label: '40-60' },
  { color: '#EAB308', label: '60-75' },
  { color: '#10B981', label: '> 75' },
];

export default function MapView({ data }: MapViewProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Peta Skor Potensi Kecamatan</h3>
      <div className="relative h-[450px] rounded-lg overflow-hidden">
        <MapInner data={data} />
        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-300 mb-2">Score Legend</p>
          <div className="space-y-1.5">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
