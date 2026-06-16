import { promises as fs } from "fs";
import path from "path";

export type WaitlistEntry = {
  email: string;
  wants_founder: boolean;
  price_shown: string | null;
  source: string | null;
  user_agent: string | null;
};

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Persists a waitlist lead.
 * - Production: Supabase (set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 * - Local dev without keys: appends to .data/waitlist.json so the smoke test works offline.
 */
export async function saveLead(
  entry: WaitlistEntry
): Promise<{ mode: "supabase" | "file" }> {
  if (SUPA_URL && SUPA_KEY) {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(SUPA_URL, SUPA_KEY, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.from("waitlist").insert({
      email: entry.email,
      wants_founder: entry.wants_founder,
      price_shown: entry.price_shown,
      source: entry.source,
      user_agent: entry.user_agent,
    });
    // 23505 = unique violation: the email is already on the list, which is fine.
    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
    return { mode: "supabase" };
  }

  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "waitlist.json");
  await fs.mkdir(dir, { recursive: true });

  let list: unknown[] = [];
  try {
    list = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    // file does not exist yet
  }
  list.push({ ...entry, created_at: new Date().toISOString() });
  await fs.writeFile(file, JSON.stringify(list, null, 2), "utf8");
  return { mode: "file" };
}
