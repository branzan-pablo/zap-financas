import { describe, it, expect } from "vitest";
import { agruparAlertas, gerarAlertas } from "./alerts";

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

  it("orçamento estourado gera alerta crítico; em atenção gera atenção", () => {
    const a = gerarAlertas({
      ...base,
      orcamentos: [
        { categoria: "Transporte", limite: 100, gasto: 150, status: "estouro" },
        { categoria: "Lazer", limite: 200, gasto: 180, status: "atencao" },
        { categoria: "Mercado", limite: 500, gasto: 100, status: "ok" },
      ],
    });
    expect(a).toHaveLength(2);
    expect(a[0]).toMatchObject({ tipo: "orcamento_estouro", severidade: "critico" });
    expect(a[0].titulo).toContain("Transporte");
    expect(a[1]).toMatchObject({ tipo: "orcamento_atencao", severidade: "atencao" });
    expect(a[1].titulo).toContain("Lazer");
  });

  it("agruparAlertas colapsa repetidos do mesmo tipo, preservando o conteúdo", () => {
    const a = gerarAlertas({
      ...base,
      duplicatas: [
        { descricao: "Netflix", valor: 44.9 },
        { descricao: "Spotify", valor: 21.9 },
        { descricao: "Amazon Prime", valor: 14.9 },
      ],
    });
    expect(a).toHaveLength(3);

    const g = agruparAlertas(a);
    expect(g).toHaveLength(1);
    expect(g[0].titulo).toBe("3 possíveis cobranças duplicadas");
    // nenhuma informação some ao agrupar
    for (const nome of ["Netflix", "Spotify", "Amazon Prime"]) {
      expect(g[0].detalhe).toContain(nome);
    }
  });

  it("agruparAlertas não altera alerta único nem mistura tipos", () => {
    const a = gerarAlertas({
      ...base,
      limiteStatus: "estouro",
      limiteDisponivel: -300,
      duplicatas: [{ descricao: "Netflix", valor: 44.9 }],
    });
    const g = agruparAlertas(a);
    expect(g).toHaveLength(2);
    expect(g).toEqual(a); // um de cada tipo → nada a agrupar
    expect(g[0].severidade).toBe("critico"); // ordem de gravidade preservada
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
