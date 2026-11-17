// Vídeo 13: presentación de la app — navegación fuera/dentro de la liga, botones de arriba y liga bloqueada hasta el inicio.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py; pausa de 0,7 s tras "recuerda," para dar empaque al cierre).
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, PairPills, RankRow, RankingCard, Zoom } from "./appUi";
import { DIFF, LeagueConfig, PTS, rankAt } from "./Bienvenida";
import { Panel } from "./Perfil";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice13";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

/* ---------- Réplicas de la app ---------- */
const Icon: React.FC<{ name: string; color: string; size?: number }> = ({ name, color, size = 22 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {name === "home" && (<><path d="M3 10.5 12 3l9 7.5V21H3z" /><path d="M9 21v-6h6v6" /></>)}
      {name === "rank" && <path d="M6 20v-8M12 20V4M18 20V9" />}
      {name === "cal" && (<><rect x={3} y={5} width={18} height={16} rx={3} /><path d="M3 10h18M8 3v4M16 3v4" /></>)}
      {name === "chat" && <path d="M4 5h16v11H9l-5 4z" />}
      {name === "user" && (<><circle cx={12} cy={8} r={4} /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>)}
      {name === "trophy" && <path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8.5 20h7" />}
      {name === "ball" && (<><circle cx={12} cy={12} r={9} /><path d="M4.5 7.5c4 1.5 4 7.5 0 9M19.5 7.5c-4 1.5-4 7.5 0 9" /></>)}
      {name === "bell" && (<><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 21h4" /></>)}
      {name === "gear" && (<><circle cx={12} cy={12} r={3} /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" /></>)}
      {name === "help" && (<><circle cx={12} cy={12} r={9} /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></>)}
      {name === "lock" && (<><rect x={5} y={11} width={14} height={9} rx={2} /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>)}
    </svg>
  );
};

type NavDef = [string, string];
const NavBar: React.FC<{ items: NavDef[]; active: number; dim?: boolean[]; lock?: boolean[]; pulse?: number }> = ({ items, active, dim = [], lock = [], pulse = 1 }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 22, padding: 8, display: "flex", gap: 4 }}>
      {items.map(([icon, label], i) => {
        const on = i === active;
        return (
          <div key={label} style={{ flex: 1, position: "relative", borderRadius: 16, padding: "9px 0 8px", textAlign: "center", background: on ? t.accent : "transparent", color: on ? t.accentContrast : t.textMuted, opacity: dim[i] ? 0.35 : 1, transform: `scale(${on ? 0.92 + 0.08 * pulse : 1})` }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Icon name={lock[i] ? "lock" : icon} color={on ? t.accentContrast : t.textMuted} /></div>
            <div style={{ fontSize: items.length === 5 ? 12 : 11.5, fontWeight: 800, marginTop: 4 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};

const OUTSIDE: NavDef[] = [["trophy", "Competiciones"], ["ball", "Mis partidos"], ["chat", "Chats"], ["user", "Mi perfil"]];
const INSIDE: NavDef[] = [["home", "Inicio"], ["rank", "Ranking"], ["cal", "Calendario"], ["chat", "Chats"], ["user", "Perfil"]];

const Row: React.FC<{ title: string; sub?: string; right?: string; icon?: string }> = ({ title, sub, right, icon }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W - 38, display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: `1px solid ${t.border}` }}>
      {icon && <div style={{ width: 38, height: 38, borderRadius: 12, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} color={t.accentContrast} size={21} /></div>}
      <div style={{ flex: 1 }}><div style={{ fontSize: 16.5, fontWeight: 800 }}>{title}</div>{sub && <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{sub}</div>}</div>
      {right && <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: t.accent }}>{right}</div>}
    </div>
  );
};

const MiniCountdown: React.FC = () => {
  const t = useTheme();
  const tile = (v: string, l: string) => <div style={{ flex: 1, background: "rgba(255,255,255,.16)", borderRadius: 14, padding: "12px 0 10px", textAlign: "center" }}><div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{v}</div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.6, marginTop: 6 }}>{l}</div></div>;
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.accent, color: t.accentContrast, borderRadius: 28, padding: "34px 18px 30px", textAlign: "center" }}>
      <div style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: 3.5 }}>LA TEMPORADA COMIENZA EN</div>
      <div style={{ display: "flex", gap: 8, margin: "20px 0 16px" }}>{tile("30", "DÍAS")}{tile("12", "HORAS")}{tile("45", "MIN")}{tile("09", "SEG")}</div>
      <div style={{ fontSize: 17, fontWeight: 900 }}>Domingo 20 de diciembre</div>
    </div>
  );
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  return (
    <Frame>
      <Words text={"¿Dónde está\ncada *cosa*\nen la app?"} size={104} stagger={4} />
      <div style={{ marginTop: 80, opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}><Zoom z={2.15}><NavBar items={INSIDE} active={-1} /></Zoom></div>
    </Frame>
  );
};

