import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/sidebar";

/**
 * Authenticated app shell layout.
 * All routes under (app)/ require a valid session.
 * The proxy handles optimistic redirects; this layout does the authoritative check.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const userName = profile?.nome ?? user.email?.split("@")[0] ?? null;

  return (
    <div className="flex h-svh overflow-hidden bg-paper">
      {/* Sidebar — desktop only; mobile nav to be added in Fase 5 */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar userName={userName} />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
