"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { criarConnectToken, sincronizar } from "@/app/(app)/contas/actions";

// Widget do Pluggy Connect — client-only (usa `window`); carrega sob demanda.
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((m) => m.PluggyConnect),
  { ssr: false }
);

/**
 * Botão "Conectar conta" no modo Pluggy REAL (produção).
 *
 * Fluxo: pede um connect token ao servidor → abre o widget do Pluggy (o usuário
 * escolhe o banco e digita as credenciais dentro do iframe do Pluggy, NUNCA no
 * nosso app) → no sucesso o widget devolve o `itemId`, que sincronizamos com a
 * mesma função do botão "Sincronizar". O modo mock continua no ConnectModal
 * (dev local, sem credenciais Pluggy).
 */
export function PluggyConnectButton({
  includeSandbox,
}: {
  includeSandbox: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function abrir() {
    setErro(null);
    const r = await criarConnectToken();
    if (r.ok) setToken(r.token);
    else setErro(r.erro);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={abrir} disabled={pending}>
        {pending ? "Sincronizando…" : "+ Conectar conta"}
      </Button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {token && (
        <PluggyConnect
          connectToken={token}
          includeSandbox={includeSandbox}
          onClose={() => setToken(null)}
          onError={() => {
            setToken(null);
            setErro("Não foi possível conectar. Tente novamente.");
          }}
          onSuccess={(data: { item: { id: string } }) => {
            setToken(null);
            // Sincroniza o item recém-conectado (cria contas + transações).
            startTransition(async () => {
              const s = await sincronizar(data.item.id);
              if (s.ok) router.refresh();
              else setErro(s.erro);
            });
          }}
        />
      )}
    </div>
  );
}
