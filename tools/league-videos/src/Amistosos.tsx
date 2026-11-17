// Vídeo: "¿Sabías que también puedes registrar tus partidos normales en la app?" (amistosos).
// Crear encuentro, resultado ahora o después, historial, no cuenta para la liga, estadísticas de Mi perfil y chat.
// Réplicas con datos ficticios. Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py).
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { Panel } from "./Perfil";
import { Icon } from "./Presentacion";
import { Bubble, ChatHeader, Glyph, InputBar, NAME_COLORS, Phone, Shell } from "./Chat";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice13b";

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
  return <div style={{ opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 110}px)` }}>{children}</div>;
};
const Row: React.FC<{ left: React.ReactNode; right?: React.ReactNode; hot?: boolean }> = ({ left, right, hot }) => {
  const t = useTheme();
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: t.mutedSurface, border: `1.5px solid ${hot ? t.accent : "transparent"}`, borderRadius: 12, padding: "11px 14px", fontSize: 15.5, fontWeight: 800 }}><div>{left}</div>{right}</div>;
};
const Tag: React.FC<{ label: string; gold?: boolean }> = ({ label, gold }) => {
  const t = useTheme();
  return <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, borderRadius: 999, padding: "3px 9px", color: gold ? t.accentContrast : t.textMuted, background: gold ? t.accent : t.surface, border: `1px solid ${gold ? t.accent : t.borderStrong}` }}>{label}</span>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 18, 10);
  return (
    <Frame>
      <Words text={"¿Sabías que también\npuedes registrar tus\n*partidos normales*\nen la app?"} size={86} stagger={3} />
      <div style={{ marginTop: 60, transform: `scale(${p})`, width: 170, height: 170, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${t.accent}80` }}><Icon name="check" color={t.accentContrast} size={100} /></div>
    </Frame>
  );
};

/* 2 · Crear nuevo encuentro: jugadores conocidos o un nombre escrito a mano */
const Create = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const amF = wf(ws, "amistosos"), crF = wf(ws, "crear"), elF = wf(ws, "elige"), escF = wf(ws, "escribe"), nomF = wf(ws, "nombre");
  const a = pop(f, fps, 4, 12);
  const form = f >= crF + 14;
  const fo = pop(f, fps, crF + 14, 12);
  const tag = pop(f, fps, amF, 11);
  const typed = "Carlos".slice(0, Math.max(0, Math.min(6, Math.floor((f - (escF + 6)) / 3))));
  const names = [q[0], q[1], q[2]];
  return (
    <Frame tag="MIS PARTIDOS" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, a * 2), transform: `scale(${0.94 + 0.06 * a})` }}>
        <Zoom z={2.0}>
          {!form ? (
            <Panel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Mis partidos</div><div style={{ opacity: tag, transform: `scale(${0.8 + 0.2 * tag})` }}><Tag label="AMISTOSO" gold /></div></div>
              <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "15px 0", textAlign: "center", fontSize: 17, fontWeight: 900, transform: `scale(${f >= crF ? 0.96 : 1})`, boxShadow: f >= crF ? `0 0 0 4px ${t.accent}44` : "none" }}>Crear nuevo encuentro</div>
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted }}>PRÓXIMOS PARTIDOS</div>
            </Panel>
          ) : (
            <div style={{ opacity: Math.min(1, fo * 2), transform: `translateY(${(1 - fo) * 40}px)` }}>
              <Panel>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Crear encuentro</div><Tag label="AMISTOSO" gold /></div>
                <Row left="Fecha y hora" right={<span style={{ color: t.textMuted }}>Jueves 19:30</span>} />
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted }}>JUGADORES</div>
                {names.map((n, i) => <Slide key={n} at={elF + i * 8}><Row left={n} right={<Tag label="JUGADOR CONOCIDO" />} /></Slide>)}
                <Slide at={escF}><Row hot={f >= escF + 4} left={<span>{typed || "Escribe un nombre…"}{f >= escF + 4 && f < nomF + 30 ? <span style={{ color: t.accent }}>|</span> : null}</span>} right={<Tag label="OTRO JUGADOR" />} /></Slide>
              </Panel>
            </div>
          )}
        </Zoom>
      </div>
      {sfx("pop", amF, 0.3)}{sfx("pop", crF, 0.4)}{names.map((_, i) => sfx("pop", elF + i * 8, 0.25))}{sfx("pop", escF, 0.3)}
    </Frame>
  );
};

