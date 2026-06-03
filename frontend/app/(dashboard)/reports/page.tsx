'use client';

import { useState } from 'react';
import { FileBarChart, Building2, Landmark, TrendingUp, FileDown } from 'lucide-react';
import { creditData, clusterData, policyData } from '@/lib/static-data';
import { generateCreditReport, generateGovernmentReport, generateInvestmentReport } from '@/lib/pdf-report';

type ReportType = 'credit' | 'government' | 'investment';



const reportTemplates = [
  {
    id: 'credit' as ReportType,
    title: 'Credit Risk Summary',
    description: 'Comprehensive credit scoring analysis with risk bands, PD buckets, and default rate metrics for banking stakeholders.',
    icon: Building2,
    audience: 'For Banks',
  },
  {
    id: 'government' as ReportType,
    title: 'Government Priority Report',
    description: 'Priority ranking of clusters and kecamatan with budget allocation recommendations for government policy makers.',
    icon: Landmark,
    audience: 'For Government',
  },
  {
    id: 'investment' as ReportType,
    title: 'Investment Opportunity Brief',
    description: 'Market opportunity analysis with investment scores, market sizes, and cluster profiles for potential investors.',
    icon: TrendingUp,
    audience: 'For Investors',
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const handleDownloadPDF = () => {
    if (selectedReport === 'credit') {
      generateCreditReport(creditData);
    } else if (selectedReport === 'government') {
      generateGovernmentReport({ govPriority: clusterData.govPriority, priorityKecamatan: policyData.priorityKecamatan });
    } else if (selectedReport === 'investment') {
      generateInvestmentReport({ investment: clusterData.investment, profiles: clusterData.profiles });
    }
  };

  const renderPreview = () => {
    if (!selectedReport || !generated) return null;

    if (selectedReport === 'credit') {
      return (
        <div className="space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-lg font-semibold text-accent">Credit Risk Summary Report</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' | Scope: West Java (Jawa Barat) Province-wide'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Total Scored</p>
              <p className="text-lg font-bold text-white">{creditData.bands.reduce((s, b) => s + b.count, 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">High Risk</p>
              <p className="text-lg font-bold text-red-400">{creditData.bands.filter(b => b.rating.includes('Weak') || b.rating.includes('Below')).reduce((s, b) => s + b.count, 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Low Risk</p>
              <p className="text-lg font-bold text-emerald-400">{creditData.bands.slice(0, 3).reduce((s, b) => s + b.count, 0).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Credit Score Bands</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Rating</th>
                    <th className="text-right py-2 px-3 text-slate-400">Count</th>
                    <th className="text-right py-2 px-3 text-slate-400">Portfolio %</th>
                    <th className="text-right py-2 px-3 text-slate-400">Default Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {creditData.bands.map((band, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-2 px-3 text-slate-200">{band.rating}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{band.count.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{band.pctPortfolio}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{band.defaultRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'government') {
      return (
        <div className="space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-lg font-semibold text-accent">Government Priority Report</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' | Scope: West Java (Jawa Barat) Province-wide'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Total UMKMs</p>
              <p className="text-lg font-bold text-white">{clusterData.govPriority.reduce((s, g) => s + g.n_umkm, 0).toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Priority Clusters</p>
              <p className="text-lg font-bold text-amber-400">{clusterData.govPriority.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Priority Kecamatan</p>
              <p className="text-lg font-bold text-emerald-400">{policyData.priorityKecamatan.length}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Priority Ranking</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Rank</th>
                    <th className="text-left py-2 px-3 text-slate-400">Cluster</th>
                    <th className="text-right py-2 px-3 text-slate-400">UMKM</th>
                    <th className="text-right py-2 px-3 text-slate-400">Priority Score</th>
                    <th className="text-right py-2 px-3 text-slate-400">Budget %</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterData.govPriority.map((item, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-2 px-3 text-white">#{item.rank}</td>
                      <td className="py-2 px-3 text-slate-200">{item.cluster}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{item.n_umkm.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-accent">{item.priority_score.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{item.budget_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (selectedReport === 'investment') {
      return (
        <div className="space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-lg font-semibold text-accent">Investment Opportunity Brief</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generated: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' | Scope: West Java (Jawa Barat) Province-wide'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Total Market</p>
              <p className="text-lg font-bold text-white">Rp {clusterData.investment.reduce((s, inv) => s + inv.market_size_juta, 0).toLocaleString()} Jt</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Top Score</p>
              <p className="text-lg font-bold text-emerald-400">{clusterData.investment[0].investment_score.toFixed(3)}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Segments</p>
              <p className="text-lg font-bold text-blue-400">{clusterData.investment.length}</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Investment Opportunities</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400">Rank</th>
                    <th className="text-left py-2 px-3 text-slate-400">Cluster</th>
                    <th className="text-right py-2 px-3 text-slate-400">UMKM</th>
                    <th className="text-right py-2 px-3 text-slate-400">Score</th>
                    <th className="text-right py-2 px-3 text-slate-400">Market (Juta)</th>
                  </tr>
                </thead>
                <tbody>
                  {clusterData.investment.map((item, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-2 px-3 text-white">#{item.rank}</td>
                      <td className="py-2 px-3 text-slate-200">{item.cluster}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{item.n_umkm.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-accent">{item.investment_score.toFixed(3)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{item.market_size_juta.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

      {/* Report Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTemplates.map((template) => {
          const Icon = template.icon;
          const isSelected = selectedReport === template.id;
          return (
            <button
              key={template.id}
              onClick={() => { setSelectedReport(template.id); setGenerated(false); }}
              className={`glass-card p-5 text-left transition-all ${isSelected ? 'ring-2 ring-accent border-accent' : 'hover:border-slate-600'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-accent/20' : 'bg-slate-800'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-slate-400'}`} />
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{template.audience}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{template.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{template.description}</p>
            </button>
          );
        })}
      </div>

      {/* Parameters */}
      {selectedReport && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Report Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Scope:</span>
              <span className="text-sm text-white font-medium">West Java (Jawa Barat) Province-wide</span>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                className="px-6 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <FileBarChart className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {generated && selectedReport && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Report Preview</h3>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          {renderPreview()}
        </div>
      )}
    </div>
  );
}
