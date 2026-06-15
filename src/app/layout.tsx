import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Web Analytics da Vercel — ativado só onde a env NEXT_PUBLIC_ANALYTICS=1
// estiver definida (hoje: bolão da França). Mantém o código igual nos dois
// bolões; o do Brasil não carrega o script.
const analyticsOn = process.env.NEXT_PUBLIC_ANALYTICS === "1";

export const metadata: Metadata = {
  title: "Club Brésil – Bolão da Copa",
  description: "Bolão privado da Copa do Mundo do Club Brésil",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
        {analyticsOn && <Analytics />}
      </body>
    </html>
  );
}
