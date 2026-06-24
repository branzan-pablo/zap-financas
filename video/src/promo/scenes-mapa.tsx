import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, MONO, SANS, fmt } from "./theme";
import { Bubble, PhoneFrame } from "./components";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// Mola com overshoot (easing principal do vídeo).
const OVER = { damping: 14, stiffness: 120, mass: 0.9 } as const;

// Margens seguras p/ UI das plataformas (TikTok/Reels).
const SAFE_TOP = 200;
const SAFE_BOTTOM = 250;

/* ============================================================
   VFX primitives
   ============================================================ */

// Gradient mesh animado (blobs verdes derivando devagar).
const MeshBG: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const g = dark ? "#1FA855" : "#15803D";
  const blobs = [
    { x: 0.18, y: 0.2, r: 820, o: dark ? 0.22 : 0.11, sx: 0.7, sy: 0.5 },
    { x: 0.85, y: 0.42, r: 700, o: dark ? 0.18 : 0.08, sx: -0.6, sy: 0.8 },
    { x: 0.5, y: 0.84, r: 780, o: dark ? 0.2 : 0.1, sx: 0.5, sy: -0.6 },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const dx = Math.sin(frame / 90 + i) * 80 * b.sx;
        const dy = Math.cos(frame / 110 + i) * 80 * b.sy;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x * 100}%`,
              top: `${b.y * 100}%`,
              width: b.r,
              height: b.r,
              marginLeft: -b.r / 2,
              marginTop: -b.r / 2,
              borderRadius: 999,
              background: `radial-gradient(circle, ${g} 0%, transparent 70%)`,
              opacity: b.o,
              filter: "blur(40px)",
              transform: `translate(${dx}px, ${dy}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Grade sutil em cena escura, com leve scroll.
const GridDark: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07,
        backgroundImage: `linear-gradient(#1FA855 1px, transparent 1px), linear-gradient(90deg, #1FA855 1px, transparent 1px)`,
        backgroundSize: "70px 70px",
        transform: `translateY(${(frame * 0.3) % 70}px)`,
      }}
    />
  );
};

