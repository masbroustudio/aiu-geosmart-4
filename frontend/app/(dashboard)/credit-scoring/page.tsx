'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Calculator, 
  ShieldCheck, 
  HelpCircle, 
  Activity, 
  ChevronRight, 
  Sparkles, 
  User, 
  Plus, 
  Minus, 
  Info 
} from 'lucide-react';
import { creditData as staticCreditData, shapExplanations } from '@/lib/static-data';
import { fetchCredit, scoreCreditRisk, CreditScoreResponse } from '@/lib/api';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import SHAPWaterfallChart from '@/components/dashboard/SHAPWaterfallChart';
import SHAPInteractiveWaterfall from '@/components/dashboard/SHAPInteractiveWaterfall';
import { useToast } from '@/lib/toast-context';

const riskDistribution = [
  { name: 'Low Risk (AAA-A)', value: 976 + 1534 + 1691, color: '#10B981' },
  { name: 'Medium Risk (BBB)', value: 1549, color: '#FCD34D' },
  { name: 'High Risk (BB-B)', value: 1265 + 1975, color: '#F59E0B' },
  { name: 'Critical (CCC/CC/C)', value: 1010, color: '#EF4444' },
];

export default function CreditScoringPage() {
  const { addToast } = useToast();
  const [creditData, setCreditData] = useState(staticCreditData);
  const [loading, setLoading] = useState(true);
  const [selectedBand, setSelectedBand] = useState('AAA (Excellent)');
  
  // Calculator Form State
  const [umkmName, setUmkmName] = useState('');
  const [sector, setSector] = useState('Makanan');
  const [location, setLocation] = useState('Kota Bekasi');
  const [omset, setOmset] = useState(3000000);
  const [karyawan, setKaryawan] = useState(3);
  const [digital, setDigital] = useState(false);
  const [tahunBerdiri, setTahunBerdiri] = useState(2023);
  
  // Scoring Result State
  const [scoringResult, setScoringResult] = useState<CreditScoreResponse | null>(null);
  const [scoringLoading, setScoringLoading] = useState(false);

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

  const handleCalculateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!umkmName.trim()) {
      addToast("Nama UMKM harus diisi!", "error");
      return;
    }

    setScoringLoading(true);
    try {
      const response = await scoreCreditRisk({
        umkm_name: umkmName,
        sector,
        location,
        omset_bulanan: omset,
        jumlah_karyawan: karyawan,
        has_digital_presence: digital,
        tahun_berdiri: tahunBerdiri,
        skor_infrastruktur: 75,
        skor_potensi: 65
      });

      if (response) {
        setScoringResult(response);
        addToast("Skor Kredit berhasil dihitung!", "success");
      } else {
        addToast("Gagal menghitung skor kredit.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Terjadi kesalahan sistem.", "error");
    } finally {
      setScoringLoading(false);
    }
  };

  // Heuristic SHAP generator based on the backend algorithm to show XAI on frontend
  const getShapContributions = () => {
    if (!scoringResult) return [];
    
    const contribs = [{ name: 'Base Score (Intercept)', value: 650, isPositive: true }];
    
    if (omset > 5000000) {
      contribs.push({ name: 'Omset Bulanan > Rp 5 Jt', value: 50, isPositive: true });
    } else if (omset < 1000000) {
      contribs.push({ name: 'Omset Bulanan < Rp 1 Jt', value: 30, isPositive: false });
    }
    
    if (karyawan > 10) {
      contribs.push({ name: 'Jumlah Karyawan > 10', value: 30, isPositive: true });
    }
    
    if (digital) {
      contribs.push({ name: 'Memiliki Adopsi Digital', value: 40, isPositive: true });
    }
    
    const years = new Date().getFullYear() - tahunBerdiri;
    if (years > 5) {
      contribs.push({ name: 'Lama Usaha > 5 Tahun', value: 40, isPositive: true });
    } else if (years > 3) {
      contribs.push({ name: 'Lama Usaha > 3 Tahun', value: 20, isPositive: true });
    }
    
    // Potential score impact simulated
    contribs.push({ name: 'Faktor Lokasi & Regional', value: 25, isPositive: true });
    
    return contribs;
  };

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

  const shapContribs = getShapContributions();

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-white">Credit Scoring & Assessment</h1>

      {/* SECTION 1: INTERACTIVE CALCULATOR */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="xl:col-span-1 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-accent/20 text-accent">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Simulasi Penilaian ML</h3>
            </div>
            
            <form onSubmit={handleCalculateScore} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama UMKM</label>
                <input
                  type="text"
                  placeholder="Contoh: Warung Berkah"
                  value={umkmName}
                  onChange={(e) => setUmkmName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sektor Usaha</label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Kerajinan">Kerajinan</option>
                    <option value="Jasa">Jasa</option>
                    <option value="Pertanian">Pertanian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Wilayah Kota</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="Kota Bekasi">Kota Bekasi</option>
                    <option value="Kota Depok">Kota Depok</option>
                    <option value="Kota Bandung">Kota Bandung</option>
                    <option value="Kab. Bogor">Kab. Bogor</option>
                    <option value="Kota Cimahi">Kota Cimahi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Omset Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={omset}
                    onChange={(e) => setOmset(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Jumlah Karyawan</label>
                  <input
                    type="number"
                    value={karyawan}
                    onChange={(e) => setKaryawan(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tahun Berdiri</label>
                  <input
                    type="number"
                    value={tahunBerdiri}
                    onChange={(e) => setTahunBerdiri(parseInt(e.target.value) || 2023)}
                    className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={digital}
                      onChange={(e) => setDigital(e.target.checked)}
                      className="w-4 h-4 accent-accent rounded"
                    />
                    <span>Adopsi Digital</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={scoringLoading}
                className="w-full mt-4 py-2.5 rounded bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-accent/20 transition-all font-semibold text-xs text-white disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {scoringLoading ? "Memproses..." : "Hitung Kelaikan Kredit"}
              </button>
            </form>
          </div>
        </div>

        {/* Results Card */}
        <div className="xl:col-span-2 glass-card p-6 flex flex-col justify-between">
          {scoringResult ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-md font-semibold text-white">Hasil Skor Risiko Kredit</h3>
                  <p className="text-[10px] text-slate-400">Model Prediksi: XGBoost Credit Risk v1.0</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  scoringResult.risk_level === 'low' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : scoringResult.risk_level === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  Risiko {scoringResult.risk_level === 'low' ? 'Rendah' : scoringResult.risk_level === 'medium' ? 'Sedang' : 'Tinggi'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Gauge */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Credit Score</span>
                  <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center ${
                    scoringResult.risk_level === 'low' ? 'border-emerald-500' : scoringResult.risk_level === 'medium' ? 'border-amber-500' : 'border-red-500'
                  }`}>
                    <span className="text-3xl font-extrabold text-white">{scoringResult.credit_score}</span>
                    <span className="text-[10px] font-semibold text-slate-400">dari 850</span>
                  </div>
                  <span className="mt-2.5 text-xs font-bold text-slate-300">{scoringResult.rating}</span>
                </div>

                {/* Metrics */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Probability of Default</span>
                      <div className="group relative">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-slate-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 leading-normal pointer-events-none">
                          <strong>Konteks Model Notebook:</strong> PD ini adalah estimasi risiko gagal bayar (tidak bertahan) dalam horizon <strong>3 tahun</strong>, selaras dengan variabel target <em>is_survived_3yr</em> pada notebook modeling XGBoost.
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold text-red-400 mt-1">{scoringResult.predicted_pd}%</p>
                    <p className="text-[9px] text-slate-400 mt-1">Kemungkinan gagal bayar dalam 3 tahun</p>
                  </div>
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-[10px] text-slate-500 font-bold">Confidence: {scoringResult.confidence}%</span>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${scoringResult.confidence}%` }} />
                    </div>
                  </div>
                </div>

                {/* Explainable AI (SHAP Plot mockup) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-900 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Kontribusi Fitur (SHAP)</span>
                  </span>
                  <div className="mt-1">
                    <SHAPInteractiveWaterfall contributions={shapContribs} finalScore={scoringResult.credit_score} />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex gap-2">
                <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-300 leading-normal">
                  <strong>Analisis ML:</strong> {scoringResult.explanation}
                </p>
              </div>

              {/* Dynamic Banking Domain Explanations (OJK & SHAP Improvement Guidance) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                {/* Kolektibilitas OJK & Status */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Kategori Kolektibilitas OJK (Pencocokan)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${
                      scoringResult.credit_score >= 650 ? 'bg-emerald-500' :
                      scoringResult.credit_score >= 550 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} />
                    <p className="text-xs font-bold text-white">
                      {scoringResult.credit_score >= 700 ? 'Kolektibilitas 1 (Lancar) - Sangat Layak' :
                       scoringResult.credit_score >= 650 ? 'Kolektibilitas 1 (Lancar) - Layak' :
                       scoringResult.credit_score >= 550 ? 'Kolektibilitas 2 (Dalam Perhatian Khusus)' :
                       scoringResult.credit_score >= 450 ? 'Kolektibilitas 3-4 (Kurang Lancar / Diragukan)' :
                       'Kolektibilitas 5 (Macet) - Kritis'}
                    </p>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-normal">
                    {scoringResult.credit_score >= 650 
                      ? 'Profil risiko sangat baik. Direkomendasikan untuk penyaluran kredit dengan plafon optimal dan bunga bersaing (KUR).'
                      : scoringResult.credit_score >= 550
                      ? 'Risiko moderat. Kredit disarankan bersyarat dengan jaminan tambahan atau monitoring rasio perputaran kas secara periodik.'
                      : 'Risiko tinggi/kritis. Aplikasi dinilai tidak aman. Disarankan melakukan restrukturisasi rencana bisnis sebelum pengajuan ulang.'}
                  </p>
                </div>

                {/* Rekomendasi Peningkatan Skor */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Rekomendasi Peningkatan Skor Kredit
                  </span>
                  <ul className="space-y-1.5 text-[9.5px] text-slate-455">
                    {!digital && (
                      <li className="flex items-start gap-1">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="text-slate-400">Aktifkan kehadiran digital (adopsi e-commerce/sosmed) untuk menaikkan skor hingga <strong>+40 poin</strong>.</span>
                      </li>
                    )}
                    {omset < 5000000 && (
                      <li className="flex items-start gap-1">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="text-slate-400">Tingkatkan omset bulanan di atas Rp 5 Juta untuk memperoleh tambahan skor <strong>+50 poin</strong>.</span>
                      </li>
                    )}
                    {new Date().getFullYear() - tahunBerdiri <= 3 && (
                      <li className="flex items-start gap-1">
                        <span className="text-slate-500 font-bold">•</span>
                        <span className="text-slate-400">Menjaga kelangsungan usaha hingga usia bisnis &gt;3-5 tahun akan menaikkan skor sebesar <strong>+20 s/d +40 poin</strong>.</span>
                      </li>
                    )}
                    <li className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span className="text-slate-400">Titik acuan dasar model (Intercept) dihitung pada angka <strong>650</strong> (skor rata-rata UMKM).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <Calculator className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-300 mb-1">Kalkulator ML Siap</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Isi parameter UMKM di sebelah kiri dan klik tombol untuk melakukan evaluasi kelaikan kredit real-time menggunakan model machine learning.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Credit Score Bands Table */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Credit Score Bands Portfolio</h3>
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
        <h3 className="text-lg font-semibold text-white mb-4">Global Score Explanation (SHAP Analysis)</h3>
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
