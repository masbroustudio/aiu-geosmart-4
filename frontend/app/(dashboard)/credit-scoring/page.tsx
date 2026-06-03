'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { creditData as staticCreditData, shapExplanations } from '@/lib/static-data';
import { fetchCredit } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import SHAPWaterfallChart from '@/components/dashboard/SHAPWaterfallChart';

const riskDistribution = [
  { name: 'Low Risk (AAA-A)', value: 976 + 1534 + 1691, color: '#10B981' },
  { name: 'Medium Risk (BBB)', value: 1549, color: '#FCD34D' },
  { name: 'High Risk (BB-B)', value: 1265 + 1975, color: '#F59E0B' },
  { name: 'Critical (CCC/CC/C)', value: 1010, color: '#EF4444' },
];

export default function CreditScoringPage() {
  const [creditData, setCreditData] = useState(staticCreditData);
  const [loading, setLoading] = useState(true);
  const [selectedBand, setSelectedBand] = useState('AAA (Excellent)');

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await fetchCredit();
        if (!cancelled) setCreditData(data);
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
        <h1 className="text-2xl font-bold text-white">Credit Scoring</h1>
        <div className="glass-card p-6 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Credit Scoring</h1>

      {/* Credit Score Bands Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Credit Score Bands</h3>
          <DownloadCSVButton data={creditData.bands as unknown as Record<string, unknown>[]} filename="credit-score-bands" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Rating</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Score Range</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Count</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Portfolio %</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Default Rate</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Mean PD</th>
              </tr>
            </thead>
            <tbody>
              {creditData.bands.map((band, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: band.color }} />
                      <span className="text-slate-200">{band.rating}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{band.scoreRange}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{band.count.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{band.pctPortfolio}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{band.defaultRate}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{band.meanPD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Count per Band */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Distribution by Band</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditData.bands} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="rating"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => v.split(' ')[0]}
                />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {creditData.bands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${(name as string)?.split(' ')[0] ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PD Regulatory Buckets Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">PD Regulatory Buckets</h3>
          <DownloadCSVButton data={creditData.pdBuckets as unknown as Record<string, unknown>[]} filename="pd-regulatory-buckets" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Bucket</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Count</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Portfolio %</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Default Rate</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Avg PD</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Expected Loss</th>
              </tr>
            </thead>
            <tbody>
              {creditData.pdBuckets.map((bucket, i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 text-slate-200">{bucket.bucket}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{bucket.count.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{bucket.pctPortfolio}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{bucket.defaultRate}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{bucket.avgPD}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{bucket.expectedLoss}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Explanation (SHAP Analysis) */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Score Explanation (SHAP Analysis)</h3>
        <p className="text-xs text-slate-400 mb-4">
          Explore which features drive the credit score up or down for each rating band.
        </p>
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-1 block">Select Credit Band</label>
          <select
            value={selectedBand}
            onChange={(e) => setSelectedBand(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-accent"
          >
            {Object.keys(shapExplanations).map((band) => (
              <option key={band} value={band}>{band}</option>
            ))}
          </select>
        </div>
        {shapExplanations[selectedBand] && (
          <SHAPWaterfallChart
            explanations={shapExplanations[selectedBand]}
            bandName={selectedBand}
          />
        )}
      </div>
    </div>
  );
}
