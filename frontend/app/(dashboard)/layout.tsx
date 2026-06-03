import Sidebar from "@/components/dashboard/Sidebar";
import FloatingChatPanel from "@/components/chat/FloatingChatPanel";
import BackToTop from "@/components/ui/BackToTop";
import ToastContainer from "@/components/ui/Toast";
import { ToastProvider } from "@/lib/toast-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar />
        <main className="lg:ml-[260px] min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <FloatingChatPanel />
        <BackToTop />
        <ToastContainer />
      </div>
    </ToastProvider>
  );
}
