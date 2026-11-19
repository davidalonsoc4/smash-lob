// Vídeo 2 (v3): la app como un móvil con "cámara" y la pelota dorada como guía.
// La pelota salta de pestaña en pestaña (donde cae, se enciende la sección y su contenido entra como en la app);
// la cámara sube a la cabecera para los botones de arriba y baja otra vez; en "bloqueada" los candados se cierran uno a uno y en
// "empieza la temporada" se abren con la pelota celebrando. Sin mencionar el chat de liga (va en su propio vídeo).
// Voz: la misma de la v2 (David Martin · Eleven v3, cierre sobrio empalmado).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, PairPills, RankRow, RankingCard } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { Panel } from "./Perfil";
import { Icon, Row } from "./Presentacion";
import { BAR_W, IN, MorphBar, OUT, SHARED, ease, geo } from "./Presentacion2";
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

/* ---------- geometría de la pantalla (px nativos de la app) ---------- */
const SCR_H = 700, HEAD_H = 70, BAR_TOP = 626, Z = 2.13, WIN_W = 880, WIN_H = 1010;
const VIS = WIN_H / Z; // alto visible en px nativos
const CAM_MAX = SCR_H - VIS; // desplazamiento entre "abajo" (barra) y "arriba" (cabecera)

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
  return <div style={{ position: "absolute", left: x - size * q, top: y - size * q, width: size * 2 * q, height: size * 2 * q, borderRadius: "50%", border: `3px solid ${t.accent}`, opacity: 1 - q, pointerEvents: "none" }} />;
};