/* 3 · Guardar el resultado: ahora o más tarde */
const SaveResult = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const guF = wf(ws, "guarda"), ahF = wf(ws, "ahora"), taF = wf(ws, "tarde");
  const a = pop(f, fps, 2, 12);
  const b1 = pop(f, fps, ahF, 11), b2 = pop(f, fps, taF - 10, 11);
  return (
    <Frame tag="RESULTADO" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, a * 2), transform: `scale(${0.94 + 0.06 * a})` }}>
        <Zoom z={2.0}>
          <Panel>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Resultado <span style={{ color: t.textMuted, fontSize: 14 }}>· opcional</span></div>
            <div style={{ display: "flex", gap: 8 }}>{["6 – 4", "3 – 6", "7 – 5"].map((s, i) => { const k = pop(f, fps, guF + 6 + i * 8, 10); return <div key={s} style={{ flex: 1, textAlign: "center", opacity: k, background: t.mutedSurface, borderRadius: 12, padding: "13px 0", fontSize: 22, fontWeight: 900 }}>{s}</div>; })}</div>
            <div style={{ opacity: b1, transform: `translateY(${(1 - b1) * 30}px)`, background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "14px 0", textAlign: "center", fontSize: 16, fontWeight: 900 }}>Guardar encuentro y resultado</div>
            <div style={{ opacity: b2, transform: `translateY(${(1 - b2) * 30}px)`, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "13px 0", textAlign: "center", fontSize: 16, fontWeight: 800 }}>O añádelo más tarde desde el partido</div>
          </Panel>
        </Zoom>
      </div>
      {sfx("pop", guF + 6, 0.3)}{sfx("ding", ahF, 0.4)}{sfx("pop", taF - 10, 0.35)}
    </Frame>
  );
};

