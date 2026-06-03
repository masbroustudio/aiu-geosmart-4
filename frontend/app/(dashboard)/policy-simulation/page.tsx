'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Target, ArrowUpRight, Wallet } from 'lucide-react';
import { policyData as staticPolicyData, clusterData } from '@/lib/static-data';
import { fetchPolicy } from '@/lib/api';

const RECOMMENDED_ALLOCATIONS = clusterData.govPriority.map(c => c.budget_pct);

export default function PolicySimulationPage() {
  const [policyData, setPolicyData] = useState(staticPolicyData);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<number[]>(RECOMMENDED_ALLOCATIONS);
  const [totalBudget, setTotalBudget] = useState(100_000_000_000);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await fetchPolicy();
        if (!cancelled) {
          setPolicyData(data);
        }
      } catch {
        // Keep static data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <h1 className="text-2xl font-bold text-white">Policy Simulation</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-slate-700 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Policy Simulation</h1>

      {/* Policy Impact Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {policyData.impacts.map((impact, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h4 className="text-sm font-semibold text-white">{impact.policy}</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">{impact.target}</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Avg Improvement</span>
                <span className="text-sm font-bold text-accent">+{impact.avgImprovement.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">% Improved</span>
                <span className="text-sm font-medium text-slate-200">{impact.pctImproved}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">New Above 70</span>
                <span className="text-sm font-medium text-emerald-400">+{impact.newAbove70}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Additional Survivors</span>
                <span className="text-sm font-medium text-blue-400">+{impact.additionalSurvivors}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Budget Allocation Simulator */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Simulator Alokasi Anggaran</h3>
        </div>

        {/* Total Budget Input */}
        <div className="mb-6">
          <label className="block text-sm text-slate-400 mb-2">Total Anggaran (Rp)</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
            className="w-full md:w-80 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-slate-400 mt-1">
            Rp {totalBudget.toLocaleString('id-ID')}
          </p>
        </div>

        {/* Invalid allocation warning */}
        {allocations.reduce((sum, v) => sum + v, 0) !== 100 && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">Alokasi harus 100% untuk prediksi yang valid</p>
          </div>
        )}

        {/*
          Budget Allocation Formula Assumptions:
          ----------------------------------------
          predicted_umkm_improved = allocated / 50_000_000 * priority_score * n_umkm / 1000
            - 50M (Rp 50,000,000) = estimated cost per UMKM intervention program
            - priority_score = cluster-specific impact multiplier derived from ML clustering
            - n_umkm / 1000 = normalized cluster size factor

          predicted_new_jobs = predicted_umkm_improved * 2.5
            - 2.5 = average job creation multiplier per improved UMKM (BPS 2023 estimate)

          predicted_score_increase = (allocated / totalBudget) * 15 * priority_score
            - 15 = maximum score improvement ceiling (out of 100-point scale)

          roi = predicted_umkm_improved * 12_000_000 / allocated * 100
            - 12M (Rp 12,000,000) = estimated annual revenue increase per improved UMKM
        */}

        {/* Cluster Allocation Sliders */}
        <div className="space-y-4 mb-6">
          {clusterData.govPriority.map((cluster, idx) => {
            const pct = allocations[idx];
            const allocated = totalBudget * (pct / 100);
            const predicted_umkm_improved = Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
            const predicted_new_jobs = Math.round(predicted_umkm_improved * 2.5);
            const predicted_score_increase = totalBudget > 0 ? ((allocated / totalBudget) * 15 * cluster.priority_score).toFixed(1) : '0.0';
            const roi = allocated > 0 ? (predicted_umkm_improved * 12_000_000 / allocated * 100).toFixed(0) : '0';

            return (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="lg:w-1/4">
                    <p className="text-sm font-medium text-white">{cluster.cluster}</p>
                    <p className="text-xs text-slate-400">{cluster.n_umkm.toLocaleString()} UMKM</p>
                  </div>
                  <div className="lg:w-1/4 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={pct}
                      onChange={(e) => {
                        const newAllocations = [...allocations];
                        newAllocations[idx] = Number(e.target.value);
                        setAllocations(newAllocations);
                      }}
                      className="flex-1 accent-emerald-500 h-2 rounded-lg cursor-pointer"
                    />
                    <span className="text-sm font-mono text-white w-12 text-right">{pct}%</span>
                  </div>
                  <div className="lg:w-1/4">
                    <p className="text-xs text-slate-400">Alokasi</p>
                    <p className="text-sm font-medium text-white">Rp {allocated.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`lg:w-1/4 grid grid-cols-2 gap-2${allocations.reduce((sum, v) => sum + v, 0) !== 100 ? ' opacity-50' : ''}`}>
                    <div>
                      <p className="text-xs text-slate-400">UMKM Meningkat</p>
                      <p className="text-sm font-medium text-emerald-400">+{predicted_umkm_improved}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Lapangan Kerja</p>
                      <p className="text-sm font-medium text-emerald-400">+{predicted_new_jobs}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Skor +</p>
                      <p className="text-sm font-medium text-emerald-400">+{predicted_score_increase}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">ROI</p>
                      <p className="text-sm font-medium text-emerald-400">{roi}%</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation */}
        {(() => {
          const totalPct = allocations.reduce((sum, v) => sum + v, 0);
          const totalImproved = clusterData.govPriority.reduce((sum, cluster, idx) => {
            const allocated = totalBudget * (allocations[idx] / 100);
            return sum + Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
          }, 0);
          const totalJobs = clusterData.govPriority.reduce((sum, cluster, idx) => {
            const allocated = totalBudget * (allocations[idx] / 100);
            const improved = Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
            return sum + Math.round(improved * 2.5);
          }, 0);
          const avgScoreIncrease = totalBudget > 0
            ? (clusterData.govPriority.reduce((sum, cluster, idx) => {
                const allocated = totalBudget * (allocations[idx] / 100);
                return sum + (allocated / totalBudget) * 15 * cluster.priority_score;
              }, 0) / clusterData.govPriority.length).toFixed(1)
            : '0.0';

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">Total Alokasi:</span>
                <span className={`text-sm font-bold ${totalPct === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {totalPct}%
                </span>
                {totalPct !== 100 && (
                  <span className="text-xs text-red-400">
                    Total alokasi harus 100%
                  </span>
                )}
              </div>

              {/* Summary */}
              <p className={`text-sm text-slate-200${totalPct !== 100 ? ' opacity-50' : ''}`}>
                Dengan alokasi ini, diperkirakan <span className="font-bold text-emerald-400">{totalImproved}</span> UMKM akan meningkat skornya rata-rata <span className="font-bold text-emerald-400">{avgScoreIncrease}</span> poin, menciptakan <span className="font-bold text-emerald-400">{totalJobs}</span> lapangan kerja baru
              </p>

              {/* Reset Button */}
              <button
                onClick={() => setAllocations([...RECOMMENDED_ALLOCATIONS])}
                className="px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm font-medium hover:bg-accent/30 transition-colors"
              >
                Reset to Recommended
              </button>
            </div>
          );
        })()}
      </div>

      {/* Priority Kecamatan Table */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Priority Kecamatan (Top 15)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rank</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Kecamatan</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Kabupaten</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg Score</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Factor</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {policyData.priorityKecamatan.map((item, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-white font-medium">#{item.rank}</td>
                  <td className="py-3 px-4 text-slate-200">{item.kecamatan}</td>
                  <td className="py-3 px-4 text-slate-300">{item.kabupaten}</td>
                  <td className="py-3 px-4 text-right text-red-400 font-medium">{item.avg_skor.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.factor === 'digital_readiness' ? 'bg-blue-500/20 text-blue-400' :
                      item.factor === 'infrastructure' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.factor.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs max-w-[200px] truncate">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* What-If Scenarios */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpRight className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">What-If Scenario Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Scenario</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Affected</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Before</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">After</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Improvement</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">% Improved</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Above 70</th>
              </tr>
            </thead>
            <tbody>
              {policyData.whatifScenarios.map((s, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-slate-200">{s.scenario}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{s.affected}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{s.before.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-accent font-medium">{s.after.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">+{s.improvement.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{s.pct_improved}%</td>
                  <td className="py-3 px-4 text-right text-blue-400">{s.above_70}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
