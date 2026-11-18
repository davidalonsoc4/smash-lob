// Instagram · Reel 2 (genérico): «¿Y si tu compañero no puede jugar?» → parejas rotativas, clasificación individual, la app se encarga de todo.
// Avatares básicos ficticios y réplicas simplificadas. Voz: David Martin · Eleven v3.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Av, Chip, COLORS, NAMES, Outro, Soon } from "./Reel1";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceApp2";

type P = { ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* 1 · Gancho: el chat avisa de que alguien no puede */
const Hook: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p1 = pop(f, fps, 2, 12), p2 = pop(f, fps, 26, 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ width: 920, display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, opacity: Math.min(1, p1 * 2), transform: `translateY(${(1 - p1) * 40}px)` }}>
          <Av i={3} size={96} />
          <div style={{ background: t.mutedSurface, border: `2px solid ${t.border}`, borderRadius: "34px 34px 34px 8px", padding: "26px 34px", fontSize: 54, fontWeight: 700, lineHeight: 1.2 }}>Chicos, el jueves no puedo</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, opacity: Math.min(1, p2 * 2), transform: `translateY(${(1 - p2) * 40}px)`, alignSelf: "flex-end" }}>
          <div style={{ background: t.accent, color: t.accentContrast, borderRadius: "34px 34px 8px 34px", padding: "26px 34px", fontSize: 54, fontWeight: 800 }}>¿Y ahora qué?</div>
        </div>
      </div>
      {sfx("pop", 2, 0.3)}{sfx("pop", 26, 0.3)}
    </Frame>
  );
};

/* 2 · Liga normal: pareja fija, si uno falla fallan los dos */
const Fixed: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const failF = wf(ws, "falla"), bothF = wf(ws, "falláis");
  const a = pop(f, fps, wf(ws, "liga") - 4, 11);
  const out1 = interpolate(f, [failF, failF + 10], [0, 1], clamp);
  const out2 = interpolate(f, [bothF, bothF + 10], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: a, marginBottom: 56 }}><Chip>LIGA NORMAL</Chip></div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, opacity: a, transform: `scale(${0.85 + 0.15 * a})` }}>
        <div style={{ position: "relative", opacity: 1 - 0.65 * out1 }}><Av i={0} size={260} />{out1 > 0.5 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 200, color: "#e5584f", fontWeight: 900 }}>✕</div>}</div>
        <div style={{ width: 150, height: 14, background: t.accent, borderRadius: 8, opacity: 1 - out2 * 0.8 }} />
        <div style={{ position: "relative", opacity: 1 - 0.65 * out2 }}><Av i={1} size={260} />{out2 > 0.5 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 200, color: "#e5584f", fontWeight: 900 }}>✕</div>}</div>
      </div>
      <div style={{ marginTop: 50, fontSize: 56, fontWeight: 900, color: t.textMuted, opacity: a }}>PAREJA FIJA</div>
      {sfx("pop", failF, 0.4)}{sfx("pop", bothF, 0.4)}
    </Frame>
  );
};

/* 3 · Smash & Lob: cada jornada, pareja nueva */
const NewPair: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const orders = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]];
  const j2 = wf(ws, "jornada") + 4, j3 = Math.max(j2 + 26, wf(ws, "nueva") - 10);
  const step = f < j2 ? 0 : f < j3 ? 1 : 2;
  const mv = step === 0 ? 0 : pop(f, fps, step === 1 ? j2 : j3, 14);
  const slotX = (s: number) => -330 + s * 220 + (s >= 2 ? 40 : 0);
  const prev = orders[Math.max(0, step - 1)], cur = orders[step];
  const c = pop(f, fps, 0, 10);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: c, transform: `scale(${0.85 + 0.15 * c})`, marginBottom: 40 }}><Chip gold>SMASH & LOB</Chip></div>
      <div style={{ position: "relative", width: 900, height: 300 }}>
        {[0, 1, 2, 3].map((av) => {
          const a = slotX(prev.indexOf(av)), b = slotX(cur.indexOf(av));
          const x = step === 0 ? slotX(cur.indexOf(av)) : a + (b - a) * mv;
          return <div key={av} style={{ position: "absolute", left: 450 - 85 + x, top: 40 }}><Av i={av} size={170} ring={cur.indexOf(av) < 2 ? t.accent : "#53B4D1"} /></div>;
        })}
        <div style={{ position: "absolute", left: 450 - 28, top: 100, fontSize: 56, fontWeight: 900, color: t.textMuted }}>vs</div>
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
        {["J1", "J2", "J3"].map((j, k) => <div key={j} style={{ opacity: k <= step ? 1 : 0.35, transform: `scale(${k === step ? 1.15 : 1})` }}><Chip gold={k === step} size={44}>{j}</Chip></div>)}
      </div>
    </Frame>
  );
};

