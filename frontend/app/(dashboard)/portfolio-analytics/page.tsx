'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, DollarSign, TrendingDown, AlertTriangle, HelpCircle, ShieldAlert, Layers, Activity, ShieldCheck } from 'lucide-react';
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

// Basel III IRB Mathematical Helpers for Capital Adequacy Simulation
function cumNormalDist(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

function normSinv(p: number): number {
  const a = [-3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,  1.383577518672690e+02, -3.066479895689469e+01,  2.506628277459239e+00];
  const b = [-5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,  6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00,  4.374664141464968e+00,  2.938163982698783e+00];
  const d = [ 7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996e+00,  3.754408661907416e+00];

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let x = 0;
  let q = 0;
  let r = 0;

  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return x;
}

function calcBaselK(pd: number, lgd: number = 0.45): number {
  if (pd <= 0) return 0;
  if (pd >= 1) pd = 0.9999;
  
  // Correlation formula for SME Retail under Basel III
  const R = 0.03 * ((1 - Math.exp(-35 * pd)) / (1 - Math.exp(-35))) +
            0.16 * (1 - (1 - Math.exp(-35 * pd)) / (1 - Math.exp(-35)));

  const g_pd = normSinv(Math.max(0.000001, Math.min(0.999999, pd)));
  const g_999 = 3.09023; // normSinv(0.999)

  const term1 = g_pd / Math.sqrt(1 - R);
  const term2 = Math.sqrt(R / (1 - R)) * g_999;

  const n_term = cumNormalDist(term1 + term2);
  const k = lgd * n_term - pd * lgd;
  return Math.max(0, k);
}

export default function PortfolioAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [showStress, setShowStress] = useState(false);
  const [shockPercent, setShockPercent] = useState(30);
  const [activeTab, setActiveTab] = useState<'macro' | 'basel' | 'buckets'>('macro');

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

  // Basel III IRB Calculations based on Notebook 04 PD Buckets
  const totalExposure = portfolioData.totalExposure;
  const totalUmkm = portfolioData.totalUmkm;
  const baseCAR = 18.5; // 18.5%

  let baseTotalCapitalRequired = 0;
  let baseTotalEL = 0;
  let stressedTotalCapitalRequired = 0;
  let stressedTotalEL = 0;

  const calculatedBuckets = portfolioData.pdRegulatoryBuckets.map((b) => {
    const exp = (b.count / totalUmkm) * totalExposure;
    
    // Base Calculations
    const basePDVal = b.avgPD / 100;
    const baseELVal = basePDVal * 0.45 * exp;
    const baseK = calcBaselK(basePDVal, 0.45);
    const baseKead = baseK * exp;
    
    baseTotalCapitalRequired += baseKead;
    baseTotalEL += baseELVal;

    // Stressed Calculations
    const stressedPDVal = showStress 
      ? Math.min(0.9999, basePDVal * shockMultiplier) 
      : basePDVal;
    const stressedELVal = stressedPDVal * 0.45 * exp;
    const stressedK = calcBaselK(stressedPDVal, 0.45);
    const stressedKead = stressedK * exp;

    stressedTotalCapitalRequired += stressedKead;
    stressedTotalEL += stressedELVal;

    return {
      bucket: b.bucket,
      count: b.count,
      pct: (b.count / totalUmkm) * 100,
      basePD: b.avgPD,
      stressedPD: parseFloat((stressedPDVal * 100).toFixed(2)),
      baseEL: baseELVal,
      stressedEL: stressedELVal,
      baseELRate: b.elRate,
      stressedELRate: parseFloat((stressedPDVal * 0.45 * 100).toFixed(2)),
      exposure: exp
    };
  });

  const baseRWA = baseTotalCapitalRequired * 12.5;
  const stressedRWA = stressedTotalCapitalRequired * 12.5;

  const baseCapitalRequired = baseTotalCapitalRequired;
  const stressedCapitalRequired = stressedTotalCapitalRequired;

  const bankCapitalBase = (baseCAR / 100) * baseRWA;
  const additionalEL = stressedTotalEL - baseTotalEL;
  const bankCapitalStressed = Math.max(0, bankCapitalBase - (showStress ? additionalEL : 0));
  const stressedCARVal = stressedRWA > 0 ? (bankCapitalStressed / stressedRWA) * 100 : 0;

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
          labelTooltip="Rata-rata Probability of Default (PD) tertimbang berdasarkan eksposur kredit masing-masing nasabah UMKM (basis 3 tahun)."
        />
        <KPICard
          icon={AlertTriangle}
          label="Expected Loss"
          value={formatRupiah(portfolioData.expectedLoss)}
          subtitle="EL = EAD x PD x LGD (45%)"
          color="#EF4444"
          trend="down"
          delay={0.3}
          labelTooltip="Estimasi kerugian finansial yang diantisipasi (Exposure at Default x PD x Loss Given Default 45%) sesuai standar CKPN PSAK 71 / IFRS 9 dan basis perhitungan dari model credit risk di notebook (Basel F-IRB standard)."
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
                <div className="flex items-center gap-1.5 mb-2">
                  <p className="text-sm text-slate-400">Herfindahl-Hirschman Index (HHI)</p>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-slate-350 font-normal shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 leading-normal pointer-events-none">
                      Mengukur tingkat konsentrasi kredit. Skor &lt; 1500 berarti portofolio terdistribusi merata (risiko rendah). Skor &gt; 2500 berarti sangat terpusat pada wilayah/sektor tertentu (risiko tinggi).
                    </div>
                  </div>
                </div>
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
          <div className="space-y-4 animate-fade-in">
            {/* Slider */}
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

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800/80 mt-4 mb-2">
              <button
                type="button"
                onClick={() => setActiveTab('macro')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'macro'
                    ? 'border-primary text-white bg-slate-800/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Transmisi Makro & CKPN
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('basel')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'basel'
                    ? 'border-primary text-white bg-slate-800/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Permodalan Basel III
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('buckets')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === 'buckets'
                    ? 'border-primary text-white bg-slate-800/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Migrasi PD Bucket (Notebook)
              </button>
            </div>
          </div>
        )}

        {/* Tab Content 1: Transmisi Makro & CKPN (only shown when showStress is false, or activeTab is macro) */}
        {(!showStress || activeTab === 'macro') && (
          <div className="space-y-4">
            {showStress && (
              /* Macroeconomic Indicators Grid */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
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
            )}

            {/* Expected Loss Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Base Expected Loss (CKPN)</p>
                <p className="text-xl font-bold text-white">{formatRupiah(baseEL)}</p>
                <p className="text-xs text-slate-500 font-mono">Avg PD: {basePD.toFixed(2)}% | LGD: 45%</p>
              </div>
              <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-950/40 border border-red-500/20' : 'bg-slate-800/50'}`}>
                <p className="text-xs text-slate-400 mb-1">Stressed Expected Loss</p>
                <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
                  {formatRupiah(stressedEL)}
                </p>
                <p className="text-xs text-slate-500 font-mono">Avg PD: {stressedPD.toFixed(2)}% | LGD: 45%</p>
              </div>
              <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-950/40 border border-red-500/20' : 'bg-slate-800/50'}`}>
                <p className="text-xs text-slate-400 mb-1">Additional Loss (Beban Cadangan)</p>
                <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
                  {formatRupiah(additionalLoss)}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {showStress ? `+${((additionalLoss/baseEL)*100).toFixed(1)}% dari CKPN normal` : '0% dari CKPN normal'}
                </p>
              </div>
            </div>

            {showStress && (
              /* OJK Advisory Card */
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 space-y-2 mt-4 animate-fade-in-up">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Laporan Sensitivitas CKPN & Ketahanan Aset (OJK Advisory)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Simulasi goncangan makroekonomi sebesar <strong className="text-white">{shockPercent}%</strong> memproyeksikan suku bunga acuan BI-Rate berada pada level <strong className="text-white">{biRate.toFixed(2)}%</strong> dan inflasi Jabar naik ke <strong className="text-white">{inflation.toFixed(2)}%</strong>. Akibat transmisi makroekonomi ini, probabilitas gagal bayar tertimbang portofolio meningkat dari <strong className="text-slate-200">{basePD.toFixed(2)}%</strong> menjadi <strong className="text-red-400">{stressedPD.toFixed(2)}%</strong>.
                </p>
                <p className="text-xs text-slate-350 leading-relaxed">
                  Kenaikan risiko ini menyebabkan beban CKPN (Expected Loss) bertambah sebesar <strong className="text-red-400">{formatRupiah(additionalLoss)}</strong> (naik <strong className="text-red-300">{((additionalLoss/baseEL)*100).toFixed(1)}%</strong>). Bank direkomendasikan meningkatkan penyisihan CKPN demi menjaga coverage ratio, terutama pada sektor makanan dan retail yang sangat sensitif terhadap suku bunga dan daya beli.
                </p>
                <div className="text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900">
                  Formula Transmisi Makro (Notebook Model): PD_stres = PD_base * exp(2.2 * d(BI) + 1.8 * d(Inflasi) + 2.5 * d(Kontraksi PDRB))
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Dampak Permodalan Basel III */}
        {showStress && activeTab === 'basel' && (
          <div className="space-y-4 animate-fade-in">
            {/* Basel III KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Risk-Weighted Assets (RWA)</p>
                <p className="text-xl font-bold text-white">{formatRupiah(stressedRWA)}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Base: {formatRupiah(baseRWA)} ({stressedRWA < baseRWA 
                    ? `-${((1 - stressedRWA / baseRWA) * 100).toFixed(1)}%` 
                    : `+${((stressedRWA / baseRWA - 1) * 100).toFixed(1)}%`})
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-xs text-slate-400 mb-1">Capital Charge (Unexpected Loss)</p>
                <p className="text-xl font-bold text-white">{formatRupiah(stressedCapitalRequired)}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Rasio Modal (K): {(baseTotalCapitalRequired / totalExposure * 100).toFixed(2)}% {"\u2192"} {(stressedTotalCapitalRequired / totalExposure * 100).toFixed(2)}%
                </p>
              </div>

              <div className={`p-4 rounded-lg border transition-colors ${
                stressedCARVal < 8.0 
                  ? 'bg-red-950/40 border-red-500/30' 
                  : stressedCARVal < 12.0 
                    ? 'bg-yellow-950/40 border-yellow-500/30' 
                    : 'bg-emerald-950/40 border-emerald-500/30'
              }`}>
                <p className="text-xs text-slate-400 mb-1">Capital Adequacy Ratio (CAR)</p>
                <p className={`text-xl font-bold ${
                  stressedCARVal < 8.0 
                    ? 'text-red-400' 
                    : stressedCARVal < 12.0 
                      ? 'text-yellow-400' 
                      : 'text-emerald-400'
                }`}>
                  {stressedCARVal.toFixed(2)}%
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Base: 18.50% | Batas Min OJK: 8.0%
                </p>
              </div>
            </div>

            {/* Explanatory Advisory */}
            <div className={`p-4 rounded-xl border space-y-2 mt-4 ${
              stressedCARVal < 8.0 
                ? 'bg-red-950/20 border-red-900/30' 
                : stressedCARVal < 12.0 
                  ? 'bg-yellow-950/20 border-yellow-900/30' 
                  : 'bg-emerald-950/20 border-emerald-900/30'
            }`}>
              <div className={`flex items-center gap-2 font-bold text-xs ${
                stressedCARVal < 8.0 
                  ? 'text-red-400' 
                  : stressedCARVal < 12.0 
                    ? 'text-yellow-400' 
                    : 'text-emerald-400'
              }`}>
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <span>Simulasi Ketahanan Modal (Basel III IRB SME Approach)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Di bawah standar **Basel III Internal Ratings-Based (IRB) untuk Retail SME**, Bank wajib mencadangkan modal berdasarkan estimasi Unexpected Loss. Dengan shock sebesar <strong className="text-white">+{shockPercent}%</strong>, CAR Bank disimulasikan turun dari <strong className="text-white">18.50%</strong> menjadi <strong className={`${stressedCARVal < 12.0 ? 'text-yellow-400' : 'text-white'}`}>{stressedCARVal.toFixed(2)}%</strong>. 
              </p>
              <p className="text-xs text-slate-350 leading-relaxed">
                {stressedCARVal < 8.0 ? (
                  <strong className="text-red-400">Peringatan Kritis: Rasio kecukupan modal (CAR) Bank berada di bawah batas minimum regulator (8.0%). Bank wajib melakukan injeksi modal atau membatasi eksposur kredit UMKM baru segera.</strong>
                ) : stressedCARVal < 12.0 ? (
                  <strong className="text-yellow-400">Peringatan: CAR mengalami penurunan signifikan mendekati threshold internal (12.0%). Disarankan melakukan pengetatan portofolio (kriteria screening) dan menahan pembagian dividen tahun ini.</strong>
                ) : (
                  <strong className="text-emerald-400">Rasio permodalan Bank masih dalam batas aman (CAR &gt; 12.0%). Bank memiliki modal yang cukup untuk menyerap potensi kerugian kredit akibat goncangan makroekonomi ini.</strong>
                )}
              </p>
              <div className="text-[9px] text-slate-500 font-mono pt-2 border-t border-slate-900 leading-normal">
                Keterangan Teknis RWA: Penurunan RWA dalam skenario stres ekstrem terjadi karena perpindahan aset ke kategori defaulted imminent (gagal bayar), di mana aset tersebut dihapus atau di-net-kan dengan cadangan kerugian (EL/CKPN) secara langsung sehingga mengurangi aset penimbang risiko lancar.
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Distribusi PD Bucket Regulasi */}
        {showStress && activeTab === 'buckets' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Distribusi Debitur per PD Bucket Regulasi</h4>
                <p className="text-xs text-slate-400 mt-0.5">Migrasi risiko debitur (10,000 UMKMs) akibat goncangan makroekonomi.</p>
              </div>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                LGD: 45% (Basel III)
              </span>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-800/80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Basel PD Bucket</th>
                    <th className="py-2.5 px-3 text-right">Debitur (Count)</th>
                    <th className="py-2.5 px-3 text-right">Porsi (%)</th>
                    <th className="py-2.5 px-3 text-right">Rata-rata PD (Normal)</th>
                    <th className="py-2.5 px-3 text-right text-red-400">Stressed PD</th>
                    <th className="py-2.5 px-3 text-right">EL Rate (Normal)</th>
                    <th className="py-2.5 px-3 text-right text-red-400">Stressed EL Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {calculatedBuckets.map((row, idx) => {
                    // Set color based on risk rating
                    let badgeColor = "text-emerald-450 bg-emerald-500/10";
                    if (row.bucket.includes("Moderate")) badgeColor = "text-emerald-350 bg-emerald-500/5";
                    else if (row.bucket.includes("Elevated")) badgeColor = "text-yellow-450 bg-yellow-500/10";
                    else if (row.bucket.includes("Very high")) badgeColor = "text-red-450 bg-red-500/10";
                    else if (row.bucket.includes("High risk")) badgeColor = "text-orange-455 bg-orange-500/10";
                    else if (row.bucket.includes("Default")) badgeColor = "text-rose-500 bg-rose-500/20 font-semibold";

                    return (
                      <tr key={idx} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-2 px-3 font-medium">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${badgeColor}`}>
                            {row.bucket}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200">{row.count.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{row.pct.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-slate-300">{row.basePD.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-red-400 font-medium">{row.stressedPD.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-slate-400">{row.baseELRate.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-red-400 font-medium">{row.stressedELRate.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-slate-900/40 rounded-lg text-[10px] text-slate-400 leading-normal flex gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Catatan Analisis Migrasi:</strong> PD Bucket regulasi memetakan debitur UMKM berdasarkan tingkat probabilitas gagal bayar. Ketika terjadi guncangan makro, debitur mengalami kenaikan PD secara eksponensial (risk migration) sehingga bergeser dari bucket risiko rendah ke bucket risiko tinggi, yang melipatgandakan kebutuhan CKPN bank.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
