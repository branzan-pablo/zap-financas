import { describe, it, expect } from "vitest";
import {
  detectarAssinaturas,
  detectarDuplicatas,
  type TxInsight,
} from "./recurring";

describe("detectarAssinaturas", () => {
  it("detecta cobrança mensal de valor fixo em meses distintos", () => {
    const txs: TxInsight[] = [
      { descricao: "Netflix.com", valor: -44.9, data: "2026-04-12" },
      { descricao: "Netflix.com", valor: -44.9, data: "2026-05-12" },
      { descricao: "Netflix.com", valor: -44.9, data: "2026-06-12" },
    ];
    const a = detectarAssinaturas(txs);
    expect(a).toHaveLength(1);
    expect(a[0].descricao).toBe("Netflix.com");
    expect(a[0].valorMedio).toBe(44.9);
    expect(a[0].ocorrencias).toBe(3);
  });

  it("ignora compras avulsas (sem recorrência)", () => {
    const txs: TxInsight[] = [
      { descricao: "iFood", valor: -52, data: "2026-06-01" },
      { descricao: "Uber", valor: -19, data: "2026-06-02" },
    ];
    expect(detectarAssinaturas(txs)).toEqual([]);
  });

  it("ignora grupos com valor muito variável (não é assinatura)", () => {
    const txs: TxInsight[] = [
      { descricao: "Supermercado X", valor: -50, data: "2026-04-10" },
      { descricao: "Supermercado X", valor: -320, data: "2026-05-10" },
      { descricao: "Supermercado X", valor: -180, data: "2026-06-10" },
    ];
    expect(detectarAssinaturas(txs)).toEqual([]);
  });

  it("agrupa por descrição normalizada (acentos/caixa)", () => {
    const txs: TxInsight[] = [
      { descricao: "ACADEMIA Smart", valor: -99.9, data: "2026-05-05" },
      { descricao: "academia smart", valor: -99.9, data: "2026-06-05" },
    ];
    expect(detectarAssinaturas(txs)).toHaveLength(1);
  });

  it("ignora créditos", () => {
    const txs: TxInsight[] = [
      { descricao: "Salario", valor: 5000, data: "2026-05-05" },
      { descricao: "Salario", valor: 5000, data: "2026-06-05" },
    ];
    expect(detectarAssinaturas(txs)).toEqual([]);
  });
});

describe("detectarDuplicatas", () => {
  it("detecta mesma cobrança em dias próximos", () => {
    const txs: TxInsight[] = [
      { descricao: "Posto Shell", valor: -120, data: "2026-06-10" },
      { descricao: "Posto Shell", valor: -120, data: "2026-06-11" },
    ];
    const d = detectarDuplicatas(txs);
    expect(d).toHaveLength(1);
    expect(d[0].valor).toBe(120);
    expect(d[0].datas).toEqual(["2026-06-10", "2026-06-11"]);
  });

  it("não marca cobranças iguais distantes no tempo (recorrência normal)", () => {
    const txs: TxInsight[] = [
      { descricao: "Netflix", valor: -44.9, data: "2026-05-12" },
      { descricao: "Netflix", valor: -44.9, data: "2026-06-12" },
    ];
    expect(detectarDuplicatas(txs)).toEqual([]);
  });

  it("não marca valores diferentes do mesmo lugar", () => {
    const txs: TxInsight[] = [
      { descricao: "iFood", valor: -30, data: "2026-06-10" },
      { descricao: "iFood", valor: -55, data: "2026-06-11" },
    ];
    expect(detectarDuplicatas(txs)).toEqual([]);
  });
});
