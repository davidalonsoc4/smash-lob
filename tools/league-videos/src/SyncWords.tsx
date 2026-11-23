// Palabras que aparecen EN EL INSTANTE en que las dice la voz (en vez de un escalonado fijo) + cierre sincronizado con la voz.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, TimedWord, Words, pop, sfx, useTheme } from "./kit";
import type { LeagueConfig } from "./Bienvenida";

const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wfn = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };

/** text: líneas separadas por \n; *acento*; frames[i] = cuadro (del frame actual) en que se dice la palabra i. */
export const SyncWords: React.FC<{ text: string; frames: number[]; size?: number }> = ({ text, frames, size = 100 }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  let i = 0; let inAccent = false;
  return (
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -3, textAlign: "center" }}>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", gap: size * 0.22 }}>
          {line.split(" ").map((w) => {
            if (w.startsWith("*")) inAccent = true;
            const accent = inAccent; const word = w.replace(/\*/g, "");
            if (w.endsWith("*")) inAccent = false;
            const p = pop(f, fps, (frames[i++] ?? 0) - 3);
            return <span key={`${li}-${i}`} style={{ display: "inline-block", color: accent ? t.accent : t.text, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 90}px) scale(${0.5 + p * 0.5}) rotate(${(1 - p) * -6}deg)` }}>{word}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

/** Cierre estándar, pero con cada palabra de «Nos vemos en la pista» saliendo cuando la dice la voz. */
export const OutroSync: React.FC<{ league: LeagueConfig; ws: TimedWord[] }> = ({ league, ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const nF = wfn(ws, "pista");
  const bounce = Math.abs(Math.sin((f - nF) / 7)) * 60 * Math.exp(-Math.max(0, f - nF) / 40);
  const fr = [wfn(ws, "nos"), wfn(ws, "vemos"), wfn(ws, "en", 1) || wfn(ws, "en"), wfn(ws, "la"), nF];
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 30 }} />
      <SyncWords text={"Nos vemos\n*en la pista*"} frames={fr} size={124} />
      <div style={{ marginTop: 40, opacity: pop(f, fps, nF, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {sfx("ding", nF, 0.5)}
    </Frame>
  );
};
void Words;
