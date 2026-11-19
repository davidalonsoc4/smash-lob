// Vídeo 1 (v2): "Ya solo queda un mes… ¿sabes cómo funciona Smash & Lob?". Bloque central con TRANSICIÓN POR ELEMENTOS COMPARTIDOS:
// los mismos ocho avatares (formas genéricas de la app, un color por jugador) viajan de la lista a la pista, al octágono, a las parejas y al ranking.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py). Datos de ejemplo ficticios; nunca emparejamientos reales.
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { MatchScore, OpeningCard, PersonIcon, TAB_ITEMS, TabBar, Zoom } from "./appUi";
import type { ScoreRow } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice01b";
import { spring } from "remotion";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};
const clampO = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = (q: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);
const ICE = "#53B4D1";

/* ---------- Avatares genéricos con color por jugador ---------- */
const PCOL = ["#477BD1", "#3D9D86", "#D4643C", "#8B5FC0", "#53B4D1", "#d7a544", "#C4567A", "#7FA650"];
const GAv: React.FC<{ i: number; size: number; ring?: string }> = ({ i, size, ring }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: PCOL[i % 8], display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ring ? `0 0 0 ${Math.max(4, size / 16)}px ${ring}` : "none" }}>
    <PersonIcon size={size * 0.58} color="#0b0c0e" />
  </div>
);

const Chip: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number; color?: string }> = ({ children, gold, size = 40, color }) => {
  const t = useTheme(); const c = color ?? t.accent;
  return <div style={{ display: "inline-block", border: `3px solid ${c}`, background: gold ? c : t.surface, color: gold ? t.accentContrast : c, borderRadius: 999, padding: "14px 36px", fontSize: size, fontWeight: 900, letterSpacing: 4, whiteSpace: "nowrap" }}>{children}</div>;
};

