'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Users, TrendingUp, DollarSign, Shield, Wifi, Building2, AlertTriangle, Droplets, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import KPICard from '@/components/dashboard/KPICard';
import { kecamatanDetailMap } from '@/lib/kecamatan-detail-data';
import { kecamatanMapData, kecamatanDetailData } from '@/lib/static-data';
import { fetchRecommendations, fetchKecamatanRef } from '@/lib/api';

const KecamatanMiniMap = dynamic(() => import('@/components/dashboard/KecamatanMiniMap'), { ssr: false });

function KecamatanContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const kabupaten = searchParams.get('kabupaten') || '';
  const [loading, setLoading] = useState(true);
  const [dynamicDetail, setDynamicDetail] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If it's in hardcoded map, we don't need dynamic load
    if (kecamatanDetailMap[name]) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadDynamicData() {
      try {
        setLoading(true);
        const [recs, refs] = await Promise.all([
          fetchRecommendations(),
          fetchKecamatanRef()
        ]);

        if (cancelled) return;

        // Find recommendations matching our kecamatan name & kabupaten
        const matches = recs.filter(
          (r: any) => r.kecamatan.toLowerCase() === name.toLowerCase() &&
                     r.kabupaten.toLowerCase() === kabupaten.toLowerCase()
        );

        // Find reference data
        const refEntry = refs.find(
          (r: any) => r.kecamatan.toLowerCase() === name.toLowerCase() &&
                     r.kabupaten_kota.toLowerCase() === kabupaten.toLowerCase()
        );

        if (matches.length === 0 && !refEntry) {
          setErrorMsg(`Data untuk kecamatan "${name}" tidak tersedia.`);
          setLoading(false);
          return;
        }

        // Take the first match or construct from reference
        const mainMatch: any = matches[0];
        
        // Find all recommended businesses for this kecamatan
        const recommended_business = matches.map((m: any) => m.jenis_usaha).filter(Boolean);

        // Fallback or computed fields
        const lat = refEntry?.latitude || mainMatch?.lat || -6.917;
        const lng = refEntry?.longitude || mainMatch?.lng || 107.619;
        const population = refEntry?.populasi || mainMatch?.populasi || 100000;
        const avg_skor_potensi = mainMatch?.avg_score || refEntry?.skor_infrastruktur || 50;
        const avg_omset = mainMatch?.avg_omset || 50;
        const survival_rate = mainMatch?.survival_rate || 70;
        const infrastructure_score = refEntry?.skor_infrastruktur || mainMatch?.avg_infrastruktur || 50;
        const digital_readiness = refEntry?.akses_internet_pct || mainMatch?.avg_internet || 50;
        const financial_access = refEntry?.penetrasi_kur_pct ? (refEntry.penetrasi_kur_pct <= 1 ? refEntry.penetrasi_kur_pct * 100 : refEntry.penetrasi_kur_pct) : (mainMatch?.avg_financial_access || 50);
        const risk_flood = refEntry ? Math.round(refEntry.risiko_banjir * 100) : 20;
        const risk_earthquake = refEntry ? Math.round(refEntry.risiko_gempa * 100) : 20;
        const competition_level = refEntry?.jumlah_kompetitor_radius_3km || mainMatch?.competitorCount || 10;

        // Generate dynamic umkm list using same formula as static data
        const generateUMKMList = (count: number, baseScore: number) => {
          const types = ['Makanan', 'Fashion', 'Kerajinan', 'Jasa', 'Pertanian'];
          const entries = [];
          for (let i = 0; i < count; i++) {
            const variance = (i * 7 + 3) % 40 - 20;
            entries.push({
              jenis_usaha: types[i % types.length],
              omset: Math.round((20 + (baseScore / 100) * 130 + variance) * 10) / 10,
              karyawan: Math.max(1, Math.min(15, Math.round(1 + (baseScore / 100) * 14 + (i % 5 - 2)))),
              skor: Math.max(30, Math.min(95, Math.round(baseScore + variance))),
              digital_presence: baseScore > 50 ? i % 3 !== 0 : i % 4 === 0,
              tahun_berdiri: 2005 + (i * 3) % 18,
            });
          }
          return entries;
        };

        const constructedDetail = {
          name: name,
          kabupaten: kabupaten,
          lat,
          lng,
          population,
          avg_skor_potensi,
          avg_omset,
          survival_rate,
          infrastructure_score,
          digital_readiness,
          financial_access,
          risk_flood,
          risk_earthquake,
          competition_level,
          umkm_list: generateUMKMList(8, avg_skor_potensi),
          recommended_business: recommended_business.length > 0 ? recommended_business : ['Makanan', 'Fashion', 'Jasa'],
          score_breakdown: {
            infrastructure: infrastructure_score,
            digital: digital_readiness,
            financial: financial_access,
            risk: Math.max(0, 100 - (risk_flood + risk_earthquake) / 2),
            location: avg_skor_potensi
          }
        };

        setDynamicDetail(constructedDetail);
      } catch (e) {
        console.error("Error loading dynamic data:", e);
        setErrorMsg("Gagal memuat detail data kecamatan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDynamicData();
    return () => { cancelled = true; };
  }, [name, kabupaten]);

  if (loading) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-700 rounded animate-pulse" />
          <div className="h-8 bg-slate-700 rounded w-1/3 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="glass-card p-6 h-[200px] animate-pulse" />
        <div className="glass-card p-6 h-[300px] animate-pulse" />
      </div>
    );
  }

  // Check if we have detailed data
  const detailData = kecamatanDetailMap[name] || dynamicDetail;

  // Fallback: try to find from map data + detail data
  const mapEntry = kecamatanMapData.find(
    (d) => d.kecamatan === name && d.kabupaten === kabupaten
  );
  const detailEntry = kecamatanDetailData.find(
    (d) => d.kecamatan === name && d.kabupaten === kabupaten
  );

  if (!detailData && !mapEntry) {
    return (
      <div className="space-y-6 mt-12 lg:mt-0">
        <Link href="/overview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Overview</span>
        </Link>
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Kecamatan Tidak Ditemukan</h2>
          <p className="text-slate-400">{errorMsg || `Data untuk kecamatan "${name}" tidak tersedia.`}</p>
        </div>
      </div>
    );
  }


  // Use detailed data if available, otherwise build from basic data
  if (detailData) {
    return <DetailedView data={detailData} />;
  }

  // Basic view from mapData + detailData
  return (
    <BasicView
      name={name}
      kabupaten={kabupaten}
      mapEntry={mapEntry!}
      detailEntry={detailEntry}
    />
  );
}

