// Vídeo 12: qué pasa hasta el 20 de diciembre — cuenta atrás, aviso de la jornada de apertura (7 días antes),
// desbloqueo automático y jornadas que se van desvelando. Todo ficticio; no se muestran emparejamientos reales.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py).
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { CountdownCard, NATIVE_W, PairPills, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { Panel } from "./Perfil";
import { INSIDE, Icon, NavBar } from "./Presentacion";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice12";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wfLast = (ws: TimedWord[], text: string) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[m.length - 1] ?? { f: 0 }).f;
};
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

const Shell: React.FC<{ at?: number; z?: number; children: React.ReactNode }> = ({ at = 2, z = 2.15, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 13);
  return <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}><Zoom z={z}>{children}</Zoom></div>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  return (
    <Frame>
      <Words text={"¿Qué pasa hasta\nel *20* de *diciembre*?"} size={96} stagger={4} />
      <div style={{ marginTop: 80, transform: `scale(${p})`, width: 260, background: t.accent, color: t.accentContrast, borderRadius: 36, overflow: "hidden", textAlign: "center" }}>
        <div style={{ background: "rgba(0,0,0,.25)", padding: "10px 0", fontSize: 34, fontWeight: 900, letterSpacing: 6 }}>DIC</div>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.1 }}>20</div>
      </div>
    </Frame>
  );
};

/* 2 · Ahora: cuenta atrás en Inicio */
const Countdown = ({ ws }: Props) => {
  const f = useCurrentFrame();
  const sec = 59 - Math.floor(f / 30) % 60;
  return (
    <Frame tag="INICIO" timedWords={ws}>
      <Shell z={1.85}><CountdownCard days={30} hours={12} minutes={45} seconds={sec < 0 ? 0 : sec} dateLabel="Domingo · 20 de diciembre" note="Los controles de esta liga se activarán al comenzar." /></Shell>
      {sfx("pop", 4, 0.3)}
    </Frame>
  );
};

