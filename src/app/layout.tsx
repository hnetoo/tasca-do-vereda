import type { Metadata } from "next";
import "@/styles/globals.css"; // Importar o CSS global do Tailwind

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
