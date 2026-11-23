// Vídeo «Perfil y disponibilidad» (v2): móvil con réplicas de las pantallas (datos ficticios) en una sola escena.
// Ajustes → Mi perfil (mano y posición) → Ajustes → Mi disponibilidad (días y franja) → horarios recomendados → disponibilidad total
// → «Cinco minutos ahora te ahorran muchos mensajes» → cierre estándar. Voz: David Martin · Eleven v3 (una toma, pausas por bloques).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, TabBar, Zoom } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { OutroSync, SyncWords } from "./SyncWords";
import { DAYS, DayChips, Panel, Segmented, SettingsRow, Suggest, TimeBox } from "./Perfil";
import { ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard, Ripple, SCR_H, Sec, WIN_H, WIN_W, Z } from "./Presentacion3";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voicePerfil";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const win = (f: number, a: number, b: number) => Math.min(ease((f - a) / 12), 1 - ease((f - b) / 10)); // visible entre a y b

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S3 = B30(3), S4 = B30(4), S5 = B30(5);
  const names = league.exampleQuartet;
  const tapPerfil = at(1, "perfil"), manoF = at(1, "mano"), posF = at(1, "posición");
  const ajF = at(2, "Ajustes"), tapDisp = at(2, "disponibilidad"), diasF = at(2, "días"), franjaF = at(2, "franja");
  const cuatroF = at(3, "cuatro"), horF = at(3, "horarios"), nadaF = at(3, "nada"), totalF = at(3, "total");
  const hookO = (1 - ease((f - (S1 - 22)) / 12)) * Math.min(1, pop(f, fps, 6, 10) * 2);
  const winIn = ease((f - (S1 - 14)) / 20), winOut = ease((f - (S4 - 12)) / 12);

  /* pantallas */
  const aj1 = win(f, S1 - 10, tapPerfil + 14), aj2 = win(f, ajF - 8, tapDisp + 14);
  const ajO = Math.max(aj1, aj2);
  const ajHl1 = clamp01((f - (tapPerfil - 6)) / 6) * (f < tapPerfil + 14 ? 1 : 0), ajHl2 = clamp01((f - (tapDisp - 6)) / 6) * (f < tapDisp + 14 ? 1 : 0);
  const perfO = win(f, tapPerfil + 12, ajF - 8);
  const dispO = Math.max(win(f, tapDisp + 12, cuatroF - 12), win(f, nadaF - 6, S4 - 12));
  const recO = win(f, cuatroF - 10, nadaF - 6);
  const total = f >= nadaF - 4;
  const lit = DAYS.map((_, i) => (total ? f >= totalF - 6 : f >= diasF + i * 4 && i < 5));
  const slideIn = (a: number) => (1 - ease((f - a) / 14)) * 40;

  const ajustes = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: ajO, transform: `translateX(${-(1 - ajO) * 20}px)` }}>
      <HeaderCard title="Ajustes" sub="Tu perfil y preferencias de la app" />
      <Sec title="Personal" />
      <Zoom z={0.94}><SettingsRow title="Mi perfil" desc="Tus datos, tu foto y cómo juegas." icon="user" hl={ajHl1} /></Zoom>
      <Zoom z={0.94}><SettingsRow title="Mi disponibilidad" desc="Define cuándo puedes jugar." icon="clock" hl={ajHl2} /></Zoom>
      <Zoom z={0.94}><SettingsRow title="Notificaciones" desc="Elige qué avisos quieres recibir." icon="bell" hl={0} /></Zoom>
    </div>
  );
  const perfil = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: perfO, transform: `translateX(${slideIn(tapPerfil + 12)}px)` }}>
      <HeaderCard title="Mi perfil" sub="Tus datos y cómo juegas" avatar />
      <Zoom z={0.94}>
        <Panel>
          <div><div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>NOMBRE</div><div style={{ padding: "10px 12px", borderRadius: 12, background: t.mutedSurface, border: `1px solid ${t.border}`, fontSize: 17, fontWeight: 800 }}>Alain</div></div>
          <Segmented label="Mano dominante" options={["Derecha", "Izquierda"]} sel={f >= manoF + 18 ? 0 : -1} />
          <Segmented label="Posición preferida" options={["Drive", "Revés", "Versátil"]} sel={f >= posF + 22 ? 0 : -1} />
          <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "11px 0", textAlign: "center", fontSize: 16, fontWeight: 900, opacity: f >= posF + 22 ? 1 : 0.55 }}>Guardar perfil</div>
        </Panel>
      </Zoom>
    </div>
  );
  const disp = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: dispO, transform: `translateX(${total ? 0 : slideIn(tapDisp + 12)}px)` }}>
      <HeaderCard title="Mi disponibilidad" sub="Para las recomendaciones de horario" />
      <Zoom z={0.94}>
        <Panel>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{total && f >= totalF - 6 ? "Sin franjas: disponibilidad total" : "Horario semanal habitual"}</div>
          {!total && <Segmented label="Modo" options={["Rápido", "Por días"]} sel={0} />}
          <DayChips lit={lit} />
          {!total && <div style={{ display: "flex", gap: 10 }}>
            <TimeBox label="DESDE" value="19:00" on={f >= franjaF} />
            <TimeBox label="HASTA" value="21:00" on={f >= franjaF + 8} />
          </div>}
          {!total && <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "11px 0", textAlign: "center", fontSize: 16, fontWeight: 900, opacity: f >= franjaF + 8 ? 1 : 0.55 }}>Guardar disponibilidad</div>}
        </Panel>
      </Zoom>
      {total && <div style={{ alignSelf: "center", marginTop: 14, opacity: pop(f, fps, totalF, 12), transform: `scale(${0.9 + 0.1 * pop(f, fps, totalF, 12)})`, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "10px 24px", fontSize: 19, fontWeight: 900 }}>Disponibilidad total</div>}
    </div>
  );
  const rec = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: recO, transform: `translateX(${slideIn(cuatroF - 10)}px)` }}>
      <HeaderCard title="Jornada 2" sub="Horarios recomendados" />
      <Card accent={false} pad="10px 8px">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {names.map((n, i) => { const q = pop(f, fps, cuatroF - 4 + i * 5, 12); return <div key={n} style={{ opacity: q, transform: `scale(${q})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><Avatar size={40} /><div style={{ fontSize: 12.5, fontWeight: 800 }}>{n}</div></div>; })}
        </div>
      </Card>
      <Zoom z={0.94}><Suggest date="SÁBADO" time="19:00 – 21:00" at={Math.max(S3, horF - 4)} /></Zoom>
      <Zoom z={0.94}><Suggest date="DOMINGO" time="10:00 – 12:00" at={Math.max(S3 + 16, horF + 14)} /></Zoom>
    </div>
  );
  const ripples = [{ y: 148, a: tapPerfil }, { y: 226, a: tapDisp }];

  /* etiqueta superior */
  const TAGS: [number, string][] = [[S1 + 6, "AJUSTES · MI PERFIL"], [tapDisp - 8, "MI DISPONIBILIDAD"], [cuatroF - 12, "HORARIOS RECOMENDADOS"], [nadaF - 10, "SIN INDICAR NADA"]];
  const tagI = f >= S4 - 10 ? -2 : TAGS.reduce((a, [s0], i) => (f >= s0 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0], 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  const example = f >= cuatroF - 10 && f < nadaF - 6;
  const thanksK = ease((f - (S4 - 2)) / 14);
  const outO = 1 - ease((f - (S5 - 14)) / 12);

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><Words text={"¿Ya tienes\ntu *perfil* listo?"} size={110} stagger={4} /></div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn * (1 - winOut), transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})` }}>
            {ajO > 0.01 && ajustes}{perfO > 0.01 && perfil}{dispO > 0.01 && disp}{recO > 0.01 && rec}
            <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><TabBar active={4} /></div>
            {ripples.map((r, i) => <Ripple key={i} x={NATIVE_W / 2} y={r.y} at={r.a} size={46} />)}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: thanksK * outO }}>
        <SyncWords text={"Cinco minutos\nahora te *ahorran*\nmuchos *mensajes*\ndespués"} frames={["Cinco", "minutos", "ahora", "te", "ahorran", "muchos", "mensajes", "después"].map((w) => at(4, w))} size={96} />
        <div style={{ marginTop: 60, opacity: pop(f, fps, at(4, "después") - 4, 10) }}><Ball size={80} /></div>
      </div>
      {[tapPerfil, manoF + 18, posF + 22, tapDisp, horF - 4, horF + 14, totalF].map((m, i) => sfx("pop", Math.max(2, m - 2), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}
      {[0, 1, 2, 3, 4].map((i) => sfx("pop", diasF + i * 4, 0.2))}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[5] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 5)} /> },
  { key: "outro", dur: Math.round((BOUNDS[6] - BOUNDS[5]) * 30), C: () => <OutroSync league={league} ws={sceneWords(5)} /> },
];
export const PERFIL2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const PerfilV2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-perfil-david.mp3" />;

