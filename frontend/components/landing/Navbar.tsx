"use client";

import { useState, useEffect } from "react";
import { MapPin, Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Untuk Siapa", href: "#untuk-siapa" },
  { label: "Teknologi", href: "#teknologi" },
  { label: "Harga", href: "#harga" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 transition-colors text-slate-400 hover:text-white focus:outline-none"
      aria-label="Toggle dark mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4.5 h-4.5 text-slate-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    setIsLoggedIn(!!localStorage.getItem("auth_token"));
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className={cn(
          "w-full transition-all duration-500 pointer-events-auto",
          scrolled
            ? "max-w-5xl mx-4 mt-4 rounded-full border border-slate-800 bg-[#090d16]/75 backdrop-blur-md py-2.5 px-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
            : "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-transparent"
        )}
      >
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Geo<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">UMKM</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors duration-300 px-2.5 py-1.5"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Actions & Theme Switch */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            
            {isLoggedIn ? (
              <a
                href="/overview"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Masuk
                </a>
                <a
                  href="/register"
                  className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all"
                >
                  <span>Mulai Demo</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 text-slate-400 hover:text-white bg-slate-900/40 rounded-xl border border-slate-800"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 pt-4 border-t border-slate-850 overflow-hidden"
            >
              <div className="flex flex-col gap-3 pb-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-semibold text-slate-350 hover:text-white transition-colors py-1.5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                
                <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
                  {isLoggedIn ? (
                    <a
                      href="/overview"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold text-center"
                      onClick={() => setMobileOpen(false)}
                    >
                      Buka Dashboard
                    </a>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <a
                        href="/login"
                        className="w-full py-3 rounded-xl border border-slate-700 bg-slate-900/20 text-slate-300 text-xs font-bold text-center hover:bg-slate-900 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        Masuk
                      </a>
                      <a
                        href="/register"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold text-center"
                        onClick={() => setMobileOpen(false)}
                      >
                        Daftar Demo Gratis
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
