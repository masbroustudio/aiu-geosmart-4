'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

      {/* HHI & Diversification */}
      <div className="glass-card p-6">
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
            <p className="text-xs text-slate-500 mt-1">Semakin tinggi semakin terdiversifikasi</p>
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
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Stress Test</h3>
            <p className="text-xs text-slate-400 mt-1">Skenario: Default rate naik {portfolioData.stressTest.changePercent}%</p>
          </div>
          <button
            onClick={() => setShowStress(!showStress)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showStress
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {showStress ? 'Kondisi Normal' : 'Terapkan Stress'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Base Expected Loss</p>
            <p className="text-xl font-bold text-white">{formatRupiah(portfolioData.stressTest.baseExpectedLoss)}</p>
            <p className="text-xs text-slate-500">PD: {portfolioData.weightedAvgPD}%</p>
          </div>
          <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-900/30 border border-red-500/20' : 'bg-slate-800/50'}`}>
            <p className="text-xs text-slate-400 mb-1">Stressed Expected Loss</p>
            <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
              {formatRupiah(portfolioData.stressTest.stressedExpectedLoss)}
            </p>
            <p className="text-xs text-slate-500">PD: {portfolioData.stressTest.stressedDefaultRate}%</p>
          </div>
          <div className={`p-4 rounded-lg transition-colors ${showStress ? 'bg-red-900/30 border border-red-500/20' : 'bg-slate-800/50'}`}>
            <p className="text-xs text-slate-400 mb-1">Additional Loss</p>
            <p className={`text-xl font-bold ${showStress ? 'text-red-400' : 'text-white'}`}>
              {formatRupiah(portfolioData.stressTest.additionalLoss)}
            </p>
            <p className="text-xs text-slate-500">+{portfolioData.stressTest.changePercent}% dari base</p>
          </div>
        </div>
      </div>
    </div>
  );
}
