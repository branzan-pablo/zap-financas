import { describe, expect, it } from "vitest";
import { calcularStreak, mensagemStreak } from "./streak";

const HOJE = new Date(2026, 6, 30); // 30 jul 2026

describe("calcularStreak", () => {
  it("sem registros devolve tudo zerado", () => {
    expect(calcularStreak([], HOJE)).toEqual({
      atual: 0,
      recorde: 0,
      registrouHoje: false,
      totalDias: 0,
    });
  });

  it("conta dias consecutivos terminando hoje", () => {
    const r = calcularStreak(["2026-07-28", "2026-07-29", "2026-07-30"], HOJE);
    expect(r.atual).toBe(3);
    expect(r.registrouHoje).toBe(true);
    expect(r.totalDias).toBe(3);
  });

  it("sequência continua viva se o último registro foi ONTEM", () => {
    const r = calcularStreak(["2026-07-28", "2026-07-29"], HOJE);
    expect(r.atual).toBe(2);
    expect(r.registrouHoje).toBe(false);
  });

  it("sequência é perdida se o último registro foi anteontem", () => {
    const r = calcularStreak(["2026-07-27", "2026-07-28"], HOJE);
    expect(r.atual).toBe(0);
    expect(r.recorde).toBe(2); // o histórico permanece
  });

  it("ignora duplicatas do mesmo dia", () => {
    const r = calcularStreak(
      ["2026-07-30", "2026-07-30", "2026-07-30", "2026-07-29"],
      HOJE
    );
    expect(r.atual).toBe(2);
    expect(r.totalDias).toBe(2);
  });

  it("guarda o recorde mesmo com a sequência atual menor", () => {
    const r = calcularStreak(
      // sequência antiga de 4 dias, e só hoje de novo
      ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-30"],
      HOJE
    );
    expect(r.atual).toBe(1);
    expect(r.recorde).toBe(4);
  });

  it("aceita timestamps completos (corta para o dia)", () => {
    const r = calcularStreak(["2026-07-30T22:10:00Z", "2026-07-29T03:00:00Z"], HOJE);
    expect(r.atual).toBe(2);
  });

  it("atravessa a virada de mês", () => {
    const r = calcularStreak(
      ["2026-06-29", "2026-06-30", "2026-07-01"],
      new Date(2026, 6, 1)
    );
    expect(r.atual).toBe(3);
  });
});

describe("mensagemStreak", () => {
  const base = { registrouHoje: true, totalDias: 10 };

  it("comemora só nos marcos", () => {
    expect(mensagemStreak({ ...base, atual: 3, recorde: 3 })).toContain("3 dias");
    expect(mensagemStreak({ ...base, atual: 7, recorde: 7 })).toContain("7 dias");
    // 4, 5, 6 não são marcos → silêncio (não vira spam)
    expect(mensagemStreak({ ...base, atual: 4, recorde: 7 })).toBeNull();
    expect(mensagemStreak({ ...base, atual: 6, recorde: 7 })).toBeNull();
  });

  it("destaca quando o marco também é recorde", () => {
    expect(mensagemStreak({ ...base, atual: 7, recorde: 7 })).toContain("recorde");
    expect(mensagemStreak({ ...base, atual: 7, recorde: 30 })).not.toContain("recorde");
  });

  it("sequência perdida não gera mensagem", () => {
    expect(mensagemStreak({ ...base, atual: 0, recorde: 30 })).toBeNull();
  });
});
