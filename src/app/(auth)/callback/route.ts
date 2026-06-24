import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth / magic-link callback handler.
 * Supabase redirects here after authentication with ?code=... query param.
 *
 * ⚠️ Next.js 16: no path params here, but request.url is used for searchParams.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  // Derive the app origin from the request URL
  const origin = `${url.protocol}//${url.host}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the intended destination (or dashboard).
      // Use absolute URL to ensure proper cookie propagation.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — redirect to login with error indicator.
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
