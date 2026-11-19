// Vídeo 1 de la serie: bienvenida y formato de la liga (30 días antes del inicio).
import React from "react";
import { Img, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Ball, Frame, SceneDef, VideoSeries, Words, pop, sfx, totalFrames, useTheme,
} from "./kit";
import {
  AppHeader, Avatar, OpeningCard, MatchScore, PairPills, RankRow, RankingCard, ScoreRow, TabBar, TAB_ITEMS, Zoom,
} from "./appUi";

export type LeagueConfig = {
  name: string; season: string; accent: string; logo: string;
  playerNames: string[]; exampleQuartet: [string, string, string, string]; rounds: number; daysToStart: number;
  opening: { weekday: string; day: string; month: string; place: string; time: string | null; note: string };
};
export const PRO_LEAGUE: LeagueConfig = {
  name: "Smash & Lob PRO League", season: "Temporada 1", accent: "#d7a544", logo: "pro-logo.png",
  // Claves internas (la inicial solo distingue duplicados en el código; en pantalla solo sale el nombre de pila).
  // El cuadro de ejemplo NO coincide con ningún partido real.
  playerNames: ["Alain", "Álvaro E.", "Álvaro R.", "Andoni F.", "Andoni R.", "David", "Nicolás", "Unai"],
  exampleQuartet: ["Alain", "David", "Álvaro", "Nicolás"],
  rounds: 7, daysToStart: 30,
  // La hora está por confirmar: las pistas se reservan a partir del 1 de diciembre.
  opening: { weekday: "DOMINGO", day: "20", month: "DICIEMBRE", place: "Polideportivo Pando · Portugalete", time: null, note: "Desvelaremos la hora el 1 de diciembre" },
};
type Props = { league: LeagueConfig };

