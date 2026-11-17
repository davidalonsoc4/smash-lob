// Vídeo 4: el chat de la liga — chat principal, notificaciones, chats de jornada (proponer fechas y lugares), problemas.
// Réplicas del chat de la app (vista de jugador: sin adjuntos ni fotos/vídeos). Conversaciones y datos ficticios.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py).
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { SettingsRow } from "./Perfil";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice04";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};
const wfLast = (ws: TimedWord[], text: string) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[m.length - 1] ?? { f: 0 }).f;
};

/* ---------- Réplicas del chat ---------- */
const Glyph: React.FC<{ name: "back" | "dots" | "speaker" | "send" | "person" | "refresh" | "group" | "check"; color: string; size?: number }> = ({ name, color, size = 22 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {name === "back" && <path d="M19 12H5M11 6l-6 6 6 6" />}
      {name === "dots" && (<><circle cx={12} cy={5} r={1.3} fill={color} /><circle cx={12} cy={12} r={1.3} fill={color} /><circle cx={12} cy={19} r={1.3} fill={color} /></>)}
      {name === "speaker" && (<><path d="M4 10v4h4l5 4V6L8 10z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /></>)}
      {name === "send" && (<><circle cx={14} cy={12} r={6} /><path d="M10 10c2 .5 4 2.5 4.5 4.5M3 9h4M2 12h4M3 15h4" /></>)}
      {name === "person" && (<><circle cx={12} cy={8} r={3.5} fill={color} /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" fill={color} /></>)}
      {name === "refresh" && (<><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v5h-5" /></>)}
      {name === "group" && (<><circle cx={9} cy={9} r={3} /><circle cx={16.5} cy={10} r={2.5} /><path d="M3 19c.8-3.5 3-5 6-5s5.2 1.5 6 5M15 15c3 0 4.8 1.2 6 4" /></>)}
      {name === "check" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
};

const ChatHeader: React.FC<{ title: string; sub?: string; logo?: string }> = ({ title, sub, logo }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10, background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "12px 12px" }}>
      <Glyph name="back" color={t.textMuted} size={22} />
      {logo && <Img src={staticFile(logo)} style={{ width: 44, height: 44, objectFit: "contain" }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${t.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Glyph name="dots" color={t.text} size={18} /></div>
    </div>
  );
};

const NAME_COLORS = ["#a78bfa", "#fbbf24", "#60a5fa", "#34d399", "#f472b6"];
const Bubble: React.FC<{ name?: string; color?: string; text: string; time: string; own?: boolean; at: number }> = ({ name, color, text, time, own, at }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 11);
  return (
    <div style={{ display: "flex", justifyContent: own ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 30}px) scale(${0.96 + 0.04 * p})` }}>
      {!own && <div style={{ width: 30, height: 30, borderRadius: "50%", background: t.mutedSurface, border: `1px solid ${t.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Glyph name="person" color={t.textMuted} size={17} /></div>}
      <div style={{ maxWidth: 290, boxSizing: "border-box", borderRadius: 16, padding: "8px 12px 6px", background: own ? t.accent : t.raised, border: own ? "none" : `1px solid ${t.border}`, color: own ? t.accentContrast : t.text }}>
        {!own && name && <div style={{ fontSize: 12.5, fontWeight: 900, color: color ?? NAME_COLORS[0] }}>{name}</div>}
        <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.3 }}>{text}</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, textAlign: "right", marginTop: 2, opacity: 0.75 }}>{time}{own ? "  ✓" : ""}</div>
      </div>
    </div>
  );
};

const DateChip: React.FC<{ label: string }> = ({ label }) => {
  const t = useTheme();
  return <div style={{ alignSelf: "center", background: t.mutedSurface, borderRadius: 999, padding: "4px 14px", fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>{label}</div>;
};

const Novedad: React.FC<{ text: string; time: string; at: number; video?: { thumb: string; dur: string } }> = ({ text, time, at, video }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return (
    <div style={{ boxSizing: "border-box", borderRadius: 16, border: "2px solid #f59e0b", background: "#3a1f10", padding: "10px 12px 12px", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px) scale(${0.96 + 0.04 * p})` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fbbf24", fontSize: 12.5, fontWeight: 900, letterSpacing: 2 }}><Glyph name="speaker" color="#fbbf24" size={18} />NOVEDAD</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#d6c3a5" }}>{time}</div>
      </div>
      <div style={{ fontSize: 12.5, color: "#d6c3a5", margin: "4px 0 6px" }}>David</div>
      {video && (
        <div style={{ position: "relative", width: 120, margin: "0 auto 8px", borderRadius: 14, overflow: "hidden" }}>
          <Img src={staticFile(video.thumb)} style={{ width: 120, height: 213, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width={18} height={18} viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#fff" /></svg></div>
          <div style={{ position: "absolute", left: 8, bottom: 8, fontSize: 11, fontWeight: 800, background: "rgba(0,0,0,.55)", borderRadius: 8, padding: "2px 7px" }}>{video.dur}</div>
        </div>
      )}
      <div style={{ fontSize: 17, fontWeight: 600, color: "#fef3c7" }}>{text}</div>
    </div>
  );
};

/* barra de escribir de JUGADOR: campo de texto + enviar (sin adjuntos, sin fotos ni vídeos) */
const InputBar: React.FC<{ typed?: string; ready?: boolean }> = ({ typed = "", ready = false }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 8, background: t.surface, borderTop: `1px solid ${t.border}`, padding: "10px 12px" }}>
      <div style={{ flex: 1, background: t.mutedSurface, border: `1px solid ${t.borderStrong}`, borderRadius: 14, padding: "10px 12px", fontSize: 14.5, color: typed ? t.text : t.textSubtle, minHeight: 20 }}>{typed || "Escribe un mensaje…"}</div>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: ready ? t.accent : t.mutedSurface, border: `1px solid ${ready ? t.accent : t.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Glyph name="send" color={ready ? t.accentContrast : t.textMuted} size={24} /></div>
    </div>
  );
};

/* Ventana de chat: los mensajes se apilan abajo y los antiguos se salen por arriba */
const ChatWindow: React.FC<{ h: number; children: React.ReactNode }> = ({ h, children }) => {
  const t = useTheme();
  return <div style={{ width: NATIVE_W, height: h, boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10, padding: "10px 12px", background: t.bg, WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 16%)", maskImage: "linear-gradient(to bottom, transparent 0, #000 16%)" }}>{children}</div>;
};

const Phone: React.FC<{ header: React.ReactNode; bar: React.ReactNode; h: number; children: React.ReactNode }> = ({ header, bar, h, children }) => {
  const t = useTheme();
  return <div style={{ width: NATIVE_W, borderRadius: 18, overflow: "hidden", border: `1px solid ${t.border}`, background: t.bg }}>{header}<ChatWindow h={h}>{children}</ChatWindow>{bar}</div>;
};

const Shell: React.FC<{ at?: number; z?: number; children: React.ReactNode }> = ({ at = 2, z = 2.1, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 13);
  return <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.94 + 0.06 * p})` }}><Zoom z={z}>{children}</Zoom></div>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = ({ league }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  return (
    <Frame>
      <Words text={"¿Ya has entrado\nen el *chat*\nde la liga?"} size={104} stagger={4} />
      <div style={{ marginTop: 70, opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}><Zoom z={2.1}><ChatHeader title={league.name} sub={`${league.season} · 8 participantes`} logo={league.logo} /></Zoom></div>
    </Frame>
  );
};

/* 2 · Va a ser el chat principal: comunicaciones, avisos, novedades y vídeos */
const Main = ({ league, ws }: Props) => {
  const prinF = wf(ws, "principal"), avF = wf(ws, "avisos"), vidF = wf(ws, "vídeos");
  return (
    <Frame tag="CHAT DE LA LIGA" example timedWords={ws}>
      <Shell z={1.9}>
        <Phone header={<ChatHeader title={league.name} sub={`${league.season} · 8 participantes`} logo={league.logo} />} bar={<InputBar />} h={400}>
          <DateChip label="HOY" />
          <Bubble name="Alain" color={NAME_COLORS[0]} text="Buenas a todos, ya estoy en el chat" time="10:47" at={prinF - 6} />
          <Novedad text="Aviso importante de la liga" time="13:26" at={avF - 4} />
          <Novedad text="Nuevo vídeo de la serie" time="13:54" at={vidF - 4} video={{ thumb: "thumb-presentacion.jpg", dur: "0:46" }} />
        </Phone>
      </Shell>
      {sfx("pop", prinF - 6, 0.35)}{sfx("ding", avF - 4, 0.4)}{sfx("ding", vidF - 4, 0.4)}
    </Frame>
  );
};

/* 3 · Notificaciones activadas y aplicación actualizada */
const Notify = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const actF = wf(ws, "notificaciones"), mantF = wf(ws, "mantén"), actuF = wf(ws, "actualizada");
  const row = pop(f, fps, Math.max(4, actF - 20), 12);
  const hl = Math.min(1, Math.max(0, (f - (actF - 4)) / 6));
  const on = f >= actF + 14;
  const ban = pop(f, fps, actF + 24, 12);
  const upd = pop(f, fps, mantF, 12);
  const done = f >= actuF + 6;
  return (
    <Frame tag="AJUSTES · NOTIFICACIONES" timedWords={ws}>
      <div style={{ opacity: Math.min(1, row * 2), transform: `translateY(${(1 - row) * 40}px)` }}><Zoom z={2.1}><SettingsRow title="Notificaciones" desc="Activa push y elige qué avisos quieres recibir en este dispositivo." icon="bell" hl={hl} /></Zoom></div>
      <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 20, opacity: row }}>
        <div style={{ fontSize: 44, fontWeight: 800 }}>Notificaciones</div>
        <div style={{ width: 130, height: 70, borderRadius: 999, background: on ? t.accent : t.mutedSurface, border: `2px solid ${on ? t.accent : t.borderStrong}`, position: "relative" }}><div style={{ position: "absolute", top: 7, left: on ? 66 : 7, width: 52, height: 52, borderRadius: "50%", background: on ? t.accentContrast : t.textMuted }} /></div>
      </div>
      <div style={{ marginTop: 40, opacity: Math.min(1, ban * 2), transform: `translateY(${(1 - ban) * -80}px)` }}>
        <Zoom z={2.1}>
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.raised, border: `1px solid ${t.borderStrong}`, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
            <Img src={staticFile("logo.png")} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: t.mutedSurface }} />
            <div><div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, color: t.textSubtle }}>SMASH &amp; LOB · AHORA</div><div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>Novedad en el chat de la liga</div><div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 2 }}>Entra para verla.</div></div>
          </div>
        </Zoom>
      </div>
      <div style={{ marginTop: 40, opacity: upd, transform: `scale(${0.9 + 0.1 * upd})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${done ? "#34d399" : t.accent}`, background: t.surface, color: done ? "#34d399" : t.accent, borderRadius: 999, padding: "14px 40px", fontSize: 40, fontWeight: 900 }}>
        <div style={{ transform: `rotate(${done ? 0 : f * 14}deg)`, display: "flex" }}><Glyph name={done ? "check" : "refresh"} color={done ? "#34d399" : t.accent} size={46} /></div>{done ? "APP ACTUALIZADA" : "ACTUALIZANDO…"}
      </div>
      {sfx("pop", actF + 14, 0.4)}{sfx("ding", actF + 24, 0.4)}{sfx("pop", actuF + 6, 0.4)}
    </Frame>
  );
};

/* 4 · Chat de cada jornada: proponer fechas y lugares */
const Round = ({ league, ws }: Props) => {
  const q = league.exampleQuartet;
  const propF = wf(ws, "proponer"), fechF = wf(ws, "fechas"), lugF = wf(ws, "lugares"), partF = wf(ws, "partido");
  const typed = ((f: number) => (f >= lugF + 12 && f < lugF + 40 ? "Perfecto, ahí estaré" : ""))(useCurrentFrame());
  return (
    <Frame tag="CHAT DE LA JORNADA" example timedWords={ws}>
      <Shell z={1.9} at={4}>
        <Phone header={<ChatHeader title="Jornada 1" />} bar={<InputBar typed={typed} ready={!!typed} />} h={370}>
          <Bubble name={q[0]} color={NAME_COLORS[0]} text="¿Quedamos el jueves a las 19:30?" time="10:47" at={propF - 8} />
          <Bubble name={q[2]} color={NAME_COLORS[1]} text="Mejor a las 20:00, que salgo tarde del trabajo" time="10:48" at={fechF + 2} />
          <Bubble name={q[3]} color={NAME_COLORS[2]} text="Os propongo la pista de Pando" time="10:48" at={lugF - 4} />
          <Bubble own text="Perfecto, ahí estaré" time="10:49" at={partF - 6} />
        </Phone>
      </Shell>
      {sfx("pop", propF - 8, 0.3)}{sfx("pop", fechF + 2, 0.3)}{sfx("pop", lugF - 4, 0.3)}{sfx("pop", partF - 6, 0.3)}
    </Frame>
  );
};

/* 5 · Sin grupos externos nuevos cada semana */
const NoGroups = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const wsF = wf(ws, "whatsapp"), weekF = wf(ws, "semana");
  const p = pop(f, fps, 4, 12);
  const strike = Math.min(1, Math.max(0, (f - (wsF + 6)) / 14));
  const done = pop(f, fps, weekF, 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ display: "flex", gap: 24, opacity: p, transform: `scale(${0.9 + 0.1 * p})` }}>
        {["Sem. 1", "Sem. 2", "Sem. 3"].map((w, i) => (
          <div key={w} style={{ position: "relative", width: 250, background: t.surface, border: `2px solid ${t.borderStrong}`, borderRadius: 28, padding: "26px 0", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Glyph name="group" color={t.textMuted} size={84} /></div>
            <div style={{ fontSize: 30, fontWeight: 800, color: t.textMuted, marginTop: 10 }}>Grupo nuevo</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: t.textSubtle }}>{w}</div>
            <div style={{ position: "absolute", left: "-6%", top: "50%", width: `${112 * strike}%`, height: 10, background: "#ef4444", borderRadius: 6, transform: "rotate(-14deg)", transformOrigin: "left center" }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 70, opacity: done, transform: `scale(${0.85 + 0.15 * done})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 56px", fontSize: 50, fontWeight: 900, display: "flex", alignItems: "center", gap: 16 }}><Glyph name="check" color={t.accentContrast} size={52} />TODO EN UN SOLO CHAT</div>
      {sfx("pop", wsF + 6, 0.35)}{sfx("ding", weekF, 0.45)}
    </Frame>
  );
};

/* 6 · Cualquier problema: cuéntalo aquí */
const Problem = ({ league, ws }: Props) => {
  const q = league.exampleQuartet;
  const cueF = wf(ws, "cuéntalo");
  return (
    <Frame tag="CHAT DE LA LIGA" example timedWords={ws}>
      <Shell z={1.9} at={2}>
        <Phone header={<ChatHeader title={league.name} sub={`${league.season} · 8 participantes`} logo={league.logo} />} bar={<InputBar />} h={330}>
          <Bubble name={q[3]} color={NAME_COLORS[2]} text="Tengo un problema al subir un resultado" time="11:02" at={Math.max(6, cueF - 30)} />
          <Bubble name="David" color={NAME_COLORS[1]} text="Gracias por avisar, lo miramos ahora mismo" time="11:03" at={cueF + 6} />
        </Phone>
      </Shell>
      {sfx("pop", Math.max(6, cueF - 30), 0.3)}{sfx("ding", cueF + 6, 0.4)}
    </Frame>
  );
};

/* 7 · Cierre: "Recuerda, ¡Nos vemos en la pista!" con empaque */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const recF = wf(ws, "recuerda");
  const chip = pop(f, fps, Math.max(2, recF - 2), 11);
  const marks = [wf(ws, "nos"), wf(ws, "vemos"), wfLast(ws, "en"), wf(ws, "pista")];
  const words = ["Nos", "vemos", "en la", "pista"];
  const burst = interpolate(f, [marks[3], marks[3] + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 40px", fontSize: 40, fontWeight: 900, letterSpacing: 2 }}><Glyph name="speaker" color={t.accent} size={44} />CHAT PRINCIPAL DE LA LIGA</div>
      <div style={{ height: 50 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 300 + burst * 500, height: 300 + burst * 500, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile(league.logo)} style={{ width: 280, height: 280, objectFit: "contain", filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03 + 0.12 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ height: 30 }} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", width: 900 }}>
        {words.map((w, i) => {
          const k = pop(f, fps, Math.max(0, marks[i] - 3), 9);
          return <div key={w} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})`, fontSize: 116, fontWeight: 900, lineHeight: 1.1, color: i >= 2 ? t.accent : t.text, textShadow: i === 3 ? `0 0 ${40 * (1 - burst)}px ${t.accent}` : "none" }}>{w}</div>;
        })}
      </div>
      <div style={{ marginTop: 30 }}><Ball size={70} /></div>
      {sfx("pop", Math.max(2, recF - 2), 0.45)}{marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.5))}{sfx("ding", marks[3], 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Main, Notify, Round, NoGroups, Problem, Outro];
const KEYS = ["hook", "main", "notify", "round", "nogroups", "problem", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const CHAT_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const ChatLiga: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-04-david.mp3" />;
