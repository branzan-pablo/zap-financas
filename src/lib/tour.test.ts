import { describe, expect, it } from "vitest";
import { PASSOS, filtrarPassos, type PassoTour } from "./tour";

/** Simula o DOM: só os alvos listados "existem". */
const comAlvos = (...alvos: string[]) => (alvo: string) => alvos.includes(alvo);

describe("filtrarPassos", () => {
  it("mantém passos centralizados mesmo sem nenhum alvo na tela", () => {
    const r = filtrarPassos(PASSOS, () => false);
    expect(r.every((p) => !p.alvo)).toBe(true);
    expect(r.map((p) => p.id)).toEqual(["boas-vindas", "whatsapp"]);
  });

  it("descarta passos cujo alvo não está na tela", () => {
    const r = filtrarPassos(PASSOS, comAlvos("nav"));
    expect(r.map((p) => p.id)).toEqual(["boas-vindas", "nav", "whatsapp"]);
  });

  it("dashboard VAZIA: sobra o essencial de ativação", () => {
    // Usuário recém-cadastrado: só existem a navegação e o CTA de conectar.
    const r = filtrarPassos(PASSOS, comAlvos("nav", "conectar"));
    expect(r.map((p) => p.id)).toEqual([
      "boas-vindas",
      "nav",
      "conectar",
      "whatsapp",
    ]);
    expect(r).toHaveLength(4);
  });

  it("dashboard CHEIA: mostra a leitura completa da tela", () => {
    const r = filtrarPassos(
      PASSOS,
      comAlvos("nav", "posso-gastar", "score", "alertas", "resumo")
    );
    expect(r.map((p) => p.id)).toEqual([
      "boas-vindas",
      "nav",
      "posso-gastar",
      "score",
      "alertas",
      "resumo",
      "whatsapp",
    ]);
    expect(r).toHaveLength(7);
  });

  it("sem alertas no mês, o passo de alertas some", () => {
    const r = filtrarPassos(
      PASSOS,
      comAlvos("nav", "posso-gastar", "score", "resumo")
    );
    expect(r.map((p) => p.id)).not.toContain("alertas");
    expect(r).toHaveLength(6);
  });

  it("preserva a ordem declarada", () => {
    const r = filtrarPassos(PASSOS, () => true);
    expect(r.map((p) => p.id)).toEqual(PASSOS.map((p) => p.id));
  });

  it("nunca devolve lista vazia (o tour sempre tem o que dizer)", () => {
    expect(filtrarPassos(PASSOS, () => false).length).toBeGreaterThan(0);
  });

  it("lista vazia entra, lista vazia sai", () => {
    expect(filtrarPassos([], () => true)).toEqual([]);
  });
});

describe("PASSOS", () => {
  it("todo passo tem id único", () => {
    const ids = PASSOS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo passo tem título, descrição e ícone", () => {
    for (const p of PASSOS) {
      expect(p.titulo.length).toBeGreaterThan(0);
      expect(p.descricao.length).toBeGreaterThan(0);
      expect(p.icone.length).toBeGreaterThan(0);
    }
  });

  it("começa por boas-vindas e termina no WhatsApp (o diferencial)", () => {
    expect(PASSOS[0].id).toBe("boas-vindas");
    const ultimo = PASSOS[PASSOS.length - 1];
    expect(ultimo.id).toBe("whatsapp");
    expect(ultimo.link?.href).toBe("/configuracoes/whatsapp");
  });

  it("passo ancorado declara um lado; centralizado não precisa", () => {
    for (const p of PASSOS as PassoTour[]) {
      if (p.alvo) expect(p.lado).toBeDefined();
    }
  });
});
