// Vídeo 5: "Ha llegado el día, ¿cómo organizas tu próximo encuentro?" — horarios recomendados, chat, programar,
// calendario y recordatorios, pagos de la pista, resultado. Todo ficticio y con el aspecto de la app.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py).
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { PairPills, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { Panel, SettingsRow } from "./Perfil";
import { Icon } from "./Presentacion";
import { Bubble, ChatHeader, Glyph, InputBar, NAME_COLORS, Phone, Shell } from "./Chat";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice05";

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

const Slide: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return <div style={{ opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 120}px)` }}>{children}</div>;
};

const Row: React.FC<{ title: string; right?: React.ReactNode; hot?: boolean }> = ({ title, right, hot }) => {
  const t = useTheme();
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.mutedSurface, border: `1.5px solid ${hot ? t.accent : "transparent"}`, borderRadius: 12, padding: "12px 14px", fontSize: 16, fontWeight: 800 }}><span>{title}</span>{right}</div>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 14, 10);
  return (
    <Frame>
      <Words text={"Ha llegado el día,\n¿cómo *organizas*\ntu próximo *encuentro*?"} size={92} stagger={4} />
      <div style={{ marginTop: 70, transform: `scale(${p})`, width: 190, height: 190, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${t.accent}80` }}><Icon name="cal" color={t.accentContrast} size={110} /></div>
    </Frame>
  );
};

/* 2 · Horarios recomendados */
const Recommended = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const parF = wf(ws, "partido"), horF = wf(ws, "horarios"), cuaF = wf(ws, "cuatro");
  const a = pop(f, fps, Math.max(2, parF - 8), 12), h = pop(f, fps, horF, 12);
  const hot = f >= cuaF;
  const card = (day: string, time: string, at: number) => (
    <Slide at={at}><div style={{ background: t.surface, border: `1.5px solid ${hot ? "#34d399" : t.border}`, borderRadius: 14, padding: "10px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 12, fontWeight: 900, color: t.textMuted }}>{day}</div><div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{time}</div></div><div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#34d399", background: "rgba(52,211,153,.14)", borderRadius: 999, padding: "5px 10px" }}>4/4</div></div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginTop: 6 }}>Todos disponibles</div></div></Slide>
  );
  return (
    <Frame tag="TU PARTIDO" example timedWords={ws}>
      <Shell z={2.0}>
        <Panel>
          <div style={{ opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
            <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>Jornada 1</div>
            <PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} />
          </div>
          <div style={{ opacity: h, transform: `translateY(${(1 - h) * 30}px)`, fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted }}>HORARIOS RECOMENDADOS</div>
          {card("JUEVES", "19:30 – 21:30", horF + 20)}
          {card("SÁBADO", "10:00 – 12:00", horF + 38)}
        </Panel>
      </Shell>
      {sfx("pop", Math.max(2, parF - 8), 0.3)}{sfx("pop", horF + 20, 0.35)}{sfx("pop", horF + 38, 0.35)}{sfx("ding", cuaF, 0.4)}
    </Frame>
  );
};

/* 3 · Proponer hora y lugar en el chat de la jornada */
const ChatPropose = ({ league, ws }: Props) => {
  const q = league.exampleQuartet;
  const horF = wf(ws, "hora"), lugF = wf(ws, "lugar"), acuF = wf(ws, "acuerdo");
  return (
    <Frame tag="CHAT DE LA JORNADA" example timedWords={ws}>
      <Shell z={1.9} at={4}>
        <Phone header={<ChatHeader title="Jornada 1" />} bar={<InputBar />} h={380}>
          <Bubble name={q[0]} color={NAME_COLORS[0]} text="¿Jugamos el jueves a las 19:30?" time="10:47" at={horF - 6} />
          <Bubble name={q[2]} color={NAME_COLORS[1]} text="Me va bien. ¿En la pista de Pando?" time="10:48" at={lugF - 2} />
          <Bubble name={q[3]} color={NAME_COLORS[2]} text="Por mí, perfecto" time="10:48" at={lugF + 34} />
          <Bubble own text="Hecho: jueves 19:30 en Pando" time="10:49" at={acuF - 12} />
        </Phone>
      </Shell>
      {sfx("pop", horF - 6, 0.3)}{sfx("pop", lugF - 2, 0.3)}{sfx("pop", lugF + 34, 0.3)}{sfx("ding", acuF - 12, 0.4)}
    </Frame>
  );
};

