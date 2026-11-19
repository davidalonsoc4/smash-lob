// Demos (sin voz) para elegir estilo: gráfica de constancia (pelota botando / carrera de clasificación) y avatares (A ilustrados / D realistas).
import React, { useId } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, VideoSeries, pop, totalFrames, useTheme } from "./kit";
import { Av, Chip, COLORS, NAMES } from "./Reel1";

const ease = (q: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);
// polilínea parcial continua: t en [0, n-1], interpola el último tramo (sin saltos entre puntos)
const partial = (pts: [number, number][], t: number): string => {
  const tt = Math.min(pts.length - 1, Math.max(0, t));
  const i = Math.floor(tt), r = tt - i;
  const out = pts.slice(0, i + 1);
  if (i < pts.length - 1 && r > 0) out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r]);
  return out.map((p) => p.join(",")).join(" ");
};

/* ---------- Gráfica · opción 2: pelota botando ---------- */
const W = 860, H = 560, PAD = 40;
const xy = (vals: number[]): [number, number][] => vals.map((v, i) => [PAD + (i / (vals.length - 1)) * (W - 2 * PAD), H - 50 - (v / 100) * (H - 130)]);
const GOLD = [8, 22, 36, 50, 63, 78, 93], G1 = [20, 55, 25, 62, 30, 58, 48], G2 = [12, 38, 60, 34, 66, 28, 55];

const GraphBall: React.FC = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const gold = xy(GOLD), g1 = xy(G1), g2 = xy(G2);
  const HOP = 17, START = 12, n = gold.length;
  const prog = Math.min(n - 1, Math.max(0, (f - START) / HOP));
  const i = Math.min(n - 2, Math.floor(prog)), q = prog - i;
  const bx = gold[i][0] + (gold[i + 1][0] - gold[i][0]) * q;
  const by = gold[i][1] + (gold[i + 1][1] - gold[i][1]) * q - Math.sin(Math.PI * q) * (110 + i * 6);
  const done = prog >= n - 1;
  const trophy = pop(f, fps, START + HOP * (n - 1), 9);
  const sq = done ? 0 : Math.max(0, 1 - Math.min(q, 1 - q) * HOP / 2);
  return (
    <div style={{ position: "relative", width: W + 40, height: H + 140, background: t.surface, border: `2px solid ${t.border}`, borderRadius: 36, padding: 20 }}>
      <svg width={W} height={H + 80}>
        {gold.map(([x], k) => <g key={k}><line x1={x} x2={x} y1={20} y2={H - 30} stroke={t.border} strokeWidth={2} strokeDasharray="4 10" /><text x={x} y={H + 14} textAnchor="middle" fontSize={30} fontWeight={800} fill={prog >= k ? t.text : t.textSubtle}>{`J${k + 1}`}</text></g>)}
        <polyline points={partial(g1, prog)} fill="none" stroke="#5f6670" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={partial(g2, prog)} fill="none" stroke="#53B4D1" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
        <polyline points={partial(gold, prog)} fill="none" stroke={t.accent} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
        {gold.map(([x, y], k) => prog >= k && <circle key={k} cx={x} cy={y} r={11} fill={t.bg} stroke={t.accent} strokeWidth={6} />)}
      </svg>
      {!done && f >= START - 8 && <div style={{ position: "absolute", left: 20 + bx - 30, top: 20 + by - 30, width: 60, height: 60, transform: `scale(${1 + 0.25 * sq}, ${1 - 0.3 * sq})`, transformOrigin: "50% 100%" }}><div style={{ transform: `rotate(${f * 14}deg)` }}><Ball size={60} /></div></div>}
      <div style={{ position: "absolute", right: 24, top: 6, transform: `scale(${trophy})`, fontSize: 110, opacity: trophy }}>🏆</div>
    </div>
  );
};

