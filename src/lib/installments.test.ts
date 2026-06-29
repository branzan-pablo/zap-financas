import { describe, it, expect } from "vitest";
import { mapaParcelas, type ParcelaInput } from "./installments";

// Compra de 10x R$100 cuja 1ª parcela foi em 2026-03.
const compra: ParcelaInput = {
  descricao: "Geladeira",
  valor_parcela: 100,
  total_parcelas: 10,
  parcela_atual: 4,
  primeira_parcela: "2026-03-15",
};

const REF = new Date(2026, 5, 1); // junho/2026

describe("mapaParcelas", () => {
  it("projeta apenas meses dentro da janela e a partir da referência", () => {
    const mapa = mapaParcelas([compra], REF, 12);
    // 1ª parcela em mar/26; parcelas caem mar..dez/26 (10 parcelas).
    // A partir de jun/26 sobram jun,jul,ago,set,out,nov,dez = 7 meses.
    expect(mapa.map((m) => m.mes)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });

  it("soma o valor das parcelas que caem em cada mês", () => {
    const mapa = mapaParcelas([compra, compra], REF, 12);
    // duas compras idênticas → R$200 por mês
    expect(mapa[0].total).toBe(200);
    expect(mapa[0].itens).toHaveLength(2);
  });

  it("respeita a janela de meses à frente", () => {
    const mapa = mapaParcelas([compra], REF, 3);
    expect(mapa.map((m) => m.mes)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("ignora parcelas já totalmente no passado", () => {
    const passada: ParcelaInput = {
      descricao: "Curso",
      valor_parcela: 50,
      total_parcelas: 3,
      parcela_atual: 3,
      primeira_parcela: "2026-01-10", // jan,fev,mar — tudo antes de jun
    };
    expect(mapaParcelas([passada], REF, 12)).toEqual([]);
  });

  it("rotula corretamente o número da parcela no mês", () => {
    const mapa = mapaParcelas([compra], REF, 12);
    // jun/26 é a 4ª parcela (mar=1, abr=2, mai=3, jun=4)
    expect(mapa[0].itens[0].parcela).toBe(4);
    expect(mapa[0].itens[0].total).toBe(10);
  });
});
