/**
 * Regra de acesso (gating de assinatura) — função PURA e testável.
 *
 * Decide se o usuário tem acesso às features pagas, combinando trial e estado
 * da assinatura. É a fonte única do gating (usada no layout autenticado e na UI).
 *
 * Ordem: assinatura vigente > carência de inadimplência > trial > bloqueado.
 */

export type AcessoInput = {
  trialEndsAt: string | null; // profiles.trial_ends_at
  status: string | null; // subscriptions.status
  periodoFim: string | null; // subscriptions.periodo_fim
};

export type MotivoAcesso =
  | "assinatura"
  | "inadimplente_carencia"
  | "trial"
  | "bloqueado";

export type Acesso = {
  liberado: boolean;
  motivo: MotivoAcesso;
  trialDiasRestantes: number | null;
};

/** Dias de carência após o vencimento antes de cortar o acesso (dunning). */
export const CARENCIA_DIAS = 3;

function diasAte(iso: string | null, hoje: Date): number | null {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - hoje.getTime()) / 86_400_000));
}

export function avaliarAcesso(input: AcessoInput, hoje: Date = new Date()): Acesso {
  const { trialEndsAt, status, periodoFim } = input;
  const fim = periodoFim ? new Date(periodoFim) : null;

  // Assinatura vigente (ativa, ou cancelada mas ainda dentro do período pago).
  if ((status === "ativo" || status === "cancelado") && fim && fim > hoje) {
    return { liberado: true, motivo: "assinatura", trialDiasRestantes: null };
  }

  // Inadimplente: mantém acesso por uma janela de carência após o vencimento.
  if (status === "inadimplente" && fim) {
    const limite = new Date(fim);
    limite.setDate(limite.getDate() + CARENCIA_DIAS);
    if (limite > hoje) {
      return { liberado: true, motivo: "inadimplente_carencia", trialDiasRestantes: null };
    }
  }

  // Trial.
  const dias = diasAte(trialEndsAt, hoje);
  if (dias !== null && dias > 0) {
    return { liberado: true, motivo: "trial", trialDiasRestantes: dias };
  }

  return { liberado: false, motivo: "bloqueado", trialDiasRestantes: dias };
}
