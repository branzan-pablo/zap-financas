import React from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, MONO, SANS, fmt } from "./theme";
import { Bubble, PhoneFrame } from "./components";

/* ============================================================
   Reel curto (~16s, 1080x1920) — 4 cenas.
   Mola padrão damping 14 / stiffness 120 em todas as entradas.
   ============================================================ */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const OVER = { damping: 14, stiffness: 120, mass: 0.9 } as const;

const SAFE_TOP = 120;
const SAFE_BOTTOM = 120;

/* ---------------- VFX primitives ---------------- */

// Gradient mesh animado (blobs verdes derivando devagar) atrás de toda cena.
const MeshBG: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const g = dark ? "#1FA855" : "#15803D";
  const blobs = [
    { x: 0.18, y: 0.2, r: 820, o: dark ? 0.22 : 0.11, sx: 0.7, sy: 0.5 },
    { x: 0.84, y: 0.46, r: 720, o: dark ? 0.18 : 0.09, sx: -0.6, sy: 0.8 },
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

// Reveal de bloco: mola (overshoot) + slide-up + blur de entrada (motion-blur look).
const Reveal: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 40, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: OVER });
  const o = Math.max(0, Math.min(1, p));
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        filter: `blur(${interpolate(o, [0, 1], [8, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Reveal inline (palavras) com trail de motion blur.
const RiseSpan: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 30, children, style }) => {
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
        filter: `blur(${interpolate(o, [0, 1], [8, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

// Checkmark que "desenha" (stroke draw-on).
const VCheck: React.FC<{ size?: number; delay?: number }> = ({
  size = 38,
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
        verticalAlign: "middle",
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

// Glow pulsante + respiração (CTAs / logo).
const useGlow = (color = C.green) => {
  const frame = useCurrentFrame();
  const t = (Math.sin(frame / 14) + 1) / 2;
  return {
    boxShadow: `0 0 ${24 + t * 28}px ${color}55`,
    transform: `scale(${1 + t * 0.02})`,
  };
};

// Indicador "digitando" (três bolinhas pulando).
const TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", gap: 9, padding: "10px 6px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 13,
            height: 13,
            borderRadius: 999,
            background: "#9aa3b2",
            transform: `translateY(${Math.sin(frame / 4 + i * 0.95) * 5}px)`,
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
};

// Ticks de entrega: cinza -> azul (lido).
const Ticks: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const col = interpolateColors(
    frame,
    [from + 10, from + 22],
    ["#9aa3b2", "#34b7f1"]
  );
  const second = frame >= from + 6 ? 1 : 0;
  return (
    <span style={{ fontSize: 22, marginLeft: 8, letterSpacing: -2, color: col }}>
      {second ? "✓✓" : "✓"}
    </span>
  );
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.74)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 30px 70px -30px rgba(17,24,39,.28)",
};

/* Wrapper de cena: mesh atrás + transição (wipe direcional + scale 1.05→1 + blur 8→0). */
const VScene: React.FC<{
  duration: number;
  dir?: 1 | -1;
  dark?: boolean;
  pad?: boolean;
  back?: React.ReactNode;
  children: React.ReactNode;
}> = ({ duration, dir = 1, dark, pad = true, back, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame, fps, config: OVER });
  const outStart = duration - 16;
  const out = interpolate(frame, [outStart, duration], [0, 1], clamp);
  const opacity = Math.min(interpolate(frame, [0, 10], [0, 1], clamp), 1 - out);
  const scale = interpolate(inP, [0, 1], [1.05, 1]) * (1 - out * 0.05);
  const blur = Math.max(interpolate(frame, [0, 12], [8, 0], clamp), out * 8);
  const x = interpolate(inP, [0, 1], [120 * dir, 0]) + out * -90 * dir;
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
          transform: `translateX(${x}px) scale(${scale})`,
          filter: `blur(${blur}px)`,
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
   CENA 1 — Registrar compra (140 frames / 4.7s)
   ============================================================ */
export const R1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // entrada do telefone (sobe + perspectiva 3D)
  const sp = spring({ frame, fps, config: OVER });
  const ty = interpolate(sp, [0, 1], [1000, 0]);
  const rotX = interpolate(sp, [0, 1], [18, 0]);
  const moBlur = interpolate(frame, [0, 16], [12, 0], clamp);

  // digitação caractere a caractere
  const MSG = "comprei uma TV em 10x de 300";
  const typeStart = 22;
  const cps = 0.7;
  const nChars = Math.max(0, Math.floor((frame - typeStart) * cps));
  const typed = MSG.slice(0, Math.min(MSG.length, nChars));
  const typingDone = nChars >= MSG.length;
  const sendFrame = 70;
  const sent = frame >= sendFrame;
  const botStart = sendFrame + 24;

  // micro-bounce do teclado enquanto digita
  const typingActive = frame >= typeStart && !sent;
  const kb = typingActive
    ? 1 + Math.abs(Math.sin((frame - typeStart) * 0.7)) * 0.016
    : 1;
  // bounce do botão enviar
  const sendBounce =
    frame >= sendFrame && frame <= sendFrame + 6 ? 1.18 : 1;
  const caret = !sent && frame >= typeStart && Math.floor(frame / 8) % 2 ? "|" : "";

  return (
    <VScene duration={140} dir={1} pad={false}>
      <div style={{ perspective: 1700, filter: `blur(${moBlur}px)` }}>
        <div
          style={{
            transform: `translateY(${ty}px) rotateX(${rotX}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneFrame height={1520}>
            {/* mensagens */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 18,
                padding: "24px 22px 160px",
              }}
            >
              {sent && (
                <Reveal>
                  <Bubble side="out" style={{ fontSize: 36, padding: "18px 24px" }}>
                    {MSG}
                    <Ticks from={sendFrame} />
                  </Bubble>
                </Reveal>
              )}
              {frame >= botStart && (
                <Reveal>
                  <Bubble
                    side="in"
                    style={{
                      fontSize: 36,
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      lineHeight: 1.3,
                    }}
                  >
                    <b>Registrado</b>
                    <VCheck size={40} delay={botStart + 4} />
                    <span>
                      mais <b style={{ color: C.green }}>R$ 300/mês</b> até
                      abr/2027
                    </span>
                  </Bubble>
                </Reveal>
              )}
            </div>

            {/* barra de input */}
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 26,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 999,
                  padding: "20px 26px",
                  fontSize: 32,
                  color: sent || !typed ? "#9aa3b2" : C.text,
                  transform: `scaleY(${kb})`,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {sent ? "Mensagem" : typed ? `${typed}${caret}` : "Mensagem"}
              </div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 999,
                  background: "#1FA855",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 30,
                  flexShrink: 0,
                  transform: `scale(${sendBounce})`,
                }}
              >
                ➤
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </VScene>
  );
};

/* ============================================================
   CENA 2 — Perguntar (100 frames / 3.3s)
   ============================================================ */
export const R2: React.FC = () => {
  const frame = useCurrentFrame();

  const Q = "quanto já comprometi pros próximos meses?";
  const typeStart = 6;
  const cps = 0.85;
  const nChars = Math.max(0, Math.floor((frame - typeStart) * cps));
  const typed = Q.slice(0, Math.min(Q.length, nChars));
  const sendFrame = 56;
  const sent = frame >= sendFrame;
  const thinkStart = sendFrame + 4;
  const revealStart = sendFrame + 20;
  const caret =
    !sent && frame >= typeStart && Math.floor(frame / 8) % 2 ? "|" : "";

  const ANSWER = "Você já comprometeu R$ 2.180 nos próximos 6 meses.";
  const words = ANSWER.split(" ");

  return (
    <VScene duration={100} dir={-1} pad={false}>
      <PhoneFrame height={1520}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: 16,
            padding: "24px 22px 160px",
          }}
        >
          {/* histórico esmaecido (continuidade) */}
          <div style={{ opacity: 0.5, display: "flex", flexDirection: "column", gap: 14 }}>
            <Bubble side="out" style={{ fontSize: 32, padding: "16px 22px" }}>
              comprei uma TV em 10x de 300
            </Bubble>
            <Bubble side="in" style={{ fontSize: 32, padding: "16px 22px" }}>
              Registrado ✓ mais R$ 300/mês
            </Bubble>
          </div>

          {sent && (
            <Reveal>
              <Bubble side="out" style={{ fontSize: 36, padding: "18px 24px" }}>
                {Q}
                <Ticks from={sendFrame} />
              </Bubble>
            </Reveal>
          )}

          {frame >= thinkStart && frame < revealStart && (
            <Bubble side="in" style={{ padding: "8px 16px" }}>
              <TypingDots />
            </Bubble>
          )}

          {frame >= revealStart && (
            <Reveal>
              <Bubble
                side="in"
                style={{ fontSize: 36, padding: "18px 24px", lineHeight: 1.3 }}
              >
                {words.map((w, i) => {
                  const hl = w.startsWith("R$") || /2\.180/.test(w);
                  return (
                    <RiseSpan
                      key={i}
                      delay={revealStart + i * 3}
                      style={{
                        marginRight: "0.28em",
                        fontWeight: hl ? 800 : 400,
                        color: hl ? C.green : undefined,
                      }}
                    >
                      {w}
                    </RiseSpan>
                  );
                })}
              </Bubble>
            </Reveal>
          )}
        </div>

        {/* barra de input */}
        <div
          style={{
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 26,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 999,
              padding: "20px 26px",
              fontSize: 32,
              color: sent || !typed ? "#9aa3b2" : C.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {sent ? "Mensagem" : typed ? `${typed}${caret}` : "Mensagem"}
          </div>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "#1FA855",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              flexShrink: 0,
            }}
          >
            ➤
          </div>
        </div>
      </PhoneFrame>
    </VScene>
  );
};

/* ============================================================
   CENA 3 — Fatura Projetada (140 frames / 4.7s)
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
  const sh = interpolate(frame, [delay, delay + 30], [-40, 140], clamp); // shimmer
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16 }}>
      <span style={{ width: 64, fontFamily: MONO, fontSize: 28, color: C.muted }}>
        {m}
      </span>
      <div
        style={{
          flex: 1,
          height: 22,
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
            background: C.green,
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
          width: 110,
          textAlign: "right",
          fontFamily: MONO,
          fontSize: 28,
        }}
      >
        {fmt(val)}
      </span>
    </div>
  );
};

export const R3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const val = useCountUp(2180, 30);
  const flash = interpolate(frame, [78, 94], [1, 0], clamp); // glow flash ao chegar
  const cardSp = spring({ frame: frame - 14, fps, config: OVER });
  const cardY = interpolate(cardSp, [0, 1], [1100, 0]); // sobe de baixo cobrindo o phone
  const badgePulse = 1 + Math.sin(frame / 9) * 0.04;

  const bars = [
    { m: "jun", v: 1240 },
    { m: "jul", v: 1180 },
    { m: "ago", v: 980 },
    { m: "set", v: 760 },
    { m: "out", v: 450 },
    { m: "nov", v: 300 },
  ];

  return (
    <VScene duration={140} dir={1}>
      {/* chat esmaecido ao fundo (o phone "coberto" pelo card) */}
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP - 40,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          opacity: interpolate(frame, [14, 40], [0.5, 0.16], clamp),
          filter: "blur(2px)",
        }}
      >
        <Bubble side="out" style={{ fontSize: 30, padding: "14px 20px" }}>
          quanto já comprometi pros próximos meses?
        </Bubble>
        <Bubble side="in" style={{ fontSize: 30, padding: "14px 20px" }}>
          Você já comprometeu R$ 2.180…
        </Bubble>
      </div>

      {/* card de fatura */}
      <div
        style={{
          ...glass,
          width: "100%",
          borderRadius: 32,
          padding: 44,
          textAlign: "left",
          transform: `translateY(${cardY}px)`,
          opacity: Math.max(0, Math.min(1, cardSp)),
          boxShadow: `0 40px 90px -30px rgba(17,24,39,.34), 0 0 ${
            flash * 60
          }px ${C.green}${flash > 0 ? "55" : "00"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Fatura Projetada
          </span>
          <span
            style={{
              background: C.amberChip,
              color: C.amber,
              fontSize: 26,
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 999,
              transform: `scale(${badgePulse})`,
            }}
          >
            fecha em 4 dias
          </span>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 128,
            fontWeight: 800,
            marginTop: 12,
            lineHeight: 1,
            textShadow: `0 0 ${flash * 36}px ${C.green}88`,
          }}
        >
          R$ {fmt(val)}
        </div>
        <div style={{ fontSize: 30, color: C.muted, marginBottom: 16 }}>
          vs. R$ 1.990 no mês passado
        </div>

        {bars.map((b, i) => (
          <BarRow key={b.m} m={b.m} v={b.v} max={1240} delay={46 + i * 7} />
        ))}
      </div>
    </VScene>
  );
};

/* ============================================================
   CENA 4 — CTA (100 frames / 3.3s) — fundo navy
   ============================================================ */
const CtaGrid: React.FC = () => {
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

export const R4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sp = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const rot = interpolate(sp, [0, 1], [-200, 0]); // logo gira ao entrar
  const moBlur = interpolate(frame, [0, 16], [12, 0], clamp); // glow trail (motion blur)
  const orbit = frame * 2.6; // checks orbitando
  const ctaGlow = useGlow();

  return (
    <VScene duration={100} dir={1} dark back={<CtaGrid />}>
      <div style={{ position: "relative", width: 240, height: 240, marginBottom: 48 }}>
        {/* checks verdes orbitando */}
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${orbit}deg)` }}>
          {[0, 120, 240].map((a) => (
            <div
              key={a}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `rotate(${a}deg) translateX(150px) rotate(${
                  -a - orbit
                }deg)`,
              }}
            >
              <VCheck size={46} delay={14} />
            </div>
          ))}
        </div>
        {/* logo girando com glow trail */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 160,
            height: 160,
            marginLeft: -80,
            marginTop: -80,
            borderRadius: 38,
            background: C.green,
            color: "#fff",
            fontSize: 86,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${rot}deg) scale(${Math.max(0, Math.min(1, sp))})`,
            filter: `blur(${moBlur}px)`,
            boxShadow: `0 0 48px ${C.green}77`,
          }}
        >
          C
        </div>
      </div>

      <Reveal delay={16}>
        <h1
          style={{
            fontSize: 78,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: -1.5,
            lineHeight: 1.08,
            margin: 0,
            textShadow: `0 0 ${24 + (Math.sin(frame / 14) + 1) * 14}px ${C.green}55`,
          }}
        >
          Sem baixar nada.
          <br />
          <span style={{ color: "#34D399" }}>Lista de espera aberta.</span>
        </h1>
      </Reveal>

      <Reveal delay={30}>
        <div
          style={{
            marginTop: 44,
            fontFamily: MONO,
            fontSize: 38,
            color: "#E5E7EB",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.18)",
            borderRadius: 18,
            padding: "20px 40px",
            ...ctaGlow,
          }}
        >
          cartao-zap.vercel.app
        </div>
      </Reveal>
    </VScene>
  );
};
