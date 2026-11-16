// Vídeo 6: "Perfil y disponibilidad" — perfil (mano y posición), Mi disponibilidad y horarios recomendados.
// Voz: David Martin · Eleven v3 (toma 1, pausas ajustadas con scripts/retime_voice.py). Datos de ejemplo ficticios.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice06";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

/* ---------- Réplicas de la app ---------- */
const Ico: React.FC<{ name: "clock" | "user" | "cal" | "check"; color: string; size?: number }> = ({ name, color, size = 22 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {name === "clock" && (<><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></>)}
      {name === "user" && (<><circle cx={12} cy={8} r={4} /><path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5" /></>)}
      {name === "cal" && (<><rect x={3.5} y={5} width={17} height={15} rx={2.5} /><path d="M3.5 10h17M8 3v4M16 3v4" /></>)}
      {name === "check" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
};

const Chevron: React.FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4.5 12.5 10 7 15.5" /></svg>
);

const SettingsRow: React.FC<{ title: string; desc: string; icon: "clock" | "user"; hl: number }> = ({ title, desc, icon, hl }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${hl > 0.5 ? t.accent : t.border}`, borderRadius: 16, padding: "12px 14px", transform: `scale(${1 + 0.03 * hl})`, boxShadow: hl > 0.5 ? `0 0 0 3px ${t.accent}33` : "none" }}>
      {icon === "user" ? <Zoom z={0.82}><Avatar size={44} /></Zoom> : <div style={{ width: 36, height: 36, borderRadius: 12, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center" }}><Ico name={icon} color={t.accent} /></div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
      </div>
      <Chevron color={t.textSubtle} />
    </div>
  );
};

const Segmented: React.FC<{ label: string; options: string[]; sel: number }> = ({ label, options, sel }) => {
  const t = useTheme();
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {options.map((o, i) => (
          <div key={o} style={{ flex: 1, textAlign: "center", padding: "10px 4px", borderRadius: 12, fontSize: 14.5, fontWeight: 800, background: i === sel ? t.accent : t.mutedSurface, color: i === sel ? t.accentContrast : t.textMuted, border: `1px solid ${i === sel ? t.accent : t.border}` }}>{o}</div>
        ))}
      </div>
    </div>
  );
};

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const DayChips: React.FC<{ lit: boolean[] }> = ({ lit }) => {
  const t = useTheme();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 5 }}>
      {DAYS.map((d, i) => (
        <div key={d} style={{ height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, background: lit[i] ? t.accent : t.mutedSurface, color: lit[i] ? t.accentContrast : t.textSubtle, border: `1px solid ${lit[i] ? t.accent : t.border}` }}>{d}</div>
      ))}
    </div>
  );
};

const TimeBox: React.FC<{ label: string; value: string; on: boolean }> = ({ label, value, on }) => {
  const t = useTheme();
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ padding: "10px 12px", borderRadius: 12, background: t.mutedSurface, border: `1px solid ${t.border}`, fontSize: 17, fontWeight: 800, color: on ? t.text : t.textSubtle }}>{value}</div>
    </div>
  );
};

const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useTheme();
  return <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 18, padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  return (
    <Frame>
      <Words text={"¿Ya tienes\ntu *perfil* listo?"} size={118} stagger={4} />
      <div style={{ marginTop: 80, transform: `scale(${p})` }}>
        <div style={{ width: 190, height: 190, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${t.accent}80` }}><Ico name="user" color={t.accentContrast} size={110} /></div>
      </div>
    </Frame>
  );
};

/* 2 · Ajustes → Mi perfil → mano dominante y posición preferida */
const Profile = ({ ws }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tap = wf(ws, "perfil", 1) || 62; // "Mi perfil,"
  const rowP = pop(f, fps, Math.max(8, wf(ws, "ajustes") - 10), 12);
  const hl = Math.min(1, Math.max(0, (f - (tap - 6)) / 6));
  const formP = pop(f, fps, tap + 14, 13);
  const manoF = wf(ws, "mano"), posF = wf(ws, "posición");
  return (
    <Frame tag="AJUSTES · MI PERFIL" timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 980 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: Math.min(1, rowP * 2) * (1 - 0.35 * formP), transform: `translateY(${(1 - rowP) * 40}px)` }}>
          <Zoom z={2.15}><SettingsRow title="Mi perfil" desc="Tus datos, tu foto y cómo juegas." icon="user" hl={hl} /></Zoom>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 250, opacity: Math.min(1, formP * 2), transform: `translateY(${(1 - formP) * 60}px) scale(${0.94 + 0.06 * formP})` }}>
          <Zoom z={2.15}>
            <Panel>
              <Segmented label="Mano dominante" options={["Derecha", "Izquierda"]} sel={f >= manoF + 18 ? 0 : -1} />
              <Segmented label="Posición preferida" options={["Drive", "Revés", "Versátil"]} sel={f >= posF + 22 ? 0 : -1} />
            </Panel>
          </Zoom>
        </div>
      </div>
      {sfx("pop", tap, 0.35)}{sfx("pop", manoF + 18, 0.35)}{sfx("pop", posF + 22, 0.35)}
    </Frame>
  );
};