// Partículas com parallax (pequenas = mais lentas).
const Particles: React.FC<{ n?: number; color?: string }> = ({
  n = 18,
  color = C.green,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: n }).map((_, i) => {
        const s = 3 + random(`s${i}`) * 7;
        const speed = 0.25 + (s / 10) * 0.8;
        const x = random(`x${i}`) * width;
        const baseY = random(`y${i}`) * height;
        const y = (((baseY - frame * speed) % height) + height) % height;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s,
              borderRadius: 999,
              background: color,
              opacity: 0.12 + random(`o${i}`) * 0.22,
              filter: s < 6 ? "blur(1px)" : "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Bloco que sobe com mola (overshoot) + motion-blur na entrada.
const Reveal: React.FC<{
  delay?: number;
  y?: number;
  blur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 40, blur = 8, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: OVER });
  const o = Math.max(0, Math.min(1, p));
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        filter: `blur(${interpolate(o, [0, 1], [blur, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Palavra inline subindo com trail de motion blur.
const RiseSpan: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 44, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: OVER });
  const o = Math.max(0, Math.min(1, p));
  return (
    <span
      style={{
        display: "inline-block",
        opacity: o,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        filter: `blur(${interpolate(o, [0, 1], [10, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// Texto revelado palavra a palavra (kinetic typography).
const Kinetic: React.FC<{
  text: string;
  delay?: number;
  step?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, step = 4, style }) => (
  <span style={style}>
    {text.split(" ").map((w, i) => (
      <RiseSpan key={i} delay={delay + i * step} style={{ marginRight: "0.26em" }}>
        {w}
      </RiseSpan>
    ))}
  </span>
);

// Checkmark que "desenha" (stroke draw-on).
const VCheck: React.FC<{ size?: number; delay?: number }> = ({
  size = 34,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.max(
    0,
    Math.min(1, spring({ frame: frame - delay, fps, config: { damping: 18 } }))
  );
  return (
    <span
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        borderRadius: 999,
        background: C.greenChip,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}>
        <path
          d="M5 12.5 L10 17.5 L19 7"
          fill="none"
          stroke={C.green}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
      </svg>
    </span>
  );
};

// Count-up elástico (mola), nunca passa do alvo.
const useCountUp = (to: number, delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  return to * Math.max(0, Math.min(1, p));
};

// Glow pulsante + respiração (CTAs/logo).
const useGlow = (color = C.green) => {
  const frame = useCurrentFrame();
  const t = (Math.sin(frame / 14) + 1) / 2;
  return {
    boxShadow: `0 0 ${22 + t * 26}px ${color}55`,
    transform: `scale(${1 + t * 0.02})`,
  };
};

// Glass surface (cartão translúcido).
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 30px 70px -30px rgba(17,24,39,.28)",
};

/* ------------------------------------------------------------
   Wrapper de cena — transição: wipe direcional + scale(1.05→1)
   + blur(8→0), com mesh atrás. Saída: scale-down + blur + fade.
   ------------------------------------------------------------ */
const MScene: React.FC<{
  duration: number;
  dark?: boolean;
  dir?: "up" | "down" | "left" | "right";
  back?: React.ReactNode;
  pad?: boolean;
  children: React.ReactNode;
}> = ({ duration, dark, dir = "up", back, pad = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inP = spring({ frame, fps, config: OVER });
  const wipe = interpolate(frame, [0, 16], [100, 0], clamp); // % ainda escondido
  const inset =
    dir === "up"
      ? `${wipe}% 0 0 0`
      : dir === "down"
      ? `0 0 ${wipe}% 0`
      : dir === "left"
      ? `0 ${wipe}% 0 0`
      : `0 0 0 ${wipe}%`;

  const outStart = duration - 16;
  const out = interpolate(frame, [outStart, duration], [0, 1], clamp);

  const opacity = Math.min(interpolate(frame, [0, 10], [0, 1], clamp), 1 - out);
  const scale = interpolate(inP, [0, 1], [1.05, 1]) * (1 - out * 0.05);
  const blur = Math.max(interpolate(frame, [0, 14], [8, 0], clamp), out * 12);
  const slide = interpolate(inP, [0, 1], [60, 0]) + out * -50;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? C.dark : C.bg,
        fontFamily: SANS,
        color: dark ? "#fff" : C.text,
      }}
    >
      <MeshBG dark={dark} />
      {back}
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateY(${slide}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
          clipPath: `inset(${inset})`,
          WebkitClipPath: `inset(${inset})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: SAFE_TOP,
            bottom: SAFE_BOTTOM,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: pad ? "0 70px" : 0,
            textAlign: "center",
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============================================================
   SCENE 1 — Hook Statement (100 frames)
   Kinetic typography, reveal palavra-a-palavra com motion blur.
   Frase entre aspas com sweep de sublinhado verde.
   ============================================================ */
export const M1: React.FC = () => {
  const frame = useCurrentFrame();
  // Sublinhado verde varrendo a frase destacada após ela aparecer.
  const sweep = interpolate(frame, [26, 46], [0, 1], clamp);
  const sweepGlow = interpolate(frame, [40, 50, 64], [0, 1, 0.5], clamp);
  return (
    <MScene duration={100} dir="up">
      {/* Frase destacada (entre aspas) */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1.04,
        }}
      >
        <span style={{ color: C.muted, fontWeight: 700 }}>“</span>
        <Kinetic text="Parcelado sem juros" delay={4} step={4} />
        <span style={{ color: C.muted, fontWeight: 700 }}>”</span>
        {/* underline sweep */}
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: -10,
            height: 12,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${C.green}, #22c55e)`,
            transformOrigin: "left center",
            transform: `scaleX(${sweep})`,
            boxShadow: `0 0 ${sweepGlow * 26}px ${C.green}88`,
          }}
        />
      </div>

      {/* Restante da frase */}
      <h1
        style={{
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -1.5,
          lineHeight: 1.08,
          margin: "56px 0 0",
        }}
      >
        <Kinetic
          text="é a maior mentira que você conta pra si mesmo"
          delay={30}
          step={3.5}
        />
      </h1>
    </MScene>
  );
};

/* ============================================================
   SCENE 2 — Forgotten Purchase (90 frames)
   iPhone + WhatsApp. Bolha antiga aparece com efeito de poeira;
   timestamp pulsa p/ enfatizar "esquecida".
   ============================================================ */

// Poeira que sobe e some quando a bolha "acorda".
const DustBurst: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => {
        const local = frame - delay - random(`d${i}`) * 6;
        if (local < 0 || local > 34) return null;
        const p = local / 34;
        const ang = random(`a${i}`) * Math.PI * 2;
        const dist = 30 + random(`r${i}`) * 90;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "55%",
              width: 4 + random(`w${i}`) * 5,
              height: 4 + random(`w${i}`) * 5,
              borderRadius: 999,
              background: "#A8A29E",
              opacity: (1 - p) * 0.5,
              transform: `translate(${Math.cos(ang) * dist * p}px, ${
                Math.sin(ang) * dist * p - p * 40
              }px)`,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </>
  );
};

