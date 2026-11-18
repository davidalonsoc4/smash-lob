// Miniatura horizontal 16:9 (1920x1080) para los vídeos de la serie. Mismo sistema visual: fondo oscuro, acento dorado, logo a la derecha.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FONT, makeTheme } from "./kit";

export type MiniProps = { kicker: string; title: string; logo: string; num?: string; badge?: string };
const t = makeTheme("#d7a544");

const Title: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ fontSize: 138, fontWeight: 900, lineHeight: 1.04, letterSpacing: -2 }}>
    {text.split("\n").map((line, i) => (
      <div key={i}>{line.split("*").map((p, k) => <span key={k} style={{ color: k % 2 ? t.accent : t.text }}>{p}</span>)}</div>
    ))}
  </div>
);

export const Miniatura: React.FC<MiniProps> = ({ kicker, title, logo, num, badge }) => (
  <AbsoluteFill style={{ background: t.bg, fontFamily: FONT, color: t.text }}>
    <div style={{ position: "absolute", right: -260, top: -260, width: 1300, height: 1300, borderRadius: "50%", background: t.accent, opacity: 0.16, filter: "blur(150px)" }} />
    <div style={{ position: "absolute", left: -300, bottom: -420, width: 1100, height: 800, borderRadius: "50%", background: t.accent, opacity: 0.07, filter: "blur(150px)" }} />
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
      {Array.from({ length: 10 }).map((_, i) => <line key={i} x1={0} x2={1920} y1={i * 120} y2={i * 120} stroke={t.text} strokeWidth={2} />)}
    </svg>
    <div style={{ position: "absolute", left: 110, top: 100, display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 6, color: t.textMuted }}>SMASH <span style={{ color: t.accent }}>&</span> LOB</div>
      {badge && <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, color: t.textSubtle }}>· {badge}</div>}
    </div>
    <div style={{ position: "absolute", left: 110, top: 230, width: 1150 }}>
      <div style={{ display: "inline-block", border: `4px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 44px", fontSize: 46, fontWeight: 900, letterSpacing: 6 }}>{kicker}</div>
      <div style={{ height: 50 }} />
      <Title text={title} />
    </div>
    <div style={{ position: "absolute", right: 150, top: 230, width: 520, height: 620, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: `5px solid ${t.accent}`, opacity: 0.35 }} />
      <Img src={staticFile(logo)} style={{ width: 440, height: 440, objectFit: "contain", borderRadius: logo === "logo.png" ? 100 : 0, filter: `drop-shadow(0 0 70px ${t.accent}aa)` }} />
    </div>
    {num && <div style={{ position: "absolute", right: 110, bottom: 70, fontSize: 40, fontWeight: 900, letterSpacing: 6, color: t.textSubtle }}>{num}</div>}
  </AbsoluteFill>
);
