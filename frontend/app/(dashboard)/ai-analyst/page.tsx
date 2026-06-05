'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Send, 
  Sparkles, 
  Terminal, 
  Table, 
  LineChart as LucideLineChart, 
  TrendingUp, 
  HelpCircle, 
  Download, 
  FileText, 
  Lightbulb, 
  ChevronRight, 
  Play, 
  Database,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import DownloadCSVButton from '@/components/ui/DownloadCSVButton';
import { useToast } from '@/lib/toast-context';
import { fetchStatus, postChat } from '@/lib/api';

// Types for Chat & Analysis
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  artifactRef?: string; // Links message to a specific data science artifact
}

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'completed';
}

interface DataScienceArtifact {
  id: string;
  title: string;
  subtitle: string;
  type: 'correlation' | 'segmentation' | 'risk_forecasting' | 'market_gap';
  chartData: any[];
  tableData: Record<string, any>[];
  insights: { label: string; value: string; desc: string; trend?: 'up' | 'down' }[];
  recommendations: { title: string; desc: string; priority: 'Tinggi' | 'Sedang' | 'Rendah'; target: string }[];
}

export default function AiAnalystPage() {
  const { addToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya **Asisten Analisis Data AI** Anda. Saya dikonfigurasi khusus sebagai data scientist untuk menjelajahi dataset UMKM Jawa Barat.\n\nSilakan pilih salah satu **preset analisis** di bawah ini atau ketik pertanyaan analisis Anda sendiri di kolom obrolan.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [selectedArtifact, setSelectedArtifact] = useState<DataScienceArtifact | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'table' | 'insight' | 'recommendation'>('chart');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Preset Analyses Data
  const artifacts: Record<string, DataScienceArtifact> = {
    correlation: {
      id: 'correlation',
      title: 'Korelasi Konektivitas Internet & Kelangsungan Hidup UMKM',
      subtitle: 'Analisis Pearson & Koefisien Determinasi (R²)',
      type: 'correlation',
      chartData: [
        { bracket: '0-20% Akses', 'UMKM Count': 1054, 'Survival Rate %': 58.2, 'Avg Score': 32.4 },
        { bracket: '20-40% Akses', 'UMKM Count': 2124, 'Survival Rate %': 62.5, 'Avg Score': 45.7 },
        { bracket: '40-60% Akses', 'UMKM Count': 2684, 'Survival Rate %': 66.8, 'Avg Score': 53.7 },
        { bracket: '60-80% Akses', 'UMKM Count': 1898, 'Survival Rate %': 71.3, 'Avg Score': 66.0 },
        { bracket: '80-100% Akses', 'UMKM Count': 2368, 'Survival Rate %': 79.2, 'Avg Score': 83.1 }
      ],
      tableData: [
        { bracket: '0-20% Akses', count: 1054, avg_score: 32.40, survival_pct: 58.2, pearson: 0.584, r2: 0.341 },
        { bracket: '20-40% Akses', count: 2124, avg_score: 45.70, survival_pct: 62.5, pearson: 0.584, r2: 0.341 },
        { bracket: '40-60% Akses', count: 2684, avg_score: 53.70, survival_pct: 66.8, pearson: 0.584, r2: 0.341 },
        { bracket: '60-80% Akses', count: 1898, avg_score: 66.00, survival_pct: 71.3, pearson: 0.584, r2: 0.341 },
        { bracket: '80-100% Akses', count: 2368, avg_score: 83.10, survival_pct: 79.2, pearson: 0.584, r2: 0.341 }
      ],
      insights: [
        { label: 'Pearson Correlation (r)', value: '0.584', desc: 'Menunjukkan hubungan positif sedang-ke-kuat yang signifikan antara akses internet dan masa hidup bisnis.' },
        { label: 'R-Squared (R²)', value: '34.1%', desc: 'Akses internet menjelaskan 34.1% variabilitas dari tingkat kelangsungan hidup UMKM di Jawa Barat.' },
        { label: 'P-Value', value: '< 0.001', desc: 'Hasil korelasi sangat signifikan secara statistik, menolak hipotesis nol secara mutlak.' },
        { label: 'Kesenjangan Survival', value: '+21.0%', desc: 'UMKM di area digital memiliki kelangsungan hidup 21% lebih tinggi dibanding daerah terpencil.' }
      ],
      recommendations: [
        { title: 'Akselerasi Infrastruktur Serat Optik', desc: 'Prioritaskan perluasan jaringan internet pita lebar di 15 kecamatan dengan skor kelangsungan hidup di bawah 60%.', priority: 'Tinggi', target: 'Diskominfo Jabar' },
        { title: 'Program Literasi Digital UMKM', desc: 'Gelar pelatihan kehadiran digital intensif untuk mengonversi konektivitas menjadi omset nyata bagi 2.124 UMKM underserved.', priority: 'Sedang', target: 'Dinas Koperasi & UMKM' },
        { title: 'Subsidi Perangkat IoT Pedesaan', desc: 'Sediakan skema bantuan modem nirkabel bagi sektor kerajinan dan pertanian di kabupaten Bandung Barat dan Sukabumi.', priority: 'Rendah', target: 'Pemprov Jabar' }
      ]
    },
    segmentation: {
      id: 'segmentation',
      title: 'Analisis Peluang Investasi Klaster Wilayah Jabar',
      subtitle: 'Segmentasi UMKM Berdasarkan Potensi Pasar & Daya Dukung',
      type: 'segmentation',
      chartData: [
        { name: 'Urban Digital Leaders', 'Investment Score': 96.2, 'Market Size (Ribu)': 182, 'UMKM Count': 2368 },
        { name: 'Rural Developing', 'Investment Score': 52.5, 'Market Size (Ribu)': 137, 'UMKM Count': 2684 },
        { name: 'Urban Leaders (2)', 'Investment Score': 52.2, 'Market Size (Ribu)': 61, 'UMKM Count': 926 },
        { name: 'High-Risk Underserved (4)', 'Investment Score': 48.9, 'Market Size (Ribu)': 108, 'UMKM Count': 1898 },
        { name: 'High-Risk Underserved', 'Investment Score': 20.0, 'Market Size (Ribu)': 95, 'UMKM Count': 2124 }
      ],
      tableData: [
        { cluster: 'Urban Digital Leaders', score: 0.962, count: 2368, avg_omset: 76.9, market_size_jt: 182167, priority: 'Rendah (Mandiri)' },
        { cluster: 'Rural Developing', score: 0.525, count: 2684, avg_omset: 51.4, market_size_jt: 137994, priority: 'Sedang' },
        { cluster: 'Urban Leaders (2)', score: 0.522, count: 926, avg_omset: 66.2, market_size_jt: 61278, priority: 'Rendah' },
        { cluster: 'High-Risk Underserved (4)', score: 0.489, count: 1898, avg_omset: 57.1, market_size_jt: 108319, priority: 'Tinggi' },
        { cluster: 'High-Risk Underserved', score: 0.200, count: 2124, avg_omset: 45.0, market_size_jt: 95654, priority: 'Sangat Tinggi' }
      ],
      insights: [
        { label: 'Klaster Unggulan Investasi', value: 'Urban Digital Leaders', desc: 'Tingkat kesiapan digital tertinggi (74.1%) dengan rata-rata omset Rp 76.9 juta/bulan membuat segmen ini sangat atraktif bagi investor.' },
        { label: 'Market Size Total', value: 'Rp 585.4 M', desc: 'Akumulasi potensi pasar finansial dari seluruh klaster UMKM di area Jawa Barat.' },
        { label: 'Priority Target Sosial', value: 'High-Risk Underserved', desc: 'Mewakili 2.124 UMKM dengan skor terendah (31.4) yang membutuhkan bantuan stimulus fiskal darurat.' }
      ],
      recommendations: [
        { title: 'Ekspansi Kredit Investasi Mikro', desc: 'Arahkan penyaluran dana KUR perbankan ke klaster Rural Developing yang memiliki produktivitas sedang namun stabil.', priority: 'Tinggi', target: 'Lembaga Penyalur KUR' },
        { title: 'Inkubator Sektor Kreatif', desc: 'Bentuk inkubator bisnis terpadu di kawasan perkotaan Bandung dan Bekasi untuk mempercepat penetrasi produk lokal.', priority: 'Sedang', target: 'Kadin Jabar' }
      ]
    },
    risk_forecasting: {
      id: 'risk_forecasting',
      title: 'Peramalan Tren Risiko Default (Probability of Default) Sektoral',
      subtitle: 'Proyeksi NPL 5 Tahun Berdasarkan Kondisi Stres Portofolio',
      type: 'risk_forecasting',
      chartData: [
        { year: 'Tahun 0', 'Pertanian': 7.5, 'Makanan': 4.2, 'Fashion': 3.9, 'Jasa': 5.2 },
        { year: 'Tahun 1', 'Pertanian': 11.2, 'Makanan': 5.8, 'Fashion': 4.8, 'Jasa': 6.8 },
        { year: 'Tahun 2', 'Pertanian': 18.4, 'Makanan': 7.2, 'Fashion': 5.9, 'Jasa': 8.9 },
        { year: 'Tahun 3', 'Pertanian': 27.5, 'Makanan': 9.5, 'Fashion': 7.5, 'Jasa': 11.4 },
        { year: 'Tahun 4', 'Pertanian': 39.8, 'Makanan': 12.0, 'Fashion': 9.2, 'Jasa': 14.5 },
        { year: 'Tahun 5', 'Pertanian': 52.4, 'Makanan': 15.5, 'Fashion': 11.8, 'Jasa': 18.2 }
      ],
      tableData: [
        { sector: 'Pertanian & Peternakan', baseline_npl: '7.5%', peak_npl: '52.4%', sensitivity: 'Sangat Tinggi (3.5x)', recovery_rate: '22%' },
        { sector: 'Makanan & Kuliner', baseline_npl: '4.2%', peak_npl: '15.5%', sensitivity: 'Sedang (1.8x)', recovery_rate: '45%' },
        { sector: 'Fashion & Tekstil', baseline_npl: '3.9%', peak_npl: '11.8%', sensitivity: 'Rendah (1.3x)', recovery_rate: '52%' },
        { sector: 'Jasa & Logistik', baseline_npl: '5.2%', peak_npl: '18.2%', sensitivity: 'Tinggi (2.2x)', recovery_rate: '38%' }
      ],
      insights: [
        { label: 'Sektor Paling Rentan', value: 'Pertanian', desc: 'Rendahnya digitalisasi dan sensitivitas tinggi terhadap cuaca/inflasi membuat default rate melesat hingga 52.4% dalam skenario stres.' },
        { label: 'Sektor Paling Tangguh', value: 'Fashion & Kuliner', desc: 'Memiliki basis digital presence yang kuat (has_digital_presence >65%) yang bertindak sebagai buffer risiko.' },
        { label: 'Average Recovery Rate', value: '39.25%', desc: 'Estimasi tingkat pengembalian aset perbankan yang macet selama masa guncangan portofolio.' }
      ],
      recommendations: [
        { title: 'Penerapan Kredit Asuransi Tani', desc: 'Wajibkan skema asuransi gagal panen pada pembiayaan pertanian di daerah berisiko bencana gempa/banjir.', priority: 'Tinggi', target: 'Divisi Manajemen Risiko Bank' },
        { title: 'Penyesuaian Plafon Kredit Sektoral', desc: 'Kurangi eksposur pinjaman baru pada sektor non-digital dan alihkan portofolio ke UMKM dengan penjualan omnichannel.', priority: 'Tinggi', target: 'Komite Kredit Perbankan' }
      ]
    },
    market_gap: {
      id: 'market_gap',
      title: 'Peluang Pasar (Spatial Market Gap) Jawa Barat',
      subtitle: 'Analisis Kecamatan Underserved: Populasi Tinggi vs Densitas Kompetitor Rendah',
      type: 'market_gap',
      chartData: [
        { kecamatan: 'Pondok Gede', 'Populasi (Ribu)': 245, 'Kompetitor': 9, 'Gap Score': 24.5 },
        { kecamatan: 'Bojonggede', 'Populasi (Ribu)': 210, 'Kompetitor': 8, 'Gap Score': 23.3 },
        { kecamatan: 'Bekasi Selatan', 'Populasi (Ribu)': 198, 'Kompetitor': 9, 'Gap Score': 19.8 },
        { kecamatan: 'Sukmajaya', 'Populasi (Ribu)': 185, 'Kompetitor': 12, 'Gap Score': 14.2 },
        { kecamatan: 'Cilodong', 'Populasi (Ribu)': 175, 'Kompetitor': 10, 'Gap Score': 15.9 }
      ],
      tableData: [
        { kecamatan: 'Pondok Gede', kabupaten: 'Kota Bekasi', populasi: 245000, kompetitor: 9, rasio_gap: 24500, status: 'Hot Spot' },
        { kecamatan: 'Bojonggede', kabupaten: 'Kab. Bogor', populasi: 210000, kompetitor: 8, rasio_gap: 23333, status: 'Hot Spot' },
        { kecamatan: 'Bekasi Selatan', kabupaten: 'Kota Bekasi', populasi: 198000, kompetitor: 9, rasio_gap: 19800, status: 'Peluang Tinggi' },
        { kecamatan: 'Cilodong', kabupaten: 'Kota Depok', populasi: 175000, kompetitor: 10, rasio_gap: 15909, status: 'Peluang Tinggi' },
        { kecamatan: 'Sukmajaya', kabupaten: 'Kota Depok', populasi: 185000, kompetitor: 12, rasio_gap: 14230, status: 'Sedang' }
      ],
      insights: [
        { label: 'Hot Spot Teratas', value: 'Pondok Gede', desc: 'Rasio gap tertinggi dengan populasi 245,000 jiwa dan hanya 9 kompetitor makanan terdaftar radius 3km.' },
        { label: 'Rekomendasi Ekspansi Sektor', value: 'Makanan & Jasa', desc: 'Tingkat permintaan populasi urban di Bekasi/Depok sangat mendukung pembukaan outlet kuliner baru.' }
      ],
      recommendations: [
        { title: 'Penyediaan Lahan Sentra Kuliner', desc: 'Sediakan fasilitasi zonasi bagi pelaku UMKM kuliner makanan basah di kecamatan Bojonggede dan Pondok Gede.', priority: 'Tinggi', target: 'Pemerintah Daerah Terkait' },
        { title: 'Program Pembiayaan Mikro Khusus', desc: 'Luncurkan produk pembiayaan mikro berbiaya rendah dengan target UMKM baru yang didirikan di area teridentifikasi market gap.', priority: 'Sedang', target: 'BPD Jawa Barat' }
      ]
    }
  };

  // Pipeline Execution Simulator
  const runDataSciencePipeline = async (type: 'correlation' | 'segmentation' | 'risk_forecasting' | 'market_gap', question: string) => {
    setLoading(true);
    setCurrentStepIndex(-1);
    setSelectedArtifact(null);

    const steps: PipelineStep[] = [
      { name: 'Membaca data dan inisialisasi pipeline...', status: 'pending' },
      { name: 'Melakukan preprocessing data & membersihkan pencilan...', status: 'pending' },
      { name: 'Menghitung rumus korelasi/metrik statistik matematika...', status: 'pending' },
      { name: 'Menghasilkan parameter visualisasi dan matriks tabular...', status: 'pending' }
    ];
    setPipelineSteps(steps);

    // Simulate stepping through pipeline with timeouts
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setPipelineSteps(prev => {
        const next = [...prev];
        next[i].status = 'running';
        if (i > 0) next[i - 1].status = 'completed';
        return next;
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setPipelineSteps(prev => {
      const next = [...prev];
      next[steps.length - 1].status = 'completed';
      return next;
    });

    const targetArtifact = artifacts[type];
    setSelectedArtifact(targetArtifact);
    setActiveTab('chart');

    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `Saya telah menyelesaikan **Pipeline Analisis Data** untuk permintaan Anda.\n\n### Hasil Analisis:\n**${targetArtifact.title}**\n\n* ${targetArtifact.insights[0].desc}\n* ${targetArtifact.insights[1].desc}\n\n*Silakan lihat visualisasi grafik, tabel data interaktif, insight penuh, dan rekomendasi eksekutif di **Panel Workspace sebelah kanan**.*`,
        timestamp: new Date(),
        artifactRef: type
      }
    ]);
    
    addToast("Analisis data berhasil dikompilasi!", "success");
    setLoading(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInputValue('');

    const lower = text.toLowerCase();
    
    // Check keywords for in-scope data science mapping
    if (lower.includes('korelasi') || lower.includes('internet') || lower.includes('hubungan')) {
      await runDataSciencePipeline('correlation', text);
    } else if (lower.includes('klaster') || lower.includes('segment') || lower.includes('investasi')) {
      await runDataSciencePipeline('segmentation', text);
    } else if (lower.includes('risiko') || lower.includes('default') || lower.includes('npl') || lower.includes('pd')) {
      await runDataSciencePipeline('risk_forecasting', text);
    } else if (lower.includes('market gap') || lower.includes('kesenjangan') || lower.includes('populasi') || lower.includes('kompetitor')) {
      await runDataSciencePipeline('market_gap', text);
    } else if (lower.includes('halo') || lower.includes('hai') || lower.includes('bantuan')) {
      // Friendly assistant explanation
      setLoading(true);
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Halo! Saya adalah Asisten Data Science Anda. Saya terhubung ke basis data UMKM Jawa Barat (10,000 data) dan siap membantu Anda menjawab berbagai permasalahan analitis.\n\n**Anda dapat mengajukan pertanyaan seperti:**\n* "Bagaimana korelasi antara internet dan tingkat kelangsungan hidup UMKM?"\n* "Tampilkan klaster wilayah dengan potensi investasi terbaik."\n* "Ramalkan default rate pinjaman berdasarkan kategori usaha."\n* "Wilayah mana saja yang memiliki celah pasar (market gap) tinggi?"',
            timestamp: new Date()
          }
        ]);
        setLoading(false);
      }, 500);
    } else {
      setLoading(true);
      try {
        // Call the backend API chat for arbitrary queries!
        const res = await postChat({
          message: text,
          persona: 'government' // default persona for AI Analyst
        });
        
        if (res && res.response) {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: res.response,
              timestamp: new Date()
            }
          ]);
        } else {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Maaf, data tidak tersedia atau di luar cakupan riset saya. Saya dikonfigurasi khusus untuk melakukan analisis data geospasial, risiko kredit, dan klasterisasi UMKM Jawa Barat.',
              timestamp: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error("Gagal memanggil backend chat API:", err);
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Terjadi kesalahan saat menghubungi server analisis AI. Silakan coba beberapa saat lagi.',
            timestamp: new Date()
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-12 lg:mt-0 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* LEFT COLUMN: Chat Interface (40% width) */}
      <div className="lg:w-[40%] flex flex-col h-full bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-850 bg-slate-950/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-serif">Asisten Analisis Data AI</h2>
            <p className="text-[10px] text-slate-400">Data Science & MSME Research Engine</p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm scrollbar-thin">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-line ${
                msg.role === 'user' 
                  ? 'bg-accent text-white rounded-tr-none'
                  : 'bg-slate-900/60 text-slate-200 border border-slate-800/60 rounded-tl-none'
              }`}>
                {msg.content}
                {msg.artifactRef && (
                  <button
                    onClick={() => {
                      setSelectedArtifact(artifacts[msg.artifactRef!]);
                      setActiveTab('chart');
                    }}
                    className="mt-3 w-full py-1.5 rounded-lg bg-accent/20 text-accent font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent/30 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Tampilkan Kembali Hasil di Workspace
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Running pipeline indicator */}
          {loading && pipelineSteps.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/40 space-y-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-accent animate-spin" />
                <span className="text-xs font-semibold text-slate-200">Executing Data Science Pipeline...</span>
              </div>
              <div className="space-y-2">
                {pipelineSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      step.status === 'completed' ? 'bg-emerald-500' :
                      step.status === 'running' ? 'bg-accent animate-ping' :
                      'bg-slate-700'
                    }`} />
                    <span className={
                      step.status === 'completed' ? 'text-slate-400 line-through' :
                      step.status === 'running' ? 'text-white font-medium' :
                      'text-slate-600'
                    }>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Preset Quick Chips */}
        {!loading && (
          <div className="p-3 border-t border-slate-900 bg-slate-950/20">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2 font-bold font-sans">Template Analisis Instan</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleSendMessage("Analisis korelasi akses internet vs kelangsungan hidup UMKM")}
                className="text-[10px] px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left"
              >
                📊 Korelasi Internet vs Survival
              </button>
              <button
                onClick={() => handleSendMessage("Tampilkan klaster wilayah dengan potensi investasi terbaik")}
                className="text-[10px] px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left"
              >
                🎯 Peluang Investasi Klaster
              </button>
              <button
                onClick={() => handleSendMessage("Ramalkan default rate pinjaman berdasarkan kategori usaha")}
                className="text-[10px] px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left"
              >
                📈 Forecast Risiko Default Sektoral
              </button>
              <button
                onClick={() => handleSendMessage("Wilayah mana saja yang memiliki celah pasar (market gap) tinggi?")}
                className="text-[10px] px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors text-left"
              >
                🔍 Deteksi Market Gap Spasial
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Tanyakan pola data korelasi, klaster, atau risiko..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-accent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-accent hover:bg-accent-600 disabled:opacity-40 text-white transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT COLUMN: Artifact Workspace (60% width) */}
      <div className="lg:w-[60%] h-full bg-slate-950/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col justify-between">
        
        {selectedArtifact ? (
          <>
            {/* Header Tabs */}
            <div className="p-4 border-b border-slate-850 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white font-serif">{selectedArtifact.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedArtifact.subtitle}</p>
              </div>
              
              {/* Tab Toggles */}
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'chart' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LucideLineChart className="w-3 h-3" />
                  Visualisasi
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'table' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3 h-3" />
                  Tabel Data
                </button>
                <button
                  onClick={() => setActiveTab('insight')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'insight' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" />
                  Insight
                </button>
                <button
                  onClick={() => setActiveTab('recommendation')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'recommendation' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Rekomendasi
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
              
              {/* Chart View */}
              {activeTab === 'chart' && (
                <div className="h-full min-h-[300px] flex flex-col justify-center">
                  <div className="w-full h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedArtifact.type === 'correlation' ? (
                        <LineChart data={selectedArtifact.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="bracket" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Line type="monotone" name="Tingkat Kelangsungan Hidup UMKM %" dataKey="Survival Rate %" stroke="#3B82F6" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" name="Rata-rata Skor Potensi Wilayah" dataKey="Avg Score" stroke="#10B981" strokeWidth={3} />
                        </LineChart>
                      ) : selectedArtifact.type === 'segmentation' ? (
                        <BarChart data={selectedArtifact.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar name="Skor Kelayakan Investasi" dataKey="Investment Score" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar name="Ukuran Pasar (Skala Ribu)" dataKey="Market Size (Ribu)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : selectedArtifact.type === 'risk_forecasting' ? (
                        <LineChart data={selectedArtifact.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis domain={[0, 60]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Line type="monotone" name="Makanan & Kuliner" dataKey="Makanan" stroke="#10B981" strokeWidth={2.5} />
                          <Line type="monotone" name="Pertanian & Peternakan" dataKey="Pertanian" stroke="#EF4444" strokeWidth={2.5} />
                          <Line type="monotone" name="Fashion & Tekstil" dataKey="Fashion" stroke="#8B5CF6" strokeWidth={2.5} />
                          <Line type="monotone" name="Jasa & Logistik" dataKey="Jasa" stroke="#F59E0B" strokeWidth={2.5} />
                        </LineChart>
                      ) : (
                        <BarChart data={selectedArtifact.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="kecamatan" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar name="Rasio Market Gap (Celah Pasar)" dataKey="Gap Score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                          <Bar name="Populasi Daerah (Skala Ribu)" dataKey="Populasi (Ribu)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Table View */}
              {activeTab === 'table' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <DownloadCSVButton data={selectedArtifact.tableData} filename={`ai-analyst-${selectedArtifact.id}`} />
                  </div>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-855 bg-slate-900/40 text-slate-400 font-sans">
                          {Object.keys(selectedArtifact.tableData[0]).map((key) => (
                            <th key={key} className="py-2.5 px-4 text-left font-medium capitalize">{key.replace('_', ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedArtifact.tableData.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-900/50 hover:bg-slate-900/20">
                            {Object.values(row).map((val, cellIdx) => (
                              <td key={cellIdx} className="py-2.5 px-4 text-slate-200 font-mono">
                                {typeof val === 'number' && !Number.isInteger(val) ? val.toFixed(2) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Insights View */}
              {activeTab === 'insight' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedArtifact.insights.map((ins, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{ins.label}</span>
                        <h4 className="text-lg font-bold text-white mt-1 font-mono">{ins.value}</h4>
                      </div>
                      <p className="text-xs text-slate-450 mt-3 leading-relaxed">{ins.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations View */}
              {activeTab === 'recommendation' && (
                <div className="space-y-4">
                  {selectedArtifact.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-950/50 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            rec.priority === 'Tinggi' ? 'bg-red-500/15 text-red-400 border border-red-500/25' :
                            rec.priority === 'Sedang' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                            'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                          }`}>
                            Prioritas {rec.priority}
                          </span>
                          <span className="text-[10px] text-slate-500">Target: {rec.target}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">{rec.title}</h4>
                        <p className="text-xs text-slate-400 leading-normal">{rec.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Bottom bar */}
            <div className="p-4 border-t border-slate-850 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-accent" />
                <span>Dataset: umkm_dataset & kecamatan_reference</span>
              </div>
              <span>Dihasilkan secara otomatis oleh AI Analyst Engine</span>
            </div>
          </>
        ) : (
          /* Placeholder View (Intro) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <BrainCircuit className="w-8 h-8 text-accent animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-bold text-white font-serif">Workspace Analisis AI</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Panel ini akan memvisualisasikan model data science, tabel, metrik determinasi, dan rekomendasi hasil olah data.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full pt-4">
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-855 text-left space-y-1">
                <LucideLineChart className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-white">Visualisasi Grafik</h4>
                <p className="text-[10px] text-slate-500 font-sans">Grafik interaktif Recharts (Bar, Line, Scatter) sesuai konteks riset.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-855 text-left space-y-1">
                <Table className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-white">Tabel Data Komparatif</h4>
                <p className="text-[10px] text-slate-500 font-sans">Tabel tabular yang dapat diekspor langsung ke berkas CSV.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-855 text-left space-y-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-white">Insight & R² Score</h4>
                <p className="text-[10px] text-slate-500 font-sans">Rangkuman koefisien Pearson, determinasi, dan statistik model.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-855 text-left space-y-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold text-white">Rekomendasi Berprioritas</h4>
                <p className="text-[10px] text-slate-500 font-sans">Daftar tindakan konkret untuk lembaga penyalur dana / pemda.</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
