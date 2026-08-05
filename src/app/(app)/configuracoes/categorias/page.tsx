import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
} from "./actions";

/**
 * Categorias personalizadas (Fase 6 P2).
 *
 * As globais (seed, `user_id` null) são só leitura — servem de base para todos.
 * As do usuário podem ser criadas, editadas e excluídas; as *regras* são as
 * palavras-chave usadas na categorização automática (regras determinísticas
 * antes da IA, mesma política do sync).
 */

type Cat = {
  id: string;
  user_id: string | null;
  nome: string;
  icone: string | null;
  cor: string | null;
  tipo: string;
  regras: unknown;
};

const TIPO_LABEL: Record<string, string> = {
  despesa: "Despesa",
  receita: "Receita",
  transferencia: "Transferência",
};

function regrasTexto(regras: unknown): string {
  return Array.isArray(regras) ? (regras as string[]).join(", ") : "";
}

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, user_id, nome, icone, cor, tipo, regras")
    .order("nome", { ascending: true });

  const todas = (data ?? []) as Cat[];
  const minhas = todas.filter((c) => c.user_id !== null);
  const globais = todas.filter((c) => c.user_id === null);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        voltar={{ href: "/configuracoes", label: "Configurações" }}
        titulo="Categorias"
        descricao="Crie categorias suas e ensine o app a reconhecê-las: as palavras-chave são usadas na categorização automática, antes de recorrer à IA."
      />

      {/* Minhas categorias */}
      <section className="mb-6">
        <CardTitle className="mb-3">Minhas categorias</CardTitle>
        {minhas.length === 0 ? (
          <EmptyState
            size="sm"
            descricao={
              <>
                Você ainda não criou categorias. Use o formulário abaixo — por
                exemplo<span className="font-medium text-ink"> Pets</span> com as
                palavras
                <span className="font-medium text-ink"> petz, ração, veterinário</span>.
              </>
            }
          />
        ) : (
          <ul className="space-y-3">
            {minhas.map((c) => (
              <Card key={c.id} padding="sm" render={<li />}>
                <form action={atualizarCategoria} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={c.id} />
                  <Field id={`cat-${c.id}-icone`} label="Ícone">
                    <Input
                      id={`cat-${c.id}-icone`}
                      type="text"
                      name="icone"
                      defaultValue={c.icone ?? ""}
                      maxLength={4}
                      aria-label={`Ícone de ${c.nome}`}
                      className="w-16 text-center"
                    />
                  </Field>
                  <Field id={`cat-${c.id}-nome`} label="Nome">
                    <Input
                      id={`cat-${c.id}-nome`}
                      type="text"
                      name="nome"
                      required
                      maxLength={40}
                      defaultValue={c.nome}
                      className="w-36"
                    />
                  </Field>
                  <Field id={`cat-${c.id}-cor`} label="Cor">
                    <input
                      id={`cat-${c.id}-cor`}
                      type="color"
                      name="cor"
                      defaultValue={c.cor ?? "#64748b"}
                      aria-label={`Cor de ${c.nome}`}
                      className="h-11 w-12 rounded-lg border border-line bg-white p-1 md:h-9"
                    />
                  </Field>
                  <Field id={`cat-${c.id}-tipo`} label="Tipo">
                    <Select id={`cat-${c.id}-tipo`} name="tipo" defaultValue={c.tipo}>
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                      <option value="transferencia">Transferência</option>
                    </Select>
                  </Field>
                  <Field
                    id={`cat-${c.id}-regras`}
                    label="Palavras-chave"
                    className="min-w-48 flex-1"
                  >
                    <Input
                      id={`cat-${c.id}-regras`}
                      type="text"
                      name="regras"
                      defaultValue={regrasTexto(c.regras)}
                      placeholder="petz, ração, veterinário"
                    />
                  </Field>
                  <Button variant="outline" size="sm" type="submit">
                    Salvar
                  </Button>
                </form>
                <form action={excluirCategoria} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-sm text-slate transition-colors hover:text-danger"
                  >
                    Excluir categoria
                  </button>
                </form>
              </Card>
            ))}
          </ul>
        )}
      </section>

      {/* Criar */}
      <Card render={<section />} className="mb-6">
        <CardTitle>Nova categoria</CardTitle>
        <form action={criarCategoria} className="mt-4 flex flex-wrap items-end gap-3">
          <Field id="nova-icone" label="Ícone">
            <Input
              id="nova-icone"
              type="text"
              name="icone"
              maxLength={4}
              placeholder="🐶"
              className="w-16 text-center"
            />
          </Field>
          <Field id="nova-nome" label="Nome">
            <Input
              id="nova-nome"
              type="text"
              name="nome"
              required
              maxLength={40}
              autoComplete="off"
              placeholder="Pets"
              className="w-36"
            />
          </Field>
          <Field id="nova-cor" label="Cor">
            <input
              id="nova-cor"
              type="color"
              name="cor"
              defaultValue="#64748b"
              aria-label="Cor da nova categoria"
              className="h-11 w-12 rounded-lg border border-line bg-white p-1 md:h-9"
            />
          </Field>
          <Field id="nova-tipo" label="Tipo">
            <Select id="nova-tipo" name="tipo" defaultValue="despesa">
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
              <option value="transferencia">Transferência</option>
            </Select>
          </Field>
          <Field id="nova-regras" label="Palavras-chave" className="min-w-48 flex-1">
            <Input
              id="nova-regras"
              type="text"
              name="regras"
              placeholder="petz, ração, veterinário"
            />
          </Field>
          <Button type="submit" size="sm">
            Criar
          </Button>
        </form>
      </Card>

      {/* Globais (referência) */}
      <section>
        <CardTitle className="mb-3">Categorias padrão</CardTitle>
        <p className="mb-3 text-sm text-slate">
          Já vêm prontas para todos e não podem ser alteradas.
        </p>
        <ul className="flex flex-wrap gap-2">
          {globais.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm text-ink"
              title={TIPO_LABEL[c.tipo] ?? c.tipo}
            >
              <span aria-hidden>{c.icone ?? "📌"}</span>
              {c.nome}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
