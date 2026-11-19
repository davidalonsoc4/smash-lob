// Vídeo 2 (v2): presentación de la app con ELEMENTO COMPARTIDO: la barra de navegación es un único elemento que persiste y se transforma
// (4 secciones fuera de la liga → 5 pestañas dentro; Chats y Perfil viajan a su nueva posición; en «bloqueada» se atenúan y se cierran con candado).
// Voz: David Martin · Eleven v3 (toma del vídeo original + cierre sobrio «Nos vemos en la pista» de la toma de la Bienvenida v2).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, PairPills, RankRow, RankingCard, Zoom } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { Panel } from "./Perfil";
import { Icon, MiniCountdown, PresOutro, Row } from "./Presentacion";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice13c";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
export const ease = (q: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, q)), 3);
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth); // cuadro absoluto del vídeo

/* ---------- Barra de navegación única que se transforma ---------- */
export const OUT = [["trophy", "Competiciones"], ["ball", "Mis partidos"], ["chat", "Chats"], ["user", "Mi perfil"]];
export const IN = [["home", "Inicio"], ["rank", "Ranking"], ["cal", "Calendario"], ["chat", "Chats"], ["user", "Perfil"]];
export const BAR_W = NATIVE_W - 18, GAP = 4, ITEM_H = 58;
export const geo = (n: number, i: number) => { const w = (BAR_W - GAP * (n - 1)) / n; return { x: i * (w + GAP), w }; };
export const SHARED: Record<number, number> = { 2: 3, 3: 4 }; // fuera → dentro (Chats, Perfil)

export const MorphBar: React.FC<{ m: number; activeOut: number; activeIn: number; dim: boolean[]; lock: boolean[] }> = ({ m, activeOut, activeIn, dim, lock }) => {
  const t = useTheme();
  const item = (key: string, icon: string, label: string, x: number, w: number, on: boolean, o: number, sc: number, dimmed: boolean, locked: boolean) => (
    <div key={key} style={{ position: "absolute", left: x, top: 0, width: w, height: ITEM_H, borderRadius: 16, textAlign: "center", background: on ? t.accent : "transparent", color: on ? t.accentContrast : t.textMuted, opacity: o * (dimmed ? 0.35 : 1), transform: `scale(${sc})`, boxSizing: "border-box", paddingTop: 9 }}>
      <div style={{ display: "flex", justifyContent: "center" }}><Icon name={locked ? "lock" : icon} color={on ? t.accentContrast : t.textMuted} /></div>
      <div style={{ fontSize: m > 0.5 ? 12 : 11.5, fontWeight: 800, marginTop: 4, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
  const els: React.ReactNode[] = [];
  OUT.forEach(([icon, label], i) => {
    const gO = geo(4, i);
    if (i in SHARED) {
      const j = SHARED[i], gI = geo(5, j);
      const x = gO.x + (gI.x - gO.x) * m, w = gO.w + (gI.w - gO.w) * m;
      els.push(item(`s${i}`, icon, m > 0.5 ? IN[j][1] : label, x, w, m > 0.5 ? activeIn === j : activeOut === i, 1, 1, m > 0.5 && !!dim[j], m > 0.5 && !!lock[j]));
    } else els.push(item(`o${i}`, icon, label, gO.x, gO.w, activeOut === i && m < 0.5, 1 - ease(m * 1.6), 1 - 0.12 * m, false, false));
  });
  IN.forEach(([icon, label], j) => {
    if (Object.values(SHARED).includes(j)) return;
    const gI = geo(5, j);
    els.push(item(`i${j}`, icon, label, gI.x, gI.w, activeIn === j && m > 0.5, ease((m - 0.35) * 1.7), 0.88 + 0.12 * m, !!dim[j], !!lock[j]));
  });
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 22, padding: 8 }}>
      <div style={{ position: "relative", width: BAR_W, height: ITEM_H }}>{els}</div>
    </div>
  );
};

