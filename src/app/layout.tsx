import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
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

const siteUrl = "https://cartaozap.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "CartãoZap — controle seu cartão pelo WhatsApp",
  description:
    "Saiba sua fatura antes dela fechar. Registre compras parceladas por mensagem e veja quanto você já comprometeu nos próximos meses.",
  openGraph: {
    title: "CartãoZap — controle seu cartão pelo WhatsApp",
    description:
      "Saiba sua fatura antes dela fechar. Registre compras parceladas por mensagem e veja o que já comprometeu nos próximos meses.",
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
      </body>
    </html>
  );
}
