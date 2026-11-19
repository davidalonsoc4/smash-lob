// Instagram · Reel 3 (genérico): «¿Quieres jugar más al pádel? Solo necesitas gente y ganas» → Smash & Lob pone el resto.
// Avatares básicos ficticios y réplicas simplificadas. Voz: David Martin · Eleven v3.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Av, Chip, COLORS, NAMES, Outro, Soon } from "./Reel1";
import { Card } from "./Reel2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceApp3";

type P = { ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
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

/* 3 · Liguilla entre amigos, competición individual */
const League: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const lgF = wf(ws, "liguilla"), inF = wf(ws, "individual");
  const sc = [21, 17, 24, 12, 19, 15, 22, 14];
  const grow = interpolate(f, [inF, inF + 30], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: pop(f, fps, Math.max(0, lgF - 6), 10), marginBottom: 50 }}><Chip gold>{grow > 0.05 ? "LIGUILLA · INDIVIDUAL" : "LIGUILLA"}</Chip></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px 36px" }}>
        {COLORS.map((_, i) => { const p = pop(f, fps, 4 + i * 4, 9); return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: Math.min(1, p * 2), transform: `scale(${0.5 + 0.5 * p})` }}>
            <Av i={i} size={160} />
            <div style={{ fontSize: 30, fontWeight: 800, color: t.textMuted }}>{NAMES[i]}</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: t.accent, opacity: grow, minHeight: 52 }}>{Math.round(sc[i] * grow)}</div>
          </div>); })}
      </div>
    </Frame>
  );
};

/* 4 · Parejas y rivales rotativos (pista en planta) y después con y contra todos */
const ICE = "#53B4D1";
const SLOTS: Record<string, [number, number]> = { BL: [-175, 250], BR: [175, 250], TL: [-175, -250], TR: [175, -250] };
// Jornadas desde el punto de vista de "tú" (Ana, siempre abajo a la izquierda): [compañero en BR, rival en TL, rival en TR]
const JORN: [number, number, number][] = [[1, 2, 3], [2, 1, 3], [3, 1, 2]];
const ease = (q: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);

