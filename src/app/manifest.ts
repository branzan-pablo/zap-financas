import type { MetadataRoute } from "next";

/**
 * Web App Manifest (Fase 6 P2 — PWA instalável).
 *
 * Torna o app instalável na tela inicial do celular, fechando o gap do
 * concorrente que tem app nativo, sem manter uma base mobile separada.
 * Servido em /manifest.webmanifest pelo App Router.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zap Finanças",
    short_name: "Zap Finanças",
    description:
      "Seu assistente financeiro: Open Finance, inteligência artificial e WhatsApp.",
    // Abre já no app; o proxy redireciona para /login quando não há sessão.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    background_color: "#FBFBF9",
    theme_color: "#0c8a55",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // O ícone tem margem interna suficiente para a zona segura do maskable.
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Lançar gasto", url: "/transacoes" },
      { name: "Fechamento do mês", url: "/fechamento" },
      { name: "Orçamentos", url: "/orcamentos" },
    ],
  };
}