const Tiles: React.FC<{ d: string; h: string; m: string; s: string }> = ({ d, h, m, s }) => {
  const t = useTheme();
  const tile = (v: string, l: string) => <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.16)", borderRadius: 14, padding: "12px 0 10px", textAlign: "center" }}><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{v}</div><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.4, marginTop: 5, opacity: 0.8 }}>{l}</div></div>;
  return (
    <div style={{ width: NATIVE_W - 24, boxSizing: "border-box", background: t.accent, color: t.accentContrast, borderRadius: 28, padding: "30px 16px 26px", textAlign: "center" }}>
      <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 3.5 }}>LA TEMPORADA COMIENZA EN</div>
      <div style={{ display: "flex", gap: 8, margin: "18px 0 14px" }}>{tile(d, "DÍAS")}{tile(h, "HORAS")}{tile(m, "MIN")}{tile(s, "SEG")}</div>
      <div style={{ fontSize: 17, fontWeight: 900 }}>Domingo 20 de diciembre</div>
    </div>
  );
};

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  // anclas (cuadros absolutos del vídeo)
  const outM = [at(1, "competiciones"), at(1, "mis"), at(1, "chats"), at(1, "mi")];
  const inM = [at(2, "inicio"), at(2, "ranking"), at(2, "calendario"), at(2, "chats"), at(2, "perfil")];
  const trM = [at(3, "ayuda"), at(3, "notificaciones"), at(3, "ajustes")];
  const cambF = at(1, "cambiar"), crearF = at(1, "crear"), indivF = at(2, "individual");
  const dayF = at(4, "20"), lockF = at(4, "bloqueada"), errF = at(5, "error"), openF = at(5, "empieza");
  const S = { out: B30(1), inn: B30(2), tr: B30(3), lock: B30(4), err: B30(5), end: B30(6) };
  const NAMES = league.playerNames, q4 = league.exampleQuartet;

  /* cámara: abajo (barra) por defecto; sube a la cabecera para «arriba a la derecha» */
  const camUp = Math.min(ease((f - (S.tr - 8)) / 22), 1 - ease((f - (S.lock - 14)) / 20));
  const camY = -CAM_MAX * Z * (1 - camUp);
  const winIn = ease((f - (S.out - 12)) / 20);

  /* estado de la barra */
  const mark = (arr: number[]) => arr.reduce((a, m, i) => (f >= m - 4 ? i : a), -1);
  const outPhase = f < S.inn;
  const activeOut = outPhase ? mark(outM) : -1;
  const activeIn = !outPhase ? (f < S.tr ? mark(inM) : 0) : -1;
  const morph = ease((f - (S.inn - 6)) / 28);
  const unlocked = f >= openF;
  const lockOn = f >= lockF - 2 && !unlocked;
  const lockSeq = [0, 1, 2, 3, 4].map((j) => (lockOn ? f >= lockF + j * 5 - 4 : false));
  const unlockSeq = (j: number) => f >= openF + j * 6;
  const dim = [0, 1, 2, 3, 4].map((j) => j > 0 && lockOn && (f >= lockF + j * 5 - 4) && !(unlocked && unlockSeq(j)));
  const lock = dim.map((d, j) => d && !(unlocked && unlockSeq(j)));
  void lockSeq;
  // tras el desbloqueo, los candados se abren de uno en uno
  const dimNow = unlocked ? [0, 1, 2, 3, 4].map((j) => j > 0 && !unlockSeq(j)) : dim;
  const lockNow = unlocked ? dimNow : lock;

  /* pelota guía: salta a la pestaña activa; durante los botones de arriba se esconde; en el desbloqueo celebra */
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
  let bx = tabCenter("out", 0, 0), by = BAR_TOP - 22, bsq = 0, ballVis = 0;
  const first = stops[0];
  if (f >= first.t - 26) {
    ballVis = 1;
    let prev: Stop | null = null, cur = first, idx = 0;
    for (let i = 0; i < stops.length; i++) { if (f >= stops[i].t - HOP) idx = i; }
    cur = stops[idx]; prev = idx > 0 ? stops[idx - 1] : null;
    const q = clamp01((f - (cur.t - HOP)) / HOP);
    const xCur = (prev && f < cur.t ? centerOf(cur) : centerOf(cur));
    const xPrev = prev ? centerOf({ ...prev, mode: prev.mode, idx: prev.idx }) : xCur;
    if (!prev) { // primera caída desde arriba
      const qq = clamp01((f - (first.t - 26)) / 26);
      bx = xCur; by = (BAR_TOP - 22) - (1 - qq * qq) * 420 + Math.max(0, Math.sin(qq * 3 * Math.PI)) * 0; bsq = qq > 0.92 ? (1 - qq) * 10 : 0;
    } else {
      bx = xPrev + (xCur - xPrev) * ease(q); by = BAR_TOP - 22 - Math.sin(Math.PI * q) * 78; bsq = q > 0.9 ? (1 - q) * 8 : 0;
    }
    if (f >= S.tr - 4 && f < S.lock - 4) ballVis = 0; // se esconde mientras la cámara está arriba
    else if (f >= S.lock - 4 && f < S.lock + 2) { const qq = clamp01((f - (S.lock - 4 - 0)) / 6); ballVis = qq; }
  }

  /* contenido (se desliza como al navegar en la app) */
  const rkFrom = rankAt(NAMES, 1), rkTo = rankAt(NAMES, 2);
  const rkK = ease((f - indivF + 6) / 26);
  const rkRows: RankRow[] = NAMES.map((n) => {
    const pos = rkFrom[n] + (rkTo[n] - rkFrom[n]) * rkK;
    return { key: n, name: n.split(" ")[0], pts: Math.round(PTS[n][1] + (PTS[n][2] - PTS[n][1]) * rkK), diff: Math.round(DIFF[n][1] + (DIFF[n][2] - DIFF[n][1]) * rkK), j: 2, pos, shownPos: Math.round(pos), moved: rkFrom[n] !== rkTo[n] && rkK < 0.95, climbing: rkTo[n] < rkFrom[n], tie: false };
  });
  const secs = 59 - (Math.floor(f / 30) % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  const newRow = pop(f, fps, crearF + 14, 11);
  const cardSwap = f >= cambF - 2 ? 1 : 0;
  const stat = (label: string, v: number, k: number) => <div key={label}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, color: t.textMuted, marginBottom: 4 }}><span>{label}</span><span style={{ color: t.text }}>{Math.round(v * k)}</span></div><div style={{ height: 9, borderRadius: 6, background: t.mutedSurface }}><div style={{ width: `${Math.min(100, v * 2.4) * k}%`, height: "100%", borderRadius: 6, background: t.accent }} /></div></div>;
  const statsK = (start: number) => ease((f - start) / 24);
  const chatBubble = (start: number) => <div style={{ alignSelf: "flex-start", background: t.mutedSurface, borderRadius: "16px 16px 16px 4px", padding: "9px 14px", fontSize: 14, fontWeight: 700, opacity: pop(f, fps, start, 10), transform: `scale(${0.8 + 0.2 * pop(f, fps, start, 10)})`, transformOrigin: "0 100%" }}>¿Quedamos el jueves a las 19:30?</div>;

  const panelOut = [
    <div key="o0" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Competiciones</div>
        <div style={{ opacity: cardSwap ? 0.45 : 1, transition: "none" }}><Row icon="trophy" title={league.name} sub={`${league.season} · Próxima`} right={cardSwap ? "" : "ACTUAL"} /></div>
        <div style={{ opacity: cardSwap ? 1 : 0.45 }}><Row icon="trophy" title="Liga de amigos" sub="Temporada 2 · Próxima" right={cardSwap ? "ACTUAL" : ""} /></div>
        <div style={{ opacity: 0.45 }}><Row icon="trophy" title="Liga del club" sub="Temporada 1 · Finalizada" /></div>
      </Panel>
      <div style={{ fontSize: 13, fontWeight: 800, color: t.textMuted, paddingLeft: 6 }}>{cardSwap ? "Cambias de liga con un toque" : "Aquí eliges tu liga"}</div>
    </div>,
    <Panel key="o1"><div style={{ fontSize: 19, fontWeight: 800 }}>Mis partidos</div>
      <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "13px 0", textAlign: "center", fontSize: 16, fontWeight: 900, transform: `scale(${f >= crearF && f < crearF + 8 ? 0.95 : 1})` }}>Crear nuevo encuentro</div>
      <div style={{ opacity: newRow, transform: `translateY(${(1 - newRow) * -16}px)`, display: newRow > 0.01 ? "block" : "none" }}><Row icon="ball" title="Amistoso · jueves 19:30" sub="Creado por ti" right="AMISTOSO" /></div>
      <Row icon="ball" title="Jornada de apertura" sub="Domingo 20 de diciembre" right="LIGA" />
      <Row icon="ball" title="Próximos partidos" sub="Los tuyos de liga y tus amistosos" /></Panel>,
    <Panel key="o2"><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="chat" title="Chat de tu partido" sub="Para quedar con tu pareja y rivales" right="2" />{chatBubble(outM[2] + 6)}<Row icon="chat" title="Chat de tu amistoso" sub="Jueves · 19:30" /></Panel>,
    <Panel key="o3"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar size={52} /><div><div style={{ fontSize: 19, fontWeight: 800 }}>Mi perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus datos y tus estadísticas</div></div></div>{stat("Partidos", 12, statsK(outM[3]))}{stat("Sets ganados", 17, statsK(outM[3] + 4))}{stat("Mejor pareja", 9, statsK(outM[3] + 8))}</Panel>,
  ];
  const panelIn = [
    <div key="i0" style={{ display: "flex", flexDirection: "column", gap: 12 }}><Tiles d="30" h="11" m={pad((Math.floor(f / 1800) + 12) % 60)} s={pad(secs)} /><Panel><Row icon="pin" title="Jornada de apertura" sub="Polideportivo Pando · Portugalete" /></Panel></div>,
    <div key="i1" style={{ zoom: 0.72 }}><RankingCard rows={rkRows} /></div>,
    <Panel key="i2"><div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div><PairPills a={[q4[0], q4[1]]} b={[q4[2], q4[3]]} width={NATIVE_W - 38} />
      {["Jornada 2", "Jornada 3"].map((j, k) => <div key={j} style={{ opacity: pop(f, fps, inM[2] + 12 + k * 6, 10), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, background: t.mutedSurface, color: t.textSubtle, fontSize: 15, fontWeight: 800 }}><span>{j}</span><span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="lock" color={t.textSubtle} size={16} />Emparejamientos secretos</span></div>)}</Panel>,
    <Panel key="i3"><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="ball" title="Chat de tu partido" sub="Para quedar con tu pareja y rivales" right="2" />{chatBubble(inM[3] + 6)}</Panel>,
    <Panel key="i4"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar size={52} /><div><div style={{ fontSize: 19, fontWeight: 800 }}>Perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus estadísticas en la liga</div></div></div>{stat("Puntos", 6, statsK(inM[4]))}{stat("Diferencia de juegos", 11, statsK(inM[4] + 4))}{stat("Partidos jugados", 3, statsK(inM[4] + 8))}</Panel>,
  ];
  const icons = ["help", "bell", "gear"];
  const topCards = [
    <Panel key="t0"><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="help" color={t.accent} size={28} /><div style={{ fontSize: 19, fontWeight: 800 }}>Ayuda</div></div><div style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.4 }}>Guías y vídeos tutoriales para usar cada parte de la app.</div></Panel>,
    <Panel key="t1"><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="bell" color={t.accent} size={28} /><div style={{ fontSize: 19, fontWeight: 800 }}>Notificaciones</div></div><Row icon="ball" title="Tienes un partido mañana" sub="Jueves · 19:30" right="NUEVA" /><Row icon="cal" title="Nueva jornada disponible" sub="Ya puedes verla" /><Row icon="check" title="Resultado guardado" sub="Tu partido ya cuenta" /></Panel>,
    <Panel key="t2"><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Icon name="gear" color={t.accent} size={28} /><div style={{ fontSize: 19, fontWeight: 800 }}>Ajustes</div></div><Row title="Idioma" sub="Español" /><Row title="Avisos" sub="Elige cuáles recibir" /><Row title="Apariencia" sub="Color de la liga" /></Panel>,
  ];
  type Sl = { from: number; to: number; node: React.ReactNode; y: number };
  const slides: Sl[] = [];
  outM.forEach((m, i) => slides.push({ from: i === 0 ? S.out + 10 : m - 4, to: i < 3 ? outM[i + 1] - 4 : S.inn - 2, node: panelOut[i], y: CAM_MAX + 16 }));
  inM.forEach((m, i) => slides.push({ from: i === 0 ? S.inn + 16 : m - 4, to: i < 4 ? inM[i + 1] - 4 : S.tr - 6, node: panelIn[i], y: CAM_MAX + 16 }));
  trM.forEach((m, i) => slides.push({ from: m - 4, to: i < 2 ? trM[i + 1] - 4 : S.lock - 14, node: topCards[i], y: HEAD_H + 22 }));
  const dayK = pop(f, fps, dayF, 12);
  slides.push({ from: S.lock - 6, to: S.end + 20, y: CAM_MAX + 16, node: (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", width: NATIVE_W - 24 }}>
      <Tiles d="30" h="11" m={pad(12)} s={pad(secs)} />
      <div style={{ opacity: dayK, transform: `scale(${0.85 + 0.15 * dayK})`, display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `2px solid ${unlocked ? t.accent : t.borderStrong}`, borderRadius: 999, padding: "10px 22px", fontSize: 16, fontWeight: 900 }}>
        <Icon name={unlocked ? "check" : "lock"} color={t.accent} size={22} />{unlocked ? "Temporada en marcha: ya puedes usar todo" : f >= errF - 2 ? "No es un error: esperando al 20 de diciembre" : "Solo Inicio hasta el 20 de diciembre"}
      </div>
    </div>) });

  const TAGS: [number, string][] = [[S.out, "FUERA DE LA LIGA"], [S.inn, "DENTRO DE LA LIGA"], [S.tr, "ARRIBA A LA DERECHA"], [S.lock, "LIGA BLOQUEADA"], [S.err, "TEMPORADA PROGRAMADA"]];
  const tagI = TAGS.reduce((a, [s0], i) => (f >= s0 - 4 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0] - 4, 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const example = f >= S.inn - 4 && f < S.tr - 6;
  const hookP = pop(f, fps, 8, 10), hookOut = 1 - ease((f - (S.out - 6)) / 14);
  const pill = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" as const };
  const rippleTabs = [...outM.map((m, i) => ({ a: m - 4, x: tabCenter("out", i, 0) })), ...inM.map((m, i) => ({ a: m - 4, x: tabCenter("in", i, 1) }))];

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
      {/* móvil con cámara */}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn, transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `translateY(${camY}px) scale(${Z})` }}>
            {/* cabecera */}
            <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: HEAD_H, boxSizing: "border-box", background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 19, fontWeight: 800 }}>{f < S.inn ? "Inicio" : "Inicio"}</div>
              <div style={{ display: "flex", gap: 10 }}>
                {icons.map((ic, i) => { const on = f >= trM[i] - 4 && f < S.lock - 14; const k = pop(f, fps, trM[i] - 4, 10); return (
                  <div key={ic} style={{ position: "relative", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: on ? t.accent : t.mutedSurface, border: `1px solid ${on ? t.accent : t.border}`, transform: `scale(${1 + 0.2 * Math.sin(Math.min(1, k) * Math.PI)}) rotate(${ic === "gear" && on ? Math.min(1, (f - trM[i]) / 20) * 180 : 0}deg)` }}>
                    <Icon name={ic} color={on ? t.accentContrast : t.textMuted} size={22} />
                  </div>); })}
              </div>
            </div>
            {/* contenido */}
            {slides.map((s, i) => {
              const inn = ease((f - s.from) / 14), out = 1 - ease((f - (s.to - 11)) / 10);
              const o = Math.min(inn, out);
              if (o <= 0.01) return null;
              return <div key={i} style={{ position: "absolute", left: 12, top: s.y, opacity: o, transform: `translateX(${(1 - inn) * 46 - (1 - out) * 30}px)` }}>{s.node}</div>;
            })}
            {/* barra */}
            <div style={{ position: "absolute", left: 0, top: BAR_TOP, width: NATIVE_W }}>
              <MorphBar m={morph} activeOut={activeOut} activeIn={activeIn} dim={dimNow} lock={lockNow} />
            </div>
            {rippleTabs.map((r, i) => <Ripple key={i} x={r.x} y={BAR_TOP + 38} at={r.a} />)}
            {trM.map((m, i) => <Ripple key={`t${i}`} x={NATIVE_W - 14 - 20 - (2 - i) * 50} y={HEAD_H / 2} at={m - 4} size={44} />)}
            <Ripple x={NATIVE_W / 2} y={CAM_MAX + 16 + 92} at={crearF} size={80} />
            {/* pelota guía */}
            {ballVis > 0 && <div style={{ position: "absolute", left: bx - 15, top: by - 15, width: 30, height: 30, opacity: ballVis, transform: `scale(${1 + 0.25 * bsq}, ${1 - 0.3 * bsq})`, transformOrigin: "50% 100%", zIndex: 5 }}><Ball size={30} /></div>}
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
void BAR_W; void OUT; void IN;
