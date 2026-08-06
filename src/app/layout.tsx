import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorker } from "@/components/app/service-worker";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Origem canônica do site — base para Open Graph, canonical e URLs relativas.
 *
 * Segue `NEXT_PUBLIC_APP_URL` para não divergir do resto do app (callbacks de
 * auth, back_url do checkout). Estava fixo em "zapfinancas.app", domínio que não
 * é o de produção: as prévias de link apontariam para fora, e neste produto a
 * prévia aparece exatamente onde ele vive — no WhatsApp.
 */
const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zapfinancas.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Zap Finanças: seu assistente financeiro no WhatsApp",
  description:
    "Conecte seus bancos, entenda seus gastos e controle sua fatura — tudo pelo WhatsApp, com Open Finance e inteligência artificial.",
  openGraph: {
    title: "Zap Finanças: seu assistente financeiro no WhatsApp",
    description:
      "Conecte seus bancos, entenda seus gastos e controle sua fatura — tudo pelo WhatsApp, com Open Finance e inteligência artificial.",
    locale: "pt_BR",
    type: "website",
  },
  // PWA: ícone da tela inicial no iOS (Android usa o manifest).
  appleWebApp: { capable: true, title: "Zap Finanças", statusBarStyle: "default" },
  icons: { apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#FBFBF9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <ServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