const Court: React.FC<{ f: number; stepAt: number[]; ws: TimedWord[] }> = ({ f, stepAt }) => {
  const t = useTheme();
  const D = 20; // duración del movimiento (cuadros)
  const step = f < stepAt[0] ? 0 : f < stepAt[1] ? 1 : 2;
  const pos = (av: number): [number, number] => {
    const slotOf = (j: number): [number, number] => {
      const [pa, tl] = JORN[j];
      if (av === 0) return SLOTS.BL; if (av === pa) return SLOTS.BR; if (av === tl) return SLOTS.TL; return SLOTS.TR;
    };
    if (step === 0) return slotOf(0);
    const q = ease((f - stepAt[step - 1]) / D);
    const [x0, y0] = slotOf(step - 1), [x1, y1] = slotOf(step);
    const arc = Math.sin(Math.PI * q) * (x0 === x1 && y0 === y1 ? 0 : 90) * (av % 2 ? 1 : -1);
    return [x0 + (x1 - x0) * q + arc * 0.4, y0 + (y1 - y0) * q - Math.abs(arc) * 0.5];
  };
  const mv = step === 0 ? 1 : Math.min(1, (f - stepAt[step - 1]) / D);
  const moving = step > 0 && mv < 1;
  const role = (av: number) => (av === 0 ? "me" : JORN[step][0] === av ? "pair" : "rival");
  const hop = (av: number) => { // pequeño salto al moverse
    if (!moving) return 0;
    const [pa0, tl0, tr0] = JORN[step - 1], [pa1, tl1, tr1] = JORN[step];
    const prevSlot = av === pa0 ? "BR" : av === tl0 ? "TL" : av === tr0 ? "TR" : "BL";
    const nextSlot = av === pa1 ? "BR" : av === tl1 ? "TL" : av === tr1 ? "TR" : "BL";
    return prevSlot === nextSlot ? 0 : Math.sin(Math.PI * mv) * 40;
  };
  const CX = 450, CY = 560;
  const pairGlow = 0.6 + 0.4 * Math.sin(f / 5);
  const pr = pos(JORN[step][0]), me = pos(0);
  return (
    <div style={{ position: "relative", width: 900, height: 1120 }}>
      <svg width={900} height={1120} style={{ position: "absolute", inset: 0 }}>
        <rect x={110} y={40} width={680} height={1040} rx={40} fill="#0f1319" stroke={t.borderStrong} strokeWidth={5} />
        <line x1={110} x2={790} y1={560} y2={560} stroke={t.accent} strokeWidth={6} strokeDasharray="14 12" opacity={0.85} />
        <line x1={450} x2={450} y1={300} y2={820} stroke={t.border} strokeWidth={3} />
        <line x1={110} x2={790} y1={300} y2={300} stroke={t.border} strokeWidth={3} />
        <line x1={110} x2={790} y1={820} y2={820} stroke={t.border} strokeWidth={3} />
        {/* vínculo de pareja (dorado) */}
        <line x1={CX + me[0]} y1={CY + me[1]} x2={CX + pr[0]} y2={CY + pr[1]} stroke={t.accent} strokeWidth={14} strokeLinecap="round" opacity={0.35 + 0.35 * pairGlow} />
        {/* rivales: líneas azules hacia el otro lado de la red */}
        {[1, 2, 3].filter((a) => role(a) === "rival").map((a) => { const q = pos(a); return <line key={a} x1={CX + me[0]} y1={CY + me[1]} x2={CX + q[0]} y2={CY + q[1]} stroke={ICE} strokeWidth={5} strokeDasharray="4 14" strokeLinecap="round" opacity={0.7} />; })}
      </svg>
      <div style={{ position: "absolute", left: CX - 120, top: 535, width: 240, textAlign: "center", fontSize: 54, fontWeight: 900, color: t.text, background: "#0f1319", borderRadius: 30 }}>VS</div>
      {[0, 1, 2, 3].map((av) => {
        const [x, y] = pos(av); const r = role(av); const h = hop(av);
        const ring = r === "me" ? "#f4f3ef" : r === "pair" ? t.accent : ICE;
        return (
          <div key={av} style={{ position: "absolute", left: CX + x - 85, top: CY + y - 85 - h, transform: `scale(${1 + h / 200})`, zIndex: 10 + (h > 0 ? 5 : 0) }}>
            <Av i={av} size={170} ring={ring} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: -52, textAlign: "center", fontSize: 32, fontWeight: 900, letterSpacing: 3, color: ring }}>{r === "me" ? "TÚ" : r === "pair" ? "PAREJA" : "RIVAL"}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: -64, display: "flex", justifyContent: "center", gap: 22 }}>
        {["J1", "J2", "J3"].map((j, k) => <div key={j} style={{ opacity: k <= step ? 1 : 0.35, transform: `scale(${k === step ? 1.18 : 1})` }}><Chip gold={k === step} size={40}>{j}</Chip></div>)}
      </div>
    </div>
  );
};

