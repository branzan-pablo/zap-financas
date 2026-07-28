import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth proxy — Next.js 16 (formerly middleware.ts).
 *
 * Responsibilities:
 *  1. Refresh the Supabase session cookie on every request (keeps auth alive).
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from auth pages.
 *
 * ⚠️ Keep this function fast — no slow DB queries. Only optimistic session checks.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
    pathname.startsWith("/configuracoes");

  // Auth routes: redirect away if already logged in
  const isAuthRoute = pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: return supabaseResponse (not NextResponse.next()) to preserve
  // the refreshed session cookies.
  return supabaseResponse;
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
