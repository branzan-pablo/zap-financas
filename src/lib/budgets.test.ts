import { describe, expect, it } from "vitest";
import { orcamentosVigentes, statusOrcamentos } from "./budgets";

describe("orcamentosVigentes", () => {
  it("usa a linha mais recente <= mês pedido (carry-over entre meses)", () => {
    const rows = [
      { category_id: "cat1", limite: 500, mes_referencia: "2026-05-01" },
      { category_id: "cat1", limite: 800, mes_referencia: "2026-06-01" },
    ];
    // Julho não tem linha própria → vale a de junho.
    expect(orcamentosVigentes(rows, "2026-07").get("cat1")).toBe(800);
    // Em maio, vale a de maio.
    expect(orcamentosVigentes(rows, "2026-05").get("cat1")).toBe(500);
  });

  it("ignora linhas de meses futuros", () => {
    const rows = [{ category_id: "cat1", limite: 900, mes_referencia: "2026-09-01" }];
    expect(orcamentosVigentes(rows, "2026-07").size).toBe(0);
  });

  it("limite <= 0 desliga o orçamento da categoria", () => {
    const rows = [
      { category_id: "cat1", limite: 500, mes_referencia: "2026-05-01" },
      { category_id: "cat1", limite: 0, mes_referencia: "2026-06-01" },
    ];
    expect(orcamentosVigentes(rows, "2026-07").size).toBe(0);
  });

  it("ignora linhas sem categoria", () => {
    const rows = [{ category_id: null, limite: 500, mes_referencia: "2026-06-01" }];
    expect(orcamentosVigentes(rows, "2026-07").size).toBe(0);
  });
});

describe("statusOrcamentos", () => {
  const vigentes = new Map([
    ["cat1", 500],
    ["cat2", 200],
    ["cat3", 100],
  ]);
  const gastos = [
    { categoriaId: "cat1", nome: "Mercado", total: 300 }, // 60% → ok
    { categoriaId: "cat2", nome: "Lazer", total: 180 }, // 90% → atenção
    { categoriaId: "cat3", nome: "Transporte", total: 150 }, // 150% → estouro
  ];

  it("classifica ok / atenção (>=80%) / estouro (>100%) e ordena por gravidade", () => {
    const r = statusOrcamentos(vigentes, gastos);
    expect(r.map((o) => o.status)).toEqual(["estouro", "atencao", "ok"]);
    expect(r[0]).toMatchObject({ categoria: "Transporte", gasto: 150, limite: 100 });
    expect(r[1].pct).toBeCloseTo(0.9);
  });

  it("categoria orçada sem gasto no mês fica ok com gasto 0", () => {
    const r = statusOrcamentos(new Map([["cat9", 400]]), []);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ gasto: 0, status: "ok", pct: 0 });
  });

  it("gasto exatamente no limite (100%) é atenção, não estouro", () => {
    const r = statusOrcamentos(new Map([["cat1", 100]]), [
      { categoriaId: "cat1", nome: "Mercado", total: 100 },
    ]);
    expect(r[0].status).toBe("atencao");
  });
});
