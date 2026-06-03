import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto mt-12 lg:mt-0">
      <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Settings className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Coming Soon
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Pengaturan akun, preferensi notifikasi, manajemen tim, dan konfigurasi
          API keys akan tersedia di sini.
        </p>
        <div className="mt-6 inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
          Dalam Pengembangan
        </div>
      </div>
    </div>
  );
}