/* ---------- Gráfica · opción 3: carrera de clasificación ---------- */
const INC = [[3, 3, 3, 3, 3, 3, 3], [5, 1, 4, 0, 3, 2, 2], [4, 4, 0, 5, 1, 3, 1], [2, 5, 5, 1, 0, 4, 3], [1, 0, 3, 4, 5, 1, 4], [5, 3, 1, 2, 4, 0, 2], [0, 2, 2, 3, 2, 5, 5], [3, 1, 5, 2, 1, 3, 0]];
const cum = (p: number, j: number) => INC[p].slice(0, j).reduce((a, b) => a + b, 0);
const rankAt = (j: number): number[] => { const order = [0, 1, 2, 3, 4, 5, 6, 7].sort((a, b) => cum(b, j) - cum(a, j) || a - b); const r = Array(8).fill(0); order.forEach((p, k) => (r[p] = k)); return r; };

const Race: React.FC = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const STEP = 22, TR = 12, START = 10;
  const jf = Math.max(0, (f - START) / STEP), j = Math.min(7, Math.floor(jf)), q = ease((jf - j) * STEP / TR);
  const jCur = Math.min(7, j + (q >= 1 ? 1 : 0));
  const jj = Math.min(7, Math.ceil(Math.min(7, jf)));
  const jPrev = Math.max(0, Math.min(7, Math.floor(jf))), jNext = Math.min(7, jPrev + 1);
  const qq = jf >= 7 ? 1 : q;
  const ra = rankAt(jPrev), rb = rankAt(jf >= 7 ? 7 : jNext);
  const mixed = jf >= 7 ? rankAt(7) : ra.map((v, k) => v + (rb[k] - v) * qq);
  const pts = (p: number) => (jf >= 7 ? cum(p, 7) : cum(p, jPrev) + (cum(p, jNext) - cum(p, jPrev)) * qq);
  const RH = 124;
  const trophy = pop(f, fps, START + 7 * STEP + 6, 9);
  void jCur; void jj;
  return (
    <div style={{ width: 900, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}><Chip gold size={42}>{jf >= 7 ? "JORNADA 7" : `JORNADA ${Math.max(1, jNext)}`}</Chip></div>
      <div style={{ position: "relative", height: RH * 8 }}>
        {INC.map((_, p) => { const me = p === 0; const top = mixed[p] * RH; const v = pts(p); return (
          <div key={p} style={{ position: "absolute", left: 0, right: 0, top, height: RH - 12, display: "flex", alignItems: "center", gap: 18, background: me ? `${t.accent}22` : t.mutedSurface, border: `3px solid ${me ? t.accent : "transparent"}`, borderRadius: 26, padding: "0 22px", zIndex: me ? 5 : 1 }}>
            <div style={{ width: 44, fontSize: 40, fontWeight: 900, color: me ? t.accent : t.textMuted }}>{Math.round(mixed[p]) + 1}</div>
            <Av i={p} size={80} />
            <div style={{ width: 150, fontSize: 36, fontWeight: 800 }}>{me ? "TÚ" : NAMES[p]}</div>
            <div style={{ flex: 1, height: 22, borderRadius: 12, background: t.surface }}><div style={{ width: `${(v / 22) * 100}%`, height: "100%", borderRadius: 12, background: me ? t.accent : "#5f6670" }} /></div>
            <div style={{ width: 70, textAlign: "right", fontSize: 42, fontWeight: 900, color: me ? t.accent : t.text }}>{Math.round(v)}</div>
          </div>); })}
      </div>
      <div style={{ position: "absolute", right: 20, top: -34, fontSize: 90, transform: `scale(${trophy})`, opacity: trophy }}>🏆</div>
    </div>
  );
};

