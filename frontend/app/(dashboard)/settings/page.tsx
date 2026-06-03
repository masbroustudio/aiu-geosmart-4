"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Palette, 
  Terminal, 
  Database, 
  Save, 
  Copy, 
  RefreshCw, 
  Lock, 
  Settings, 
  Globe, 
  Bell, 
  AlertTriangle 
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "developer" | "database">("profile");
  
  // Profile State
  const [userEmail, setUserEmail] = useState("admin@geoumkm.smart");
  const [userRole, setUserRole] = useState("administrator");
  const [fullName, setFullName] = useState("Pengelola GeoUMKM");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Preferences State
  const [lang, setLang] = useState<"id" | "en">("id");
  const [notifReports, setNotifReports] = useState(true);
  const [notifAudit, setNotifAudit] = useState(true);
  const [notifCredit, setNotifCredit] = useState(false);
  
  // Developer State
  const [apiKey, setApiKey] = useState("geoumkm_live_key_9af3c22b918f407b8a10f84bc112999e");
  const [generatingKey, setGeneratingKey] = useState(false);
  
  // Database State
  const [dbType, setDbType] = useState<"mock" | "postgres">("mock");
  const [resettingDb, setResettingDb] = useState(false);

  // Decode JWT on Mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.email) {
            setUserEmail(payload.email);
            // Default name extraction from email prefix
            const namePart = payload.email.split("@")[0];
            setFullName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
          }
          if (payload.role) {
            setUserRole(payload.role);
          }
        }
      } catch (e) {
        console.error("Gagal men-decode token otentikasi:", e);
      }
    }
  }, []);

  // Actions
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      addToast("Password baru tidak cocok!", "error");
      return;
    }
    
    addToast("Pengaturan profil berhasil disimpan!", "success");
    setPassword("");
    confirmPassword && setConfirmPassword("");
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    addToast("API Key disalin ke papan klip!", "success");
  };

  const handleGenerateKey = () => {
    setGeneratingKey(true);
    setTimeout(() => {
      const chars = "0123456789abcdef";
      let randomHex = "";
      for (let i = 0; i < 32; i++) {
        randomHex += chars[Math.floor(Math.random() * 16)];
      }
      setApiKey(`geoumkm_live_key_${randomHex}`);
      setGeneratingKey(false);
      addToast("API Key baru berhasil dibuat!", "success");
    }, 800);
  };

  const handleResetDb = () => {
    setResettingDb(true);
    setTimeout(() => {
      setResettingDb(false);
      addToast("Simulasi data dan cache dibersihkan!", "success");
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 lg:mt-0 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pengaturan Sistem</h1>
        <p className="text-slate-400 text-sm">
          Konfigurasi preferensi profil, tampilan, API integrasi, dan konektivitas basis data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="glass-card p-4 space-y-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil Akun</span>
          </button>
          
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "appearance"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Tampilan & Preferensi</span>
          </button>

          <button
            onClick={() => setActiveTab("developer")}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "developer"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Integrasi & API</span>
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === "database"
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Sistem & Database</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Profil & Informasi Pengguna</h3>
                <p className="text-slate-400 text-xs">Ubah detail profil dan kredensial akses masuk Anda.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{fullName}</h4>
                    <p className="text-xs text-slate-400">{userEmail}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                  {userRole}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Alamat Email (Read-Only)</label>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password Baru (Opsional)</label>
                    <input
                      type="password"
                      placeholder="Masukkan password baru"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent/25 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === "appearance" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Tampilan & Preferensi</h3>
                <p className="text-slate-400 text-xs">Sesuaikan visualisasi antarmuka dan notifikasi yang dikirimkan.</p>
              </div>

              {/* Tema */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300">Tema Sistem</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => theme !== "light" && toggle()}
                    className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-900 shadow-md ring-2 ring-accent/30"
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-[10px]">☀️</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Light Mode</p>
                      <p className="text-[10px] opacity-70">Visual terang dan minimalis</p>
                    </div>
                  </button>

                  <button
                    onClick={() => theme !== "dark" && toggle()}
                    className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                      theme === "dark"
                        ? "bg-slate-950 border-accent/40 text-white shadow-lg ring-2 ring-accent/30"
                        : "bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                      <span className="text-[10px]">🌙</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Dark Mode</p>
                      <p className="text-[10px] opacity-70">Visual gelap premium beremisi rendah</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bahasa */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300">Bahasa Platform</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setLang("id")}
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all flex items-center justify-between ${
                      lang === "id"
                        ? "bg-primary/20 border-accent text-accent"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Bahasa Indonesia</span>
                    </div>
                    <span className="text-xs opacity-60">ID</span>
                  </button>

                  <button
                    onClick={() => setLang("en")}
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all flex items-center justify-between ${
                      lang === "en"
                        ? "bg-primary/20 border-accent text-accent"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>English</span>
                    </div>
                    <span className="text-xs opacity-60">EN</span>
                  </button>
                </div>
              </div>

              {/* Notifikasi */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  <span>Notifikasi Alerting</span>
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">Laporan Mingguan</p>
                      <p className="text-[10px] text-slate-500">Kirim email ringkasan analitik UMKM daerah setiap awal pekan</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifReports}
                      onChange={(e) => setNotifReports(e.target.checked)}
                      className="w-4 h-4 accent-accent"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">Log Audit Akses</p>
                      <p className="text-[10px] text-slate-500">Notifikasi push saat ada aktifitas login tidak wajar</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifAudit}
                      onChange={(e) => setNotifAudit(e.target.checked)}
                      className="w-4 h-4 accent-accent"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white">Alerting Credit Default</p>
                      <p className="text-[10px] text-slate-500">Notifikasi real-time saat portofolio UMKM melampaui ambang batas default</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifCredit}
                      onChange={(e) => setNotifCredit(e.target.checked)}
                      className="w-4 h-4 accent-accent"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER & API */}
          {activeTab === "developer" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Integrasi Developer & API</h3>
                <p className="text-slate-400 text-xs">Gunakan API Key di bawah ini untuk mengakses analitik GeoUMKM dari aplikasi pihak ketiga Anda.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400">REST API Base URL</label>
                  <div className="px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                    https://green-bay-05bea5200.7.azurestaticapps.net/api
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400">Live API Key</label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-accent font-mono truncate">
                      {apiKey}
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center justify-center"
                      title="Salin Key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGenerateKey}
                      disabled={generatingKey}
                      className="px-4 rounded-lg bg-primary hover:bg-primary-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
                      title="Buat Ulang Key"
                    >
                      <RefreshCw className={`w-4 h-4 ${generatingKey ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-semibold text-white">Contoh Penggunaan (cURL)</h4>
                <pre className="p-3 rounded bg-black/60 text-[10px] text-emerald-400 font-mono overflow-x-auto scrollbar-thin">
{`curl -X GET "https://green-bay-05bea5200.7.azurestaticapps.net/api/overview" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE & SYSTEM */}
          {activeTab === "database" && (
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Status Sistem & Basis Data</h3>
                <p className="text-slate-400 text-xs">Informasi detail infrastruktur GeoUMKM Smart dan manajemen cache data.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Region Hosting</p>
                  <p className="text-sm font-semibold text-white">Azure East Asia</p>
                  <p className="text-[10px] text-slate-400">Data Center: Hong Kong</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Versi Aplikasi</p>
                  <p className="text-sm font-semibold text-white">GeoUMKM Smart v4.0.0</p>
                  <p className="text-[10px] text-slate-400">Runtime: Next.js (Export Static)</p>
                </div>
              </div>

              {/* Konfigurasi Database */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <label className="block text-sm font-semibold text-slate-300">Tipe Database Terkoneksi</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setDbType("mock")}
                      className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                        dbType === "mock"
                          ? "bg-primary/10 border-accent text-white shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold">Simulasi JSON (Mock)</span>
                      </div>
                      <p className="text-[10px] opacity-70">Penyimpanan sementara di in-memory /tmp Azure Functions.</p>
                    </button>

                    <button
                      onClick={() => {
                        setDbType("postgres");
                        addToast("Koneksi PostgreSQL hanya tersedia di mode produksi Azure DB!", "info");
                      }}
                      className={`p-4 rounded-xl border text-left space-y-2 transition-all ${
                        dbType === "postgres"
                          ? "bg-primary/10 border-accent text-white shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-sky-500" />
                        <span className="text-xs font-bold">Azure PostgreSQL</span>
                      </div>
                      <p className="text-[10px] opacity-70">Penyimpanan persisten relasional skala enterprise.</p>
                    </button>
                  </div>

                  {dbType === "mock" && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-300/80 leading-normal">
                        <strong>Pemberitahuan:</strong> Mode simulasi JSON di `/tmp` akan ter-reset otomatis ketika container Azure Functions mengalami <em>cold start</em>.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Hapus Data */}
              <div className="space-y-3 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-white">Reset Simulasi & Cache</h4>
                  <p className="text-[10px] text-slate-400">Bersihkan semua cache sesi local storage dan data tiruan.</p>
                </div>
                <button
                  onClick={handleResetDb}
                  disabled={resettingDb}
                  className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{resettingDb ? "Membersihkan..." : "Reset Data Sesi"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
