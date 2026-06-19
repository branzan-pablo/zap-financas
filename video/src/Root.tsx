import { Composition } from "remotion";
import { Reel } from "./Reel";

// Cada Reel é uma composição vertical 1080x1920 (9:16), 30fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Reel1"
        component={Reel}
        durationInFrames={600} // 20s
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
