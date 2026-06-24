import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const siteUrl = "https://zapfinancas.app";

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
        <Analytics />
      </body>
    </html>
  );
}
