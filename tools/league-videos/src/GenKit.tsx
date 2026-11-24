// Utilidades comunes de los «Tutoriales genéricos» (sin liga ni jugadores reales): tiempos de la voz, etiqueta superior, ventana de móvil,
// avatares genéricos (Ana, Beto, Carla, Dani…) y cierre propio con llamada a la acción.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { COLORS, LOOKS, PlayerA, shade } from "./Avatars";
import { ease } from "./Presentacion2";
import { SCR_H, WIN_H, WIN_W, Z } from "./Presentacion3";
import { SyncWords } from "./SyncWords";

export const ACCENT = "#d7a544";
export const GEN_NAMES = ["Ana", "Beto", "Carla", "Dani", "Eli", "Fer", "Gus", "Hugo"];
export type VW = { w: string; s: number; e: number };

const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
export const mkTiming = (BOUNDS: number[], VOICE: VW[]) => {
  const wordsBetween = (i0: number, i1: number): TimedWord[] =>
    VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
  const sceneWords = (i: number) => wordsBetween(i, i + 1);
  const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
  const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
  const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
  return { wordsBetween, sceneWords, wf, B30, at };
};

export const win = (f: number, a: number, b: number) => Math.min(ease((f - a) / 12), 1 - ease((f - b) / 10)); // visible entre a y b
export const slideIn = (f: number, a: number) => (1 - ease((f - a) / 14)) * 40;

/** Avatar genérico (un color por jugador, sin raqueta) */
export const Av: React.FC<{ i: number; size?: number; ring?: string }> = ({ i, size = 90, ring }) => <PlayerA look={LOOKS[i % 8]} size={size} bg={shade(COLORS[i % 8], 0.55)} ring={ring} />;

/** Etiqueta superior que cambia (con fundido cruzado) según los cuadros indicados */
export const Tags: React.FC<{ tags: [number, string][]; endF: number }> = ({ tags, endF }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const i = f >= endF - 10 ? -2 : tags.reduce((a, [s0], k) => (f >= s0 ? k : a), -1);
  const k = i < 0 ? 0 : pop(f, fps, tags[i][0], 12);
  const prev = i > 0 ? tags[i - 1][1] : "";
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      {i >= 0 && <div style={{ position: "relative" }}>
        {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - k, ...pill }}>{prev}</div>}
        <div style={{ opacity: k, transform: `scale(${0.9 + 0.1 * k})`, ...pill }}>{tags[i][1]}</div>
      </div>}
    </div>
  );
};

export const ExampleLabel: React.FC<{ show: boolean }> = ({ show }) => {
  const t = useTheme();
  return show ? <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div> : null;
};

/** Ventana de móvil (880×1010) con la pantalla nativa (412 de ancho) escalada dentro */
export const PhoneWin: React.FC<{ inF: number; outF: number; top?: number; children: React.ReactNode; overlay?: React.ReactNode }> = ({ inF, outF, top = 300, children, overlay }) => {
  const t = useTheme(); const f = useCurrentFrame();
  const winIn = ease((f - inF) / 20), winOut = ease((f - outF) / 12);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn * (1 - winOut), transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
      <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})` }}>{children}</div>
        {overlay}
      </div>
    </div>
  );
};

/** Interruptor de la app */
export const Switch: React.FC<{ on: boolean; locked?: boolean }> = ({ on, locked }) => {
  const t = useTheme();
  return <div style={{ width: 50, height: 28, borderRadius: 999, background: on ? t.accent : t.mutedSurface, border: `2px solid ${on ? t.accent : t.borderStrong}`, position: "relative", opacity: locked ? 0.7 : 1 }}><div style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: on ? t.accentContrast : t.textSubtle }} /></div>;
};

/** Cierre propio: logo de la app + dos líneas (cada palabra, cuando la dice la voz) + pelota dorada en la última palabra */
export const GenOutro: React.FC<{ ws: TimedWord[]; line1: string; words1: string[]; line2?: string; words2?: string[]; lastWord: string }> = ({ ws, line1, words1, line2, words2, lastWord }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const find = (w: string) => { const m = ws.filter((x) => norm(x.w) === norm(w)); return (m[0] ?? { f: 0 }).f; };
  const lF = find(lastWord);
  const bounce = Math.abs(Math.sin((f - lF) / 7)) * 60 * Math.exp(-Math.max(0, f - lF) / 40);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile("logo.png")} style={{ width: 260, height: 260, borderRadius: 58, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})`, boxShadow: `0 0 80px ${t.accent}66` }} />
      <div style={{ height: 40 }} />
      <SyncWords text={line1} frames={words1.map(find)} size={118} />
      {line2 && words2 && <><div style={{ height: 24 }} /><SyncWords text={line2} frames={words2.map(find)} size={78} /></>}
      <div style={{ marginTop: 64, opacity: pop(f, fps, lF, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {sfx("ding", lF, 0.5)}
    </Frame>
  );
};

/** Cola sin voz (logo + pelota) para vídeos cuya última frase va dentro de la escena principal */
export const GenTail: React.FC<{ title?: string }> = ({ title }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame>
      <Img src={staticFile("logo.png")} style={{ width: 260, height: 260, borderRadius: 58, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})`, boxShadow: `0 0 80px ${t.accent}66` }} />
      {title && <div style={{ marginTop: 40, fontSize: 64, fontWeight: 900, opacity: pop(f, fps, 6, 10) }}>{title}</div>}
      <div style={{ marginTop: 50, opacity: pop(f, fps, 10, 9), transform: `translateY(${-Math.abs(Math.sin(f / 7)) * 50}px)` }}><Ball size={84} /></div>
    </Frame>
  );
};

export const mkGen = (stage: (ws: TimedWord[]) => React.ReactNode, outro: ((ws: TimedWord[]) => React.ReactNode) | null, BOUNDS: number[], tm: ReturnType<typeof mkTiming>, stageEnd: number, voice: string, tailTitle?: string) => {
  const scenes: SceneDef[] = [{ key: "stage", dur: Math.round(BOUNDS[stageEnd] * 30), C: () => <>{stage(tm.wordsBetween(0, stageEnd))}</> }];
  if (outro) scenes.push({ key: "outro", dur: Math.round((BOUNDS[stageEnd + 1] - BOUNDS[stageEnd]) * 30), C: () => <>{outro(tm.sceneWords(stageEnd))}</> });
  else scenes.push({ key: "tail", dur: 75, C: () => <GenTail title={tailTitle} /> });
  const Comp: React.FC = () => <VideoSeries scenes={scenes} accent={ACCENT} voice={voice} />;
  return { Comp, frames: totalFrames(scenes) };
};
void WIN_H; void GEN_NAMES;
