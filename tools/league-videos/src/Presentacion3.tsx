// Vídeo 2 (v3): la app como un móvil y la pelota dorada como guía.
// La pelota salta de pestaña en pestaña (donde cae, se enciende la sección y su pantalla entra como en la app, réplicas de las capturas reales
// con datos ficticios); para «arriba a la derecha» las tres bolitas caen sueltas y se identifica cada una; en «bloqueada» los candados
// se cierran uno a uno y en «empieza la temporada» se abren con la pelota celebrando. Sin mencionar el chat de liga.
// Voz: la misma de la v2 (David Martin · Eleven v3, cierre sobrio empalmado). Los torneos no existen en producción: no se muestran.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, RankRow, RankingCard } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { MorphBar, SHARED, ease, geo } from "./Presentacion2";
import { Outro } from "./Bienvenida2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice13c";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- geometría (px nativos de la app); el móvil se ve entero, ampliado ---------- */
const Z = 2.13, WIN_W = 880, WIN_H = 1010;
const SCR_H = Math.round(WIN_H / Z); // 474
const BAR_H = 75, BAR_TOP = SCR_H - BAR_H;
const CONTENT_TOP = 12;

const tabCenter = (mode: "out" | "in", idx: number, m: number): number => {
  if (mode === "out") { const gO = geo(4, idx); const gi = idx in SHARED ? geo(5, SHARED[idx]) : null; const x = gi ? gO.x + (gi.x - gO.x) * m : gO.x; const w = gi ? gO.w + (gi.w - gO.w) * m : gO.w; return 9 + x + w / 2; }
  const gI = geo(5, idx); const outIdx = Object.keys(SHARED).map(Number).find((k) => SHARED[k] === idx);
  if (outIdx !== undefined) { const gO = geo(4, outIdx); const x = gO.x + (gI.x - gO.x) * m, w = gO.w + (gI.w - gO.w) * m; return 9 + x + w / 2; }
  return 9 + gI.x + gI.w / 2;
};

const Ripple: React.FC<{ x: number; y: number; at: number; size?: number }> = ({ x, y, at: a, size = 60 }) => {
  const t = useTheme(); const f = useCurrentFrame();
  const q = (f - a) / 16;
  if (q < 0 || q > 1) return null;
  return <div style={{ position: "absolute", left: x - size * q, top: y - size * q, width: size * 2 * q, height: size * 2 * q, borderRadius: "50%", border: `3px solid ${t.accent}`, opacity: 1 - q, pointerEvents: "none", zIndex: 8 }} />;
};

