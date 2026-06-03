"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Layers,
  TrendingUp,
  MessageSquare,
  FileBarChart,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Credit Scoring AI",
    description:
      "Model XGBoost untuk prediksi risiko kredit UMKM dengan akurasi tinggi dan estimasi Probability of Default (PD).",
  },
  {
    icon: MapPin,
    title: "Location Intelligence",
    description:
      "Analisis geospasial mendalam untuk mengidentifikasi potensi lokasi dan risiko area berdasarkan data UMKM.",
  },
  {
    icon: Layers,
    title: "Clustering & Segmentation",
    description:
      "Segmentasi UMKM menggunakan K-Means dan DBSCAN untuk memahami pola dan karakteristik usaha.",
  },
  {
    icon: TrendingUp,
    title: "Policy Simulation",
    description:
      "Simulasi dampak kebijakan terhadap UMKM dengan model what-if analysis untuk pengambilan keputusan.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description:
      "Asisten AI berbasis GPT-4o dengan RAG untuk menjawab pertanyaan tentang data dan insight UMKM.",
  },
  {
    icon: FileBarChart,
    title: "Executive Reports",
    description:
      "Laporan eksekutif otomatis dengan visualisasi interaktif untuk stakeholder dan pengambil keputusan.",
  },
];

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
    transition: { duration: 0.5 },
  },
};

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="fitur" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Fitur Unggulan</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Solusi lengkap untuk analisis UMKM berbasis AI dan data geospasial
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="glass-card p-6 group hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:border-accent/30"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                <feature.icon className="w-6 h-6 text-accent group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
