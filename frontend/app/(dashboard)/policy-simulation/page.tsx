'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  ArrowUpRight, 
  Wallet, 
  Save, 
  History, 
  Trash2, 
  Play, 
  Info 
} from 'lucide-react';
import { policyData as staticPolicyData, clusterData } from '@/lib/static-data';
import { 
  fetchPolicy, 
  fetchSavedScenarios, 
  savePolicyScenario, 
  deletePolicyScenario, 
  simulatePolicy,
  SavedPolicyScenario 
} from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RECOMMENDED_ALLOCATIONS = clusterData.govPriority.map(c => c.budget_pct);

export default function PolicySimulationPage() {
  const { addToast } = useToast();
  const [policyData, setPolicyData] = useState(staticPolicyData);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<number[]>(RECOMMENDED_ALLOCATIONS);
  const [totalBudget, setTotalBudget] = useState(100_000_000_000);
  
  // Saved Scenarios State
  const [savedScenarios, setSavedScenarios] = useState<SavedPolicyScenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [saving, setSaving] = useState(false);

  // Simulation Results State
  const [simulationResults, setSimulationResults] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Load scenario from URL hash on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const allocParam = params.get('alloc');
      const budgetParam = params.get('budget');
      if (allocParam) {
        const parsedAlloc = allocParam.split(',').map(Number);
        if (parsedAlloc.length === RECOMMENDED_ALLOCATIONS.length && parsedAlloc.every(n => !isNaN(n))) {
          setAllocations(parsedAlloc);
        }
      }
      if (budgetParam) {
        const parsedBudget = Number(budgetParam);
        if (!isNaN(parsedBudget) && parsedBudget > 0) {
          setTotalBudget(parsedBudget);
        }
      }
    }
  }, []);

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

    // Fetch saved scenarios
    fetchSavedScenarios()
      .then((scenarios) => {
        if (!cancelled) {
          setSavedScenarios(scenarios);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat skenario tersimpan:", err);
      });

    return () => { cancelled = true; };
  }, []);

  // Budget calculations
  const totalPct = allocations.reduce((sum, v) => sum + v, 0);

  // Synchronize scenario state to URL Hash
  useEffect(() => {
    if (typeof window !== 'undefined' && totalPct === 100) {
      window.history.replaceState(null, '', `#alloc=${allocations.join(',')}&budget=${totalBudget}`);
    }
  }, [allocations, totalBudget, totalPct]);

  // Debounced Simulation Query
  useEffect(() => {
    if (totalPct !== 100) {
      setSimulationResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSimulating(true);
      try {
        const res = await simulatePolicy(allocations, totalBudget);
        if (res) {
          setSimulationResults(res);
        }
      } catch (err) {
        console.error("Gagal menjalankan simulasi:", err);
      } finally {
        setSimulating(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [allocations, totalBudget, totalPct]);

  // Derived metrics
  const totalImproved = simulationResults
    ? simulationResults.summary.totalImproved
    : clusterData.govPriority.reduce((sum, cluster, idx) => {
        const allocated = totalBudget * (allocations[idx] / 100);
        return sum + Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
      }, 0);

  const totalJobs = simulationResults
    ? simulationResults.summary.totalNewJobs
    : clusterData.govPriority.reduce((sum, cluster, idx) => {
        const allocated = totalBudget * (allocations[idx] / 100);
        const improved = Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
        return sum + Math.round(improved * 2.5);
      }, 0);
  
  const avgScoreIncrease = simulationResults
    ? simulationResults.summary.avgScoreIncrease
    : totalBudget > 0
      ? Number((clusterData.govPriority.reduce((sum, cluster, idx) => {
          const allocated = totalBudget * (allocations[idx] / 100);
          return sum + (allocated / totalBudget) * 15 * cluster.priority_score;
        }, 0) / clusterData.govPriority.length).toFixed(1))
      : 0;

  // Generate 5-year timeline impact projection data
  const generateTimelineData = () => {
    const years = ['Tahun 0', 'Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5'];
    const baseScore = 61.30;
    const baseSurvival = 67.99;
    
    return years.map((year, idx) => {
      const multipliers = [0, 0.35, 0.65, 0.82, 0.93, 1.0];
      const mult = multipliers[idx];
      return {
        year,
        'Skor Potensi': Number((baseScore + avgScoreIncrease * mult).toFixed(2)),
        'Kelangsungan Hidup %': Number((baseSurvival + (avgScoreIncrease * 0.75) * mult).toFixed(2)),
      };
    });
  };
  const timelineData = generateTimelineData();

  // Actions
  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioName.trim()) {
      addToast("Nama skenario tidak boleh kosong!", "error");
      return;
    }
    if (totalPct !== 100) {
      addToast("Total alokasi anggaran harus 100%!", "error");
      return;
    }

    setSaving(true);
    try {
      const body = {
        scenario_name: scenarioName,
        parameters: {
          allocations,
          totalBudget
        },
        results: {
          totalImproved,
          totalNewJobs: totalJobs,
          avgScoreIncrease
        },
        base_score: 61.3, // Baseline average score
        simulated_score: 61.3 + avgScoreIncrease,
        impact: avgScoreIncrease
      };

      const result = await savePolicyScenario(body);
      if (result) {
        setSavedScenarios([result, ...savedScenarios]);
        setScenarioName("");
        addToast("Skenario berhasil disimpan!", "success");
      } else {
        addToast("Gagal menyimpan skenario.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Terjadi kesalahan sistem.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadScenario = (savedAllocations: number[], savedBudget: number, name: string) => {
    setAllocations(savedAllocations);
    setTotalBudget(savedBudget);
    addToast(`Skenario "${name}" berhasil diterapkan!`, "success");
  };

  const handleDeleteScenario = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus skenario tersimpan ini?")) {
      return;
    }
    try {
      const success = await deletePolicyScenario(id);
      if (success) {
        setSavedScenarios(savedScenarios.filter((s) => s.id !== id));
        addToast("Skenario berhasil dihapus!", "success");
      } else {
        addToast("Gagal menghapus skenario.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Terjadi kesalahan sistem.", "error");
    }
  };

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
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">Simulator Alokasi Anggaran</h3>
        </div>

        {/* Total Budget Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Total Anggaran Stimulus (Rp)</label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
              Format Rupiah: Rp {totalBudget.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[10px] text-slate-400 leading-normal">
            <Info className="w-4 h-4 text-accent flex-shrink-0" />
            <p>
              Simulasi alokasi anggaran didasarkan pada biaya intervensi rata-rata <strong>Rp 50.000.000 / UMKM</strong> untuk program kematangan bisnis, infrastruktur, atau digitalisasi.
            </p>
          </div>
        </div>

        {/* Invalid allocation warning */}
        {totalPct !== 100 && (
          <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 font-medium">⚠️ Total alokasi anggaran saat ini ({totalPct}%) harus tepat 100% untuk mengkalkulasi prediksi secara valid.</p>
          </div>
        )}

        {/* Cluster Allocation Sliders */}
        <div className="space-y-4">
          {clusterData.govPriority.map((cluster, idx) => {
            const pct = allocations[idx];
            const allocated = totalBudget * (pct / 100);
            const clusterSim = simulationResults?.results?.find((r: any) => r.cluster_name === cluster.cluster) 
              || simulationResults?.results?.[idx];
            
            const predicted_umkm_improved = clusterSim 
              ? clusterSim.predicted_umkm_improved 
              : Math.round(allocated / 50_000_000 * cluster.priority_score * cluster.n_umkm / 1000);
              
            const predicted_new_jobs = clusterSim
              ? clusterSim.predicted_new_jobs
              : Math.round(predicted_umkm_improved * 2.5);
              
            const predicted_score_increase = clusterSim
              ? clusterSim.predicted_score_increase.toFixed(1)
              : (totalBudget > 0 ? ((allocated / totalBudget) * 15 * cluster.priority_score).toFixed(1) : '0.0');
              
            const roi = clusterSim
              ? clusterSim.roi
              : (allocated > 0 ? (predicted_umkm_improved * 12_000_000 / allocated * 100).toFixed(0) : '0');

            return (
              <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 transition-all hover:border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="lg:w-1/4">
                    <p className="text-sm font-semibold text-white">{cluster.cluster}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{cluster.n_umkm.toLocaleString()} UMKM Terklaster</p>
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
                      className="flex-1 accent-accent h-1.5 rounded-lg cursor-pointer bg-slate-800"
                    />
                    <span className="text-xs font-mono font-bold text-white w-10 text-right">{pct}%</span>
                  </div>
                  <div className="lg:w-1/4">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dana Dialokasikan</p>
                    <p className="text-xs font-bold text-white">Rp {allocated.toLocaleString('id-ID')}</p>
                  </div>
                  <div className={`lg:w-1/4 grid grid-cols-2 gap-2 text-xs${totalPct !== 100 ? ' opacity-40' : ''}`}>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">UMKM Meningkat</p>
                      <p className="text-xs font-bold text-emerald-400">+{predicted_umkm_improved}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Pekerjaan Baru</p>
                      <p className="text-xs font-bold text-emerald-400">+{predicted_new_jobs}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Dampak Skor</p>
                      <p className="text-xs font-bold text-emerald-400">+{predicted_score_increase}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Est. ROI</p>
                      <p className="text-xs font-bold text-emerald-400">{roi}%</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation & Save Scenarios Panel */}
        <div className="pt-4 border-t border-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400">Total Alokasi Anggaran:</span>
              <span className={`text-sm font-bold ${totalPct === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPct}%
              </span>
              {totalPct === 100 ? (
                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Lulus Validasi</span>
              ) : (
                <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Kurang/Lebih</span>
              )}
            </div>
            
            <p className={`text-xs text-slate-300 leading-relaxed${totalPct !== 100 ? ' opacity-40' : ''}`}>
              Skenario ini akan meningkatkan skor potensi wilayah rata-rata <span className="font-bold text-emerald-400">+{avgScoreIncrease.toFixed(1)}</span> poin, menstimulasi pertumbuhan <span className="font-bold text-emerald-400">{totalImproved}</span> UMKM, dan membuka <span className="font-bold text-emerald-400">{totalJobs}</span> lowongan kerja baru.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(window.location.href);
                  addToast("Tautan skenario berhasil disalin ke clipboard!", "success");
                }
              }}
              className="px-4 py-2 bg-accent/10 border border-accent/20 hover:border-accent/40 text-accent hover:text-accent-400 rounded-lg text-xs font-semibold transition-colors"
            >
              Salin Tautan Skenario
            </button>
            <button
              onClick={() => setAllocations([...RECOMMENDED_ALLOCATIONS])}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Reset ke Rekomendasi
            </button>
          </div>
        </div>

        {/* Simpan Skenario Panel */}
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Save className="w-4 h-4 text-accent" />
              <span>Simpan Skenario Simulasi</span>
            </h4>
            <p className="text-[10px] text-slate-400">Simpan konfigurasi parameter dan hasil estimasi ini ke basis data Anda.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Nama skenario (misal: Rencana Q3)"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="flex-1 md:flex-none bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-accent w-full md:w-64"
              disabled={totalPct !== 100 || saving}
            />
            <button
              onClick={handleSaveScenario}
              disabled={saving || !scenarioName.trim() || totalPct !== 100}
              className="px-4 py-2 bg-primary hover:bg-primary-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <span>{saving ? "Menyimpan..." : "Simpan Skenario"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5-Year Budget Timeline Projection */}
      {totalPct === 100 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-white font-serif">Proyeksi Dampak Anggaran 5 Tahun</h3>
            </div>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold tracking-wider">ESTIMASI FORECAST</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Perkembangan rata-rata Skor Potensi Wilayah dan Tingkat Kelangsungan Hidup UMKM Jawa Barat selama 5 tahun ke depan dengan skema alokasi anggaran saat ini.
          </p>
          <div className="w-full h-[280px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="Skor Potensi" dataKey="Skor Potensi" stroke="#10B981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                <Area type="monotone" name="Kelangsungan Hidup UMKM %" dataKey="Kelangsungan Hidup %" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSurvival)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SECTION: SAVED SCENARIOS */}
      {savedScenarios.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white">Skenario Simulasi Tersimpan</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedScenarios.map((scenario) => {
              const params = typeof scenario.parameters === 'string' ? JSON.parse(scenario.parameters || "{}") : scenario.parameters;
              const res = typeof scenario.results === 'string' ? JSON.parse(scenario.results || "{}") : scenario.results;
              
              return (
                <div key={scenario.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 space-y-3 relative hover:border-slate-800 transition-all group">
                  <button
                    onClick={() => handleDeleteScenario(scenario.id)}
                    className="absolute top-3 right-3 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Hapus Skenario"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div>
                    <h4 className="text-xs font-bold text-white pr-6 truncate">{scenario.scenario_name}</h4>
                    <p className="text-[9px] text-slate-500 font-medium">
                      Dibuat pada {new Date(scenario.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-slate-400 bg-slate-950/20 p-2.5 rounded-lg">
                    <div>
                      <span className="text-[9px] text-slate-500">Anggaran Stimulus</span>
                      <p className="text-white font-semibold">Rp {(params.totalBudget || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500">Dampak Rata-Rata</span>
                      <p className="text-emerald-400 font-bold">+{Number(scenario.impact || 0).toFixed(1)} poin</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500">UMKM Terbantu</span>
                      <p className="text-white font-semibold">+{res.totalImproved || 0}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500">Pekerjaan Baru</span>
                      <p className="text-white font-semibold">+{res.totalNewJobs || 0}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleLoadScenario(params.allocations, params.totalBudget, scenario.scenario_name)}
                    className="w-full py-1.5 rounded-lg bg-accent/15 hover:bg-accent/25 text-accent font-bold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3 text-accent" />
                    <span>Terapkan Skenario</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