/* 4 · Programar el partido: Añadir fecha, hora y lugar */
const Schedule = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const p = pop(f, fps, 2, 11);
  const tap = Math.max(10, wf(ws, "programa") - 6);
  const done = f >= tap + 16;
  const d = pop(f, fps, tap + 16, 11);
  return (
    <Frame tag="PROGRAMAR" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.94 + 0.06 * p})` }}>
        <Zoom z={2.05}>
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div>{done && <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 999, padding: "4px 10px", opacity: d }}>PROGRAMADO</div>}</div>
            <PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} />
            {!done ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "14px 0", fontSize: 16, fontWeight: 800, transform: `scale(${f >= tap ? 0.96 : 1})`, boxShadow: f >= tap ? `0 0 0 4px ${t.accent}33` : "none" }}><Icon name="cal" color={t.accent} size={22} />Añadir fecha, hora y lugar</div>
            ) : (
              <div style={{ opacity: d, transform: `translateY(${(1 - d) * 20}px)`, display: "flex", flexDirection: "column", gap: 8 }}>
                <Row title="Jueves 19:30" right={<Icon name="clock" color={t.accent} size={20} />} />
                <Row title="Pista de Pando" right={<Icon name="pin" color={t.accent} size={20} />} />
              </div>
            )}
          </Panel>
        </Zoom>
      </div>
      {sfx("pop", tap, 0.4)}{sfx("ding", tap + 16, 0.45)}
    </Frame>
  );
};

/* 5 · Añadir al calendario del móvil y activar recordatorios */
const CalendarReminders = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const addF = wf(ws, "añádelo"), calF = wf(ws, "calendario"), actF = wf(ws, "activa"), recF = wf(ws, "recordatorios"), ajF = wf(ws, "ajustes");
  const phase2 = f >= actF - 8;
  const a = pop(f, fps, Math.max(2, addF - 8), 12);
  const ev = pop(f, fps, calF + 10, 12);
  const s = pop(f, fps, actF - 6, 12);
  const on1 = f >= recF + 6, on2 = f >= recF + 20;
  const sw = (on: boolean) => <div style={{ width: 52, height: 30, borderRadius: 999, background: on ? t.accent : t.mutedSurface, border: `2px solid ${on ? t.accent : t.borderStrong}`, position: "relative" }}><div style={{ position: "absolute", top: 3, left: on ? 24 : 3, width: 20, height: 20, borderRadius: "50%", background: on ? t.accentContrast : t.textMuted }} /></div>;
  return (
    <Frame tag={phase2 ? "AJUSTES · NOTIFICACIONES" : "AÑADIR AL CALENDARIO"} timedWords={ws}>
      {!phase2 ? (
        <div style={{ opacity: Math.min(1, a * 2) * (1 - Math.max(0, Math.min(1, (f - (actF - 14)) / 8))), transform: `scale(${0.94 + 0.06 * a})` }}>
          <Zoom z={2.05}>
            <Panel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "14px 0", fontSize: 16, fontWeight: 800, boxShadow: f >= calF ? `0 0 0 4px ${t.accent}33` : "none" }}><Icon name="cal" color={t.accent} size={22} />Añadir al calendario</div>
              <div style={{ opacity: ev, transform: `translateY(${(1 - ev) * 30}px)`, background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: t.textMuted }}>JUEVES · 19:30</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>Smash &amp; Lob · Jornada 1</div>
                <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>Pista de Pando</div>
              </div>
            </Panel>
          </Zoom>
        </div>
      ) : (
        <div style={{ opacity: Math.min(1, s * 2), transform: `scale(${0.94 + 0.06 * s})` }}>
          <Zoom z={2.05}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SettingsRow title="Notificaciones" desc="Activa push y elige qué avisos quieres recibir en este dispositivo." icon="bell" hl={f >= ajF ? 1 : 0} />
              <Panel>
                <Row title="Partido" right={sw(on1)} hot={on1} />
                <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: -4 }}>Programación, mensajes y recordatorio del próximo partido.</div>
                <Row title="Reservas y pagos" right={sw(on2)} hot={on2} />
                <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: -4 }}>Cambios de reserva, pagos y recordatorios.</div>
              </Panel>
            </div>
          </Zoom>
        </div>
      )}
      {sfx("pop", addF, 0.3)}{sfx("ding", calF + 10, 0.4)}{sfx("pop", recF + 6, 0.35)}{sfx("pop", recF + 20, 0.35)}
    </Frame>
  );
};

/* 6 · Pagos de la pista: la app calcula las transferencias (cifras ficticias) */
const Payments = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const pagF = wf(ws, "pagó"), calcF = wf(ws, "calcula"), trF = wf(ws, "transferencias");
  const p = pop(f, fps, 4, 12);
  const rows = [[q[0], q[2]], [q[1], q[2]], [q[3], q[2]]];
  const settled = f >= trF + 6;
  const bad = (name: string) => <span style={{ fontWeight: 800 }}>{name}</span>;
  return (
    <Frame tag="PAGOS DE LA PISTA" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.94 + 0.06 * p})` }}>
        <Zoom z={2.0}>
          <Panel>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Pagos y reservas</div>
            <Slide at={pagF - 6}><Row title={`Pista pagada por: ${q[2]}`} right={<span style={{ color: t.accent, fontWeight: 900 }}>24,00 €</span>} /></Slide>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted, opacity: f >= calcF - 6 ? 1 : 0 }}>TRANSFERENCIAS</div>
            {rows.map(([from, to], i) => (
              <Slide key={from} at={calcF + i * 8}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.mutedSurface, borderRadius: 12, padding: "11px 14px", fontSize: 15 }}>
                <span>{bad(from)} <span style={{ color: t.textMuted }}>paga a</span> {bad(to)}</span><span style={{ fontWeight: 900, color: settled ? "#34d399" : t.accent }}>{settled ? "SALDADO" : "6,00 €"}</span></div></Slide>
            ))}
          </Panel>
        </Zoom>
      </div>
      <div style={{ marginTop: 60, opacity: settled ? 1 : 0, transform: `scale(${settled ? 1 : 0.85})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "18px 54px", fontSize: 46, fontWeight: 900, display: "flex", alignItems: "center", gap: 14 }}><Glyph name="check" color={t.accentContrast} size={48} />TODO SALDADO</div>
      {sfx("pop", pagF - 6, 0.3)}{rows.map((_, i) => sfx("pop", calcF + i * 8, 0.3))}{sfx("ding", trF + 6, 0.45)}
    </Frame>
  );
};

/* 7 · Lo importante: que el resultado quede registrado */
const Result = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const impF = wf(ws, "importante"), resF = wf(ws, "resultado"), regF = wf(ws, "registrado");
  const p = pop(f, fps, Math.max(2, impF - 4), 12);
  const done = f >= regF;
  const d = pop(f, fps, regF, 12);
  return (
    <Frame tag="RESULTADO" timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.9 + 0.1 * p})`, display: "flex", gap: 14 }}>
        {["6 – 4", "3 – 6", "7 – 5"].map((s, i) => { const k = pop(f, fps, resF + i * 6, 10); return <div key={s} style={{ opacity: k, transform: `scale(${0.8 + 0.2 * k})`, background: t.surface, border: `2px solid ${t.borderStrong}`, borderRadius: 24, padding: "26px 30px", fontSize: 60, fontWeight: 900 }}>{s}</div>; })}
      </div>
      <div style={{ marginTop: 70, opacity: d, transform: `scale(${0.85 + 0.15 * d})`, background: done ? "#34d399" : t.accent, color: "#0b0c0e", borderRadius: 999, padding: "20px 56px", fontSize: 50, fontWeight: 900, display: "flex", alignItems: "center", gap: 16 }}><Glyph name="check" color="#0b0c0e" size={54} />RESULTADO REGISTRADO</div>
      {sfx("pop", resF, 0.3)}{sfx("ding", regF, 0.5)}
    </Frame>
  );
};

