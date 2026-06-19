import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Paleta da marca (mesma da landing)
const INK = "#0c1322";
const PAPER = "#f7f6f1";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";
const SLATE = "#9aa3b2";

const FONT =
  'Inter, "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';

// Texto que sobe e aparece (entrada com mola)
const FadeUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(p, [0, 1], [50, 0]);
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

const Scene: React.FC<{ children: React.ReactNode; bg?: string }> = ({
  children,
  bg = INK,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: bg,
      fontFamily: FONT,
      padding: 90,
      justifyContent: "center",
      alignItems: "flex-start",
    }}
  >
    {children}
  </AbsoluteFill>
);

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {/* Cena 1 — gancho */}
      <Sequence durationInFrames={150}>
        <Scene>
          <FadeUp>
            <p style={{ color: SLATE, fontSize: 44, fontWeight: 600 }}>
              presta atenção 👇
            </p>
          </FadeUp>
          <FadeUp delay={12}>
            <h1
              style={{
                color: PAPER,
                fontSize: 120,
                fontWeight: 800,
                lineHeight: 1.02,
                margin: "24px 0 0",
                letterSpacing: -2,
              }}
            >
              Você não está duro.
            </h1>
          </FadeUp>
          <FadeUp delay={30}>
            <h1
              style={{
                color: EMERALD,
                fontSize: 120,
                fontWeight: 800,
                lineHeight: 1.02,
                margin: "8px 0 0",
                letterSpacing: -2,
              }}
            >
              Você está parcelado.
            </h1>
          </FadeUp>
        </Scene>
      </Sequence>
      {/* Cena 2 — a conta que assusta */}
      <Sequence from={150} durationInFrames={210}>
        <Scene bg={PAPER}>
          <FadeUp>
            <p style={{ color: SLATE, fontSize: 44, fontWeight: 600 }}>
              cada parcela parece pouco:
            </p>
          </FadeUp>
          {[
            "TV em 10x",
            "tênis em 6x",
            "conserto do carro em 4x",
          ].map((t, i) => (
            <FadeUp key={t} delay={15 + i * 14}>
              <p
                style={{
                  color: INK,
                  fontSize: 66,
                  fontWeight: 700,
                  margin: "18px 0 0",
                }}
              >
                {t}
              </p>
            </FadeUp>
          ))}
          <FadeUp delay={75}>
            <p
              style={{
                color: AMBER,
                fontSize: 96,
                fontWeight: 800,
                margin: "44px 0 0",
                letterSpacing: -1,
              }}
            >
              = R$ 1.240/mês
            </p>
          </FadeUp>
          <FadeUp delay={92}>
            <p style={{ color: INK, fontSize: 50, fontWeight: 600 }}>
              comprometidos nos próximos 6 meses 😳
            </p>
          </FadeUp>
        </Scene>
      </Sequence>
      {/* Cena 3 — virada */}
      <Sequence from={369} durationInFrames={150}>
        <Scene>
          <FadeUp>
            <h1
              style={{
                color: PAPER,
                fontSize: 104,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              Não é falta de dinheiro.
            </h1>
          </FadeUp>
          <FadeUp delay={22}>
            <h1
              style={{
                color: EMERALD,
                fontSize: 104,
                fontWeight: 800,
                lineHeight: 1.05,
                margin: "10px 0 0",
                letterSpacing: -2,
              }}
            >
              É falta de visão.
            </h1>
          </FadeUp>
        </Scene>
      </Sequence>
      {/* Cena 4 — CTA */}
      <Sequence from={510} durationInFrames={90}>
        <AbsoluteFill
          style={{
            backgroundColor: INK,
            fontFamily: FONT,
            justifyContent: "center",
            alignItems: "center",
            padding: 90,
            textAlign: "center",
          }}
        >
          <FadeUp>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 20,
                  backgroundColor: EMERALD,
                  color: "#fff",
                  fontSize: 50,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                C
              </div>
              <span style={{ color: PAPER, fontSize: 64, fontWeight: 800 }}>
                CartãoZap
              </span>
            </div>
          </FadeUp>
          <FadeUp delay={14}>
            <p
              style={{
                color: PAPER,
                fontSize: 58,
                fontWeight: 700,
                margin: "40px 0 0",
              }}
            >
              Controle seu cartão pelo WhatsApp.
            </p>
          </FadeUp>
          <FadeUp delay={26}>
            <p
              style={{
                color: EMERALD,
                fontSize: 48,
                fontWeight: 700,
                margin: "24px 0 0",
              }}
            >
              link na bio 🔗
            </p>
          </FadeUp>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
