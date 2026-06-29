"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sincronizar } from "@/app/(app)/contas/actions";

/** Botão "Sincronizar agora" — re-roda o sync de um item (idempotente). */
export function SyncButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function onClick() {
    setErro(null);
    startTransition(async () => {
      const r = await sincronizar(itemId);
      if (!r.ok) setErro(r.erro);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {erro && <span className="text-xs text-red-600">{erro}</span>}
      <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
        {pending ? "Sincronizando…" : "Sincronizar"}
      </Button>
    </div>
  );
}
