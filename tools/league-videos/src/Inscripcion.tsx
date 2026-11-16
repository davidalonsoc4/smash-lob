// Vídeo: "¿Para qué es la inscripción?" — versión SIN cifras (publicable en cualquier momento).
// Los importes concretos irán en una segunda versión, cuando las reservas estén confirmadas.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice03";

type Props = { league: LeagueConfig; ws: TimedWord[] };

// Límites de escena (s) en mitad de las pausas de la voz; cada escena recibe sus palabras con tiempos relativos.
const norm = (w: string) => w.replace(/[,.:!?¡¿]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};

/* ---------- Iconos ---------- */
const Ico: React.FC<{ name: "court" | "ball" | "gift" | "eye" | "trophy" | "lock"; color: string; size?: number }> = ({ name, color, size = 28 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {name === "court" && (<><rect x={2.5} y={5} width={19} height={14} rx={2} /><path d="M12 5v14M2.5 12h19" /></>)}
      {name === "ball" && (<><circle cx={12} cy={12} r={9} /><path d="M4.5 7.5c4 1.5 4 7.5 0 9M19.5 7.5c-4 1.5-4 7.5 0 9" /></>)}
      {name === "gift" && (<><rect x={3} y={8} width={18} height={5} rx={1} /><path d="M5 13v7h14v-7M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 12 8zM12 8c2.5 0 4-1 4-2.5S14.5 3 12 8z" /></>)}
      {name === "trophy" && (<><path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M8.5 20h7" /></>)}
      {name === "lock" && (<><rect x={5} y={11} width={14} height={9} rx={2} /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>)}
      {name === "eye" && (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx={12} cy={12} r={3} /></>)}
    </svg>
  );
};

/* 1 · Gancho */
const Hook: React.FC<Props> = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const bounce = Math.abs(Math.sin(f / 6)) * 120;
  const p = pop(f, fps, 8, 10);
  return (
    <Frame>
      <Words text={"¿Para qué es\nla *inscripción*?"} size={118} stagger={4} />
      <div style={{ marginTop: 90, transform: `translateY(${-bounce}px) scale(${p})` }}>
        <div style={{ width: 170, height: 170, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${t.accent} 60%, rgba(0,0,0,.35))`, boxShadow: `0 0 60px ${t.accent}80`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accentContrast, fontSize: 110, fontWeight: 900 }}>€</div>
      </div>
    </Frame>
  );
};

/* 2 y 4 · Bote de la liga: las monedas entran (reverse=false) o vuelven a los jugadores (reverse=true) */
const Pot = ({ league, ws, reverse, start, step, tag }: Props & { reverse: boolean; start: number; step: number; tag: string }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const n = league.playerNames.length;
  const dur = 14;
  const moveAt = (i: number) => start + i * step;
  const doneAt = (i: number) => moveAt(i) + dur;
  const moved = league.playerNames.filter((_, i) => f >= doneAt(i)).length;
  const inPot = reverse ? n - moved : moved;
  const cardP = pop(f, fps, 2, 13);
  return (
    <Frame tag={tag} timedWords={ws}>
      <div style={{ position: "relative", width: 840, height: 900 }}>
        {league.playerNames.map((_, i) => {
          const x = 110 + (i % 4) * 190;
          const raw = interpolate(f, [moveAt(i), doneAt(i)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const prog = reverse ? 1 - raw : raw;
          const y = -80 + prog * 560;
          const visible = raw > 0 && raw < 1;
          return <div key={i} style={{ position: "absolute", left: x, top: y + (i % 2) * 40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${t.accent} 60%, rgba(0,0,0,.35))`, color: t.accentContrast, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, fontWeight: 900, opacity: visible ? 1 : 0, zIndex: 2 }}>€</div>;
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, transform: `scale(${0.9 + 0.1 * cardP})`, opacity: Math.min(1, cardP * 2) }}>
          <Zoom z={2.0}>
            <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 22, overflow: "hidden" }}>
              <div style={{ height: 6, background: t.accent }} />
              <div style={{ padding: "22px 20px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: t.textSubtle }}>BOTE DE LA LIGA</div>
                <div style={{ fontSize: 64, fontWeight: 900, color: t.accent, lineHeight: 1.1, marginTop: 8 }}>{inPot}<span style={{ fontSize: 30, color: t.textMuted }}> / {n}</span></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textMuted, marginTop: 4 }}>{reverse ? "inscripciones sin gastar se devuelven" : "jugadores inscritos"}</div>
              </div>
            </div>
          </Zoom>
        </div>
      </div>
      {league.playerNames.map((_, i) => sfx("pop", doneAt(i), 0.3))}
    </Frame>
  );
};

