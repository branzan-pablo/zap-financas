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
  Scene1,
  Scene2,
  Scene3,
  Scene4,
  Scene5,
  Scene6,
  Scene7,
  Scene8,
} from "./promo/scenes";

// Coloque a trilha em video/public/audio/music.mp3 e troque para true.
const HAS_MUSIC = false;

const SCENES: { C: React.FC; d: number }[] = [
  { C: Scene1, d: 120 },
  { C: Scene2, d: 150 },
  { C: Scene3, d: 160 },
  { C: Scene4, d: 130 },
  { C: Scene5, d: 140 },
  { C: Scene6, d: 120 },
  { C: Scene7, d: 180 },
  { C: Scene8, d: 120 },
];

export const Promo: React.FC = () => {
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
