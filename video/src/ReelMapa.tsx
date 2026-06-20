import React from "react";
import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { C } from "./promo/theme";
import { M1, M2, M3, M4 } from "./promo/scenes-mapa";

const HAS_MUSIC = true;

// Grão/ruído sutil (3%) em todo o vídeo — textura premium.
const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity: 0.03,
      mixBlendMode: "overlay",
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
      backgroundSize: "160px 160px",
    }}
  />
);

// Hook (100) · Compra esquecida (90) · Mapa de parcelas (130) · CTA (100) = 420 frames.
const SCENES: { C: React.FC; d: number }[] = [
  { C: M1, d: 100 },
  { C: M2, d: 90 },
  { C: M3, d: 130 },
  { C: M4, d: 100 },
];

export const ReelMapa: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Series>
        {SCENES.map((s, i) => {
          const Comp = s.C;
          return (
            <Series.Sequence key={i} durationInFrames={s.d}>
              <Comp />
            </Series.Sequence>
          );
        })}
      </Series>

      <Grain />

      {HAS_MUSIC && (
        <Audio
          src={staticFile("audio/music.mp3")}
          volume={(f) =>
            interpolate(
              f,
              // fade-in 1s, fade-out 1.5s, volume 40%.
              [0, fps, durationInFrames - 1.5 * fps, durationInFrames],
              [0, 0.4, 0.4, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          }
        />
      )}
    </AbsoluteFill>
  );
};