function DetailedView({ data }: { data: typeof kecamatanDetailMap[string] }) {
  const chartData = [
    { name: 'Infrastructure', value: data.score_breakdown.infrastructure, color: '#3B82F6' },
    { name: 'Digital', value: data.score_breakdown.digital, color: '#8B5CF6' },
    { name: 'Financial', value: data.score_breakdown.financial, color: '#10B981' },
    { name: 'Risk', value: data.score_breakdown.risk, color: '#F59E0B' },
    { name: 'Location', value: data.score_breakdown.location, color: '#EC4899' },
  ];

  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      {/* Back Button */}
      <Link href="/overview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Overview</span>
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">{data.name}</h1>
        <p className="text-slate-400 mt-1">{data.kabupaten}</p>
        <p className="text-xs text-slate-500 mt-1">Koordinat: {data.lat.toFixed(3)}, {data.lng.toFixed(3)}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={Users} label="Populasi" value={data.population.toLocaleString()} subtitle="Jumlah penduduk" color="#3B82F6" delay={0} />
        <KPICard icon={TrendingUp} label="Avg Skor Potensi" value={data.avg_skor_potensi.toFixed(1)} subtitle="Rata-rata skor" color="#10B981" trend="up" delay={0.1} />
        <KPICard icon={DollarSign} label="Avg Omset" value={`${data.avg_omset} Jt`} subtitle="Rata-rata omset/bulan" color="#F59E0B" delay={0.2} />
        <KPICard icon={Shield} label="Survival Rate" value={`${data.survival_rate}%`} subtitle="Tingkat kelangsungan" color="#8B5CF6" trend="up" delay={0.3} />
        <KPICard icon={Building2} label="Infra Score" value={data.infrastructure_score} subtitle="Skor infrastruktur" color="#EC4899" delay={0.4} />
        <KPICard icon={Wifi} label="Digital Readiness" value={data.digital_readiness} subtitle="Kesiapan digital" color="#06B6D4" delay={0.5} />
      </div>

      {/* Mini Map */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Lokasi</h3>
        <div className="h-[200px] rounded-lg overflow-hidden">
          <KecamatanMiniMap lat={data.lat} lng={data.lng} name={data.name} />
        </div>
      </div>

      {/* UMKM List Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daftar UMKM ({data.umkm_list.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Jenis Usaha</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Omset (Jt)</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Karyawan</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Skor</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Digital</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Berdiri</th>
              </tr>
            </thead>
            <tbody>
              {data.umkm_list.map((umkm, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 px-2 text-white">{umkm.jenis_usaha}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{umkm.omset}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{umkm.karyawan}</td>
                  <td className="py-2 px-2 text-right text-slate-300">{umkm.skor}</td>
                  <td className="py-2 px-2 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${umkm.digital_presence ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </td>
                  <td className="py-2 px-2 text-right text-slate-300">{umkm.tahun_berdiri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Breakdown Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Score Breakdown</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#F8FAFC' }}
                itemStyle={{ color: '#94A3B8' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rekomendasi Jenis Usaha</h3>
        <div className="flex flex-wrap gap-2">
          {data.recommended_business.map((biz, idx) => (
            <span key={idx} className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              {biz}
            </span>
          ))}
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h4 className="text-sm font-medium text-slate-400">Risiko Banjir</h4>
          </div>
          <p className="text-2xl font-bold text-white">{data.risk_flood}</p>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-blue-400" style={{ width: `${data.risk_flood}%` }} />
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-orange-400" />
            <h4 className="text-sm font-medium text-slate-400">Risiko Gempa</h4>
          </div>
          <p className="text-2xl font-bold text-white">{data.risk_earthquake}</p>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-orange-400" style={{ width: `${data.risk_earthquake}%` }} />
          </div>
        </div>
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h4 className="text-sm font-medium text-slate-400">Tingkat Kompetisi</h4>
          </div>
          <p className="text-2xl font-bold text-white">{data.competition_level}</p>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-400" style={{ width: `${data.competition_level}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface BasicViewProps {
  name: string;
  kabupaten: string;
  mapEntry: { kecamatan: string; kabupaten: string; lat: number; lng: number; score: number };
  detailEntry?: { kecamatan: string; kabupaten: string; infrastructure: number; risk: number; competition: number; digital_readiness: number; financial_access: number };
}

function BasicView({ name, kabupaten, mapEntry, detailEntry }: BasicViewProps) {
  return (
    <div className="space-y-6 mt-12 lg:mt-0">
      {/* Back Button */}
      <Link href="/overview" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Overview</span>
      </Link>

      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <p className="text-slate-400 mt-1">{kabupaten}</p>
        <p className="text-xs text-slate-500 mt-1">Koordinat: {mapEntry.lat.toFixed(3)}, {mapEntry.lng.toFixed(3)}</p>
      </div>

      {/* KPI Row - limited data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={TrendingUp} label="Skor Potensi" value={mapEntry.score.toFixed(1)} subtitle="Score dari peta" color="#10B981" delay={0} />
        {detailEntry && (
          <>
            <KPICard icon={Building2} label="Infrastructure" value={detailEntry.infrastructure} subtitle="Skor infrastruktur" color="#3B82F6" delay={0.1} />
            <KPICard icon={Wifi} label="Digital Readiness" value={detailEntry.digital_readiness} subtitle="Kesiapan digital" color="#8B5CF6" delay={0.2} />
            <KPICard icon={DollarSign} label="Financial Access" value={detailEntry.financial_access} subtitle="Akses keuangan" color="#F59E0B" delay={0.3} />
            <KPICard icon={AlertTriangle} label="Risk" value={detailEntry.risk} subtitle="Skor risiko" color="#EF4444" delay={0.4} />
            <KPICard icon={Users} label="Competition" value={detailEntry.competition} subtitle="Tingkat kompetisi" color="#EC4899" delay={0.5} />
          </>
        )}
      </div>

      {/* Mini Map */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Lokasi</h3>
        <div className="h-[200px] rounded-lg overflow-hidden">
          <KecamatanMiniMap lat={mapEntry.lat} lng={mapEntry.lng} name={name} />
        </div>
      </div>

      {/* Notice */}
      <div className="glass-card p-6 border-l-4 border-l-yellow-500">
        <p className="text-sm text-slate-400">Data detail lengkap untuk kecamatan ini belum tersedia. Menampilkan data dasar dari peta.</p>
      </div>
    </div>
  );
}

export default function KecamatanPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 mt-12 lg:mt-0">
        <div className="h-8 bg-slate-700 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    }>
      <KecamatanContent />
    </Suspense>
  );
}
