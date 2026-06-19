// Paleta e fontes do vídeo institucional (tema claro).
export const C = {
  bg: "#FBFBF9",
  surface: "#FFFFFF",
  border: "#E8E6E1",
  green: "#15803D",
  greenChip: "#DCFCE7",
  dark: "#0B1120",
  text: "#111827",
  muted: "#6B7280",
  wa: "#25D366",
  amber: "#B45309",
  amberChip: "#FEF3C7",
};

import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Carrega as fontes de verdade (pixel-perfect no render, não depende do SO).
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500", "700", "800"],
  subsets: ["latin"],
});

export const SANS = `${inter.fontFamily}, system-ui, sans-serif`;
export const MONO = `${mono.fontFamily}, ui-monospace, monospace`;

// Formata número com separador de milhar pt-BR sem depender de Intl.
export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
