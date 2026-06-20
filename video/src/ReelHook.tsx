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
import { S1Hook, S2Phone, S3Cta } from "./promo/scenes-short";

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

export const ReelHook: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Series>
        <Series.Sequence durationInFrames={90}>
          <S1Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <S2Phone />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <S3Cta />
        </Series.Sequence>
      </Series>

      <Grain />

      <Audio
        src={staticFile("audio/music.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, fps, durationInFrames - 1.5 * fps, durationInFrames],
            [0, 0.4, 0.4, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          )
        }
      />
    </AbsoluteFill>
  );
};
