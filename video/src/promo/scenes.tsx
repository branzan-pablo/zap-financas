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
import {
  Bubble,
  BrowserWindow,
  Check,
  PhoneFrame,
  Pop,
  SceneWrap,
} from "./components";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const stream = (text: string, start: number, frame: number, cps = 0.7) =>
  text.slice(0, Math.max(0, Math.floor((frame - start) * cps)));

const Grid: React.FC<{ color?: string; opacity?: number }> = ({
  color = "#15803D",
  opacity = 0.05,
}) => (
  <AbsoluteFill
    style={{
      opacity,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}
  />
);

const Particles: React.FC<{ n?: number; color?: string }> = ({
  n = 18,
  color = C.green,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({ length: n }).map((_, i) => {
        const x = random(`px${i}`) * 1080;
        const baseY = random(`py${i}`) * 700;
        const y = (baseY - frame * (0.4 + random(`pv${i}`))) % 700;
        const s = 3 + random(`ps${i}`) * 5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: (y + 700) % 700,
              width: s,
              height: s,
              borderRadius: 999,
              background: color,
              opacity: 0.15 + random(`po${i}`) * 0.25,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// Chip flutuante: É o próprio elemento absoluto (sem wrapper com transform,
// que quebraria o posicionamento). Anima só opacity + leve translateY.
const FloatingChip: React.FC<{
  label: string;
  style: React.CSSProperties;
  delay: number;
}> = ({ label, style, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`,
        background: C.greenChip,
        color: C.green,
        fontWeight: 700,
        fontSize: 16,
        padding: "8px 16px",
        borderRadius: 999,
        border: `1px solid ${C.green}33`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

/* ---------- Scene 1: WhatsApp Boot ---------- */
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 200 } });
  const ty = interpolate(sp, [0, 1], [700, 0]);
  const rotX = interpolate(sp, [0, 1], [20, 8]);
  const rotY = Math.sin(frame / 18) * 3;
  const typed = frame >= 30 ? "" : "oi".slice(0, Math.max(0, Math.min(2, frame - 22)));
  const feats = [
    "Registro de compras parceladas",
    "Fatura projetada em tempo real",
    "Alerta antes do fechamento",
    "Mapa de parcelas futuras",
  ];
  return (
    <SceneWrap duration={120}>
      <div style={{ perspective: 1400 }}>
        <div
          style={{
            transform: `translateY(${ty}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <PhoneFrame height={600}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                gap: 7,
                padding: "12px 10px 56px",
                overflow: "hidden",
              }}
            >
              {frame >= 30 && (
                <Pop delay={0}>
                  <Bubble side="out">oi</Bubble>
                </Pop>
              )}
              {frame >= 42 && (
                <Pop>
                  <Bubble side="in">
                    <b>CartãoZap conectado ✓</b>
                  </Bubble>
                </Pop>
              )}
              {feats.map((f, i) =>
                frame >= 56 + i * 12 ? (
                  <Pop key={f}>
                    <Bubble side="in">
                      <span style={{ color: C.green, fontWeight: 700 }}>✓</span>{" "}
                      {f}
                    </Bubble>
                  </Pop>
                ) : null
              )}
            </div>
            {/* input bar */}
            <div
              style={{
                position: "absolute",
                left: 8,
                right: 8,
                bottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "#fff",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: typed ? C.text : "#9aa3b2",
                }}
              >
                {typed || "Mensagem"}
              </div>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "#1FA855",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                ➤
              </div>
            </div>
          </PhoneFrame>
        </div>
      </div>
    </SceneWrap>
  );
};

/* ---------- Scene 2: Home / Hero ---------- */
export const Scene2: React.FC = () => (
  <SceneWrap duration={150}>
    <BrowserWindow width={960}>
      <div style={{ padding: "60px 40px 70px", textAlign: "center" }}>
        <Pop delay={0}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 22,
              fontWeight: 800,
              color: C.text,
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: C.green,
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
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
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: -1.5,
              margin: "22px 0 0",
              color: C.text,
            }}
          >
            Saiba sua fatura <span style={{ color: C.green }}>antes</span> dela
            fechar.
          </h1>
        </Pop>
        <Pop delay={22}>
          <div
            style={{
              margin: "34px auto 0",
              display: "flex",
              gap: 10,
              maxWidth: 460,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                background: "#fff",
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                color: C.muted,
                fontSize: 16,
              }}
            >
              seu@email.com
            </div>
            <div
              style={{
                height: 50,
                borderRadius: 12,
                background: C.green,
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                padding: "0 22px",
              }}
            >
              Entrar na lista
            </div>
          </div>
        </Pop>
        <Pop delay={32}>
          <p style={{ marginTop: 16, fontSize: 13, color: C.muted }}>
            Lista de espera · sem spam
          </p>
        </Pop>
      </div>
    </BrowserWindow>
  </SceneWrap>
);

/* ---------- Scene 3: Fatura Projetada ---------- */
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const val = interpolate(frame, [18, 78], [0, 2180], clamp);
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
    30,
    frame
  );
  return (
    <SceneWrap duration={160}>
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <PhoneFrame height={560}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "14px 10px",
            }}
          >
            <Pop>
              <Bubble side="out">comprei uma TV em 10x de 300</Bubble>
            </Pop>
            {frame >= 28 && (
              <Bubble side="in">{botText}</Bubble>
            )}
          </div>
        </PhoneFrame>

        <div
          style={{
            width: 560,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            padding: 32,
            boxShadow: "0 30px 70px -30px rgba(17,24,39,.25)",
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
                fontSize: 13,
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
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
              }}
            >
              fecha em 4 dias
            </span>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 56,
              fontWeight: 800,
              color: C.text,
              marginTop: 8,
            }}
          >
            R$ {fmt(val)}
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 18 }}>
            vs. R$ 1.990 no mês passado
          </div>
          {bars.map((b, i) => {
            const w = interpolate(
              frame,
              [34 + i * 7, 66 + i * 7],
              [0, (b.v / 1240) * 100],
              clamp
            );
            return (
              <div
                key={b.m}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 9,
                }}
              >
                <span
                  style={{
                    width: 30,
                    fontFamily: MONO,
                    fontSize: 12,
                    color: C.muted,
                  }}
                >
                  {b.m}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
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
                    width: 52,
                    textAlign: "right",
                    fontFamily: MONO,
                    fontSize: 12,
                    color: C.text,
                  }}
                >
                  {fmt(b.v)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </SceneWrap>
  );
};

