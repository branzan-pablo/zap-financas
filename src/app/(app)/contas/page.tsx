import { createClient } from "@/lib/supabase/server";
import { getOpenFinanceProvider } from "@/lib/openfinance";
import { ConnectModal } from "@/components/app/connect-modal";
import { PluggyConnectButton } from "@/components/app/pluggy-connect-button";
import { SyncButton } from "@/components/app/sync-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
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
      <PageHeader
        titulo="Contas"
        descricao="Conecte e gerencie suas contas bancárias via Open Finance."
        acao={
          modoPluggy ? (
            <PluggyConnectButton
              includeSandbox={process.env.PLUGGY_INCLUDE_SANDBOX !== "false"}
            />
          ) : (
            <ConnectModal institutions={institutions} />
          )
        }
      />

      {contas.length === 0 ? (
        <EmptyState
          icone="🏦"
          titulo="Nenhuma conta conectada"
          descricao={
            <>
              Conecte mais de 100 bancos via Open Finance e veja tudo em um só
              lugar. Use o botão{" "}
              <span className="font-medium text-ink">Conectar conta</span> — ou
              crie uma conta manual abaixo para dinheiro e VR.
            </>
          }
        />
      ) : (
        <div className="space-y-6">
          {[...grupos.entries()].map(([key, items]) => {
            const banco = items[0]?.banco ?? "Conexão";
            const ultimoSync = items.find((i) => i.ultimo_sync)?.ultimo_sync;
            return (
              <Card key={key} padding="none" className="overflow-hidden">
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
                            negativo ? "text-danger" : "text-ink"
                          }`}
                        >
                          {formatBRL(c.saldo)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}

          {/* Contas manuais — dinheiro, VR, poupança de outro banco. */}
          {manuais.length > 0 && (
            <Card padding="none" className="overflow-hidden">
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
                            negativo ? "text-danger" : "text-ink"
                          }`}
                        >
                          {formatBRL(c.saldo)}
                        </span>
                        <form action={arquivarContaManual}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            title="Arquivar conta (mantém o histórico)"
                            className="text-sm text-slate transition-colors hover:text-danger"
                          >
                            Arquivar
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Criar conta manual — sempre disponível, inclusive sem nenhuma conta. */}
      <Card render={<details />} className="mt-6">
        <summary className="cursor-pointer font-medium text-ink">
          + Adicionar conta manual
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Para o que o Open Finance não traz: dinheiro na carteira, cartão de
          benefícios (VR/VA), conta de outro país. O saldo muda conforme os seus
          lançamentos.
        </p>
        <form action={criarContaManual} className="mt-4 flex flex-wrap items-end gap-3">
          <Field id="conta-nome" label="Nome">
            <Input
              id="conta-nome"
              type="text"
              name="nome"
              required
              maxLength={60}
              autoComplete="off"
              placeholder="Carteira"
              className="w-44"
            />
          </Field>
          <Field id="conta-tipo" label="Tipo">
            <Select id="conta-tipo" name="tipo" defaultValue="outro">
              <option value="outro">Dinheiro / Outro</option>
              <option value="corrente">Conta corrente</option>
              <option value="poupanca">Poupança</option>
            </Select>
          </Field>
          <Field id="conta-saldo" label="Saldo inicial">
            <Input
              id="conta-saldo"
              type="number"
              name="saldo"
              step="0.01"
              inputMode="decimal"
              defaultValue="0"
              className="w-32 font-num"
            />
          </Field>
          <Button type="submit" size="sm">
            Criar conta
          </Button>
        </form>
      </Card>
    </div>
  );
}
