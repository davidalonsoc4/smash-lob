import React, { createContext, useContext, useMemo } from "react";
import {
  AbsoluteFill, Audio, Easing, Sequence, Series, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";

export const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
export const W = 1080, H = 1920, COVER = 9;

/* ---------- Tema: tokens "Competition" de la app + acento de liga configurable ---------- */
export type Theme = {
  bg: string; surface: string; raised: string; mutedSurface: string; border: string; borderStrong: string;
  text: string; textMuted: string; textSubtle: string; accent: string; accentContrast: string;
};
const luminance = (hex: string) => {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const makeTheme = (accent: string): Theme => ({
  bg: "#0b0c0e", surface: "#141518", raised: "#1b1d21", mutedSurface: "#22252a", border: "#30343b", borderStrong: "#484e58",
  text: "#f4f3ef", textMuted: "#b5b8bf", textSubtle: "#9a9fa8",
  accent, accentContrast: luminance(accent) > 0.35 ? "#111111" : "#ffffff",
});
const ThemeCtx = createContext<Theme>(makeTheme("#d7a544"));
export const ThemeProvider: React.FC<{ accent: string; children: React.ReactNode }> = ({ accent, children }) => {
  const theme = useMemo(() => makeTheme(accent), [accent]);
  return <ThemeCtx.Provider value={theme}>{children}</ThemeCtx.Provider>;
};
export const useTheme = () => useContext(ThemeCtx);

export type TransitionKind = "panel" | "mix" | "rise" | "slide" | "zoom" | "glow" | "bounce";
export type Step = "rise" | "slideL" | "slideR" | "zoom" | "glow" | "bounce";
// Rotación por defecto de la serie: base "subida" y, para dar vidilla, deslizamiento, zoom, destello y bote de pelota (nunca dos iguales seguidas).
export const MIX_PLAN: Step[] = ["rise", "slideL", "bounce", "zoom", "slideR", "glow", "bounce"];
export const planFor = (kind: TransitionKind, n: number): Step[] => {
  if (kind === "panel") return [];
  const pick = (i: number): Step => kind === "mix" ? MIX_PLAN[i % MIX_PLAN.length] : kind === "slide" ? (i % 2 ? "slideR" : "slideL") : kind === "rise" ? "rise" : kind;
  return Array.from({ length: Math.max(0, n - 1) }, (_, i) => pick(i));
};
const TransitionCtx = createContext<TransitionKind>("panel");
const SceneTransCtx = createContext<{ enter: Step | null; exit: Step | null }>({ enter: null, exit: null });
export const useTransitionKind = () => useContext(TransitionCtx);

export const pop = (frame: number, fps: number, delay = 0, damping = 9) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: 160, mass: 0.7 } });

export const SFX_GAIN = 0.6;
export const sfx = (name: "whoosh" | "ding" | "pop", at: number, volume = 0.6) => (
  <Sequence key={`${name}-${at}`} from={Math.max(0, at)} durationInFrames={40} layout="none"><Audio src={staticFile(`${name}.wav`)} volume={volume * SFX_GAIN} /></Sequence>
);

