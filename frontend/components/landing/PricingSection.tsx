"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Check, Info } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Untuk peneliti, akademisi, dan individu",
    highlighted: false,
    badge: null,
    priceMonthly: "Rp 0",
    priceAnnually: "Rp 0",
    periodMonthly: "/bulan",
    periodAnnually: "/bulan",
    subtext: "Gratis selamanya",
    features: [
      "Akses data 100 UMKM Jawa Barat",
      "Credit scoring dasar",
      "Model AI Tunggal (XGBoost)",
      "Dashboard overview & visualisasi standar",
      "Ekspor laporan terbatas (CSV)",
      "Dukungan komunitas & forum",
      "Dokumentasi API standar",
      "1 akun pengguna aktif",
    ],
    cta: "Mulai Gratis",
  },
  {
    name: "Professional",
    description: "Untuk instansi finansial, BPR, dan tim analis daerah",
    highlighted: true,
    badge: "Paling Populer",
    priceMonthly: "Rp 500.000",
    priceAnnually: "Rp 300.000",
    periodMonthly: "/bulan",
    periodAnnually: "/bulan",
    subtext: "Ditagih tahunan (Hemat 20%)",
    features: [
      "Akses data 10.000+ UMKM Jawa Barat",
      "Credit scoring lengkap + estimasi PD",
      "Akses ke 3 Model AI (Clustering & Risk)",
      "Dashboard regional & analytics penuh",
      "Location intelligence & pemetaan komoditas",
      "Policy simulation (what-if stress test)",
      "Agentic AI Chat Assistant (Workspace)",
      "Akses API integrasi sistem",
      "Dukungan prioritas email & chat (SLA 24j)",
      "Hingga 10 akun pengguna aktif",
    ],
    cta: "Mulai Uji Coba Gratis",
  },
  {
    name: "Enterprise",
    description: "Untuk bank komersial besar dan pemerintah provinsi",
    highlighted: false,
    badge: null,
    priceMonthly: "Hubungi Kami",
    priceAnnually: "Hubungi Kami",
    periodMonthly: "",
    periodAnnually: "",
    subtext: "Disesuaikan dengan volume data",
    features: [
      "Akses data tak terbatas (Seluruh Indonesia)",
      "Pelatihan model AI kustom & fine-tuning",
      "Dedicated infrastructure & database",
      "Solusi White-Label & integrasi penuh",
      "Opsi On-Premise deployment (Keamanan tinggi)",
      "SLA jaminan uptime sistem 99.9%",
      "Dedicated Account Manager khusus",
      "Integrasi core banking & API kustom",
      "Dukungan premium 24/7 (SLA 1j)",
      "Akun pengguna aktif tak terbatas",
    ],
    cta: "Hubungi Sales",
  },
];

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annually">("monthly");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
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
    <section id="harga" className="py-28 relative bg-[#030712] border-t border-slate-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-semibold mb-4">
            Model Lisensi
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Pilihan Paket yang{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Transparan
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Investasi cerdas untuk kemajuan analisis kredit dan perencanaan strategis UMKM Anda.
          </p>
        </motion.div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center items-center gap-4 mb-16">
          <span className={`text-sm font-semibold transition-colors ${billingPeriod === "monthly" ? "text-white" : "text-slate-500"}`}>
            Bulanan
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annually" : "monthly")}
            className="w-12 h-6.5 rounded-full bg-slate-800 border border-slate-700 p-0.5 relative flex items-center transition-colors focus:outline-none"
            aria-label="Toggle billing period"
          >
            <div 
              className={`w-5 h-5 rounded-full bg-emerald-400 transition-all duration-300 ${
                billingPeriod === "annually" ? "translate-x-6" : "translate-x-0"
              }`} 
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold transition-colors ${billingPeriod === "annually" ? "text-white" : "text-slate-500"}`}>
              Tahunan
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              Hemat 20%
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {plans.map((plan) => {
            const isHighlighted = plan.highlighted;
            const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnually;
            const period = billingPeriod === "monthly" ? plan.periodMonthly : plan.periodAnnually;
            
            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                className={`relative rounded-2xl border p-8 flex flex-col backdrop-blur-sm transition-all duration-300 group hover:scale-[1.02] ${
                  isHighlighted
                    ? "border-emerald-500/30 bg-[#0e1724]/40 shadow-[0_0_35px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/20"
                    : "border-slate-800 bg-slate-900/10 hover:border-slate-700"
                }`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold shadow-md">
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6 border-b border-slate-800/80 pb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {price}
                    </span>
                    {period && (
                      <span className="text-slate-500 text-sm font-semibold">{period}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span>{billingPeriod === "annually" && isHighlighted ? plan.subtext : plan.subtext}</span>
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-300 leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action CTA Button */}
                <button
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    isHighlighted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.01]"
                      : "border border-slate-700 bg-slate-900/30 text-slate-300 hover:border-emerald-500/30 hover:text-white"
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
