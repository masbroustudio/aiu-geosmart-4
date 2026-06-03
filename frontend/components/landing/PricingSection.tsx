"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "Rp 0",
    period: "/bulan",
    description: "Untuk peneliti dan individu",
    highlighted: false,
    badge: null,
    features: [
      "Akses data 100 UMKM",
      "Credit scoring dasar",
      "1 model AI",
      "Dashboard overview",
      "Export CSV",
      "Community support",
      "Dokumentasi lengkap",
      "1 user",
    ],
    cta: "Mulai Gratis",
  },
  {
    name: "Professional",
    price: "Rp 2.500.000",
    period: "/bulan",
    description: "Untuk organisasi dan tim",
    highlighted: true,
    badge: "Populer",
    features: [
      "Akses data 10.000+ UMKM",
      "Credit scoring lengkap + PD",
      "Semua 3 model AI",
      "Full dashboard & analytics",
      "Location intelligence",
      "Policy simulation",
      "AI Chat Assistant",
      "API access",
      "Priority support",
      "Hingga 10 users",
    ],
    cta: "Pilih Professional",
  },
  {
    name: "Enterprise",
    price: "Hubungi Kami",
    period: "",
    description: "Untuk kebutuhan kustom",
    highlighted: false,
    badge: null,
    features: [
      "Unlimited data access",
      "Custom model training",
      "Dedicated infrastructure",
      "White-label solution",
      "On-premise deployment",
      "SLA 99.9% uptime",
      "Dedicated account manager",
      "Custom integration",
      "24/7 premium support",
      "Unlimited users",
    ],
    cta: "Hubungi Sales",
  },
];

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
    transition: { duration: 0.5 },
  },
};

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="harga" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Pilih Paket Sesuai Kebutuhan</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Flexible pricing for every scale of operation
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={`glass-card p-8 relative flex flex-col hover:scale-[1.03] hover:border-accent/40 transition-all duration-300 ${
                plan.highlighted
                  ? "border-accent/40 shadow-xl shadow-accent/10 ring-1 ring-accent/20 pulse-glow"
                  : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-accent to-accent-600 text-white text-xs font-semibold">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-accent to-accent-600 text-white hover:shadow-lg hover:shadow-accent/30"
                    : "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-accent hover:text-accent"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
