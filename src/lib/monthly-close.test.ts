import { describe, expect, it } from "vitest";
import {
  fecharMes,
  mensagemFechamento,
  mesAFechar,
  mesAnterior,
  rotuloMes,
} from "./monthly-close";

const fmt = (v: number) => `R$ ${v.toFixed(2)}`;

const txs = [
  // Junho/2026 — mês a fechar
  { valor: 5000, data: "2026-06-05", descricao: "Salário", categoria: "Salário" },
  { valor: -1200, data: "2026-06-10", descricao: "Aluguel", categoria: "Casa" },
  { valor: -800, data: "2026-06-12", descricao: "Mercado Extra", categoria: "Mercado" },
  { valor: -200, data: "2026-06-15", descricao: "Uber", categoria: "Transporte" },
  // Maio/2026 — base de comparação (gastou 1000)
  { valor: -1000, data: "2026-05-08", descricao: "Mercado", categoria: "Mercado" },
];

describe("helpers de mês", () => {
  it("rotuloMes formata em pt-BR", () => {
    expect(rotuloMes("2026-06")).toBe("junho de 2026");
  });

  it("mesAnterior vira o ano em janeiro", () => {
    expect(mesAnterior("2026-01")).toBe("2025-12");
    expect(mesAnterior("2026-06")).toBe("2026-05");
  });

  it("mesAFechar devolve o mês anterior a hoje", () => {
    expect(mesAFechar(new Date(2026, 6, 1))).toBe("2026-06"); // 1º jul → fecha junho
    expect(mesAFechar(new Date(2026, 0, 1))).toBe("2025-12"); // 1º jan → fecha dezembro
  });
});

describe("fecharMes", () => {
  it("consolida entradas, saídas, saldo e taxa de poupança", () => {
    const f = fecharMes(txs, "2026-06");
    expect(f.entradas).toBe(5000);
    expect(f.saidas).toBe(2200);
    expect(f.saldo).toBe(2800);
    expect(f.taxaPoupanca).toBeCloseTo(0.56);
    expect(f.numTransacoes).toBe(4); // só as de junho
  });

  it("ranqueia as categorias de gasto com participação", () => {
    const f = fecharMes(txs, "2026-06");
    expect(f.topCategorias[0]).toMatchObject({ nome: "Casa", total: 1200 });
    expect(f.topCategorias[0].pct).toBeCloseTo(1200 / 2200, 2);
    expect(f.topCategorias.map((c) => c.nome)).toEqual([
      "Casa",
      "Mercado",
      "Transporte",
    ]);
  });

  it("acha o maior gasto (valor positivo na saída)", () => {
    expect(fecharMes(txs, "2026-06").maiorGasto).toEqual({
      descricao: "Aluguel",
      valor: 1200,
    });
  });

  it("compara os gastos com o mês anterior", () => {
    // junho 2200 vs maio 1000 → +120%
    expect(fecharMes(txs, "2026-06").variacaoGastoPct).toBeCloseTo(1.2);
  });

  it("sem mês anterior, variação é null", () => {
    expect(fecharMes(txs, "2026-05").variacaoGastoPct).toBeNull();
  });

  it("mês vazio devolve zeros sem quebrar", () => {
    const f = fecharMes([], "2026-06");
    expect(f).toMatchObject({
      entradas: 0,
      saidas: 0,
      saldo: 0,
      taxaPoupanca: 0,
      numTransacoes: 0,
      maiorGasto: null,
      variacaoGastoPct: null,
    });
    expect(f.topCategorias).toEqual([]);
  });

  it("gasto sem categoria cai em Outros", () => {
    const f = fecharMes(
      [{ valor: -50, data: "2026-06-01", descricao: "?", categoria: null }],
      "2026-06"
    );
    expect(f.topCategorias[0].nome).toBe("Outros");
  });
});

describe("mensagemFechamento", () => {
  it("mês positivo destaca o que sobrou e as categorias", () => {
    const m = mensagemFechamento(fecharMes(txs, "2026-06"), fmt);
    expect(m).toContain("Fechamento de junho de 2026");
    expect(m).toContain("Sobrou");
    expect(m).toContain("56% da sua renda");
    expect(m).toContain("Casa");
    expect(m).toContain("Aluguel");
    expect(m).toContain("120% mais");
  });

  it("mês negativo avisa que faltou", () => {
    const m = mensagemFechamento(
      fecharMes(
        [
          { valor: 100, data: "2026-06-01", descricao: "Freela", categoria: "Receita" },
          { valor: -300, data: "2026-06-02", descricao: "Conta", categoria: "Casa" },
        ],
        "2026-06"
      ),
      fmt
    );
    expect(m).toContain("Faltou");
    expect(m).toContain("gastou mais do que entrou");
  });

  it("mês sem movimentação avisa e não inventa números", () => {
    const m = mensagemFechamento(fecharMes([], "2026-06"), fmt);
    expect(m).toContain("Não encontrei movimentações");
    expect(m).not.toContain("Entrou");
  });
});