export const M2: React.FC = () => {
  const frame = useCurrentFrame();
  // A bolha "antiga" desperta: de cinza/desfocada -> nítida e colorida.
  const wake = interpolate(frame, [10, 40], [0, 1], clamp);
  const dustBlur = interpolate(wake, [0, 1], [7, 0]);
  const gray = interpolate(wake, [0, 1], [1, 0]);
  // Timestamp pulsa para enfatizar "esquecida".
  const pulse = 1 + Math.max(0, Math.sin((frame - 20) / 9)) * 0.08;
  const pulseGlow = Math.max(0, Math.sin((frame - 20) / 9));
  return (
    <MScene duration={90} dir="right">
      <div style={{ perspective: 1500 }}>
        <div
          style={{
            transform: `rotateY(${interpolate(
              frame,
              [0, 20],
              [-8, 0],
              clamp
            )}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneFrame height={1160}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 16,
                padding: "30px 22px",
              }}
            >
              <div style={{ position: "relative", alignSelf: "flex-end", maxWidth: "84%" }}>
                <DustBurst delay={10} />
                <div
                  style={{
                    filter: `blur(${dustBlur}px) grayscale(${gray})`,
                    opacity: interpolate(wake, [0, 1], [0.2, 1]),
                  }}
                >
                  <Bubble
                    side="out"
                    style={{
                      fontSize: 30,
                      padding: "18px 22px",
                      lineHeight: 1.3,
                    }}
                  >
                    <b>TV em 10x de 300</b>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 22,
                        color: C.muted,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: 8,
                        transform: `scale(${pulse})`,
                        transformOrigin: "right center",
                      }}
                    >
                      <span
                        style={{
                          background: C.amberChip,
                          color: C.amber,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 18,
                          fontWeight: 700,
                          boxShadow: `0 0 ${pulseGlow * 14}px ${C.amber}66`,
                        }}
                      >
                        registrado há 3 meses
                      </span>
                      14:32 ✓✓
                    </div>
                  </Bubble>
                </div>
              </div>

              <Reveal delay={48} y={20}>
                <div
                  style={{
                    alignSelf: "center",
                    marginTop: 10,
                    fontSize: 24,
                    fontWeight: 700,
                    color: C.muted,
                    background: "rgba(255,255,255,.7)",
                    padding: "10px 20px",
                    borderRadius: 999,
                  }}
                >
                  …e você já tinha esquecido.
                </div>
              </Reveal>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </MScene>
  );
};

/* ============================================================
   SCENE 3 — Mapa de Parcelas Reveal (130 frames)
   Glass card sobe cobrindo o telefone. Header + 6 barras (jun–nov)
   crescem de cima p/ baixo (mola overshoot), valores em count-up
   elástico, shimmer varrendo cada barra, total comprometido
   pisca com glow ao completar.
   ============================================================ */
const BarRow: React.FC<{ m: string; v: number; max: number; delay: number }> = ({
  m,
  v,
  max,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.max(
    0,
    Math.min(1, spring({ frame: frame - delay, fps, config: OVER }))
  );
  const w = (v / max) * 100 * p;
  const val = useCountUp(v, delay);
  const sh = interpolate(frame, [delay, delay + 32], [-40, 150], clamp); // shimmer
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 22 }}>
      <span style={{ width: 76, fontFamily: MONO, fontSize: 30, color: C.muted }}>
        {m}
      </span>
      <div
        style={{
          flex: 1,
          height: 30,
          borderRadius: 999,
          background: "#EFEEE9",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${C.green}, #22c55e)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${sh}%`,
              width: "30%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)",
            }}
          />
        </div>
      </div>
      <span
        style={{
          width: 132,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        {fmt(val)}
      </span>
    </div>
  );
};

export const M3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bars = [
    { m: "jun", v: 890 },
    { m: "jul", v: 890 },
    { m: "ago", v: 740 },
    { m: "set", v: 600 },
    { m: "out", v: 450 },
    { m: "nov", v: 300 },
  ];
  const total = bars.reduce((s, b) => s + b.v, 0); // 3.870
  const totalVal = useCountUp(total, 92);
  const flash = interpolate(frame, [108, 120], [1, 0], clamp); // glow ao completar

  // Card sobe cobrindo o telefone.
  const cardSp = spring({ frame: frame - 8, fps, config: OVER });
  const cardY = interpolate(cardSp, [0, 1], [120, 0]);
  // Telefone recua atrás (depth of field).
  const phoneBlur = interpolate(frame, [8, 40], [0, 4], clamp);
  const phoneScale = interpolate(frame, [8, 40], [1, 0.92], clamp);
  const phoneOp = interpolate(frame, [8, 40], [1, 0.5], clamp);

  return (
    <MScene duration={130} dir="up" pad={false}>
      {/* Telefone "fantasma" recuando atrás do card */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          filter: `blur(${phoneBlur}px)`,
          transform: `scale(${phoneScale})`,
          opacity: phoneOp,
        }}
      >
        <div style={{ width: 360, height: 740, borderRadius: 46, background: "#0d0f14" }} />
      </AbsoluteFill>

      <div
        style={{
          ...glass,
          width: 940,
          borderRadius: 34,
          padding: 46,
          textAlign: "left",
          transform: `translateY(${cardY}px)`,
          opacity: cardSp,
          boxShadow: `0 30px 80px -30px rgba(17,24,39,.32), 0 0 ${
            flash * 60
          }px ${C.green}${flash > 0.01 ? "55" : "00"}`,
        }}
      >
        <Reveal delay={12} y={20} blur={4}>
          <p
            style={{
              fontFamily: MONO,
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: C.green,
              margin: 0,
            }}
          >
            Mapa de parcelas
          </p>
          <h2 style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1, margin: "8px 0 0" }}>
            dos próximos meses
          </h2>
        </Reveal>

        <div style={{ marginTop: 28 }}>
          {bars.map((b, i) => (
            <BarRow key={b.m} m={b.m} v={b.v} max={890} delay={30 + i * 9} />
          ))}
        </div>

        {/* Total comprometido */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 28,
            borderTop: `2px solid ${C.border}`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: C.muted,
            }}
          >
            Total comprometido
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 76,
              fontWeight: 800,
              color: C.green,
              transform: `scale(${1 + flash * 0.06})`,
              textShadow: `0 0 ${flash * 40}px ${C.green}88`,
              lineHeight: 1,
            }}
          >
            R$ {fmt(totalVal)}
          </span>
        </div>
      </div>
    </MScene>
  );
};