/* ---------- Scene 4: Como Funciona ---------- */
export const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = [
    { n: "01", t: "Manda no zap" },
    { n: "02", t: "Vê a fatura projetada" },
    { n: "03", t: "É avisado antes de fechar" },
  ];
  const lineW = interpolate(frame, [20, 80], [0, 100], clamp);
  return (
    <SceneWrap duration={130}>
      <BrowserWindow width={980}>
        <div style={{ padding: "56px 48px 64px" }}>
          <Pop>
            <p
              style={{
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: C.green,
                textAlign: "center",
              }}
            >
              Como funciona
            </p>
          </Pop>
          <div
            style={{ position: "relative", marginTop: 40, padding: "0 30px" }}
          >
            <div
              style={{
                position: "absolute",
                top: 26,
                left: 90,
                right: 90,
                height: 2,
                background: C.border,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 26,
                left: 90,
                width: `calc((100% - 180px) * ${lineW / 100})`,
                height: 2,
                background: C.green,
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 24,
                justifyContent: "space-between",
              }}
            >
              {steps.map((s, i) => (
                <Pop key={s.n} delay={10 + i * 16}>
                  <div
                    style={{
                      width: 250,
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: 24,
                      boxShadow: "0 10px 30px -18px rgba(17,24,39,.3)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 26,
                        fontWeight: 800,
                        color: C.green,
                      }}
                    >
                      {s.n}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        marginTop: 8,
                        color: C.text,
                      }}
                    >
                      {s.t}
                    </div>
                  </div>
                </Pop>
              ))}
            </div>
          </div>
          <Pop delay={64}>
            <p
              style={{
                textAlign: "center",
                marginTop: 40,
                fontSize: 18,
                color: C.muted,
              }}
            >
              Sem planilha. Sem abrir 5 apps.
            </p>
          </Pop>
        </div>
      </BrowserWindow>
    </SceneWrap>
  );
};