/* 3 · Una semana antes: ¡NOVEDADES! Jornada de apertura (día, hora y lugar) */
const OpeningNews = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const wkF = wf(ws, "semana");
  const badge = pop(f, fps, wkF, 12);
  const items: { at: number; icon: string; label: string }[] = [
    { at: wf(ws, "día") - 6, icon: "cal", label: "Día" },
    { at: wf(ws, "hora") - 6, icon: "clock", label: "Hora" },
    { at: wf(ws, "lugar") - 8, icon: "pin", label: "Lugar" },
  ];
  return (
    <Frame tag="UNA SEMANA ANTES" timedWords={ws}>
      <div style={{ opacity: badge, transform: `scale(${0.85 + 0.15 * badge})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "14px 44px", fontSize: 44, fontWeight: 900, letterSpacing: 3, marginBottom: 50 }}>7 DÍAS ANTES</div>
      <Shell at={wf(ws, "aparecerá") - 6}>
        <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 24, padding: "20px 16px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#fff", color: "#0b0c0e", borderRadius: 999, padding: "5px 14px", fontSize: 11.5, fontWeight: 900, letterSpacing: 2.5 }}>¡NOVEDADES!</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 14 }}>JORNADA DE APERTURA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {items.map((it) => {
              const k = pop(f, fps, it.at, 11);
              return <div key={it.label} style={{ opacity: k, transform: `translateX(${(1 - k) * 80}px)`, display: "flex", alignItems: "center", gap: 10, background: t.mutedSurface, borderRadius: 12, padding: "11px 14px", fontSize: 16, fontWeight: 800 }}><Icon name={it.icon} color={t.accent} size={20} />{it.label}</div>;
            })}
          </div>
        </div>
      </Shell>
      {items.map((it) => sfx("pop", Math.max(2, it.at), 0.35))}{sfx("ding", wkF, 0.4)}
    </Frame>
  );
};

/* 4 · Los emparejamientos siguen siendo sorpresa */
const Surprise = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const empF = wf(ws, "emparejamientos"), sorF = wf(ws, "sorpresa");
  const p = pop(f, fps, empF - 4, 12);
  const s = pop(f, fps, sorF, 12);
  const pill = (txt: string) => <div style={{ flex: 1, background: t.mutedSurface, border: `1.5px dashed ${t.borderStrong}`, color: t.textMuted, borderRadius: 14, padding: "14px 6px", textAlign: "center", fontWeight: 900, fontSize: 22, lineHeight: 1.3 }}>{txt}<br />{txt}</div>;
  return (
    <Frame tag="SORPRESA" timedWords={ws}>
      <Shell at={Math.max(2, empF - 8)}>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Emparejamientos</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: p }}>{pill("?")}<div style={{ width: 34, height: 34, borderRadius: "50%", background: t.mutedSurface, color: t.textMuted, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>VS</div>{pill("?")}</div>
        </Panel>
      </Shell>
      <div style={{ marginTop: 60, opacity: s, transform: `scale(${0.85 + 0.15 * s})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 60px", fontSize: 56, fontWeight: 900, letterSpacing: 3 }}>SORPRESA</div>
      {sfx("ding", sorF, 0.45)}{sfx("pop", Math.max(2, empF - 4), 0.3)}
    </Frame>
  );
};

/* 5 · 20 de diciembre: la liga se desbloquea sola y llega una notificación */
const Unlock = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const dayF = wf(ws, "20"), unF = wf(ws, "desbloquea"), notF = wf(ws, "recibirás");
  const unlocked = f >= unF;
  const chip = pop(f, fps, dayF, 12);
  const un = pop(f, fps, unF, 12);
  const b = pop(f, fps, notF, 12);
  return (
    <Frame tag="20 DE DICIEMBRE" timedWords={ws}>
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "14px 50px", fontSize: 50, fontWeight: 900, letterSpacing: 3, marginBottom: 46 }}>20 DICIEMBRE</div>
      <Shell at={dayF + 4}>
        <NavBar items={INSIDE} active={0} dim={unlocked ? [] : [false, true, true, true, true]} lock={unlocked ? [] : [false, true, true, true, true]} pulse={unlocked ? un : 1} />
      </Shell>
      <div style={{ marginTop: 100, opacity: Math.min(1, b * 2), transform: `translateY(${(1 - b) * -120}px)` }}>
        <Zoom z={2.15}>
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.raised, border: `1px solid ${t.borderStrong}`, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
            <Img src={staticFile("logo.png")} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: t.mutedSurface }} />
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, color: t.textSubtle }}>SMASH &amp; LOB · AHORA</div>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>¡Empieza la temporada!</div>
              <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>La temporada ya está activa.</div>
            </div>
          </div>
        </Zoom>
      </div>
      {sfx("pop", dayF, 0.4)}{sfx("ding", unF, 0.5)}{sfx("ding", notF, 0.4)}
    </Frame>
  );
};

/* 6 · Los enfrentamientos de la Jornada 1 (ejemplo ficticio) */
const Round1 = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const enfF = wf(ws, "enfrentamientos"), jF = wf(ws, "jornada");
  const k = pop(f, fps, enfF - 6, 12);
  return (
    <Frame tag="JORNADA 1" example timedWords={ws}>
      <Shell at={4}>
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div>
            <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 999, padding: "4px 10px", opacity: f >= jF ? 1 : 0 }}>DESBLOQUEADA</div>
          </div>
          <div style={{ opacity: k, transform: `translateY(${(1 - k) * 40}px)` }}><PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} /></div>
        </Panel>
      </Shell>
      {sfx("pop", Math.max(2, enfF - 6), 0.4)}{sfx("ding", jF, 0.4)}
    </Frame>
  );
};

