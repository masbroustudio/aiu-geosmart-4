import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeoUMKM Intelligence v4.0",
  description:
    "Platform Intelijen UMKM Terdepan di Indonesia - AI-Powered Location Intelligence & Credit Risk Assessment untuk Bank, Pemerintah, dan Investor.",
  keywords: [
    "UMKM",
    "credit scoring",
    "location intelligence",
    "Indonesia",
    "AI",
    "machine learning",
  ],
  openGraph: {
    title: "GeoUMKM Intelligence v4.0",
    description:
      "Platform Intelijen UMKM Terdepan di Indonesia - AI-Powered Location Intelligence & Credit Risk Assessment.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoUMKM Intelligence v4.0",
    description:
      "Platform Intelijen UMKM Terdepan di Indonesia - AI-Powered Location Intelligence & Credit Risk Assessment.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
