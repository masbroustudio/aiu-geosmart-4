'use client';

import { useState, useEffect } from 'react';
import { MapPin, Search, Sliders } from 'lucide-react';
import { recommendData as staticRecommendData, policyData as staticPolicyData, kecamatanDetailData } from '@/lib/static-data';
import { fetchRecommendations, fetchPolicy } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import ComparisonRadarChart from '@/components/dashboard/ComparisonRadarChart';

const jenisUsahaOptions = ['Semua', 'Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'];
const kabupatenOptions = ['Semua', 'Kota Bekasi', 'Kota Depok', 'Kota Bandung', 'Kab. Bogor', 'Kota Cimahi'];

type WhatIfScenario = typeof staticPolicyData.whatifScenarios[number];

export default function LocationIntelligencePage() {
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

  const handleSimulate = () => {
    // Determine which slider was adjusted most from the default (50)
    const infraDelta = Math.abs(infra - 50);
    const bankDelta = Math.abs(bankDist - 50);
    const internetDelta = Math.abs(internet - 50);

    const maxDelta = Math.max(infraDelta, bankDelta, internetDelta);

    let bestScenario: WhatIfScenario;
    if (maxDelta === infraDelta) {
      // Infrastructure slider moved most - find infrastructure scenario
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('infrastructure')
      ) || whatifScenarios[0];
    } else if (maxDelta === bankDelta) {
      // Bank distance slider moved most - find bank scenario
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('bank')
      ) || whatifScenarios[1];
    } else {
      // Internet slider moved most - find internet scenario
      bestScenario = whatifScenarios.find(s =>
        s.scenario.toLowerCase().includes('internet')
      ) || whatifScenarios[2];
    }

    setSimResult(bestScenario);
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

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-white">Filter Recommendations</h3>
          </div>
          <DownloadCSVButton data={filtered as unknown as Record<string, unknown>[]} filename="location-recommendations" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Jenis Usaha</label>
            <select
              value={jenisUsaha}
              onChange={(e) => setJenisUsaha(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
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
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
            >
              {kabupatenOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full glass-card p-8 text-center">
            <p className="text-slate-400">No recommendations found for the selected filters.</p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-white">{item.kecamatan}</span>
                </div>
                <span className="text-lg font-bold text-accent">{item.avg_score}</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">{item.kabupaten} | {item.jenis_usaha}</p>
              <p className="text-xs text-slate-500">{item.explanation}</p>
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
                <p className="text-white font-medium">{simResult.before.toFixed(1)}</p>
              </div>
              <div>
                <span className="text-slate-400">After</span>
                <p className="text-emerald-400 font-medium">{simResult.after.toFixed(1)}</p>
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
                  <td className="py-3 px-4 text-right text-slate-300">{s.before.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-accent">{s.after.toFixed(1)}</td>
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
