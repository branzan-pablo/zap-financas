import { describe, it, expect, vi, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { ativarAssinatura } from "./subscription";

/**
 * O foco aqui é o `periodo_fim`.
 *
 * O Mercado Pago devolve `next_payment_date` igual ao instante da criação
 * enquanto a assinatura está `pending` — verificado contra a API. Se ele
 * repetir isso na autorização, gravar esse valor cru significa nascer vencida:
 * a pessoa paga e o paywall bloqueia no segundo seguinte.
 */

const AGORA = new Date("2026-08-08T12:00:00.000Z");

/** Client mínimo que registra o que foi gravado em `subscriptions`. */
function dbFake() {
  const upserts: Record<string, unknown>[] = [];
  const db = {
    from(tabela: string) {
      if (tabela === "subscriptions") {
        return {
          upsert: (linha: Record<string, unknown>) => {
            upserts.push(linha);
            return Promise.resolve({ error: null });
          },
        };
      }
      // profiles.update(...).eq(...)
      return { update: () => ({ eq: () => Promise.resolve({ error: null }) }) };
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, upserts };
}

afterEach(() => vi.restoreAllMocks());

describe("ativarAssinatura — periodo_fim", () => {
  it("usa a data do provider quando ela é futura", async () => {
    const { db, upserts } = dbFake();
    await ativarAssinatura(db, "u1", "mensal", "pre-1", AGORA, "2026-09-08T12:00:00.000Z");

    expect(upserts[0].periodo_fim).toBe("2026-09-08T12:00:00.000Z");
  });

  it("ignora data no passado e cai no ciclo calculado", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db, upserts } = dbFake();
    // Exatamente o caso observado: next_payment_date == instante da criação.
    await ativarAssinatura(db, "u1", "mensal", "pre-1", AGORA, AGORA.toISOString());

    expect(upserts[0].periodo_fim).toBe("2026-09-08T12:00:00.000Z");
  });

  it("ignora data ilegível e cai no ciclo calculado", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db, upserts } = dbFake();
    await ativarAssinatura(db, "u1", "anual", "pre-1", AGORA, "nao-e-uma-data");

    expect(upserts[0].periodo_fim).toBe("2027-08-08T12:00:00.000Z");
  });

  it("avisa no log quando descarta a data do provider", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { db } = dbFake();
    await ativarAssinatura(db, "u1", "mensal", "pre-1", AGORA, AGORA.toISOString());

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("periodo_fim");
  });

  it("sem data do provider, calcula pelo plano", async () => {
    const { db, upserts } = dbFake();
    await ativarAssinatura(db, "u1", "trimestral", "pre-1", AGORA);

    expect(upserts[0].periodo_fim).toBe("2026-11-08T12:00:00.000Z");
    expect(upserts[0]).toMatchObject({ status: "ativo", mp_subscription_id: "pre-1" });
  });
});