/* ---------- Avatares ---------- */
type Look = { skin: string; hair: string; style: "short" | "cap" | "band" | "pony" | "long" | "bald" | "wavy" | "bun"; shirt: string; beard?: boolean; glasses?: boolean; racket: string };
const LOOKS: Look[] = [
  { skin: "#f1c9a5", hair: "#2a1b12", style: "short", shirt: COLORS[0], racket: "#d7a544" },
  { skin: "#c98e6a", hair: "#111111", style: "cap", shirt: COLORS[1], beard: true, racket: "#477BD1" },
  { skin: "#8d5a3b", hair: "#1c1c1c", style: "band", shirt: COLORS[2], racket: "#f4f3ef" },
  { skin: "#e8b78f", hair: "#a05a2c", style: "pony", shirt: COLORS[3], racket: "#53B4D1" },
  { skin: "#a86f4a", hair: "#3b2a20", style: "short", shirt: COLORS[4], glasses: true, racket: "#D4643C" },
  { skin: "#f5d3b8", hair: "#c9a15a", style: "long", shirt: COLORS[5], racket: "#3D9D86" },
  { skin: "#6b4430", hair: "#111111", style: "wavy", shirt: COLORS[6], beard: true, racket: "#d7a544" },
  { skin: "#d9a577", hair: "#7a4b2a", style: "bun", shirt: COLORS[7], racket: "#8B5FC0" },
];
const shade = (hex: string, k: number) => { const c = hex.replace("#", ""); const n = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * k)))); return `#${n.map((v) => v.toString(16).padStart(2, "0")).join("")}`; };

const Racket: React.FC<{ color: string; rot?: number }> = ({ color, rot = 28 }) => (
  <g transform={`translate(152 152) rotate(${rot})`}>
    <rect x={-5} y={26} width={10} height={34} rx={4} fill="#262626" />
    <ellipse cx={0} cy={0} rx={27} ry={33} fill={color} stroke="#111" strokeWidth={4} />
    {[[-10, -14], [10, -14], [0, -4], [-12, 8], [12, 8], [0, 18], [-6, -22], [6, 4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={3.4} fill="#111" opacity={0.55} />)}
  </g>
);

const PlayerA: React.FC<{ look: Look; size: number; bg: string; swing?: number }> = ({ look, size, bg, swing = 0 }) => {
  const id = useId().replace(/:/g, "");
  const { skin, hair, style, shirt, glasses, racket } = look;
  const dark = shade(skin, 0.86);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", flex: "none" }}>
      <defs><clipPath id={id}><circle cx={100} cy={100} r={100} /></clipPath></defs>
      <circle cx={100} cy={100} r={100} fill={bg} />
      <g clipPath={`url(#${id})`}>
        {style === "long" && <path d="M54 90 Q48 36 100 38 Q152 36 146 90 L156 160 L44 160 Z" fill={hair} />}
        {style === "pony" && <><circle cx={150} cy={74} r={15} fill={hair} /><rect x={138} y={70} width={8} height={8} fill={shade(hair, 0.6)} /></>}
        {style === "bun" && <circle cx={100} cy={32} r={19} fill={hair} />}
        <path d="M18 200 Q22 146 100 138 Q178 146 182 200 Z" fill={shirt} />
        <path d="M82 142 L100 164 L118 142" fill="none" stroke="#f4f3ef" strokeWidth={6} strokeLinejoin="round" opacity={0.9} />
        <rect x={86} y={118} width={28} height={30} rx={10} fill={dark} />
        <circle cx={59} cy={98} r={9} fill={skin} /><circle cx={141} cy={98} r={9} fill={skin} />
        <ellipse cx={100} cy={92} rx={42} ry={46} fill={skin} />
        {look.beard && <path d="M60 100 Q62 142 100 144 Q138 142 140 100 Q132 126 100 128 Q68 126 60 100 Z" fill={hair} />}
        {(style === "short" || style === "band" || style === "pony" || style === "long") && <path d="M56 90 Q54 40 100 42 Q146 40 144 90 Q134 66 100 68 Q66 66 56 90 Z" fill={hair} />}
        {style === "wavy" && <path d="M54 92 Q46 38 100 38 Q154 38 146 92 Q138 60 116 66 Q100 52 84 66 Q62 60 54 92 Z" fill={hair} />}
        {style === "bun" && <path d="M56 90 Q54 40 100 42 Q146 40 144 90 Q134 66 100 68 Q66 66 56 90 Z" fill={hair} />}
        {style === "band" && <rect x={56} y={64} width={88} height={13} rx={5} fill={racket} />}
        {style === "cap" && <><path d="M54 84 Q56 36 100 36 Q144 36 146 84 Z" fill={shade(shirt, 0.9)} /><path d="M92 80 Q132 70 168 84 Q146 94 92 90 Z" fill={shade(shirt, 0.75)} /></>}
        <circle cx={84} cy={94} r={5.2} fill="#1a1a1a" /><circle cx={116} cy={94} r={5.2} fill="#1a1a1a" />
        <path d="M84 114 Q100 128 116 114" fill="none" stroke="#1a1a1a" strokeWidth={4.5} strokeLinecap="round" />
        {glasses && <g fill="none" stroke="#1a1a1a" strokeWidth={4}><circle cx={84} cy={94} r={13} /><circle cx={116} cy={94} r={13} /><path d="M97 94 H103" /></g>}
      </g>
      <g transform={`rotate(${swing} 152 152)`}><Racket color={racket} /></g>
    </svg>
  );
};

