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
const OVER = { damping: 14, stiffness: 120, mass: 0.9 } as const;
const stream = (text: string, start: number, frame: number, cps = 0.7) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * cps)));

const SAFE_TOP = 220;
const SAFE_BOTTOM = 320;

/* ============ VFX primitives ============ */

// Reveal de bloco com mola (overshoot) + blur de entrada (motion-blur look).
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
        filter: `blur(${interpolate(o, [0, 1], [6, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Reveal inline (palavras/letras) com trail de motion blur.
const RiseSpan: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 36, children, style }) => {
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

// Texto revelado palavra a palavra; destaca uma palavra em verde.
const Kinetic: React.FC<{
  text: string;
  delay?: number;
  step?: number;
  highlight?: string;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, step = 4, highlight, style }) => (
  <span style={style}>
    {text.split(" ").map((w, i) => (
      <RiseSpan
        key={i}
        delay={delay + i * step}
        style={{
          marginRight: "0.28em",
          color: highlight && w.replace(/[.,]/g, "") === highlight ? C.green : undefined,
        }}
      >
        {w}
      </RiseSpan>
    ))}
  </span>
);

// Gradient mesh animado (blobs verdes derivando devagar).
const MeshBG: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const g = dark ? "#1FA855" : "#15803D";
  const blobs = [
    { x: 0.2, y: 0.22, r: 760, o: dark ? 0.2 : 0.1, sx: 0.7, sy: 0.5 },
    { x: 0.82, y: 0.48, r: 660, o: dark ? 0.16 : 0.08, sx: -0.6, sy: 0.8 },
    { x: 0.5, y: 0.82, r: 720, o: dark ? 0.18 : 0.09, sx: 0.5, sy: -0.6 },
  ];
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {blobs.map((b, i) => {
        const dx = Math.sin(frame / 90 + i) * 70 * b.sx;
        const dy = Math.cos(frame / 110 + i) * 70 * b.sy;
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

// Partículas com parallax (pequenas = mais lentas).
const VParticles: React.FC<{ n?: number; color?: string }> = ({
  n = 22,
  color = C.green,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: n }).map((_, i) => {
        const s = 3 + random(`s${i}`) * 7;
        const speed = 0.25 + (s / 10) * 0.8; // maiores = mais rápidas (parallax)
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

// Checkmark que "desenha" (stroke draw-on).
const VCheck: React.FC<{ size?: number; delay?: number }> = ({
  size = 34,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.max(0, Math.min(1, spring({ frame: frame - delay, fps, config: { damping: 18 } })));
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
  const p = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
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

// Indicador de toque (ripple) num ponto.
const Tap: React.FC<{ delay: number; left: number | string; top: number | string }> = ({
  delay,
  left,
  top,
}) => {
  const frame = useCurrentFrame();
  const local = frame - delay;
  if (local < 0 || local > 26) return null;
  const p = local / 26;
  return (
    <div style={{ position: "absolute", left, top, transform: "translate(-50%,-50%)" }}>
      <div
        style={{
          width: 90,
          height: 90,
          marginLeft: -45,
          marginTop: -45,
          borderRadius: 999,
          border: `3px solid ${C.green}`,
          opacity: 1 - p,
          transform: `scale(${0.3 + p * 1.1})`,
        }}
      />
    </div>
  );
};

// Wrapper de cena: mesh atrás + transição (slide Y + scale 1.05→1 + blur) com overshoot.
const VScene: React.FC<{
  duration: number;
  dark?: boolean;
  children: React.ReactNode;
  back?: React.ReactNode;
  pad?: boolean;
}> = ({ duration, dark, children, back, pad = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inP = spring({ frame, fps, config: OVER });
  const outStart = duration - 16;
  const out = interpolate(frame, [outStart, duration], [0, 1], clamp);
  const opacity = Math.min(interpolate(frame, [0, 10], [0, 1], clamp), 1 - out);
  const scale = interpolate(inP, [0, 1], [1.05, 1]) * (1 - out * 0.04);
  const blur = Math.max(interpolate(frame, [0, 14], [10, 0], clamp), out * 12);
  const y = interpolate(inP, [0, 1], [70, 0]) + out * -50;
  return (
    <AbsoluteFill style={{ backgroundColor: dark ? C.dark : C.bg, fontFamily: SANS, color: C.text }}>
      <MeshBG dark={dark} />
      {back}
      <AbsoluteFill style={{ opacity, transform: `translateY(${y}px) scale(${scale})`, filter: `blur(${blur}px)` }}>
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

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.6)",
  boxShadow: "0 30px 70px -30px rgba(17,24,39,.28)",
};

const chipStyle: React.CSSProperties = {
  background: C.greenChip,
  color: C.green,
  fontWeight: 700,
  fontSize: 30,
  padding: "12px 24px",
  borderRadius: 999,
  border: `1px solid ${C.green}33`,
};

/* ============ V1: WhatsApp Boot ============ */
export const V1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: OVER });
  const ty = interpolate(sp, [0, 1], [900, 0]);
  const rotX = interpolate(sp, [0, 1], [20, 7]);
  const rotY = Math.sin(frame / 18) * 3;
  const moBlur = interpolate(frame, [0, 18], [12, 0], clamp); // motion blur na entrada
  const typed = frame >= 30 ? "" : "oi".slice(0, Math.max(0, Math.min(2, frame - 22)));
  const tapB = 1 + (frame >= 22 && frame <= 24 ? 0.5 : 0); // micro-bounce do teclado
  const feats = [
    "Registro de compras parceladas",
    "Fatura projetada em tempo real",
    "Alerta antes do fechamento",
    "Mapa de parcelas futuras",
  ];
  return (
    <VScene duration={120}>
      <div style={{ perspective: 1600, filter: `blur(${moBlur}px)` }}>
        <div style={{ transform: `translateY(${ty}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`, transformStyle: "preserve-3d" }}>
          <PhoneFrame height={1320}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 14, padding: "26px 20px 120px" }}>
              {frame >= 30 && (
                <Reveal>
                  <Bubble side="out" style={{ fontSize: 26, padding: "14px 20px" }}>
                    oi{" "}
                    <span style={{ fontSize: 18, color: "#34b7f1" }}>✓✓</span>
                  </Bubble>
                </Reveal>
              )}
              {frame >= 42 && (
                <Reveal>
                  <Bubble side="in" style={{ fontSize: 26, padding: "14px 20px" }}>
                    <b>CartãoZap conectado ✓</b>
                  </Bubble>
                </Reveal>
              )}
              {feats.map((f, i) =>
                frame >= 56 + i * 12 ? (
                  <Reveal key={f}>
                    <Bubble side="in" style={{ fontSize: 26, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                      <VCheck size={30} delay={56 + i * 12} />
                      {f}
                    </Bubble>
                  </Reveal>
                ) : null
              )}
            </div>
            <div style={{ position: "absolute", left: 18, right: 18, bottom: 22, display: "flex", alignItems: "center", gap: 12, transform: `scaleY(${tapB})` }}>
              <div style={{ flex: 1, background: "#fff", borderRadius: 999, padding: "16px 22px", fontSize: 24, color: typed ? C.text : "#9aa3b2" }}>
                {typed || "Mensagem"}
              </div>
              <div style={{ width: 60, height: 60, borderRadius: 999, background: "#1FA855", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                ➤
              </div>
            </div>
            <Tap delay={28} left="86%" top="93%" />
          </PhoneFrame>
        </div>
      </div>
    </VScene>
  );
};

/* ============ V2: Home / Hero ============ */
export const V2: React.FC = () => {
  const glow = useGlow();
  return (
    <VScene duration={150}>
      <Reveal>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 16, fontSize: 46, fontWeight: 800 }}>
          <span style={{ width: 64, height: 64, borderRadius: 16, background: C.green, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>C</span>
          <Kinetic text="CartãoZap" delay={4} step={2} />
        </div>
      </Reveal>
      <h1 style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, margin: "40px 0 0" }}>
        <Kinetic text="Saiba sua fatura antes dela fechar." delay={16} step={4} highlight="antes" />
      </h1>
      <Reveal delay={44} style={{ width: 720, marginTop: 56 }}>
        <div style={{ ...glass, height: 76, borderRadius: 16, display: "flex", alignItems: "center", padding: "0 24px", color: C.muted, fontSize: 30 }}>
          seu@email.com
        </div>
        <div style={{ height: 76, marginTop: 16, borderRadius: 16, background: C.green, color: "#fff", fontWeight: 700, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", ...glow }}>
          Entrar na lista
        </div>
      </Reveal>
      <Reveal delay={58}>
        <p style={{ marginTop: 26, fontSize: 28, color: C.muted }}>Lista de espera · sem spam</p>
      </Reveal>
    </VScene>
  );
};

/* ============ V3: Fatura Projetada ============ */
const BarRow: React.FC<{ m: string; v: number; max: number; delay: number }> = ({ m, v, max, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.max(0, Math.min(1, spring({ frame: frame - delay, fps, config: OVER })));
  const w = (v / max) * 100 * p;
  const val = useCountUp(v, delay);
  // shimmer sweep
  const sh = interpolate(frame, [delay, delay + 30], [-40, 140], clamp);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
      <span style={{ width: 56, fontFamily: MONO, fontSize: 24, color: C.muted }}>{m}</span>
      <div style={{ flex: 1, height: 18, borderRadius: 999, background: "#EFEEE9", overflow: "hidden", position: "relative" }}>
        <div style={{ width: `${w}%`, height: "100%", borderRadius: 999, background: C.green, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sh}%`, width: "30%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent)" }} />
        </div>
      </div>
      <span style={{ width: 92, textAlign: "right", fontFamily: MONO, fontSize: 24 }}>{fmt(val)}</span>
    </div>
  );
};