const Chip: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + p * 0.1})`, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "20px 40px", fontSize: 40, fontWeight: 800, textAlign: "center" }}>{children}</div>;
};

/* 1 · Gancho */
const Hook = ({ league }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 26, 10);
  const day = Math.round(interpolate(f, [26, 60], [league.daysToStart + 6, league.daysToStart], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  return (
    <Frame>
      <Words text={"Queda *un mes*\npara la liga"} size={132} stagger={5} />
      <div style={{ marginTop: 90, opacity: p, transform: `scale(${p})`, background: t.accent, color: t.accentContrast, borderRadius: 44, padding: "26px 70px", textAlign: "center" }}>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>{day}</div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 8 }}>DÍAS</div>
      </div>
    </Frame>
  );
};

/* 2 · La liga */
const League = ({ league }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 6, 12);
  return (
    <Frame caption={`${league.name}: ocho jugadores y siete jornadas.`} captionStart={12}>
      <Img src={staticFile(league.logo)} style={{ width: 300, height: 300, objectFit: "contain", marginBottom: 20, filter: "drop-shadow(0 0 50px rgba(215,165,68,.35))", transform: `scale(${p}) rotate(${(1 - p) * -12}deg)` }} />
      <div style={{ transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}><Zoom z={2.2}><AppHeader title={league.name} subtitle={`${league.season} · Próxima`} /></Zoom></div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, width: 920, marginTop: 40 }}>
        {league.playerNames.map((n, i) => {
          const q = pop(f, fps, 24 + i * 4, 12);
          return <div key={n} style={{ transform: `scale(${q})`, opacity: q, width: 190, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><Zoom z={2.6}><Avatar size={44} /></Zoom><div style={{ fontSize: 34, fontWeight: 800 }}>{n.split(" ")[0]}</div></div>;
        })}
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
        <Chip at={62}>{league.playerNames.length} jugadores</Chip><Chip at={72}>{league.rounds} jornadas</Chip>
      </div>
      {league.playerNames.map((_, i) => sfx("pop", 24 + i * 4, 0.12))}
    </Frame>
  );
};

/* 3 · Parejas rotativas */
const pairsFor = ([a, b, c, d]: [string, string, string, string]): [[string, string], [string, string]][] => [
  [[a, b], [c, d]],
  [[a, c], [b, d]],
  [[a, d], [b, c]],
];
const Pairs = ({ league }: Props) => {
  const PAIRS = pairsFor(league.exampleQuartet);
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const per = 40, start = 30;
  const r = Math.max(0, Math.min(2, Math.floor((f - start) / per)));
  const local = f - start - r * per;
  const k = f < start ? 0 : spring({ frame: local, fps, config: { damping: 14, stiffness: 130 } });
  const head = pop(f, fps, 0, 12);
  return (
    <Frame tag="PAREJAS ROTATIVAS" example caption="Una liga individual jugada por parejas. Cada jornada, compañero nuevo." captionStart={14}>
      <div style={{ opacity: head }}><Words text={"Cada jornada,\n*compañero* nuevo"} size={88} /></div>
      <div style={{ height: 110 }} />
      <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 6, color: t.accent, marginBottom: 26 }}>JORNADA {r + 1}</div>
      <div style={{ transform: `translateY(${(1 - k) * 60}px)`, opacity: Math.min(1, k * 1.5) }}>
        <Zoom z={2.2}><PairPills a={PAIRS[r][0]} b={PAIRS[r][1]} /></Zoom>
      </div>
      {sfx("pop", start, 0.35)}{sfx("pop", start + per, 0.35)}{sfx("pop", start + 2 * per, 0.35)}
    </Frame>
  );
};

/* 4 · Puntos: cada set ganado es un punto */
const scoreA = (q: [string, string, string, string]): [ScoreRow, ScoreRow] => [
  { names: [q[0], q[1]], games: [6, 6, 6], sets: 3, winner: true },
  { names: [q[2], q[3]], games: [2, 4, 3], sets: 0, winner: false },
];
const scoreB = (q: [string, string, string, string]): [ScoreRow, ScoreRow] => [
  { names: [q[0], q[1]], games: [6, 3, 6], sets: 2, winner: true },
  { names: [q[2], q[3]], games: [4, 6, 2], sets: 1, winner: false },
];
const ScoreStage: React.FC<{ rows: [ScoreRow, ScoreRow]; label: string; out?: boolean }> = ({ rows, label, out }) => {
  const f = useCurrentFrame(); const { fps, durationInFrames } = useVideoConfig();
  const p = pop(f, fps, 0, 13);
  const shown = f < 18 ? 0 : f < 32 ? 1 : f < 46 ? 2 : 3;
  const totals = f >= 62;
  const glow = totals ? 1 + 0.18 * Math.max(0, 1 - (f - 62) / 14) : 1;
  const fadeOut = out ? interpolate(f, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateLeft: "clamp" }) : 1;
  return (
    <div style={{ opacity: Math.min(1, p * 2) * fadeOut, transform: `scale(${0.9 + 0.1 * p})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
      <Zoom z={2.2}><MatchScore rows={rows} shownSets={shown} showTotals={totals} totalScale={glow} /></Zoom>
      <Chip at={70}>{label}</Chip>
      {sfx("pop", 18, 0.3)}{sfx("pop", 32, 0.3)}{sfx("pop", 46, 0.3)}{sfx("ding", 62, 0.5)}
    </div>
  );
};
const Points = ({ league }: Props) => (
  <Frame tag="PUNTOS" example caption="Se juegan siempre tres sets, y cada set que ganas es un punto para ti." captionStart={12}>
    <Sequence from={0} durationInFrames={106} layout="none"><ScoreStage rows={scoreA(league.exampleQuartet)} label="3-0 · 3 puntos cada uno" out /></Sequence>
    <Sequence from={106} layout="none"><ScoreStage rows={scoreB(league.exampleQuartet)} label="2-1 · 2 puntos y 1 punto" /></Sequence>
  </Frame>
);

