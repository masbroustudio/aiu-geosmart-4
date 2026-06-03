"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Building2, Landmark, Briefcase } from "lucide-react";

const tabs = [
  {
    id: "bank",
    label: "Bank",
    icon: Building2,
    title: "Untuk Perbankan & Lembaga Keuangan",
    subtitle: "Optimal credit decisions with AI-powered risk assessment",
    benefits: [
      "Credit risk scoring dengan model XGBoost untuk prediksi gagal bayar",
      "Estimasi Probability of Default (PD) sesuai standar regulasi OJK",
      "Portfolio analytics dengan segmentasi nasabah UMKM otomatis",
      "Regulatory compliance report untuk Basel III dan PSAK 71",
    ],
    cta: "Lihat Demo Credit Scoring",
    gradient: "from-blue-500/5 to-cyan-500/5",
  },
  {
    id: "pemerintah",
    label: "Pemerintah",
    icon: Landmark,
    title: "Untuk Pemerintah Daerah",
    subtitle: "Data-driven policy making for UMKM development",
    benefits: [
      "Prioritas area pengembangan berbasis skor lokasi komprehensif",
      "Simulasi kebijakan what-if untuk prediksi dampak program",
      "Monitoring program pemberdayaan UMKM secara real-time",
      "Optimasi alokasi anggaran berdasarkan analisis klaster",
    ],
    cta: "Lihat Demo Policy Simulation",
    gradient: "from-amber-500/5 to-orange-500/5",
  },
  {
    id: "investor",
    label: "Investor",
    icon: Briefcase,
    title: "Untuk Investor & Venture Capital",
    subtitle: "Identify high-growth UMKM opportunities at scale",
    benefits: [
      "Opportunity scoring untuk identifikasi UMKM potensial",
      "Market segmentation berdasarkan karakteristik dan pertumbuhan",
      "Location analysis untuk strategi ekspansi dan penetrasi pasar",
      "Growth prediction model untuk proyeksi return on investment",
    ],
    cta: "Lihat Demo Opportunity Map",
    gradient: "from-purple-500/5 to-pink-500/5",
  },
];

export default function ForWhoSection() {
  const [activeTab, setActiveTab] = useState("bank");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const activeContent = tabs.find((t) => t.id === activeTab)!;

  return (
    <section id="untuk-siapa" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Untuk Siapa?</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Dirancang khusus untuk kebutuhan profesional di sektor finansial dan
            pemerintahan
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex glass rounded-xl p-1.5 gap-1 overflow-x-auto flex-nowrap max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-400 hover:text-accent dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className={`glass-card p-8 md:p-12 bg-gradient-to-br ${activeContent.gradient}`}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Icon placeholder */}
              <div className="flex items-center justify-center">
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <activeContent.icon className="w-24 h-24 text-accent/70" />
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">
                  {activeContent.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 italic">
                  {activeContent.subtitle}
                </p>
                <ul className="space-y-4">
                  {activeContent.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-8 px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold hover:shadow-lg hover:shadow-accent/25 transition-all">
                  {activeContent.cta}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