/* 3 · Ajustes → Mi disponibilidad → días y franja */
const Availability = ({ ws }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const tap = wf(ws, "disponibilidad");
  const rowP = pop(f, fps, Math.max(8, wf(ws, "ajustes") - 12), 12);
  const hl = Math.min(1, Math.max(0, (f - (tap - 4)) / 6));
  const formP = pop(f, fps, tap + 12, 13);
  const diasF = wf(ws, "días"), franjaF = wf(ws, "franja");
  const lit = DAYS.map((_, i) => f >= diasF + i * 4 && [0, 1, 2, 3, 4].includes(i));
  return (
    <Frame tag="AJUSTES · MI DISPONIBILIDAD" timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 980 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: Math.min(1, rowP * 2) * (1 - 0.35 * formP), transform: `translateY(${(1 - rowP) * 40}px)` }}>
          <Zoom z={2.15}><SettingsRow title="Mi disponibilidad" desc="Define cuándo puedes jugar para las recomendaciones de esta temporada." icon="clock" hl={hl} /></Zoom>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 260, opacity: Math.min(1, formP * 2), transform: `translateY(${(1 - formP) * 60}px) scale(${0.94 + 0.06 * formP})` }}>
          <Zoom z={2.15}>
            <Panel>
              <div style={{ fontSize: 19, fontWeight: 800 }}>Horario semanal habitual</div>
              <DayChips lit={lit} />
              <div style={{ display: "flex", gap: 10 }}>
                <TimeBox label="DESDE" value="19:00" on={f >= franjaF} />
                <TimeBox label="HASTA" value="21:00" on={f >= franjaF + 8} />
              </div>
            </Panel>
          </Zoom>
        </div>
      </div>
      {[0, 1, 2, 3, 4].map((i) => sfx("pop", diasF + i * 4, 0.2))}
    </Frame>
  );
};

/* 4 · Horarios recomendados: huecos comunes de los cuatro jugadores (datos ficticios) */
const Suggest: React.FC<{ date: string; time: string; at: number }> = ({ date, time, at }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return (
    <div style={{ opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 600}px)`, width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 12, fontWeight: 900, color: t.textMuted }}>{date}</div><div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{time}</div></div>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#34d399", background: "rgba(52,211,153,.14)", borderRadius: 999, padding: "5px 10px" }}>4/4</div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginTop: 6 }}>Todos disponibles</div>
    </div>
  );
};

const Recommend = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const horF = wf(ws, "horarios");
  const names = league.exampleQuartet;
  return (
    <Frame tag="HORARIOS RECOMENDADOS" example timedWords={ws}>
      <div style={{ display: "flex", gap: 22, marginBottom: 60 }}>
        {names.map((n, i) => {
          const q = pop(f, fps, 6 + i * 6, 12);
          return <div key={n} style={{ opacity: q, transform: `scale(${q})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><Zoom z={2.3}><Avatar size={44} /></Zoom><div style={{ fontSize: 30, fontWeight: 800 }}>{n}</div></div>;
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <Zoom z={2.1}><Suggest date="SÁBADO" time="19:00 – 21:00" at={Math.max(30, horF - 4)} /></Zoom>
        <Zoom z={2.1}><Suggest date="DOMINGO" time="10:00 – 12:00" at={Math.max(46, horF + 14)} /></Zoom>
      </div>
      <div style={{ height: 36 }} />
      {sfx("pop", Math.max(30, horF - 4), 0.4)}{sfx("pop", Math.max(46, horF + 14), 0.4)}
      <div style={{ opacity: 0 }}>{t.accent}</div>
    </Frame>
  );
};

/* 5 · Sin indicar nada: disponibilidad total */
const Default = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const totalF = wf(ws, "disponibilidad");
  const p = pop(f, fps, 4, 12);
  const on = f >= totalF;
  const badge = pop(f, fps, totalF + 2, 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.94 + 0.06 * p})` }}>
        <Zoom z={2.15}>
          <Panel>
            <div style={{ fontSize: 19, fontWeight: 800 }}>{on ? "Sin franjas: disponibilidad total" : "Horario semanal habitual"}</div>
            <DayChips lit={DAYS.map(() => on)} />
          </Panel>
        </Zoom>
      </div>
      <div style={{ marginTop: 60, opacity: badge, transform: `scale(${0.9 + 0.1 * badge})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 44px", fontSize: 44, fontWeight: 900 }}>Disponibilidad total</div>
      {sfx("pop", totalF, 0.4)}
    </Frame>
  );
};

/* 6 · Cierre */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8); const c = pop(f, fps, 4, 12);
  const nosF = wf(ws, "nos");
  const q = pop(f, fps, Math.max(60, nosF - 4), 10);
  return (
    <Frame timedWords={ws}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: c, transform: `scale(${0.9 + 0.1 * c})`, background: t.surface, border: `2px solid ${t.accent}`, borderRadius: 999, padding: "18px 40px" }}>
        <Ico name="clock" color={t.accent} size={52} /><span style={{ fontSize: 56, fontWeight: 900 }}>5 minutos</span>
      </div>
      <div style={{ height: 60 }} />
      <Img src={staticFile(league.logo)} style={{ width: 300, height: 300, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 24 }} />
      <div style={{ opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}><Words text={"Nos vemos\n*en la pista*"} size={112} delay={Math.max(60, nosF - 4)} stagger={3} /></div>
      <div style={{ marginTop: 40 }}><Ball size={70} /></div>
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Profile, Availability, Recommend, Default, Outro];
const KEYS = ["hook", "profile", "availability", "recommend", "default", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const PERFIL_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Perfil: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-06-david.mp3" />;
