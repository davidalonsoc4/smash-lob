// Vídeo 10: clasificación (puntos por set, desempate por diferencia de juegos) y MVP automático avanzado.
// Voz: David Martin · Eleven v3 (toma 1, pausas con scripts/retime_voice.py). Datos de ejemplo ficticios.
import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { Panel } from "./Perfil";
import { Icon } from "./Presentacion";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice10";

type Props = { league: LeagueConfig; ws: TimedWord[] };

const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

const Shell: React.FC<{ at?: number; z?: number; children: React.ReactNode }> = ({ at = 2, z = 2.15, children }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 13);
  return <div style={{ opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}><Zoom z={z}>{children}</Zoom></div>;
};

const Bar: React.FC<{ value: number; on: boolean; hot?: boolean }> = ({ value, on, hot }) => {
  const t = useTheme();
  return (
    <div style={{ height: 12, borderRadius: 999, background: t.mutedSurface, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", borderRadius: 999, background: on || hot ? t.accent : t.textSubtle }} />
    </div>
  );
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 10, 10);
  return (
    <Frame>
      <Words text={"¿Cómo se decide\nla *clasificación*\ny el *MVP*?"} size={100} stagger={4} />
      <div style={{ marginTop: 70, transform: `scale(${p})`, width: 190, height: 190, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 60px ${t.accent}80` }}><Icon name="trophy" color={t.accentContrast} size={110} /></div>
    </Frame>
  );
};

/* 2 · Cada set ganado suma un punto */
const Points = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const setF = wf(ws, "set"), sumaF = wf(ws, "suma");
  const sets: [string, boolean][] = [["6 – 4", true], ["3 – 6", false], ["7 – 5", true]];
  const at = [18, 32, 46];
  const plusAt = [setF, sumaF + 6];
  const total = (f >= plusAt[0] ? 1 : 0) + (f >= plusAt[1] ? 1 : 0);
  return (
    <Frame tag="RANKING INDIVIDUAL" example timedWords={ws}>
      <Shell>
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Alain · Jornada 1</div><div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: t.textMuted }}>MIS SETS</div></div>
          {sets.map(([score, won], i) => {
            const p = pop(f, fps, at[i], 11);
            const plus = won ? pop(f, fps, plusAt[i === 0 ? 0 : 1], 10) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.mutedSurface, borderRadius: 12, padding: "11px 14px", opacity: p, transform: `translateX(${(1 - p) * 120}px)` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.textMuted }}>Set {i + 1}</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{score}</div>
                <div style={{ width: 54, textAlign: "right", fontSize: 20, fontWeight: 900, color: t.accent, opacity: plus, transform: `scale(${0.6 + 0.4 * plus})` }}>{won ? "+1" : ""}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}><div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted }}>PUNTOS</div><div style={{ fontSize: 40, fontWeight: 900, color: t.accent }}>{total}</div></div>
        </Panel>
      </Shell>
      {sfx("pop", plusAt[0], 0.4)}{sfx("pop", plusAt[1], 0.4)}
    </Frame>
  );
};

/* 3 · Empate a puntos: manda la diferencia de juegos */
const Tie = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const empF = wf(ws, "empate"), difF = wf(ws, "diferencia"), jueF = wf(ws, "juegos");
  const showDiff = f >= difF;
  const k = f >= jueF ? spring({ frame: f - jueF, fps, config: { damping: 15, stiffness: 150 } }) : 0;
  const rows = [{ n: "David", d: "−2", y0: 0, y1: 1 }, { n: "Nicolás", d: "+1", y0: 1, y1: 0 }];
  const H = 62;
  return (
    <Frame tag="DESEMPATE" example timedWords={ws}>
      <Shell>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Ranking individual</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 54px 54px", fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.textMuted, padding: "0 10px" }}><span>JUGADOR</span><span style={{ textAlign: "center" }}>DIF</span><span style={{ textAlign: "center" }}>PTS</span></div>
          <div style={{ position: "relative", height: H * 2 }}>
            {rows.map((r) => {
              const y = (r.y0 + (r.y1 - r.y0) * k) * H;
              const hot = r.y1 === 0 && k > 0.5;
              return (
                <div key={r.n} style={{ position: "absolute", left: 0, right: 0, top: y, height: H - 8, display: "grid", gridTemplateColumns: "1fr 54px 54px", alignItems: "center", background: t.mutedSurface, border: `1.5px solid ${hot ? t.accent : "transparent"}`, borderRadius: 12, padding: "0 10px" }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{r.n}</div>
                  <div style={{ textAlign: "center", fontSize: 17, fontWeight: 900, color: showDiff ? t.accent : t.textSubtle, opacity: showDiff ? 1 : 0.2 }}>{showDiff ? r.d : "·"}</div>
                  <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900 }}>3</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.accent, textAlign: "center", opacity: f >= empF ? 1 : 0 }}>Empatados a puntos → manda la diferencia de juegos</div>
        </Panel>
      </Shell>
      {sfx("pop", difF, 0.4)}{sfx("pop", jueF, 0.4)}
    </Frame>
  );
};

/* 4 · Terminan todos los partidos de la jornada → MVP automático */
const RoundEnd = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const termF = wf(ws, "terminan"), jorF = wf(ws, "jornada"), mvpF = wf(ws, "mvp");
  const m = [pop(f, fps, termF, 11), pop(f, fps, termF + 14, 11)];
  const done = pop(f, fps, jorF, 12);
  const mvp = pop(f, fps, mvpF, 12);
  return (
    <Frame tag="FIN DE JORNADA" example timedWords={ws}>
      <Shell>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Jornada 1</div>
          {["Partido 1", "Partido 2"].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: t.mutedSurface, borderRadius: 12, padding: "12px 14px", opacity: m[i], transform: `translateX(${(1 - m[i]) * 120}px)` }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{n}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#34d399" }}><Icon name="check" color="#34d399" size={18} />FINALIZADO</div>
            </div>
          ))}
        </Panel>
      </Shell>
      <div style={{ marginTop: 60, opacity: done, transform: `scale(${0.9 + 0.1 * done})`, border: `3px solid ${t.accent}`, color: t.accent, background: t.surface, borderRadius: 999, padding: "18px 50px", fontSize: 46, fontWeight: 900, letterSpacing: 2 }}>JORNADA COMPLETA</div>
      <div style={{ marginTop: 40, opacity: mvp, transform: `scale(${0.85 + 0.15 * mvp})`, display: "flex", alignItems: "center", gap: 18, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 56px", fontSize: 50, fontWeight: 900 }}><Icon name="trophy" color={t.accentContrast} size={54} />MVP AUTOMÁTICO</div>
      {sfx("pop", termF, 0.35)}{sfx("pop", termF + 14, 0.35)}{sfx("pop", jorF, 0.4)}{sfx("ding", mvpF, 0.45)}
    </Frame>
  );
};

/* 5 · Pareja ganadora más dominante (más diferencia de juegos) */
const Dominant = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const parF = wf(ws, "pareja"), domF = wf(ws, "dominante"), jueF = wf(ws, "juegos");
  const pairs = [{ n: `${q[2]} · ${q[3]}`, d: "+2", hot: false }, { n: `${q[0]} · ${q[1]}`, d: "+7", hot: true }];
  const hl = pop(f, fps, domF, 12);
  return (
    <Frame tag="PAREJA MÁS DOMINANTE" example timedWords={ws}>
      <Shell>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Parejas ganadoras de la jornada</div>
          {pairs.map((p, i) => {
            const a = pop(f, fps, parF + i * 10, 11);
            const hot = p.hot && hl > 0.5;
            const showD = f >= jueF - 14;
            return (
              <div key={p.n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: hot ? t.accent : t.mutedSurface, color: hot ? t.accentContrast : t.text, borderRadius: 14, padding: "16px 14px", opacity: a, transform: `translateX(${(1 - a) * 120}px) scale(${hot ? 1 + 0.03 * hl : 1})` }}>
                <div><div style={{ fontSize: 17, fontWeight: 900 }}>{p.n}</div>{hot && <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, marginTop: 4 }}>MÁS DOMINANTE</div>}</div>
                <div style={{ fontSize: 24, fontWeight: 900, opacity: showD ? 1 : 0.15 }}>{showD ? `${p.d} juegos` : "·"}</div>
              </div>
            );
          })}
        </Panel>
      </Shell>
      {sfx("pop", parF, 0.35)}{sfx("pop", domF, 0.4)}
    </Frame>
  );
};

/* 6 · Dentro de la pareja: índice ajustado con toda la temporada, compañeros y rivales */
const Within = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const destF = wf(ws, "destaca"), rendF = wf(ws, "rendido"), resF = wf(ws, "resultados"), quienF = wf(ws, "quién");
  const grow = (at: number, to: number) => interpolate(f, [at, at + 24], [0.08, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hot = f >= rendF + 28;
  const chips = [{ at: resF - 4, label: "Resultados de toda la temporada" }, { at: quienF - 4, label: "Con quién y contra quién juega" }];
  return (
    <Frame tag="DENTRO DE LA PAREJA" example timedWords={ws}>
      <Shell at={4}>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>{q[0]} · {q[1]}</div>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>ÍNDICE AJUSTADO</div>
          {[{ n: q[0], v: 0.82 }, { n: q[1], v: 0.55 }].map((p, i) => (
            <div key={p.n} style={{ background: t.mutedSurface, border: `1.5px solid ${hot && i === 0 ? t.accent : "transparent"}`, borderRadius: 12, padding: "12px 14px", opacity: pop(f, fps, destF + i * 6, 11) }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 17, fontWeight: 800 }}><span>{p.n}</span>{hot && i === 0 && <span style={{ color: t.accent, fontSize: 12.5, fontWeight: 900, letterSpacing: 1.2, display: "flex", alignItems: "center", gap: 5 }}><Icon name="trophy" color={t.accent} size={16} />MVP</span>}</div>
              <Bar value={grow(rendF - 6, p.v)} on={hot && i === 0} />
            </div>
          ))}
        </Panel>
      </Shell>
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        {chips.map((c) => { const k = pop(f, fps, c.at, 11); return <div key={c.label} style={{ opacity: k, transform: `translateY(${(1 - k) * 40}px) scale(${0.92 + 0.08 * k})`, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "16px 36px", fontSize: 34, fontWeight: 800 }}>{c.label}</div>; })}
      </div>
      {sfx("pop", rendF, 0.35)}{sfx("pop", resF - 4, 0.35)}{sfx("pop", quienF - 4, 0.35)}{sfx("ding", rendF + 28, 0.4)}
    </Frame>
  );
};

/* 7 · Si están muy igualados, comparten el MVP */
const Shared = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const igF = wf(ws, "igualados"), comF = wf(ws, "comparten");
  const eq = interpolate(f, [igF, igF + 22], [0.5, 0.74], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hot = f >= comF;
  const k = pop(f, fps, comF, 12);
  return (
    <Frame tag="MVP COMPARTIDO" example timedWords={ws}>
      <Shell>
        <Panel>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>ÍNDICE AJUSTADO</div>
          {[q[2], q[3]].map((n, i) => (
            <div key={n} style={{ background: t.mutedSurface, border: `1.5px solid ${hot ? t.accent : "transparent"}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 17, fontWeight: 800 }}><span>{n}</span>{hot && <span style={{ color: t.accent, fontSize: 12.5, fontWeight: 900, letterSpacing: 1.2, display: "flex", alignItems: "center", gap: 5 }}><Icon name="trophy" color={t.accent} size={16} />MVP</span>}</div>
              <Bar value={eq - i * 0.01} on={hot} />
            </div>
          ))}
        </Panel>
      </Shell>
      <div style={{ marginTop: 60, opacity: k, transform: `scale(${0.85 + 0.15 * k})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 56px", fontSize: 50, fontWeight: 900 }}>MVP COMPARTIDO</div>
      {sfx("ding", comF, 0.45)}
    </Frame>
  );
};

/* 8 · MVP de la temporada: quien más MVP de jornada gane */
const Season = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q = league.exampleQuartet;
  const tempF = wf(ws, "temporada"), vecesF = wf(ws, "jornadas");
  const rows = [{ n: q[0], c: 3 }, { n: q[1], c: 2 }, { n: q[3], c: 1 }];
  const hot = f >= vecesF + 4;
  return (
    <Frame tag="MVP DE TEMPORADA" example timedWords={ws}>
      <Shell at={Math.max(2, tempF - 14)}>
        <Panel>
          <div style={{ fontSize: 19, fontWeight: 800 }}>MVP de jornada ganados</div>
          {rows.map((r, i) => {
            const a = pop(f, fps, tempF + i * 8, 11);
            const isTop = i === 0 && hot;
            return (
              <div key={r.n} style={{ background: t.mutedSurface, border: `1.5px solid ${isTop ? t.accent : "transparent"}`, borderRadius: 12, padding: "12px 14px", opacity: a, transform: `translateX(${(1 - a) * 100}px)` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 17, fontWeight: 800 }}><span>{r.n}</span><span style={{ color: t.accent, fontSize: 20, fontWeight: 900 }}>{r.c}</span></div>
                <Bar value={interpolate(f, [vecesF - 10, vecesF + 14], [0, r.c / 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} on={isTop} />
              </div>
            );
          })}
        </Panel>
      </Shell>
      <div style={{ marginTop: 60, opacity: hot ? 1 : 0, transform: `scale(${hot ? 1 : 0.85})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 56px", fontSize: 46, fontWeight: 900, display: "flex", alignItems: "center", gap: 16 }}><Icon name="trophy" color={t.accentContrast} size={52} />MVP DE LA TEMPORADA</div>
      {sfx("ding", vecesF + 4, 0.45)}
    </Frame>
  );
};

