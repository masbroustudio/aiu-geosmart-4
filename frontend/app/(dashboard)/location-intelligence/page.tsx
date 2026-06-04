'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Search, 
  Sliders, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  Building2, 
  Wifi, 
  Info 
} from 'lucide-react';
import { recommendData as staticRecommendData, policyData as staticPolicyData, kecamatanDetailData } from '@/lib/static-data';
import { fetchRecommendations, fetchPolicy, simulateWhatIf } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import ComparisonRadarChart from '@/components/dashboard/ComparisonRadarChart';
import { useToast } from '@/lib/toast-context';
import { kecamatanDetailMap } from '@/lib/kecamatan-detail-data';

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

  // New Search, Pagination, and Popup States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKecamatan, setSelectedKecamatan] = useState<any | null>(null);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [jenisUsaha, kabupaten, searchQuery, useMcda, sortByMarketGap]);

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
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchKec = item.kecamatan.toLowerCase().includes(q);
      const matchKab = item.kabupaten.toLowerCase().includes(q);
      if (!matchKec && !matchKab) return false;
    }
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

  // Pagination parameters
  const itemsPerPage = 9;
  const totalPages = Math.ceil(sortedAndProcessed.length / itemsPerPage);
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedItems = sortedAndProcessed.slice(startIndex, startIndex + itemsPerPage);

  const runLocalFallbackSimulation = () => {
    const targetName = kabupaten !== 'Semua' ? kabupaten : 'Jawa Barat';
    const sectorText = jenisUsaha !== 'Semua' ? ` Sektor ${jenisUsaha}` : '';
    
    // Sliders delta
    const infraDelta = infra - 50;
    const bankDelta = 50 - bankDist; // lower distance is better (so bankDist < 50 means distance is shorter, which is an improvement)
    const internetDelta = internet - 50;

    // Base list we are simulating on
    const targetList = filtered.length > 0 ? filtered : recommendData;
    const avgBefore = targetList.reduce((sum, item) => sum + item.avg_score, 0) / targetList.length;

    // Component increases based on real formulas
    const infraInc = (infraDelta / 50) * 12.5;
    const bankInc = (bankDelta / 50) * 8.0;
    const internetInc = (internetDelta / 50) * 15.0;
    
    const totalInc = infraInc + bankInc + internetInc;
    const avgAfter = Math.max(5.0, Math.min(99.5, avgBefore + totalInc));
    const improvement = avgAfter - avgBefore;

    // Estimate affected UMKMs using detail population
    const affectedUMKMs = targetList.reduce((sum, item) => {
      const detail = kecamatanDetailMap[item.kecamatan];
      const pop = detail ? detail.population : 50000;
      return sum + Math.round(pop / 300);
    }, 0);

    // Calculate how many kecamatans cross 75.0 (High Potential) score
    const countAbove75Before = targetList.filter(item => item.avg_score >= 75).length;
    const countAbove75After = targetList.filter(item => (item.avg_score + totalInc) >= 75).length;
    const addedAbove75 = Math.max(0, countAbove75After - countAbove75Before);

    // Construct custom scenario result
    const dynamicScenario: WhatIfScenario = {
      scenario: `Simulasi Kustom (${targetName}${sectorText}): Infra ${infraDelta >= 0 ? '+' : ''}${infraDelta}%, Jarak Bank ${bankDelta >= 0 ? 'Dekat +' : 'Jauh -'}${Math.abs(bankDelta)}%, Internet ${internetDelta >= 0 ? '+' : ''}${internetDelta}%`,
      affected: affectedUMKMs || 150,
      before: parseFloat(avgBefore.toFixed(2)),
      after: parseFloat(avgAfter.toFixed(2)),
      improvement: parseFloat(improvement.toFixed(2)),
      max_improvement: parseFloat(Math.max(0, totalInc * 1.3).toFixed(2)),
      pct_improved: totalInc > 0 ? 100.0 : 0.0,
      above_70: addedAbove75
    };

    setSimResult(dynamicScenario);
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
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold text-white font-serif">Filter Wilayah</h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-sans">Kategori Usaha</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Semua', 'Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setJenisUsaha(opt)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                        jenisUsaha === opt
                          ? 'bg-accent border-accent text-white font-semibold shadow-md shadow-accent/20'
                          : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-sans">Kabupaten / Kota</span>
                <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                  {['Semua', ...Array.from(new Set(recommendData.map(item => item.kabupaten)))].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setKabupaten(opt)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                        kabupaten === opt
                          ? 'bg-accent border-accent text-white font-semibold shadow-md shadow-accent/20'
                          : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-800/60 mt-6 flex items-center justify-between">
            <span className="text-xs text-slate-450">{sortedAndProcessed.length} wilayah ditemukan</span>
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

      {/* Results Search and Pagination */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-accent"
            />
          </div>
          <div className="text-[11px] text-slate-500 font-sans">
            Menampilkan {sortedAndProcessed.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, sortedAndProcessed.length)} dari {sortedAndProcessed.length} wilayah
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full glass-card p-8 text-center">
              <p className="text-slate-400">Tidak ada rekomendasi wilayah yang cocok dengan filter atau pencarian Anda.</p>
            </div>
          ) : (
            paginatedItems.map((item, i) => (
              <div 
                key={i} 
                onClick={() => {
                  const detail = kecamatanDetailMap[item.kecamatan];
                  setSelectedKecamatan(detail || {
                    name: item.kecamatan,
                    kabupaten: item.kabupaten,
                    lat: item.lat || -6.2,
                    lng: item.lng || 106.8,
                    population: item.populasi,
                    avg_skor_potensi: item.avg_score,
                    avg_omset: 50,
                    survival_rate: item.survivalScore || 70,
                    infrastructure_score: item.infraScore || 50,
                    digital_readiness: item.internetScore || 50,
                    financial_access: item.financeScore || 50,
                    risk_flood: 20,
                    risk_earthquake: 20,
                    competition_level: item.competitorCount || 10,
                    umkm_list: [],
                    recommended_business: [item.jenis_usaha],
                    score_breakdown: {
                      infrastructure: item.infraScore || 50,
                      digital: item.internetScore || 50,
                      financial: item.financeScore || 50,
                      risk: 50,
                      location: 50
                    }
                  });
                }}
                className="glass-card p-5 border border-slate-700/50 hover:border-accent cursor-pointer transform hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col justify-between"
              >
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
                        Market Gap Rank #{startIndex + i + 1}
                      </span>
                    )}
                    {useMcda && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        MCDA Rank #{startIndex + i + 1}
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

        {/* Pagination Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(prev => Math.max(1, prev - 1));
              }}
              disabled={validCurrentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 font-sans">
              Halaman <span className="text-white font-semibold">{validCurrentPage}</span> dari <span className="text-white font-semibold">{totalPages}</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }}
              disabled={validCurrentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

      {/* Kecamatan Detail Popup Modal */}
      {selectedKecamatan && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-all"
          onClick={() => setSelectedKecamatan(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900 bg-slate-950/60 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-bold text-white font-serif">{selectedKecamatan.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{selectedKecamatan.kabupaten}</p>
              </div>
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
                <span>Koordinat: {selectedKecamatan.lat?.toFixed(3)}, {selectedKecamatan.lng?.toFixed(3)}</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-850">Detail Terintegrasi</span>
              </div>

              {/* KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Populasi</span>
                  <p className="text-sm font-bold text-white">{selectedKecamatan.population?.toLocaleString()} jiwa</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Avg Skor Potensi</span>
                  <p className="text-sm font-bold text-white">{selectedKecamatan.avg_skor_potensi?.toFixed(1)} / 100</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Rata-rata Omset</span>
                  <p className="text-sm font-bold text-white">Rp {selectedKecamatan.avg_omset} Jt/bln</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Survival Rate</span>
                  <p className="text-sm font-bold text-white">{selectedKecamatan.survival_rate}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <Building2 className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Infrastruktur</span>
                  <p className="text-sm font-bold text-white">{selectedKecamatan.infrastructure_score}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-850 space-y-1">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] text-slate-550 uppercase tracking-wider block font-bold font-sans">Digital Readiness</span>
                  <p className="text-sm font-bold text-white">{selectedKecamatan.digital_readiness}</p>
                </div>
              </div>

              {/* Recommended Businesses */}
              {selectedKecamatan.recommended_business && selectedKecamatan.recommended_business.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">Rekomendasi Sektor Usaha:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedKecamatan.recommended_business.map((biz: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                        {biz}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs transition-colors"
              >
                Tutup
              </button>
              <Link
                href={`/kecamatan?name=${encodeURIComponent(selectedKecamatan.name)}&kabupaten=${encodeURIComponent(selectedKecamatan.kabupaten)}`}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-accent hover:bg-accent-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                Buka Analisis Detail Selengkapnya
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