const PlayerD: React.FC<{ look: Look; size: number; bg: string }> = ({ look, size, bg }) => {
  const id = useId().replace(/:/g, "");
  const { skin, hair, style, shirt, glasses } = look;
  const dark = shade(skin, 0.8), light = shade(skin, 1.08);
  const hairL = shade(hair, 1.5);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", flex: "none" }}>
      <defs>
        <clipPath id={`c${id}`}><circle cx={100} cy={100} r={100} /></clipPath>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={dark} /></linearGradient>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={hairL} /><stop offset="0.6" stopColor={hair} /><stop offset="1" stopColor={shade(hair, 0.7)} /></linearGradient>
        <radialGradient id={`b${id}`} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor={shade(bg, 1.25)} /><stop offset="1" stopColor={shade(bg, 0.7)} /></radialGradient>
      </defs>
      <circle cx={100} cy={100} r={100} fill={`url(#b${id})`} />
      <g clipPath={`url(#c${id})`}>
        {(style === "long") && <path d="M52 92 Q44 34 100 34 Q156 34 148 92 L160 170 L40 170 Z" fill={`url(#h${id})`} />}
        {style === "bun" && <circle cx={100} cy={30} r={20} fill={`url(#h${id})`} />}
        <path d="M14 200 Q20 148 100 140 Q180 148 186 200 Z" fill={shirt} />
        <path d="M70 146 L100 150 L130 146 L116 172 L100 160 L84 172 Z" fill={shade(shirt, 1.25)} />
        <path d="M86 150 L100 164 L114 150" fill="none" stroke={shade(shirt, 0.7)} strokeWidth={3} />
        <rect x={84} y={118} width={32} height={34} rx={12} fill={dark} />
        <ellipse cx={59} cy={98} rx={7} ry={12} fill={skin} /><ellipse cx={141} cy={98} rx={7} ry={12} fill={skin} />
        <path d="M60 86 Q60 42 100 42 Q140 42 140 86 Q140 120 100 140 Q60 120 60 86 Z" fill={`url(#s${id})`} />
        {look.beard && <path d="M62 98 Q64 144 100 146 Q136 144 138 98 Q130 124 100 126 Q70 124 62 98 Z" fill={`url(#h${id})`} />}
        {(style === "short" || style === "pony" || style === "long" || style === "band") && <path d="M56 92 Q52 38 100 40 Q148 38 144 92 Q138 64 100 64 Q62 64 56 92 Z" fill={`url(#h${id})`} />}
        {style === "bun" && <path d="M56 92 Q52 38 100 40 Q148 38 144 92 Q138 64 100 64 Q62 64 56 92 Z" fill={`url(#h${id})`} />}
        {style === "wavy" && <path d="M52 94 Q42 34 100 34 Q158 34 148 94 Q142 58 118 64 Q100 48 82 64 Q58 58 52 94 Z" fill={`url(#h${id})`} />}
        {style === "band" && <rect x={58} y={62} width={84} height={12} rx={5} fill="#f4f3ef" />}
        {style === "cap" && <><path d="M56 84 Q58 34 100 34 Q142 34 144 84 Q130 70 100 70 Q70 70 56 84 Z" fill={shade(shirt, 0.85)} /><path d="M88 76 Q130 64 170 82 Q146 92 88 88 Z" fill={shade(shirt, 0.65)} /></>}
        <path d="M74 82 Q85 75 95 80" fill="none" stroke={shade(hair, 0.8)} strokeWidth={4.5} strokeLinecap="round" /><path d="M105 80 Q115 75 126 82" fill="none" stroke={shade(hair, 0.8)} strokeWidth={4.5} strokeLinecap="round" />
        <ellipse cx={85} cy={92} rx={8} ry={5} fill="#fff" /><ellipse cx={115} cy={92} rx={8} ry={5} fill="#fff" />
        <circle cx={86} cy={92} r={3.8} fill="#2a1b12" /><circle cx={114} cy={92} r={3.8} fill="#2a1b12" /><circle cx={87.5} cy={90.6} r={1.2} fill="#fff" /><circle cx={115.5} cy={90.6} r={1.2} fill="#fff" />
        <path d="M100 94 Q95 108 99 112 Q104 113 105 109" fill="none" stroke={dark} strokeWidth={3} strokeLinecap="round" />
        <path d="M88 122 Q100 130 112 122" fill="none" stroke="#7c3a3a" strokeWidth={4} strokeLinecap="round" />
        {glasses && <g fill="none" stroke="#111" strokeWidth={3.5}><rect x={70} y={83} width={28} height={20} rx={8} /><rect x={102} y={83} width={28} height={20} rx={8} /><path d="M98 92 H102" /></g>}
      </g>
    </svg>
  );
};