/* ---------- Escena única: gancho + fuera + dentro + botones + bloqueo + «no es un error» ---------- */
const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  // anclas (cuadros absolutos)
  const outM = [at(1, "competiciones"), at(1, "mis"), at(1, "chats"), at(1, "mi")];
  const inM = [at(2, "inicio"), at(2, "ranking"), at(2, "calendario"), at(2, "chats"), at(2, "perfil")];
  const trM = [at(3, "ayuda"), at(3, "notificaciones"), at(3, "ajustes")];
  const dayF = at(4, "20"), lockF = at(4, "bloqueada"), errF = at(5, "error"), openF = at(5, "empieza");
  const S = { hook: 0, out: B30(1), inn: B30(2), tr: B30(3), lock: B30(4), err: B30(5), end: B30(6) };
  const mark = (arr: number[]) => arr.reduce((a, m, i) => (f >= m - 4 ? i : a), -1);
  const activeOut = f < S.inn - 4 ? (f < S.out ? -1 : mark(outM)) : -1;
  const activeIn = f < S.inn ? -1 : f < S.tr ? mark(inM) : 0;
  const morph = ease((f - (S.inn - 6)) / 28);
  const unlocked = f >= openF;
  const lockOn = f >= lockF - 2 && !unlocked;
  const dim = lockOn ? [false, true, true, true, true] : [];
  const lock = lockOn ? [false, true, true, true, true] : [];
  // La barra entra con «fuera de la liga», se transforma al pasar «dentro de la liga», se retira para los botones de arriba y vuelve para «bloqueada».
  const barOn = (a: number, b: number) => ease((f - a) / 12) * (1 - ease((f - b) / 12));
  const barVis = Math.max(barOn(S.out - 4, S.tr - 14), barOn(S.lock - 4, S.end + 400));
  const headerP = barOn(S.tr - 4, S.lock - 14);
  const barTop = 330, panelTop = 640;

  // contenido bajo la barra (se encadena con fundidos, es el mismo contenedor)
  const q = league.exampleQuartet, NAMES = league.playerNames, to = rankAt(NAMES, 2);
  const rows: RankRow[] = NAMES.map((n) => ({ key: n, name: n.split(" ")[0], pts: PTS[n][2], diff: DIFF[n][2], j: 2, pos: to[n], shownPos: to[n], moved: false, climbing: false, tie: false }));
  const panelOut = [
    <Panel key="o0"><div style={{ fontSize: 19, fontWeight: 800 }}>Competiciones</div><Row icon="trophy" title={league.name} sub={`${league.season} · Próxima`} right="ENTRAR" /></Panel>,
    <Panel key="o1"><div style={{ fontSize: 19, fontWeight: 800 }}>Mis partidos</div><div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "13px 0", textAlign: "center", fontSize: 16, fontWeight: 900 }}>Crear nuevo encuentro</div><Row icon="ball" title="Próximos partidos" sub="Los tuyos de liga y tus amistosos" /></Panel>,
    <Panel key="o2"><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="chat" title="Tus conversaciones" sub="Partidos y liga" /></Panel>,
    <Panel key="o3"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Zoom z={1.3}><Avatar size={44} /></Zoom><div><div style={{ fontSize: 19, fontWeight: 800 }}>Mi perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus datos y tus estadísticas</div></div></div></Panel>,
  ];
  const panelIn = [
    <MiniCountdown key="i0" />,
    <div key="i1" style={{ zoom: 0.75 }}><RankingCard rows={rows} /></div>,
    <Panel key="i2"><div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div><PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} /></Panel>,
    <Panel key="i3"><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="chat" title="Chat de la liga" sub="Avisos y conversación" /><Row icon="ball" title="Chat de tu partido" sub="Para quedar con tu pareja y rivales" /></Panel>,
    <Panel key="i4"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Zoom z={1.3}><Avatar size={44} /></Zoom><div><div style={{ fontSize: 19, fontWeight: 800 }}>Perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus estadísticas en la liga</div></div></div></Panel>,
  ];
  const labels = ["Ayuda", "Notificaciones", "Ajustes"], icons = ["help", "bell", "gear"];
  const topList = (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
      {labels.map((l, i) => { const k = pop(f, fps, trM[i] - 4, 11); return <div key={l} style={{ opacity: k, transform: `translateX(${(1 - k) * 200}px)`, display: "flex", alignItems: "center", gap: 18, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "14px 36px", fontSize: 40, fontWeight: 800 }}><Icon name={icons[i]} color={t.accent} size={40} />{l}</div>; })}
    </div>
  );
  const dayChip = (
    <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 40, padding: "22px 70px", textAlign: "center", opacity: pop(f, fps, dayF, 12), transform: `scale(${0.85 + 0.15 * pop(f, fps, dayF, 12)})` }}>
      <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 6 }}>HASTA EL</div><div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>20</div><div style={{ fontSize: 46, fontWeight: 900, letterSpacing: 8 }}>DICIEMBRE</div>
    </div>
  );
  const notError = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
      <Zoom z={2.15}><div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${unlocked ? t.accent : t.border}`, borderRadius: 18, padding: "18px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 19, fontWeight: 900 }}>{unlocked ? "¡Temporada en marcha!" : "Temporada programada"}</div>
        <div style={{ fontSize: 14, color: t.textMuted, marginTop: 6, lineHeight: 1.35 }}>{unlocked ? "Ya puedes usar todas las secciones." : "Esta sección estará disponible cuando comience la temporada."}</div>
      </div></Zoom>
      <div style={{ opacity: pop(f, fps, errF - 2, 12), transform: `scale(${0.9 + 0.1 * pop(f, fps, errF - 2, 12)})`, background: unlocked ? t.accent : t.surface, color: unlocked ? t.accentContrast : t.accent, border: `3px solid ${t.accent}`, borderRadius: 999, padding: "22px 60px", fontSize: 54, fontWeight: 900, letterSpacing: 2 }}>{unlocked ? "DESBLOQUEADA" : "NO ES UN ERROR"}</div>
    </div>
  );
  type Sl = { from: number; to: number; node: React.ReactNode; z: number };
  const slides: Sl[] = [];
  outM.forEach((m, i) => slides.push({ from: m - 4, to: i < 3 ? outM[i + 1] - 4 : S.inn - 2, node: panelOut[i], z: 2.15 }));
  inM.forEach((m, i) => slides.push({ from: m - 4, to: i < 4 ? inM[i + 1] - 4 : S.tr - 2, node: panelIn[i], z: 2.15 }));
  slides.push({ from: S.tr - 2, to: S.lock - 2, node: topList, z: 1 });
  slides.push({ from: S.lock - 2, to: S.err - 2, node: dayChip, z: 1 });
  slides.push({ from: S.err - 2, to: S.end + 10, node: notError, z: 1 });

  // etiqueta de sección (la misma píldora cambia de texto) y rótulo de ejemplo
  const TAGS2: [number, string][] = [[S.out, "FUERA DE LA LIGA"], [S.inn, "DENTRO DE LA LIGA"], [S.tr, "ARRIBA A LA DERECHA"], [S.lock, "LIGA BLOQUEADA"], [S.err, "TEMPORADA PROGRAMADA"]];
  const tagI = TAGS2.reduce((a, [s0], i) => (f >= s0 - 4 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS2[tagI][0] - 4, 12);
  const prev = tagI > 0 ? TAGS2[tagI - 1][1] : "";
  const example = f >= S.inn - 4 && f < S.tr - 4;
  const hookP = pop(f, fps, 8, 10), hookOut = 1 - ease((f - (S.out - 2)) / 14);

  return (
    <Frame timedWords={ws}>
      {/* etiqueta de sección */}
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" }}>{TAGS2[tagI][1]}</div>
        </div>}
      </div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      {/* cabecera con los botones de arriba a la derecha */}
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: headerP, transform: `translateY(${(1 - headerP) * -40}px) scale(${0.94 + 0.06 * headerP})` }}>
        <Zoom z={2.15}>
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: "14px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Inicio</div>
            <div style={{ display: "flex", gap: 10 }}>
              {icons.map((ic, i) => { const on = f >= trM[i] - 4; const k = pop(f, fps, trM[i] - 4, 10); return <div key={ic} style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: on ? t.accent : t.mutedSurface, border: `1px solid ${on ? t.accent : t.border}`, transform: `scale(${1 + 0.18 * Math.sin(Math.min(1, k) * Math.PI)})` }}><Icon name={ic} color={on ? t.accentContrast : t.textMuted} size={22} /></div>; })}
            </div>
          </div>
        </Zoom>
      </div>
      {/* barra de navegación única */}
      <div style={{ position: "absolute", top: barTop, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: barVis, transform: `scale(${0.94 + 0.06 * barVis})` }}>
        <Zoom z={2.15}><MorphBar m={morph} activeOut={activeOut} activeIn={activeIn} dim={dim} lock={lock} /></Zoom>
      </div>
      {/* gancho */}
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookOut * Math.min(1, hookP * 2) }}><Words text={"¿Dónde está\ncada *cosa*\nen la app?"} size={104} stagger={4} /></div>
      {/* contenido que cambia con fundidos */}
      <div style={{ position: "absolute", top: panelTop, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {slides.map((s, i) => {
          const inn = ease((f - s.from) / 14), out = 1 - ease((f - (s.to - 11)) / 10);
          const o = Math.min(inn, out);
          if (o <= 0.01) return null;
          return <div key={i} style={{ position: "absolute", top: 0, opacity: o, transform: `translateY(${(1 - inn) * 36}px)` }}>{s.z === 1 ? s.node : <Zoom z={s.z}>{s.node}</Zoom>}</div>;
        })}
      </div>
      {[...outM, ...inM, ...trM, dayF, lockF, errF, openF].map((m, i) => sfx("pop", Math.max(2, m - 4), i === outM.length + inM.length + trM.length + 3 ? 0.5 : 0.3))}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <PresOutro league={league} ws={sceneWords(6)} /> },
];
export const PRESENTACION2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Presentacion2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-13c-david.mp3" />;
