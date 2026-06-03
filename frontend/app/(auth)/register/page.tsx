"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Loader2 } from "lucide-react";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const result = await register(email, password, name);

      if (result) {
        setSuccess(true);
        // Redirect to login after 1 second
        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        setError("Registrasi gagal. Email mungkin sudah terdaftar.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat registrasi. Coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient-bg opacity-50" />
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md glass-card p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">GeoUMKM</span>
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          Buat Akun Baru
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Mulai gunakan platform intelijen UMKM
        </p>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
            <p className="text-sm text-red-400 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
            <p className="text-sm text-green-400 font-medium">Registrasi berhasil! Mengalihkan ke login...</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
            />
          </div>

           <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold hover:shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sedang memproses...
              </>
            ) : (
              "Daftar"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
