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

export const SANS =
  'Inter, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
export const MONO =
  '"SF Mono", "JetBrains Mono", ui-monospace, "Cascadia Code", monospace';

// Formata número com separador de milhar pt-BR sem depender de Intl.
export const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
