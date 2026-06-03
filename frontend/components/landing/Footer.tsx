"use client";

import { MapPin } from "lucide-react";

const footerLinks = {
  Produk: [
    { label: "Credit Scoring", href: "#" },
    { label: "Location Intelligence", href: "#" },
    { label: "Clustering", href: "#" },
    { label: "Policy Simulation", href: "#" },
    { label: "AI Chat", href: "#" },
  ],
  Perusahaan: [
    { label: "Tentang Kami", href: "#" },
    { label: "Karir", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Kontak", href: "#" },
  ],
  Legal: [
    { label: "Kebijakan Privasi", href: "#" },
    { label: "Syarat & Ketentuan", href: "#" },
    { label: "SLA", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8 relative wave-border-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">GeoUMKM</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Platform intelijen UMKM berbasis AI untuk mendukung inklusi
              keuangan dan pengembangan ekonomi di Indonesia.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-accent hover:translate-x-1 inline-block transition-all duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-8">
          <p className="text-center text-sm text-slate-500">
            &copy; 2025 GeoUMKM Intelligence. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
