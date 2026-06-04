'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { postChat } from '@/lib/api';
import {
  clusterSummaries,
  locationHighlights,
  kabupatenSummaries,
  modelMetrics,
  suggestedQuestions,
} from '@/lib/knowledge-base';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Persona = 'government' | 'bank' | 'investor';

const personaLabels: Record<Persona, string> = {
  bank: 'Bank',
  government: 'Government',
  investor: 'Investor',
};

function formatMessage(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bullet points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2);
      return (
        <div key={i} className="flex gap-2 ml-2 my-0.5">
          <span className="text-accent shrink-0">&#8226;</span>
          <span>{formatInline(content)}</span>
        </div>
      );
    }
    // Source citations
    if (line.match(/^\[Sumber:/)) {
      return (
        <div key={i} className="text-xs text-slate-500 mt-1 italic">
          {line}
        </div>
      );
    }
    // Empty line
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    // Regular line
    return <div key={i} className="my-0.5">{formatInline(line)}</div>;
  });
}

function formatInline(text: string) {
  // Handle **bold** markers and [Sumber: ...] citations
  const parts = text.split(/(\*\*[^*]+\*\*|\[Sumber:[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('[Sumber:')) {
      return <span key={i} className="text-xs text-slate-500 italic">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
function getEnhancedResponse(message: string, persona: Persona): string {
  const lower = message.toLowerCase();

  // Intercept menu/page queries
  if (lower.includes("halaman") || lower.includes("fitur") || lower.includes("menu") || lower.includes("dasbor") || lower.includes("dashboard")) {
    return `**Panduan Fitur & Halaman Dasbor GeoUMKM Smart v4.0:**\n\nPlatform ini menyediakan 8 modul utama di Dasbor yang dapat diakses melalui Sidebar:\n1. **Overview**: Menampilkan ringkasan metrik eksekutif, peta interaktif sebaran UMKM, status cluster, dan top kabupaten berdasarkan skor potensi.\n2. **Credit Scoring**: Menyajikan sebaran rating kredit (AAA hingga CCC), analisis Probability of Default (PD), dan faktor penjelas model SHAP (XGBoost).\n3. **Portfolio Analytics**: Memantau kinerja portofolio pembiayaan UMKM (Total disalurkan, Yield, NPL) beserta simulasi uji stres portofolio.\n4. **Location Intelligence**: Menyaring rekomendasi lokasi potensial berdasarkan jenis usaha dan menyajikan simulator kebijakan serta radar perbandingan antar wilayah.\n5. **Clustering**: Menganalisis pengelompokan UMKM ke dalam 5 profil segmentasi berdasarkan kematangan digital dan infrastruktur daerah.\n6. **Policy Simulation**: Menyimulasikan dampak alokasi anggaran daerah terhadap peningkatan skor potensi UMKM dan tingkat kelangsungan hidup.\n7. **Reports**: Mengunduh laporan PDF eksekutif komprehensif dan mengekspor dataset UMKM terklasifikasi dalam format CSV.\n8. **Settings**: Mengatur preferensi profil pengguna, tema gelap/terang, bahasa, alerting notifikasi, regenerasi API Keys developer, serta pembersihan data sesi database.`;
  }

  if (lower.includes("setting") || lower.includes("pengaturan")) {
    return `**Menu Settings (Pengaturan) v4.0:**\n\nHalaman Pengaturan mencakup:\n- **Profil Akun**: Menampilkan nama, email, dan peran otentikasi (viewer/administrator) Anda yang didekode langsung dari token JWT. Anda juga dapat memperbarui nama atau password.\n- **Tampilan & Preferensi**: Mengubah tema sistem (Gelap/Terang) secara real-time yang terhubung ke context, pilihan bahasa (Indonesia/Inggris), serta tombol sakelar notifikasi laporan mingguan dan log audit.\n- **Integrasi & API**: Menyediakan base URL endpoint REST API SWA dan API Key aktif yang dapat disalin atau dibuat ulang untuk integrasi eksternal.\n- **Sistem & Database**: Memberikan status database, wilayah cloud Azure East Asia, versi aplikasi, serta opsi pembersihan data sesi.`;
  }

  if (lower.includes("report") || lower.includes("laporan")) {
    return `**Menu Reports (Laporan) v4.0:**\n\nHalaman Laporan memungkinkan Anda untuk:\n- **Download PDF Executive Summary**: Menghasilkan berkas laporan PDF berkualitas tinggi secara langsung dari browser menggunakan jsPDF, lengkap dengan ringkasan eksekutif, tabel cluster, dan analisis kredit.\n- **Export Data CSV**: Mengekspor data terkompresi dari dataset UMKM (termasuk koordinat, skor, dan kelompok cluster) ke berkas CSV.`;
  }

  if (lower.includes("portofolio") || lower.includes("portfolio")) {
    return `**Menu Portfolio Analytics v4.0:**\n\nHalaman Portfolio memantau kesehatan pembiayaan:\n- **Metrik Utama**: Total eksposur kredit (Rp 585.0 Miliar), Yield Rata-rata (11.8%), NPL Ratio (4.2%), dan Expected Loss (Rp 175.5 Miliar).\n- **Analisis Stres Portofolio**: Menyediakan simulasi stress test (Skenario Ringan, Sedang, Berat) untuk melihat perkiraan lonjakan rasio NPL jika kondisi makroekonomi memburuk.`;
  }

  // Credit/score queries
  if (lower.includes('kredit') || lower.includes('credit') || lower.includes('skor') || lower.includes('score')) {
    if (persona === 'bank') {
      return `**Distribusi Credit Band Portfolio:**\n\n- **AAA** (skor 750-850): 976 UMKM (9.8%) - Default rate 3.9%\n- **AA** (skor 700-749): 1,534 UMKM (15.3%) - Default rate 4.2%\n- **A** (skor 650-699): 1,691 UMKM (16.9%) - Default rate 7.5%\n- **BBB** (skor 600-649): 1,549 UMKM (15.5%) - Default rate 12.7%\n- **BB** (skor 550-599): 1,265 UMKM (12.7%) - Default rate 30.2%\n- **B** (skor 450-549): 1,975 UMKM (19.8%) - Default rate 73.5%\n- **CCC/CC/C** (skor 300-449): 1,010 UMKM (10.1%) - Default rate 93.3%\n\n**Rata-rata PD portfolio:** 43.20%\n**Expected Loss:** Rp 175.5 Miliar\n\n[Sumber: Credit Risk Model]`;
    }
    return `**Credit Scoring Overview:**\n\n- Total UMKM dinilai: 10,000\n- Default rate rata-rata: 32.01%\n- Survival rate: 67.99%\n\n**Top 3 Faktor Penentu (XGBoost SHAP):**\n- 1. Monthly Revenue (omset_bulanan)\n- 2. Revenue per Employee (omset_per_karyawan)\n- 3. Business Age (tahun_berdiri)\n\n[Sumber: Credit Risk Model]`;
  }

  // Default/NPL/risk queries
  if (lower.includes('default') || lower.includes('npl') || lower.includes('risiko kredit')) {
    return `**Analisis Default & NPL:**\n\n- **Default Rate Portfolio:** 32.01%\n- **Survival Rate Rata-rata:** 67.99%\n- **Rasio NPL Saat Ini:** 4.2%\n\n**Distribusi Risiko per Wilayah (Berdasarkan Data):**\n- Area urban (Kota Depok, Kota Bandung, Kota Bekasi): Skor potensi tinggi (80-82), default rate rendah (~4-8%)\n- Area rural (Kab. Sukabumi, Kab. Garut, Kab. Pangandaran): Skor potensi rendah (28-31), default rate tinggi (>60%)\n\n[Sumber: Credit Risk Model]`;
  }

  // Cluster queries
  if (lower.includes('cluster') || lower.includes('klaster') || lower.includes('segmen')) {
    if (persona === 'investor') {
      return `**Cluster dengan Peluang Investasi Tertinggi:**\n\n**1. Urban Digital Leaders** (2,368 UMKM, 23.7%)\n- Karakteristik: Kematangan digital tertinggi (74.1%), Survival rate tinggi (71.9%), omset kuat.\n\n**2. Rural Developing** (2,684 UMKM, 26.8%)\n- Karakteristik: Potensi pasar besar, persaingan rendah, namun perlu peningkatan infrastruktur dasar.\n\n**Peringkat Investasi Cluster:**\n- #1 Urban Digital Leaders (Investment Score: 0.962)\n- #2 Rural Developing (Investment Score: 0.525)\n- #3 Urban Digital Leaders (2) (Investment Score: 0.522)\n- #4 High-Risk Underserved (4) (Investment Score: 0.489)\n- #5 High-Risk Underserved (Investment Score: 0.200)\n\n[Sumber: Cluster Analysis]`;
    }
    if (persona === 'government') {
      return `**Cluster Prioritas Intervensi Pemerintah:**\n\n**#1 Prioritas: High-Risk Underserved** (2,124 UMKM, 21.2%)\n- Karakteristik: Skor infrastruktur terendah (53.1), adopsi digital rendah (31.4%), penetrasi KUR minim.\n- Kelemahan: Kerentanan terhadap default tinggi, sarana internet terbatas.\n\n**Semua Cluster (Berdasarkan Prioritas Pemerintah):**\n- 1. High-Risk Underserved (Priority Score: 0.968, Alokasi Budget: 41.5%)\n- 2. High-Risk Underserved (4) (Priority Score: 0.725, Alokasi Budget: 27.8%)\n- 3. Rural Developing (Priority Score: 0.484, Alokasi Budget: 26.2%)\n- 4. Urban Digital Leaders (2) (Priority Score: 0.191, Alokasi Budget: 3.6%)\n- 5. Urban Digital Leaders (Priority Score: 0.019, Alokasi Budget: 0.9%)\n\n[Sumber: Government Priority Cluster]`;
    }
    return `**5 Segmentasi Cluster UMKM:**\n- **Rural Developing**: 2,684 UMKM (26.8%)\n- **Urban Digital Leaders**: 2,368 UMKM (23.7%)\n- **High-Risk Underserved**: 2,124 UMKM (21.2%)\n- **High-Risk Underserved (4)**: 1,898 UMKM (19.0%)\n- **Urban Digital Leaders (2)**: 926 UMKM (9.3%)\n\n[Sumber: Cluster Analysis]`;
  }

  // Policy/infrastructure queries
  if (lower.includes('kebijakan') || lower.includes('policy') || lower.includes('infrastruktur')) {
    if (persona === 'government') {
      return `**Estimasi Dampak Intervensi Anggaran:**\n\n- **Program Infrastruktur (+30 poin)**: Target 2,507 UMKM terdampak, estimasi skor potensi naik +12.4 poin.\n- **Program Pelatihan Digital**: Target 3,200 UMKM terdampak, estimasi skor potensi naik +8.7 poin.\n- **Ekspansi Penetrasi KUR (+20%)**: Target 4,100 UMKM terdampak, penurunan tingkat default yang signifikan.\n\n*Rekomendasi*: Alokasikan anggaran terbesar (41.5%) ke cluster High-Risk Underserved untuk efektivitas intervensi.\n\n[Sumber: Policy Simulation]`;
    }
    return `**Estimasi Dampak Kebijakan:**\n- Peningkatan Infrastruktur: Peningkatan skor potensi rata-rata sebesar +12.4 poin.\n- Pelatihan Digitalisasi: Peningkatan skor potensi rata-rata sebesar +8.7 poin.\n\n[Sumber: Policy Simulation]`;
  }

  // Budget queries
  if (lower.includes('budget') || lower.includes('anggaran')) {
    return `**Rekomendasi Alokasi Anggaran Pemerintah:**\n\n- **High-Risk Underserved**: 41.5% (Fokus pembangunan jalan, pasar, & internet)\n- **High-Risk Underserved (4)**: 27.8% (Fokus mitigasi risiko bencana & KUR)\n- **Rural Developing**: 26.2% (Fokus perluasan jangkauan digital & literasi)\n- **Urban Digital Leaders (2)**: 3.6% (Fokus perluasan akses fintech & modal kerja)\n- **Urban Digital Leaders**: 0.9% (Fokus scale-up ekspor & komersialisasi digital)\n\n[Sumber: Government Budget Allocation Rules]`;
  }

  // Investment/ROI queries
  if (lower.includes('investasi') || lower.includes('invest') || lower.includes('roi')) {
    return `**Peluang Investasi Wilayah (Investor Mode):**\n\n- **Kota Depok**: Skor Potensi 82.08 (Kompetisi tinggi, daya beli tinggi, digital leaders)\n- **Kota Bandung**: Skor Potensi 81.61 (Daya beli tinggi, hub kreatif & fashion)\n- **Kota Bekasi**: Skor Potensi 80.29 (Daya beli tinggi, klaster logistik & makanan)\n\n*Risiko*: Sektor makanan memiliki kompetisi tertinggi (39.71% proporsi portofolio), sedangkan sektor pertanian memiliki potensi pertumbuhan tinggi dengan kompetisi rendah (hanya 9.93% proporsi).\n\n[Sumber: Investment Opportunity Analysis]`;
  }

  // Market/revenue queries
  if (lower.includes('market') || lower.includes('pasar') || lower.includes('omset')) {
    return `**Market Size & Profil Sektor UMKM:**\n\n- **Total UMKM Aktif**: 10,000 UMKM\n- **Rata-rata Skor Potensi Wilayah**: 56.20/100\n- **Daya Beli Terkuat**: Kota Depok (82.08) & Kota Bandung (81.61)\n\n**Proporsi Sektor Usaha:**\n- Makanan: 3,971 UMKM (39.71%)\n- Fashion: 2,026 UMKM (20.26%)\n- Kerajinan: 1,515 UMKM (15.15%)\n- Jasa: 1,495 UMKM (14.95%)\n- Pertanian: 993 UMKM (9.93%)\n\n[Sumber: Market Aggregations]`;
  }

  // Digital readiness queries
  if (lower.includes('digital') || lower.includes('internet') || lower.includes('teknologi')) {
    return `**Analisis Adopsi Digital UMKM:**\n\n- **Klaster Digital Tertinggi**: Urban Digital Leaders (74.1% digital adoption)\n- **Klaster Digital Terendah**: High-Risk Underserved (31.4% digital adoption)\n- **Rekomendasi Intervensi**: Program literasi digital di area rural (Kab. Pangandaran (28.92 avg score) & Kab. Sukabumi (30.44 avg score)).\n\n[Sumber: Digital Readiness Index]`;
  }

  // Recommendation queries
  if (lower.includes('rekomendasi') || lower.includes('recommend')) {
    if (persona === 'bank') {
      return `**Rekomendasi untuk Bank:**\n- **Ekspansi KUR**: Fokus pada kecamatan dengan skor potensi >70 dan penetrasi KUR saat ini masih rendah.\n- **Penyaringan Risiko**: Gunakan threshold credit score 650 (Rating A ke atas) untuk persetujuan kredit otomatis.\n- **Mitigasi NPL**: Terapkan syarat jaminan tambahan untuk UMKM di cluster High-Risk Underserved.`;
    }
    if (persona === 'government') {
      return `**Rekomendasi untuk Pemerintah:**\n- **Fokus Infrastruktur**: Pembangunan internet desa di Garut & Sukabumi.\n- **Alokasi Anggaran**: Salurkan 41.5% anggaran pembangunan ke cluster High-Risk Underserved.\n- **KUR Terarah**: Subsidi bunga kredit khusus untuk UMKM di sektor pertanian (sektor terkecil 9.93%).`;
    }
    return `**Rekomendasi untuk Investor:**\n- **Top Opportunity**: Cari UMKM di Kota Depok & Kota Bandung (Skor > 81).\n- **High Growth Sektor**: Investasi di sektor Pertanian & Jasa yang kompetisinya masih rendah.\n- **Digital Play**: Prioritaskan UMKM di cluster Urban Digital Leaders untuk efisiensi investasi.`;
  }

  // Model/algorithm queries
  if (lower.includes('model') || lower.includes('algoritma') || lower.includes('machine learning')) {
    return `**Spesifikasi Model Machine Learning GeoUMKM:**\n\n- **Credit Scoring**: Model XGBoost Classifier (prediksi kelangsungan hidup 3 tahun, default rate portfolio 32.01%).\n- **Location Scoring**: Model Random Forest Regressor (prediksi skor potensi 0-100, R2 = 0.81).\n- **Clustering**: Algoritma K-Means (k=5) + DBSCAN untuk segmentasi profil wilayah.\n\n[Sumber: ML Pipeline Documentation]`;
  }

  // UMKM general queries
  if (lower.includes('umkm') || lower.includes('usaha')) {
    return `**Profil Umum UMKM Jawa Barat (10,000 data):**\n- **Sektor Utama**: Makanan (39.71%) & Fashion (20.26%)\n- **Tingkat Kelangsungan Hidup**: 67.99%\n- **Rata-rata Skor Potensi**: 56.20\n- **Kabupaten Terbaik**: Kota Depok (82.08 avg score)\n- **Kabupaten Terendah**: Kab. Pangandaran (28.92 avg score)`;
  }

  // Priority queries
  if (lower.includes('prioritas') || lower.includes('priority')) {
    return `**Daftar Prioritas Pembangunan & Investasi:**\n\n**Top 3 Kabupaten Prioritas Pemerintah (Skor Terendah):**\n- 1. Kab. Pangandaran (28.92/100)\n- 2. Kab. Sukabumi (30.44/100)\n- 3. Kab. Garut (31.63/100)\n\n**Top 3 Kabupaten Prioritas Investasi (Skor Tertinggi):**\n- 1. Kota Depok (82.08/100)\n- 2. Kota Bandung (81.61/100)\n- 3. Kota Bekasi (80.29/100)\n\n[Sumber: Spatial Priority Index]`;
  }

  // Sector queries
  if (lower.includes('makanan') || lower.includes('fashion') || lower.includes('kerajinan') || lower.includes('jasa') || lower.includes('pertanian')) {
    const sector = lower.includes('makanan') ? 'Makanan' : lower.includes('fashion') ? 'Fashion' : lower.includes('kerajinan') ? 'Kerajinan' : lower.includes('jasa') ? 'Jasa' : 'Pertanian';
    const sectorData: Record<string, { count: string; pct: string; desc: string }> = {
      'Makanan': { count: '3,971', pct: '39.71%', desc: 'Sektor terbesar, persaingan ketat di urban area, profit margin stabil.' },
      'Fashion': { count: '2,026', pct: '20.26%', desc: 'Sektor fashion berpusat di Bandung, sensitif terhadap tren digital.' },
      'Kerajinan': { count: '1,515', pct: '15.15%', desc: 'Adopsi digital penting untuk ekspansi pasar nasional/internasional.' },
      'Jasa': { count: '1,495', pct: '14.95%', desc: 'Tumbuh subur di Depok & Bekasi seiring urbanisasi.' },
      'Pertanian': { count: '993', pct: '9.93%', desc: 'Sektor terkecil, potensi pembiayaan KUR tinggi, terpusat di Bogor & Sukabumi.' },
    };
    const d = sectorData[sector];
    return `**Analisis Sektor ${sector}:**\n- Jumlah UMKM: ${d.count} (${d.pct} dari total portfolio)\n- Karakteristik: ${d.desc}\n\n[Sumber: Sektor Profile Aggregation]`;
  }

  // Location queries
  if (lower.includes('lokasi') || lower.includes('location') || lower.includes('kecamatan')) {
    return `**Analisis Wilayah Tingkat Kabupaten:**\n- **Skor Tertinggi**: Kota Depok (82.08) & Kota Bandung (81.61)\n- **Skor Terendah**: Kab. Sukabumi (30.44) & Kab. Pangandaran (28.92)\n\n*Catatan*: Pembangunan jaringan internet dan akses jalan utama berkorelasi kuat (>0.72) dengan kenaikan skor potensi di kabupaten-kabupaten terbawah.`;
  }

  // Specific Kabupaten queries
  for (const name of ['depok', 'bandung', 'bekasi', 'cimahi', 'banjar', 'tasikmalaya', 'ciamis', 'garut', 'sukabumi', 'pangandaran']) {
    if (lower.includes(name)) {
      const kabData: Record<string, { avg: string; status: string; count: string }> = {
        'depok': { avg: '82.08', status: 'Sangat Tinggi (Hub Urban Digital)', count: 'Depok & Depok Baru' },
        'bandung': { avg: '81.61', status: 'Sangat Tinggi (Pusat Industri Kreatif & Kuliner)', count: 'Astana Anyar & Coblong' },
        'bekasi': { avg: '80.29', status: 'Tinggi (Klaster Perdagangan & Jasa)', count: 'Pondok Gede & Bekasi Selatan' },
        'cimahi': { avg: '73.96', status: 'Tinggi (Wilayah suburban berkembang)', count: 'Cimahi Tengah' },
        'banjar': { avg: '65.77', status: 'Sedang (Area agribisnis)', count: 'Kecamatan Banjar' },
        'tasikmalaya': { avg: '35.18', status: 'Rendah (Butuh peningkatan digitalisasi)', count: 'Bantarkalong & Culamega' },
        'ciamis': { avg: '32.88', status: 'Rendah (Butuh intervensi KUR)', count: 'Cidolog' },
        'garut': { avg: '31.63', status: 'Sangat Rendah (Prioritas infrastruktur & internet)', count: 'Cisompet, Cihurip, Singajaya' },
        'sukabumi': { avg: '30.44', status: 'Sangat Rendah (Butuh akses perbankan & jalan)', count: 'Sagaranten, Cicurug, Cidahu' },
        'pangandaran': { avg: '28.92', status: 'Sangat Rendah (Prioritas internet desa & pelatihan)', count: 'Langkaplancar' },
      };
      const kd = kabData[name];
      return `**Analisis Regional Kabupaten/Kota ${name.toUpperCase()}:**\n- **Rata-rata Skor Potensi**: ${kd.avg}/100\n- **Klasifikasi**: ${kd.status}\n- **Kecamatan Sorotan**: ${kd.count}\n\n[Sumber: Spatial Analysis, Notebook 03]`;
    }
  }

  // Default responses
  const defaults: Record<Persona, string> = {
    bank: `Saya asisten AI GeoUMKM (Bank Mode). Saya dapat membantu Anda menganalisis **credit scoring**, **probability of default (PD)**, dan **Expected Loss (EL)** portofolio kredit UMKM.\n\nTopik populer:\n- Distribusi credit score band (AAA hingga CCC)\n- Portofolio Expected Loss (Base EL Rp 175.5M dengan LGD 70%)\n- Wilayah default rate kritis (>60% di Sukabumi & Garut)\n- Pemicu utama default (XGBoost SHAP features)\n\nSilakan ajukan pertanyaan Anda!`,
    government: `Saya asisten AI GeoUMKM (Government Mode). Saya siap membantu Anda menyimulasikan kebijakan anggaran daerah dan mengidentifikasi area prioritas pembangunan.\n\nTopik populer:\n- Cluster Prioritas Pemberdayaan (High-Risk Underserved - Budget 41.5%)\n- Peningkatan skor potensi dengan intervensi infrastruktur\n- Kecamatan prioritas dengan skor terendah (Pangandaran, Sukabumi)\n- Analisis kesenjangan digital (digital gap urban vs rural)\n\nSilakan ajukan pertanyaan Anda!`,
    investor: `Saya asisten AI GeoUMKM (Investor Mode). Saya dapat memberikan wawasan pasar, estimasi market size, dan ROI berdasarkan model machine learning.\n\nTopik populer:\n- Klaster investasi terbaik (Urban Digital Leaders, score 0.962)\n- Kabupaten dengan skor potensi tertinggi (Kota Depok & Kota Bandung)\n- Proporsi sektor usaha paling prospektif (Pertanian & Jasa)\n- Analisis risiko berbanding imbal hasil (risk-return profile)\n\nSilakan ajukan pertanyaan Anda!`,
  };

  return defaults[persona];
}
export default function FloatingChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya asisten AI GeoUMKM. Saya bisa membantu Anda menganalisis data UMKM, credit scoring, dan insight lokasi. Pilih persona dan mulai bertanya!' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>('government');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageOverride?: string) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isLoading) return;
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await postChat({
        message: userMessage,
        persona,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      if (result.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
      } else {
        const response = getEnhancedResponse(userMessage, persona);
        setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      }
    } catch {
      const response = getEnhancedResponse(userMessage, persona);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    handleSend(question);
  };

  const currentSuggestions = suggestedQuestions[persona] || suggestedQuestions.government;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-accent to-accent-600 text-white shadow-xl shadow-accent/30 flex items-center justify-center hover:scale-110 transition-transform"
        whileTap={{ scale: 0.9 }}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 sm:bottom-24 sm:right-6 z-50 w-full sm:w-[380px] h-[80vh] sm:h-[500px] rounded-none sm:rounded-2xl glass-card flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-900/80">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-slate-400">GeoUMKM Intelligence</p>
                </div>
              </div>
              {/* Persona Tabs */}
              <div className="flex gap-1">
                {(Object.keys(personaLabels) as Persona[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      persona === p
                        ? 'bg-accent text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {personaLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.05, 0.3) }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-accent/20 text-slate-200 rounded-br-sm'
                        : 'bg-slate-800 text-slate-300 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-300 px-4 py-3 rounded-xl rounded-bl-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-chat-bounce" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-chat-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-chat-bounce [animation-delay:0.3s]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            <div className="px-4 py-2 border-t border-slate-700/50">
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(q)}
                    className="px-2.5 py-1 text-[11px] rounded-full bg-slate-800 text-slate-400 hover:bg-accent/20 hover:text-accent transition-colors border border-slate-700 hover:border-accent/40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tanya sesuatu..."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 rounded-lg bg-accent text-white hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
