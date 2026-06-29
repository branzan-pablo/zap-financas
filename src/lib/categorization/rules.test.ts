import { describe, it, expect } from "vitest";
import { normalizar, categorizarPorRegras, type CategoriaRegra } from "./rules";

// Subconjunto representativo do seed (ordem = prioridade).
const CATEGORIAS: CategoriaRegra[] = [
  { id: "salario", nome: "Salário", regras: ["salario", "pagamento salario"] },
  { id: "mercado", nome: "Mercado", regras: ["supermercado", "carrefour", "pao de acucar"] },
  { id: "alimentacao", nome: "Alimentação", regras: ["ifood", "restaurante", "padaria"] },
  { id: "transporte", nome: "Transporte", regras: ["uber", "posto", "shell"] },
  { id: "assinaturas", nome: "Assinaturas", regras: ["netflix", "spotify"] },
  { id: "compras", nome: "Compras", regras: ["amazon", "magazine", "zara"] },
  { id: "outros", nome: "Outros", regras: [] },
];

describe("normalizar", () => {
  it("remove acentos e baixa a caixa", () => {
    expect(normalizar("Alimentação")).toBe("alimentacao");
    expect(normalizar("PÃO DE AÇÚCAR")).toBe("pao de acucar");
  });

  it("colapsa espaços", () => {
    expect(normalizar("  Posto   Shell  ")).toBe("posto shell");
  });
});

describe("categorizarPorRegras", () => {
  it("casa transações típicas do mock", () => {
    expect(categorizarPorRegras("iFood *Restaurante", CATEGORIAS)).toBe("alimentacao");
    expect(categorizarPorRegras("Uber *Trip", CATEGORIAS)).toBe("transporte");
    expect(categorizarPorRegras("Supermercado Pao de Acucar", CATEGORIAS)).toBe("mercado");
    expect(categorizarPorRegras("Netflix.com", CATEGORIAS)).toBe("assinaturas");
    expect(categorizarPorRegras("Pagamento Salario", CATEGORIAS)).toBe("salario");
    expect(categorizarPorRegras("Magazine Luiza - Geladeira 2/10", CATEGORIAS)).toBe("compras");
  });

  it("é insensível a acento e caixa", () => {
    expect(categorizarPorRegras("PADARIA São José", CATEGORIAS)).toBe("alimentacao");
  });

  it("respeita a prioridade da ordem (específica antes de genérica)", () => {
    // "carrefour" só está em Mercado; garante que não cai antes em outra.
    expect(categorizarPorRegras("Carrefour", CATEGORIAS)).toBe("mercado");
  });

  it("devolve null quando nada casa", () => {
    expect(categorizarPorRegras("Estabelecimento Desconhecido XYZ", CATEGORIAS)).toBeNull();
  });

  it("ignora categorias sem regras", () => {
    expect(categorizarPorRegras("qualquer coisa", [{ id: "x", nome: "X", regras: [] }])).toBeNull();
    expect(categorizarPorRegras("qualquer coisa", [{ id: "x", nome: "X", regras: null }])).toBeNull();
  });
});