/* 1 · Gancho */
const Hook = ({ league }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  const day = Math.round(interpolate(f, [8, 34], [league.daysToStart + 6, league.daysToStart], { ...clampO, easing: Easing.out(Easing.cubic) }));
  return (
    <Frame>
      <Words text={"Ya solo queda\n*un mes*"} size={128} stagger={5} />
      <div style={{ marginTop: 70, opacity: p, transform: `scale(${p})`, background: t.accent, color: t.accentContrast, borderRadius: 44, padding: "24px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 140, fontWeight: 900, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 8 }}>DÍAS</div>
      </div>
    </Frame>
  );
};

/* 2 · La pregunta */
const Question = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 6, 12);
  const smF = wf(ws, "smash");
  return (
    <Frame timedWords={ws}>
      <Words text={"¿Sabes cómo\nfunciona"} size={112} stagger={4} />
      <div style={{ height: 40 }} />
      <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 ${50 + 30 * Math.sin(f / 6)}px ${t.accent}66)`, transform: `scale(${p})` }} />
      <div style={{ marginTop: 30, fontSize: 92, fontWeight: 900, opacity: pop(f, fps, smF - 4, 10) }}>Smash <span style={{ color: t.accent }}>&</span> Lob<span style={{ color: t.accent }}>?</span></div>
      {sfx("ding", smF, 0.4)}
    </Frame>
  );
};

/* 3-5 · BLOQUE CENTRAL con elementos compartidos */
type St = { x: number; y: number; s: number; l: number };
const lerpSt = (a: St, b: St, q: number): St => ({ x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, s: a.s + (b.s - a.s) * q, l: a.l + (b.l - a.l) * q });

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const names = league.playerNames.map((n) => n.split(" ")[0]);
  const NAMES = league.playerNames;
  // cuarteto de ejemplo (nombres de pila de la liga; NO es un cuadro real)
  const Q = league.exampleQuartet.map((n) => NAMES.findIndex((m) => m.split(" ")[0] === n));
  const bench = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => !Q.includes(i));
  const ROUNDS: [number, number, number][] = [[1, 2, 3], [2, 1, 3], [3, 1, 2]]; // índices dentro de Q: [compañero del ancla, rival, rival]
  const SLOT: [number, number][] = [[-165, 235], [165, 235], [-165, -235], [165, -235]]; // BL (ancla), BR (compañero), TL, TR

  const grid = (p: number): St => ({ x: ((p % 4) - 1.5) * 215, y: (Math.floor(p / 4) - 0.5) * 285 - 30, s: 150, l: 1 });
  const court = (p: number, r: number): St => {
    const qi = Q.indexOf(p);
    if (qi >= 0) {
      const [pa, tl, tr] = ROUNDS[r];
      const slot = qi === 0 ? 0 : qi === pa ? 1 : qi === tl ? 2 : 3;
      void tr;
      return { x: SLOT[slot][0], y: SLOT[slot][1], s: 150, l: 1 };
    }
    const bi = bench.indexOf(p);
    return { x: bi < 2 ? -392 : 392, y: (bi % 2 ? 1 : -1) * 150 - 20, s: 70, l: 0 };
  };
  const oct = (p: number): St => ({ x: 340 * Math.cos((p / 8) * Math.PI * 2 - Math.PI / 2), y: -20 + 340 * Math.sin((p / 8) * Math.PI * 2 - Math.PI / 2), s: 112, l: 1 });
  const pairs = (p: number): St => { const k = Math.floor(p / 2); return { x: (k % 2 ? 215 : -215) + (p % 2 ? 80 : -80), y: (k < 2 ? -250 : 130), s: 128, l: 1 }; };
  const order = rankAt(NAMES, 2);
  const rank = (p: number): St => ({ x: -318, y: (order[NAMES[p]] - 3.5) * 118, s: 84, l: 0 });

  const T = {
    court: wf(ws, "En") + 4,
    j2: wf(ws, "rivales") - 8,
    j3: wf(ws, "vez") - 14,
    oct: wf(ws, "buscando") - 8,
    pairs: wf(ws, "parejas"),
    rank: wf(ws, "ranking") - 6,
  };
  const D = 24;
  const segs: { at: number; to: (p: number) => St; arc: number }[] = [
    { at: T.court, to: (p) => court(p, 0), arc: 40 },
    { at: T.j2, to: (p) => court(p, 1), arc: 90 },
    { at: T.j3, to: (p) => court(p, 2), arc: 90 },
    { at: T.oct, to: oct, arc: 30 },
    { at: T.pairs, to: pairs, arc: 30 },
    { at: T.rank, to: rank, arc: 24 },
  ];
  const stateOf = (p: number): St => {
    let cur: St = grid(p);
    for (const s of segs) {
      if (f < s.at) break;
      const q = (f - s.at - p * 1.6) / D;
      const target = s.to(p);
      if (q >= 1) { cur = target; continue; }
      const e = ease(q);
      const st = lerpSt(cur, target, e);
      st.y -= Math.sin(Math.PI * Math.max(0, Math.min(1, q))) * s.arc * (p % 2 ? 1 : -0.6);
      return st;
    }
    return cur;
  };
  const intro = (p: number) => pop(f, fps, wf(ws, "ocho") + p * 3, 11);

  // fases
  const courtIn = ease((f - T.court) / 20) * (1 - ease((f - T.oct) / 12));
  const roundIdx = f >= T.j3 ? 2 : f >= T.j2 ? 1 : 0;
  const octP = (k: number) => interpolate(f, [T.oct + 14 + k * 1.1, T.oct + 14 + k * 1.1 + 8], [0, 1], clampO);
  const octOut = 1 - ease((f - T.pairs) / 12);
  const pairsIn = ease((f - T.pairs - 12) / 14) * (1 - ease((f - T.rank) / 8));
  const rankIn = ease((f - T.rank - 14) / 16);
  const gridChips = 1 - ease((f - T.court + 10) / 10);
  const lines: [number, number][] = [];
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) lines.push([a, b]);
  const statesNow = [0, 1, 2, 3, 4, 5, 6, 7].map(stateOf);
  const teamRing = (p: number) => { const qi = Q.indexOf(p); if (qi < 0) return undefined; const [pa] = ROUNDS[roundIdx]; return qi === 0 || qi === pa ? t.accent : ICE; };
  const showRing = courtIn > 0.5;
  const CX = 450, CY = 550;
  const ochoF = wf(ws, "ocho"), sieteF = wf(ws, "siete");

  return (
    <Frame example timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 1100 }}>
        {/* pista */}
        <svg width={900} height={1100} style={{ position: "absolute", inset: 0, opacity: courtIn }}>
          <rect x={CX - 300} y={CY - 440} width={600} height={880} rx={36} fill="#0f1319" stroke={t.borderStrong} strokeWidth={5} />
          <line x1={CX - 300} x2={CX + 300} y1={CY} y2={CY} stroke={t.accent} strokeWidth={6} strokeDasharray="14 12" opacity={0.9} />
          <line x1={CX} x2={CX} y1={CY - 250} y2={CY + 250} stroke={t.border} strokeWidth={3} />
          <line x1={CX - 300} x2={CX + 300} y1={CY - 250} y2={CY - 250} stroke={t.border} strokeWidth={3} />
          <line x1={CX - 300} x2={CX + 300} y1={CY + 250} y2={CY + 250} stroke={t.border} strokeWidth={3} />
          {/* vínculo de pareja */}
          {(() => { const [pa] = ROUNDS[roundIdx]; const a = statesNow[Q[0]], b = statesNow[Q[pa]]; const other = [1, 2, 3].filter((x) => x !== pa); const c = statesNow[Q[other[0]]], d = statesNow[Q[other[1]]];
            return <g><line x1={CX + a.x} y1={CY + a.y} x2={CX + b.x} y2={CY + b.y} stroke={t.accent} strokeWidth={14} strokeLinecap="round" opacity={0.55} /><line x1={CX + c.x} y1={CY + c.y} x2={CX + d.x} y2={CY + d.y} stroke={ICE} strokeWidth={14} strokeLinecap="round" opacity={0.55} /></g>; })()}
        </svg>
        {/* octógono */}
        <svg width={900} height={1100} style={{ position: "absolute", inset: 0, opacity: octOut }}>
          {lines.map(([a, b], k) => { const A = statesNow[a], B = statesNow[b]; const p = octP(k); const col = (a + b) % 2 ? t.accent : ICE; return p > 0 ? <line key={k} x1={CX + A.x} y1={CY + A.y} x2={CX + A.x + (B.x - A.x) * p} y2={CY + A.y + (B.y - A.y) * p} stroke={col} strokeWidth={3.5} opacity={0.6} /> : null; })}
        </svg>
        {/* parejas (barras entre compañeros) */}
        <svg width={900} height={1100} style={{ position: "absolute", inset: 0, opacity: pairsIn }}>
          {[0, 1, 2, 3].map((k) => { const A = statesNow[k * 2], B = statesNow[k * 2 + 1]; return <line key={k} x1={CX + A.x} y1={CY + A.y} x2={CX + B.x} y2={CY + B.y} stroke={t.accent} strokeWidth={14} strokeLinecap="round" opacity={0.7} />; })}
        </svg>
        {/* ranking: filas de fondo */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, opacity: rankIn }}>
          {NAMES.map((n, p) => { const r = order[n]; const y = CY + (r - 3.5) * 118; const me = r === 0; const pts = Math.round(PTS[n][2] * ease((f - T.rank - 22) / 20)); const d = DIFF[n][2];
            return <div key={n} style={{ position: "absolute", left: 40, right: 40, top: y - 46, height: 92, borderRadius: 24, background: me ? `${t.accent}22` : t.mutedSurface, border: `3px solid ${me ? t.accent : "transparent"}`, display: "flex", alignItems: "center", paddingLeft: 190, paddingRight: 30, gap: 20 }}>
              <div style={{ flex: 1, fontSize: 40, fontWeight: 800 }}>{names[p]}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: t.textMuted }}>{d > 0 ? `+${d}` : d}</div>
              <div style={{ width: 70, textAlign: "right", fontSize: 46, fontWeight: 900, color: me ? t.accent : t.text }}>{pts}</div>
            </div>; })}
        </div>
        {/* avatares compartidos */}
        {statesNow.map((st, p) => {
          const pI = intro(p);
          const ring = showRing ? teamRing(p) : undefined;
          const labelO = Math.min(1, Math.max(0, st.l)) * (courtIn > 0.5 && Q.indexOf(p) < 0 ? 0 : 1) * (rankIn > 0.1 ? 0 : 1);
          return (
            <div key={p} style={{ position: "absolute", left: CX + st.x - st.s / 2, top: CY + st.y - st.s / 2, opacity: Math.min(1, pI * 2), transform: `scale(${0.4 + 0.6 * pI})`, zIndex: 5 }}>
              <GAv i={p} size={st.s} ring={ring} />
              <div style={{ position: "absolute", left: -40, right: -40, top: st.s + 8, textAlign: "center", fontSize: st.s > 120 ? 32 : 26, fontWeight: 800, color: t.textMuted, opacity: labelO }}>{names[p]}</div>
            </div>
          );
        })}
        {/* rótulos de fase */}
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", gap: 22, opacity: gridChips }}>
          <div style={{ opacity: pop(f, fps, ochoF + 14, 12), transform: `scale(${0.85 + 0.15 * pop(f, fps, ochoF + 14, 12)})` }}><Chip>8 JUGADORES</Chip></div>
          <div style={{ opacity: pop(f, fps, sieteF, 12), transform: `scale(${0.85 + 0.15 * pop(f, fps, sieteF, 12)})` }}><Chip>7 JORNADAS</Chip></div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", gap: 22, opacity: courtIn }}>
          {["J1", "J2", "J3"].map((j, k) => <div key={j} style={{ opacity: k <= roundIdx ? 1 : 0.35, transform: `scale(${k === roundIdx ? 1.18 : 1})` }}><Chip gold={k === roundIdx} size={40}>{j}</Chip></div>)}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: ease((f - T.oct - 90) / 10) * octOut, transform: `scale(${0.8 + 0.2 * pop(f, fps, T.oct + 90, 10)})` }}><Chip gold size={46}>✓ EQUILIBRIO PERFECTO</Chip></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: pairsIn }}><Chip size={44}>SE JUEGA POR PAREJAS</Chip></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: rankIn }}><Chip gold size={44}>RANKING INDIVIDUAL</Chip></div>
      </div>
      {[T.court, T.j2, T.j3, T.oct, T.pairs, T.rank].map((m) => sfx("whoosh", Math.max(1, m), 0.18))}{sfx("ding", T.oct + 90, 0.45)}
    </Frame>
  );
};

/* 6 · Tres sets, un punto por set */
const scoreB = (q: [string, string, string, string]): [ScoreRow, ScoreRow] => [
  { names: [q[0], q[1]], games: [6, 3, 6], sets: 2, winner: true },
  { names: [q[2], q[3]], games: [4, 6, 2], sets: 1, winner: false },
];
const Points = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const trF = wf(ws, "tres"), totF = wf(ws, "punto");
  const shown = f >= trF + 22 ? 3 : f >= trF + 11 ? 2 : f >= trF ? 1 : 0;
  const totals = f >= totF;
  const glow = totals ? 1 + 0.18 * Math.max(0, 1 - (f - totF) / 12) : 1;
  const chip = pop(f, fps, totF + 4, 11);
  return (
    <Frame tag="PUNTOS" example timedWords={ws}>
      <Words text={"Siempre\n*3 sets*"} size={110} delay={2} stagger={5} />
      <div style={{ height: 40 }} />
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})` }}><Zoom z={2.2}><MatchScore rows={scoreB(league.exampleQuartet)} shownSets={shown} showTotals={totals} totalScale={glow} /></Zoom></div>
      <div style={{ height: 36 }} />
      <div style={{ opacity: chip, transform: `translateY(${(1 - chip) * 40}px)` }}><Chip size={42}>1 set = 1 punto</Chip></div>
      {sfx("pop", trF, 0.3)}{sfx("pop", trF + 11, 0.3)}{sfx("pop", trF + 22, 0.3)}{sfx("ding", totF, 0.5)}
    </Frame>
  );
};

