import React from "react";
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, Series, interpolate, random, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";

/* ---------- Tokens: tema "Competition" de la app + acento de liga (dorado) ---------- */
const BG = "#0b0c0e";
const SURFACE = "#141518";
const RAISED = "#1b1d21";
const MUTED_SURFACE = "#22252a";
const BORDER = "#30343b";
const BORDER_STRONG = "#484e58";
const TEXT = "#f4f3ef";
const TEXT_MUTED = "#b5b8bf";
const TEXT_SUBTLE = "#9a9fa8";
const ACCENT = "#d7a544"; // leagues.accent_color por defecto
const ACCENT_CONTRAST = "#111111";
const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
const W = 1080, H = 1920, COVER = 9;

// Duración de cada escena en frames (30 fps). Ajustar a la voz en off cuando exista.
const SCENES = { hook: 60, intro: 150, rotation: 175, sets: 130, three: 150, two: 305, ranking: 200, tiebreak: 200, rules: 105, outro: 95 };
const ORDER = ["hook", "intro", "rotation", "sets", "three", "two", "ranking", "tiebreak", "rules", "outro"] as const;
const DURS = ORDER.map((k) => SCENES[k]);
export const TOTAL_FRAMES = DURS.reduce((a, b) => a + b, 0);

const pop = (frame: number, fps: number, delay = 0, damping = 9) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness: 160, mass: 0.7 } });

const sfx = (name: "whoosh" | "ding" | "pop", at: number, volume = 0.6) => (
  <Sequence from={Math.max(0, at)} durationInFrames={40} layout="none"><Audio src={staticFile(`${name}.wav`)} volume={volume} /></Sequence>
);

/* ---------- Fondo ---------- */
const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.6) % 120;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <div style={{ position: "absolute", left: W / 2 - 700 + Math.sin(f / 80) * 80, top: -420, width: 1400, height: 1000, borderRadius: "50%", background: ACCENT, opacity: 0.1, filter: "blur(170px)" }} />
      <div style={{ position: "absolute", left: W / 2 - 600 + Math.cos(f / 95) * 80, top: H - 620, width: 1200, height: 800, borderRadius: "50%", background: ACCENT, opacity: 0.05, filter: "blur(170px)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={0} x2={W} y1={i * 120 + drift - 120} y2={i * 120 + drift - 120} stroke={TEXT} strokeWidth={2} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const StoryBar: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top: 70, left: 50, right: 50, height: 8, borderRadius: 8, background: "rgba(244,243,239,.16)", zIndex: 50 }}>
      <div style={{ width: `${(f / TOTAL_FRAMES) * 100}%`, height: "100%", borderRadius: 8, background: ACCENT }} />
    </div>
  );
};

/* ---------- Texto cinético y subtítulos ---------- */
// Marca palabras acentuadas con *asteriscos*. "\n" fuerza salto de línea.
const Words: React.FC<{ text: string; delay?: number; size?: number; stagger?: number }> = ({ text, delay = 0, size = 104, stagger = 4 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let i = 0;
  let inAccent = false;
  return (
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.04, letterSpacing: -3, textAlign: "center" }}>
      {text.split("\n").map((line, li) => (
        <div key={li} style={{ display: "flex", justifyContent: "center", gap: size * 0.22 }}>
          {line.split(" ").map((w) => {
            if (w.startsWith("*")) inAccent = true;
            const accent = inAccent;
            const word = w.replace(/\*/g, "");
            if (w.endsWith("*")) inAccent = false;
            const p = pop(f, fps, delay + i++ * stagger);
            return (
              <span key={i} style={{ display: "inline-block", color: accent ? ACCENT : TEXT, opacity: Math.min(1, p * 1.6), transform: `translateY(${(1 - p) * 90}px) scale(${0.5 + p * 0.5}) rotate(${(1 - p) * -6}deg)` }}>{word}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Subtítulos palabra a palabra. Los tiempos son estimados (wps palabras/s) hasta tener la voz real.
const Captions: React.FC<{ text: string; start?: number; wps?: number; perLine?: number }> = ({ text, start = 14, wps = 2.6, perLine = 4 }) => {
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
        return <span key={idx} style={{ color: idx === active ? ACCENT : idx < active ? TEXT : "rgba(244,243,239,.38)", transform: idx === active ? "scale(1.08)" : "none" }}>{w}</span>;
      })}
    </div>
  );
};

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 14);
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p, transform: `scale(${p})` }}>
      <div style={{ background: SURFACE, border: `2px solid ${ACCENT}`, color: ACCENT, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999 }}>{children}</div>
    </div>
  );
};

