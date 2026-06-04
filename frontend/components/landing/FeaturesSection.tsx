"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Layers,
  TrendingUp,
  MessageSquare,
  FileSpreadsheet,
  ArrowRight,
  TrendingDown
} from "lucide-react";

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section id="fitur" className="py-28 relative bg-[#030712]">
      {/* Background patterns */}
      <div className="absolute top-[30%] right-[10%] w-[350px] h-[350px] rounded-full bg-teal-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/5 text-teal-400 text-xs font-semibold mb-4">
            Keunggulan Sistem
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Fitur Unggulan Berbasis{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Kecerdasan Buatan
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Solusi komprehensif analisis UMKM, mitigasi risiko kredit, dan pemetaan geospasial presisi.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          
          {/* Card 1: Credit Scoring & SHAP (col-span-2) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-2 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Credit Scoring & SHAP Explainer
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-6">
                Prediksi Probability of Default (PD) nasabah menggunakan model XGBoost. 
                Dilengkapi SHAP Explainer interaktif untuk memvisualisasikan pengaruh positif dan negatif dari setiap fitur (pendapatan, rasio omset, suku bunga) terhadap keputusan kredit.
              </p>
            </div>
            
            {/* Visual element */}
            <div className="w-full bg-slate-950/60 rounded-xl p-4 border border-slate-800 font-mono text-[10px] text-slate-400 mt-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                <span>Model: XGBoost Classifier</span>
                <span className="text-emerald-400 font-bold">Akurasi: 98.4%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-slate-500">Omset</span>
                  <div className="flex-1 bg-slate-900 h-2.5 rounded relative overflow-hidden">
                    <div className="absolute left-[40%] w-[35%] bg-emerald-500 h-full" />
                  </div>
                  <span className="text-emerald-400 text-right w-8">+0.35</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-slate-500">Usia Usaha</span>
                  <div className="flex-1 bg-slate-900 h-2.5 rounded relative overflow-hidden">
                    <div className="absolute left-[40%] w-[20%] bg-emerald-500 h-full" />
                  </div>
                  <span className="text-emerald-400 text-right w-8">+0.20</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-slate-500">BiRate</span>
                  <div className="flex-1 bg-slate-900 h-2.5 rounded relative overflow-hidden">
                    <div className="absolute left-[15%] w-[25%] bg-rose-500 h-full" />
                  </div>
                  <span className="text-rose-400 text-right w-8">-0.25</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Geospatial Heatmap (col-span-1) */}
          <motion.div
            variants={cardVariants}
            className="col-span-1 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-teal-500/30 hover:shadow-[0_0_30px_rgba(20,184,166,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Geospatial Heatmap
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Pemetaan sebaran komoditas dan kepadatan UMKM di 596 kecamatan Jawa Barat dengan filter legenda dinamis.
              </p>
            </div>
            
            {/* Visual element */}
            <div className="h-[120px] bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden mt-4">
              <div className="absolute inset-0 flex items-center justify-center opacity-30 scale-125">
                <svg className="w-full h-full text-slate-800" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,80 C30,70 40,90 60,60 C80,30 70,50 90,20 L90,100 L10,100 Z" className="fill-teal-950/80 stroke-teal-700/30" />
                </svg>
              </div>
              <div className="absolute w-24 h-24 rounded-full bg-teal-500/20 animate-ping blur-sm" />
              <div className="absolute w-12 h-12 rounded-full bg-teal-400/30 animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-teal-400" />
              </div>
              <span className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-500">Zone: Kepadatan Tinggi</span>
            </div>
          </motion.div>

          {/* Card 3: Macro Stress Testing (col-span-1) */}
          <motion.div
            variants={cardVariants}
            className="col-span-1 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-rose-500/30 hover:shadow-[0_0_30px_rgba(244,63,94,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Macro Stress Testing
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Hubungkan portofolio dengan variabel makroekonomi (inflasi, BI-Rate, pertumbuhan PDB) untuk menghitung estimasi lonjakan NPL secara non-linear.
              </p>
            </div>
            
            {/* Visual element */}
            <div className="h-[120px] bg-slate-950/60 rounded-xl border border-slate-800 p-3 flex flex-col justify-between mt-4">
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>Scenario: High Inflation (+3%)</span>
                <span className="text-rose-400 font-bold flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> NPL Proj</span>
              </div>
              <div className="h-14 flex items-end gap-1.5 px-2">
                {[15, 20, 25, 45, 60, 85].map((val, i) => (
                  <div key={i} className="flex-1 bg-slate-900 rounded-sm h-full relative">
                    <div 
                      className={`absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-500 ${
                        i > 3 ? "bg-rose-500/80" : "bg-slate-700"
                      }`} 
                      style={{ height: `${val}%` }} 
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 4: Clustering & Segmentation (col-span-1) */}
          <motion.div
            variants={cardVariants}
            className="col-span-1 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                K-Means Clustering
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Segmentasi otomatis profil kematangan digital & kesiapan infrastruktur UMKM berbasis K-Means untuk sasaran program pembinaan yang presisi.
              </p>
            </div>
            
            {/* Visual element */}
            <div className="h-[120px] bg-slate-950/60 rounded-xl border border-slate-800 relative mt-4">
              <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <div className="absolute top-6 left-12 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <div className="absolute top-10 left-8 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              
              <div className="absolute bottom-6 right-10 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="absolute bottom-10 right-14 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="absolute bottom-4 right-16 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              
              <span className="absolute top-2 right-3 text-[8px] font-mono text-indigo-400 bg-indigo-500/10 px-1 rounded">Cluster A</span>
              <span className="absolute bottom-2 left-3 text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">Cluster B</span>
            </div>
          </motion.div>

          {/* Card 5: CSV Batch Ingestion (col-span-1) */}
          <motion.div
            variants={cardVariants}
            className="col-span-1 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-6 text-pink-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                CSV Batch Ingestion
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Unggah ribuan data UMKM dalam hitungan detik menggunakan batch uploader. Hasil scoring dapat diekspor instan kembali menjadi laporan Excel/CSV.
              </p>
            </div>
            
            {/* Visual element */}
            <div className="h-[120px] bg-slate-950/60 rounded-xl border border-slate-800 border-dashed p-4 flex flex-col items-center justify-center text-center mt-4">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-slate-400 font-semibold">Drop CSV file here</span>
              <span className="text-[8px] text-slate-600">Supports up to 50MB</span>
            </div>
          </motion.div>

          {/* Card 6: Agentic AI Chatbot (col-span-3) */}
          <motion.div
            variants={cardVariants}
            className="md:col-span-3 relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 p-8 backdrop-blur-sm hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.05)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  AI Analyst Workspace (Complex AI)
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Modul obrolan cerdas yang tidak hanya membalas pesan, namun mampu memanggil fungsi analitik internal (Function Calling) untuk memunculkan tabel data, grafik visualisasi, perbandingan regional, dan rekomendasi aksi nyata.
                </p>
                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold cursor-pointer group/link">
                  <span>Buka Workspace AI</span>
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Visual Chat UI */}
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 font-mono text-[9px] text-slate-300 space-y-3.5 h-[180px] overflow-y-hidden flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <span className="text-purple-400">user&gt;</span>
                    <span>Bandingkan tingkat kelayakan kredit fashion vs kuliner di Bandung</span>
                  </div>
                  <div className="flex gap-2 border-l-2 border-purple-500/30 pl-2">
                    <span className="text-teal-400">assistant&gt;</span>
                    <div className="space-y-1.5">
                      <span>Memproses data 1,240 UMKM. Berikut perbandingannya:</span>
                      <table className="w-full border-collapse border border-slate-800 text-[8px] mt-1 text-slate-400">
                        <thead>
                          <tr className="bg-slate-900">
                            <th className="border border-slate-800 p-1 text-left">Sektor</th>
                            <th className="border border-slate-800 p-1 text-right">Avg Score</th>
                            <th className="border border-slate-800 p-1 text-right">Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-800 p-1">Fashion</td>
                            <td className="border border-slate-800 p-1 text-right text-emerald-400 font-bold">724</td>
                            <td className="border border-slate-800 p-1 text-right text-emerald-400">Low</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-800 p-1">Kuliner</td>
                            <td className="border border-slate-800 p-1 text-right text-yellow-400 font-bold">662</td>
                            <td className="border border-slate-800 p-1 text-right text-yellow-400">Med</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-500 text-[8px]">
                    Tulis pertanyaan analisis data...
                  </div>
                  <div className="px-2.5 py-1 bg-purple-500 text-slate-950 font-bold rounded text-[8px] flex items-center justify-center">
                    Kirim
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
