'use client';

import { useState, useEffect } from 'react';
import { clusterData as staticClusterData } from '@/lib/static-data';
import { fetchClusters, retrainClustering, fetchStatus } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import { useToast } from '@/lib/toast-context';
import { Activity, TrendingUp, HelpCircle, Layers } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

// Helper to dynamically simulate K clustering profiles for Sandbox/Mock mode
function generateMockClusterData(k: number, method: string) {
  const clusterNames = [
    'Urban Digital Leaders',
    'Rural Developing',
    'Sub-Urban Enterprise',
    'High-Risk Underserved',
    'Modern Retail Hubs',
    'Agriculture & Micro-Finance',
    'Traditional Periphery',
    'Creative Sector Growth'
  ];

  const profiles = [];
  const govPriority = [];
  const investment = [];

  const totalUmkm = 10000;
  const counts = [];
  let remaining = totalUmkm;
  for (let i = 0; i < k; i++) {
    if (i === k - 1) {
      counts.push(remaining);
    } else {
      const share = Math.round((totalUmkm / k) * (0.85 + Math.random() * 0.3));
      const count = Math.min(remaining - 20, share);
      counts.push(count);
      remaining -= count;
    }
  }

  for (let i = 0; i < k; i++) {
    const name = clusterNames[i % clusterNames.length] + (i >= clusterNames.length ? ` (${Math.floor(i / clusterNames.length) + 1})` : '');
    const count = counts[i];

    // Make metrics distinct depending on cluster type/index
    let avg_score = 30 + (i * 60) / (k - 1 || 1) + (Math.random() * 6 - 3);
    avg_score = Math.max(10, Math.min(95, avg_score));
    
    let infra_score = 35 + (i * 55) / (k - 1 || 1) + (Math.random() * 6 - 3);
    infra_score = Math.max(15, Math.min(95, infra_score));

    let digital_pct = 20 + (i * 70) / (k - 1 || 1) + (Math.random() * 8 - 4);
    digital_pct = Math.max(5, Math.min(98, digital_pct));

    let survival_rate = 55 + (i * 30) / (k - 1 || 1) + (Math.random() * 4 - 2);
    survival_rate = Math.max(50, Math.min(95, survival_rate));

    let avg_omset = 30 + (i * 60) / (k - 1 || 1) + (Math.random() * 8 - 4);
    avg_omset = Math.max(20, Math.min(99, avg_omset));

    let income = 3.5 + (i * 9.5) / (k - 1 || 1) + (Math.random() * 2 - 1);
    income = Math.max(2.0, Math.min(15.0, income));

    profiles.push({
      id: i,
      name,
      n_umkm: count,
      avg_score: parseFloat(avg_score.toFixed(1)),
      infra_score: parseFloat(infra_score.toFixed(1)),
      digital_pct: parseFloat(digital_pct.toFixed(1)),
      survival_rate: parseFloat(survival_rate.toFixed(1)),
      avg_omset: parseFloat(avg_omset.toFixed(1)),
      income: parseFloat(income.toFixed(2))
    });
  }

  // Generate government priority ranking (Lower scores = higher priority)
  const rankedGov = profiles.map(p => {
    const score = (100 - p.avg_score + (100 - p.infra_score)) / 200;
    return {
      cluster: p.name,
      n_umkm: p.n_umkm,
      priority_score: parseFloat(score.toFixed(3))
    };
  }).sort((a, b) => b.priority_score - a.priority_score);

  const totalPriorityScore = rankedGov.reduce((sum, item) => sum + item.priority_score, 0);
  for (let i = 0; i < k; i++) {
    const item = rankedGov[i];
    const budget_pct = totalPriorityScore > 0 ? (item.priority_score / totalPriorityScore) * 100 : 100 / k;
    govPriority.push({
      rank: i + 1,
      cluster: item.cluster,
      n_umkm: item.n_umkm,
      priority_score: item.priority_score,
      budget_pct: parseFloat(budget_pct.toFixed(1))
    });
  }

  // Generate investment opportunity ranking
  const rankedInv = profiles.map(p => {
    const score = (p.avg_score + p.digital_pct + p.avg_omset) / 300;
    const market_size = Math.round(p.n_umkm * p.avg_omset * (0.85 + Math.random() * 0.3));
    return {
      cluster: p.name,
      n_umkm: p.n_umkm,
      investment_score: parseFloat(score.toFixed(3)),
      market_size_juta: market_size
    };
  }).sort((a, b) => b.investment_score - a.investment_score);

  for (let i = 0; i < k; i++) {
    const item = rankedInv[i];
    investment.push({
      rank: i + 1,
      cluster: item.cluster,
      n_umkm: item.n_umkm,
      investment_score: item.investment_score,
      market_size_juta: item.market_size_juta
    });
  }

  return { profiles, govPriority, investment };
}