/* 7 · Las siguientes jornadas se van desvelando al completar las anteriores */
const Progressive = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const sigF = wf(ws, "siguientes"), compF = wf(ws, "completen");
  const p = pop(f, fps, 2, 12);
  const rows = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }];
  const done1 = f >= compF + 4;
  const open2 = f >= compF + 22;
  return (
    <Frame tag="SE VAN DESVELANDO" example timedWords={ws}>
      <Shell at={2}>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Calendario</div>
          {rows.map((r) => {
            const revealed = r.n === 1 || (r.n === 2 && open2);
            const a = pop(f, fps, sigF + (r.n - 1) * 6, 11);
            return (
              <div key={r.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: revealed ? t.mutedSurface : "transparent", border: `1.5px ${revealed ? "solid" : "dashed"} ${revealed ? (r.n === 2 && open2 ? t.accent : "transparent") : t.borderStrong}`, borderRadius: 12, padding: "13px 14px", opacity: r.n === 1 ? p : a, transform: `scale(${r.n === 2 && open2 ? 1 + 0.03 * Math.sin(Math.min(1, (f - compF - 22) / 10) * Math.PI) : 1})` }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: revealed ? t.text : t.textSubtle }}>Jornada {r.n}</div>
                {r.n === 1 ? <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: done1 ? "#34d399" : t.accent }}>{done1 ? <><Icon name="check" color="#34d399" size={16} />COMPLETADA</> : "EN JUEGO"}</div>
                  : revealed ? <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.accent }}>DESVELADA</div>
                  : <Icon name="lock" color={t.textSubtle} size={20} />}
              </div>
            );
          })}
        </Panel>
      </Shell>
      {sfx("pop", sigF, 0.3)}{sfx("pop", compF + 4, 0.4)}{sfx("ding", compF + 22, 0.45)}
    </Frame>
  );
};


/* 8 · Mientras tanto: candado en el calendario y en los chats (diseño replicado de la app; datos ficticios) */
const LockCard: React.FC<{ title: string }> = ({ title }) => {
  const t = useTheme();
  return (
    <div style={{ boxSizing: "border-box", border: `1.5px dashed ${t.borderStrong}`, borderRadius: 14, padding: "14px 12px", textAlign: "center", background: t.mutedSurface }}>
      <div style={{ display: "flex", justifyContent: "center" }}><Icon name="lock" color={t.textSubtle} size={26} /></div>
      <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 2, color: t.textMuted, marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: t.textSubtle, marginTop: 4, lineHeight: 1.35 }}>Se revelarán cuando finalice la jornada anterior.</div>
    </div>
  );
};

