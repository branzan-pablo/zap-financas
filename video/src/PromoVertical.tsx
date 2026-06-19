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
import {
  V1,
  V2,
  V3,
  V4,
  V5,
  V6,
  V7,
  V8,
} from "./promo/scenes-vertical";

// Coloque a trilha em video/public/audio/music.mp3 e troque para true.
const HAS_MUSIC = false;

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