const Grid: React.FC<{ kind: "A" | "D" }> = ({ kind }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const R = (size: number, i: number) => kind === "A"
    ? <PlayerA look={LOOKS[i]} size={size} bg={shade(COLORS[i], 0.55)} swing={Math.sin((f + i * 5) / 6) * 16} />
    : <PlayerD look={LOOKS[i]} size={size} bg={COLORS[i]} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "36px 34px" }}>
        {LOOKS.map((_, i) => { const p = pop(f, fps, 3 + i * 3, 10); return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: Math.min(1, p * 2), transform: `translateY(${Math.sin((f + i * 7) / 9) * 6}px) scale(${0.6 + 0.4 * p})` }}>
            {R(190, i)}<div style={{ fontSize: 30, fontWeight: 800, color: t.textMuted }}>{NAMES[i]}</div>
          </div>); })}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: t.textSubtle }}>TAMAÑO DE CLASIFICACIÓN</div>
      <div style={{ display: "flex", gap: 14 }}>{LOOKS.map((_, i) => <div key={i}>{R(84, i)}</div>)}</div>
    </div>
  );
};

const mk = (key: string, tag: string, node: React.ReactNode, dur: number): SceneDef => ({ key, dur, C: () => <Frame tag={tag}>{node}</Frame> });
const GRAPHS: SceneDef[] = [mk("g2", "OPCIÓN 2 · PELOTA", <GraphBall />, 175), mk("g3", "OPCIÓN 3 · CARRERA", <Race />, 210)];
const AVATARS: SceneDef[] = [mk("aA", "AVATARES · A", <Grid kind="A" />, 130), mk("aD", "AVATARES · D", <Grid kind="D" />, 130)];
export const DEMO_GRAFICAS_FRAMES = totalFrames(GRAPHS);
export const DEMO_AVATARES_FRAMES = totalFrames(AVATARS);
export const DemoGraficas: React.FC = () => <VideoSeries scenes={GRAPHS} accent="#d7a544" />;
export const DemoAvatares: React.FC = () => <VideoSeries scenes={AVATARS} accent="#d7a544" />;
