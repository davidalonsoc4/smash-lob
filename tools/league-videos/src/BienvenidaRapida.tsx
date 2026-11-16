// Vídeo 1 (ritmo "reel informativo"): ajustado al audio real (David Martin · Eleven v3, toma 1, pausas ajustadas con tools/retime_voice.py).
import React from "react";
import { Img, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { AppHeader, Avatar, MatchScore, OpeningCard, PairPills, RankRow, RankingCard, ScoreRow, TAB_ITEMS, TabBar, Zoom } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { BOUNDS_01, VOICE_01 } from "./voice01";

type P = { league: LeagueConfig; ws: TimedWord[] };

// Límites de escena (s) — en mitad de las pausas de la voz (versión con pausas alargadas).
const BOUNDS = BOUNDS_01;
const norm = (w: string) => w.replace(/[,.:!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE_01.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
// Frame (relativo a la escena) en que empieza la palabra `text` (n-ésima aparición).
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

const Chip: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + p * 0.1})`, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "20px 40px", fontSize: 42, fontWeight: 800, textAlign: "center" }}>{children}</div>;
};

/* 1 · Gancho (0–1,65 s) */
const Hook = ({ league }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 10, 10);
  const day = Math.round(interpolate(f, [10, 34], [league.daysToStart + 6, league.daysToStart], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  return (
    <Frame>
      <Words text={"Queda *un mes*\npara la liga"} size={132} stagger={5} />
      <div style={{ marginTop: 80, opacity: p, transform: `scale(${p})`, background: t.accent, color: t.accentContrast, borderRadius: 44, padding: "24px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 140, fontWeight: 900, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 8 }}>DÍAS</div>
      </div>
    </Frame>
  );
};

/* 2 · La liga (1,65–5,88 s) */
const League = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 12);
  const ochoF = wf(ws, "ocho"), sieteF = wf(ws, "siete");
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 300, height: 300, objectFit: "contain", marginBottom: 20, filter: "drop-shadow(0 0 50px rgba(215,165,68,.35))", transform: `scale(${p}) rotate(${(1 - p) * -12}deg)` }} />
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${p})` }}><Zoom z={2.2}><AppHeader title={league.name} subtitle={`${league.season} · Próxima`} /></Zoom></div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, width: 920, marginTop: 40 }}>
        {league.playerNames.map((n, i) => {
          const q = pop(f, fps, ochoF + i * 3, 12);
          return <div key={n} style={{ transform: `scale(${q})`, opacity: q, width: 190, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><Zoom z={2.6}><Avatar size={44} /></Zoom><div style={{ fontSize: 34, fontWeight: 800 }}>{n.split(" ")[0]}</div></div>;
        })}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
        <Chip at={ochoF + 14}>{league.playerNames.length} jugadores</Chip><Chip at={sieteF}>{league.rounds} jornadas</Chip>
      </div>
      {sfx("pop", ochoF, 0.3)}{sfx("pop", sieteF, 0.3)}
    </Frame>
  );
};

/* 3 · Parejas rotativas (5,88–11,6 s) */
const pairsFor = ([a, b, c, d]: [string, string, string, string]): [[string, string], [string, string]][] => [[[a, b], [c, d]], [[a, c], [b, d]], [[a, d], [b, c]]];
const Pairs = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const PAIRS = pairsFor(league.exampleQuartet);
  const cadaF = wf(ws, "cada"), nuevoF = wf(ws, "compañero");
  const r = f >= nuevoF ? 2 : f >= cadaF ? 1 : 0;
  const t0 = r === 2 ? nuevoF : r === 1 ? cadaF : 6;
  const k = spring({ frame: f - t0, fps, config: { damping: 14, stiffness: 160 } });
  const h1 = interpolate(f, [cadaF - 10, cadaF - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame tag="PAREJAS ROTATIVAS" example timedWords={ws}>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, height: 220 }}>
        <div style={{ position: "absolute", left: 0, right: 0, opacity: h1 }}><Words text={"Liga *individual*\npor *parejas*"} size={90} delay={4} stagger={5} /></div>
        {f >= cadaF - 4 && <div style={{ position: "absolute", left: 0, right: 0 }}><Words text={"Cada jornada,\n*compañero* nuevo"} size={90} delay={cadaF - 2} stagger={5} /></div>}
      </div>
      <div style={{ marginTop: 200, fontSize: 40, fontWeight: 900, letterSpacing: 6, color: league.accent, marginBottom: 26 }}>JORNADA {r + 1}</div>
      <div style={{ transform: `translateY(${(1 - k) * 60}px)`, opacity: Math.min(1, k * 1.5) }}>
        <Zoom z={2.2}><PairPills a={PAIRS[r][0]} b={PAIRS[r][1]} /></Zoom>
      </div>
      {sfx("pop", 6, 0.35)}{sfx("pop", cadaF, 0.35)}{sfx("pop", nuevoF, 0.35)}
    </Frame>
  );
};

