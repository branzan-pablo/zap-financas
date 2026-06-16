import { promises as fs } from "fs";
import path from "path";

export type WaitlistEntry = {
  email: string;
  wants_founder: boolean;
  price_shown: string | null;
  source: string | null;
  user_agent: string | null;
};

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Persists a waitlist lead.
 * - Production: Supabase via PostgREST (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY,
 *   both server-only). We use fetch instead of supabase-js to avoid pulling the
 *   realtime client, which needs native WebSocket (Node 22+) and isn't needed here.
 * - Local dev without keys: appends to .data/waitlist.json so the smoke test works offline.
 */
export async function saveLead(
  entry: WaitlistEntry
): Promise<{ mode: "supabase" | "file" }> {
  if (SUPA_URL && SUPA_KEY) {
    const res = await fetch(`${SUPA_URL}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        email: entry.email,
        wants_founder: entry.wants_founder,
        price_shown: entry.price_shown,
        source: entry.source,
        user_agent: entry.user_agent,
      }),
    });

    // 409 = unique violation: the email is already on the list, which is fine.
    if (res.ok || res.status === 409) {
      return { mode: "supabase" };
    }
    throw new Error(
      `Supabase insert failed: ${res.status} ${await res.text()}`
    );
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