/* 8 · La aplicación se encargará de todo */
const AllApp = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const todoF = wf(ws, "todo");
  const items = ["Horarios recomendados", "Calendario y recordatorios", "Pagos de la pista", "Ranking y estadísticas"];
  const p = pop(f, fps, 4, 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ transform: `scale(${p})`, width: 180, height: 180, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${t.accent}80`, marginBottom: 46 }}><Glyph name="check" color={t.accentContrast} size={110} /></div>
      <Words text={"La *aplicación*\nse encarga de *todo*"} size={92} delay={4} stagger={4} />
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it, i) => { const k = pop(f, fps, 14 + i * 9, 10); return <div key={it} style={{ opacity: k, transform: `translateX(${(1 - k) * 80}px)`, display: "flex", alignItems: "center", gap: 14, fontSize: 36, fontWeight: 800, color: t.textMuted }}><Glyph name="check" color={t.accent} size={36} />{it}</div>; })}
      </div>
      {sfx("ding", todoF - 4, 0.45)}
    </Frame>
  );
};

/* 9 · Cierre con empaque */
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
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 40px", fontSize: 40, fontWeight: 900, letterSpacing: 2 }}><Icon name="cal" color={t.accent} size={44} />ORGANIZA TU PARTIDO</div>
      <div style={{ height: 50 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 300 + burst * 500, height: 300 + burst * 500, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile(league.logo)} style={{ width: 280, height: 280, objectFit: "contain", filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03 + 0.12 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ height: 30 }} />
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", width: 900 }}>
        {words.map((w, i) => { const k = pop(f, fps, Math.max(0, marks[i] - 3), 9); return <div key={w} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})`, fontSize: 116, fontWeight: 900, lineHeight: 1.1, color: i >= 2 ? t.accent : t.text, textShadow: i === 3 ? `0 0 ${40 * (1 - burst)}px ${t.accent}` : "none" }}>{w}</div>; })}
      </div>
      <div style={{ marginTop: 30 }}><Ball size={70} /></div>
      {sfx("pop", Math.max(2, recF - 2), 0.45)}{marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.5))}{sfx("ding", marks[3], 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Recommended, ChatPropose, Schedule, CalendarReminders, Payments, Result, AllApp, Outro];
const KEYS = ["hook", "recommended", "chat", "schedule", "calendar", "payments", "result", "allapp", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const ORGANIZA_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Organiza: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-05-david.mp3" />;