/* 4 · Cada participante lo ve en su historial */
const History = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const caF = wf(ws, "cada"), hiF = wf(ws, "historial");
  const a = pop(f, fps, 2, 12);
  const av = pop(f, fps, caF + 6, 12);
  return (
    <Frame tag="MIS PARTIDOS" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, a * 2), transform: `scale(${0.94 + 0.06 * a})` }}>
        <Zoom z={2.0}>
          <Panel>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Historial</div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted }}>MÁS RECIENTES PRIMERO</div>
            <Row hot left={<div><div style={{ marginBottom: 4 }}><Tag label="AMISTOSO" gold /></div>{q[0]} y {q[1]} vs {q[2]} y Carlos</div>} right={<span style={{ color: t.accent, fontSize: 14 }}>6–4 3–6 7–5</span>} />
            <Row left={<div><div style={{ marginBottom: 4 }}><Tag label="LIGA" /></div>Jornada 1</div>} right={<span style={{ color: t.textMuted, fontSize: 14 }}>Próxima</span>} />
          </Panel>
        </Zoom>
      </div>
      <div style={{ marginTop: 60, display: "flex", gap: 22, opacity: av, transform: `scale(${0.9 + 0.1 * av})` }}>
        {[q[0], q[1], q[2], "Carlos"].map((n) => <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><div style={{ width: 90, height: 90, borderRadius: "50%", background: t.mutedSurface, border: `2px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}><Glyph name="person" color={t.textMuted} size={50} /></div><div style={{ fontSize: 28, fontWeight: 800 }}>{n}</div></div>)}
      </div>
      {sfx("pop", caF + 6, 0.35)}{sfx("ding", hiF, 0.35)}
    </Frame>
  );
};

/* 5 · No cuentan para la clasificación de la liga */
const NoCount = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const cuF = wf(ws, "cuentan"), clF = wf(ws, "clasificación");
  const a = pop(f, fps, 2, 12);
  const k = pop(f, fps, cuF, 11);
  const strike = Math.min(1, Math.max(0, (f - clF) / 12));
  return (
    <Frame tag="NO AFECTA A LA LIGA" timedWords={ws}>
      <div style={{ opacity: Math.min(1, a * 2), transform: `scale(${0.94 + 0.06 * a})` }}>
        <Zoom z={2.0}>
          <div style={{ boxSizing: "border-box", width: 412, background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 16, padding: "14px 14px", fontSize: 14.5, lineHeight: 1.4, color: t.textMuted }}>Este encuentro no pertenece a ninguna competición y no afecta a clasificación, estadísticas oficiales, récords ni MVP de tus ligas.</div>
        </Zoom>
      </div>
      <div style={{ marginTop: 60, position: "relative", opacity: k, transform: `scale(${0.85 + 0.15 * k})`, display: "flex", alignItems: "center", gap: 16, background: t.surface, border: `2px solid ${t.borderStrong}`, borderRadius: 999, padding: "18px 46px", fontSize: 46, fontWeight: 900 }}>
        <Icon name="trophy" color={t.accent} size={50} />CLASIFICACIÓN DE LA LIGA
        <div style={{ position: "absolute", left: 24, top: "50%", width: `${(100 - 6) * strike}%`, height: 8, background: "#ef4444", borderRadius: 6, transform: "rotate(-3deg)" }} />
      </div>
      {sfx("pop", cuF, 0.35)}{sfx("pop", clF, 0.35)}
    </Frame>
  );
};

/* 6 · Sí cuentan para tus estadísticas de Mi perfil */
const Stats = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const esF = wf(ws, "estadísticas"), parF = wf(ws, "pareja"), rivF = wf(ws, "rival"), difF = wf(ws, "diferencia"), jueF = wf(ws, "juegos");
  const a = pop(f, fps, 2, 12);
  const chip = (label: string, on: boolean) => <div style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "8px 0", fontSize: 12.5, fontWeight: 900, background: on ? t.accent : t.mutedSurface, color: on ? t.accentContrast : t.textMuted, border: `1px solid ${on ? t.accent : t.border}` }}>{label}</div>;
  const card = (title: string, value: string, sub: string, at: number) => <Slide at={at}><div style={{ background: t.mutedSurface, borderRadius: 12, padding: "11px 14px" }}><div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>{title}</div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div><div style={{ fontSize: 13, color: t.textMuted }}>{sub}</div></div></div></Slide>;
  return (
    <Frame tag="MI PERFIL" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, a * 2), transform: `scale(${0.94 + 0.06 * a})` }}>
        <Zoom z={1.95}>
          <Panel>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Estadísticas de juego</div>
            <div style={{ display: "flex", gap: 6 }}>{chip("Todos", f < esF + 30)}{chip("Liga", false)}{chip("Amistosos", f >= esF + 30)}</div>
            {card("MEJOR PAREJA", `${q[0]} y ${q[1]}`, "4 de 5 victorias", parF - 6)}
            {card("NÉMESIS", q[3], "1 victoria de 4", rivF - 6)}
            {card("DIF. JUEGOS", "+12", "media por partido", difF - 4)}
            {card("DIF. SETS", "+4", "en total", jueF)}
          </Panel>
        </Zoom>
      </div>
      {sfx("pop", parF - 6, 0.3)}{sfx("pop", rivF - 6, 0.3)}{sfx("pop", difF - 4, 0.3)}{sfx("pop", jueF, 0.3)}
    </Frame>
  );
};

/* 7 · Cada partido tiene su propio chat */
const ChatScene = ({ league, ws }: Props) => {
  const q = league.exampleQuartet;
  const chF = wf(ws, "chat"), orF = wf(ws, "organizarlo");
  return (
    <Frame tag="CHAT DEL AMISTOSO" example timedWords={ws}>
      <Shell z={1.9} at={2}>
        <Phone header={<ChatHeader title="Amistoso" />} bar={<InputBar />} h={330}>
          <Bubble name={q[0]} color={NAME_COLORS[0]} text="¿Echamos un partido el jueves?" time="18:02" at={Math.max(8, chF - 30)} />
          <Bubble name={q[2]} color={NAME_COLORS[1]} text="Me apunto, a las 19:30" time="18:03" at={Math.max(14, chF - 8)} />
          <Bubble own text="Perfecto, ahí estaré" time="18:04" at={orF - 4} />
        </Phone>
      </Shell>
      {sfx("pop", Math.max(8, chF - 30), 0.3)}{sfx("pop", Math.max(14, chF - 8), 0.3)}{sfx("pop", orF - 4, 0.3)}
    </Frame>
  );
};

/* 8 · Cierre con empaque */
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
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 40px", fontSize: 40, fontWeight: 900, letterSpacing: 2 }}><Icon name="check" color={t.accent} size={44} />REGISTRA TUS PARTIDOS</div>
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

const COMPS: React.FC<Props>[] = [Hook, Create, SaveResult, History, NoCount, Stats, ChatScene, Outro];
const KEYS = ["hook", "create", "result", "history", "nocount", "stats", "chat", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const AMISTOSOS_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Amistosos: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-13b-david.mp3" />;