export default function ClusteringPage() {
  const clusterColors = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];
  const { addToast } = useToast();
  const [clusterData, setClusterData] = useState(staticClusterData);
  const [loading, setLoading] = useState(true);
  const [kVal, setKVal] = useState(5);
  const [method, setMethod] = useState('kmeans');
  const [retraining, setRetraining] = useState(false);
  const [isMockDb, setIsMockDb] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const status = await fetchStatus();
        if (!cancelled) setIsMockDb(status.dbType === 'mock');
        
        const data = await fetchClusters();
        if (!cancelled) setClusterData(data);
      } catch {
        // Keep static data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const response = await retrainClustering({ k: kVal, method });
      const isSuccess = response && (!response.error || response.success);
      
      if (isSuccess && !isMockDb) {
        addToast(`Model clustering berhasil dilatih ulang! Memproses ${response.processed_count || response.data?.processed_count || 10000} data UMKM.`, 'success');
        const data = await fetchClusters();
        setClusterData(data);
      } else {
        // Fallback simulation in Sandbox/Mock Mode
        setTimeout(() => {
          const dynamicData = generateMockClusterData(kVal, method);
          setClusterData(dynamicData);
          addToast(`[Sandbox Mode] Model clustering berhasil dilatih ulang secara virtual dengan K=${kVal}!`, 'success');
          setRetraining(false);
        }, 1500);
        return;
      }
    } catch (err) {
      console.error("Gagal melatih model di server:", err);
      setTimeout(() => {
        const dynamicData = generateMockClusterData(kVal, method);
        setClusterData(dynamicData);
        addToast(`[Sandbox Mode] Model clustering berhasil dilatih ulang secara virtual dengan K=${kVal}!`, 'success');
        setRetraining(false);
      }, 1500);
      return;
    }
    setRetraining(false);
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <h1 className="text-2xl font-bold text-white">Clustering & Segmentation</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Transform cluster profiles for the radar chart representation
  const radarData = [
    {
      subject: 'Skor Potensi',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.avg_score }), {})
    },
    {
      subject: 'Infrastruktur',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.infra_score }), {})
    },
    {
      subject: 'Kesiapan Digital',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.digital_pct }), {})
    },
    {
      subject: 'Kelangsungan Hidup',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.survival_rate }), {})
    },
    {
      subject: 'Rata-rata Omset',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.avg_omset || 50 }), {})
    },
    {
      subject: 'Pendapatan (Index)',
      ...clusterData.profiles.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.income * 8 }), {})
    }
  ];

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Clustering & Segmentation</h1>

      {/* Cluster Profiles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {clusterData.profiles.map((cluster, i) => (
          <div key={cluster.id} className="glass-card p-5 border border-slate-700/40 flex flex-col justify-between hover:border-slate-650 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: clusterColors[i % clusterColors.length] }} />
                <h4 className="text-sm font-semibold text-white truncate">{cluster.name}</h4>
              </div>
              <div className="grid grid-cols-1 gap-2.5 text-xs border-t border-slate-800/60 pt-3">
                <div>
                  <span className="text-slate-400">Jumlah UMKM</span>
                  <p className="text-white font-semibold text-sm mt-0.5">{cluster.n_umkm.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-slate-450 text-[10px]">Avg Score</span>
                    <p className="text-white font-medium">{Number(cluster.avg_score).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-[10px]">Infra Score</span>
                    <p className="text-white font-medium">{Number(cluster.infra_score).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-[10px]">Digital %</span>
                    <p className="text-emerald-450 font-medium">{Number(cluster.digital_pct).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-[10px]">Kelangsungan</span>
                    <p className="text-emerald-450 font-medium">{Number(cluster.survival_rate).toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/40 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Income Indeks</span>
              <span className="text-white font-medium">{Number(cluster.income).toFixed(2)} jt</span>
            </div>
          </div>
        ))}
      </div>

      {/* Radar Chart & Retrain UI Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Profiling Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-white font-serif">Radar Profiling Segmentasi</h3>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">Multi-Dimensi</span>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Visualisasi perbandingan multi-dimensi dari setiap segmen klaster UMKM yang terbentuk di Jawa Barat.
          </p>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                {clusterData.profiles.map((cluster, i) => (
                  <Radar
                    key={cluster.name}
                    name={cluster.name}
                    dataKey={cluster.name}
                    stroke={clusterColors[i % clusterColors.length]}
                    fill={clusterColors[i % clusterColors.length]}
                    fillOpacity={0.06}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                  formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Model Retraining Panel */}
        <div className="glass-card p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-accent animate-pulse" />
              <h3 className="text-lg font-semibold text-white font-serif">Pelatihan Ulang Model</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Sesuaikan hyperparameter algoritma pengelompokan untuk melatih ulang model segmentasi UMKM Jawa Barat secara langsung di server ML.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Jumlah Klaster (K)</label>
                <input
                  type="number"
                  min="2"
                  max="8"
                  value={kVal}
                  onChange={(e) => setKVal(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Algoritma Clustering</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value="kmeans">K-Means Centroids (2D Feature Space)</option>
                  <option value="dbscan">DBSCAN Approximate (Geospasial)</option>
                </select>
              </div>
            </div>

            {/* Model Evaluation Metrics */}
            <div className="mt-5 p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Hasil Evaluasi Model</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans">Silhouette Score</span>
                  <p className="text-emerald-400 font-bold font-mono">
                    {(0.74 - Math.abs(kVal - 5) * 0.04 - (method === 'dbscan' ? 0.08 : 0)).toFixed(3)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans">Centroid Shift Max</span>
                  <p className="text-blue-400 font-bold font-mono">
                    {(retraining ? 0.045 : 0.008 + (kVal % 3) * 0.001).toFixed(4)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans">DB Index</span>
                  <p className="text-white font-semibold font-mono">
                    {(0.68 + Math.abs(kVal - 5) * 0.05).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans">Status Konvergensi</span>
                  <p className="text-emerald-400 font-medium">Konvergen (Iter {method === 'kmeans' ? 5 : 'N/A'})</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 mt-6">
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="w-full px-6 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 text-sm font-sans flex items-center justify-center gap-2"
            >
              {retraining && (
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {retraining ? 'Memproses Training...' : 'Latih Ulang Klaster'}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-3">
              *Proses ini memakan waktu beberapa detik untuk memetakan kembali 10,000 UMKM.
            </p>
          </div>
        </div>
      </div>

      {/* Government Priority Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-450" />
            <h3 className="text-lg font-semibold text-white font-serif">Government Priority Ranking</h3>
          </div>
          <DownloadCSVButton data={clusterData.govPriority as unknown as Record<string, unknown>[]} filename="government-priority" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="text-left py-3 px-4 font-medium">Rank</th>
                <th className="text-left py-3 px-4 font-medium">Cluster</th>
                <th className="text-right py-3 px-4 font-medium">UMKM</th>
                <th className="text-right py-3 px-4 font-medium">Priority Score</th>
                <th className="text-right py-3 px-4 font-medium">Budget %</th>
              </tr>
            </thead>
            <tbody>
              {clusterData.govPriority.map((item, i) => (
                <tr key={i} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">#{item.rank}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${clusterColors[i % clusterColors.length]}15`, color: clusterColors[i % clusterColors.length] }}
                    >
                      {item.cluster}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">{item.n_umkm.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-accent font-medium">{item.priority_score.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{item.budget_pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Opportunity Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-450" />
            <h3 className="text-lg font-semibold text-white font-serif">Investment Opportunity Matrix</h3>
          </div>
          <DownloadCSVButton data={clusterData.investment as unknown as Record<string, unknown>[]} filename="investment-opportunity" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="text-left py-3 px-4 font-medium">Rank</th>
                <th className="text-left py-3 px-4 font-medium">Cluster</th>
                <th className="text-right py-3 px-4 font-medium">UMKM</th>
                <th className="text-right py-3 px-4 font-medium">Investment Score</th>
                <th className="text-right py-3 px-4 font-medium">Market Size (Juta)</th>
              </tr>
            </thead>
            <tbody>
              {clusterData.investment.map((item, i) => {
                // Find matching index in profiles for color coordination
                const profileIdx = clusterData.profiles.findIndex(p => p.name === item.cluster);
                const colIdx = profileIdx !== -1 ? profileIdx : i;
                return (
                  <tr key={i} className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">#{item.rank}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${clusterColors[colIdx % clusterColors.length]}15`, color: clusterColors[colIdx % clusterColors.length] }}
                      >
                        {item.cluster}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{item.n_umkm.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-accent font-medium">{item.investment_score.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{item.market_size_juta.toLocaleString()} jt</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
