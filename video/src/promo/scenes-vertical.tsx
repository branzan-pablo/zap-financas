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
import { Bubble, Check, PhoneFrame, Pop, useInOut } from "./components";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const stream = (text: string, start: number, frame: number, cps = 0.7) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * cps)));

// Safe zones para Reels/TikTok: topo (ícones) e base (legenda/perfil/seguir).
const SAFE_TOP = 220;
const SAFE_BOTTOM = 320;

const VGrid: React.FC<{ color?: string; opacity?: number }> = ({
  color = C.green,
  opacity = 0.05,
}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: "60px 60px",
    }}
  />
);

const VParticles: React.FC<{ n?: number; color?: string }> = ({
  n = 22,
  color = C.green,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`x${i}`) * width;
        const baseY = random(`y${i}`) * height;
        const y = (((baseY - frame * (0.6 + random(`v${i}`))) % height) + height) % height;
        const s = 4 + random(`s${i}`) * 7;
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
              opacity: 0.15 + random(`o${i}`) * 0.25,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Wrapper de cena vertical: fade+scale e conteúdo dentro das safe zones.
const VScene: React.FC<{
  duration: number;
  bg?: string;
  children: React.ReactNode;
  back?: React.ReactNode;
}> = ({ duration, bg = C.bg, children, back }) => {
  const { opacity, scale } = useInOut(duration);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: SANS,
        color: C.text,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {back}
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
          padding: "0 70px",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/* ---------- V1: WhatsApp Boot ---------- */
export const V1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 200 } });
  const ty = interpolate(sp, [0, 1], [800, 0]);
  const rotX = interpolate(sp, [0, 1], [20, 7]);
  const rotY = Math.sin(frame / 18) * 3;
  const typed = frame >= 30 ? "" : "oi".slice(0, Math.max(0, Math.min(2, frame - 22)));
  const feats = [
    "Registro de compras parceladas",
    "Fatura projetada em tempo real",
    "Alerta antes do fechamento",
    "Mapa de parcelas futuras",
  ];
  return (
    <VScene duration={120}>
      <div style={{ perspective: 1600 }}>
        <div
          style={{
            transform: `translateY(${ty}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneFrame height={1320}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "26px 20px 120px",
              }}
            >
              {frame >= 30 && (
                <Pop>
                  <Bubble side="out" style={{ fontSize: 26, padding: "14px 20px" }}>
                    oi
                  </Bubble>
                </Pop>
              )}
              {frame >= 42 && (
                <Pop>
                  <Bubble side="in" style={{ fontSize: 26, padding: "14px 20px" }}>
                    <b>CartãoZap conectado ✓</b>
                  </Bubble>
                </Pop>
              )}
              {feats.map((f, i) =>
                frame >= 56 + i * 12 ? (
                  <Pop key={f}>
                    <Bubble
                      side="in"
                      style={{ fontSize: 26, padding: "14px 20px" }}
                    >
                      <span style={{ color: C.green, fontWeight: 700 }}>✓</span>{" "}
                      {f}
                    </Bubble>
                  </Pop>
                ) : null
              )}
            </div>
            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 22,
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
                  padding: "16px 22px",
                  fontSize: 24,
                  color: typed ? C.text : "#9aa3b2",
                }}
              >
                {typed || "Mensagem"}
              </div>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 999,
                  background: "#1FA855",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
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

/* ---------- V2: Home / Hero ---------- */
export const V2: React.FC = () => (
  <VScene duration={150}>
    <Pop>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          fontSize: 46,
          fontWeight: 800,
        }}
      >
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: C.green,
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
          }}
        >
          C
        </span>
        CartãoZap
      </div>
    </Pop>
    <Pop delay={10}>
      <h1
        style={{
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1.05,
          margin: "40px 0 0",
        }}
      >
        Saiba sua fatura <span style={{ color: C.green }}>antes</span> dela
        fechar.
      </h1>
    </Pop>
    <Pop delay={24}>
      <div style={{ width: 720, marginTop: 56 }}>
        <div
          style={{
            height: 76,
            borderRadius: 16,
            background: "#fff",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            color: C.muted,
            fontSize: 30,
          }}
        >
          seu@email.com
        </div>
        <div
          style={{
            height: 76,
            marginTop: 16,
            borderRadius: 16,
            background: C.green,
            color: "#fff",
            fontWeight: 700,
            fontSize: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Entrar na lista
        </div>
      </div>
    </Pop>
    <Pop delay={34}>
      <p style={{ marginTop: 26, fontSize: 28, color: C.muted }}>
        Lista de espera · sem spam
      </p>
    </Pop>
  </VScene>
);

/* ---------- V3: Fatura Projetada ---------- */
export const V3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const val = interpolate(frame, [22, 86], [0, 2180], clamp);
  const cardSp = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  const cardY = interpolate(cardSp, [0, 1], [80, 0]);
  const bars = [
    { m: "jun", v: 1240 },
    { m: "jul", v: 1180 },
    { m: "ago", v: 980 },
    { m: "set", v: 760 },
    { m: "out", v: 450 },
    { m: "nov", v: 300 },
  ];
  const botText = stream(
    "Registrado ✓ mais R$ 300/mês até abr/2027. Fatura projetada: R$ 2.180.",
    26,
    frame
  );
  return (
    <VScene duration={160}>
      {/* chat snippet (topo) */}
      <div
        style={{
          width: "100%",
          background: "#E5DDD5",
          borderRadius: 24,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <Pop>
          <Bubble side="out" style={{ fontSize: 26, padding: "14px 18px" }}>
            comprei uma TV em 10x de 300
          </Bubble>
        </Pop>
        {frame >= 24 && (
          <Bubble side="in" style={{ fontSize: 26, padding: "14px 18px" }}>
            {botText}
          </Bubble>
        )}
      </div>

      {/* fatura card (sobe de baixo) */}
      <div
        style={{
          width: "100%",
          marginTop: 26,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 28,
          padding: 36,
          textAlign: "left",
          boxShadow: "0 30px 70px -30px rgba(17,24,39,.25)",
          transform: `translateY(${cardY}px)`,
          opacity: cardSp,
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
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            Fatura projetada
          </span>
          <span
            style={{
              background: C.amberChip,
              color: C.amber,
              fontSize: 22,
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: 999,
            }}
          >
            fecha em 4 dias
          </span>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 96,
            fontWeight: 800,
            marginTop: 10,
          }}
        >
          R$ {fmt(val)}
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginBottom: 24 }}>
          vs. R$ 1.990 no mês passado
        </div>
        {bars.map((b, i) => {
          const w = interpolate(
            frame,
            [40 + i * 7, 74 + i * 7],
            [0, (b.v / 1240) * 100],
            clamp
          );
          return (
            <div
              key={b.m}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 14,
              }}
            >
              <span
                style={{ width: 56, fontFamily: MONO, fontSize: 24, color: C.muted }}
              >
                {b.m}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 18,
                  borderRadius: 999,
                  background: "#EFEEE9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${w}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: C.green,
                  }}
                />
              </div>
              <span
                style={{
                  width: 92,
                  textAlign: "right",
                  fontFamily: MONO,
                  fontSize: 24,
                }}
              >
                {fmt(b.v)}
              </span>
            </div>
          );
        })}
      </div>
    </VScene>
  );
};

/* ---------- V4: Como Funciona ---------- */
export const V4: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = [
    { n: "01", t: "Manda no zap" },
    { n: "02", t: "Vê a fatura projetada" },
    { n: "03", t: "É avisado antes de fechar" },
  ];
  const lineH = interpolate(frame, [16, 86], [0, 100], clamp);
  return (
    <VScene duration={130}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: C.green,
        }}
      >
        Como funciona
      </p>
      <div
        style={{
          position: "relative",
          marginTop: 40,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            bottom: 40,
            left: "50%",
            width: 3,
            transform: "translateX(-50%)",
            background: C.border,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            width: 3,
            transform: "translateX(-50%)",
            height: `calc((100% - 80px) * ${lineH / 100})`,
            background: C.green,
          }}
        />
        {steps.map((s, i) => (
          <Pop key={s.n} delay={10 + i * 18}>
            <div
              style={{
                width: 720,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 22,
                padding: 30,
                boxShadow: "0 14px 36px -20px rgba(17,24,39,.3)",
                display: "flex",
                alignItems: "center",
                gap: 22,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 44,
                  fontWeight: 800,
                  color: C.green,
                  width: 70,
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 38, fontWeight: 700 }}>{s.t}</div>
            </div>
          </Pop>
        ))}
      </div>
      <Pop delay={70}>
        <p style={{ marginTop: 40, fontSize: 30, color: C.muted }}>
          Sem planilha. Sem abrir 5 apps.
        </p>
      </Pop>
    </VScene>
  );
};

/* ---------- V5: Recursos ---------- */
export const V5: React.FC = () => {
  const pills = ["Todos", "Controle", "Alertas"];
  const cards = [
    "Fatura projetada em tempo real",
    "Mapa de parcelas futuras",
    "Alerta no WhatsApp",
    "Cartões ilimitados",
    "Captura de compras pelo WhatsApp",
    "Garantia de 7 dias",
  ];
  return (
    <VScene duration={140}>
      <Pop>
        <h2 style={{ fontSize: 50, fontWeight: 800, letterSpacing: -1 }}>
          Tudo que importa do seu cartão, num lugar só.
        </h2>
      </Pop>
      <Pop delay={8}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "30px 0 30px" }}>
          {pills.map((p, i) => (
            <span
              key={p}
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 600,
                background: i === 0 ? C.green : "#fff",
                color: i === 0 ? "#fff" : C.muted,
                border: `1px solid ${i === 0 ? C.green : C.border}`,
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </Pop>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          width: "100%",
        }}
      >
        {cards.map((c, i) => (
          <Pop key={c} delay={14 + i * 7}>
            <div
              style={{
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: 24,
                height: 190,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "left",
              }}
            >
              <Check size={34} />
              <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.2 }}>
                {c}
              </div>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: C.green,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Incluído
              </span>
            </div>
          </Pop>
        ))}
      </div>
    </VScene>
  );
};

/* ---------- V6: Tudo no WhatsApp ---------- */
export const V6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const chips = ["Fatura projetada", "Alertas", "Parcelas", "Cartões ilimitados"];
  return (
    <VScene duration={120}>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 44 }}>
        {chips.slice(0, 2).map((ch, i) => (
          <Pop key={ch} delay={20 + i * 8} y={0}>
            <span style={chipStyle}>{ch}</span>
          </Pop>
        ))}
      </div>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 44,
          background: C.wa,
          color: "#fff",
          fontSize: 100,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sp})`,
          boxShadow: "0 30px 70px -20px rgba(37,211,102,.6)",
        }}
      >
        C
      </div>
      <Pop delay={10}>
        <h1 style={{ fontSize: 72, fontWeight: 800, letterSpacing: -1.5, marginTop: 44 }}>
          Seu cartão, direto no WhatsApp
        </h1>
      </Pop>
      <Pop delay={18}>
        <p style={{ fontSize: 32, color: C.muted, marginTop: 16 }}>
          Sem baixar nada · Sem conectar banco · Sem planilha
        </p>
      </Pop>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 44 }}>
        {chips.slice(2).map((ch, i) => (
          <Pop key={ch} delay={30 + i * 8} y={0}>
            <span style={chipStyle}>{ch}</span>
          </Pop>
        ))}
      </div>
    </VScene>
  );
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

