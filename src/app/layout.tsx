import type { Metadata } from "next";
import "../styles/globals.css";
import AppShell from "@/components/AppShell";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ReduxProvider } from "@/providers/ReduxProvider";

export const metadata: Metadata = {
  title: "Tasca do Vereda",
  description: "Sistema de gestão para a Tasca do Vereda",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <ReduxProvider>
          <AppShell>{children}</AppShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