const Swap: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 11);
  return <div style={{ opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})` }}>{children}</div>;
};

/* 2 · Fuera de la liga: 4 secciones */
const Outside = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const marks = [wf(ws, "competiciones"), wf(ws, "mis"), wf(ws, "chats"), wf(ws, "mi")];
  const active = marks.reduce((a, m, i) => (f >= m - 4 ? i : a), -1);
  const barP = pop(f, fps, 6, 12);
  const sec = marks[Math.max(0, active)] - 4;
  return (
    <Frame tag="FUERA DE LA LIGA" timedWords={ws}>
      <div style={{ position: "absolute", top: 330, opacity: Math.min(1, barP * 2), transform: `scale(${0.92 + 0.08 * barP})` }}><Zoom z={2.15}><NavBar items={OUTSIDE} active={active} /></Zoom></div>
      <div style={{ position: "absolute", top: 640 }}>
        {active === 0 && <Swap key="a" at={sec}><Zoom z={2.15}><Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Competiciones</div><Row icon="trophy" title={league.name} sub={`${league.season} · Próxima`} right="CAMBIAR LIGA" /></Panel></Zoom></Swap>}
        {active === 1 && <Swap key="b" at={sec}><Zoom z={2.15}><Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Mis partidos</div>
          <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "13px 0", textAlign: "center", fontSize: 16, fontWeight: 900 }}>Crear nuevo encuentro</div>
          <Row icon="ball" title="Próximos partidos" sub="Los tuyos de liga y tus amistosos" /></Panel></Zoom></Swap>}
        {active === 2 && <Swap key="c" at={sec}><Zoom z={2.15}><Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="chat" title="Tus conversaciones" sub="Partidos y liga" /></Panel></Zoom></Swap>}
        {active === 3 && <Swap key="d" at={sec}><Zoom z={2.15}><Panel><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Zoom z={1.3}><Avatar size={44} /></Zoom><div><div style={{ fontSize: 19, fontWeight: 800 }}>Mi perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus datos y tus estadísticas</div></div></div></Panel></Zoom></Swap>}
      </div>
      {marks.map((m) => sfx("pop", Math.max(2, m - 4), 0.35))}
    </Frame>
  );
};

/* 3 · Dentro de la liga: 5 pestañas */
const Inside = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const marks = [wf(ws, "inicio"), wf(ws, "ranking"), wf(ws, "calendario"), wf(ws, "chats"), wf(ws, "perfil")];
  const active = marks.reduce((a, m, i) => (f >= m - 4 ? i : a), -1);
  const barP = pop(f, fps, 4, 12);
  const sec = marks[Math.max(0, active)] - 4;
  const NAMES = league.playerNames;
  const to = rankAt(NAMES, 2);
  const rows: RankRow[] = NAMES.map((n) => ({ key: n, name: n.split(" ")[0], pts: PTS[n][2], diff: DIFF[n][2], j: 2, pos: to[n], shownPos: to[n], moved: false, climbing: false, tie: false }));
  const q = league.exampleQuartet;
  return (
    <Frame tag="DENTRO DE LA LIGA" example timedWords={ws}>
      <div style={{ position: "absolute", top: 330, opacity: Math.min(1, barP * 2), transform: `scale(${0.92 + 0.08 * barP})` }}><Zoom z={2.15}><NavBar items={INSIDE} active={active} /></Zoom></div>
      <div style={{ position: "absolute", top: 620 }}>
        {active === 0 && <Swap key="a" at={sec}><Zoom z={2.15}><MiniCountdown /></Zoom></Swap>}
        {active === 1 && <Swap key="b" at={sec}><Zoom z={1.62}><RankingCard rows={rows} /></Zoom></Swap>}
        {active === 2 && <Swap key="c" at={sec}><Zoom z={2.15}><Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div><PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} /></Panel></Zoom></Swap>}
        {active === 3 && <Swap key="d" at={sec}><Zoom z={2.15}><Panel><div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div><Row icon="chat" title="Chat de la liga" sub="Avisos y conversación" /><Row icon="ball" title="Chat de tu partido" sub="Para quedar con tu pareja y rivales" /></Panel></Zoom></Swap>}
        {active === 4 && <Swap key="e" at={sec}><Zoom z={2.15}><Panel><div style={{ display: "flex", alignItems: "center", gap: 12 }}><Zoom z={1.3}><Avatar size={44} /></Zoom><div><div style={{ fontSize: 19, fontWeight: 800 }}>Perfil</div><div style={{ fontSize: 12.5, color: t.textMuted }}>Tus estadísticas en la liga</div></div></div></Panel></Zoom></Swap>}
      </div>
      {marks.map((m) => sfx("pop", Math.max(2, m - 4), 0.35))}
    </Frame>
  );
};

/* 4 · Botones de arriba a la derecha */
const TopRight = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const marks = [wf(ws, "ayuda"), wf(ws, "notificaciones"), wf(ws, "ajustes")];
  const labels = ["Ayuda", "Notificaciones", "Ajustes"];
  const icons = ["help", "bell", "gear"];
  const p = pop(f, fps, 3, 12);
  return (
    <Frame tag="ARRIBA A LA DERECHA" timedWords={ws}>
      <div style={{ width: 900, opacity: Math.min(1, p * 2), transform: `scale(${0.94 + 0.06 * p})` }}>
        <Zoom z={2.15}>
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: "14px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Inicio</div>
            <div style={{ display: "flex", gap: 10 }}>
              {icons.map((ic, i) => {
                const on = f >= marks[i] - 4;
                const k = pop(f, fps, marks[i] - 4, 10);
                return <div key={ic} style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: on ? t.accent : t.mutedSurface, border: `1px solid ${on ? t.accent : t.border}`, transform: `scale(${1 + 0.18 * Math.sin(Math.min(1, k) * Math.PI)})` }}><Icon name={ic} color={on ? t.accentContrast : t.textMuted} size={22} /></div>;
              })}
            </div>
          </div>
        </Zoom>
      </div>
      <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        {labels.map((l, i) => {
          const k = pop(f, fps, marks[i] - 4, 11);
          return <div key={l} style={{ opacity: k, transform: `translateX(${(1 - k) * 200}px)`, display: "flex", alignItems: "center", gap: 18, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "14px 36px", fontSize: 40, fontWeight: 800 }}><Icon name={icons[i]} color={t.accent} size={40} />{l}</div>;
        })}
      </div>
      {marks.map((m) => sfx("pop", Math.max(2, m - 4), 0.35))}
    </Frame>
  );
};

/* 5 · La liga está bloqueada hasta el 20 de diciembre */
const Locked = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const dayF = wf(ws, "20"), lockF = wf(ws, "bloqueada");
  const p = pop(f, fps, 3, 12);
  const locked = f >= lockF - 2;
  const chip = pop(f, fps, dayF, 12);
  return (
    <Frame tag="LIGA BLOQUEADA" timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.15}><NavBar items={INSIDE} active={0} dim={locked ? [false, true, true, true, true] : []} lock={locked ? [false, true, true, true, true] : []} /></Zoom>
      </div>
      <div style={{ marginTop: 90, opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, background: t.accent, color: t.accentContrast, borderRadius: 40, padding: "22px 70px", textAlign: "center" }}>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 6 }}>HASTA EL</div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>20</div>
        <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: 8 }}>DICIEMBRE</div>
      </div>
      {sfx("pop", dayF, 0.4)}{sfx("pop", lockF, 0.4)}
    </Frame>
  );
};

/* 6 · No es un error: se desbloquea al empezar la temporada */
const NotError = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const errF = wf(ws, "error"), openF = wf(ws, "empieza");
  const p = pop(f, fps, 3, 12);
  const unlocked = f >= openF;
  const chip = pop(f, fps, errF - 2, 12);
  const un = pop(f, fps, openF, 12);
  return (
    <Frame tag="TEMPORADA PROGRAMADA" timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <NavBar items={INSIDE} active={0} dim={unlocked ? [] : [false, true, true, true, true]} lock={unlocked ? [] : [false, true, true, true, true]} pulse={unlocked ? un : 1} />
            <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${unlocked ? t.accent : t.border}`, borderRadius: 18, padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 19, fontWeight: 900 }}>{unlocked ? "¡Temporada en marcha!" : "Temporada programada"}</div>
              <div style={{ fontSize: 14, color: t.textMuted, marginTop: 6, lineHeight: 1.35 }}>{unlocked ? "Ya puedes usar todas las secciones." : "Esta sección estará disponible cuando comience la temporada."}</div>
            </div>
          </div>
        </Zoom>
      </div>
      <div style={{ marginTop: 80, opacity: chip, transform: `scale(${0.9 + 0.1 * chip})`, background: unlocked ? t.accent : t.surface, color: unlocked ? t.accentContrast : t.accent, border: `3px solid ${t.accent}`, borderRadius: 999, padding: "22px 60px", fontSize: 54, fontWeight: 900, letterSpacing: 2 }}>{unlocked ? "DESBLOQUEADA" : "NO ES UN ERROR"}</div>
      {sfx("pop", errF - 2, 0.4)}{sfx("ding", openF, 0.5)}
    </Frame>
  );
};