const Balance: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const jgF = wf(ws, "jugarás"), eqF = wf(ws, "equilibrio");
  const split = jgF - 4;
  if (f < split) {
    return (
      <Frame timedWords={ws}>
        <div style={{ transform: "translateY(-10px) scale(0.9)", transformOrigin: "50% 50%" }}>
          <Court f={f} stepAt={[Math.round(split * 0.36), Math.round(split * 0.7)]} ws={ws} />
        </div>
      </Frame>
    );
  }
  const R = 330, cx = 450, cy = 400;
  const pt = (i: number): [number, number] => [cx + R * Math.cos((i / 8) * Math.PI * 2 - Math.PI / 2), cy + R * Math.sin((i / 8) * Math.PI * 2 - Math.PI / 2)];
  const lines: [number, number][] = [];
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) lines.push([a, b]);
  const g0 = f - jgF;
  const chip = pop(f, fps, eqF, 10);
  const glow = interpolate(f, [eqF, eqF + 20], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 800 }}>
        <svg width={900} height={800} style={{ position: "absolute", inset: 0 }}>
          {lines.map(([a, b], k) => {
            const [x1, y1] = pt(a), [x2, y2] = pt(b);
            const p = interpolate(g0, [k * 1.4, k * 1.4 + 9], [0, 1], clamp);
            const col = (a + b) % 2 ? t.accent : ICE;
            return (
              <g key={k}>
                <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={col} strokeWidth={3.5 + glow * 1.5} opacity={0.6 + glow * 0.3} />
                {p > 0 && p < 1 && <circle cx={x1 + (x2 - x1) * p} cy={y1 + (y2 - y1) * p} r={9} fill={col === ICE ? "#c8f1ff" : "#fff3c9"} />}
              </g>
            );
          })}
        </svg>
        {COLORS.map((_, i) => { const [x, y] = pt(i); const p = pop(f, fps, jgF - 4 + i, 10); return <div key={i} style={{ position: "absolute", left: x - 55, top: y - 55, transform: `scale(${p})` }}><Av i={i} size={110} ring={glow > 0.5 ? t.accent : undefined} /></div>; })}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
        <div style={{ opacity: g0 > 0 ? 1 : 0.3 }}><Chip gold size={38}>CON TODOS</Chip></div>
        <div style={{ opacity: g0 > 14 ? 1 : 0.3, border: `3px solid ${ICE}`, color: ICE, borderRadius: 999, padding: "14px 36px", fontSize: 38, fontWeight: 900, letterSpacing: 4, background: "#141518" }}>CONTRA TODOS</div>
      </div>
      <div style={{ marginTop: 30, opacity: chip, transform: `scale(${0.8 + 0.2 * chip})` }}><Chip gold size={46}>✓ EQUILIBRIO PERFECTO</Chip></div>
      {sfx("ding", eqF, 0.45)}{sfx("pop", jgF, 0.3)}
    </Frame>
  );
};

/* 5 · Sé el más constante y demuestra quién es el mejor */
const Best: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cF = wf(ws, "constante"), mF = wf(ws, "mejor");
  const W = 880, H = 520;
  const gold = [0, 0.18, 0.34, 0.5, 0.66, 0.8, 1], g1 = [0.1, 0.5, 0.2, 0.62, 0.25, 0.55, 0.45], g2 = [0.05, 0.3, 0.55, 0.3, 0.6, 0.2, 0.5];
  const pts = (arr: number[], k: number) => arr.slice(0, Math.max(2, Math.ceil(k * arr.length))).map((v, i) => `${(i / (arr.length - 1)) * W},${H - v * H * 0.9 - 20}`).join(" ");
  const k = interpolate(f, [4, mF + 4], [0, 1], clamp);
  const trophy = pop(f, fps, mF, 9);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: pop(f, fps, cF - 6, 10), marginBottom: 40 }}><Chip>CONSTANCIA</Chip></div>
      <div style={{ position: "relative", width: W, height: H + 80, background: t.surface, border: `2px solid ${t.border}`, borderRadius: 36, padding: 20, boxSizing: "content-box" }}>
        <svg width={W} height={H}>
          <polyline points={pts(g1, k)} fill="none" stroke="#5f6670" strokeWidth={7} strokeLinejoin="round" />
          <polyline points={pts(g2, k)} fill="none" stroke="#53B4D1" strokeWidth={7} strokeLinejoin="round" opacity={0.7} />
          <polyline points={pts(gold, k)} fill="none" stroke={t.accent} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", right: 30, top: 14, transform: `scale(${trophy})`, fontSize: 100 }}>🏆</div>
      </div>
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

const COMPS: React.FC<P>[] = [Hook, Logo, League, Balance, Best, Auto, Soon, Outro];
const KEYS = ["hook", "logo", "league", "balance", "best", "auto", "soon", "outro"];
const makeScenes = (): SceneDef[] => COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C ws={sceneWords(i)} /> }));
export const REEL3_FRAMES = totalFrames(makeScenes());
export const Reel3: React.FC = () => <VideoSeries scenes={makeScenes()} accent="#d7a544" voice="voice-app3-david.mp3" />;
