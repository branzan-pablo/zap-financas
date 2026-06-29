import { describe, it, expect } from "vitest";
import { MockOpenFinanceProvider } from "./mock-provider";

const provider = new MockOpenFinanceProvider();

describe("MockOpenFinanceProvider", () => {
  it("lista instituições com cor e tipo", async () => {
    const insts = await provider.listInstitutions();
    expect(insts.length).toBeGreaterThan(0);
    for (const i of insts) {
      expect(i.id).toBeTruthy();
      expect(i.cor).toMatch(/^#/);
    }
  });

  it("createItem é estável por instituição (reconectar não muda o itemId)", async () => {
    const a = await provider.createItem("nubank");
    const b = await provider.createItem("nubank");
    expect(a.itemId).toBe(b.itemId);
    expect(a.itemId).toBe("mock-item-nubank");
  });

  it("gera contas determinísticas para o mesmo itemId", async () => {
    const a = await provider.fetchAccounts("mock-item-itau");
    const b = await provider.fetchAccounts("mock-item-itau");
    expect(a).toEqual(b); // saldos e ids idênticos
    expect(a.some((c) => c.tipo === "corrente")).toBe(true);
    expect(a.some((c) => c.tipo === "cartao")).toBe(true);
  });

  it("instituição de investimento gera conta e posições", async () => {
    const contas = await provider.fetchAccounts("mock-item-xp");
    expect(contas).toHaveLength(1);
    expect(contas[0].tipo).toBe("investimento");

    const invs = await provider.fetchInvestments("mock-item-xp");
    expect(invs.length).toBeGreaterThan(0);
    expect(invs[0].valorAtual).toBeGreaterThan(0);
  });

  it("transações são determinísticas e idempotentes (mesmos transactionId)", async () => {
    const a = await provider.fetchTransactions("mock-item-nubank");
    const b = await provider.fetchTransactions("mock-item-nubank");

    expect(a.length).toBeGreaterThan(0);
    expect(a).toEqual(b);

    // O conjunto de ids é único → o upsert por pluggy_tx_id nunca duplica.
    const ids = a.map((t) => t.transactionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("inclui salário (crédito) e ao menos uma compra parcelada", async () => {
    const txs = await provider.fetchTransactions("mock-item-bradesco");
    expect(txs.some((t) => t.tipo === "credito" && t.valor > 0)).toBe(true);
    expect(txs.some((t) => t.parcela && t.parcela.total > 1)).toBe(true);
  });

  it("filtro `since` remove transações anteriores à data", async () => {
    const todas = await provider.fetchTransactions("mock-item-nubank");
    const corte = todas[Math.floor(todas.length / 2)].data;
    const filtradas = await provider.fetchTransactions("mock-item-nubank", corte);
    expect(filtradas.every((t) => t.data >= corte)).toBe(true);
    expect(filtradas.length).toBeLessThanOrEqual(todas.length);
  });
});