/* ---------- Scene 5: Recursos ---------- */
export const Scene5: React.FC = () => {
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
    <SceneWrap duration={140}>
      <BrowserWindow width={980}>
        <div style={{ padding: "44px 44px 52px" }}>
          <Pop>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                textAlign: "center",
                color: C.text,
                letterSpacing: -0.5,
              }}
            >
              Tudo que importa do seu cartão, num lugar só.
            </h2>
          </Pop>
          <Pop delay={8}>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                margin: "20px 0 26px",
              }}
            >
              {pills.map((p, i) => (
                <span
                  key={p}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 999,
                    fontSize: 13,
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
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {cards.map((c, i) => (
              <Pop key={c} delay={14 + i * 7}>
                <div
                  style={{
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: 18,
                    height: 96,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Check size={22} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                    {c}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
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
        </div>
      </BrowserWindow>
    </SceneWrap>
  );
};

/* ---------- Scene 6: Tudo no WhatsApp ---------- */
export const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const chips = ["Fatura projetada", "Alertas", "Parcelas", "Cartões ilimitados"];
  // Cantos, fora da faixa central (logo + título + subtítulo ficam em ~30%–72%).
  const pos = [
    { left: "7%", top: "13%" },
    { left: "70%", top: "13%" },
    { left: "9%", top: "84%" },
    { left: "68%", top: "84%" },
  ];
  return (
    <SceneWrap duration={120}>
      {chips.map((ch, i) => (
        <FloatingChip key={ch} label={ch} style={pos[i]} delay={20 + i * 10} />
      ))}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 28,
            background: C.wa,
            color: "#fff",
            fontSize: 60,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            transform: `scale(${sp})`,
            boxShadow: "0 20px 50px -16px rgba(37,211,102,.6)",
          }}
        >
          C
        </div>
        <Pop delay={10}>
          <h1
            style={{
              fontSize: 50,
              fontWeight: 800,
              marginTop: 28,
              color: C.text,
              letterSpacing: -1,
            }}
          >
            Seu cartão, direto no WhatsApp
          </h1>
        </Pop>
        <Pop delay={18}>
          <p style={{ fontSize: 20, color: C.muted, marginTop: 10 }}>
            Sem baixar nada · Sem conectar banco · Sem planilha
          </p>
        </Pop>
      </div>
    </SceneWrap>
  );
};

/* ---------- Scene 7: Plano Fundador Combo ---------- */
export const Scene7: React.FC = () => {
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
    <SceneWrap duration={180}>
      <Grid opacity={0.05} />
      <Particles n={16} />
      {/* (a) burst 0-60 */}
      {frame < 64 && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: interpolate(frame, [0, 40], [0, 240], clamp),
              height: interpolate(frame, [0, 40], [0, 240], clamp),
              borderRadius: 999,
              border: `3px solid ${C.green}`,
              opacity: interpolate(frame, [10, 50], [0.8, 0], clamp),
              margin: "0 auto",
            }}
          />
        </div>
      )}
      {/* (b) title + price 60-120 */}
      {frame >= 56 && frame < 122 && (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            {words.map((w, i) => (
              <Pop key={i} delay={56 + i * 6}>
                <span
                  style={{
                    fontSize: 34,
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
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: C.text,
                marginTop: 16,
              }}
            >
              R$ 149,90<span style={{ fontSize: 26, color: C.muted }}>/ano</span>
            </div>
          </Pop>
          <Pop delay={90}>
            <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted }}>
              ≈ R$ 12,49/mês
            </div>
          </Pop>
        </div>
      )}
      {/* (c) benefits 120-180 */}
      {frame >= 120 && (
        <div style={{ textAlign: "center", width: 720 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 30px",
              textAlign: "left",
            }}
          >
            {benefits.map((b, i) => (
              <Pop key={b} delay={120 + i * 6}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <Check size={22} />
                  <span style={{ fontSize: 19, color: C.text }}>{b}</span>
                </div>
              </Pop>
            ))}
          </div>
          <Pop delay={150}>
            <p style={{ marginTop: 26, fontSize: 16, color: C.muted }}>
              Pix · Cartão em até 12x · Garantia de 7 dias
            </p>
          </Pop>
        </div>
      )}
    </SceneWrap>
  );
};

/* ---------- Scene 8: Waitlist CTA (dark) ---------- */
export const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const rot = interpolate(sp, [0, 1], [-180, 0]);
  const pulse = 1 + Math.sin(frame / 7) * 0.03;
  return (
    <SceneWrap duration={120} bg={C.dark}>
      <Grid color="#1FA855" opacity={0.06} />
      <Particles n={14} color="#1FA855" />
      <div style={{ textAlign: "center" }}>
        <Pop>
          <p
            style={{
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: 3,
              color: "#34D399",
              textTransform: "uppercase",
            }}
          >
            Produto em validação
          </p>
        </Pop>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: C.green,
            color: "#fff",
            fontSize: 52,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "24px auto",
            transform: `rotate(${rot}deg) scale(${sp})`,
          }}
        >
          C
        </div>
        <Pop delay={16}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#fff",
              transform: `scale(${pulse})`,
            }}
          >
            Entrar na lista de fundador
          </h1>
        </Pop>
        <Pop delay={26}>
          <div
            style={{
              marginTop: 22,
              display: "inline-block",
              fontFamily: MONO,
              fontSize: 18,
              color: "#E5E7EB",
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.15)",
              borderRadius: 12,
              padding: "12px 22px",
            }}
          >
            cartao-zap.vercel.app
          </div>
        </Pop>
      </div>
    </SceneWrap>
  );
};
