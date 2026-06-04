"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  Building2, 
  Landmark, 
  Briefcase, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Sliders, 
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

const tabs = [
  {
    id: "bank",
    label: "Perbankan",
    icon: Building2,
    title: "Untuk Perbankan & Lembaga Keuangan",
    subtitle: "Optimal credit decisions with AI-powered risk assessment",
    benefits: [
      "Credit risk scoring dengan model XGBoost untuk prediksi gagal bayar",
      "Estimasi Probability of Default (PD) sesuai standar regulasi OJK",
      "Portfolio analytics dengan segmentasi nasabah UMKM otomatis",
      "Analisis transparansi faktor penentu kredit menggunakan SHAP",
    ],
    cta: "Mulai Credit Scoring",
    targetPath: "/credit-scoring",
    color: "emerald",
  },
  {
    id: "pemerintah",
    label: "Pemerintah",
    icon: Landmark,
    title: "Untuk Pemerintah Daerah",
    subtitle: "Data-driven policy making for UMKM development",
    benefits: [
      "Simulasi kebijakan what-if untuk prediksi dampak program",
      "Optimasi alokasi anggaran berdasarkan analisis klaster priority",
      "Prediksi lonjakan NPL portofolio daerah akibat inflasi & BI-Rate",
      "Monitoring pertumbuhan & digitalisasi UMKM daerah secara real-time",
    ],
    cta: "Simulasikan Kebijakan",
    targetPath: "/policy-simulation",
    color: "teal",
  },
  {
    id: "investor",
    label: "Investor",
    icon: Briefcase,
    title: "Untuk Investor & Mitra Bisnis",
    subtitle: "Identify high-growth UMKM opportunities at scale",
    benefits: [
      "Analisis kecocokan lokasi (Location Intelligence) berbasis peta kepadatan",
      "Opportunity scoring untuk identifikasi titik ekspansi paling layak",
      "Peta persebaran klaster industri dan komoditas unggulan daerah",
      "Proyeksi pertumbuhan regional untuk alokasi dana yang tepat sasaran",
    ],
    cta: "Eksplorasi Peta Lokasi",
    targetPath: "/location-intelligence",
    color: "indigo",
  },
];

