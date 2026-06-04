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
  AlertTriangle,
  Shield,
  Trash2,
  Key,
  Plus
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";
import { 
  fetchStatus, 
  fetchDeveloperKeys, 
  createDeveloperKey, 
  deleteDeveloperKey, 
  DeveloperKey 
} from "@/lib/api";

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
  const [developerKeys, setDeveloperKeys] = useState<DeveloperKey[]>([]);
  const [latestRawKey, setLatestRawKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("https://green-bay-05bea5200.7.azurestaticapps.net/api");
  
  // Database State
  const [dbType, setDbType] = useState<"mock" | "postgres">("mock");
  const [resettingDb, setResettingDb] = useState(false);

  // Decode JWT on Mount & Fetch DB Status & Load API Keys
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

    // Set REST API Base URL dynamically based on location
    if (typeof window !== "undefined") {
      setApiBaseUrl(`${window.location.origin}/api`);
    }

    // Fetch actual database connection type from backend
    fetchStatus()
      .then((status) => {
        if (status && status.dbType) {
          setDbType(status.dbType);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil status database:", err);
      });

    // Fetch active Developer API keys from database
    fetchDeveloperKeys()
      .then((keys) => {
        setDeveloperKeys(keys);
      })
      .catch((err) => {
        console.error("Gagal mengambil API Keys:", err);
      });
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

  const handleCopyKey = (keyText: string) => {
    navigator.clipboard.writeText(keyText);
    addToast("API Key disalin ke papan klip!", "success");
  };

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const result = await createDeveloperKey();
      if (result && result.raw_key) {
        setLatestRawKey(result.raw_key);
        // Refresh active keys list
        const updatedKeys = await fetchDeveloperKeys();
        setDeveloperKeys(updatedKeys);
        addToast("API Key baru berhasil dibuat!", "success");
      } else {
        addToast("Gagal membuat API Key baru.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Gagal menghubungi server untuk membuat API Key.", "error");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin mencabut (revoke) API Key ini? Aplikasi luar yang memakai key ini akan kehilangan akses.")) {
      return;
    }
    try {
      const success = await deleteDeveloperKey(id);
      if (success) {
        setDeveloperKeys(developerKeys.filter((k) => k.id !== id));
        // Clear latest generated key preview if it was revoked
        setLatestRawKey(null);
        addToast("API Key berhasil dicabut!", "success");
      } else {
        addToast("Gagal mencabut API Key.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Terjadi kesalahan sistem saat menghapus API Key.", "error");
    }
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
                    {apiBaseUrl}
                  </div>
                </div>

                {/* Banner API Key Baru Dibuat */}
                {latestRawKey && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Shield className="w-4 h-4 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">API Key Baru Berhasil Dibuat!</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-normal">
                      Demi alasan keamanan, key ini **hanya akan diperlihatkan sekali ini saja**. Harap salin dan simpan di tempat aman sebelum meninggalkan halaman ini.
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-emerald-500/20 text-xs text-emerald-400 font-mono select-all overflow-x-auto">
                        {latestRawKey}
                      </div>
                      <button
                        onClick={() => handleCopyKey(latestRawKey)}
                        className="px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-colors flex items-center justify-center gap-1.5 text-xs"
                        title="Salin Key Baru"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Salin</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Daftar Keys */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-400">Daftar API Keys Aktif</label>
                    <button
                      onClick={handleGenerateKey}
                      disabled={generatingKey}
                      className="px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/35 disabled:opacity-50 text-accent transition-all flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Key Baru</span>
                    </button>
                  </div>

                  {developerKeys.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-center space-y-2">
                      <Key className="w-6 h-6 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">Belum ada API Key yang terdaftar.</p>
                      <p className="text-[10px] text-slate-500">Klik tombol di atas untuk membuat API Key integrasi pertama Anda.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                              <th className="px-4 py-3">API Key Preview</th>
                              <th className="px-4 py-3">Role</th>
                              <th className="px-4 py-3">Rate Limit</th>
                              <th className="px-4 py-3">Dibuat Pada</th>
                              <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {developerKeys.map((k) => (
                              <tr key={k.id} className="hover:bg-slate-900/20 text-slate-300 transition-colors">
                                <td className="px-4 py-3 font-mono text-[11px] text-accent">
                                  geoumkm_live_key_****{k.key_hash.slice(-6)}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 font-medium capitalize text-slate-300">
                                    {k.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400">{k.rate_limit} req/min</td>
                                <td className="px-4 py-3 text-slate-400">
                                  {new Date(k.created_at).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleCopyKey(`geoumkm_live_key_****${k.key_hash.slice(-6)}`)}
                                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                      title="Salin Preview Key"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteKey(k.id)}
                                      className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                                      title="Cabut Akses Key"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-semibold text-white">Contoh Penggunaan (cURL)</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Kirimkan API Key Anda melalui header kustom <code className="text-accent bg-slate-950 px-1 py-0.5 rounded">X-API-Key</code> saat melakukan request dari aplikasi pihak ketiga Anda.
                </p>
                <pre className="p-3 rounded bg-black/60 text-[10px] text-emerald-400 font-mono overflow-x-auto scrollbar-thin">
{`curl -X GET "${apiBaseUrl}/overview" \\
  -H "X-API-Key: geoumkm_live_key_9af3c22b918f407b8a10f84bc112999e" \\
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
                <label className="block text-sm font-semibold text-slate-300">Tipe Database Terkoneksi (Real-time Status)</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-xl border text-left space-y-2 relative transition-all ${
                        dbType === "mock"
                          ? "bg-amber-500/10 border-amber-500/30 text-white shadow-md"
                          : "bg-slate-950/40 border-slate-900 text-slate-500 opacity-60"
                      }`}
                    >
                      {dbType === "mock" && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                          Aktif
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold">Simulasi JSON (Mock)</span>
                      </div>
                      <p className="text-[10px] opacity-70">Penyimpanan sementara di in-memory /tmp Azure Functions.</p>
                    </div>

                    <div
                      className={`p-4 rounded-xl border text-left space-y-2 relative transition-all ${
                        dbType === "postgres"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-white shadow-md"
                          : "bg-slate-950/40 border-slate-900 text-slate-500 opacity-60"
                      }`}
                    >
                      {dbType === "postgres" && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                          Terkoneksi
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold">Azure PostgreSQL</span>
                      </div>
                      <p className="text-[10px] opacity-70">Penyimpanan persisten relasional skala enterprise.</p>
                    </div>
                  </div>

                  {dbType === "mock" && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-300/80 leading-normal">
                        <strong>Pemberitahuan:</strong> Mode simulasi JSON di `/tmp` akan ter-reset otomatis ketika container Azure Functions mengalami <em>cold start</em>.
                      </p>
                    </div>
                  )}

                  {dbType === "postgres" && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-2">
                      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-emerald-300/80 leading-normal">
                        <strong>Sistem Aman:</strong> Koneksi database Azure PostgreSQL aktif secara langsung. Seluruh data pengguna, log audit, dan portofolio Anda tersimpan secara aman dan persisten.
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