// Cámara: zoom lento + leve desplazamiento durante toda la escena.
const Frame: React.FC<{ children: React.ReactNode; tag?: string; caption?: string; captionStart?: number }> = ({ children, tag, caption, captionStart }) => {
  const f = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const t = f / durationInFrames;
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: TEXT }}>
      <AbsoluteFill style={{ padding: "250px 70px 340px", justifyContent: "center", alignItems: "center", transform: `scale(${1 + t * 0.05}) translateY(${-t * 24}px)` }}>
        {children}
      </AbsoluteFill>
      {tag && <Tag>{tag}</Tag>}
      {caption && <Captions text={caption} start={captionStart} />}
    </AbsoluteFill>
  );
};

/* ---------- Piezas ---------- */
const Ball: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${ACCENT} 58%, #9a7424)`, boxShadow: "0 0 50px rgba(215,165,68,.5)", position: "relative" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "3px solid rgba(255,255,255,.5)", clipPath: "inset(0 40% 0 0)" }} />
  </div>
);

const Confetti: React.FC<{ start?: number; y?: number }> = ({ start = 0, y: y0 = 1000 }) => {
  const f = useCurrentFrame() - start;
  if (f < 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 46 }).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2, v = 14 + random(`v${i}`) * 26;
        const x = W / 2 + Math.cos(a) * v * f * 0.9;
        const y = y0 + Math.sin(a) * v * f * 0.9 + 0.5 * 2.2 * f * f * 0.5;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 16, height: 28, background: [ACCENT, TEXT, "#f0d58a"][i % 3], borderRadius: 4, transform: `rotate(${f * (10 + i)}deg)`, opacity: interpolate(f, [0, 8, 55], [0, 1, 0], { extrapolateRight: "clamp" }) }} />;
      })}
    </AbsoluteFill>
  );
};

// Tarjeta tipo AppCard: superficie oscura, borde fino y franja de acento arriba.
const Card: React.FC<{ children: React.ReactNode; width?: number; style?: React.CSSProperties }> = ({ children, width = 940, style }) => (
  <div style={{ width, background: SURFACE, border: `2px solid ${BORDER}`, borderRadius: 40, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.55)", ...style }}>
    <div style={{ height: 8, background: ACCENT }} />
    {children}
  </div>
);

const Avatar: React.FC<{ name: string; size?: number; gold?: boolean }> = ({ name, size = 84, gold }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: gold ? ACCENT : MUTED_SURFACE, border: `3px solid ${gold ? ACCENT : BORDER_STRONG}`, color: gold ? ACCENT_CONTRAST : TEXT, fontWeight: 900, fontSize: size * 0.44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{name[0]}</div>
);

/* ---------- Escenas ---------- */
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const bounce = Math.abs(Math.sin(f / 6)) * 130;
  return (
    <Frame>
      <Words text={"¿Cómo funciona\nnuestra *liga?*"} size={128} stagger={5} />
      <div style={{ marginTop: 200, transform: `translateY(${-bounce}px)` }}><Ball size={90} /></div>
    </Frame>
  );
};

