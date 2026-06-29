import { describe, it, expect } from "vitest";
import { gerarAlertas } from "./alerts";

const fmt = (v: number) => `R$ ${v.toFixed(2)}`;
const HOJE = new Date(2026, 5, 25); // 25 jun 2026

const base = {
  faturas: [],
  limiteStatus: "folga" as const,
  limiteDisponivel: 2000,
  duplicatas: [],
  hoje: HOJE,
  fmt,
};

describe("gerarAlertas", () => {
  it("sem problemas → nenhum alerta", () => {
    expect(gerarAlertas(base)).toEqual([]);
  });

  it("limite estourado gera alerta crítico", () => {
    const a = gerarAlertas({ ...base, limiteStatus: "estouro", limiteDisponivel: -300 });
    expect(a).toHaveLength(1);
    expect(a[0].severidade).toBe("critico");
    expect(a[0].tipo).toBe("limite_estouro");
  });

  it("limite em atenção gera alerta de atenção", () => {
    const a = gerarAlertas({ ...base, limiteStatus: "atencao", limiteDisponivel: 150 });
    expect(a[0].tipo).toBe("limite_atencao");
    expect(a[0].severidade).toBe("atencao");
  });

  it("fatura fechando dentro da janela gera alerta", () => {
    const a = gerarAlertas({
      ...base,
      faturas: [{ nome: "Nubank", fechamento: "2026-06-27", total: 1200 }], // 2 dias
    });
    expect(a).toHaveLength(1);
    expect(a[0].tipo).toBe("fatura_fechando");
    expect(a[0].titulo).toContain("2 dias");
  });

  it("não alerta fatura que fecha além da janela", () => {
    const a = gerarAlertas({
      ...base,
      faturas: [{ nome: "Itaú", fechamento: "2026-07-10", total: 800 }],
    });
    expect(a).toEqual([]);
  });

  it("não alerta fatura fechando com total zero", () => {
    const a = gerarAlertas({
      ...base,
      faturas: [{ nome: "Inter", fechamento: "2026-06-26", total: 0 }],
    });
    expect(a).toEqual([]);
  });

  it("duplicata gera alerta", () => {
    const a = gerarAlertas({
      ...base,
      duplicatas: [{ descricao: "Posto Shell", valor: 120 }],
    });
    expect(a[0].tipo).toBe("cobranca_duplicada");
  });

  it("ordena por severidade (crítico primeiro)", () => {
    const a = gerarAlertas({
      ...base,
      limiteStatus: "estouro",
      limiteDisponivel: -100,
      duplicatas: [{ descricao: "X", valor: 50 }],
    });
    expect(a[0].severidade).toBe("critico");
    expect(a[1].severidade).toBe("atencao");
  });
});
