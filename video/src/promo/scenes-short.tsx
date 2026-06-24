import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, MONO, fmt } from "./theme";
import { Bubble, PhoneFrame } from "./components";
import {
  Kinetic,
  Reveal,
  VGridDark,
  VParticles,
  VScene,
  glass,
  useCountUp,
} from "./scenes-vertical";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SP = { damping: 14, stiffness: 120, mass: 0.9 } as const;

/* Cena 1 — pergunta-gancho */
export const S1Hook: React.FC = () => (
  <VScene duration={90}>
    <h1 style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>
      <Kinetic
        text="Você sabe quanto já comprometeu no cartão pros próximos 3 meses?"
        delay={4}
        step={4}
        highlight={["3", "meses"]}
      />
    </h1>
  </VScene>
);

/* Cena 2 — reveal do telefone + fatura projetada */
export const S2Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: SP });
  const ty = interpolate(sp, [0, 1], [900, 0]);
  const rotX = interpolate(sp, [0, 1], [20, 0]);
  const moBlur = interpolate(frame, [0, 18], [12, 0], clamp);
  const val = useCountUp(2180, 44);
  const flash = interpolate(frame, [66, 82], [1, 0], clamp);
  const cardSp = spring({ frame: frame - 42, fps, config: SP });
  const cardY = interpolate(cardSp, [0, 1], [140, 0]);
  return (
    <VScene duration={120}>
      <div style={{ perspective: 1600, filter: `blur(${moBlur}px)` }}>
        <div style={{ transform: `translateY(${ty}px) rotateX(${rotX}deg)`, transformStyle: "preserve-3d" }}>
          <PhoneFrame height={1320}>
            <div style={{ position: "absolute", inset: 0, padding: "26px 20px" }}>
              <Bubble side="out" style={{ fontSize: 26, padding: "14px 20px", opacity: 0.45 }}>
                comprei uma TV em 10x de 300
              </Bubble>
            </div>
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: 20,
                ...glass,
                borderRadius: 28,
                padding: 30,
                textAlign: "left",
                transform: `translateY(${cardY}px)`,
                opacity: cardSp,
                boxShadow: `0 30px 70px -30px rgba(17,24,39,.3), 0 0 ${flash * 55}px ${C.green}${flash > 0.02 ? "55" : "00"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>
                  Fatura projetada
                </span>
                <span style={{ background: C.amberChip, color: C.amber, fontSize: 20, fontWeight: 700, padding: "8px 14px", borderRadius: 999, transform: `scale(${1 + Math.sin(frame / 12) * 0.04})` }}>
                  fecha em 4 dias
                </span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 92, fontWeight: 800, marginTop: 8 }}>R$ {fmt(val)}</div>
              <div style={{ fontSize: 24, color: C.muted }}>vs. R$ 1.990 no mês passado</div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </VScene>
  );
};

/* Cena 3 — CTA */
export const S3Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const rot = interpolate(sp, [0, 1], [-180, 0]);
  const moBlur = interpolate(frame, [0, 16], [10, 0], clamp);
  const t = (Math.sin(frame / 14) + 1) / 2;
  return (
    <VScene duration={90} dark back={<><VGridDark /><VParticles n={16} color="#1FA855" /></>}>
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 38,
          background: C.green,
          color: "#fff",
          fontSize: 88,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `rotate(${rot}deg) scale(${sp})`,
          filter: `blur(${moBlur}px)`,
          boxShadow: `0 0 ${40 + t * 30}px ${C.green}88`,
        }}
      >
        Z
      </div>
      <Reveal delay={14}>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: "#fff", marginTop: 48, textShadow: `0 0 ${16 + t * 22}px ${C.green}cc`, transform: `scale(${1 + t * 0.02})` }}>
          Lista de espera no link da bio
        </h1>
      </Reveal>
      <Reveal delay={26}>
        <div style={{ marginTop: 30, fontFamily: MONO, fontSize: 32, color: "#E5E7EB", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 16, padding: "18px 34px" }}>
          zapfinancas.app
        </div>
      </Reveal>
    </VScene>
  );
};
