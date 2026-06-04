'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Sliders, AlertTriangle } from 'lucide-react';
import { recommendData as staticRecommendData, policyData as staticPolicyData, kecamatanDetailData } from '@/lib/static-data';
import { fetchRecommendations, fetchPolicy, simulateWhatIf } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import ComparisonRadarChart from '@/components/dashboard/ComparisonRadarChart';
import { useToast } from '@/lib/toast-context';
import { kecamatanDetailMap } from '@/lib/kecamatan-detail-data';

const jenisUsahaOptions = ['Semua', 'Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'];
const kabupatenOptions = ['Semua', 'Kota Bekasi', 'Kota Depok', 'Kota Bandung', 'Kab. Bogor', 'Kota Cimahi'];

type WhatIfScenario = typeof staticPolicyData.whatifScenarios[number];

export default function LocationIntelligencePage() {
  const { addToast } = useToast();
  const [jenisUsaha, setJenisUsaha] = useState('Semua');
  const [kabupaten, setKabupaten] = useState('Semua');
  const [infra, setInfra] = useState(50);
  const [bankDist, setBankDist] = useState(50);
  const [internet, setInternet] = useState(50);
  const [simResult, setSimResult] = useState<WhatIfScenario | null>(null);
  const [recommendData, setRecommendData] = useState(staticRecommendData);
  const [whatifScenarios, setWhatifScenarios] = useState(staticPolicyData.whatifScenarios);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState(kecamatanDetailData[0].kecamatan);
  const [compareB, setCompareB] = useState(kecamatanDetailData[1].kecamatan);

  // MCDA / Market Gap state
  const [useMcda, setUseMcda] = useState(false);
  const [sortByMarketGap, setSortByMarketGap] = useState(false);
  const [wInfra, setWInfra] = useState(25);
  const [wInternet, setWInternet] = useState(20);
  const [wFinance, setWFinance] = useState(20);
  const [wCompetition, setWCompetition] = useState(15);
  const [wSurvival, setWSurvival] = useState(20);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const [recs, policy] = await Promise.all([
          fetchRecommendations(),
          fetchPolicy(),
        ]);
        if (!cancelled) {
          setRecommendData(recs);
          if (policy.whatifScenarios) {
            setWhatifScenarios(policy.whatifScenarios);
          }
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

  const filtered = recommendData.filter((item) => {
    if (jenisUsaha !== 'Semua' && item.jenis_usaha !== jenisUsaha) return false;
    if (kabupaten !== 'Semua' && item.kabupaten !== kabupaten) return false;
    return true;
  });

  // MCDA & Market Gap calculations
  const processed = filtered.map((item: any) => {
    const detail = kecamatanDetailMap[item.kecamatan];
    
    const infraVal = item.avg_infrastruktur || (detail ? detail.infrastructure_score : 50);
    const internetVal = item.avg_internet || (detail ? detail.digital_readiness : 50);
    
    // Scale 0-1 values if needed
    const rawFinance = item.avg_financial_access || (detail ? detail.financial_access / 100 : 0.5);
    const financeVal = rawFinance <= 1 ? rawFinance * 100 : rawFinance;
    
    const rawCompInv = item.competition_inv || (detail ? 1 / (detail.competition_level + 1) : 0.1);
    const competitionVal = rawCompInv <= 1 ? rawCompInv * 100 : rawCompInv;
    
    const rawSurvival = item.survival_rate || (detail ? detail.survival_rate / 100 : 0.7);
    const survivalVal = rawSurvival <= 1 ? rawSurvival * 100 : rawSurvival;
    
    const populasi = item.populasi || (detail ? detail.population : 50000);
    const competitorCount = item.competitorCount || (detail ? detail.competition_level : 10);
    const gapScore = populasi / (competitorCount + 1);

    const totalW = wInfra + wInternet + wFinance + wCompetition + wSurvival || 1;
    const customScore = (
      (wInfra * infraVal) +
      (wInternet * internetVal) +
      (wFinance * financeVal) +
      (wCompetition * competitionVal) +
      (wSurvival * survivalVal)
    ) / totalW;

    return {
      ...item,
      infraScore: infraVal,
      internetScore: internetVal,
      financeScore: financeVal,
      competitionScore: competitionVal,
      survivalScore: survivalVal,
      populasi,
      competitorCount,
      gapScore,
      customScore,
    };
  });

  // Sort based on settings
  const sortedAndProcessed = [...processed].sort((a, b) => {
    if (sortByMarketGap) {
      return b.gapScore - a.gapScore;
    }
    if (useMcda) {
      return b.customScore - a.customScore;
    }
    return b.avg_score - a.avg_score;
  });

  // Calculate gap threshold for top 25% highlighting
  const gapScores = sortedAndProcessed.map(i => i.gapScore);
  const sortedGapScores = [...gapScores].sort((a, b) => b - a);
  const gapThreshold = sortedGapScores[Math.floor(sortedGapScores.length * 0.25)] || 3000;

  const runLocalFallbackSimulation = () => {
    const infraDelta = Math.abs(infra - 50);
    const bankDelta = Math.abs(bankDist - 50);
    const internetDelta = Math.abs(internet - 50);
    const maxDelta = Math.max(infraDelta, bankDelta, internetDelta);

    let bestScenario: WhatIfScenario;
    if (maxDelta === infraDelta) {
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('infrastructure')
      ) || whatifScenarios[0];
    } else if (maxDelta === bankDelta) {
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('bank')
      ) || whatifScenarios[1];
    } else {
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('internet')
      ) || whatifScenarios[2];
    }
    setSimResult(bestScenario);
  };

  const handleSimulate = async () => {
    try {
      const response = await simulateWhatIf({
        infrastructure_improvement: infra - 50,
        new_bank_distance: 50 - bankDist,
        internet_pct_increase: internet - 50,
      });

      if (response && response.scenarios && response.scenarios.length > 0) {
        setSimResult(response.scenarios[0]);
        addToast("Simulasi What-If diproses di server!", "success");
      } else {
        runLocalFallbackSimulation();
      }
    } catch (err) {
      console.error("Gagal menjalankan simulasi What-If di server:", err);
      runLocalFallbackSimulation();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <h1 className="text-2xl font-bold text-white">Location Intelligence</h1>
        <div className="glass-card p-6 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-10 bg-slate-700 rounded mb-2" />
          <div className="h-10 bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Location Intelligence</h1>

      {/* Control Panel: Filters & Custom MCDA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="glass-card p-6 xl:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-semibold text-white font-serif">Filter Wilayah</h3>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Jenis Usaha</label>
                <select
                  value={jenisUsaha}
                  onChange={(e) => setJenisUsaha(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
                >
                  {jenisUsahaOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Kabupaten/Kota</label>
                <select
                  value={kabupaten}
                  onChange={(e) => setKabupaten(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
                >
                  {kabupatenOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-800/60 mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-400">{sortedAndProcessed.length} wilayah ditemukan</span>
            <DownloadCSVButton data={sortedAndProcessed as unknown as Record<string, unknown>[]} filename="location-recommendations" />
          </div>
        </div>

        {/* Custom MCDA & Market Gap Configurations */}
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Sliders className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white font-serif">Kustomisasi Analisis (MCDA) & Gap Pasar</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Aktifkan MCDA kustom untuk mengurutkan rekomendasi dengan bobot kustom Anda, atau aktifkan Deteksi Market Gap untuk menemukan wilayah dengan populasi tinggi namun minim kompetitor.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">Gunakan MCDA Kustom</span>
                  <span className="text-[10px] text-slate-400">Gunakan bobot preferensi buatan Anda</span>
                </div>
                <input
                  type="checkbox"
                  checked={useMcda}
                  onChange={(e) => {
                    setUseMcda(e.target.checked);
                    if (e.target.checked) setSortByMarketGap(false);
                  }}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">Urutkan via Market Gap</span>
                  <span className="text-[10px] text-slate-400">Populasi tinggi / Kompetisi rendah</span>
                </div>
                <input
                  type="checkbox"
                  checked={sortByMarketGap}
                  onChange={(e) => {
                    setSortByMarketGap(e.target.checked);
                    if (e.target.checked) setUseMcda(false);
                  }}
                  className="w-4 h-4 accent-accent cursor-pointer"
                />
              </div>
            </div>

            <div className={`space-y-3 ${!useMcda ? 'opacity-30 pointer-events-none' : ''} transition-opacity duration-200`}>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Infrastruktur ({Math.round(wInfra / (wInfra + wInternet + wFinance + wCompetition + wSurvival || 1) * 100)}%)</span>
                  <span>{wInfra}</span>
                </div>
                <input
                  type="range" min="0" max="100" value={wInfra}
                  onChange={(e) => setWInfra(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Konektivitas Internet ({Math.round(wInternet / (wInfra + wInternet + wFinance + wCompetition + wSurvival || 1) * 100)}%)</span>
                  <span>{wInternet}</span>
                </div>
                <input
                  type="range" min="0" max="100" value={wInternet}
                  onChange={(e) => setWInternet(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Akses Finansial ({Math.round(wFinance / (wInfra + wInternet + wFinance + wCompetition + wSurvival || 1) * 100)}%)</span>
                  <span>{wFinance}</span>
                </div>
                <input
                  type="range" min="0" max="100" value={wFinance}
                  onChange={(e) => setWFinance(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Minim Kompetisi ({Math.round(wCompetition / (wInfra + wInternet + wFinance + wCompetition + wSurvival || 1) * 100)}%)</span>
                  <span>{wCompetition}</span>
                </div>
                <input
                  type="range" min="0" max="100" value={wCompetition}
                  onChange={(e) => setWCompetition(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Masa Hidup UMKM ({Math.round(wSurvival / (wInfra + wInternet + wFinance + wCompetition + wSurvival || 1) * 100)}%)</span>
                  <span>{wSurvival}</span>
                </div>
                <input
                  type="range" min="0" max="100" value={wSurvival}
                  onChange={(e) => setWSurvival(Number(e.target.value))}
                  className="w-full accent-accent h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAndProcessed.length === 0 ? (
          <div className="col-span-full glass-card p-8 text-center">
            <p className="text-slate-400">No recommendations found for the selected filters.</p>
          </div>
        ) : (
          sortedAndProcessed.map((item, i) => (
            <div key={i} className="glass-card p-5 border border-slate-700/50 hover:border-accent/40 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-white">{item.kecamatan}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-accent">
                      {useMcda ? item.customScore.toFixed(2) : item.avg_score.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {useMcda ? 'Skor Kustom' : 'Skor Potensi'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mb-2 font-medium">{item.kabupaten} | <span className="text-slate-300">{item.jenis_usaha}</span></p>
                <p className="text-xs text-slate-400/90 leading-relaxed mb-4">{item.explanation}</p>
              </div>

              <div className="border-t border-slate-850 pt-3 mt-auto space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Rasio Populasi/Kompetitor</span>
                  <span className="text-slate-200 font-medium">
                    {item.populasi.toLocaleString()} jiwa / {item.competitorCount} UMKM
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.gapScore >= gapThreshold && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      🔥 MARKET GAP TINGGI ({item.gapScore.toFixed(1)})
                    </span>
                  )}
                  {sortByMarketGap && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                      Market Gap Rank #{i + 1}
                    </span>
                  )}
                  {useMcda && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      MCDA Rank #{i + 1}
                    </span>
                  )}
                </div>

                {useMcda && (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-400 pt-2 border-t border-slate-800/40">
                    <div>Infra Score: <span className="text-slate-200 font-medium">{item.infraScore.toFixed(1)}</span></div>
                    <div>Digital Score: <span className="text-slate-200 font-medium">{item.internetScore.toFixed(1)}</span></div>
                    <div>Finance Score: <span className="text-slate-200 font-medium">{item.financeScore.toFixed(1)}</span></div>
                    <div>Survival Rate: <span className="text-slate-200 font-medium">{item.survivalScore.toFixed(1)}%</span></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* What-If Simulator */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-semibold text-white">What-If Simulator</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Adjust sliders and click Simulate to see the closest matching pre-computed ML scenario.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Infrastructure Score: {infra}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={infra}
              onChange={(e) => setInfra(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Bank Distance (lower = closer): {bankDist}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={bankDist}
              onChange={(e) => setBankDist(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Internet Coverage: {internet}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={internet}
              onChange={(e) => setInternet(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
        <button
          onClick={handleSimulate}
          className="px-6 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-600 transition-colors"
        >
          Simulate
        </button>
        {simResult && (
          <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700 space-y-2">
            <p className="text-sm text-accent font-medium">{simResult.scenario}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Affected UMKMs</span>
                <p className="text-white font-medium">{simResult.affected}</p>
              </div>
              <div>
                <span className="text-slate-400">Before</span>
                <p className="text-white font-medium">{simResult.before.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">After</span>
                <p className="text-emerald-400 font-medium">{simResult.after.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-400">Improvement</span>
                <p className="text-emerald-400 font-medium">+{simResult.improvement.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What-If Scenario Results from ML */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pre-computed Scenario Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Scenario</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Affected</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Before</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">After</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Improvement</th>
              </tr>
            </thead>
            <tbody>
              {whatifScenarios.map((s, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-slate-200">{s.scenario}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{s.affected}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{s.before.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-accent">{s.after.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">+{s.improvement.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kecamatan Comparison */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Kecamatan Comparison</h3>
        <p className="text-xs text-slate-400 mb-4">
          Select two kecamatan to compare their multi-dimensional profiles.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Kecamatan A</label>
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
            >
              {kecamatanDetailData.map((k) => (
                <option key={k.kecamatan} value={k.kecamatan}>{k.kecamatan} ({k.kabupaten})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Kecamatan B</label>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
            >
              {kecamatanDetailData.map((k) => (
                <option key={k.kecamatan} value={k.kecamatan}>{k.kecamatan} ({k.kabupaten})</option>
              ))}
            </select>
          </div>
        </div>

        {(() => {
          const dataA = kecamatanDetailData.find((k) => k.kecamatan === compareA);
          const dataB = kecamatanDetailData.find((k) => k.kecamatan === compareB);
          if (!dataA || !dataB) return null;

          const dimensions = [
            { subject: 'Infrastructure', key: 'infrastructure' as const },
            { subject: 'Safety', key: 'risk' as const },
            { subject: 'Competition', key: 'competition' as const },
            { subject: 'Digital Readiness', key: 'digital_readiness' as const },
            { subject: 'Financial Access', key: 'financial_access' as const },
          ];

          const radarData = dimensions.map((dim) => ({
            subject: dim.subject,
            [compareA]: dim.key === 'risk' ? 100 - dataA[dim.key] : dataA[dim.key],
            [compareB]: dim.key === 'risk' ? 100 - dataB[dim.key] : dataB[dim.key],
          }));

          return (
            <>
              <ComparisonRadarChart data={radarData} kecamatanNames={[compareA, compareB]} />

              {/* Comparison Table */}
              <div className="overflow-x-auto mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Dimension</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">{compareA}</th>
                      <th className="text-right py-3 px-4 text-slate-400 font-medium">{compareB}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensions.map((dim) => {
                      const valA = dim.key === 'risk' ? 100 - dataA[dim.key] : dataA[dim.key];
                      const valB = dim.key === 'risk' ? 100 - dataB[dim.key] : dataB[dim.key];
                      const aWins = valA > valB;
                      const bWins = valB > valA;
                      return (
                        <tr key={dim.subject} className="border-b border-slate-800">
                          <td className="py-3 px-4 text-slate-200">{dim.subject}</td>
                          <td className={`py-3 px-4 text-right ${aWins ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                            {valA}
                          </td>
                          <td className={`py-3 px-4 text-right ${bWins ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                            {valB}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
