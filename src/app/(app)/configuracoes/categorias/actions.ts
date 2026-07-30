"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Functions das categorias personalizadas (Fase 6 P2).
 *
 * As policies de RLS de `categories` já permitem ler globais + próprias e
 * escrever apenas as próprias — então o usuário nunca consegue editar ou apagar
 * uma categoria global (seed), mesmo forçando o POST.
 *
 * Excluir uma categoria não apaga transações: a FK é ON DELETE SET NULL, então
 * os lançamentos apenas voltam a ficar "sem categoria".
 */

const TIPOS = ["despesa", "receita", "transferencia"] as const;
const HEX = /^#[0-9a-fA-F]{6}$/;

/** "ifood, uber eats , mercado" → ["ifood","uber eats","mercado"] */
function parseRegras(bruto: string): string[] {
  return bruto
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20)
    .map((r) => r.slice(0, 40));
}

type Campos = {
  nome: string;
  icone: string | null;
  cor: string;
  tipo: string;
  regras: string[];
};

function extrair(formData: FormData): Campos | null {
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 40);
  if (!nome) return null;

  const iconeBruto = String(formData.get("icone") ?? "").trim();
  // Emojis podem ter vários code points; limitamos por segurança sem cortar no meio.
  const icone = iconeBruto ? [...iconeBruto].slice(0, 2).join("") : null;

  const corBruta = String(formData.get("cor") ?? "").trim();
  const cor = HEX.test(corBruta) ? corBruta : "#64748b";

  const tipoBruto = String(formData.get("tipo") ?? "despesa");
  const tipo = (TIPOS as readonly string[]).includes(tipoBruto) ? tipoBruto : "despesa";

  return { nome, icone, cor, tipo, regras: parseRegras(String(formData.get("regras") ?? "")) };
}

function revalidar() {
  revalidatePath("/configuracoes/categorias");
  revalidatePath("/transacoes");
  revalidatePath("/orcamentos");
  revalidatePath("/dashboard");
}

export async function criarCategoria(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const campos = extrair(formData);
  if (!campos) return;

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    nome: campos.nome,
    icone: campos.icone,
    cor: campos.cor,
    tipo: campos.tipo,
    regras: campos.regras,
  });
  if (error) throw new Error(`Falha ao criar categoria: ${error.message}`);

  revalidar();
}

export async function atualizarCategoria(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const campos = extrair(formData);
  if (!id || !campos) return;

  // `.eq("user_id", user.id)` é redundante com a RLS, mas deixa a intenção
  // explícita: categoria global (user_id null) nunca é alcançada aqui.
  const { error } = await supabase
    .from("categories")
    .update({
      nome: campos.nome,
      icone: campos.icone,
      cor: campos.cor,
      tipo: campos.tipo,
      regras: campos.regras,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(`Falha ao atualizar categoria: ${error.message}`);

  revalidar();
}

export async function excluirCategoria(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(`Falha ao excluir categoria: ${error.message}`);

  revalidar();
}
