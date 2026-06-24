import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// NOTE: We intentionally omit the Database generic here.
// Proper typed Database will be generated via `supabase gen types typescript`
// once the project is linked. Until then, queries return `any` which avoids
// manual-type inference failures in the Supabase SDK.

/**
 * Server-side Supabase client using the anon key + user session cookie.
 * Respects RLS — use this in Server Components, Route Handlers, and Server Functions.
 *
 * ⚠️ Next.js 16: cookies() is async — always await.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // The proxy refreshes the session and sets cookies via NextResponse.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service_role key — bypasses RLS.
 * Use ONLY in server-side code for operations that require cross-user access
 * (e.g., webhooks, cron jobs, aggregations).
 * NEVER expose this key to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignored in Server Components
          }
        },
      },
    }
  );
}
