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
import { V1, V2, V3, V4, V5, V6, V7, V8 } from "./promo/scenes-vertical";

const HAS_MUSIC = true;

// Grão/ruído sutil em todo o vídeo (textura premium).
const Grain: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      opacity: 0.04,
      mixBlendMode: "overlay",
      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
      backgroundSize: "160px 160px",
    }}
  />
);

const SCENES: { C: React.FC; d: number }[] = [
  { C: V1, d: 120 },
  { C: V2, d: 150 },
  { C: V3, d: 160 },
  { C: V4, d: 130 },
  { C: V5, d: 140 },
  { C: V6, d: 120 },
  { C: V7, d: 180 },
  { C: V8, d: 120 },
];

export const PromoVertical: React.FC = () => {
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
              [0, fps, durationInFrames - 2 * fps, durationInFrames],
              [0, 0.4, 0.4, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          }
        />
      )}
    </AbsoluteFill>
  );
};
