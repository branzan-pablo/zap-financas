import { describe, it, expect } from "vitest";
import { avaliarAcesso } from "./access";

const HOJE = new Date(2026, 5, 29); // 29 jun 2026
const futuro = (dias: number) =>
  new Date(HOJE.getTime() + dias * 86_400_000).toISOString();
const passado = (dias: number) =>
  new Date(HOJE.getTime() - dias * 86_400_000).toISOString();

describe("avaliarAcesso", () => {
  it("trial vigente libera", () => {
    const a = avaliarAcesso({ trialEndsAt: futuro(5), status: null, periodoFim: null }, HOJE);
    expect(a).toEqual({ liberado: true, motivo: "trial", trialDiasRestantes: 5 });
  });

  it("trial expirado sem assinatura bloqueia", () => {
    const a = avaliarAcesso({ trialEndsAt: passado(1), status: null, periodoFim: null }, HOJE);
    expect(a.liberado).toBe(false);
    expect(a.motivo).toBe("bloqueado");
  });

  it("assinatura ativa vigente libera (mesmo com trial expirado)", () => {
    const a = avaliarAcesso(
      { trialEndsAt: passado(10), status: "ativo", periodoFim: futuro(20) },
      HOJE
    );
    expect(a).toMatchObject({ liberado: true, motivo: "assinatura" });
  });

  it("assinatura ativa vencida bloqueia", () => {
    const a = avaliarAcesso(
      { trialEndsAt: passado(40), status: "ativo", periodoFim: passado(1) },
      HOJE
    );
    expect(a.liberado).toBe(false);
  });

  it("cancelada mantém acesso até o fim do período pago", () => {
    const a = avaliarAcesso(
      { trialEndsAt: passado(40), status: "cancelado", periodoFim: futuro(10) },
      HOJE
    );
    expect(a).toMatchObject({ liberado: true, motivo: "assinatura" });
  });

  it("inadimplente dentro da carência libera", () => {
    const a = avaliarAcesso(
      { trialEndsAt: passado(40), status: "inadimplente", periodoFim: passado(2) },
      HOJE
    );
    expect(a).toMatchObject({ liberado: true, motivo: "inadimplente_carencia" });
  });

  it("inadimplente além da carência bloqueia", () => {
    const a = avaliarAcesso(
      { trialEndsAt: passado(40), status: "inadimplente", periodoFim: passado(5) },
      HOJE
    );
    expect(a.liberado).toBe(false);
  });
});
