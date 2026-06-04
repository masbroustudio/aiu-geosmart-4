"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const technologies = [
  { name: "Next.js", category: "Frontend" },
  { name: "TypeScript", category: "Language" },
  { name: "Azure Cloud", category: "Infrastructure" },
  { name: "Python", category: "ML/Backend" },
  { name: "XGBoost", category: "ML Model" },
  { name: "OpenAI GPT-4o", category: "AI/NLP" },
  { name: "Azure AI Search", category: "Search/RAG" },
  { name: "Tailwind CSS", category: "Styling" },
];

export default function TechStackSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="teknologi" className="py-28 relative bg-[#030712] border-t border-slate-900/60">
      <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/30 bg-teal-500/5 text-teal-400 text-xs font-semibold mb-4">
            Teknologi Sistem
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Didukung Teknologi{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Terdepan & Handal
            </span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Infrastruktur handal berstandar industri demi performa analitik real-time yang optimal.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="relative rounded-2xl border border-slate-800 bg-slate-900/10 p-5 text-center group hover:scale-[1.03] hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.05)] transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {tech.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                {tech.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{tech.category}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