export const V3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const val = useCountUp(2180, 22);
  const flash = interpolate(frame, [70, 84], [1, 0], clamp); // glow flash ao chegar
  const cardSp = spring({ frame: frame - 20, fps, config: OVER });
  const cardY = interpolate(cardSp, [0, 1], [90, 0]);
  // chat recua (depth of field)
  const chatBlur = interpolate(frame, [20, 50], [0, 3], clamp);
  const chatScale = interpolate(frame, [20, 50], [1, 0.95], clamp);
  const bars = [
    { m: "jun", v: 1240 }, { m: "jul", v: 1180 }, { m: "ago", v: 980 },
    { m: "set", v: 760 }, { m: "out", v: 450 }, { m: "nov", v: 300 },
  ];
  const botText = stream("Registrado ✓ mais R$ 300/mês até abr/2027. Fatura projetada: R$ 2.180.", 26, frame);
  return (
    <VScene duration={160}>
      <div style={{ width: "100%", background: "#E5DDD5", borderRadius: 24, padding: 22, display: "flex", flexDirection: "column", gap: 12, filter: `blur(${chatBlur}px)`, transform: `scale(${chatScale})` }}>
        <Reveal><Bubble side="out" style={{ fontSize: 26, padding: "14px 18px" }}>comprei uma TV em 10x de 300</Bubble></Reveal>
        {frame >= 24 && <Bubble side="in" style={{ fontSize: 26, padding: "14px 18px" }}>{botText}</Bubble>}
      </div>

      <div style={{ ...glass, width: "100%", marginTop: -10, borderRadius: 28, padding: 36, textAlign: "left", transform: `translateY(${cardY}px)`, opacity: cardSp, boxShadow: `0 30px 70px -30px rgba(17,24,39,.28), 0 0 ${flash * 50}px ${C.green}${flash > 0 ? "55" : "00"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.muted }}>Fatura projetada</span>
          <span style={{ background: C.amberChip, color: C.amber, fontSize: 22, fontWeight: 700, padding: "8px 16px", borderRadius: 999, transform: `scale(${1 + Math.sin(frame / 12) * 0.03})` }}>fecha em 4 dias</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 96, fontWeight: 800, marginTop: 10 }}>R$ {fmt(val)}</div>
        <div style={{ fontSize: 26, color: C.muted, marginBottom: 24 }}>vs. R$ 1.990 no mês passado</div>
        {bars.map((b, i) => (<BarRow key={b.m} m={b.m} v={b.v} max={1240} delay={40 + i * 7} />))}
      </div>
    </VScene>
  );
};

/* ============ V4: Como Funciona ============ */
export const V4: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = [
    { n: "01", t: "Manda no zap" },
    { n: "02", t: "Vê a fatura projetada" },
    { n: "03", t: "É avisado antes de fechar" },
  ];
  const lineH = interpolate(frame, [16, 90], [0, 100], clamp);
  return (
    <VScene duration={130}>
      <Reveal>
        <p style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 3, textTransform: "uppercase", color: C.green }}>Como funciona</p>
      </Reveal>
      <div style={{ position: "relative", marginTop: 40, width: "100%", display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
        <div style={{ position: "absolute", top: 40, bottom: 40, left: "50%", width: 4, transform: "translateX(-50%)", background: C.border }} />
        <div style={{ position: "absolute", top: 40, left: "50%", width: 4, transform: "translateX(-50%)", height: `calc((100% - 80px) * ${lineH / 100})`, background: `linear-gradient(${C.green}, #22c55e)`, boxShadow: `0 0 16px ${C.green}88`, borderRadius: 999 }} />
        {steps.map((s, i) => {
          const d = 10 + i * 18;
          const pop = Math.max(0, Math.min(1, spring({ frame: frame - d, fps: 30, config: OVER })));
          return (
            <Reveal key={s.n} delay={d}>
              <div style={{ ...glass, width: 720, borderRadius: 22, padding: 30, display: "flex", alignItems: "center", gap: 22, textAlign: "left" }}>
                <div style={{ fontFamily: MONO, fontSize: 44, fontWeight: 800, color: C.green, width: 70, transform: `scale(${1 + (1 - pop) * 0.4})` }}>{s.n}</div>
                <div style={{ fontSize: 38, fontWeight: 700 }}>{s.t}</div>
              </div>
            </Reveal>
          );
        })}
      </div>
      <Reveal delay={74}>
        <p style={{ marginTop: 40, fontSize: 30, color: C.muted }}>Sem planilha. Sem abrir 5 apps.</p>
      </Reveal>
    </VScene>
  );
};

/* ============ V5: Recursos ============ */
export const V5: React.FC = () => {
  const frame = useCurrentFrame();
  const pills = ["Todos", "Controle", "Alertas"];
  const cards = [
    "Fatura projetada em tempo real", "Mapa de parcelas futuras", "Alerta no WhatsApp",
    "Cartões ilimitados", "Captura de compras pelo WhatsApp", "Garantia de 7 dias",
  ];
  return (
    <VScene duration={140}>
      <Reveal>
        <h2 style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1 }}>Tudo que importa do seu cartão, num lugar só.</h2>
      </Reveal>
      <Reveal delay={8}>
        <div style={{ position: "relative", display: "flex", gap: 0, justifyContent: "center", margin: "30px 0 30px", background: "#fff", borderRadius: 999, padding: 6, border: `1px solid ${C.border}` }}>
          {/* indicador deslizante (tab morph) */}
          <div style={{ position: "absolute", top: 6, bottom: 6, left: 6, width: 140, borderRadius: 999, background: C.green, transition: "none" }} />
          {pills.map((p, i) => (
            <span key={p} style={{ position: "relative", width: 140, textAlign: "center", padding: "10px 0", borderRadius: 999, fontSize: 26, fontWeight: 600, color: i === 0 ? "#fff" : C.muted }}>{p}</span>
          ))}
        </div>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, width: "100%" }}>
        {cards.map((c, i) => {
          const d = 14 + i * 7;
          const land = Math.max(0, Math.min(1, spring({ frame: frame - d, fps: 30, config: OVER })));
          return (
            <Reveal key={c} delay={d}>
              <div style={{ ...glass, borderRadius: 20, padding: 24, height: 200, display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left", boxShadow: `0 20px 50px -30px rgba(17,24,39,.3), 0 0 ${land * 18}px ${C.green}22` }}>
                <VCheck size={34} delay={d + 4} />
                <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2 }}>{c}</div>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.5, transform: `scale(${land})` }}>Incluído</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </VScene>
  );
};

