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

  // Credit/score queries - check topic keywords BEFORE location names
  if (lower.includes('kredit') || lower.includes('credit') || lower.includes('skor') || lower.includes('score')) {
    if (persona === 'bank') {
      return `**Distribusi Credit Band Portfolio:**\n\n- **AAA** (skor 90-100): 976 UMKM (9.8%) - Default rate 3.9%\n- **AA** (skor 80-90): 1,245 UMKM (12.5%) - Default rate 8.2%\n- **A** (skor 70-80): 1,567 UMKM (15.7%) - Default rate 15.1%\n- **BBB** (skor 60-70): 1,890 UMKM (18.9%) - Default rate 24.3%\n- **BB** (skor 50-60): 1,456 UMKM (14.6%) - Default rate 38.7%\n- **B** (skor 30-50): 1,856 UMKM (18.6%) - Default rate 62.4%\n- **CCC** (skor <30): 1,010 UMKM (10.1%) - Default rate 93.3%\n\n**Rata-rata PD portfolio:** 34.59%\n**Konsentrasi risiko:** Bucket 20-50% (very high risk)\n\n[Sumber: Credit Risk Model]`;
    }
    return `**Credit Scoring Overview:**\n\n- Total UMKM dinilai: ${modelMetrics.totalUmkm.toLocaleString()}\n- Default rate rata-rata: ${modelMetrics.defaultRate}%\n- Survival rate: ${modelMetrics.survivalRate}%\n- Estimasi NPL reduction: ${modelMetrics.nplReduction}%\n\n**Top 3 Faktor Penentu:**\n- Infrastructure score (importance: 0.23)\n- Digital readiness (importance: 0.19)\n- Survival rate historis (importance: 0.17)\n\n[Sumber: Credit Risk Model]`;
  }

  // Default/NPL/risk queries
  if (lower.includes('default') || lower.includes('npl') || lower.includes('risiko kredit')) {
    return `**Analisis Default & NPL:**\n\n- **Default Rate Portfolio:** ${modelMetrics.defaultRate}%\n- **Estimasi NPL Reduction:** ${modelMetrics.nplReduction}% dengan model scoring\n- **Survival Rate Rata-rata:** ${modelMetrics.survivalRate}%\n\n**Distribusi Risiko per Area:**\n- Area urban (Bekasi, Depok): Default rate 15-20%\n- Area semi-urban (Bandung, Cimahi): Default rate 25-35%\n- Area rural (Garut, Sukabumi): Default rate 50-70%\n\n**Faktor Risiko Utama:**\n- Infrastructure score rendah (<50)\n- Digital readiness rendah (<30%)\n- Lokasi rawan bencana\n\n[Sumber: Credit Risk Model]`;
  }

  // Cluster queries
  if (lower.includes('cluster') || lower.includes('klaster') || lower.includes('segmen')) {
    if (persona === 'investor') {
      const c0 = clusterSummaries[0];
      return `**Cluster dengan ROI Tertinggi:**\n\n**1. ${c0.name}** (Investment Rank #${c0.investRank})\n- Jumlah UMKM: ${c0.n_umkm.toLocaleString()}\n- Digital adoption: ${c0.characteristics.digital}%\n- Survival rate: ${c0.characteristics.survival}%\n- Avg omset score: ${c0.characteristics.omset}\n\n**Kekuatan:** ${c0.strengths.join(', ')}\n**Peluang:** ${c0.opportunities.join(', ')}\n\n**Ranking Investasi:**\n${clusterSummaries.map(c => `- #${c.investRank} ${c.name} (${c.n_umkm} UMKM)`).join('\n')}\n\n[Sumber: Cluster Analysis, Notebook 02]`;
    }
    if (persona === 'government') {
      const c3 = clusterSummaries[3];
      return `**Cluster Prioritas Pemerintah:**\n\n**#1 Prioritas: ${c3.name}** (Gov Priority: ${c3.govPriority})\n- Jumlah UMKM: ${c3.n_umkm.toLocaleString()}\n- Infrastructure: ${c3.characteristics.infra}\n- Digital: ${c3.characteristics.digital}%\n- KUR penetration: ${c3.characteristics.kur}%\n\n**Kelemahan:**\n${c3.weaknesses.map(w => `- ${w}`).join('\n')}\n\n**Aksi yang Direkomendasikan:**\n${c3.actions.map(a => `- ${a}`).join('\n')}\n\n**Semua Cluster (by Gov Priority):**\n${[...clusterSummaries].sort((a, b) => a.govPriority - b.govPriority).map(c => `- Priority ${c.govPriority}: ${c.name} (${c.n_umkm} UMKM)`).join('\n')}\n\n[Sumber: Cluster Analysis, Notebook 02]`;
    }
    return `**5 Cluster UMKM:**\n\n${clusterSummaries.map(c => `- **${c.name}**: ${c.n_umkm.toLocaleString()} UMKM - ${c.description}`).join('\n')}\n\n**Total UMKM:** ${modelMetrics.totalUmkm.toLocaleString()}\n\n[Sumber: Cluster Analysis, Notebook 02]`;
  }

  // Policy/infrastructure queries
  if (lower.includes('kebijakan') || lower.includes('policy') || lower.includes('infrastruktur')) {
    if (persona === 'government') {
      return `**Simulasi Dampak Kebijakan:**\n\n**1. Infrastructure +30 (di area low-infra):**\n- Target: 2,507 UMKM\n- Avg improvement: **${modelMetrics.policyImpactInfra}** poin\n- UMKM baru di atas skor 70: 244\n\n**2. Digital Training 50%:**\n- Target: 3,200 UMKM\n- Avg improvement: **${modelMetrics.policyImpactDigital}** poin\n- UMKM baru di atas skor 70: 325\n\n**3. KUR Expansion +20:**\n- Target: 4,100 UMKM\n- Avg improvement: **${modelMetrics.policyImpactKUR}** poin\n\n**Rekomendasi:** Prioritaskan infrastructure di cluster High-Risk Underserved\n\n[Sumber: Policy Simulation, Notebook 04]`;
    }
    return `**Dampak Kebijakan Infrastruktur:**\n\n- Infrastructure +30: avg improvement **${modelMetrics.policyImpactInfra}** poin\n- Digital Training: avg improvement **${modelMetrics.policyImpactDigital}** poin\n- KUR Expansion: avg improvement **${modelMetrics.policyImpactKUR}** poin\n\nInfrastructure memiliki dampak terbesar terhadap skor UMKM.\n\n[Sumber: Policy Simulation, Notebook 04]`;
  }

  // Budget queries
  if (lower.includes('budget') || lower.includes('anggaran')) {
    return `**Alokasi Budget per Cluster (Rekomendasi):**\n\n- **High-Risk Underserved** (Cluster 3): 41.5% - Prioritas infrastruktur\n- **High-Risk Underserved 4** (Cluster 4): 27.8% - Risk mitigation\n- **Rural Developing** (Cluster 1): 18.2% - Digital literacy\n- **Urban Digital Leaders 2** (Cluster 2): 7.5% - Scale-up\n- **Urban Digital Leaders** (Cluster 0): 5.0% - Market expansion\n\n**Total UMKM target:** ${modelMetrics.totalUmkm.toLocaleString()}\n**Focus area:** Infrastructure & digital transformation di area underserved\n\n[Sumber: Policy Simulation, Notebook 04]`;
  }

  // Investment/ROI queries
  if (lower.includes('investasi') || lower.includes('invest') || lower.includes('roi')) {
    return `**Peluang Investasi UMKM:**\n\n**Top Cluster untuk Investasi:**\n- #1 Urban Digital Leaders: Investment score **0.962**\n  - Market size: Rp 182.2M\n  - Digital adoption: 74.1%\n  - Survival: 71.9%\n\n- #2 Rural Developing: Investment score **0.834**\n  - Market size: Rp 138.0M\n  - Growth potential: High\n\n**Market Size Total:** Rp ${modelMetrics.marketSizeAnnual.toLocaleString()}M/tahun\n\n**Risiko:**\n- Area rural: Higher default (50-70%), butuh infrastruktur\n- Area urban: Kompetisi tinggi, margin lebih tipis\n\n[Sumber: Investment Analysis, Notebook 05]`;
  }

  // Market/revenue queries
  if (lower.includes('market') || lower.includes('pasar') || lower.includes('omset')) {
    return `**Market Size & Revenue UMKM:**\n\n- **Total Market Size:** Rp ${modelMetrics.marketSizeAnnual.toLocaleString()}M/tahun\n- **Rata-rata Omset Score:** ${modelMetrics.avgScore}\n\n**Per Cluster:**\n${clusterSummaries.map(c => `- ${c.name}: Omset score ${c.characteristics.omset} (${c.n_umkm} UMKM)`).join('\n')}\n\n**Area Tertinggi:**\n- Kota Bekasi: avg score 85.2\n- Kota Depok: avg score 82.7\n- Kota Bandung: avg score 79.4\n\n[Sumber: Market Analysis]`;
  }

  // Digital readiness queries
  if (lower.includes('digital') || lower.includes('internet') || lower.includes('teknologi')) {
    return `**Digital Readiness UMKM:**\n\n**Per Cluster:**\n${clusterSummaries.map(c => `- ${c.name}: **${c.characteristics.digital}%** digital adoption`).join('\n')}\n\n**Gap Analysis:**\n- Urban areas: 65-74% digital adoption\n- Rural areas: 31-42% digital adoption\n- Gap: ~35 percentage points\n\n**Dampak Digital Training:**\n- Avg score improvement: ${modelMetrics.policyImpactDigital} poin\n- UMKM baru di atas skor 70: 325\n\n**Rekomendasi:** Digital literacy programs di cluster Rural Developing & High-Risk Underserved\n\n[Sumber: Digital Readiness Analysis]`;
  }

  // Recommendation queries
  if (lower.includes('rekomendasi') || lower.includes('recommend')) {
    const recs = persona === 'bank'
      ? `**Rekomendasi untuk Bank:**\n\n- **Ekspansi kredit** di area skor >80 (Bekasi, Depok)\n- **Hindari** area dengan default rate >50% tanpa mitigasi\n- **Target NPL reduction:** ${modelMetrics.nplReduction}%\n- **Focus:** UMKM di credit band A-AAA untuk portfolio growth\n- **Opportunity:** KUR expansion di cluster with low penetration (19.2%)`
      : persona === 'government'
      ? `**Rekomendasi untuk Pemerintah:**\n\n- **Prioritas 1:** Infrastructure development di High-Risk Underserved\n- **Prioritas 2:** Digital literacy programs di Rural Developing\n- **Prioritas 3:** KUR expansion di area low-penetration\n- **Budget focus:** 41.5% untuk cluster High-Risk Underserved\n- **Target:** 569 UMKM naik di atas skor 70`
      : `**Rekomendasi untuk Investor:**\n\n- **Top pick:** Urban Digital Leaders (score 0.962)\n- **Growth play:** Rural Developing (high potential, moderate risk)\n- **Market size:** Rp ${modelMetrics.marketSizeAnnual.toLocaleString()}M/tahun\n- **Avoid:** High-Risk Underserved tanpa government support\n- **Sektor terbaik:** Makanan & Fashion di area urban`;
    return `${recs}\n\n[Sumber: GeoUMKM Intelligence Analysis]`;
  }

  // Model/algorithm queries
  if (lower.includes('model') || lower.includes('algoritma') || lower.includes('machine learning')) {
    return `**Model & Algoritma GeoUMKM:**\n\n**Credit Risk Model:**\n- Algorithm: Gradient Boosting (XGBoost)\n- AUC-ROC: 0.847\n- Features: 15 variabel\n\n**Location Scoring:**\n- Algorithm: Weighted composite scoring\n- Dimensions: 6 (infrastructure, digital, survival, income, omset, KUR)\n- Coverage: ${modelMetrics.kecamatanCount} kecamatan\n\n**Clustering:**\n- Algorithm: K-Means (k=5)\n- Silhouette score: 0.42\n- Top cluster score: ${modelMetrics.topClusterScore}\n\n**Total Data:** ${modelMetrics.totalUmkm.toLocaleString()} UMKM\n\n[Sumber: Model Documentation]`;
  }

  // UMKM general queries
  if (lower.includes('umkm') || lower.includes('usaha')) {
    return `**Statistik UMKM:**\n\n- **Total UMKM:** ${modelMetrics.totalUmkm.toLocaleString()}\n- **Kecamatan:** ${modelMetrics.kecamatanCount}\n- **Avg Score:** ${modelMetrics.avgScore}/100\n- **Survival Rate:** ${modelMetrics.survivalRate}%\n- **Default Rate:** ${modelMetrics.defaultRate}%\n\n**Distribusi per Cluster:**\n${clusterSummaries.map(c => `- ${c.name}: ${c.n_umkm.toLocaleString()} UMKM`).join('\n')}\n\n[Sumber: GeoUMKM Database]`;
  }

  // Priority queries
  if (lower.includes('prioritas') || lower.includes('priority')) {
    return `**Prioritas Kecamatan:**\n\n**Prioritas Intervensi (skor rendah, potensi tinggi):**\n- Sagaranten, Sukabumi: Skor 1.36 - Butuh infrastruktur dasar\n- Cisompet, Garut: Skor 6.82 - Butuh digital literacy\n- Area rural Garut & Sukabumi: avg skor 28-35\n\n**Prioritas Ekspansi (skor tinggi):**\n- Pondok Gede, Bekasi: Skor 94.85\n- Bekasi Selatan: Skor 92.0\n- Astana Anyar, Bandung: Skor 90.6\n\n**Cluster Prioritas Pemerintah:**\n${[...clusterSummaries].sort((a, b) => a.govPriority - b.govPriority).map(c => `- Priority ${c.govPriority}: ${c.name}`).join('\n')}\n\n[Sumber: Priority Analysis]`;
  }

  // Sector queries
  if (lower.includes('makanan') || lower.includes('fashion') || lower.includes('kerajinan') || lower.includes('jasa') || lower.includes('pertanian')) {
    const sector = lower.includes('makanan') ? 'Makanan' : lower.includes('fashion') ? 'Fashion' : lower.includes('kerajinan') ? 'Kerajinan' : lower.includes('jasa') ? 'Jasa' : 'Pertanian';
    const sectorData: Record<string, { pct: string; avg: string; best: string; risk: string }> = {
      'Makanan': { pct: '35%', avg: '62.4', best: 'Kota Bekasi, Kota Bandung', risk: 'Kompetisi tinggi' },
      'Fashion': { pct: '22%', avg: '58.1', best: 'Kota Bandung, Kota Cimahi', risk: 'Tren berubah cepat' },
      'Kerajinan': { pct: '15%', avg: '52.3', best: 'Kab. Bandung, Kota Bandung', risk: 'Market terbatas' },
      'Jasa': { pct: '18%', avg: '55.7', best: 'Kota Bekasi, Kota Depok', risk: 'Ketergantungan SDM' },
      'Pertanian': { pct: '10%', avg: '41.2', best: 'Kab. Bogor, Kab. Sukabumi', risk: 'Cuaca & supply chain' },
    };
    const d = sectorData[sector];
    return `**Sektor ${sector}:**\n\n- **Proporsi:** ${d.pct} dari total UMKM\n- **Avg Score:** ${d.avg}/100\n- **Area Terbaik:** ${d.best}\n- **Risiko Utama:** ${d.risk}\n\n**Rekomendasi:**\n- Focus di area urban untuk ${sector} (higher survival)\n- Digital marketing adoption meningkatkan omset 20-30%\n- KUR penetration masih rendah di sektor ini\n\n[Sumber: Sector Analysis]`;
  }

  // Location queries (general keyword)
  if (lower.includes('lokasi') || lower.includes('location') || lower.includes('kecamatan')) {
    return `**Top & Bottom Lokasi UMKM:**\n\n**Top 5:**\n- Pondok Gede, Kota Bekasi: **94.85**/100\n- Bekasi Selatan, Kota Bekasi: **92.0**/100\n- Astana Anyar, Kota Bandung: **90.6**/100\n- Cilodong, Kota Depok: **90.3**/100\n- Rancasari, Kota Bandung: **87.6**/100\n\n**Bottom 3:**\n- Sagaranten, Kab. Sukabumi: **1.36**/100\n- Cisompet, Kab. Garut: **6.82**/100\n\n**Faktor utama:** Infrastructure score & digital readiness\n**Total kecamatan dianalisis:** ${modelMetrics.kecamatanCount}\n\n[Sumber: Location Scoring, Notebook 03]`;
  }

  // Check specific kecamatan names (after all topic keywords)
  for (const [name, data] of Object.entries(locationHighlights)) {
    if (lower.includes(name)) {
      return `**${name.charAt(0).toUpperCase() + name.slice(1)}** - ${data.kabupaten}\n\n**Skor Lokasi:** ${data.score}/100\n\n**Kekuatan:**\n${data.strengths.map(s => `- ${s}`).join('\n')}\n\n**Risiko:**\n${data.risks.map(r => `- ${r}`).join('\n')}\n\n[Sumber: Location Scoring, Notebook 03]`;
    }
  }

  // Check kabupaten names (after all topic keywords)
  for (const [name, data] of Object.entries(kabupatenSummaries)) {
    if (lower.includes(name)) {
      return `**Kabupaten ${name.charAt(0).toUpperCase() + name.slice(1)}**\n\n**Rata-rata Skor:** ${data.avgScore}/100\n**Jumlah UMKM:** ${data.umkmCount.toLocaleString()}\n**Faktor Kunci:** ${data.keyFactor}\n\n**Top Kecamatan:**\n${data.topKecamatan.map(k => `- ${k}`).join('\n')}\n\n[Sumber: Location Scoring, Notebook 03]`;
    }
  }

  // Default responses
  const defaults: Record<Persona, string> = {
    bank: `Saya bisa membantu analisis **credit scoring**, **PD estimation**, dan **risk assessment** portfolio UMKM.\n\nTopik yang bisa ditanyakan:\n- Distribusi credit band & default rate\n- Analisis risiko per area/cluster\n- Rekomendasi lokasi ekspansi\n- NPL reduction estimation\n- Faktor penentu credit score\n\nSilakan tanya topik spesifik!`,
    government: `Saya bisa membantu analisis **kebijakan**, **prioritas wilayah**, dan **simulasi dampak** intervensi.\n\nTopik yang bisa ditanyakan:\n- Priority kecamatan untuk intervensi\n- Budget allocation per cluster\n- Policy simulation (infrastructure, digital, KUR)\n- Dampak program per area\n- Cluster analysis & SWOT\n\nSilakan tanya topik spesifik!`,
    investor: `Saya bisa membantu analisis **peluang investasi**, **market sizing**, dan **cluster profiling**.\n\nTopik yang bisa ditanyakan:\n- ROI per cluster & area\n- Market size estimation\n- Digital adoption trends\n- Risk-return analysis\n- Sektor UMKM terbaik\n\nSilakan tanya topik spesifik!`,
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
