'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import { portfolioData, PORTFOLIO_COLORS } from '@/lib/portfolio-data';

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `Rp ${(value / 1_000_000_000_000).toFixed(1)} T`;
  }
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  }
  return `Rp ${value.toLocaleString()}`;
}

export default function PortfolioAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [shockPercent, setShockPercent] = useState(30);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <h1 className="text-2xl font-bold text-white">Portfolio Analytics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-[300px] bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const baseEL = portfolioData.stressTest.baseExpectedLoss;
  const basePD = portfolioData.weightedAvgPD;

  // Base Macro variables
  const baseBiRate = 6.00;
  const baseInflation = 2.80;
  const basePdrbGrowth = 5.20;

  // Stressed Macro variables (Shock response based on slider)
  const biRate = baseBiRate + (shockPercent / 100) * 4.0; 
  const inflation = baseInflation + (shockPercent / 100) * 5.2; 
  const pdrbGrowth = basePdrbGrowth - (shockPercent / 100) * 6.0; 

  // Non-linear PD factor (exponential shock combining rate hikes, inflation, and contraction)
  const biRateShock = (biRate - baseBiRate) / 100;
  const inflationShock = (inflation - baseInflation) / 100;
  const pdrbShock = (basePdrbGrowth - pdrbGrowth) / 100;
  const shockMultiplier = Math.exp(2.2 * biRateShock + 1.8 * inflationShock + 2.5 * pdrbShock);

  const stressedPD = showStress 
    ? parseFloat(Math.min(100, basePD * shockMultiplier).toFixed(2)) 
    : basePD;

  const stressedEL = showStress 
    ? baseEL * (stressedPD / basePD) 
    : baseEL;

  const additionalLoss = stressedEL - baseEL;

  // Cohort NPL data
  const cohortData = [
    { name: '12 Bulan', 'Cohort 2023': 1.20, 'Cohort 2024': 1.45, 'Cohort 2025': 1.80 },
    { name: '24 Bulan', 'Cohort 2023': 2.80, 'Cohort 2024': 3.20 },
    { name: '36 Bulan', 'Cohort 2023': 4.50 },
  ];

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Bank Risk Analysis</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Total UMKMs"
          value={portfolioData.totalUmkm.toLocaleString()}
          subtitle="Portofolio aktif"
          color="#10B981"
          delay={0}
        />
        <KPICard
          icon={DollarSign}
          label="Total Exposure"
          value={formatRupiah(portfolioData.totalExposure)}
          subtitle="Total eksposur kredit"
          color="#3B82F6"
          delay={0.1}
        />
        <KPICard
          icon={TrendingDown}
          label="Weighted Avg PD"
          value={`${portfolioData.weightedAvgPD}%`}
          subtitle="Rata-rata PD tertimbang"
          color="#F59E0B"
          trend="down"
          delay={0.2}
        />
        <KPICard
          icon={AlertTriangle}
          label="Expected Loss"
          value={formatRupiah(portfolioData.expectedLoss)}
          subtitle="EL = EAD x PD x LGD (70%)"
          color="#EF4444"
          trend="down"
          delay={0.3}
        />
      </div>

      {/* Concentration Risk Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Exposure by Kabupaten */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Konsentrasi Eksposur per Kabupaten</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData.exposureByKabupaten}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {portfolioData.exposureByKabupaten.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => [`Rp ${Number(value).toLocaleString()} Jt`, 'Exposure']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Exposure by Jenis Usaha */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Eksposur per Jenis Usaha</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolioData.exposureByJenisUsaha} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}T`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value) => [`Rp ${Number(value).toLocaleString()} Jt`, 'Exposure']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {portfolioData.exposureByJenisUsaha.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cohort Analysis & HHI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Analysis Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Analisis Kohor Portofolio (NPL %)</h3>
          <p className="text-xs text-slate-400 mb-4">Pelacakan performa kualitas kredit berdasarkan tahun realisasi kredit pembiayaan.</p>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cohortData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Cohort 2023" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Cohort 2024" stroke="#3B82F6" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Cohort 2025" stroke="#EF4444" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* HHI & Diversification */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Indeks Konsentrasi & Diversifikasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-2">Herfindahl-Hirschman Index (HHI)</p>
                <p className="text-3xl font-bold text-white">{portfolioData.hhi.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {'< 1500 = Rendah | 1500-2500 = Moderat | > 2500 = Tinggi'}
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-yellow-500/20 text-yellow-400">
                  Konsentrasi Moderat
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Skor Diversifikasi</p>
                <p className="text-3xl font-bold text-white">{portfolioData.diversificationScore}<span className="text-lg text-slate-400">/100</span></p>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500"
                    style={{ width: `${portfolioData.diversificationScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">Semakin tinggi semakin terdiversifikasi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Distribution Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top 10 Kecamatan Risiko Tertinggi</h3>
          <DownloadCSVButton
            data={portfolioData.topRiskKecamatan as unknown as Record<string, unknown>[]}
            filename="portfolio-risk-kecamatan"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">#</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Kecamatan</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Kabupaten</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg PD</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Exposure</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Risk Rating</th>
              </tr>
            </thead>
            <tbody>
              {portfolioData.topRiskKecamatan.map((row, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-slate-300">{i + 1}</td>
                  <td className="py-3 px-4 text-slate-200">{row.kecamatan}</td>
                  <td className="py-3 px-4 text-slate-300">{row.kabupaten}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.avgPD}%</td>
                  <td className="py-3 px-4 text-right text-slate-300">Rp {row.exposure.toLocaleString()} Jt</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      row.riskRating === 'Critical'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {row.riskRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stress Test */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Simulasi Stress Test Portofolio</h3>
            <p className="text-xs text-slate-400 mt-1">
              {showStress 
                ? `Kondisi stres: Probabilitas gagal bayar (PD) naik +${shockPercent}%` 
                : "Uji ketahanan portofolio terhadap guncangan makroekonomi"}
            </p>
          </div>
          <button
            onClick={() => setShowStress(!showStress)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              showStress
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-primary text-white hover:bg-primary-600'
            }`}
          >
            {showStress ? 'Kondisi Normal' : 'Mulai Simulasi Stres'}
          </button>
        </div>

        {showStress && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Tingkat Goncangan Makroekonomi:</span>
                <span className="text-red-400 font-bold">+{shockPercent}% (Kenaikan NPL)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={shockPercent}
                onChange={(e) => setShockPercent(parseInt(e.target.value) || 0)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0% (Normal)</span>
                <span>25% (Ringan)</span>
                <span>50% (Sedang)</span>
                <span>75% (Berat)</span>
                <span>100% (Kritis)</span>
              </div>
            </div>

            {/* Macroeconomic Indicators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">BI-Rate</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-red-400">{biRate.toFixed(2)}%</span>
                  {shockPercent > 0 && (
                    <span className="text-[9px] text-red-500">+{((biRate - baseBiRate)).toFixed(2)}%</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">Suku bunga acuan bank sentral</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inflasi Jawa Barat</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-red-400">{inflation.toFixed(2)}%</span>
                  {shockPercent > 0 && (
                    <span className="text-[9px] text-red-500">+{((inflation - baseInflation)).toFixed(2)}%</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">Kenaikan harga barang tahunan</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex flex-col justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PDRB Growth (Sektor Utama)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-base font-extrabold ${pdrbGrowth < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                    {pdrbGrowth.toFixed(2)}%
                  </span>
                  {shockPercent > 0 && (
                    <span className="text-[9px] text-red-500">-{((basePdrbGrowth - pdrbGrowth)).toFixed(2)}%</span>
                  )}
                </div>
                <span className="text-[9px] text-slate-500 mt-1">Pertumbuhan ekonomi regional</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Base Expected Loss</p>
            <p className="text-xl font-bold text-white">{formatRupiah(baseEL)}</p>
            <p className="text-xs text-slate-500">PD: {basePD}%</p>
          </div>
          <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-900/30 border border-red-500/20' : 'bg-slate-800/50'}`}>
            <p className="text-xs text-slate-400 mb-1">Stressed Expected Loss</p>
            <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
              {formatRupiah(stressedEL)}
            </p>
            <p className="text-xs text-slate-500">PD: {stressedPD}%</p>
          </div>
          <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-900/30 border border-red-500/20' : 'bg-slate-800/50'}`}>
            <p className="text-xs text-slate-400 mb-1">Additional Loss</p>
            <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
              {formatRupiah(additionalLoss)}
            </p>
            <p className="text-xs text-slate-500">
              {showStress ? `+${shockPercent}% dari base` : '0% dari base'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
