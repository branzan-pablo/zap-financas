import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Origens externas em uso:
 *   • Supabase  — REST/Auth/Realtime (connect-src, incl. wss para realtime)
 *   • Pluggy    — o widget Pluggy Connect roda num iframe de cdn.pluggy.ai
 *   • Vercel    — @vercel/analytics (script + beacon)
 *
 * `unsafe-inline` em script-src é exigido pelo runtime do Next.js (bootstrap e
 * payload de hidratação são inline). Trocar por nonce exige mover o CSP para o
 * proxy e gerar um nonce por request — vale fazer depois; por ora este CSP já
 * bloqueia script de terceiros não listados, que é o ganho principal.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://cdn.pluggy.ai",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pluggy.ai https://va.vercel-scripts.com",
  "frame-src 'self' https://cdn.pluggy.ai https://connect.pluggy.ai",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /**
   * Headers de segurança — app financeiro, aplicados a todas as rotas.
   *
   * A Vercel já força HTTPS e redireciona HTTP→HTTPS, mas NÃO envia nenhum
   * destes por padrão. Sem X-Frame-Options/frame-ancestors, a dashboard pode ser
   * embutida num iframe e sofrer clickjacking em cima de ações de dinheiro
   * (excluir conta, cancelar assinatura, lançar transação).
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // HTTPS obrigatório por 2 anos, incluindo subdomínios.
          //
          // SEM `preload` de propósito. Esse token não é uma anotação: é o sinal
          // de consentimento que o hstspreload.org exige para aceitar uma
          // submissão — e ele não verifica se quem submete é o dono do domínio.
          // Com o token no ar, um terceiro pode nos colocar na lista embutida
          // dos navegadores, de onde sair leva meses. Combinado com
          // includeSubDomains, isso significaria que qualquer subdomínio futuro
          // sem TLS válido fica inacessível, sem escapatória para o usuário.
          //
          // O que se perde: proteção da PRIMEIRA visita de quem nunca entrou no
          // site (o navegador ainda não viu este header). O max-age abaixo já
          // cobre todas as visitas seguintes, e é reversível.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "Content-Security-Policy", value: CSP },
          // Redundante com frame-ancestors do CSP, mas cobre browsers antigos.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nada disso é usado pelo produto — negar por padrão.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Dados financeiros pessoais nunca em cache compartilhado.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