/* ---------- Fondo, barra de progreso ---------- */
export const Background: React.FC = () => {
  const t = useTheme();
  const f = useCurrentFrame();
  const drift = (f * 0.6) % 120;
  return (
    <AbsoluteFill style={{ background: t.bg }}>
      <div style={{ position: "absolute", left: W / 2 - 700 + Math.sin(f / 80) * 80, top: -420, width: 1400, height: 1000, borderRadius: "50%", background: t.accent, opacity: 0.1, filter: "blur(170px)" }} />
      <div style={{ position: "absolute", left: W / 2 - 600 + Math.cos(f / 95) * 80, top: H - 620, width: 1200, height: 800, borderRadius: "50%", background: t.accent, opacity: 0.05, filter: "blur(170px)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={0} x2={W} y1={i * 120 + drift - 120} y2={i * 120 + drift - 120} stroke={t.text} strokeWidth={2} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const StoryBar: React.FC<{ total: number }> = ({ total }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 70, left: 50, right: 50, height: 8, borderRadius: 8, background: "rgba(244,243,239,.16)", zIndex: 50 }}>
      <div style={{ width: `${(f / total) * 100}%`, height: "100%", borderRadius: 8, background: t.accent }} />
    </div>
  );
};

/* ---------- Texto cinético y subtítulos ---------- */
// *palabras* en acento; "\n" fuerza salto de línea.
export const Words: React.FC<{ text: string; delay?: number; size?: number; stagger?: number }> = ({ text, delay = 0, size = 104, stagger = 4 }) => {
  const t = useTheme();
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  let i = 0; let inAccent = false;
  return (
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -3, textAlign: "center" }}>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", gap: size * 0.22 }}>
          {line.split(" ").map((w) => {
            if (w.startsWith("*")) inAccent = true;
            const accent = inAccent; const word = w.replace(/\*/g, "");
            if (w.endsWith("*")) inAccent = false;
            const p = pop(f, fps, delay + i++ * stagger);
            return <span key={i} style={{ display: "inline-block", color: accent ? t.accent : t.text, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 90}px) scale(${0.5 + p * 0.5}) rotate(${(1 - p) * -6}deg)` }}>{word}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

// Subtítulos palabra a palabra. Tiempos estimados (wps palabras/s) hasta tener la voz real.
export const Captions: React.FC<{ text: string; start?: number; wps?: number; perLine?: number }> = ({ text, start = 14, wps = 2.6, perLine = 4 }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const words = text.split(" ");
  const d = 30 / wps;
  const active = Math.floor((f - start) / d);
  if (active < 0) return null;
  const lineIdx = Math.min(Math.floor(active / perLine), Math.ceil(words.length / perLine) - 1);
  const slice = words.slice(lineIdx * perLine, lineIdx * perLine + perLine);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 390, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 22px", fontSize: 66, fontWeight: 900, letterSpacing: -1, textShadow: "0 4px 24px rgba(0,0,0,.9)", zIndex: 20 }}>
      {slice.map((w, i) => {
        const idx = lineIdx * perLine + i;
        return <span key={idx} style={{ color: idx === active ? t.accent : idx < active ? t.text : "rgba(244,243,239,.38)", transform: idx === active ? "scale(1.08)" : "none" }}>{w}</span>;
      })}
    </div>
  );
};


// Subtítulos sincronizados con tiempos reales de palabra (f = frame de inicio relativo a la escena).
export type TimedWord = { w: string; f: number; e: number };
export const TimedCaptions: React.FC<{ words: TimedWord[]; maxChars?: number; maxWords?: number }> = ({ words, maxChars = 22, maxWords = 5 }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  if (words.length === 0) return null;
  // Agrupa palabras en líneas cortas (por nº de caracteres) para que nunca se parta en dos filas.
  const lines: number[][] = [];
  let cur: number[] = []; let len = 0;
  words.forEach((x, i) => {
    const add = (cur.length ? 1 : 0) + x.w.length;
    if (cur.length && (len + add > maxChars || cur.length >= maxWords)) { lines.push(cur); cur = []; len = 0; }
    len += (cur.length ? 1 : 0) + x.w.length; cur.push(i);
  });
  if (cur.length) lines.push(cur);
  let active = -1;
  words.forEach((x, i) => { if (f >= x.f) active = i; });
  if (active < 0) return null;
  // Tras la última palabra, el subtítulo se retira a los ~0,6 s (silencio final).
  if (active === words.length - 1 && f > words[active].e + 18) return null;
  const line = lines.find((l) => l.includes(active)) ?? lines[0];
  return (
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 390, display: "flex", justifyContent: "center", flexWrap: "nowrap", gap: 20, fontSize: 68, fontWeight: 900, letterSpacing: -1, textShadow: "0 4px 24px rgba(0,0,0,.9)", zIndex: 20, whiteSpace: "nowrap" }}>
      {line.map((idx) => (
        <span key={idx} style={{ color: idx === active ? t.accent : idx < active ? t.text : "rgba(244,243,239,.38)", transform: idx === active ? "scale(1.1)" : "none" }}>{words[idx].w}</span>
      ))}
    </div>
  );
};

export const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14);
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${p})` }}>
      <div style={{ background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999 }}>{children}</div>
    </div>
  );
};

// Cámara: zoom lento + leve desplazamiento durante toda la escena. Respeta zonas seguras de Instagram.
export const Frame: React.FC<{ children: React.ReactNode; tag?: string; caption?: string; captionStart?: number; example?: boolean; timedWords?: TimedWord[] }> = ({ children, tag, caption, captionStart, example, timedWords }) => {
  const t = useTheme();
  const kind = useTransitionKind();
  const { enter, exit } = useContext(SceneTransCtx);
  const f = useCurrentFrame(); const { durationInFrames, fps } = useVideoConfig();
  const k = f / durationInFrames;
  let wrap: React.CSSProperties = {};
  if (kind !== "panel") { // el contenido sale y entra por sí mismo; el fondo permanece fijo
    const inn = enter ? spring({ frame: f - 3, fps, config: { damping: 16, stiffness: 170, mass: 0.7 } }) : 1;
    const out = exit ? interpolate(f, [durationInFrames - 9, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) }) : 0;
    const e = 1 - inn;
    let tx = 0, ty = 0, sc = 1, blur = 0;
    if (enter === "rise" || enter === "glow" || enter === "bounce") { ty += e * 50; sc *= 0.94 + 0.06 * inn; }
    if (enter === "slideL") { tx += e * 130; blur += e * 4; }
    if (enter === "slideR") { tx -= e * 130; blur += e * 4; }
    if (enter === "zoom") { sc *= 0.93 + 0.07 * inn; blur += e * 5; }
    if (exit === "rise" || exit === "glow" || exit === "bounce") { ty -= out * 30; sc *= 1 - 0.04 * out; }
    if (exit === "slideL") { tx -= out * 130; blur += out * 4; }
    if (exit === "slideR") { tx += out * 130; blur += out * 4; }
    if (exit === "zoom") { sc *= 1 + 0.07 * out; blur += out * 5; }
    wrap = { opacity: (enter ? Math.min(1, inn * 1.4) : 1) * (1 - out), transform: `translate(${tx}px, ${ty}px) scale(${sc})`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined };
  }
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: t.text, ...wrap }}>
      <AbsoluteFill style={{ padding: "250px 70px 340px", justifyContent: "center", alignItems: "center", transform: `scale(${1 + k * 0.04}) translateY(${-k * 20}px)` }}>{children}</AbsoluteFill>
      {tag && <Tag>{tag}</Tag>}
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      {timedWords ? <TimedCaptions words={timedWords} /> : caption && <Captions text={caption} start={captionStart} />}
    </AbsoluteFill>
  );
};

