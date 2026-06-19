import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, SANS } from "./theme";

// Transição de cena: fade + scale (0.95->1 na entrada, 1->0.95 na saída).
export const useInOut = (duration: number, inD = 14, outD = 14) => {
  const frame = useCurrentFrame();
  const opIn = interpolate(frame, [0, inD], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opOut = interpolate(frame, [duration - outD, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scaleIn = interpolate(frame, [0, inD], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scaleOut = interpolate(frame, [duration - outD, duration], [1, 0.95], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: Math.min(opIn, opOut), scale: Math.min(scaleIn, scaleOut) };
};

export const SceneWrap: React.FC<{
  duration: number;
  bg?: string;
  children: React.ReactNode;
}> = ({ duration, bg = C.bg, children }) => {
  const { opacity, scale } = useInOut(duration);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: SANS,
        color: C.text,
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Entrada com mola, com atraso opcional.
export const Pop: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 24, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Check: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = C.green,
}) => (
  <span
    style={{
      display: "inline-flex",
      width: size,
      height: size,
      borderRadius: 999,
      background: C.greenChip,
      color,
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.6,
      fontWeight: 800,
      flexShrink: 0,
    }}
  >
    ✓
  </span>
);

// Janela do navegador estilo mac (cream surface).
export const BrowserWindow: React.FC<{
  width?: number;
  url?: string;
  children: React.ReactNode;
}> = ({ width = 940, url = "cartao-zap.vercel.app", children }) => (
  <div
    style={{
      width,
      borderRadius: 16,
      background: C.surface,
      border: `1px solid ${C.border}`,
      boxShadow: "0 30px 70px -30px rgba(17,24,39,.25)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: 40,
        background: "#F3F2EE",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <span
          key={c}
          style={{ width: 12, height: 12, borderRadius: 999, background: c }}
        />
      ))}
      <div
        style={{
          marginLeft: 12,
          flex: 1,
          maxWidth: 360,
          height: 22,
          borderRadius: 999,
          background: "#fff",
          border: `1px solid ${C.border}`,
          fontSize: 12,
          color: C.muted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {url}
      </div>
    </div>
    <div style={{ background: C.bg }}>{children}</div>
  </div>
);

// Telefone iOS com cabeçalho do WhatsApp. children = área do chat.
export const PhoneFrame: React.FC<{
  height?: number;
  children: React.ReactNode;
}> = ({ height = 600, children }) => {
  const width = height * 0.49;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 46,
        background: "#0d0f14",
        padding: 9,
        boxShadow: "0 40px 80px -30px rgba(17,24,39,.45)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          width: 96,
          height: 22,
          borderRadius: 999,
          background: "#000",
          zIndex: 5,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 38,
          overflow: "hidden",
          background: "#E5DDD5",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header WhatsApp */}
        <div
          style={{
            background: "#1FA855",
            color: "#fff",
            padding: "34px 14px 10px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: "rgba(255,255,255,.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            C
          </span>
          <div style={{ flex: 1, lineHeight: 1.15 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              CartãoZap
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 999,
                  background: "#34b7f1",
                  fontSize: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✓
              </span>
            </div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>online</div>
          </div>
          <span style={{ fontSize: 18, opacity: 0.9 }}>⋮</span>
        </div>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Bubble: React.FC<{
  side: "in" | "out";
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ side, children, style }) => (
  <div
    style={{
      alignSelf: side === "out" ? "flex-end" : "flex-start",
      maxWidth: "82%",
      background: side === "out" ? "#D6F5CF" : "#fff",
      color: C.text,
      borderRadius: 12,
      borderTopRightRadius: side === "out" ? 2 : 12,
      borderTopLeftRadius: side === "in" ? 2 : 12,
      padding: "7px 10px",
      fontSize: 13,
      lineHeight: 1.35,
      boxShadow: "0 1px 1px rgba(17,24,39,.12)",
      ...style,
    }}
  >
    {children}
  </div>
);