/* ---------- piezas de pantalla (réplicas de la app) ---------- */
const W = NATIVE_W - 24; // ancho útil de las tarjetas
const HeaderCard: React.FC<{ title: string; sub?: string; eyebrow?: string; logo?: string; avatar?: boolean; right?: React.ReactNode }> = ({ title, sub, eyebrow, logo, avatar, right }) => {
  const t = useTheme();
  return (
    <div style={{ width: W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 18, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      {logo && <Img src={staticFile(logo)} style={{ width: 46, height: 46, objectFit: "contain", flexShrink: 0 }} />}
      {avatar && <Avatar size={44} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 2.2, color: t.textMuted }}>{eyebrow}</div>}
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
};
const Sec: React.FC<{ title: string; right?: string }> = ({ title, right }) => {
  const t = useTheme();
  return <div style={{ width: W, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 4, height: 17, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div></div>{right && <div style={{ fontSize: 12, color: t.textMuted, fontWeight: 600 }}>{right}</div>}</div>;
};
const Card: React.FC<{ children: React.ReactNode; accent?: boolean; pad?: string; style?: React.CSSProperties }> = ({ children, accent, pad = "12px 14px", style }) => {
  const t = useTheme();
  return <div style={{ width: W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderTop: accent ? `2px solid ${t.accent}` : `1px solid ${t.border}`, borderRadius: 18, padding: pad, ...style }}>{children}</div>;
};
const PairBox: React.FC<{ a: string; b: string; gold?: boolean }> = ({ a, b, gold }) => {
  const t = useTheme();
  return <div style={{ flex: 1, background: gold ? t.accent : t.mutedSurface, color: gold ? t.accentContrast : t.text, borderRadius: 12, padding: "9px 4px", textAlign: "center", fontWeight: 800, fontSize: 14.5, lineHeight: 1.3 }}><div>{a}</div><div>{b}</div></div>;
};
const Vs: React.FC = () => { const t = useTheme(); return <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.mutedSurface, color: t.textMuted, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>VS</div>; };
const Fab: React.FC<{ icon: string }> = ({ icon }) => { const t = useTheme(); return <div style={{ position: "absolute", right: 14, top: BAR_TOP - 56, width: 46, height: 46, borderRadius: "50%", background: t.accent, border: `2px solid ${t.bg}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.5)", zIndex: 6 }}><Icon name={icon} color={t.accentContrast} size={24} /></div>; };
const Seg: React.FC<{ items: string[]; active: number; small?: boolean }> = ({ items, active, small }) => {
  const t = useTheme();
  return <div style={{ width: W, boxSizing: "border-box", display: "flex", gap: 4, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 4 }}>{items.map((l, i) => <div key={l} style={{ flex: 1, textAlign: "center", padding: small ? "6px 0" : "8px 0", borderRadius: 10, background: i === active ? t.accent : "transparent", color: i === active ? t.accentContrast : t.textMuted, fontSize: 13, fontWeight: 700 }}>{l}</div>)}</div>;
};
const Stat: React.FC<{ label: string; value: string; sub?: string; k?: number }> = ({ label, value, sub }) => {
  const t = useTheme();
  return <div style={{ flex: 1, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "10px 12px" }}><div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.6, color: t.textMuted }}>{label}</div><div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15 }}>{value}</div>{sub && <div style={{ fontSize: 11.5, color: t.textMuted }}>{sub}</div>}</div>;
};
const LeagueRow: React.FC<{ title: string; sub: string; logo?: string; initials?: string; badge: string }> = ({ title, sub, logo, initials, badge }) => {
  const t = useTheme();
  return (
    <Card pad="10px 12px">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {logo ? <Img src={staticFile(logo)} style={{ width: 46, height: 46, objectFit: "contain" }} /> : <div style={{ width: 46, height: 46, borderRadius: 14, background: t.accent, color: t.accentContrast, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 19 }}>{initials}</div>}
        <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div><div style={{ fontSize: 12.5, color: t.textMuted }}>{sub}</div></div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#32c58f", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#32c58f" }} />{badge}</div>
      </div>
    </Card>
  );
};
const ChatItem: React.FC<{ title: string; sub: string; last: string; dot?: boolean }> = ({ title, sub, last, dot }) => {
  const t = useTheme();
  return (
    <Card pad="10px 14px">
      <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>{dot && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f08a1c", marginTop: 5 }} />}</div>
      <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{sub}</div>
      <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8, paddingTop: 7, fontSize: 12, color: t.textMuted }}>{last}</div>
    </Card>
  );
};
const ScoreRow: React.FC<{ a: string; b: string; games: number[]; sets: number; win?: boolean; line?: boolean }> = ({ a, b, games, sets, win, line }) => {
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: line ? `1px solid ${t.accent}` : "none" }}>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 800, lineHeight: 1.45 }}><div>{a}</div><div>{b}</div></div>
      {win && <Icon name="trophy" color={t.accent} size={18} />}
      {games.map((g, i) => <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: t.mutedSurface, color: win ? t.text : t.textMuted, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{g}</div>)}
      <div style={{ width: 34, height: 34, borderRadius: 10, background: t.accent, color: t.accentContrast, fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{sets}</div>
    </div>
  );
};
const DateLine: React.FC<{ a: string; b: string }> = ({ a, b }) => { const t = useTheme(); return <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 6, paddingTop: 8, fontSize: 12.5, color: t.textMuted, lineHeight: 1.45 }}><div>{a}</div><div>{b}</div></div>; };

/* bolitas sueltas: caen y rebotan */
const dropY = (q: number) => { if (q <= 0) return -900; if (q >= 1) return 0; if (q < 0.55) { const u = q / 0.55; return -900 * (1 - u * u); } if (q < 0.8) { const u = (q - 0.55) / 0.25; return -70 * (1 - (2 * u - 1) ** 2); } const u = (q - 0.8) / 0.2; return -22 * (1 - (2 * u - 1) ** 2); };

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const outM = [at(1, "competiciones"), at(1, "mis"), at(1, "chats"), at(1, "mi")];
  const inM = [at(2, "inicio"), at(2, "ranking"), at(2, "calendario"), at(2, "chats"), at(2, "perfil")];
  const trM = [at(3, "ayuda"), at(3, "notificaciones"), at(3, "ajustes")];
  const cambF = at(1, "cambiar"), crearF = at(1, "crear"), indivF = at(2, "individual");
  const dayF = at(4, "20"), lockF = at(4, "bloqueada"), errF = at(5, "error"), openF = at(5, "empieza");
  const S = { out: B30(1), inn: B30(2), tr: B30(3), lock: B30(4), err: B30(5), end: B30(6) };
  const NAMES = league.playerNames, q4 = league.exampleQuartet;
  const winIn = ease((f - (S.out - 12)) / 20);
  const dimWin = Math.min(ease((f - (S.tr - 6)) / 14), 1 - ease((f - (S.lock - 18)) / 14)); // la pantalla se atenúa mientras caen las bolitas

  /* barra y candados */
  const mark = (arr: number[]) => arr.reduce((a, m, i) => (f >= m - 4 ? i : a), -1);
  const outPhase = f < S.inn;
  const activeOut = outPhase ? mark(outM) : -1;
  const activeIn = !outPhase ? (f < S.tr ? mark(inM) : 0) : -1;
  const morph = ease((f - (S.inn - 6)) / 28);
  const unlocked = f >= openF;
  const lockOn = f >= lockF - 2;
  const unlockSeq = (j: number) => f >= openF + j * 6;
  const dimNow = [0, 1, 2, 3, 4].map((j) => j > 0 && lockOn && (!unlocked || !unlockSeq(j)) && f >= (unlocked ? 0 : lockF + j * 5 - 4));
  const lockNow = dimNow;

  /* pelota guía */
  const HOP = 14;
  type Stop = { t: number; mode: "out" | "in"; idx: number };
  const stops: Stop[] = [
    ...outM.map((m, i) => ({ t: m - 4, mode: "out" as const, idx: i })),
    ...inM.map((m, i) => ({ t: m - 4, mode: "in" as const, idx: i })),
    { t: S.lock + 2, mode: "in", idx: 0 },
    ...[1, 2, 3, 4].map((j) => ({ t: openF + j * 6 + 2, mode: "in" as const, idx: j })),
    { t: openF + 30, mode: "in", idx: 0 },
  ];
  const centerOf = (s: Stop) => tabCenter(s.mode, s.idx, s.mode === "in" ? 1 : morph);
  let bx = tabCenter("out", 0, 0), by = BAR_TOP - 20, bsq = 0, ballVis = 0;
  const first = stops[0];
  if (f >= first.t - 26) {
    ballVis = 1;
    let idx = 0;
    for (let i = 0; i < stops.length; i++) { if (f >= stops[i].t - HOP) idx = i; }
    const cur = stops[idx], prev = idx > 0 ? stops[idx - 1] : null;
    const q = clamp01((f - (cur.t - HOP)) / HOP);
    const xCur = centerOf(cur), xPrev = prev ? centerOf(prev) : xCur;
    if (!prev) { const qq = clamp01((f - (first.t - 26)) / 26); bx = xCur; by = BAR_TOP - 20 - (1 - qq * qq) * 380; bsq = qq > 0.92 ? (1 - qq) * 10 : 0; }
    else { bx = xPrev + (xCur - xPrev) * ease(q); by = BAR_TOP - 20 - Math.sin(Math.PI * q) * 70; bsq = q > 0.9 ? (1 - q) * 8 : 0; }
    if (f >= S.tr - 6 && f < S.lock - 14) ballVis = 0;
    else if (f >= S.lock - 14 && f < S.lock + 2) ballVis = clamp01((f - (S.lock - 14)) / 8);
  }

  /* contenido de cada pantalla */
  const rkFrom = rankAt(NAMES, 1), rkTo = rankAt(NAMES, 2), rkK = ease((f - indivF + 6) / 26);
  const rkRows: RankRow[] = NAMES.map((n) => { const pos = rkFrom[n] + (rkTo[n] - rkFrom[n]) * rkK; return { key: n, name: n.split(" ")[0], pts: Math.round(PTS[n][1] + (PTS[n][2] - PTS[n][1]) * rkK), diff: Math.round(DIFF[n][1] + (DIFF[n][2] - DIFF[n][1]) * rkK), j: 2, pos, shownPos: Math.round(pos), moved: rkFrom[n] !== rkTo[n] && rkK < 0.95, climbing: rkTo[n] < rkFrom[n], tie: false }; });
  const cambK = pop(f, fps, cambF - 2, 11), crearK = pop(f, fps, crearF + 10, 11);
  const gap = { display: "flex", flexDirection: "column" as const, gap: 10 };
  const pulse = f >= dayF - 2 && f < dayF + 14 ? 1 + 0.06 * Math.sin(((f - dayF + 2) / 16) * Math.PI) : 1;

  const countdown = (
    <Card pad="16px 14px" style={{ background: t.accent, color: t.accentContrast, border: "none", textAlign: "center", borderRadius: 26, height: 300, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 3 }}>LA TEMPORADA COMIENZA EN</div>
      <div style={{ display: "flex", gap: 7, margin: "16px 0 14px" }}>
        {[["30", "DÍAS"], ["21", "HORAS"], ["13", "MIN"], [String(59 - (Math.floor(f / 30) % 60)).padStart(2, "0"), "SEG"]].map(([v, l]) => <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.2)", borderRadius: 14, padding: "11px 0 9px" }}><div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{v}</div><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.3, marginTop: 4 }}>{l}</div></div>)}
      </div>
      <div style={{ fontSize: 16.5, fontWeight: 800, transform: `scale(${pulse})` }}>Domingo, 20 de diciembre de 2026</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: 10, padding: "0 6px" }}>Los controles de esta liga se activarán al comenzar. Puedes seguir usando Competiciones y Mis partidos.</div>
    </Card>
  );
  const screens: { from: number; to: number; node: React.ReactNode; fab?: string }[] = [
    { from: S.out + 10, to: outM[1] - 4, node: (<div style={gap}><HeaderCard title="Mis Competiciones" /><Sec title="Mis ligas" right="Ver todas ›" />
      <div style={{ opacity: cambK < 0.5 ? 1 : 0.5 }}><LeagueRow logo={league.logo} title={league.name} sub={league.season} badge="Próxima" /></div>
      <div style={{ opacity: cambK < 0.5 ? 0.5 : 1, outline: cambK > 0.5 ? `2px solid ${t.accent}` : "none", borderRadius: 18 }}><LeagueRow initials="LA" title="Liga de amigos" sub="Temporada 2" badge="En curso" /></div>
      <div style={{ opacity: 0.5 }}><LeagueRow initials="LC" title="Liga del club" sub="Temporada 1" badge="Finalizada" /></div></div>) },
    { from: outM[1] - 4, to: outM[2] - 4, fab: "plus", node: (<div style={gap}><HeaderCard title="Mis partidos" eyebrow="ACTIVIDAD PERSONAL" /><Sec title="HISTORIAL" right="Más recientes primero" />
      <div style={{ opacity: crearK, transform: `translateY(${(1 - crearK) * -14}px)`, display: crearK > 0.02 ? "block" : "none" }}><Card><div style={{ display: "inline-block", fontSize: 12, fontWeight: 700, color: "#7fb0e8", background: "#1b2a3d", borderRadius: 10, padding: "3px 10px", marginBottom: 8 }}>Amistoso</div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={q4[0]} b={q4[1]} /><Vs /><PairBox a={q4[2]} b={q4[3]} /></div><DateLine a="Jueves · 19:30" b="Pista 1" /></Card></div>
      <Card><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: t.textMuted, marginBottom: 2 }}><span>{league.name}</span><span style={{ background: "#0f6b3c", color: "#fff", borderRadius: 10, padding: "2px 10px", fontWeight: 700 }}>Victoria</span></div><ScoreRow a={q4[0]} b={q4[1]} games={[6, 3, 6]} sets={2} win /><ScoreRow a={q4[2]} b={q4[3]} games={[4, 6, 2]} sets={1} line /></Card></div>) },
    { from: outM[2] - 4, to: outM[3] - 4, fab: "search", node: (<div style={gap}><HeaderCard title="Chats" right={<div style={{ fontSize: 12.5, color: t.textMuted }}>Ver todos</div>} /><Sec title="Activos" />
      <ChatItem title="Amistoso" sub={`con ${q4[0]} vs ${q4[2]} y ${q4[3]}`} last="Sin mensajes todavía" dot /><ChatItem title="Amistoso" sub={`con ${q4[1]} vs ${q4[2]} y ${q4[0]}`} last="Sin mensajes todavía" dot /></div>) },
    { from: outM[3] - 4, to: S.inn + 30, node: (<div style={gap}><HeaderCard title={q4[0]} eyebrow="PERFIL GLOBAL" avatar sub="Posición preferida · REVÉS DIESTRO" /><Seg items={["Todos", "Ligas", "Amistoso"]} active={0} small /><Seg items={["Resumen", "Parejas / rivales", "Cara a cara"]} active={0} small />
      <div style={{ display: "flex", gap: 8, width: W }}><Stat label="PARTIDOS" value="3" sub="3V · 0D" /><Stat label="VICTORIAS" value="100%" sub="porcentaje global" /></div>
      <div style={{ display: "flex", gap: 8, width: W }}><Stat label="DIF. JUEGOS" value="+18" sub="51-33" /><Stat label="RACHA ACTUAL" value="3V" sub="resultado consecutivo" /></div></div>) },
    { from: S.inn + 30, to: inM[1] - 4, node: (<div style={gap}><HeaderCard title={league.name} logo={league.logo} sub={`${league.season} · Próxima`} />{countdown}</div>) },
    { from: inM[1] - 4, to: inM[2] - 4, node: (<div style={gap}><HeaderCard title="Ranking individual" sub={`${league.season} · En curso`} /><div style={{ zoom: 0.66 }}><RankingCard rows={rkRows} /></div></div>) },
    { from: inM[2] - 4, to: inM[3] - 4, node: (<div style={gap}><HeaderCard title="Calendario de liga" sub={`${league.season} · En curso`} /><Seg items={["Vista", "Liga completa", "Mis partidos"]} active={1} small /><Sec title="Jornada 1" />
      <Card accent><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: t.textMuted, marginBottom: 8 }}>JORNADA 1</div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={q4[0]} b={q4[1]} gold /><Vs /><PairBox a={q4[2]} b={q4[3]} gold /></div>
        <div style={{ marginTop: 10, border: `1.5px solid ${t.accent}66`, borderRadius: 12, padding: "9px 0", textAlign: "center", fontSize: 13.5, fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}><Icon name="cal" color={t.text} size={18} />Añadir fecha, hora y lugar</div></Card>
      <div style={{ opacity: pop(f, fps, inM[2] + 14, 10) }}><Sec title="Jornada 2" /></div></div>) },
    { from: inM[3] - 4, to: inM[4] - 4, node: (<div style={gap}><HeaderCard title="Chats" sub={`${league.season} · En curso`} /><Sec title="Activos" />
      <ChatItem title="Jornada 1" sub={`con ${q4[0]} vs ${q4[2]} y ${q4[3]}`} last="Sin mensajes todavía" /><ChatItem title="Jornada 2" sub={`con ${q4[1]} vs ${q4[3]} y ${q4[0]}`} last="Sin mensajes todavía" /></div>) },
    { from: inM[4] - 4, to: S.tr - 8, node: (<div style={gap}><HeaderCard title={q4[0]} eyebrow={league.name.toUpperCase()} avatar sub={`${league.season} · En curso`} /><Seg items={["Resumen", "Parejas / rivales", "Cara a cara"]} active={0} small />
      <div style={{ display: "flex", gap: 8, width: W }}><Stat label="PUNTOS" value="5" /><Stat label="DIF. JUEGOS" value="+16" /></div>
      <Card><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 12.5, color: t.textMuted }}>Estadísticas avanzadas</div><div style={{ fontSize: 17, fontWeight: 800 }}>Rendimiento de temporada</div></div><div style={{ background: t.accent, color: t.accentContrast, borderRadius: 12, padding: "6px 12px", textAlign: "center" }}><div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 1.6 }}>VICTORIAS</div><div style={{ fontSize: 20, fontWeight: 900 }}>100%</div></div></div></Card></div>) },
    { from: S.lock - 8, to: S.end + 30, node: (<div style={gap}><HeaderCard title={league.name} logo={league.logo} sub={`${league.season} · ${unlocked ? "En curso" : "Próxima"}`} />{countdown}</div>), fab: "chat" },
  ];
  const showFab = (fab?: string) => fab;

  const TAGS: [number, string][] = [[S.out, "FUERA DE LA LIGA"], [S.inn, "DENTRO DE LA LIGA"], [S.tr, "ARRIBA A LA DERECHA"], [S.lock, "LIGA BLOQUEADA"], [S.err, "TEMPORADA PROGRAMADA"]];
  const tagI = TAGS.reduce((a, [s0], i) => (f >= s0 - 4 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0] - 4, 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const example = f >= S.inn - 4 && f < S.tr - 6;
  const hookP = pop(f, fps, 8, 10), hookOut = 1 - ease((f - (S.out - 6)) / 14);
  const pill = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" as const };
  const rippleTabs = [...outM.map((m, i) => ({ a: m - 4, x: tabCenter("out", i, 0) })), ...inM.map((m, i) => ({ a: m - 4, x: tabCenter("in", i, 1) }))];
  const TR = [{ ic: "help", label: "Ayuda" }, { ic: "bell", label: "Notificaciones" }, { ic: "sliders", label: "Ajustes" }];

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookOut * Math.min(1, hookP * 2) }}><Words text={"¿Dónde está\ncada *cosa*\nen la app?"} size={104} stagger={4} /></div>
      {/* móvil */}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn, transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})`, opacity: 1 - 0.78 * dimWin }}>
            {screens.map((s, i) => {
              const inn = ease((f - s.from) / 14), out = 1 - ease((f - (s.to - 11)) / 10);
              const o = Math.min(inn, out);
              if (o <= 0.01) return null;
              return <React.Fragment key={i}><div style={{ position: "absolute", left: 12, top: CONTENT_TOP, opacity: o, transform: `translateX(${(1 - inn) * 46 - (1 - out) * 30}px)` }}>{s.node}</div>{showFab(s.fab) && <div style={{ opacity: o }}><Fab icon={s.fab!} /></div>}</React.Fragment>;
            })}
            <div style={{ position: "absolute", left: 0, top: BAR_TOP, width: NATIVE_W }}>
              <MorphBar m={morph} activeOut={activeOut} activeIn={activeIn} dim={dimNow} lock={lockNow} />
            </div>
            {rippleTabs.map((r, i) => <Ripple key={i} x={r.x} y={BAR_TOP + 40} at={r.a} />)}
            <Ripple x={NATIVE_W - 37} y={BAR_TOP - 33} at={crearF} size={40} />
            {ballVis > 0 && <div style={{ position: "absolute", left: bx - 15, top: by - 15, width: 30, height: 30, opacity: ballVis, transform: `scale(${1 + 0.25 * bsq}, ${1 - 0.3 * bsq})`, transformOrigin: "50% 100%", zIndex: 9 }}><Ball size={30} /></div>}
          </div>
          {/* tres bolitas sueltas: ayuda, notificaciones y ajustes */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 52, paddingLeft: 150 }}>
            {TR.map((r, i) => {
              const q = (f - (trM[i] - 22)) / 22, out = 1 - ease((f - (S.lock - 22)) / 12);
              const k = pop(f, fps, trM[i] - 2, 10);
              return (
                <div key={r.ic} style={{ display: "flex", alignItems: "center", gap: 36, opacity: (q > 0 ? 1 : 0) * out, transform: `translateY(${dropY(q)}px)` }}>
                  <div style={{ width: 170, height: 170, borderRadius: "50%", background: t.surface, border: `5px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 50px ${t.accent}55` }}><Icon name={r.ic} color={t.accent} size={88} /></div>
                  <div style={{ fontSize: 66, fontWeight: 900, opacity: k, transform: `translateX(${(1 - k) * 60}px)` }}>{r.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {[...outM, ...inM, ...trM, dayF, lockF, errF].map((m, i) => sfx("pop", Math.max(2, m - 4), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}{sfx("ding", openF, 0.5)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Outro league={league} ws={sceneWords(6)} /> },
];
export const PRESENTACION3_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Presentacion3: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-13c-david.mp3" />;