const LockedEverywhere = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const lockF = wf(ws, "candado"), chatsF = wf(ws, "chats") - 14, calF = wf(ws, "calendario");
  const inChats = f >= chatsF;
  const a = pop(f, fps, 4, 12);
  const l1 = pop(f, fps, lockF - 4, 11), l2 = pop(f, fps, lockF + 6, 11);
  const b = pop(f, fps, chatsF, 12);
  const c1 = pop(f, fps, chatsF + 6, 11), c2 = pop(f, fps, chatsF + 13, 11);
  return (
    <Frame tag={inChats ? "CHATS" : "CALENDARIO"} example timedWords={ws}>
      {!inChats ? (
        <div style={{ opacity: Math.min(1, a * 2) * (1 - Math.max(0, Math.min(1, (f - (chatsF - 8)) / 8))), transform: `scale(${0.92 + 0.08 * a})` }}>
          <Zoom z={2.1}>
            <Panel>
              <div style={{ fontSize: 19, fontWeight: 800 }}>Calendario de liga</div>
              <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 16, fontWeight: 800 }}>Jornada 1<span style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.accent }}>EN CURSO</span></div>
              <div style={{ opacity: l1, transform: `translateY(${(1 - l1) * 40}px)` }}><div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Jornada 2</div><LockCard title="EMPAREJAMIENTOS SECRETOS" /></div>
              <div style={{ opacity: l2, transform: `translateY(${(1 - l2) * 40}px)` }}><div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>Jornada 3</div><LockCard title="EMPAREJAMIENTOS SECRETOS" /></div>
            </Panel>
          </Zoom>
        </div>
      ) : (
        <div style={{ opacity: Math.min(1, b * 2), transform: `scale(${0.92 + 0.08 * b})` }}>
          <Zoom z={2.1}>
            <Panel>
              <div style={{ fontSize: 19, fontWeight: 800 }}>Chats</div>
              <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>CHAT GENERAL</div>
              <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "12px 14px" }}><div style={{ fontSize: 16, fontWeight: 800 }}>Chat de la liga</div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>Avisos y conversación</div></div>
              <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>ACTIVOS</div>
              <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "12px 14px" }}><div style={{ fontSize: 16, fontWeight: 800 }}>Jornada 1</div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>con {q[0]} y {q[1]} vs {q[2]} y {q[3]}</div></div>
              <div style={{ opacity: c1, transform: `translateY(${(1 - c1) * 40}px)` }}><div style={{ background: t.mutedSurface, border: `1.5px dashed ${t.borderStrong}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}><Icon name="lock" color={t.textSubtle} size={22} /><div><div style={{ fontSize: 16, fontWeight: 800, color: t.textSubtle }}>Jornada 2</div><div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.5, color: t.textSubtle, marginTop: 3 }}>EMPAREJAMIENTOS SECRETOS</div></div></div></div>
              <div style={{ opacity: c2, transform: `translateY(${(1 - c2) * 40}px)` }}><div style={{ background: t.mutedSurface, border: `1.5px dashed ${t.borderStrong}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}><Icon name="lock" color={t.textSubtle} size={22} /><div><div style={{ fontSize: 16, fontWeight: 800, color: t.textSubtle }}>Jornada 3</div><div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.5, color: t.textSubtle, marginTop: 3 }}>EMPAREJAMIENTOS SECRETOS</div></div></div></div>
            </Panel>
          </Zoom>
        </div>
      )}
      {sfx("pop", Math.max(2, lockF - 4), 0.35)}{sfx("pop", Math.max(2, lockF + 6), 0.35)}{sfx("pop", Math.max(2, calF), 0.2)}{sfx("pop", Math.max(2, chatsF + 6), 0.35)}{sfx("pop", Math.max(2, chatsF + 13), 0.35)}
    </Frame>
  );
};

/* 9 · Cierre con empaque: "Así que recuerda, activa las notificaciones. ¡Nos vemos en la pista!" */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const actF = wf(ws, "activa");
  const chip = pop(f, fps, Math.max(4, actF - 3), 11);
  const entF = wf(ws, "enterarte");
  const sub = pop(f, fps, Math.max(8, entF - 2), 11);
  const marks = [wf(ws, "nos"), wf(ws, "vemos"), wfLast(ws, "en"), wf(ws, "pista")];
  const words = ["Nos", "vemos", "en la", "pista"];
  const burst = interpolate(f, [marks[3], marks[3] + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 40px", fontSize: 40, fontWeight: 900, letterSpacing: 2 }}><Icon name="bell" color={t.accent} size={44} />ACTIVA LAS NOTIFICACIONES</div>
      <div style={{ marginTop: 20, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`, fontSize: 32, fontWeight: 800, color: t.textMuted, textAlign: "center", width: 860 }}>Te avisamos en cuanto se desbloquee tu siguiente partido</div>
      <div style={{ height: 34 }} />
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
      {sfx("pop", Math.max(4, actF - 3), 0.45)}{marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.5))}{sfx("ding", marks[3], 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Countdown, OpeningNews, Surprise, Unlock, Round1, Progressive, LockedEverywhere, Outro];
const KEYS = ["hook", "countdown", "opening", "surprise", "unlock", "round1", "progressive", "locked", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const DESBLOQUEO_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Desbloqueo: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-12-david.mp3" />;