const Intro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const ring = interpolate(f % 60, [0, 60], [1, 1.7]);
  return (
    <Frame caption="Smash and Lob es una liga individual que se juega por parejas.">
      <div style={{ position: "relative", width: 280, height: 280, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 66, border: `5px solid ${ACCENT}`, transform: `scale(${ring})`, opacity: 1.7 - ring }} />
        <Img src={staticFile("logo.png")} style={{ width: 280, height: 280, borderRadius: 66, transform: `scale(${p}) rotate(${(1 - p) * -25}deg)`, boxShadow: "0 0 120px rgba(215,165,68,.3)" }} />
      </div>
      <div style={{ height: 40 }} />
      <Words text={"Smash *&* Lob"} delay={10} size={124} />
      <div style={{ display: "flex", gap: 20, marginTop: 50 }}>
        {["INDIVIDUAL", "POR PAREJAS"].map((t, i) => {
          const q = pop(f, fps, 30 + i * 8, 14);
          return <div key={t} style={{ opacity: q, transform: `scale(${q})`, background: SURFACE, border: `2px solid ${BORDER_STRONG}`, borderRadius: 999, padding: "16px 36px", fontSize: 36, fontWeight: 900, letterSpacing: 3, color: TEXT_MUTED }}>{t}</div>;
        })}
      </div>
    </Frame>
  );
};

