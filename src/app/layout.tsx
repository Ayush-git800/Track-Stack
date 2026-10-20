import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Track Stack | Club Activities Management Platform",
  description: "Production-grade Club Activities Management Platform for Mirai School of Technology (MSOT).",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#060B18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedTheme = localStorage.getItem("trackstack-theme");
                if (savedTheme === "light") {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                } else {
                  document.documentElement.classList.add("dark");
                  document.documentElement.classList.remove("light");
                }
                if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-100/70 dark:bg-navy-950 font-sans text-slate-900 dark:text-foreground selection:bg-cyan-500/30 selection:text-cyan-700 dark:selection:text-cyan-300">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/95 text-slate-900 dark:text-foreground shadow-lg dark:shadow-glass backdrop-blur-xl",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
