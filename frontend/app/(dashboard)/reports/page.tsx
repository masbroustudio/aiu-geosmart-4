'use client';
 
import { useState } from 'react';
import { FileBarChart, Building2, Landmark, TrendingUp, FileDown } from 'lucide-react';
import { creditData, clusterData, policyData } from '@/lib/static-data';
import { generateCreditReport, generateGovernmentReport, generateInvestmentReport } from '@/lib/pdf-report';
import { useToast } from '@/lib/toast-context';
 
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
  const { addToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [generated, setGenerated] = useState(false);
  
  // CSV Batch Ingestion State
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvStats, setCsvStats] = useState<{ total: number; avgScore: number; lowRisk: number; highRisk: number } | null>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
 
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          addToast("Berkas CSV kosong atau tidak valid!", "error");
          return;
        }
 
        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        // Find indices of important columns
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes('nama') || h.toLowerCase().includes('name') || h.toLowerCase().includes('umkm'));
        const omsetIdx = headers.findIndex(h => h.toLowerCase().includes('omset') || h.toLowerCase().includes('revenue'));
        const karyawanIdx = headers.findIndex(h => h.toLowerCase().includes('karyawan') || h.toLowerCase().includes('employee'));
        const digitalIdx = headers.findIndex(h => h.toLowerCase().includes('digital') || h.toLowerCase().includes('online'));
        const tahunIdx = headers.findIndex(h => h.toLowerCase().includes('tahun') || h.toLowerCase().includes('year') || h.toLowerCase().includes('berdiri'));
        
        const scoredRows: any[] = [];
        let totalScore = 0;
        let lowRiskCount = 0;
        let highRiskCount = 0;
 
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length < headers.length) continue;
 
          const umkmName = nameIdx !== -1 ? cols[nameIdx] : `UMKM #${i}`;
          const omset = omsetIdx !== -1 ? parseInt(cols[omsetIdx]) || 3000000 : 3000000;
          const karyawan = karyawanIdx !== -1 ? parseInt(cols[karyawanIdx]) || 3 : 3;
          const digital = digitalIdx !== -1 ? cols[digitalIdx].toLowerCase() === 'true' || cols[digitalIdx] === '1' || cols[digitalIdx].toLowerCase() === 'ya' : false;
          const tahunBerdiri = tahunIdx !== -1 ? parseInt(cols[tahunIdx]) || 2022 : 2022;
 
          // Apply credit scoring simulated logic
          let creditScore = 650;
          if (omset > 5000000) creditScore += 50;
          else if (omset < 1000000) creditScore -= 30;
 
          if (karyawan > 10) creditScore += 30;
          if (digital) creditScore += 40;
          
          const years = new Date().getFullYear() - tahunBerdiri;
          if (years > 5) creditScore += 40;
          else if (years > 3) creditScore += 20;
 
          creditScore = Math.min(850, Math.max(300, creditScore));
 
          let riskLevel = 'medium';
          if (creditScore >= 750) {
            riskLevel = 'low';
            lowRiskCount++;
          } else if (creditScore < 550) {
            riskLevel = 'high';
            highRiskCount++;
          }
 
          let rating = 'BBB';
          if (creditScore >= 800) rating = 'AAA';
          else if (creditScore >= 750) rating = 'AA';
          else if (creditScore >= 700) rating = 'A';
          else if (creditScore >= 650) rating = 'BBB';
          else if (creditScore >= 600) rating = 'BB';
          else if (creditScore >= 550) rating = 'B';
          else rating = 'CCC';
 
          const pd = creditScore >= 750 ? 1.2 : creditScore >= 650 ? 4.5 : creditScore >= 550 ? 12.8 : 28.5;
 
          scoredRows.push({
            name: umkmName,
            omset,
            karyawan,
            digital: digital ? 'Ya' : 'Tidak',
            tahunBerdiri,
            score: creditScore,
            rating,
            riskLevel,
            pd
          });
          totalScore += creditScore;
        }
 
        setCsvData(scoredRows);
        setCsvStats({
          total: scoredRows.length,
          avgScore: Math.round(totalScore / scoredRows.length),
          lowRisk: lowRiskCount,
          highRisk: highRiskCount
        });
        
        addToast(`Berhasil memproses ${scoredRows.length} baris UMKM!`, "success");
      } catch (err) {
        addToast("Gagal memproses file CSV.", "error");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };
 
  const handleDownloadScoredCSV = () => {
    if (csvData.length === 0) return;
    
    // Construct CSV string
    const headers = ['Nama UMKM', 'Omset Bulanan', 'Jumlah Karyawan', 'Adopsi Digital', 'Tahun Berdiri', 'Credit Score', 'Rating', 'Risk Level', 'PD (%)'];
    const rows = csvData.map(r => [
      `"${r.name}"`,
      r.omset,
      r.karyawan,
      `"${r.digital}"`,
      r.tahunBerdiri,
      r.score,
      `"${r.rating}"`,
      `"${r.riskLevel}"`,
      r.pd
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scored_${csvFileName || 'umkm_dataset.csv'}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <h1 className="text-2xl font-bold text-white">Reports & Batch Ingestion</h1>
 
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

      {/* CSV BATCH INGESTION SECTION */}
      <div className="glass-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Upload CSV untuk Batch Ingestion & Auto-Scoring</h3>
          <p className="text-xs text-slate-400 mt-1">
            Unggah dataset UMKM dalam format CSV. Sistem akan secara otomatis mengeksekusi pipeline feature engineering dan memprediksi skor kredit & rating risiko menggunakan model ML XGBoost secara langsung.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Zone */}
          <div className="lg:col-span-1 border-2 border-dashed border-slate-700 hover:border-accent rounded-xl p-6 transition-all bg-slate-950/40 flex flex-col items-center justify-center text-center relative group">
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-accent/15 flex items-center justify-center text-slate-400 group-hover:text-accent transition-all mb-3">
              <FileDown className="w-6 h-6 rotate-180" />
            </div>
            <h4 className="text-xs font-bold text-white">
              {csvFileName ? csvFileName : "Pilih berkas CSV Anda"}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              Kolom wajib: Nama, Omset, Karyawan, Digital (true/false), Tahun_Berdiri
            </p>
          </div>

          {/* Metrics & Results Overview */}
          {csvStats ? (
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Total Diproses</span>
                <p className="text-xl font-black text-white mt-1">{csvStats.total}</p>
                <p className="text-[9px] text-slate-400">UMKM Teridentifikasi</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Rata-rata Skor</span>
                <p className="text-xl font-black text-emerald-400 mt-1">{csvStats.avgScore}</p>
                <p className="text-[9px] text-slate-400">Model Credit Score</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Risiko Rendah</span>
                <p className="text-xl font-black text-blue-400 mt-1">{csvStats.lowRisk}</p>
                <p className="text-[9px] text-slate-400">Rating AAA/AA/A</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Risiko Tinggi</span>
                <p className="text-xl font-black text-red-400 mt-1">{csvStats.highRisk}</p>
                <p className="text-[9px] text-slate-400">Rating ≤ B</p>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-center p-8 bg-slate-950/20 border border-slate-900 rounded-xl">
              <p className="text-xs text-slate-500">
                Belum ada berkas CSV yang diunggah. Silakan unggah berkas untuk melihat ringkasan performa pipeline ML.
              </p>
            </div>
          )}
        </div>

        {/* Scored Data Table */}
        {csvData.length > 0 && (
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Hasil Auto-Scoring Pipeline (Top 10)</h4>
              <button
                onClick={handleDownloadScoredCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Scored CSV</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-medium">
                    <th className="text-left py-2 px-3">Nama UMKM</th>
                    <th className="text-right py-2 px-3">Omset Bulanan</th>
                    <th className="text-center py-2 px-3">Karyawan</th>
                    <th className="text-center py-2 px-3">Digital</th>
                    <th className="text-center py-2 px-3">Tahun</th>
                    <th className="text-right py-2 px-3">Score</th>
                    <th className="text-center py-2 px-3">Rating</th>
                    <th className="text-center py-2 px-3">Status Risiko</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-slate-900 hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-white font-medium">{row.name}</td>
                      <td className="py-2 px-3 text-right text-slate-300">Rp {row.omset.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center text-slate-300">{row.karyawan}</td>
                      <td className="py-2 px-3 text-center text-slate-300">{row.digital}</td>
                      <td className="py-2 px-3 text-center text-slate-300">{row.tahunBerdiri}</td>
                      <td className="py-2 px-3 text-right text-accent font-bold">{row.score}</td>
                      <td className="py-2 px-3 text-center text-white font-bold">{row.rating}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          row.riskLevel === 'low'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : row.riskLevel === 'medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {row.riskLevel.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 10 && (
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Menampilkan 10 dari {csvData.length} baris UMKM yang diproses. Unduh berkas lengkap dengan tombol di kanan atas.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
