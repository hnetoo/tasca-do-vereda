// v1.1.0 - Cache Fix & Balcão Fix
import type { Metadata } from "next";
import "../styles/globals.css";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ReduxProvider } from "@/providers/ReduxProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { CartProvider } from "@/contexts/CartContext";

export const metadata: Metadata = {
  title: "Tasca do Vereda",
  description: "Sistema de gestão para a Tasca do Vereda",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tasca Do VEREDA",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT">
      <head>
        <meta name="theme-color" content="#fbbf24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tasca Do VEREDA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Tasca Do VEREDA" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-TileImage" content="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ReduxProvider>
          <CartProvider>
            <AppShell>
              {children}
              <PWAInstallPrompt />
              <ServiceWorkerRegister />
            </AppShell>
          </CartProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