/* 4 · Puntos (11,6–15,74 s): un 2-1 para que se vea que perder también puntúa */
const scoreB = (q: [string, string, string, string]): [ScoreRow, ScoreRow] => [
  { names: [q[0], q[1]], games: [6, 3, 6], sets: 2, winner: true },
  { names: [q[2], q[3]], games: [4, 6, 2], sets: 1, winner: false },
];
const Points = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const s1 = wf(ws, "sets"), s2 = wf(ws, "siempre"), s3 = wf(ws, "y"), tot = wf(ws, "punto");
  const shown = f >= s3 ? 3 : f >= s2 ? 2 : f >= s1 ? 1 : 0;
  const totals = f >= tot;
  const glow = totals ? 1 + 0.18 * Math.max(0, 1 - (f - tot) / 12) : 1;
  return (
    <Frame tag="PUNTOS" example timedWords={ws}>
      <Words text={"Siempre\n*3 sets*"} size={110} delay={2} stagger={5} />
      <div style={{ height: 40 }} />
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})` }}>
        <Zoom z={2.2}><MatchScore rows={scoreB(league.exampleQuartet)} shownSets={shown} showTotals={totals} totalScale={glow} /></Zoom>
      </div>
      <div style={{ height: 36 }} />
      <Chip at={tot + 4}>1 set = 1 punto</Chip>
      {sfx("pop", s1, 0.3)}{sfx("pop", s2, 0.3)}{sfx("pop", s3, 0.3)}{sfx("ding", tot, 0.5)}
    </Frame>
  );
};

/* 5 · Ranking individual (15,74–18,74 s) */
const Ranking = ({ league, ws }: P) => {
  const NAMES = league.playerNames;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = wf(ws, "suma") - 4, per = wf(ws, "ranking") - wf(ws, "suma");
  const started = f >= start;
  const r = Math.max(1, Math.min(2, 1 + Math.floor((f - start) / per)));
  const k = started ? spring({ frame: f - start - (r - 1) * per, fps, config: { damping: 15, stiffness: 140 } }) : 0;
  const prevR = started ? r - 1 : 0, curR = started ? r : 0;
  const from = rankAt(NAMES, prevR), to = rankAt(NAMES, curR);
  const lerp = (a: number, b: number) => a + (b - a) * k;
  const p = pop(f, fps, 2, 14);
  const rows: RankRow[] = NAMES.map((n) => {
    const pos = lerp(from[n], to[n]);
    const tie = started && NAMES.some((m) => m !== n && PTS[m][curR] === PTS[n][curR]);
    return { key: n, name: n.split(" ")[0], pts: Math.round(lerp(PTS[n][prevR], PTS[n][curR])), diff: Math.round(lerp(DIFF[n][prevR], DIFF[n][curR])), j: curR, pos, shownPos: Math.round(pos), moved: from[n] !== to[n] && k < 0.95, climbing: to[n] < from[n], tie };
  });
  return (
    <Frame tag="RANKING INDIVIDUAL" example timedWords={ws}>
      <div style={{ position: "absolute", top: 335, opacity: p, transform: `scale(${0.92 + 0.08 * p})` }}><Zoom z={2.0}><RankingCard rows={rows} /></Zoom></div>
      {sfx("pop", start, 0.4)}{sfx("pop", start + per, 0.4)}
    </Frame>
  );
};

/* 6 · Jornada de apertura (18,74–26,7 s) */
const Opening = ({ league, ws }: P) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const o = league.opening;
  const pandoF = wf(ws, "Pando"), horaF = wf(ws, "hora"), unoF = wf(ws, "1");
  return (
    <Frame tag="EL GRAN DÍA" timedWords={ws}>
      <div style={{ position: "absolute", top: 300, opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})` }}>
        <Zoom z={1.95}><OpeningCard eyebrow="JORNADA DE APERTURA" weekday={o.weekday} day={o.day} month={o.month} place={o.place} time={o.time} note={o.note} placeP={pop(f, fps, pandoF, 12)} timeP={pop(f, fps, horaF, 12)} noteP={pop(f, fps, unoF, 14)} /></Zoom>
      </div>
      {sfx("pop", pandoF, 0.35)}{sfx("ding", horaF, 0.4)}
    </Frame>
  );
};

/* 7 · Teaser de la serie (26,7–30,4 s) */
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

/* 8 · Cierre (30,4–32,4 s) */
const Outro = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 30 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={124} delay={4} stagger={3} />
      <div style={{ marginTop: 50 }}><Ball size={76} /></div>
    </Frame>
  );
};

const COMPS = [Hook, League, Pairs, Points, Ranking, Opening, Tabs, Outro];
const KEYS = ["hook", "league", "pairs", "points", "ranking", "opening", "tabs", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const RAPIDA_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const BienvenidaRapida: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-01-david-108.mp3" />;
