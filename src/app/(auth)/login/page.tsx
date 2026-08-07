import { Suspense } from "react";

import { AuthTabs } from "@/components/auth/auth-tabs";
import { AuthCardSkeleton } from "@/components/auth/auth-shell";

/**
 * `/login` e `/signup` renderizam o mesmo cartão de abas — a rota só escolhe
 * qual aba abre. O `Suspense` é exigência do Next: `useSearchParams()` (usado
 * para o `?error=` do callback do Supabase) precisa de um limite acima dele.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <AuthTabs inicial="entrar" />
    </Suspense>
  );
}
