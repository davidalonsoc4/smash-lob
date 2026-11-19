// Instagram · Reel 3 (genérico): «¿Quieres jugar más al pádel? Solo necesitas gente y ganas» → Smash & Lob pone el resto.
// Avatares básicos ficticios y réplicas simplificadas. Voz: David Martin · Eleven v3.
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Av, Chip, NAMES, Outro, Soon } from "./Reel1";
import { Card } from "./Reel2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceApp3";

type P = { ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number): TimedWord[] => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* 1 · Gancho: gente y ganas */
const Hook: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const gF = wf(ws, "gente"), nF = wf(ws, "ganas");
  const g = pop(f, fps, Math.max(0, gF - 6), 10), n = pop(f, fps, Math.max(0, nF - 6), 10);
  const Row: React.FC<{ p: number; label: string; children: React.ReactNode }> = ({ p, label, children }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 100}px)`, background: t.surface, border: `3px solid ${t.accent}`, borderRadius: 40, padding: "22px 34px", width: 900 }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", background: t.accent, color: t.accentContrast, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, fontWeight: 900, flex: "none" }}>✓</div>
      <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 3, width: 270 }}>{label}</div>
      <div style={{ display: "flex", gap: 10 }}>{children}</div>
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Words text={"¿Quieres jugar más\nal *pádel*?"} size={96} stagger={4} />
      <div style={{ height: 70 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <Row p={g} label="GENTE">{[0, 3, 5, 6].map((i) => <Av key={i} i={i} size={90} />)}</Row>
        <Row p={n} label="GANAS"><Ball size={90} /><span style={{ fontSize: 60 }}>🔥</span></Row>
      </div>
      {sfx("pop", Math.max(1, gF - 6), 0.4)}{sfx("pop", Math.max(1, nF - 6), 0.4)}
    </Frame>
  );
};

/* 2 · De lo demás se encarga Smash & Lob */
const Logo: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sm = wf(ws, "smash");
  const p = pop(f, fps, Math.max(0, sm - 8), 8);
  const burst = interpolate(f, [sm, sm + 20], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ fontSize: 72, fontWeight: 900, opacity: pop(f, fps, 0, 10), marginBottom: 56, textAlign: "center" }}>De lo demás se encarga</div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 380 + burst * 560, height: 380 + burst * 560, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile("logo.png")} style={{ width: 400, height: 400, objectFit: "contain", borderRadius: 88, filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + 0.1 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ marginTop: 56, fontSize: 100, fontWeight: 900, opacity: pop(f, fps, Math.max(0, sm - 2), 10) }}>Smash <span style={{ color: t.accent }}>&</span> Lob</div>
      {sfx("ding", sm, 0.5)}
    </Frame>
  );
};

/* 3-5 · BLOQUE CENTRAL con elementos compartidos: los mismos 8 avatares viajan de la cuadrícula a la pista, al octágono y a la gráfica */
const ICE = "#53B4D1";
type St = { x: number; y: number; s: number; o: number; l: number };
const lerpSt = (a: St, b: St, q: number): St => ({ x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q, s: a.s + (b.s - a.s) * q, o: a.o + (b.o - a.o) * q, l: a.l + (b.l - a.l) * q });
const easeO = (q: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);
const partial = (pts: [number, number][], t: number): { str: string; head: [number, number] } => {
  const tt = Math.min(pts.length - 1, Math.max(0, t));
  const i = Math.min(pts.length - 2, Math.floor(tt)), r = tt - i;
  const head: [number, number] = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
  return { str: [...pts.slice(0, i + 1), head].map((q) => q.join(",")).join(" "), head };
};

const Stage: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const CX = 450, CY = 550;
  const lgF = wf(ws, "liguilla"), inF = wf(ws, "individual"), jgF = wf(ws, "jugarás"), eqF = wf(ws, "equilibrio"), seF = wf(ws, "Sé"), cF = wf(ws, "constante"), mF = wf(ws, "mejor");
  const sc = [21, 17, 24, 12, 19, 15, 22, 14];
  // cuarteto de la pista: Ana (tú, ancla), Beto, Carla, Dani; el resto espera a los lados
  const Q = [0, 1, 2, 3], bench = [4, 5, 6, 7];
  const ROUNDS: [number, number, number][] = [[1, 2, 3], [2, 1, 3], [3, 1, 2]];
  const SLOT: [number, number][] = [[-165, 235], [165, 235], [-165, -235], [165, -235]];
  // gráfica (coordenadas locales del panel de 880x560, centrado en la escena)
  const GW = 880, GH = 560;
  const gxy = (vals: number[]): [number, number][] => vals.map((v, i) => [50 + (i / (vals.length - 1)) * (GW - 100), GH - 60 - (v / 100) * (GH - 170)]);
  const gold = gxy([8, 22, 36, 50, 63, 78, 93]), g1 = gxy([20, 55, 25, 62, 30, 58, 48]), g2 = gxy([12, 38, 60, 34, 66, 28, 55]);
  const toStage = ([x, y]: [number, number]): [number, number] => [x - GW / 2, y - GH / 2 - 10];

  const grid = (p: number): St => ({ x: ((p % 4) - 1.5) * 215, y: (Math.floor(p / 4) - 0.5) * 290 - 30, s: 160, o: 1, l: 1 });
  const court = (p: number, r: number): St => {
    if (Q.includes(p)) { const [pa, tl] = ROUNDS[r]; const slot = p === 0 ? 0 : p === pa ? 1 : p === tl ? 2 : 3; return { x: SLOT[slot][0], y: SLOT[slot][1], s: 150, o: 1, l: 1 }; }
    const bi = bench.indexOf(p);
    return { x: bi < 2 ? -392 : 392, y: (bi % 2 ? 1 : -1) * 150 - 20, s: 70, o: 0.6, l: 0 };
  };
  const oct = (p: number): St => ({ x: 340 * Math.cos((p / 8) * Math.PI * 2 - Math.PI / 2), y: -20 + 340 * Math.sin((p / 8) * Math.PI * 2 - Math.PI / 2), s: 112, o: 1, l: 1 });

  // tiempos (el mismo para J1, J2 y J3)
  const D = 26;
  const courtAt = inF + 12;
  const octAt = jgF + 4;
  const slot = (octAt - (courtAt + D)) / 3;
  const T = { court: courtAt, j2: courtAt + D + slot, j3: courtAt + D + 2 * slot, oct: octAt, graph: seF - 22 };
  const startPt = toStage(gold[0]);
  const graphOf = (p: number): St => p === 0 ? { x: startPt[0], y: startPt[1], s: 96, o: 1, l: 0 } : { x: oct(p).x * 0.6, y: oct(p).y * 0.6 + 320, s: 50, o: 0, l: 0 };
  const segs: { at: number; to: (p: number) => St; arc: number; dur: number }[] = [
    { at: T.court, to: (p) => court(p, 0), arc: 40, dur: D },
    { at: T.j2, to: (p) => court(p, 1), arc: 90, dur: D },
    { at: T.j3, to: (p) => court(p, 2), arc: 90, dur: D },
    { at: T.oct, to: oct, arc: 30, dur: D + 4 },
    { at: T.graph, to: graphOf, arc: 24, dur: 34 },
  ];
  const stateOf = (p: number): St => {
    let cur: St = grid(p);
    for (const sg of segs) {
      if (f < sg.at) break;
      const q = (f - sg.at - p * 1.6) / sg.dur;
      const target = sg.to(p);
      if (q >= 1) { cur = target; continue; }
      const st = lerpSt(cur, target, easeO(q));
      st.y -= Math.sin(Math.PI * Math.max(0, Math.min(1, q))) * sg.arc * (p % 2 ? 1 : -0.6);
      return st;
    }
    return cur;
  };
  const states = [0, 1, 2, 3, 4, 5, 6, 7].map(stateOf);

  // gráfica: línea continua; Ana la recorre
  const drawStart = T.graph + 30, drawEnd = mF + 8;
  const prog = interpolate(f, [drawStart, drawEnd], [0, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const pg = partial(gold, prog), p1 = partial(g1, prog), p2 = partial(g2, prog);
  const headPos = toStage(pg.head);
  const arrived = f >= T.graph + 34 + 7 * 1.6;
  if (arrived) { states[0] = { ...states[0], x: headPos[0], y: headPos[1] }; }

  // fondos
  const roundIdx = f >= T.j3 ? 2 : f >= T.j2 ? 1 : 0;
  const courtIn = easeO((f - T.court) / 20) * (1 - easeO((f - T.oct) / 12));
  const octOut = 1 - easeO((f - T.graph) / 14);
  const octP = (k: number) => interpolate(f, [T.oct + 14 + k * 1.1, T.oct + 14 + k * 1.1 + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chartIn = easeO((f - T.graph - 8) / 20);
  const scoreO = interpolate(f, [inF, inF + 8, T.court, T.court + 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gridChip = 1 - easeO((f - T.court + 6) / 10);
  const lines: [number, number][] = [];
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) lines.push([a, b]);
  const [pa] = ROUNDS[roundIdx];
  const roleOf = (p: number) => (p === 0 ? "TÚ" : p === pa ? "PAREJA" : "RIVAL");
  const ringOf = (p: number) => (courtIn < 0.5 || !Q.includes(p) ? undefined : p === 0 || p === pa ? t.accent : ICE);
  const trophy = pop(f, fps, drawEnd, 9);

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 1100 }}>
        {/* pista */}
        <svg width={900} height={1100} style={{ position: "absolute", inset: 0, opacity: courtIn }}>
          <rect x={CX - 300} y={CY - 440} width={600} height={880} rx={36} fill="#0f1319" stroke={t.borderStrong} strokeWidth={5} />
          <line x1={CX - 300} x2={CX + 300} y1={CY} y2={CY} stroke={t.accent} strokeWidth={6} strokeDasharray="14 12" opacity={0.9} />
          <line x1={CX} x2={CX} y1={CY - 250} y2={CY + 250} stroke={t.border} strokeWidth={3} />
          <line x1={CX - 300} x2={CX + 300} y1={CY - 250} y2={CY - 250} stroke={t.border} strokeWidth={3} />
          <line x1={CX - 300} x2={CX + 300} y1={CY + 250} y2={CY + 250} stroke={t.border} strokeWidth={3} />
        </svg>
        {/* octógono */}
        <svg width={900} height={1100} style={{ position: "absolute", inset: 0, opacity: octOut }}>
          {lines.map(([a, b], k) => { const A = states[a], B = states[b]; const p = octP(k); return p > 0 ? <line key={k} x1={CX + A.x} y1={CY + A.y} x2={CX + A.x + (B.x - A.x) * p} y2={CY + A.y + (B.y - A.y) * p} stroke={(a + b) % 2 ? t.accent : ICE} strokeWidth={3.5} opacity={0.6} /> : null; })}
        </svg>
        {/* gráfica */}
        <div style={{ position: "absolute", left: CX - GW / 2 - 20, top: CY - GH / 2 - 30, width: GW + 40, height: GH + 40, background: t.surface, border: `2px solid ${t.border}`, borderRadius: 36, opacity: chartIn, boxSizing: "border-box" }}>
          <svg width={GW} height={GH} style={{ position: "absolute", left: 20, top: 20, overflow: "visible" }}>
            {gold.map(([x], k) => <g key={k}><line x1={x} x2={x} y1={20} y2={GH - 50} stroke={t.border} strokeWidth={2} strokeDasharray="4 10" /><text x={x} y={GH - 10} textAnchor="middle" fontSize={30} fontWeight={800} fill={prog >= k ? t.text : t.textSubtle}>{`J${k + 1}`}</text></g>)}
            <polyline points={p1.str} fill="none" stroke="#5f6670" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
            <polyline points={p2.str} fill="none" stroke={ICE} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" opacity={0.7} />
            <polyline points={pg.str} fill="none" stroke={t.accent} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
            {gold.map(([x, y], k) => prog >= k && <circle key={k} cx={x} cy={y} r={10} fill={t.bg} stroke={t.accent} strokeWidth={6} />)}
          </svg>
          <div style={{ position: "absolute", right: 28, top: 8, transform: `scale(${trophy})`, fontSize: 110, opacity: trophy }}>🏆</div>
        </div>
        {/* avatares compartidos */}
        {states.map((st, p) => {
          const pI = pop(f, fps, 4 + p * 4, 10);
          const labelGrid = Math.max(0, st.l) * gridChip;
          const labelRole = courtIn > 0.6 && Q.includes(p) ? 1 : 0;
          const big = st.s > 120;
          return (
            <div key={p} style={{ position: "absolute", left: CX + st.x - st.s / 2, top: CY + st.y - st.s / 2, opacity: Math.min(1, pI * 2) * st.o, transform: `scale(${0.5 + 0.5 * pI})`, zIndex: p === 0 ? 8 : 5, filter: p === 0 && arrived ? `drop-shadow(0 0 18px ${t.accent}aa)` : undefined }}>
              <Av i={p} size={st.s} ring={p === 0 && arrived ? t.accent : ringOf(p)} />
              <div style={{ position: "absolute", left: -40, right: -40, top: st.s + 8, textAlign: "center", fontSize: big ? 32 : 26, fontWeight: 800, color: t.textMuted, opacity: labelGrid * (1 - labelRole) }}>{NAMES[p]}</div>
              <div style={{ position: "absolute", left: -40, right: -40, top: st.s + 6, textAlign: "center", fontSize: 28, fontWeight: 900, letterSpacing: 3, color: p === 0 || p === pa ? t.accent : ICE, opacity: labelRole }}>{roleOf(p)}</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: -64, textAlign: "center", fontSize: 46, fontWeight: 900, color: t.accent, opacity: scoreO * (p < 8 ? 1 : 0) }}>{Math.round(sc[p] * easeO((f - inF) / 30))}</div>
            </div>
          );
        })}
        {/* rótulos de fase */}
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: gridChip * pop(f, fps, Math.max(0, lgF - 6), 10) }}><Chip gold>{f >= inF ? "LIGUILLA · INDIVIDUAL" : "LIGUILLA"}</Chip></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", gap: 22, opacity: courtIn }}>
          {["J1", "J2", "J3"].map((j, k) => <div key={j} style={{ opacity: k <= roundIdx ? 1 : 0.35, transform: `scale(${k === roundIdx ? 1.18 : 1})` }}><Chip gold={k === roundIdx} size={40}>{j}</Chip></div>)}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", gap: 20, opacity: (1 - easeO((f - eqF + 4) / 8)) * easeO((f - T.oct - 10) / 10) * (1 - courtIn) }}>
          <Chip gold size={40}>CON TODOS</Chip>
          <div style={{ border: `3px solid ${ICE}`, color: ICE, borderRadius: 999, padding: "14px 36px", fontSize: 40, fontWeight: 900, letterSpacing: 4, background: "#141518", whiteSpace: "nowrap" }}>CONTRA TODOS</div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: easeO((f - eqF) / 10) * octOut, transform: `scale(${0.8 + 0.2 * pop(f, fps, eqF, 10)})` }}><Chip gold size={46}>✓ EQUILIBRIO PERFECTO</Chip></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: -10, display: "flex", justifyContent: "center", opacity: pop(f, fps, cF - 6, 10) * chartIn }}><Chip>CONSTANCIA</Chip></div>
      </div>
      {[T.court, T.j2, T.j3, T.oct, T.graph].map((m) => sfx("whoosh", Math.max(1, Math.round(m)), 0.18))}{sfx("ding", eqF, 0.45)}{sfx("ding", drawEnd, 0.45)}
    </Frame>
  );
};

/* 6 · La aplicación se encarga de todo */
const Auto: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const gF = wf(ws, "genera"), eF = wf(ws, "equilibra"), cF = wf(ws, "calcula"), rF = wf(ws, "resultados");
  return (
    <Frame timedWords={ws}>
      <div style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 34, opacity: pop(f, fps, 2, 10) }}>
        <Img src={staticFile("logo.png")} style={{ width: 130, height: 130, borderRadius: 30, objectFit: "contain" }} />
        <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>La app se<br />encarga de <span style={{ color: t.accent }}>todo</span></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card at={gF - 6} title="CALENDARIO DE PARTIDOS" gone={0}>
          {[["Jornada 1", "Jugada"], ["Jornada 2", "En juego"], ["Jornada 3", "🔒 Secreta"]].map(([a, b], k) => <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 36, fontWeight: 800, padding: "7px 0", color: k === 2 ? t.textSubtle : t.text }}><span>{a}</span><span>{b}</span></div>)}
        </Card>
        <Card at={eF - 6} title="PAREJAS Y RIVALES EQUILIBRADOS" gone={0}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: 16 }}>
            <span style={{ display: "flex", gap: 10 }}><Av i={0} size={92} /><Av i={3} size={92} /></span><span style={{ fontSize: 48, fontWeight: 900, color: t.textMuted }}>vs</span><span style={{ display: "flex", gap: 10 }}><Av i={5} size={92} /><Av i={6} size={92} /></span>
          </div>
        </Card>
        <Card at={cF - 6} title="CLASIFICACIÓN" gone={0}>
          {[[2, 17], [6, 15], [0, 14]].map(([a, p], r) => <div key={a} style={{ display: "flex", alignItems: "center", gap: 16, padding: "5px 0", fontSize: 36, fontWeight: 800 }}><span style={{ width: 36, color: r === 0 ? t.accent : t.textMuted }}>{r + 1}</span><Av i={a} size={52} /><span style={{ flex: 1 }}>{NAMES[a]}</span><span style={{ color: r === 0 ? t.accent : t.text }}>{p}</span></div>)}
        </Card>
      </div>
      <div style={{ marginTop: 26, opacity: pop(f, fps, rF, 9) }}><Chip gold size={44}>✓ AUTOMÁTICO</Chip></div>
      {[gF, eF, cF].map((m) => sfx("pop", Math.max(1, m - 6), 0.35))}{sfx("ding", rF, 0.45)}
    </Frame>
  );
};

const makeScenes = (): SceneDef[] => [
  { key: "hook", dur: Math.round((BOUNDS[1] - BOUNDS[0]) * 30), C: () => <Hook ws={sceneWords(0)} /> },
  { key: "logo", dur: Math.round((BOUNDS[2] - BOUNDS[1]) * 30), C: () => <Logo ws={sceneWords(1)} /> },
  { key: "stage", dur: Math.round((BOUNDS[5] - BOUNDS[2]) * 30), C: () => <Stage ws={wordsBetween(2, 5)} /> },
  { key: "auto", dur: Math.round((BOUNDS[6] - BOUNDS[5]) * 30), C: () => <Auto ws={sceneWords(5)} /> },
  { key: "soon", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Soon ws={sceneWords(6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[8] - BOUNDS[7]) * 30), C: () => <Outro ws={sceneWords(7)} /> },
];
export const REEL3_FRAMES = totalFrames(makeScenes());
export const Reel3: React.FC = () => <VideoSeries scenes={makeScenes()} accent="#d7a544" voice="voice-app3-david.mp3" />;
