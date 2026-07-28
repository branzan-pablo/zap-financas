import { describe, expect, it } from "vitest";
import { mapearInterpretacao } from "./nlu";

describe("mapearInterpretacao", () => {
  it("mapeia consultas para as intenções correspondentes", () => {
    expect(mapearInterpretacao({ tipo: "consulta", alvo: "saldo" })).toEqual({
      tipo: "saldo",
    });
    expect(mapearInterpretacao({ tipo: "consulta", alvo: "fatura" })).toEqual({
      tipo: "fatura",
    });
    expect(mapearInterpretacao({ tipo: "consulta", alvo: "gastos" })).toEqual({
      tipo: "gastos",
    });
    expect(mapearInterpretacao({ tipo: "consulta", alvo: "ajuda" })).toEqual({
      tipo: "ajuda",
    });
  });

  it("um único gasto vira 'registrar' (mesmo caminho do regex)", () => {
    expect(
      mapearInterpretacao({
        tipo: "registrar",
        gastos: [{ valor: 50, descricao: "mercado" }],
      })
    ).toEqual({ tipo: "registrar", valor: 50, descricao: "mercado" });
  });

  it("múltiplos gastos viram 'registrar_lote'", () => {
    const r = mapearInterpretacao({
      tipo: "registrar",
      gastos: [
        { valor: 50, descricao: "mercado" },
        { valor: 30.5, descricao: "uber" },
      ],
    });
    expect(r).toEqual({
      tipo: "registrar_lote",
      itens: [
        { valor: 50, descricao: "mercado" },
        { valor: 30.5, descricao: "uber" },
      ],
    });
  });

  it("registrar sem gastos vira null (IA não extraiu nada útil)", () => {
    expect(mapearInterpretacao({ tipo: "registrar", gastos: [] })).toBeNull();
  });

  it("'nenhum' e null (IA indisponível) viram null", () => {
    expect(mapearInterpretacao({ tipo: "nenhum" })).toBeNull();
    expect(mapearInterpretacao(null)).toBeNull();
  });
});