export const Ball: React.FC<{ size?: number }> = ({ size = 70 }) => {
  const t = useTheme();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${t.accent} 58%, rgba(0,0,0,.35))`, boxShadow: `0 0 50px ${t.accent}80`, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(255,255,255,.5)", clipPath: "inset(0 40% 0 0)" }} />
    </div>
  );
};

/* ---------- Transiciones y montaje ---------- */
const Cover: React.FC<{ at: number; kind: number }> = ({ at, kind }) => {
  const t = useTheme();
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -COVER || d > COVER) return null;
  const inn = interpolate(d, [-COVER, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(d, [0, COVER], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const style: React.CSSProperties = { position: "absolute", inset: 0, zIndex: 100, background: t.accent };
  if (kind % 3 === 0) style.transform = `translateX(${(-1 + inn) * W + out * W}px)`;
  else if (kind % 3 === 1) style.transform = `translateY(${(1 - inn) * H - out * H}px)`;
  else {
    const r = Math.hypot(W, H);
    style.clipPath = `circle(${inn * r}px at 50% 55%)`;
    if (out > 0) { style.clipPath = undefined; style.maskImage = `radial-gradient(circle at 50% 55%, transparent ${out * r}px, #000 ${out * r + 1}px)`; style.WebkitMaskImage = style.maskImage; }
  }
  return <div style={style}><div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)", width: 110, height: 110, borderRadius: "50%", background: t.accentContrast }} /></div>;
};

