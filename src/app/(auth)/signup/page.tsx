import { Suspense } from "react";

import { AuthTabs } from "@/components/auth/auth-tabs";
import { AuthCardSkeleton } from "@/components/auth/auth-shell";

/** Mesma tela de `/login`, abrindo na aba de criar conta. */
export default function SignupPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <AuthTabs inicial="criar" />
    </Suspense>
  );
}
