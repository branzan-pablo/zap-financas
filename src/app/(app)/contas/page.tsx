import { createClient } from "@/lib/supabase/server";
import { getOpenFinanceProvider } from "@/lib/openfinance";
import { ConnectModal } from "@/components/app/connect-modal";
import { PluggyConnectButton } from "@/components/app/pluggy-connect-button";
import { SyncButton } from "@/components/app/sync-button";
import { Button } from "@/components/ui/button";
import { formatBRL, formatData } from "@/lib/format";
import { arquivarContaManual, criarContaManual } from "./actions";

type Conta = {
  id: string;
  nome: string;
  banco: string | null;
  tipo: string;
  saldo: number | null;
  pluggy_item_id: string | null;
  ultimo_sync: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  corrente: "Conta corrente",
  poupanca: "Poupança",
  cartao: "Cartão de crédito",
  investimento: "Investimentos",
  outro: "Outro",
};

export default async function ContasPage() {
  const supabase = await createClient();

  // RLS garante que só vêm as contas do próprio usuário.
  const { data } = await supabase
    .from("accounts")
    .select("id, nome, banco, tipo, saldo, pluggy_item_id, ultimo_sync")
    .eq("ativo", true)
    .order("created_at", { ascending: true });
  const contas = (data ?? []) as Conta[];

  const provider = getOpenFinanceProvider();
  const modoPluggy = provider.nome === "pluggy";
  // No modo Pluggy real, o próprio widget mostra a lista de bancos; só o mock
  // precisa que a gente liste instituições aqui.
  const institutions = modoPluggy ? [] : await provider.listInstitutions();

  // Conectadas (Open Finance) × manuais (dinheiro, VR, outra poupança).
  const conectadas = contas.filter((c) => c.pluggy_item_id !== null);
  const manuais = contas.filter((c) => c.pluggy_item_id === null);

  // Agrupa as conectadas por item (uma conexão Pluggy pode ter várias contas).
  const grupos = new Map<string, Conta[]>();
  for (const c of conectadas) {
    const key = c.pluggy_item_id!;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(c);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Contas</h1>
          <p className="mt-1 text-slate">
            Conecte e gerencie suas contas bancárias via Open Finance.
          </p>
        </div>
        {modoPluggy ? (
          <PluggyConnectButton
            includeSandbox={process.env.PLUGGY_INCLUDE_SANDBOX !== "false"}
          />
        ) : (
          <ConnectModal institutions={institutions} />
        )}
      </div>

      {contas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-soft text-2xl">
            🏦
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Nenhuma conta conectada
          </h2>
          <p className="mx-auto mt-2 max-w-sm leading-relaxed text-slate">
            Conecte mais de 100 bancos via Open Finance e veja tudo em um só
            lugar. Use o botão{" "}
            <span className="font-medium text-ink">Conectar conta</span> — ou crie
            uma conta manual abaixo para dinheiro e VR.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grupos.entries()].map(([key, items]) => {
            const banco = items[0]?.banco ?? "Conexão";
            const ultimoSync = items.find((i) => i.ultimo_sync)?.ultimo_sync;
            return (
              <div
                key={key}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
                  <div>
                    <p className="font-semibold text-ink">{banco}</p>
                    {ultimoSync && (
                      <p className="text-xs text-slate">
                        Sincronizado em {formatData(ultimoSync)}
                      </p>
                    )}
                  </div>
                  <SyncButton itemId={key} />
                </div>
                <ul className="divide-y divide-line">
                  {items.map((c) => {
                    const negativo = (c.saldo ?? 0) < 0;
                    return (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-4 px-5 py-3"
                      >
                        <div>
                          <p className="font-medium text-ink">{c.nome}</p>
                          <p className="text-xs text-slate">
                            {TIPO_LABEL[c.tipo] ?? c.tipo}
                          </p>
                        </div>
                        <span
                          className={`font-num font-semibold ${
                            negativo ? "text-red-600" : "text-ink"
                          }`}
                        >
                          {formatBRL(c.saldo)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {/* Contas manuais — dinheiro, VR, poupança de outro banco. */}
          {manuais.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line px-5 py-3">
                <p className="font-semibold text-ink">Contas manuais</p>
                <p className="text-xs text-slate">
                  Atualizadas pelos seus lançamentos, não por sincronização
                </p>
              </div>
              <ul className="divide-y divide-line">
                {manuais.map((c) => {
                  const negativo = (c.saldo ?? 0) < 0;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{c.nome}</p>
                        <p className="text-xs text-slate">
                          {TIPO_LABEL[c.tipo] ?? c.tipo}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={`font-num font-semibold ${
                            negativo ? "text-red-600" : "text-ink"
                          }`}
                        >
                          {formatBRL(c.saldo)}
                        </span>
                        <form action={arquivarContaManual}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            title="Arquivar conta (mantém o histórico)"
                            className="text-sm text-slate transition-colors hover:text-red-600"
                          >
                            Arquivar
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Criar conta manual — sempre disponível, inclusive sem nenhuma conta. */}
      <details className="mt-6 rounded-2xl border border-line bg-white p-5">
        <summary className="cursor-pointer font-medium text-ink">
          + Adicionar conta manual
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Para o que o Open Finance não traz: dinheiro na carteira, cartão de
          benefícios (VR/VA), conta de outro país. O saldo muda conforme os seus
          lançamentos.
        </p>
        <form action={criarContaManual} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Nome</span>
            <input
              type="text"
              name="nome"
              required
              maxLength={60}
              placeholder="Carteira"
              className="w-44 rounded-lg border border-line px-3 py-1.5 text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Tipo</span>
            <select
              name="tipo"
              defaultValue="outro"
              className="rounded-lg border border-line px-3 py-1.5 text-ink"
            >
              <option value="outro">Dinheiro / Outro</option>
              <option value="corrente">Conta corrente</option>
              <option value="poupanca">Poupança</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Saldo inicial</span>
            <input
              type="number"
              name="saldo"
              step="0.01"
              defaultValue="0"
              className="w-32 rounded-lg border border-line px-3 py-1.5 text-ink"
            />
          </label>
          <Button type="submit" size="sm">
            Criar conta
          </Button>
        </form>
      </details>
    </div>
  );
}