/* ---------- V7: Plano Fundador Combo ---------- */
export const V7: React.FC = () => {
  const frame = useCurrentFrame();
  const benefits = [
    "Cartões ilimitados",
    "Fatura em tempo real",
    "Mapa de parcelas",
    "Alertas antes do fechamento",
    "Captura pelo WhatsApp",
  ];
  const words = ["✦", "Vagas", "de", "Fundador", "✦"];
  return (
    <VScene duration={180} back={<><VGrid opacity={0.05} /><VParticles n={18} /></>}>
      {frame < 64 && (
        <div
          style={{
            width: interpolate(frame, [0, 40], [0, 320], clamp),
            height: interpolate(frame, [0, 40], [0, 320], clamp),
            borderRadius: 999,
            border: `4px solid ${C.green}`,
            opacity: interpolate(frame, [10, 50], [0.8, 0], clamp),
          }}
        />
      )}
      {frame >= 56 && frame < 122 && (
        <div>
          <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
            {words.map((w, i) => (
              <Pop key={i} delay={56 + i * 6}>
                <span
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    color: i === 0 || i === 4 ? C.green : C.text,
                  }}
                >
                  {w}
                </span>
              </Pop>
            ))}
          </div>
          <Pop delay={80}>
            <div style={{ fontSize: 96, fontWeight: 800, marginTop: 28 }}>
              R$ 149,90
              <span style={{ fontSize: 40, color: C.muted }}>/ano</span>
            </div>
          </Pop>
          <Pop delay={90}>
            <div style={{ fontFamily: MONO, fontSize: 32, color: C.muted }}>
              ≈ R$ 12,49/mês
            </div>
          </Pop>
        </div>
      )}
      {frame >= 120 && (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start", width: "fit-content", margin: "0 auto" }}>
            {benefits.map((b, i) => (
              <Pop key={b} delay={120 + i * 6}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Check size={34} />
                  <span style={{ fontSize: 36 }}>{b}</span>
                </div>
              </Pop>
            ))}
          </div>
          <Pop delay={150}>
            <p style={{ marginTop: 40, fontSize: 28, color: C.muted }}>
              Pix · Cartão em até 12x · Garantia de 7 dias
            </p>
          </Pop>
        </div>
      )}
    </VScene>
  );
};