/* 7 · Cierre con empaque: "Así que recuerda, ¡Nos vemos en la pista!" */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const marks = [wf(ws, "nos"), wf(ws, "vemos"), wf(ws, "en"), wf(ws, "pista")];
  const words = ["Nos", "vemos", "en la", "pista"];
  const recF = wf(ws, "recuerda");
  const burst = interpolate(f, [marks[3], marks[3] + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 340 + burst * 500, height: 340 + burst * 500, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03 + 0.12 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ height: 30, opacity: 0 }}>{recF}</div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", width: 900 }}>
        {words.map((w, i) => {
          const k = pop(f, fps, Math.max(0, marks[i] - 3), 9);
          const last = i === 3;
          return <div key={w} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})`, fontSize: 124, fontWeight: 900, lineHeight: 1.1, color: i >= 2 ? t.accent : t.text, textShadow: last ? `0 0 ${40 * (1 - burst)}px ${t.accent}` : "none" }}>{w}</div>;
        })}
      </div>
      <div style={{ marginTop: 40 }}><Ball size={76} /></div>
      {marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.5))}{sfx("ding", marks[3], 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Outside, Inside, TopRight, Locked, NotError, Outro];
const KEYS = ["hook", "outside", "inside", "topright", "locked", "noterror", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const PRESENTACION_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Presentacion: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-13-david.mp3" />;
