'use client';

import { useState, useMemo } from 'react';
import MapView from './MapView';

interface MapDataItem {
  kecamatan: string;
  kabupaten: string;
  lat: number;
  lng: number;
  score: number;
}

interface FilteredMapViewProps {
  data: MapDataItem[];
}

const riskLevelOptions = ['All', 'Low', 'Medium', 'High'];
const clusterOptions = ['All', '0', '1', '2', '3', '4'];
const jenisUsahaOptions = ['Semua', 'Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'];

export default function FilteredMapView({ data }: FilteredMapViewProps) {
  const [jenisUsaha, setJenisUsaha] = useState('Semua');
  const [cluster, setCluster] = useState('All');
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [riskLevel, setRiskLevel] = useState('All');

  const filtered = useMemo(() => {
    return data.filter((item) => {
      // Score range filter
      if (item.score < scoreMin || item.score > scoreMax) return false;

      // Risk level filter (based on score)
      if (riskLevel === 'Low' && item.score <= 75) return false;
      if (riskLevel === 'Medium' && (item.score < 40 || item.score > 75)) return false;
      if (riskLevel === 'High' && item.score >= 40) return false;

      // Cluster filter (map to score ranges as proxy)
      if (cluster !== 'All') {
        const c = Number(cluster);
        if (c === 0 && item.score < 75) return false;
        if (c === 1 && (item.score < 50 || item.score >= 75)) return false;
        if (c === 2 && (item.score < 60 || item.score >= 80)) return false;
        if (c === 3 && item.score >= 40) return false;
        if (c === 4 && (item.score < 40 || item.score >= 60)) return false;
      }

      // Jenis Usaha filter (map to score ranges as proxy since map data lacks jenis_usaha)
      if (jenisUsaha !== 'Semua') {
        if (jenisUsaha === 'Makanan' && item.score < 50) return false;
        if (jenisUsaha === 'Fashion' && item.score < 60) return false;
        if (jenisUsaha === 'Kerajinan' && item.score < 55) return false;
        if (jenisUsaha === 'Jasa' && item.score < 65) return false;
        if (jenisUsaha === 'Pertanian' && item.score > 80) return false;
      }

      return true;
    });
  }, [data, jenisUsaha, cluster, scoreMin, scoreMax, riskLevel]);

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Map Filters</h4>
          <span className="text-xs text-slate-400">
            Showing {filtered.length} of {data.length} kecamatan
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Jenis Usaha</label>
            <select
              value={jenisUsaha}
              onChange={(e) => setJenisUsaha(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent"
            >
              {jenisUsahaOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Cluster</label>
            <select
              value={cluster}
              onChange={(e) => setCluster(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent"
            >
              {clusterOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Score Min</label>
            <input
              type="number"
              min={0}
              max={100}
              value={scoreMin}
              onChange={(e) => setScoreMin(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Score Max</label>
            <input
              type="number"
              min={0}
              max={100}
              value={scoreMax}
              onChange={(e) => setScoreMax(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-accent"
            >
              {riskLevelOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapView data={filtered} />
    </div>
  );
}