const COURT_W = 780, COURT_H = 780;
const spots = { TL: [200, 160], TR: [580, 160], BL: [200, 620], BR: [580, 620] } as const;
const ROUNDS: Record<string, keyof typeof spots>[] = [
  { Ana: "TL", Luis: "TR", Marta: "BL", Iván: "BR" },
  { Ana: "TL", Marta: "TR", Luis: "BL", Iván: "BR" },
  { Ana: "TL", Iván: "TR", Luis: "BL", Marta: "BR" },
];
const Rotation: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = 40, per = 40;
  const r = Math.max(0, Math.min(2, Math.floor((f - start) / per)));
  const prev = Math.max(0, r - 1);
  const k = r === 0 ? 1 : spring({ frame: f - start - r * per, fps, config: { damping: 14, stiffness: 120 } });
  const names = Object.keys(ROUNDS[0]);
  return (
    <Frame tag="01 · PAREJAS ROTATIVAS" caption="Cada jornada cambias de compañero, y cada jugador suma sus propios puntos." captionStart={16}>
      <div style={{ position: "absolute", top: 290 }}><Words text={"Cada jornada,\n*compañero* nuevo"} size={84} /></div>
      <div style={{ position: "relative", width: COURT_W, height: COURT_H, marginTop: 230, transform: `perspective(1400px) rotateX(18deg) scale(${pop(f, fps, 6, 14)})` }}>
        <svg width={COURT_W} height={COURT_H} style={{ position: "absolute", inset: 0 }}>
          <rect x={4} y={4} width={COURT_W - 8} height={COURT_H - 8} rx={30} fill={SURFACE} stroke={BORDER_STRONG} strokeWidth={6} />
          <line x1={0} x2={COURT_W} y1={COURT_H / 2} y2={COURT_H / 2} stroke={ACCENT} strokeWidth={10} strokeDasharray="22 12" />
          <line x1={COURT_W / 2} x2={COURT_W / 2} y1={150} y2={COURT_H - 150} stroke={BORDER_STRONG} strokeWidth={4} />
        </svg>
        {names.map((n) => {
          const [x0, y0] = spots[ROUNDS[prev][n]]; const [x1, y1] = spots[ROUNDS[r][n]];
          const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
          const top = ROUNDS[r][n].startsWith("T");
          return (
            <div key={n} style={{ position: "absolute", left: x - 62, top: y - 62, width: 124, height: 124, borderRadius: "50%", background: top ? ACCENT : RAISED, border: `4px solid ${top ? ACCENT : TEXT}`, color: top ? ACCENT_CONTRAST : TEXT, fontWeight: 900, fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(0,0,0,.5)" }}>{n}</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 520, fontSize: 40, fontWeight: 900, letterSpacing: 4, color: ACCENT }}>JORNADA {r + 1}</div>
      {sfx("pop", start + per, 0.4)}{sfx("pop", start + 2 * per, 0.4)}
    </Frame>
  );
};

const Sets: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <Frame tag="02 · SETS" caption="Los partidos se juegan siempre a tres sets." captionStart={14}>
      <Words text={"Siempre\n*3 sets*"} size={150} />
      <div style={{ display: "flex", gap: 26, marginTop: 90 }}>
        {[1, 2, 3].map((n) => {
          const p = pop(f, fps, 24 + n * 10, 12);
          return (
            <div key={n} style={{ width: 280, height: 320, borderRadius: 44, background: SURFACE, border: `4px solid ${ACCENT}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `rotateY(${(1 - p) * 90}deg) scale(${p})`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
              <div style={{ fontSize: 38, color: TEXT_SUBTLE, fontWeight: 900, letterSpacing: 5 }}>SET</div>
              <div style={{ fontSize: 150, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>{n}</div>
            </div>
          );
        })}
      </div>
      {[1, 2, 3].map((n) => sfx("pop", 24 + n * 10, 0.35))}
    </Frame>
  );
};

type SetScore = [number, number];
const MatchCard: React.FC<{ a: string; b: string; sets: SetScore[]; ptsA: number; ptsB: number; ptsAt: number }> = ({ a, b, sets, ptsA, ptsB, ptsAt }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 13);
  const count = (to: number) => Math.round(interpolate(f, [ptsAt, ptsAt + 22], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const landed = f >= ptsAt + 22;
  const glow = landed ? interpolate(f, [ptsAt + 22, ptsAt + 34], [1, 0.35], { extrapolateRight: "clamp" }) : 0;
  const row = (name: string, idx: 0 | 1, pts: number) => {
    const won = pts > (idx === 0 ? ptsB : ptsA) || (pts === (idx === 0 ? ptsB : ptsA) && false);
    return (
      <div style={{ display: "flex", alignItems: "center", height: 150, padding: "0 28px", gap: 12, borderTop: `2px solid ${BORDER}`, background: won && landed ? "rgba(215,165,68,.10)" : "transparent" }}>
        <div style={{ flex: 1, fontSize: 46, fontWeight: 900 }}>{name}</div>
        {sets.map((s, i) => {
          const q = pop(f, fps, 24 + i * 16, 14);
          const setWon = s[idx] > s[1 - idx];
          return <div key={i} style={{ width: 110, textAlign: "center", fontSize: 62, fontWeight: 900, color: setWon ? ACCENT : TEXT_SUBTLE, opacity: q, transform: `scale(${0.6 + q * 0.4})` }}>{s[idx]}</div>;
        })}
        <div style={{ width: 150, textAlign: "center", fontSize: 92, fontWeight: 900, color: won ? ACCENT : TEXT, textShadow: won ? `0 0 ${50 * glow}px ${ACCENT}` : "none", transform: `scale(${won && landed ? 1 + 0.15 * glow : 1})` }}>{f >= ptsAt ? count(pts) : ""}</div>
      </div>
    );
  };
  return (
    <Card style={{ transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>
      <div style={{ display: "flex", alignItems: "center", padding: "24px 28px 18px", gap: 12, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: TEXT_SUBTLE }}>
        <div style={{ flex: 1 }}>PAREJA</div>
        {sets.map((_, i) => <div key={i} style={{ width: 110, textAlign: "center" }}>SET {i + 1}</div>)}
        <div style={{ width: 150, textAlign: "center", color: ACCENT }}>PTS</div>
      </div>
      {row(a, 0, ptsA)}
      {row(b, 1, ptsB)}
    </Card>
  );
};

const Callout: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return <div style={{ marginTop: 50, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + p * 0.1})`, border: `2px solid ${ACCENT}`, background: SURFACE, color: TEXT, borderRadius: 999, padding: "22px 44px", fontSize: 42, fontWeight: 800, textAlign: "center" }}>{children}</div>;
};

const ThreeZero: React.FC = () => (
  <Frame tag="03 · PUNTOS" caption="Si ganáis tres a cero, sumáis tres puntos cada uno." captionStart={14}>
    <Words text={"Victoria *3-0*"} size={110} />
    <div style={{ height: 60 }} />
    <MatchCard a="Ana · Luis" b="Marta · Iván" sets={[[6, 2], [6, 4], [6, 3]]} ptsA={3} ptsB={0} ptsAt={86} />
    <Callout at={112}>3 puntos para <b style={{ color: ACCENT }}>cada jugador</b></Callout>
    <Confetti start={108} y={900} />
    {sfx("ding", 108, 0.5)}
  </Frame>
);

const TwoOne: React.FC = () => (
  <Frame tag="03 · PUNTOS" caption="Si es dos a uno, la pareja ganadora suma dos puntos, y la perdedora, uno. Así que, aunque pierdas el partido, si peleas un set, puntúas." captionStart={14}>
    <Words text={"Victoria *2-1*"} size={110} />
    <div style={{ height: 60 }} />
    <MatchCard a="Ana · Luis" b="Marta · Iván" sets={[[6, 4], [3, 6], [6, 2]]} ptsA={2} ptsB={1} ptsAt={86} />
    <Callout at={190}>Perder un partido <b style={{ color: ACCENT }}>también puntúa</b></Callout>
    {sfx("ding", 108, 0.5)}{sfx("pop", 190, 0.5)}
  </Frame>
);

/* ---------- Clasificación: réplica de RankingTable (POS · Jugador · J · Dif · PTS) ---------- */
const RK = ["Ana", "Marta", "Luis", "Iván", "Bea"]; // orden fijo = último desempate
const RK_PTS: Record<string, number[]> = { Ana: [0, 3, 5, 6], Marta: [0, 1, 4, 7], Luis: [0, 2, 3, 5], "Iván": [0, 0, 2, 4], Bea: [0, 1, 2, 3] };
const RK_DIFF: Record<string, number[]> = { Ana: [0, 6, 7, 8], Marta: [0, -2, 3, 9], Luis: [0, 1, 0, 2], "Iván": [0, -4, -2, 0], Bea: [0, -1, -3, -2] };
const rankAt = (round: number) => {
  const order = [...RK].sort((a, b) => RK_PTS[b][round] - RK_PTS[a][round] || RK_DIFF[b][round] - RK_DIFF[a][round] || RK.indexOf(a) - RK.indexOf(b));
  return Object.fromEntries(order.map((n, i) => [n, i])) as Record<string, number>;
};
const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
const ROW_H = 112;

const Ranking: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = 36, per = 52;
  const started = f >= start;
  const r = Math.max(1, Math.min(3, 1 + Math.floor((f - start) / per)));
  const k = started ? spring({ frame: f - start - (r - 1) * per, fps, config: { damping: 15, stiffness: 110 } }) : 0;
  const prevR = started ? r - 1 : 0, curR = started ? r : 0;
  const from = rankAt(prevR), to = rankAt(curR);
  const lerp = (a: number, b: number) => a + (b - a) * k;
  const tieNow = (n: string) => RK.some((m) => m !== n && RK_PTS[m][curR] === RK_PTS[n][curR]);
  return (
    <Frame tag="04 · CLASIFICACIÓN" caption="La clasificación es individual: cada jugador sube o baja con sus propios puntos." captionStart={10}>
      <div style={{ position: "absolute", top: 290 }}><Words text={"Ranking\n*individual*"} size={100} /></div>
      <Card style={{ position: "absolute", top: 560, opacity: Math.min(1, pop(f, fps, 4, 14) * 2), transform: `scale(${0.9 + 0.1 * pop(f, fps, 4, 14)})` }}>
        <div style={{ display: "flex", alignItems: "center", padding: "22px 30px", fontSize: 28, fontWeight: 900, letterSpacing: 3, color: TEXT_SUBTLE, borderBottom: `2px solid ${BORDER}` }}>
          <div style={{ width: 100, textAlign: "center" }}>POS</div>
          <div style={{ flex: 1, paddingLeft: 20 }}>JUGADOR</div>
          <div style={{ width: 90, textAlign: "right" }}>J</div>
          <div style={{ width: 150, textAlign: "right" }}>DIF</div>
          <div style={{ width: 150, textAlign: "right" }}>PTS</div>
        </div>
        <div style={{ position: "relative", height: 5 * ROW_H }}>
          {RK.map((n, idx) => {
            const pos = lerp(from[n], to[n]);
            const moved = from[n] !== to[n] && k < 0.95;
            const climbing = to[n] < from[n];
            const leader = to[n] === 0 && k > 0.5;
            const pts = Math.round(lerp(RK_PTS[n][prevR], RK_PTS[n][curR]));
            const diff = Math.round(lerp(RK_DIFF[n][prevR], RK_DIFF[n][curR]));
            const tie = started && tieNow(n);
            const q = pop(f, fps, 10 + idx * 5, 13);
            return (
              <div key={n} style={{ position: "absolute", top: pos * ROW_H, left: 0, right: 0, height: ROW_H, display: "flex", alignItems: "center", padding: "0 30px", borderBottom: `2px solid ${BORDER}`, background: moved ? MUTED_SURFACE : leader ? "rgba(215,165,68,.12)" : SURFACE, transform: `translateX(${(1 - q) * 1000}px)`, zIndex: moved ? 2 : 1, boxShadow: moved ? "0 10px 40px rgba(0,0,0,.6)" : "none" }}>
                <div style={{ width: 100, textAlign: "center", fontSize: 54, fontWeight: 900, color: leader ? ACCENT : TEXT }}>{Math.round(lerp(from[n], to[n])) + 1}</div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 22, paddingLeft: 20 }}>
                  <Avatar name={n} size={76} gold={leader} />
                  <div style={{ fontSize: 50, fontWeight: 800 }}>{n}</div>
                  {moved && <div style={{ fontSize: 40, fontWeight: 900, color: climbing ? ACCENT : "#f87171" }}>{climbing ? "▲" : "▼"}</div>}
                </div>
                <div style={{ width: 90, textAlign: "right", fontSize: 40, fontWeight: 800, color: TEXT_MUTED }}>{started ? curR : 0}</div>
                <div style={{ width: 150, textAlign: "right", fontSize: 46, fontWeight: 900, color: tie ? ACCENT : TEXT, textDecoration: tie ? `underline ${ACCENT} 4px` : "none", textUnderlineOffset: 8 }}>{signed(diff)}</div>
                <div style={{ width: 150, textAlign: "right", fontSize: 64, fontWeight: 900 }}>{pts}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "18px 30px", fontSize: 23, fontWeight: 700, color: TEXT_SUBTLE }}>J = jornadas jugadas · Dif = diferencia de juegos · PTS = sets ganados</div>
      </Card>
      {sfx("pop", start, 0.4)}{sfx("pop", start + per, 0.4)}{sfx("pop", start + 2 * per, 0.4)}
    </Frame>
  );
};

const Tiebreak: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const rows = ["Puntos", "Diferencia de juegos", "Juegos a favor"];
  return (
    <Frame tag="05 · DESEMPATES" caption="Si hay empate, desempata la diferencia de juegos, y después los juegos a favor." captionStart={14}>
      <Words text={"¿Empate\n*a puntos?*"} size={130} />
      <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 24, width: 940 }}>
        {rows.map((t, i) => {
          const p = pop(f, fps, 30 + i * 18, 13);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 30, background: i === 0 ? ACCENT : SURFACE, color: i === 0 ? ACCENT_CONTRAST : TEXT, border: `2px solid ${i === 0 ? ACCENT : BORDER}`, borderRadius: 40, padding: "32px 40px", transform: `translateX(${(1 - p) * 900}px)`, boxShadow: "0 14px 40px rgba(0,0,0,.4)" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: i === 0 ? ACCENT_CONTRAST : MUTED_SURFACE, color: i === 0 ? ACCENT : ACCENT, fontSize: 48, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
              <div style={{ fontSize: 52, fontWeight: 800 }}>{t}</div>
            </div>
          );
        })}
      </div>
      {rows.map((_, i) => sfx("pop", 30 + i * 18, 0.35))}
    </Frame>
  );
};

const Rules: React.FC = () => {
  const f = useCurrentFrame();
  const bar = interpolate(f, [30, 66], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <Frame caption="En esta liga gana la regularidad." captionStart={10}>
      <Words text={"En esta liga\ngana la\n*regularidad*"} size={140} stagger={6} />
      <div style={{ width: 700, height: 14, borderRadius: 14, background: BORDER, marginTop: 50, overflow: "hidden" }}>
        <div style={{ width: `${bar}%`, height: "100%", background: ACCENT }} />
      </div>
    </Frame>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame caption="Nos vemos en la pista." captionStart={10}>
      <Img src={staticFile("logo.png")} style={{ width: 230, height: 230, borderRadius: 54, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})`, boxShadow: "0 0 120px rgba(215,165,68,.3)" }} />
      <div style={{ height: 50 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={128} delay={8} />
    </Frame>
  );
};

/* ---------- Transiciones: un panel cubre la pantalla y la escena cambia por debajo ---------- */
const Cover: React.FC<{ at: number; kind: number }> = ({ at, kind }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < -COVER || d > COVER) return null;
  const inn = interpolate(d, [-COVER, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const out = interpolate(d, [0, COVER], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const style: React.CSSProperties = { position: "absolute", inset: 0, zIndex: 100, background: ACCENT };
  if (kind % 3 === 0) style.transform = `translateX(${(-1 + inn) * W + out * W}px)`;
  else if (kind % 3 === 1) style.transform = `translateY(${(1 - inn) * H - out * H}px)`;
  else {
    const r = Math.hypot(W, H);
    style.clipPath = `circle(${inn * r}px at 50% 55%)`;
    if (out > 0) { style.clipPath = undefined; style.maskImage = `radial-gradient(circle at 50% 55%, transparent ${out * r}px, #000 ${out * r + 1}px)`; style.WebkitMaskImage = style.maskImage; }
  }
  return <div style={style}><div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)", width: 110, height: 110, borderRadius: "50%", background: ACCENT_CONTRAST }} /></div>;
};

export const LigaFormato: React.FC = () => {
  const comps: Record<(typeof ORDER)[number], React.FC> = { hook: Hook, intro: Intro, rotation: Rotation, sets: Sets, three: ThreeZero, two: TwoOne, ranking: Ranking, tiebreak: Tiebreak, rules: Rules, outro: Outro };
  let acc = 0;
  const bounds = DURS.map((d) => (acc += d));
  return (
    <AbsoluteFill>
      <Background />
      <Series>
        {ORDER.map((k, i) => {
          const C = comps[k];
          return <Series.Sequence key={k} durationInFrames={DURS[i]}><C /></Series.Sequence>;
        })}
      </Series>
      {bounds.slice(0, -1).map((at, i) => <Cover key={i} at={at} kind={i} />)}
      {bounds.slice(0, -1).map((at, i) => <React.Fragment key={`s${i}`}>{sfx("whoosh", at - COVER - 4, 0.5)}</React.Fragment>)}
      <StoryBar />
    </AbsoluteFill>
  );
};