/* 9 · Cierre: "Así que máximo esfuerzo. ¡Nos vemos en la pista!" */
const Outro = ({ league, ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const maxF = wf(ws, "máximo");
  const chip = pop(f, fps, Math.max(4, maxF - 3), 11);
  const marks = [wf(ws, "nos"), wf(ws, "vemos"), wf(ws, "en"), wf(ws, "pista")];
  const words = ["Nos", "vemos", "en la", "pista"];
  const burst = interpolate(f, [marks[3], marks[3] + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: chip, transform: `scale(${0.85 + 0.15 * chip})`, display: "flex", alignItems: "center", gap: 16, border: `3px solid ${t.accent}`, background: t.surface, color: t.accent, borderRadius: 999, padding: "16px 44px", fontSize: 50, fontWeight: 900, letterSpacing: 2 }}>MÁXIMO ESFUERZO</div>
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
      {sfx("pop", Math.max(4, maxF - 3), 0.45)}{marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.5))}{sfx("ding", marks[3], 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<Props>[] = [Hook, Points, Tie, RoundEnd, Dominant, Within, Shared, Season, Outro];
const KEYS = ["hook", "points", "tie", "roundend", "dominant", "within", "shared", "season", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const CLASIFICACION_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Clasificacion: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-10-david.mp3" />;
