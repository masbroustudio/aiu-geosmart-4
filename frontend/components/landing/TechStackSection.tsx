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
    <section id="teknologi" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Didukung Teknologi Terdepan</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Built with enterprise-grade technology stack for reliability and
            performance
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="glass-card p-5 text-center group hover:scale-105 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                <span className="text-lg font-bold gradient-text">
                  {tech.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                {tech.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{tech.category}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