/* ============================================================
   SCENE 4 — CTA (100 frames)
   Fundo navy. Logo gira com trilha de glow + checks orbitando.
   Texto pousa com escala elástica + glow pulsante. URL em mono.
   ============================================================ */
export const M4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const rot = interpolate(sp, [0, 1], [-200, 0]);
  const moBlur = interpolate(frame, [0, 18], [12, 0], clamp);
  const orbit = frame * 2;
  const ctaGlow = useGlow();
  // Trilha de glow atrás do logo girando.
  const trailRot = interpolate(frame, [0, 30], [-200, 0], clamp);

  return (
    <MScene
      duration={100}
      dark
      dir="up"
      back={
        <>
          <GridDark />
          <Particles n={16} color="#1FA855" />
        </>
      }
    >
      <Reveal delay={0} y={20} blur={4}>
        <p
          style={{
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 4,
            color: "#34D399",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Produto em validação
        </p>
      </Reveal>

      {/* Logo girando + checks orbitando */}
      <div style={{ position: "relative", width: 240, height: 240, margin: "48px 0" }}>
        {/* trilha de glow */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 170,
            height: 170,
            marginLeft: -85,
            marginTop: -85,
            borderRadius: 40,
            background: C.green,
            opacity: interpolate(frame, [0, 30], [0, 0.35], clamp),
            filter: "blur(34px)",
            transform: `rotate(${trailRot}deg) scale(${sp})`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${orbit}deg)` }}>
          {[0, 120, 240].map((a) => (
            <div
              key={a}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `rotate(${a}deg) translateX(150px) rotate(${-a - orbit}deg)`,
              }}
            >
              <VCheck size={46} delay={18} />
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 160,
            height: 160,
            marginLeft: -80,
            marginTop: -80,
            borderRadius: 40,
            background: C.green,
            color: "#fff",
            fontSize: 86,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${rot}deg) scale(${sp})`,
            filter: `blur(${moBlur}px)`,
            boxShadow: `0 0 50px ${C.green}77`,
          }}
        >
          C
        </div>
      </div>

      <Reveal delay={16} y={30}>
        <h1
          style={{
            fontSize: 58,
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1.1,
            color: "#fff",
            margin: 0,
          }}
        >
          Quer saber o tamanho real?
        </h1>
      </Reveal>
      <Reveal delay={26} y={24}>
        <p style={{ fontSize: 40, fontWeight: 700, color: "#34D399", margin: "18px 0 0" }}>
          Lista de espera no link.
        </p>
      </Reveal>

      <Reveal delay={40} y={20}>
        <div
          style={{
            marginTop: 40,
            fontFamily: MONO,
            fontSize: 34,
            color: "#E5E7EB",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 16,
            padding: "20px 38px",
            ...ctaGlow,
          }}
        >
          cartao-zap.vercel.app
        </div>
      </Reveal>
    </MScene>
  );
};