/* ---------- V8: Waitlist CTA (dark) ---------- */
export const V8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const rot = interpolate(sp, [0, 1], [-180, 0]);
  const pulse = 1 + Math.sin(frame / 7) * 0.03;
  const orbit = frame * 2;
  return (
    <VScene
      duration={120}
      bg={C.dark}
      back={<><VGrid color="#1FA855" opacity={0.06} /><VParticles n={16} color="#1FA855" /></>}
    >
      <Pop>
        <p
          style={{
            fontFamily: MONO,
            fontSize: 26,
            letterSpacing: 4,
            color: "#34D399",
            textTransform: "uppercase",
          }}
        >
          Produto em validação
        </p>
      </Pop>
      {/* logo + checks orbitando */}
      <div style={{ position: "relative", width: 220, height: 220, margin: "44px 0" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${orbit}deg)`,
          }}
        >
          {[0, 120, 240].map((a) => (
            <div
              key={a}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `rotate(${a}deg) translateX(140px) rotate(${-a - orbit}deg)`,
              }}
            >
              <Check size={40} />
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 150,
            height: 150,
            marginLeft: -75,
            marginTop: -75,
            borderRadius: 36,
            background: C.green,
            color: "#fff",
            fontSize: 80,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `rotate(${rot}deg) scale(${sp})`,
          }}
        >
          C
        </div>
      </div>
      <Pop delay={16}>
        <h1 style={{ fontSize: 60, fontWeight: 800, color: "#fff", transform: `scale(${pulse})` }}>
          Entrar na lista de fundador
        </h1>
      </Pop>
      <Pop delay={26}>
        <div
          style={{
            marginTop: 34,
            fontFamily: MONO,
            fontSize: 32,
            color: "#E5E7EB",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.15)",
            borderRadius: 16,
            padding: "18px 34px",
          }}
        >
          cartao-zap.vercel.app
        </div>
      </Pop>
    </VScene>
  );
};