/* 5 · Ranking individual */
// Clasificación ficticia (no refleja resultados reales). Orden inicial = alfabético.
export const PTS: Record<string, number[]> = { Alain: [0, 0, 2], "Álvaro E.": [0, 1, 2], "Álvaro R.": [0, 1, 3], "Andoni F.": [0, 0, 0], "Andoni R.": [0, 2, 5], David: [0, 2, 3], "Nicolás": [0, 3, 3], Unai: [0, 3, 6] };
export const DIFF: Record<string, number[]> = { Alain: [0, -5, -2], "Álvaro E.": [0, -3, -6], "Álvaro R.": [0, -1, 2], "Andoni F.": [0, -7, -13], "Andoni R.": [0, 3, 9], David: [0, 1, -2], "Nicolás": [0, 7, 1], Unai: [0, 5, 11] };
export const rankAt = (NAMES: string[], round: number) => {
  const order = [...NAMES].sort((a, b) => PTS[b][round] - PTS[a][round] || DIFF[b][round] - DIFF[a][round] || NAMES.indexOf(a) - NAMES.indexOf(b));
  return Object.fromEntries(order.map((n, i) => [n, i])) as Record<string, number>;
};
const Ranking = ({ league }: Props) => {
  const NAMES = league.playerNames;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = 40, per = 55;
  const r = Math.max(1, Math.min(2, 1 + Math.floor((f - start) / per)));
  const started = f >= start;
  const k = started ? spring({ frame: f - start - (r - 1) * per, fps, config: { damping: 15, stiffness: 105 } }) : 0;
  const prevR = started ? r - 1 : 0, curR = started ? r : 0;
  const from = rankAt(NAMES, prevR), to = rankAt(NAMES, curR);
  const lerp = (a: number, b: number) => a + (b - a) * k;
  const p = pop(f, fps, 4, 14);
  const rows: RankRow[] = NAMES.map((n) => {
    const pos = lerp(from[n], to[n]);
    const tie = started && NAMES.some((m) => m !== n && PTS[m][curR] === PTS[n][curR]);
    return { key: n, name: n.split(" ")[0], pts: Math.round(lerp(PTS[n][prevR], PTS[n][curR])), diff: Math.round(lerp(DIFF[n][prevR], DIFF[n][curR])), j: curR, pos, shownPos: Math.round(pos), moved: from[n] !== to[n] && k < 0.95, climbing: to[n] < from[n], tie };
  });
  return (
    <Frame tag="RANKING INDIVIDUAL" example caption="Cada jugador suma sus propios puntos en el ranking individual." captionStart={10}>
      <div style={{ position: "absolute", top: 335, opacity: p, transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.0}><RankingCard rows={rows} /></Zoom>
      </div>
      {sfx("pop", start, 0.4)}{sfx("pop", start + per, 0.4)}
    </Frame>
  );
};

/* 6 · Jornada de apertura (hora por confirmar) */
const Opening = ({ league }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const o = league.opening;
  return (
    <Frame tag="EL GRAN DÍA" caption="Empezamos el domingo 20 de diciembre con la jornada de apertura en Pando. La hora la confirmaremos el 1 de diciembre, al reservar pista." captionStart={14}>
      <div style={{ position: "absolute", top: 300, opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})` }}>
        <Zoom z={1.95}><OpeningCard eyebrow="JORNADA DE APERTURA" weekday={o.weekday} day={o.day} month={o.month} place={o.place} time={o.time} note={o.note} /></Zoom>
      </div>
      {sfx("ding", 20, 0.4)}
    </Frame>
  );
};

/* 7 · Teaser de la serie: las cinco pestañas */
const Tabs = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const start = 26, per = 24;
  const idx = Math.max(0, Math.min(4, Math.floor((f - start) / per)));
  const prog = spring({ frame: f - start - idx * per, fps, config: { damping: 14, stiffness: 150 } });
  const p = pop(f, fps, 4, 13);
  return (
    <Frame caption="Estas semanas te contamos cómo usar cada parte de la app." captionStart={12}>
      <Words text={"Todo en\n*cinco pestañas*"} size={110} />
      <div style={{ height: 110 }} />
      <div style={{ opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}><Zoom z={2.15}><TabBar active={f < start ? -1 : idx} progress={prog} /></Zoom></div>
      <div style={{ marginTop: 56, fontSize: 56, fontWeight: 900, height: 70 }}>{f >= start ? TAB_ITEMS[idx][1] : ""}</div>
      {TAB_ITEMS.map((_, i) => sfx("pop", start + i * per, 0.25))}
    </Frame>
  );
};

/* 8 · Cierre */
const Outro = ({ league }: Props) => {
  const t = useTheme();
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame caption="Nos vemos en la pista." captionStart={10}>
      <Img src={staticFile(league.logo)} style={{ width: 340, height: 340, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 40 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={130} delay={8} />
      <div style={{ marginTop: 60 }}><Ball size={80} /></div>
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "hook", dur: 120, C: () => <Hook league={league} /> },
  { key: "league", dur: 140, C: () => <League league={league} /> },
  { key: "pairs", dur: 165, C: () => <Pairs league={league} /> },
  { key: "points", dur: 212, C: () => <Points league={league} /> },
  { key: "ranking", dur: 195, C: () => <Ranking league={league} /> },
  { key: "opening", dur: 318, C: () => <Opening league={league} /> },
  { key: "tabs", dur: 165, C: Tabs },
  { key: "outro", dur: 95, C: () => <Outro league={league} /> },
];
export const BIENVENIDA_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Bienvenida: React.FC<Props> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} />;
