"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Use in Client Components only.
 * Relies on NEXT_PUBLIC_ env vars which are safe to expose.
 *
 * NOTE: Database generic omitted — will be replaced with `supabase gen types`
 * output once project is linked to a Supabase instance.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
