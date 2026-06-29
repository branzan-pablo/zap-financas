import { createClient } from "@/lib/supabase/server";
import { getOpenFinanceProvider } from "@/lib/openfinance";
import { ConnectModal } from "@/components/app/connect-modal";
import { SyncButton } from "@/components/app/sync-button";
import { formatBRL, formatData } from "@/lib/format";

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

  const institutions = await getOpenFinanceProvider().listInstitutions();

  // Agrupa contas por item (uma conexão Pluggy pode ter várias contas).
  const grupos = new Map<string, Conta[]>();
  for (const c of contas) {
    const key = c.pluggy_item_id ?? c.id;
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
        <ConnectModal institutions={institutions} />
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
            <span className="font-medium text-ink">Conectar conta</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...grupos.entries()].map(([key, items]) => {
            const banco = items[0]?.banco ?? "Conexão";
            const ultimoSync = items.find((i) => i.ultimo_sync)?.ultimo_sync;
            const isItem = items[0]?.pluggy_item_id != null;
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
                  {isItem && key && <SyncButton itemId={key} />}
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
        </div>
      )}
    </div>
  );
}
