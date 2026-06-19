import { Composition } from "remotion";
import { Reel } from "./Reel";
import { Promo } from "./Promo";
import { PromoVertical } from "./PromoVertical";

export const RemotionRoot = () => {
  return (
    <>
      {/* Reel vertical para redes (9:16) */}
      <Composition
        id="Reel1"
        component={Reel}
        durationInFrames={600} // 20s
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Vídeo institucional / explainer (1080x700, ~37s) */}
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={1120} // ~37.3s
        fps={30}
        width={1080}
        height={700}
      />
      {/* Versão vertical 9:16 para TikTok / Instagram Reels */}
      <Composition
        id="PromoVertical"
        component={PromoVertical}
        durationInFrames={1120} // ~37.3s
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
