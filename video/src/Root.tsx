import { Composition } from "remotion";
import { Reel } from "./Reel";
import { Promo } from "./Promo";
import { PromoVertical } from "./PromoVertical";
import { ReelHook } from "./ReelHook";
import { ReelMapa } from "./ReelMapa";

export const RemotionRoot = () => {
  return (
    <>
      {/* Reel curto vertical (9:16) — 4 cenas, ~16s, para TikTok/Reels */}
      <Composition
        id="Reel1"
        component={Reel}
        durationInFrames={480} // 140+100+140+100 = 480 (~16s @ 30fps)
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
      {/* Reel curto 9:16 (hook -> reveal -> CTA), ~10s */}
      <Composition
        id="ReelHook"
        component={ReelHook}
        durationInFrames={300} // 10s
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Reel 9:16 "Mapa de parcelas" (hook -> compra esquecida -> mapa -> CTA), ~14s */}
      <Composition
        id="ReelMapa"
        component={ReelMapa}
        durationInFrames={420} // 14s (100+90+130+100)
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
