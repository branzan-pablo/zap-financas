"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { conectarConta } from "@/app/(app)/contas/actions";
import type { OFInstitution } from "@/lib/openfinance";

/**
 * Widget de conexão (mock do Pluggy Connect).
 *
 * Imita o fluxo real: lista de instituições → tela de consentimento →
 * autorização. Quando o Pluggy real entrar, só o que está atrás de
 * `conectarConta` muda; esta UI permanece.
 */
export function ConnectModal({
  institutions,
}: {
  institutions: OFInstitution[];
}) {
  const [aberto, setAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<OFInstitution | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function fechar() {
    setAberto(false);
    setSelecionada(null);
    setErro(null);
  }

  function autorizar() {
    if (!selecionada) return;
    setErro(null);
    startTransition(async () => {
      const r = await conectarConta(selecionada.id);
      if (r.ok) {
        fechar();
      } else {
        setErro(r.erro);
      }
    });
  }

  return (
    <>
      <Button onClick={() => setAberto(true)}>+ Conectar conta</Button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={fechar}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho estilo Open Finance */}
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald text-sm font-bold text-white">
                OF
              </span>
              <div>
                <p className="font-display text-base font-bold text-ink">
                  Conectar via Open Finance
                </p>
                <p className="text-xs text-slate">
                  Conexão somente leitura · ambiente de simulação
                </p>
              </div>
            </div>

            {!selecionada ? (
              // Passo 1 — escolher instituição
              <div className="space-y-2">
                <p className="mb-2 text-sm text-slate">
                  Selecione sua instituição:
                </p>
                {institutions.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => setSelecionada(inst)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:bg-paper"
                  >
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: inst.cor }}
                    >
                      {inst.nome.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-medium text-ink">{inst.nome}</span>
                  </button>
                ))}
              </div>
            ) : (
              // Passo 2 — consentimento
              <div>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-line p-3">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: selecionada.cor }}
                  >
                    {selecionada.nome.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="font-medium text-ink">{selecionada.nome}</span>
                </div>

                <p className="text-sm leading-relaxed text-slate">
                  Você autoriza o <strong>Zap Finanças</strong> a acessar, de
                  forma somente leitura, seus dados de contas, cartões,
                  transações e investimentos em {selecionada.nome}.
                </p>

                {erro && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {erro}
                  </p>
                )}

                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelecionada(null)}
                    disabled={pending}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={autorizar}
                    disabled={pending}
                    className="flex-1"
                  >
                    {pending ? "Conectando…" : "Autorizar acesso"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