/* 7 · Jornada de apertura */
const Opening = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const o = league.opening;
  const pandoF = wf(ws, "Polideportivo"), horaF = wf(ws, "hora"), unoF = wf(ws, "1");
  return (
    <Frame tag="EL GRAN DÍA" timedWords={ws}>
      <div style={{ position: "absolute", top: 300, opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})` }}>
        <Zoom z={1.95}><OpeningCard eyebrow="JORNADA DE APERTURA" weekday={o.weekday} day={o.day} month={o.month} place={o.place} time={o.time} note={o.note} placeP={pop(f, fps, pandoF, 12)} timeP={pop(f, fps, horaF, 12)} noteP={pop(f, fps, unoF, 14)} /></Zoom>
      </div>
      {sfx("pop", pandoF, 0.35)}{sfx("ding", horaF, 0.4)}
    </Frame>
  );
};

/* 8 · Teaser de la serie */
const Tabs = ({ ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = wf(ws, "usar") - 4, per = 9;
  const idx = Math.max(0, Math.min(4, Math.floor((f - start) / per)));
  const prog = spring({ frame: f - start - idx * per, fps, config: { damping: 14, stiffness: 170 } });
  const p = pop(f, fps, 2, 13);
  return (
    <Frame timedWords={ws}>
      <Words text={"Todo en\n*cinco pestañas*"} size={110} delay={6} stagger={5} />
      <div style={{ height: 100 }} />
      <div style={{ opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}><Zoom z={2.15}><TabBar active={f < start ? -1 : idx} progress={prog} /></Zoom></div>
      <div style={{ marginTop: 50, fontSize: 56, fontWeight: 900, height: 70 }}>{f >= start ? TAB_ITEMS[idx][1] : ""}</div>
      {TAB_ITEMS.map((_, i) => sfx("pop", start + i * per, 0.25))}
    </Frame>
  );
};

/* 9 · Cierre (sin exclamaciones; la voz lo dice sobrio) */
const Outro = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const nF = wf(ws, "pista");
  const bounce = Math.abs(Math.sin((f - nF) / 7)) * 60 * Math.exp(-Math.max(0, f - nF) / 40);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 30 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={124} delay={4} stagger={3} />
      <div style={{ marginTop: 40, opacity: pop(f, fps, nF, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {sfx("ding", nF, 0.5)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "hook", dur: Math.round((BOUNDS[1] - BOUNDS[0]) * 30), C: () => <Hook league={league} ws={sceneWords(0)} /> },
  { key: "question", dur: Math.round((BOUNDS[2] - BOUNDS[1]) * 30), C: () => <Question league={league} ws={sceneWords(1)} /> },
  { key: "stage", dur: Math.round((BOUNDS[5] - BOUNDS[2]) * 30), C: () => <Stage league={league} ws={wordsBetween(2, 5)} /> },
  { key: "points", dur: Math.round((BOUNDS[6] - BOUNDS[5]) * 30), C: () => <Points league={league} ws={sceneWords(5)} /> },
  { key: "opening", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Opening league={league} ws={sceneWords(6)} /> },
  { key: "tabs", dur: Math.round((BOUNDS[8] - BOUNDS[7]) * 30), C: () => <Tabs league={league} ws={sceneWords(7)} /> },
  { key: "outro", dur: Math.round((BOUNDS[9] - BOUNDS[8]) * 30), C: () => <Outro league={league} ws={sceneWords(8)} /> },
];
export const BIENVENIDA2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Bienvenida2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-01b-david.mp3" />;