/* 4 · Con y contra todos; cada punto suma a TU clasificación individual */
const Individual: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const ptF = wf(ws, "punto"), clF = wf(ws, "clasificación");
  const scores = [14, 9, 17, 6, 12, 8, 15, 11];
  const grow = interpolate(f, [ptF, ptF + 40], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: pop(f, fps, clF - 6, 10), marginBottom: 40 }}><Chip>CLASIFICACIÓN INDIVIDUAL</Chip></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "44px 36px" }}>
        {COLORS.map((_, i) => { const p = pop(f, fps, 3 + i * 3, 10); const best = i === 2; return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: Math.min(1, p * 2), transform: `scale(${0.5 + 0.5 * p})` }}>
            <div style={{ fontSize: 54, fontWeight: 900, color: best && grow > 0.9 ? t.accent : t.text }}>+{Math.round(scores[i] * grow)}</div>
            <Av i={i} size={150} ring={best && grow > 0.9 ? t.accent : undefined} />
            <div style={{ fontSize: 30, fontWeight: 800, color: t.textMuted }}>{NAMES[i]}</div>
          </div>); })}
      </div>
      {sfx("pop", ptF, 0.4)}
    </Frame>
  );
};

/* 5 · Nadie depende de nadie; gana el que mejor juega con cualquiera */
const Podium: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const gF = wf(ws, "gana"), cF = wf(ws, "cualquiera");
  const steps = [{ av: 1, h: 230, x: -300, place: 2 }, { av: 2, h: 360, x: 0, place: 1 }, { av: 5, h: 150, x: 300, place: 3 }];
  return (
    <Frame timedWords={ws}>
      <Words text={"Nadie depende\nde *nadie*"} size={96} stagger={4} />
      <div style={{ position: "relative", width: 900, height: 620, marginTop: 40 }}>
        {steps.map((s, i) => { const p = pop(f, fps, gF + i * 4, 11); return (
          <div key={s.place} style={{ position: "absolute", left: 450 - 130 + s.x, bottom: 0, width: 260, display: "flex", flexDirection: "column", alignItems: "center", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 120}px)` }}>
            {s.place === 1 && <div style={{ fontSize: 80, transform: `scale(${0.6 + 0.4 * pop(f, fps, cF, 9)})`, opacity: pop(f, fps, cF, 9) }}>🏆</div>}
            <Av i={s.av} size={s.place === 1 ? 170 : 130} ring={s.place === 1 ? t.accent : undefined} />
            <div style={{ marginTop: 14, width: 260, height: s.h, borderRadius: "22px 22px 0 0", background: s.place === 1 ? t.accent : t.mutedSurface, color: s.place === 1 ? t.accentContrast : t.textMuted, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 20, fontSize: 80, fontWeight: 900 }}>{s.place}</div>
          </div>); })}
      </div>
      {sfx("ding", cF, 0.45)}
    </Frame>
  );
};

/* 6 · La aplicación se encarga de todo lo demás */
const App: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const apF = wf(ws, "aplicación");
  const p = pop(f, fps, 2, 9);
  const burst = interpolate(f, [apF, apF + 20], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ fontSize: 80, fontWeight: 900, opacity: pop(f, fps, 0, 10), marginBottom: 50 }}>Y lo <span style={{ color: t.accent }}>mejor</span>:</div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 380 + burst * 520, height: 380 + burst * 520, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile("logo.png")} style={{ width: 380, height: 380, objectFit: "contain", borderRadius: 84, filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + 0.1 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ marginTop: 50, fontSize: 64, fontWeight: 900, textAlign: "center", opacity: pop(f, fps, wf(ws, "demás"), 10) }}>se encarga <span style={{ color: t.accent }}>la app</span></div>
      {sfx("ding", apF, 0.5)}
    </Frame>
  );
};

/* 7 · Monta, organiza, recoge, calcula… tú solo tienes que jugar */
const Card: React.FC<{ at: number; title: string; gone: number; children: React.ReactNode }> = ({ at, title, gone, children }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return (
    <div style={{ opacity: Math.min(1, p * 2) * (1 - gone), transform: `translateY(${(1 - p) * -140 - gone * 40}px) scale(${(0.92 + 0.08 * p) * (1 - 0.1 * gone)})`, background: t.surface, border: `2px solid ${t.borderStrong}`, borderRadius: 28, padding: "16px 28px", width: 900, height: 250, boxShadow: "0 18px 50px rgba(0,0,0,.45)" }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: t.textMuted, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
};
const Auto: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const mF = wf(ws, "monta"), oF = wf(ws, "organiza"), rF = wf(ws, "recoge"), cF = wf(ws, "calcula"), tuF = wf(ws, "tú");
  const gone = interpolate(f, [tuF - 6, tuF + 8], [0, 1], clamp);
  const fin = pop(f, fps, tuF + 4, 10);
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 1100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "absolute", inset: 0 }}>
          <Card at={mF - 6} title="EMPAREJAMIENTOS" gone={gone}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: 16 }}>
              <span style={{ display: "flex", gap: 10 }}><Av i={0} size={92} /><Av i={3} size={92} /></span><span style={{ fontSize: 48, fontWeight: 900, color: t.textMuted }}>vs</span><span style={{ display: "flex", gap: 10 }}><Av i={5} size={92} /><Av i={6} size={92} /></span>
            </div>
          </Card>
          <Card at={oF - 6} title="JORNADAS" gone={gone}>
            {[["Jornada 1", "Jugada"], ["Jornada 2", "En juego"], ["Jornada 3", "🔒 Secreta"]].map(([a, b], k) => <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 36, fontWeight: 800, padding: "7px 0", color: k === 2 ? t.textSubtle : t.text }}><span>{a}</span><span>{b}</span></div>)}
          </Card>
          <Card at={rF - 6} title="RESULTADOS" gone={gone}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: 18, fontSize: 40, fontWeight: 900 }}>
              <span style={{ display: "flex", gap: 8 }}><Av i={0} size={70} /><Av i={3} size={70} /></span><span style={{ color: t.accent, fontSize: 76 }}>6 – 4</span><span style={{ display: "flex", gap: 8 }}><Av i={5} size={70} /><Av i={6} size={70} /></span>
            </div>
          </Card>
          <Card at={cF - 6} title="CLASIFICACIÓN" gone={gone}>
            {[[2, 17], [6, 15], [0, 14]].map(([a, p], r) => <div key={a} style={{ display: "flex", alignItems: "center", gap: 16, padding: "5px 0", fontSize: 36, fontWeight: 800 }}><span style={{ width: 36, color: r === 0 ? t.accent : t.textMuted }}>{r + 1}</span><Av i={a} size={52} /><span style={{ flex: 1 }}>{NAMES[a]}</span><span style={{ color: r === 0 ? t.accent : t.text }}>{p}</span></div>)}
          </Card>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: Math.min(1, fin * 2), transform: `scale(${0.7 + 0.3 * fin})` }}>
          <Chip gold size={54}>✓ AUTOMÁTICO</Chip>
          <div style={{ marginTop: 60, fontSize: 112, fontWeight: 900, textAlign: "center", lineHeight: 1.1 }}>Tú solo tienes<br />que <span style={{ color: t.accent }}>jugar</span></div>
          <div style={{ marginTop: 50 }}><Ball size={90} /></div>
        </div>
      </div>
      {[mF, oF, rF, cF].map((m) => sfx("pop", Math.max(1, m - 6), 0.35))}{sfx("ding", tuF + 4, 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<P>[] = [Hook, Fixed, NewPair, Individual, Podium, App, Auto, Soon, Outro];
const KEYS = ["hook", "fixed", "newpair", "individual", "podium", "app", "auto", "soon", "outro"];
const makeScenes = (): SceneDef[] => COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C ws={sceneWords(i)} /> }));
export const REEL2_FRAMES = totalFrames(makeScenes());
export const Reel2: React.FC = () => <VideoSeries scenes={makeScenes()} accent="#d7a544" voice="voice-app2-david.mp3" />;
