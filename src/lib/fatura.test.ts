import { describe, it, expect } from "vitest";
import { faturaAtual, type FaturaTransacao } from "./fatura";

// Cartão fecha dia 20, vence dia 28. Referência: 25/06/2026.
// Ciclo aberto: 21/06 .. 20/07 (fecha 20/07, vence 28/07).
const HOJE = new Date(2026, 5, 25); // 25 jun 2026

const txs: FaturaTransacao[] = [
  { valor: -100, data: "2026-06-22" }, // dentro do ciclo aberto
  { valor: -50, data: "2026-07-01" }, // dentro do ciclo aberto
  { valor: -30, data: "2026-06-19" }, // ciclo ANTERIOR (antes de 21/06)
  { valor: -200, data: "2026-07-25" }, // ciclo SEGUINTE (após 20/07)
  { valor: 80, data: "2026-06-23" }, // crédito/estorno — ignorado
];

describe("faturaAtual", () => {
  it("identifica o ciclo aberto e as datas de fechamento/vencimento", () => {
    const f = faturaAtual(txs, 20, 28, HOJE);
    expect(f.inicioCiclo).toBe("2026-06-21");
    expect(f.fechamento).toBe("2026-07-20");
    expect(f.vencimento).toBe("2026-07-28");
  });

  it("soma apenas compras (débitos) dentro do ciclo aberto", () => {
    const f = faturaAtual(txs, 20, 28, HOJE);
    // 100 + 50 = 150 (ignora ciclo anterior, seguinte e crédito)
    expect(f.total).toBe(150);
  });

  it("trata vencimento no mês seguinte quando diaVencimento <= diaFechamento", () => {
    // fecha dia 28, vence dia 5 (do mês seguinte ao fechamento)
    const f = faturaAtual([], 28, 5, new Date(2026, 5, 10));
    expect(f.fechamento).toBe("2026-06-28");
    expect(f.vencimento).toBe("2026-07-05");
  });

  it("quando hoje já passou do fechamento, abre o ciclo do mês seguinte", () => {
    // hoje 25/06, fecha dia 20 → já passou em junho, próximo fechamento 20/07
    const f = faturaAtual([], 20, 28, new Date(2026, 5, 25));
    expect(f.fechamento).toBe("2026-07-20");
  });

  it("grampeia o dia ao tamanho do mês (dia 31 em fevereiro)", () => {
    // fecha dia 31; em fevereiro/2026 (28 dias) deve cair em 28/02
    const f = faturaAtual([], 31, 10, new Date(2026, 1, 15)); // 15 fev
    expect(f.fechamento).toBe("2026-02-28");
  });

  it("fatura zerada quando não há compras no ciclo", () => {
    const f = faturaAtual([{ valor: -10, data: "2026-01-01" }], 20, 28, HOJE);
    expect(f.total).toBe(0);
  });
});
