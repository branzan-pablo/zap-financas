import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth proxy — Next.js 16 (formerly middleware.ts).
 *
 * Responsibilities:
 *  1. Emit the Content-Security-Policy with a per-request nonce.
 *  2. Refresh the Supabase session cookie on every request (keeps auth alive).
 *  3. Redirect unauthenticated users away from protected routes.
 *  4. Redirect authenticated users away from auth pages.
 *
 * ⚠️ Keep this function fast — no slow DB queries. Only optimistic session checks.
 */

const DESENVOLVIMENTO = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy — mora aqui, e não no `next.config.ts`, porque o
 * nonce precisa ser novo a cada requisição, e `headers()` do config é estático.
 *
 * O que isso compra: `script-src` não tem mais `'unsafe-inline'` em produção.
 * Com ele, um XSS que conseguisse injetar `<script>…</script>` executava — o
 * CSP bloqueava terceiros, mas não o script injetado na nossa própria página.
 * Agora só executa script que carregue o nonce do request, e o atacante não tem
 * como adivinhá-lo. Num app que lê conta bancária, essa é a diferença entre
 * "leram seus dados" e "a injeção não rodou".
 *
 * O preço está documentado e é real: nonce exige renderização dinâmica, então
 * a landing e as telas de auth deixaram de ser estáticas (ver `force-dynamic`
 * em `app/layout.tsx`).
 *
 * Origens externas em uso:
 *   • Supabase  — REST/Auth/Realtime (connect-src, incl. wss para realtime)
 *   • Pluggy    — o widget Pluggy Connect roda num iframe de cdn.pluggy.ai
 *   • Vercel    — @vercel/analytics (script + beacon)
 */
function montarCsp(nonce: string): string {
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      // `unsafe-eval` é EXCLUSIVO do dev server: o React em desenvolvimento usa
      // eval() para remontar callstacks que cruzam a fronteira servidor/cliente,
      // e o HMR do Turbopack avalia os módulos trocados a quente. `next build`
      // roda com NODE_ENV=production, então não há caminho para o deploy.
      ...(DESENVOLVIMENTO ? ["'unsafe-eval'"] : []),
      "https://va.vercel-scripts.com",
      "https://cdn.pluggy.ai",
    ].join(" "),
    // `style-src` MANTÉM `unsafe-inline` de propósito. Um nonce não cobre
    // atributos `style=""`, e o app inteiro depende deles: a largura das barras
    // do `Meter`, a cor vinda do banco nas categorias, a posição do holofote do
    // tour. Trocar por nonce exigiria `style-src-attr 'unsafe-inline'`, cujo
    // suporte é irregular — e quebraria essas telas onde faltasse.
    // O risco também não é o mesmo: CSS injetado não executa JavaScript.
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
}

/**
 * Decide o redirecionamento de auth — separado da requisição para ser testável.
 *
 * `acaoDeServidor` existe por um bug real: o proxy redirecionava também o POST
 * de uma Server Action, e o cliente do Next recebia um 307 onde esperava o
 * payload da action. O resultado era o error boundary com "An unexpected
 * response was received from the server" — nunca a tela de login.
 *
 * Verificado em produção: `POST /signup` com sessão ativa devolvia 307, o
 * browser reenviava o POST para /dashboard, e o app quebrava. O caso espelho é
 * pior e atinge qualquer usuário: sessão expira, a pessoa salva uma transação,
 * e em vez de ir para o login vê "Algo deu errado" no meio de um lançamento.
 *
 * Deixar a action passar é seguro — todas chamam `supabase.auth.getUser()` antes
 * de tocar em qualquer coisa, e um `redirect()` de dentro de uma action o Next
 * sabe entregar ao cliente. O RLS é a barreira final.
 */
export function redirecionamentoDeAuth(estado: {
  temSessao: boolean;
  rotaApp: boolean;
  rotaAuth: boolean;
  acaoDeServidor: boolean;
}): "/login" | "/dashboard" | null {
  if (estado.acaoDeServidor) return null;
  if (!estado.temSessao && estado.rotaApp) return "/login";
  if (estado.temSessao && estado.rotaAuth) return "/dashboard";
  return null;
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const csp = montarCsp(nonce);

  /**
   * Headers da REQUISIÇÃO que chegam ao renderizador.
   *
   * O Next extrai o nonce do header `Content-Security-Policy` da requisição e
   * carimba sozinho os próprios scripts (runtime, bundles, `<Script>`). O
   * `x-nonce` é o atalho para Server Components que precisem dele à mão.
   *
   * É uma função, e não um valor, porque `request.cookies.set()` reescreve o
   * header `cookie` da requisição: os headers precisam ser copiados DEPOIS
   * dessa escrita, senão a sessão renovada não chega ao render.
   */
  function headersDaRequisicao() {
    const headers = new Headers(request.headers);
    headers.set("Content-Security-Policy", csp);
    headers.set("x-nonce", nonce);
    return headers;
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: headersDaRequisicao() },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate cookies to both the request and the response.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: headersDaRequisicao() },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protected routes: require auth
  const isAppRoute = pathname.startsWith("/dashboard") ||
    pathname.startsWith("/contas") ||
    pathname.startsWith("/transacoes") ||
    pathname.startsWith("/cartoes") ||
    pathname.startsWith("/metas") ||
    pathname.startsWith("/investimentos") ||
    pathname.startsWith("/orcamentos") ||
    pathname.startsWith("/fechamento") ||
    pathname.startsWith("/configuracoes");

  // Auth routes: redirect away if already logged in
  const isAuthRoute = pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  // O Next carimba `Next-Action` no POST de toda Server Action. É como
  // distinguir "o usuário está navegando" de "o app está executando uma ação" —
  // e só o primeiro caso pode ser redirecionado daqui.
  const acaoDeServidor =
    request.method === "POST" && request.headers.has("next-action");

  const destino = redirecionamentoDeAuth({
    temSessao: Boolean(user),
    rotaApp: isAppRoute,
    rotaAuth: isAuthRoute,
    acaoDeServidor,
  });

  if (destino) {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    if (destino === "/login") url.searchParams.set("next", pathname);
    return comCsp(NextResponse.redirect(url), csp);
  }

  // IMPORTANT: return supabaseResponse (not NextResponse.next()) to preserve
  // the refreshed session cookies.
  return comCsp(supabaseResponse, csp);
}

/** O CSP vale para toda resposta que sai daqui — inclusive os redirects. */
function comCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     * - api routes (handled internally)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
