// Vídeo 8: "¿Cómo se sube un resultado?" — abrir el partido, tres sets, marcador no válido, basta con uno, ranking y avisos.
// Voz: David Martin · Eleven v3 (toma 1, pausas ajustadas con scripts/retime_voice.py). Datos de ejemplo ficticios.
import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, PairPills, RankRow, RankingCard, Zoom } from "./appUi";
import { DIFF, LeagueConfig, PTS, rankAt } from "./Bienvenida";
import { Panel, SettingsRow } from "./Perfil";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice08";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

/* ---------- Réplicas de la app ---------- */
type SetIn = [string, string];

const ScoreForm: React.FC<{ names: [string, string][]; sets: SetIn[]; invalid?: number; pointsOn: boolean }> = ({ names, sets, invalid = -1, pointsOn }) => {
  const t = useTheme();
  const wins = (team: 0 | 1) => sets.filter((s) => s[0] !== "" && s[1] !== "" && (team === 0 ? +s[0] > +s[1] : +s[1] > +s[0]) && !(invalid >= 0 && sets.indexOf(s) === invalid)).length;
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr repeat(3, 38px) 64px", gap: 6, alignItems: "center" };
  return (
    <Panel>
      <div style={{ fontSize: 19, fontWeight: 800 }}>Registrar resultado</div>
      <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: -6 }}>Introduce los tres sets. Cada set ganado suma un punto.</div>
      <div style={{ ...grid, padding: "0 6px" }}>
        <span />{[1, 2, 3].map((n) => <span key={n} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: t.textMuted }}>Set {n}</span>)}
        <span style={{ textAlign: "center", fontSize: 13, fontWeight: 900 }}>Resultado</span>
      </div>
      {[0, 1].map((team) => (
        <div key={team} style={{ ...grid, background: t.mutedSurface, borderRadius: 12, padding: "10px 6px" }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.25 }}>{names[team][0]}<br />{names[team][1]}</div>
          {sets.map((s, i) => (
            <div key={i} style={{ height: 34, borderRadius: 9, background: t.surface, border: `1.5px solid ${invalid === i && s[0] !== "" && s[1] !== "" ? "#ef4444" : t.borderStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{s[team]}</div>
          ))}
          <div style={{ textAlign: "center", fontSize: 26, fontWeight: 900, color: t.accent }}>{pointsOn ? wins(team as 0 | 1) : ""}</div>
        </div>
      ))}
      {invalid >= 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#f87171", lineHeight: 1.35 }}>Set {invalid + 1}: Set no válido. Usa marcadores tipo 6-0, 6-4, 7-5 o 7-6.</div>}
    </Panel>
  );
};

const SaveButton: React.FC<{ pressed: boolean }> = ({ pressed }) => {
  const t = useTheme();
  return <div style={{ width: NATIVE_W, boxSizing: "border-box", textAlign: "center", padding: "13px 0", borderRadius: 14, fontSize: 17, fontWeight: 900, background: t.accent, color: t.accentContrast, transform: `scale(${pressed ? 0.96 : 1})`, boxShadow: pressed ? `0 0 0 4px ${t.accent}44` : "none" }}>Guardar resultado</div>;
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 8, 10);
  const t = useTheme();
  return (
    <Frame>
      <Words text={"¿Cómo se sube\nun *resultado*?"} size={112} stagger={4} />
      <div style={{ marginTop: 80, transform: `scale(${p})`, background: t.accent, color: t.accentContrast, borderRadius: 40, padding: "20px 70px", fontSize: 130, fontWeight: 900, letterSpacing: 6 }}>6 – 4</div>
    </Frame>
  );
};

/* 2 · Abrir el partido y tocar "Registrar resultado" */
const OpenMatch = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const p = pop(f, fps, 6, 13);
  const tap = wf(ws, "registrar");
  const hl = Math.min(1, Math.max(0, (f - (tap - 4)) / 6));
  return (
    <Frame tag="TU PARTIDO" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.15}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Panel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div>
                <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 999, padding: "4px 10px" }}>PROGRAMADO</div>
              </div>
              <PairPills a={[q[0], q[1]]} b={[q[2], q[3]]} width={376} />
            </Panel>
            <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", justifyContent: "space-between", alignItems: "center", background: t.surface, border: `1.5px solid ${hl > 0.5 ? t.accent : t.border}`, borderRadius: 16, padding: "14px 16px", transform: `scale(${1 + 0.03 * hl})`, boxShadow: hl > 0.5 ? `0 0 0 3px ${t.accent}33` : "none" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Registrar resultado</div>
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke={t.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 8 4 4 4-4" /></svg>
            </div>
          </div>
        </Zoom>
      </div>
      {sfx("pop", tap, 0.4)}
    </Frame>
  );
};

/* 3 · Los tres sets */
const Sets = ({ league, ws }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const p = pop(f, fps, 2, 13);
  const t1 = wf(ws, "tres") + 4, t2 = wf(ws, "cada") + 4, t3 = wf(ws, "punto") - 6;
  const sets: SetIn[] = [f >= t1 ? ["6", "4"] : ["", ""], f >= t2 ? ["3", "6"] : ["", ""], f >= t3 ? ["7", "5"] : ["", ""]];
  return (
    <Frame tag="TRES SETS" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.15}><ScoreForm names={[[q[0], q[1]], [q[2], q[3]]]} sets={sets} pointsOn /></Zoom>
      </div>
      {sfx("pop", t1, 0.35)}{sfx("pop", t2, 0.35)}{sfx("pop", t3, 0.35)}
    </Frame>
  );
};

/* 4 · Marcador no válido */
const Invalid = ({ league, ws }: Props) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const p = pop(f, fps, 2, 13);
  const bad = wf(ws, "marcador") + 4;
  const sets: SetIn[] = [["6", "4"], f >= bad ? ["6", "5"] : ["3", "6"], ["", ""]];
  return (
    <Frame tag="AVISO DE LA APP" example timedWords={ws}>
      <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={2.15}><ScoreForm names={[[q[0], q[1]], [q[2], q[3]]]} sets={sets} invalid={f >= bad ? 1 : -1} pointsOn={false} /></Zoom>
      </div>
      {sfx("pop", bad, 0.4)}
    </Frame>
  );
};

/* 5 · Basta con que lo suba uno de los cuatro */
const OneOfFour = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const hiF = wf(ws, "suba");
  const hi = pop(f, fps, hiF, 12);
  return (
    <Frame tag="SOLO UNO" example timedWords={ws}>
      <div style={{ display: "flex", gap: 26 }}>
        {q.map((n, i) => {
          const a = pop(f, fps, 4 + i * 5, 12);
          const me = i === 0;
          return (
            <div key={n} style={{ opacity: a * (me ? 1 : 1 - 0.45 * hi), transform: `scale(${a * (me ? 1 + 0.18 * hi : 1)})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ borderRadius: "50%", boxShadow: me && hi > 0.5 ? `0 0 0 6px ${t.accent}` : "none" }}><Zoom z={2.6}><Avatar size={44} /></Zoom></div>
              <div style={{ fontSize: 32, fontWeight: 800, color: me && hi > 0.5 ? t.accent : t.text }}>{n}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 80, opacity: hi, transform: `scale(${0.9 + 0.1 * hi})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 50px", fontSize: 54, fontWeight: 900 }}>1 de 4</div>
      {sfx("pop", hiF, 0.4)}
    </Frame>
  );
};

/* 6 · Al guardar, el ranking se actualiza solo */
const RankUpdate = ({ league, ws }: Props) => {
  const NAMES = league.playerNames;
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const saveF = Math.max(8, wf(ws, "guardar") - 4);
  const rankF = wf(ws, "ranking") + 2;
  const p = pop(f, fps, 2, 13);
  const cardP = pop(f, fps, saveF + 6, 13);
  const started = f >= rankF;
  const k = started ? spring({ frame: f - rankF, fps, config: { damping: 15, stiffness: 140 } }) : 0;
  const prevR = 1, curR = started ? 2 : 1;
  const from = rankAt(NAMES, prevR), to = rankAt(NAMES, curR);
  const lerp = (a: number, b: number) => a + (b - a) * k;
  const rows: RankRow[] = NAMES.map((n) => {
    const pos = lerp(from[n], to[n]);
    const tie = started && NAMES.some((m) => m !== n && PTS[m][curR] === PTS[n][curR]);
    return { key: n, name: n.split(" ")[0], pts: Math.round(lerp(PTS[n][prevR], PTS[n][curR])), diff: Math.round(lerp(DIFF[n][prevR], DIFF[n][curR])), j: curR, pos, shownPos: Math.round(pos), moved: from[n] !== to[n] && k < 0.95, climbing: to[n] < from[n], tie };
  });
  return (
    <Frame tag="RANKING INDIVIDUAL" example timedWords={ws}>
      <div style={{ position: "absolute", top: 340, opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}><Zoom z={2.15}><SaveButton pressed={f >= saveF && f < saveF + 8} /></Zoom></div>
      <div style={{ position: "absolute", top: 490, opacity: Math.min(1, cardP * 2), transform: `translateY(${(1 - cardP) * 60}px)` }}><Zoom z={2.0}><RankingCard rows={rows} /></Zoom></div>
      {sfx("pop", saveF, 0.4)}{sfx("pop", rankF, 0.4)}
    </Frame>
  );
};

/* 7 · Activa las notificaciones: aviso "Falta el resultado" */
const Notify = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const rowP = pop(f, fps, Math.max(6, wf(ws, "notificaciones") - 12), 12);
  const tap = wf(ws, "ajustes");
  const hl = Math.min(1, Math.max(0, (f - (tap - 4)) / 6));
  const banF = wf(ws, "falta") - 8;
  const b = pop(f, fps, banF, 12);
  return (
    <Frame tag="AJUSTES · NOTIFICACIONES" timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 900 }}>
        <div style={{ opacity: Math.min(1, rowP * 2), transform: `translateY(${(1 - rowP) * 40}px)` }}>
          <Zoom z={2.15}><SettingsRow title="Notificaciones" desc="Activa push y elige qué avisos quieres recibir en este dispositivo." icon="bell" hl={hl} /></Zoom>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, opacity: Math.min(1, b * 2), transform: `translateY(${(1 - b) * -120}px)` }}>
          <Zoom z={2.15}>
            <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.raised, border: `1px solid ${t.borderStrong}`, borderRadius: 18, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 12px 40px rgba(0,0,0,.45)" }}>
              <Img src={staticFile("logo.png")} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain", background: t.mutedSurface }} />
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.6, color: t.textSubtle }}>SMASH &amp; LOB · AHORA</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 3 }}>Falta el resultado</div>
                <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>No olvides registrar el resultado de tu partido de la Jornada 1.</div>
              </div>
            </div>
          </Zoom>
        </div>
      </div>
      {sfx("ding", banF, 0.4)}{sfx("pop", tap, 0.3)}
    </Frame>
  );
};

/* 8 · Cierre */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 320, height: 320, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 30 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={124} delay={4} stagger={3} />
      <div style={{ marginTop: 50 }}><Ball size={76} /></div>
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, OpenMatch, Sets, Invalid, OneOfFour, RankUpdate, Notify, Outro];
const KEYS = ["hook", "open", "sets", "invalid", "one", "rank", "notify", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const RESULTADO_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Resultado: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-08-david.mp3" />;
