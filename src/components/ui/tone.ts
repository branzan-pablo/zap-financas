/**
 * Tom de status — a fonte única de "que cor tem esta situação".
 *
 * Antes desta tabela, cada tela mantinha o seu próprio mapa (SCORE_UI, STATUS_UI,
 * ALERTA_UI no dashboard, BARRA nos orçamentos...) e eles divergiam: o mesmo
 * "atenção" aparecia como #9a6a00 numa tela e #d99a00 noutra. Agora existe um
 * lugar só, e ele fala em tokens — nunca em hex.
 *
 * A separação texto/barra é deliberada: texto precisa passar AA sobre superfície
 * clara (por isso `--amber-ink`, escuro), barra não é texto e pode ser mais viva
 * (por isso `--amber-bar`).
 */
export type Tone = "ok" | "atencao" | "estouro" | "neutro";

type ToneClasses = {
  /** Cor de texto e de números. */
  texto: string;
  /** Superfície do cartão/pill. */
  fundo: string;
  /** Borda da superfície. */
  borda: string;
  /** Preenchimento de barra de progresso. */
  barra: string;
};

export const TONE: Record<Tone, ToneClasses> = {
  ok: {
    texto: "text-emerald",
    fundo: "bg-emerald-soft",
    borda: "border-emerald/30",
    barra: "bg-emerald",
  },
  atencao: {
    texto: "text-amber-ink",
    fundo: "bg-amber-soft",
    borda: "border-amber/40",
    barra: "bg-amber-bar",
  },
  estouro: {
    texto: "text-danger",
    fundo: "bg-danger-soft",
    borda: "border-danger-line",
    barra: "bg-danger",
  },
  neutro: {
    texto: "text-ink",
    fundo: "bg-white",
    borda: "border-line",
    barra: "bg-slate",
  },
};
