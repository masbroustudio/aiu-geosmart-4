"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { 
  ArrowRight, 
  Map, 
  TrendingUp, 
  Brain, 
  ShieldCheck, 
  Sparkles,
  MessageSquare
} from "lucide-react";

const stats = [
  { value: 10000, suffix: "+", label: "UMKM Data Teranalisis", color: "from-emerald-500 to-teal-400" },
  { value: 596, suffix: "", label: "Kecamatan Jawa Barat", color: "from-cyan-500 to-blue-400" },
  { value: 27, suffix: "", label: "Kabupaten & Kota", color: "from-indigo-500 to-purple-400" },
  { value: 98.4, suffix: "%", label: "Akurasi Prediksi AI", color: "from-pink-500 to-rose-400" },
];

function AnimatedCounter({
  value,
  suffix,
  color,
}: {
  value: number;
  suffix: string;
  color: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest * 10) / 10);
      },
    });

    return () => {
      controls.stop();
    };
  }, [isInView, value]);

  return (
    <span
      ref={ref}
      className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}
    >
      {isInView ? `${displayValue.toLocaleString("id-ID")}${suffix}` : "0"}
    </span>
  );
}

export default function HeroSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
  }, []);

  return (
    <section className="relative min-h-screen pt-28 pb-20 flex flex-col items-center justify-center overflow-hidden bg-[#030712]">
      {/* Background Radial Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,rgba(99,102,241,0.1),rgba(255,255,255,0))]" />
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v2H0V0zm0 0h2v40H0V0z' fill='%23ffffff' fill-opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse duration-[12000ms]" />

      {/* Main Container */}
      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Pulsing Version Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold mb-8 hover:bg-emerald-500/10 transition-colors cursor-pointer group animate-pulse"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Memperkenalkan GeoUMKM Intelligence v4.0</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            Satu Platform untuk{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Intelijen Geospasial
            </span>{" "}
            & Analisis Kredit UMKM
          </h1>
        </motion.div>

        {/* Hero Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-center text-slate-400 text-lg sm:text-xl mb-10 max-w-3xl leading-relaxed"
        >
          Prediksi risiko kredit UMKM akurat menggunakan XGBoost & SHAP explainer, 
          intelijen lokasi regional real-time, simulasi kebijakan stress-testing makroekonomi, 
          dan Agentic AI Analyst yang cerdas.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto mb-20"
        >
          {isLoggedIn ? (
            <>
              <a
                href="/overview"
                className="relative group px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:scale-[1.03] text-center"
              >
                Buka Dashboard Utama
                <span className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors pointer-events-none" />
              </a>
              <a
                href="#fitur"
                className="px-8 py-4 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900 text-white font-semibold text-lg backdrop-blur-sm transition-all hover:scale-[1.03] text-center hover:border-white/20"
              >
                Eksplorasi Fitur
              </a>
            </>
          ) : (
            <>
              <a
                href="/register"
                className="relative group px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-emerald-500/20 transition-all hover:scale-[1.03] text-center"
              >
                Mulai Uji Coba Gratis
                <span className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors pointer-events-none" />
              </a>
              <a
                href="/login"
                className="px-8 py-4 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900 text-white font-semibold text-lg backdrop-blur-sm transition-all hover:scale-[1.03] text-center hover:border-white/20"
              >
                Masuk Akun Demo
              </a>
            </>
          )}
        </motion.div>

        {/* Dashboard Mockup - The "WOW" Factor */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-5xl relative rounded-2xl border border-slate-800 bg-[#0b0f19]/80 p-3 sm:p-4 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-md mb-20 group overflow-hidden"
        >
          {/* Laser-Sweep Scanning Line */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60 pointer-events-none"
            style={{
              animation: 'scan 6s linear infinite'
            }}
          />
          
          {/* Top Bar Decoration */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80" />
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-slate-500 font-mono ml-2">geoumkm-dashboard-v4.0.sh</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Analysis Connection</span>
            </div>
          </div>

          {/* Grid Layout representing the application page */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Mock Dashboard Sidebar */}
            <div className="hidden md:flex flex-col gap-2.5 col-span-1 border-r border-slate-800 pr-3">
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold text-xs flex items-center gap-2">
                <Brain className="w-4 h-4" /> Overview Dashboard
              </div>
              <div className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors">
                <Map className="w-4 h-4 text-teal-400" /> Location Intelligence
              </div>
              <div className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> Credit Scoring AI
              </div>
              <div className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors">
                <TrendingUp className="w-4 h-4 text-pink-400" /> Policy Simulation
              </div>
              <div className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-xs flex items-center gap-2 transition-colors">
                <MessageSquare className="w-4 h-4 text-purple-400" /> AI Analyst Workspace
              </div>
              <div className="mt-auto border-t border-slate-800 pt-3">
                <div className="p-3.5 rounded-lg bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI SUGGESTION
                  </p>
                  <p className="text-[9px] text-slate-300 leading-normal">
                    Kec. Bandung Kidul memiliki skor lokasi <strong>8.7</strong> (Kategori Tinggi). Direkomendasikan untuk ekspansi retail mode.
                  </p>
                </div>
              </div>
            </div>

            {/* Mock Dashboard Dashboard Body */}
            <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mock Map / Location Heatmap */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 h-[180px] relative flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between z-10">
                  <span className="text-[11px] font-bold text-slate-300">Geospatial Commodity Heatmap</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500/10 text-emerald-400">Jawa Barat</span>
                </div>
                {/* Fake SVG Map */}
                <div className="absolute inset-0 opacity-40 flex items-center justify-center p-6 mt-4">
                  <svg className="w-full h-full text-slate-800" viewBox="0 0 200 100" fill="currentColor">
                    <path d="M20,50 Q40,30 60,60 T100,40 T140,70 T180,30 L180,90 L20,90 Z" className="fill-emerald-950 stroke-emerald-800/40 stroke-2" />
                    <circle cx="50" cy="45" r="14" className="fill-emerald-500/20 stroke-emerald-400/40 animate-ping" />
                    <circle cx="50" cy="45" r="5" className="fill-emerald-400" />
                    <circle cx="110" cy="55" r="18" className="fill-emerald-500/10" />
                    <circle cx="110" cy="55" r="6" className="fill-teal-400" />
                    <circle cx="150" cy="45" r="4" className="fill-indigo-400" />
                  </svg>
                </div>
                <div className="z-10 flex items-center justify-between text-[10px] text-slate-400 mt-auto bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/50">
                  <span>Legend: Kepadatan Kuliner</span>
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" />
                  </div>
                </div>
              </div>

              {/* Mock SHAP Waterfall Chart */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 h-[180px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">SHAP Waterfall Plot (Risk Explanation)</span>
                  <span className="text-[9px] font-mono text-emerald-400">Score: 712 (Low Risk)</span>
                </div>
                {/* Waterfall bars */}
                <div className="flex flex-col gap-2 my-2.5">
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-slate-400 w-16 truncate">Base Value</span>
                    <div className="w-28 bg-slate-900 h-2 rounded overflow-hidden relative">
                      <div className="absolute left-[30%] w-[40%] bg-slate-700 h-full" />
                    </div>
                    <span className="text-slate-400">650</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-emerald-400 font-medium w-16 truncate">Ratio Omset (+32)</span>
                    <div className="w-28 bg-slate-900 h-2 rounded overflow-hidden relative">
                      <div className="absolute left-[50%] w-[15%] bg-emerald-500 h-full" />
                    </div>
                    <span className="text-emerald-400 font-mono">+32</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-emerald-400 font-medium w-16 truncate">Usia Usaha (+45)</span>
                    <div className="w-28 bg-slate-900 h-2 rounded overflow-hidden relative">
                      <div className="absolute left-[65%] w-[20%] bg-emerald-500 h-full" />
                    </div>
                    <span className="text-emerald-400 font-mono">+45</span>
                  </div>
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-rose-400 font-medium w-16 truncate">Inflasi Prov (-15)</span>
                    <div className="w-28 bg-slate-900 h-2 rounded overflow-hidden relative">
                      <div className="absolute left-[58%] w-[7%] bg-rose-500 h-full" />
                    </div>
                    <span className="text-rose-400 font-mono">-15</span>
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-1.5 text-center italic">
                  Kontribusi fitur di atas ambang batas 650
                </div>
              </div>

              {/* Mock AI Conversation / Bot Output */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 h-[140px] col-span-1 sm:col-span-2 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center">
                      <Brain className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">GeoUMKM Agentic AI Analyst</span>
                  </div>
                  <div className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-indigo-500/10 text-indigo-400 font-mono">
                    GPT-4o Engine
                  </div>
                </div>
                
                <div className="flex-1 py-2 font-mono text-[9px] text-emerald-400/90 leading-relaxed overflow-y-hidden">
                  <span className="text-indigo-400">user&gt;</span> Analisis sektor usaha di Bandung Kidul dan prospek NPL-nya...<br />
                  <span className="text-emerald-300">ai-analyst&gt;</span> Menjalankan model K-Means & Stress-Test. Hasil menunjukkan klaster UMKM fashion di Bandung Kidul sangat resilient dengan proyeksi NPL stabil di angka <strong>1.4%</strong> di bawah stress inflasi +2%.
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[9px] text-slate-500 flex items-center">
                    Tanya rekomendasi lokasi atau scoring kredit...
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[9px] flex items-center justify-center hover:bg-emerald-400 cursor-pointer">
                    Kirim
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full"
        >
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 sm:p-6 backdrop-blur-sm group hover:border-slate-700/80 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(16,185,129,0.05)]"
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
              <AnimatedCounter value={stat.value} suffix={stat.suffix} color={stat.color} />
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 leading-snug">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Style for scans animation */}
      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(-20px);
          }
          50% {
            transform: translateY(350px);
          }
          100% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
}