export default function ForWhoSection() {
  const [activeTab, setActiveTab] = useState("bank");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
  }, []);

  const activeContent = tabs.find((t) => t.id === activeTab)!;

  const handleCtaClick = () => {
    window.location.href = isLoggedIn ? activeContent.targetPath : "/register";
  };

  return (
    <section id="untuk-siapa" className="py-28 relative bg-[#030712] border-t border-slate-900/60">
      {/* Background orbs */}
      <div className="absolute top-[20%] left-[-5%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-5%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold mb-4">
            Pengguna Solusi
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Dirancang untuk Berbagai{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              Kebutuhan Bisnis
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Akses dashboard analitik yang disesuaikan khusus untuk mencapai tujuan strategis instansi Anda.
          </p>
        </motion.div>

        {/* Stakeholder Tabs Buttons */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-xl bg-slate-900/60 p-1 border border-slate-800 gap-1 overflow-x-auto flex-nowrap max-w-full backdrop-blur-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700/50"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-stretch min-h-[480px]">
          
          {/* Left Column: Benefits & Details */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {activeContent.title}
                  </h3>
                  <p className="text-slate-400 text-sm italic font-medium">
                    {activeContent.subtitle}
                  </p>
                </div>

                <ul className="space-y-4">
                  {activeContent.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleCtaClick}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                >
                  <span>{activeContent.cta}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Live Mockup Dashboard Panel */}
          <div className="lg:col-span-7 flex items-center">
            <div className="w-full relative rounded-2xl border border-slate-800 bg-[#090d16]/90 p-4 sm:p-5 shadow-2xl overflow-hidden min-h-[360px] flex flex-col justify-between">
              
              {/* Decorative Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
              
              {/* Card Header decoration */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 font-mono text-[10px] text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>MODUL ANALIS: {activeTab.toUpperCase()}</span>
                </span>
                <span>v4.0.0</span>
              </div>

              {/* Dynamic Panel Content based on Tab */}
              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeTab === "bank" && (
                    <motion.div
                      key="bank-panel"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Bank UI Mock */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-slate-500 font-mono">NAMA DEBITUR / UMKM</p>
                            <p className="text-xs font-bold text-white">CV Kreasi Tenun Garut</p>
                          </div>
                          <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold font-mono">
                            LOW RISK / REKOMENDASI DISETUJUI
                          </div>
                        </div>

                        {/* Dial Indicator */}
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-900 pt-3">
                          <div className="text-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                            <p className="text-[8px] text-slate-500 font-mono">CREDIT SCORE</p>
                            <p className="text-sm font-extrabold text-emerald-400 font-mono">745</p>
                          </div>
                          <div className="text-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                            <p className="text-[8px] text-slate-500 font-mono">FAIL DEFAULTS</p>
                            <p className="text-sm font-extrabold text-slate-300 font-mono">1.2%</p>
                          </div>
                          <div className="text-center bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                            <p className="text-[8px] text-slate-500 font-mono">PLAFON MAX</p>
                            <p className="text-[11px] font-extrabold text-white font-mono mt-0.5">Rp 120jt</p>
                          </div>
                        </div>

                        {/* Mini force plot representation */}
                        <div className="space-y-1 mt-2">
                          <p className="text-[8px] text-slate-500 font-mono">FAKTOR PENDORONG SKOR (SHAP VALUE)</p>
                          <div className="flex h-3.5 rounded bg-slate-900 overflow-hidden text-[8px] font-bold text-center font-mono">
                            <div className="bg-emerald-500 text-slate-950 flex items-center justify-center" style={{ width: "55%" }}>
                              Rasio Kas (+22)
                            </div>
                            <div className="bg-emerald-600 text-white flex items-center justify-center" style={{ width: "30%" }}>
                              Usia (+12)
                            </div>
                            <div className="bg-rose-500 text-white flex items-center justify-center" style={{ width: "15%" }}>
                              Infr (-5)
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "pemerintah" && (
                    <motion.div
                      key="gov-panel"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Government UI Mock */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Sliders className="w-3.5 h-3.5 text-teal-400" /> SIMULATOR KEBIJAKAN STIMULUS
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">Target: Bandung Raya</span>
                        </div>

                        {/* Sliders mock */}
                        <div className="space-y-2 text-[9px]">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-400">Alokasi Anggaran Kuliner (Priority)</span>
                              <span className="text-teal-400 font-bold font-mono">45%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded relative">
                              <div className="bg-teal-500 h-full rounded" style={{ width: "45%" }} />
                              <div className="absolute top-1/2 -translate-y-1/2 left-[45%] w-2.5 h-2.5 rounded-full bg-white border border-teal-500" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-slate-400">Total Anggaran Portofolio</span>
                              <span className="text-white font-bold font-mono">Rp 120 Miliar</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded relative">
                              <div className="bg-teal-500 h-full rounded" style={{ width: "70%" }} />
                              <div className="absolute top-1/2 -translate-y-1/2 left-[70%] w-2.5 h-2.5 rounded-full bg-white border border-teal-500" />
                            </div>
                          </div>
                        </div>

                        {/* Impact results */}
                        <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-3">
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                            <p className="text-[8px] text-slate-500 font-mono">ESTIMASI UMKM NAIK KELAS</p>
                            <p className="text-xs font-bold text-teal-400 font-mono">+1,420 UMKM</p>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                            <p className="text-[8px] text-slate-500 font-mono">PROYEKSI LAPANGAN KERJA</p>
                            <p className="text-xs font-bold text-white font-mono">+3,550 Pekerja</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "investor" && (
                    <motion.div
                      key="investor-panel"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* Investor UI Mock */}
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <div>
                            <span className="text-[9px] text-slate-500 font-mono">LOKASI EKSPANSI TERBAIK</span>
                            <h4 className="text-xs font-bold text-white">Kec. Bandung Kidul, Kota Bandung</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-bold">
                            OPPORTUNITY: 8.7 / 10
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-slate-400">Kepadatan Kompetitor</span>
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded">Rendah / Sehat</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-slate-400">Kebutuhan Infrastruktur</span>
                            <span className="text-indigo-400 font-bold bg-indigo-500/10 px-1.5 rounded">Sangat Siap</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="text-slate-400">Komoditas Utama</span>
                            <span className="text-slate-200">Tekstil / Fashion Retail</span>
                          </div>
                        </div>

                        {/* Mini trend chart */}
                        <div className="border-t border-slate-900 pt-2.5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>Proyeksi Tren Pasar (5 Thn)</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> +28%</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card Footer decoration */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>DATABASE STATUS: SYNCHRONIZED</span>
                <span>SECURE AZURE AI ENGINE</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