// Fundido final suave a negro (el vídeo "respira" y no termina de golpe).
const FadeOut: React.FC<{ total: number; children: React.ReactNode }> = ({ total, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [total - 12, total - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};


// Destello de luz tenue en el corte (muy sutil).
const GlowPulse: React.FC<{ at: number }> = ({ at }) => {
  const t = useTheme(); const f = useCurrentFrame();
  const d = f - (at - 10);
  if (d < 0 || d > 24) return null;
  const a = Math.sin((Math.PI * d) / 24) ** 2 * 0.3;
  return <AbsoluteFill style={{ zIndex: 90, pointerEvents: "none", opacity: a, background: `radial-gradient(circle at 50% 50%, ${t.accent}, transparent 62%)` }} />;
};

// Pelota que cae, bota dos veces (se aplasta al impactar, con sombra y giro) y sale por el lateral.
export const BOUNCE_IMPACTS = [7, 17, 23]; // cuadros (desde el inicio) de cada impacto
const BallBounce: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const T = 28, d = f - (at - 11);
  if (d < 0 || d > T) return null;
  const FLOOR = 1380, SIZE = 104;
  const x = -120 + (W + 240) * (d / T);
  let h: number;
  if (d < 7) { const q = d / 7; h = (FLOOR - 700) * (1 - q * q); }
  else if (d < 17) { const q = (d - 7) / 10; h = 380 * (1 - (2 * q - 1) ** 2); }
  else if (d < 23) { const q = (d - 17) / 6; h = 130 * (1 - (2 * q - 1) ** 2); }
  else { const q = (d - 23) / 5; h = 45 * (1 - (2 * q - 1) ** 2); }
  const sq = Math.max(0, ...BOUNCE_IMPACTS.map((i) => 1 - Math.abs(d - i) / 1.7));
  const sy = 1 - 0.3 * sq, sx = 1 + 0.22 * sq;
  const cy = FLOOR - SIZE / 2 - h + (SIZE * 0.3 * sq) / 2;
  const sh = Math.max(0, 1 - h / 620);
  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: x - (SIZE * (0.5 + 0.6 * sh)) / 2, top: FLOOR + 4, width: SIZE * (0.5 + 0.6 * sh), height: 16, borderRadius: "50%", background: "#000", opacity: 0.4 * sh, filter: "blur(7px)" }} />
      {BOUNCE_IMPACTS.slice(0, 2).map((i) => { // pequeño aro de impacto
        const r = d - i; if (r < 0 || r > 7) return null;
        const w = SIZE * (0.9 + r * 0.22);
        return <div key={i} style={{ position: "absolute", left: -120 + (W + 240) * (i / T) - w / 2, top: FLOOR + 2, width: w, height: 14, borderRadius: "50%", border: "3px solid rgba(244,243,239,.5)", opacity: 1 - r / 7 }} />;
      })}
      <div style={{ position: "absolute", left: x - SIZE / 2, top: cy - SIZE / 2, width: SIZE, height: SIZE, transform: `scale(${sx}, ${sy})`, transformOrigin: "50% 100%" }}>
        <div style={{ transform: `rotate(${d * 22}deg)` }}><Ball size={SIZE} /></div>
      </div>
    </AbsoluteFill>
  );
};

export type SceneDef = { key: string; dur: number; C: React.FC };
export const totalFrames = (scenes: SceneDef[]) => scenes.reduce((a, s) => a + s.dur, 0);

export const VideoSeries: React.FC<{ scenes: SceneDef[]; accent: string; voice?: string; transition?: TransitionKind }> = ({ scenes, accent, voice, transition = "mix" }) => {
  let acc = 0;
  const bounds = scenes.map((s) => (acc += s.dur));
  const plan = planFor(transition, scenes.length);
  return (
    <ThemeProvider accent={accent}>
     <TransitionCtx.Provider value={transition}>
      <FadeOut total={acc}>
        <Background />
        <Series>
          {scenes.map((s, i) => (
            <Series.Sequence key={s.key} durationInFrames={s.dur}>
              <SceneTransCtx.Provider value={{ enter: plan[i - 1] ?? null, exit: plan[i] ?? null }}><s.C /></SceneTransCtx.Provider>
            </Series.Sequence>
          ))}
        </Series>
        {transition === "panel" && bounds.slice(0, -1).map((at, i) => <Cover key={i} at={at} kind={i} />)}
        {bounds.slice(0, -1).map((at, i) => plan[i] === "glow" ? <GlowPulse key={`g${i}`} at={at} /> : plan[i] === "bounce" ? <BallBounce key={`b${i}`} at={at} /> : null)}
        {bounds.slice(0, -1).flatMap((at, i) => plan[i] === "bounce" ? BOUNCE_IMPACTS.slice(0, 2).map((k, j) => sfx("pop", at - 11 + k, j === 0 ? 0.35 : 0.25)) : [])}
        {bounds.slice(0, -1).map((at) => sfx("whoosh", at - COVER - 4, transition === "panel" ? 0.5 : 0.28))}
        <StoryBar total={acc} />
        {voice && <Audio src={staticFile(voice)} volume={1} />}
      </FadeOut>
     </TransitionCtx.Provider>
    </ThemeProvider>
  );
};
