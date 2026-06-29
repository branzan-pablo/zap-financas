import { describe, it, expect } from "vitest";
import { interpretarMensagem } from "./intent";

describe("interpretarMensagem", () => {
  it("registra gasto com valor e descrição", () => {
    expect(interpretarMensagem("gastei 50 no mercado")).toEqual({
      tipo: "registrar",
      valor: 50,
      descricao: "mercado",
    });
  });

  it("entende valor com R$ e centavos", () => {
    expect(interpretarMensagem("paguei R$ 30,90 de luz")).toEqual({
      tipo: "registrar",
      valor: 30.9,
      descricao: "luz",
    });
  });

  it("entende separador de milhar", () => {
    const r = interpretarMensagem("gastei 1.500 em viagem");
    expect(r).toMatchObject({ tipo: "registrar", valor: 1500, descricao: "viagem" });
  });

  it("consulta saldo", () => {
    expect(interpretarMensagem("qual meu saldo?")).toEqual({ tipo: "saldo" });
  });

  it("consulta fatura", () => {
    expect(interpretarMensagem("como está a fatura?")).toEqual({ tipo: "fatura" });
  });

  it("consulta gastos do mês", () => {
    expect(interpretarMensagem("quanto gastei esse mês")).toEqual({ tipo: "gastos" });
  });

  it("pede ajuda / saudação", () => {
    expect(interpretarMensagem("oi")).toEqual({ tipo: "ajuda" });
    expect(interpretarMensagem("ajuda")).toEqual({ tipo: "ajuda" });
  });

  it("verbo de gasto sem valor não vira registro", () => {
    expect(interpretarMensagem("gastei muito").tipo).toBe("desconhecido");
  });

  it("mensagem fora dos padrões → desconhecido", () => {
    expect(interpretarMensagem("blá blá xyz")).toEqual({ tipo: "desconhecido" });
  });
});
