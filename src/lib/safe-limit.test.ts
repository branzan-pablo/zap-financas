import { describe, it, expect } from "vitest";
import { calcularLimiteSeguro, diasRestantesNoMes } from "./safe-limit";

describe("calcularLimiteSeguro", () => {
  it("calcula disponível e por dia", () => {
    // renda 5000, gasto 2000, comprometido 1000, 10 dias restantes
    const r = calcularLimiteSeguro(5000, 2000, 1000, 10);
    expect(r.disponivel).toBe(2000);
    expect(r.porDia).toBe(200);
    expect(r.status).toBe("folga");
  });

  it("status 'atencao' quando sobra pouco (< 15% da renda)", () => {
    const r = calcularLimiteSeguro(5000, 4500, 0, 5); // sobra 500 = 10% da renda
    expect(r.status).toBe("atencao");
  });

  it("status 'estouro' quando o disponível fica negativo", () => {
    const r = calcularLimiteSeguro(5000, 4000, 1500, 5); // -500
    expect(r.disponivel).toBe(-500);
    expect(r.status).toBe("estouro");
  });

  it("porDia cai para o disponível quando não há dias restantes", () => {
    const r = calcularLimiteSeguro(1000, 0, 0, 0);
    expect(r.porDia).toBe(1000);
  });
});

describe("diasRestantesNoMes", () => {
  it("conta inclusive o dia atual", () => {
    expect(diasRestantesNoMes(new Date(2026, 5, 25))).toBe(6); // 25..30 junho
  });

  it("último dia do mês conta 1", () => {
    expect(diasRestantesNoMes(new Date(2026, 5, 30))).toBe(1);
  });

  it("trata fevereiro corretamente", () => {
    expect(diasRestantesNoMes(new Date(2026, 1, 27))).toBe(2); // 27, 28
  });
});