/* ============ V6: Tudo no WhatsApp ============ */
export const V6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 11, mass: 0.8 } });
  const ring = interpolate(frame, [4, 40], [0, 360], clamp);
  const ringO = interpolate(frame, [4, 40], [0.6, 0], clamp);
  const chips = ["Fatura projetada", "Alertas", "Parcelas", "Cartões ilimitados"];
  const drift = (i: number) => ({
    transform: `translate(${Math.sin(frame / 40 + i) * 12}px, ${Math.cos(frame / 36 + i) * 12}px)`,
  });
  return (
    <VScene duration={120}>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
        {chips.slice(0, 2).map((ch, i) => (
          <Reveal key={ch} delay={20 + i * 8} y={0}><span style={{ ...chipStyle, ...drift(i) }}>{ch}</span></Reveal>
        ))}
      </div>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: ring, height: ring, marginLeft: -ring / 2, marginTop: -ring / 2, borderRadius: 999, border: `4px solid ${C.green}`, opacity: ringO }} />
        <div style={{ width: 180, height: 180, borderRadius: 44, background: C.wa, color: "#fff", fontSize: 100, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sp})`, boxShadow: "0 30px 70px -20px rgba(37,211,102,.6)" }}>C</div>
      </div>
      <Reveal delay={10}>
        <h1 style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5, marginTop: 44 }}>Seu cartão, direto no WhatsApp</h1>
      </Reveal>
      <Reveal delay={18}>
        <p style={{ fontSize: 32, color: C.muted, marginTop: 16 }}>Sem baixar nada · Sem conectar banco · Sem planilha</p>
      </Reveal>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 44 }}>
        {chips.slice(2).map((ch, i) => (
          <Reveal key={ch} delay={30 + i * 8} y={0}><span style={{ ...chipStyle, ...drift(i + 2) }}>{ch}</span></Reveal>
        ))}
      </div>
    </VScene>
  );
};

/* ============ V7: Plano Fundador ============ */
export const V7: React.FC = () => {
  const frame = useCurrentFrame();
  const benefits = [
    "Cartões ilimitados", "Fatura em tempo real", "Mapa de parcelas",
    "Alertas antes do fechamento", "Captura pelo WhatsApp",
  ];
  const priceFlash = interpolate(frame, [88, 104], [1, 0], clamp);
  return (
    <VScene duration={180} back={<VParticles n={18} />}>
      {frame < 64 && (
        <>
          {[0, 1, 2, 3].map((i) => {
            const a = i * 90;
            const len = interpolate(frame, [0, 36], [600, 0], clamp);
            return (
              <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 4, height: len, background: `linear-gradient(${C.green}, transparent)`, transform: `rotate(${a}deg) translateY(-${len}px)`, transformOrigin: "top center", opacity: interpolate(frame, [0, 20, 40], [0, 0.7, 0], clamp), filter: "blur(1px)" }} />
            );
          })}
          <div style={{ width: interpolate(frame, [0, 40], [0, 340], clamp), height: interpolate(frame, [0, 40], [0, 340], clamp), borderRadius: 999, border: `4px solid ${C.green}`, opacity: interpolate(frame, [10, 50], [0.8, 0], clamp), boxShadow: `0 0 50px ${C.green}66` }} />
        </>
      )}
      {frame >= 56 && frame < 122 && (
        <div>
          <div style={{ fontSize: 52, fontWeight: 800 }}>
            <Kinetic text="✦ Vagas de Fundador ✦" delay={56} step={5} highlight="✦" />
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, marginTop: 28, transform: `scale(${1 + priceFlash * 0.08})`, textShadow: `0 0 ${priceFlash * 40}px ${C.green}66` }}>
            R$ 149,90<span style={{ fontSize: 40, color: C.muted }}>/ano</span>
          </div>
          <Reveal delay={92}>
            <div style={{ fontFamily: MONO, fontSize: 32, color: C.muted }}>≈ R$ 12,49/mês</div>
          </Reveal>
        </div>
      )}
      {frame >= 120 && (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start", width: "fit-content", margin: "0 auto" }}>
            {benefits.map((b, i) => (
              <RiseSpan key={b} delay={120 + i * 7} y={0} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <VCheck size={34} delay={122 + i * 7} />
                <span style={{ fontSize: 36 }}>{b}</span>
              </RiseSpan>
            ))}
          </div>
          <Reveal delay={156}>
            <p style={{ marginTop: 40, fontSize: 28, color: C.muted, borderBottom: `2px solid ${C.green}`, paddingBottom: 8, display: "inline-block" }}>Pix · Cartão em até 12x · Garantia de 7 dias</p>
          </Reveal>
        </div>
      )}
    </VScene>
  );
};

/* ============ V8: Waitlist CTA ============ */
export const V8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const rot = interpolate(sp, [0, 1], [-180, 0]);
  const moBlur = interpolate(frame, [0, 16], [10, 0], clamp);
  const orbit = frame * 2;
  const ctaGlow = useGlow();
  return (
    <VScene duration={120} dark back={<><VGridDark /><VParticles n={16} color="#1FA855" /></>}>
      <Reveal>
        <p style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: "#34D399", textTransform: "uppercase" }}>Produto em validação</p>
      </Reveal>
      <div style={{ position: "relative", width: 220, height: 220, margin: "44px 0" }}>
        <div style={{ position: "absolute", inset: 0, transform: `rotate(${orbit}deg)` }}>
          {[0, 120, 240].map((a) => (
            <div key={a} style={{ position: "absolute", left: "50%", top: "50%", transform: `rotate(${a}deg) translateX(140px) rotate(${-a - orbit}deg)` }}>
              <VCheck size={42} delay={16} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 150, height: 150, marginLeft: -75, marginTop: -75, borderRadius: 36, background: C.green, color: "#fff", fontSize: 80, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${rot}deg) scale(${sp})`, filter: `blur(${moBlur}px)`, boxShadow: `0 0 40px ${C.green}66` }}>C</div>
      </div>
      <Reveal delay={16}>
        <h1 style={{ fontSize: 60, fontWeight: 800, color: "#fff" }}>Entrar na lista de fundador</h1>
      </Reveal>
      <Reveal delay={26}>
        <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 32, color: "#E5E7EB", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 16, padding: "18px 34px", ...ctaGlow }}>cartao-zap.vercel.app</div>
      </Reveal>
    </VScene>
  );
};

const VGridDark: React.FC = () => {
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