/* 3 · Lista de cuentas de la liga (importes cifrados: no se publican cifras ni conceptos sensibles) */
const Hidden: React.FC = () => {
  const t = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: t.mutedSurface, border: `1px solid ${t.borderStrong}`, borderRadius: 999, padding: "6px 12px 6px 10px" }}>
      <Ico name="lock" color={t.textSubtle} size={15} />
      <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: 2, color: t.textMuted, whiteSpace: "nowrap" }}>•••• €</span>
    </div>
  );
};

const Ledger = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  type Row = { at: number; icon: "court" | "ball" | "gift" | "trophy"; title: string; badge?: string };
  const rows: Row[] = ([
    { at: wf(ws, "apertura") - 18, icon: "court", title: "Reserva jornada de apertura" },
    { at: wf(ws, "cierre") - 18, icon: "court", title: "Reserva jornada de cierre" },
    { at: wf(ws, "bolas") - 10, icon: "ball", title: "Bolas de cada partido" },
    { at: wf(ws, "detalle") - 10, icon: "gift", title: "Welcome pack", badge: "SORPRESA" },
    { at: wf(ws, "premio") - 10, icon: "trophy", title: "Premios" },
  ] as Row[]).map((r) => ({ ...r, at: Math.max(14, r.at) }));
  const head = pop(f, fps, 2, 13);
  return (
    <Frame tag="CUENTAS DE LA LIGA" timedWords={ws}>
      <div style={{ opacity: Math.min(1, head * 2), transform: `scale(${0.92 + 0.08 * head})` }}>
        <Zoom z={2.3}>
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 18, padding: "14px 14px 6px" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>En qué se usa</div>
            <div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 2, marginBottom: 6 }}>Temporada 1 · Inscripción</div>
            {rows.map((r, i) => {
              const p = pop(f, fps, r.at, 12);
              return (
                <div key={r.title} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderTop: `1px solid ${t.border}`, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 70}px)` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={r.icon} color={t.accentContrast} size={21} /></div>
                  <div style={{ flex: 1, fontSize: 16.5, fontWeight: 800, lineHeight: 1.15 }}>{r.title}{r.badge && <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 999, padding: "2px 7px", verticalAlign: "middle" }}>{r.badge}</span>}</div>
                  <Hidden />
                </div>
              );
            })}
          </div>
        </Zoom>
      </div>
      {rows.map((r) => sfx("pop", r.at, 0.35))}
    </Frame>
  );
};

/* 5 · Cuentas claras (las cuentas NO se publican en la app: se enseñan a quien las pida) */
const Clear = ({ ws }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 12);
  const q = pop(f, fps, Math.max(8, wf(ws, "duda") - 6), 12);
  const r = pop(f, fps, Math.max(8, wf(ws, "transparencia") - 6), 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ width: 260, height: 260, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 70px ${t.accent}66`, transform: `scale(${p})` }}>
        <Ico name="eye" color={t.accentContrast} size={150} />
      </div>
      <div style={{ height: 40 }} />
      <Words text={"Cuentas\n*claras*"} size={130} delay={6} stagger={4} />
      <div style={{ marginTop: 50, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        <div style={{ opacity: r, transform: `translateY(${(1 - r) * 40}px) scale(${0.9 + r * 0.1})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "18px 40px", fontSize: 40, fontWeight: 900 }}>Total transparencia</div>
        <div style={{ opacity: q, transform: `translateY(${(1 - q) * 40}px) scale(${0.9 + q * 0.1})`, border: `2px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "18px 40px", fontSize: 40, fontWeight: 800 }}>¿Dudas? Pregúntanos</div>
      </div>
      {sfx("pop", Math.max(8, wf(ws, "transparencia") - 6), 0.4)}
      {sfx("pop", Math.max(8, wf(ws, "duda") - 6), 0.4)}
    </Frame>
  );
};

/* 6 · Cierre */
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

const COMPS: React.FC<Props>[] = [
  Hook,
  (p) => <Pot {...p} reverse={false} start={20} step={6} tag="LA INSCRIPCIÓN" />,
  Ledger,
  (p) => <Pot {...p} reverse start={30} step={4} tag="EL SOBRANTE" />,
  Clear,
  Outro,
];
const KEYS = ["hook", "pot", "ledger", "leftover", "clear", "outro"];
const makeScenes = (league: LeagueConfig): SceneDef[] =>
  COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C league={league} ws={sceneWords(i)} /> }));
export const INSCRIPCION_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Inscripcion: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-03-david.mp3" />;
