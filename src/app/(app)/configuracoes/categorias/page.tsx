import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
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
      <div className="mb-6">
        <Link href="/configuracoes" className="text-sm text-slate hover:text-ink">
          ← Configurações
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">Categorias</h1>
        <p className="mt-1 text-slate">
          Crie categorias suas e ensine o app a reconhecê-las: as palavras-chave
          são usadas na categorização automática, antes de recorrer à IA.
        </p>
      </div>

      {/* Minhas categorias */}
      <section className="mb-6">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Minhas categorias</h2>
        {minhas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-center text-sm leading-relaxed text-slate">
            Você ainda não criou categorias. Use o formulário abaixo — por exemplo
            <span className="font-medium text-ink"> Pets</span> com as palavras
            <span className="font-medium text-ink"> petz, ração, veterinário</span>.
          </p>
        ) : (
          <ul className="space-y-3">
            {minhas.map((c) => (
              <li key={c.id} className="rounded-2xl border border-line bg-white p-4">
                <form action={atualizarCategoria} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate">Ícone</span>
                    <input
                      type="text"
                      name="icone"
                      defaultValue={c.icone ?? ""}
                      maxLength={4}
                      aria-label={`Ícone de ${c.nome}`}
                      className="field w-16 text-center"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate">Nome</span>
                    <input
                      type="text"
                      name="nome"
                      required
                      maxLength={40}
                      defaultValue={c.nome}
                      className="field w-36"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate">Cor</span>
                    <input
                      type="color"
                      name="cor"
                      defaultValue={c.cor ?? "#64748b"}
                      aria-label={`Cor de ${c.nome}`}
                      className="h-9 w-12 rounded-lg border border-line bg-white p-1"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate">Tipo</span>
                    <select
                      name="tipo"
                      defaultValue={c.tipo}
                      className="field"
                    >
                      <option value="despesa">Despesa</option>
                      <option value="receita">Receita</option>
                      <option value="transferencia">Transferência</option>
                    </select>
                  </label>
                  <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
                    <span className="text-slate">Palavras-chave</span>
                    <input
                      type="text"
                      name="regras"
                      defaultValue={regrasTexto(c.regras)}
                      placeholder="petz, ração, veterinário"
                      className="field"
                    />
                  </label>
                  <Button variant="outline" size="sm" type="submit">
                    Salvar
                  </Button>
                </form>
                <form action={excluirCategoria} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    className="text-sm text-slate transition-colors hover:text-red-600"
                  >
                    Excluir categoria
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Criar */}
      <section className="mb-6 rounded-2xl border border-line bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Nova categoria</h2>
        <form action={criarCategoria} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Ícone</span>
            <input
              type="text"
              name="icone"
              maxLength={4}
              placeholder="🐶"
              className="field w-16 text-center"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Nome</span>
            <input
              type="text"
              name="nome"
              required
              maxLength={40}
              placeholder="Pets"
              className="field w-36"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Cor</span>
            <input
              type="color"
              name="cor"
              defaultValue="#64748b"
              aria-label="Cor da nova categoria"
              className="h-9 w-12 rounded-lg border border-line bg-white p-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate">Tipo</span>
            <select
              name="tipo"
              defaultValue="despesa"
              className="field"
            >
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
              <option value="transferencia">Transferência</option>
            </select>
          </label>
          <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
            <span className="text-slate">Palavras-chave</span>
            <input
              type="text"
              name="regras"
              placeholder="petz, ração, veterinário"
              className="field"
            />
          </label>
          <Button type="submit" size="sm">
            Criar
          </Button>
        </form>
      </section>

      {/* Globais (referência) */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-ink">
          Categorias padrão
        </h2>
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
