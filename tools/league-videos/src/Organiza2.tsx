// Vídeo «Organiza tu próximo partido» (v2): móvil con réplicas de pantallas (datos ficticios) en una sola escena.
// Detalle del partido con horarios recomendados → chat de la jornada (hora y lugar) → programar → calendario del móvil → recordatorios en Ajustes.
// Sin pagos ni resultado (el resultado va en «Día de partido»). Voz: David Martin · Eleven v3 (una toma, pausas por bloques).
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { Avatar, NATIVE_W, TabBar } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { Suggest } from "./Perfil";
import { ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard, PairBox, Ripple, SCR_H, Sec, Vs, WIN_H, WIN_W, Z } from "./Presentacion3";
import { OutroSync } from "./SyncWords";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceOrganiza";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const win = (f: number, a: number, b: number) => Math.min(ease((f - a) / 12), 1 - ease((f - b) / 10));

const Bub: React.FC<{ name?: string; color?: string; text: string; own?: boolean; k: number }> = ({ name, color, text, own, k }) => {
  const t = useTheme();
  return (
    <div style={{ alignSelf: own ? "flex-end" : "flex-start", maxWidth: 300, opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 24}px) scale(${0.94 + 0.06 * k})`, background: own ? t.accent : t.mutedSurface, color: own ? t.accentContrast : t.text, borderRadius: own ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px" }}>
      {name && <div style={{ fontSize: 11.5, fontWeight: 900, color, marginBottom: 2 }}>{name}</div>}
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{text}</div>
    </div>
  );
};

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S4 = B30(6);
  const q = league.exampleQuartet;
  const horF = at(1, "horarios"), cuaF = at(1, "cuatro");
  const elF = at(2, "mejor"), dudF = at(2, "dudas");
  const proF = at(3, "Propón"), horaF = at(3, "hora"), lugF = at(3, "lugar"), acuF = at(3, "acuerdo"), progF = at(3, "programa");
  const llegaF = at(4, "llega"), tresF = at(4, "tres"), fechaF = at(4, "fecha");
  const addF = at(5, "Añádelo"), calF = at(5, "calendario"), actF = at(5, "activa"), recF = at(5, "recordatorios");
  const hookO = (1 - ease((f - (S1 - 22)) / 12)) * Math.min(1, pop(f, fps, 6, 10) * 2);
  const winIn = ease((f - (S1 - 14)) / 20), winOut = ease((f - (S4 - 12)) / 12);

  const d1 = win(f, S1 - 10, proF - 8), d2 = win(f, progF - 12, actF - 10);
  const detO = Math.max(d1, d2);
  const chatO = win(f, proF - 6, progF - 12);
  const setO = win(f, actF - 8, S4 - 12);
  const hot = f >= cuaF;
  const progged = f >= progF + 18;
  const chosen = f >= elF - 2;
  const slide = (a: number) => (1 - ease((f - a) / 14)) * 40;

  const detail = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${f < proF ? slide(S1 - 10) : slide(progF - 12)}px)` }}>
      <HeaderCard title="Jornada 2" sub={`${league.season} · En curso`} right={<div style={{ fontSize: 12, color: t.text, background: t.mutedSurface, borderRadius: 999, padding: "4px 10px", fontWeight: 700 }}>{progged ? "Programado" : "Sin programar"}</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: NATIVE_W - 24 }}><PairBox a={q[0]} b={q[1]} gold /><Vs /><PairBox a={q[2]} b={q[3]} gold /></div>
      {f < progF - 4 && <>
        <div style={{ opacity: pop(f, fps, horF - 6, 12) }}><Sec title="Horarios recomendados" /></div>
        <div style={{ width: NATIVE_W - 24, zoom: (NATIVE_W - 24) / NATIVE_W, outline: chosen ? `3px solid ${t.accent}` : hot ? `2px solid #34d39966` : "none", borderRadius: 14, boxShadow: chosen ? `0 0 20px ${t.accent}55` : "none" }}><Suggest date="JUEVES" time="19:30 – 21:30" at={horF + 6} /></div>
        <div style={{ width: NATIVE_W - 24, zoom: (NATIVE_W - 24) / NATIVE_W, opacity: chosen ? 0.55 : 1 }}><Suggest date="SÁBADO" time="10:00 – 12:00" at={horF + 22} /></div>
        {f >= dudF - 4 && <Bub name={q[2]} color="#81c995" text="¿Os viene bien el jueves?" k={pop(f, fps, dudF - 2, 12)} />}
      </>}
      {f >= progF - 4 && (
        <Card accent={false} pad="9px 14px">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ width: 4, height: 16, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 16.5, fontWeight: 800 }}>Programación</div></div>
          {!progged ? (
            <div style={{ border: `1.5px solid ${t.accent}`, borderRadius: 12, padding: "11px 0", textAlign: "center", fontSize: 15, fontWeight: 800, boxShadow: `0 0 18px ${t.accent}44` }}>＋ Añadir fecha, hora y lugar</div>
          ) : (
            <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "8px 11px", opacity: pop(f, fps, progF + 18, 12) }}>
              <div style={{ fontSize: 12.5, color: t.textMuted }}>Jueves · 19:30</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}><Icon name="pin" color={t.text} size={16} />Polideportivo Pando</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1, background: t.accent, color: t.accentContrast, borderRadius: 10, padding: "7px 0", textAlign: "center", fontSize: 13.5, fontWeight: 800 }}>➤ Cómo llegar</div>
                <div style={{ flex: 1, background: t.accent, color: t.accentContrast, borderRadius: 10, padding: "7px 0", textAlign: "center", fontSize: 13.5, fontWeight: 800, boxShadow: f >= calF - 8 && f < calF + 14 ? `0 0 16px ${t.accent}aa` : "none" }}>▦ Calendario</div>
              </div>
            </div>
          )}
        </Card>
      )}
      {progged && f >= tresF - 8 && f < addF + 4 && (
        <Card accent={false} pad="8px 14px">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>Aviso enviado</div>
            <div style={{ display: "flex", gap: 14 }}>{[q[1], q[2], q[3]].map((n, i) => { const k = pop(f, fps, tresF - 6 + i * 6, 12); return <div key={n + i} style={{ opacity: k, transform: `scale(${k})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}><Avatar size={32} /><div style={{ fontSize: 11, fontWeight: 800 }}>{n}</div></div>; })}</div>
          </div>
        </Card>
      )}
    </div>
  );
  const chat = (
    <div style={{ position: "absolute", left: 12, top: 12, width: NATIVE_W - 24, height: BAR_TOP - 20, display: "flex", flexDirection: "column", gap: 8, opacity: chatO, transform: `translateX(${slide(proF - 6)}px)` }}>
      <HeaderCard title="Jornada 2" sub="Chat de la jornada" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <Bub name={q[0]} color="#8ab4f8" text="¿Jugamos el jueves a las 19:30?" k={pop(f, fps, horaF - 4, 12)} />
        <Bub name={q[2]} color="#81c995" text="Me va bien. ¿En Pando?" k={pop(f, fps, lugF - 2, 12)} />
        <Bub own text="Hecho: jueves 19:30 en Pando" k={pop(f, fps, acuF - 10, 12)} />
      </div>
      <div style={{ background: t.mutedSurface, border: `1px solid ${t.border}`, borderRadius: 999, padding: "9px 14px", fontSize: 14, color: t.textSubtle }}>Escribe un mensaje…</div>
    </div>
  );
  const sw = (on: boolean) => <div style={{ width: 52, height: 30, borderRadius: 999, background: on ? t.accent : t.mutedSurface, border: `2px solid ${on ? t.accent : t.borderStrong}`, position: "relative" }}><div style={{ position: "absolute", top: 2, left: on ? 24 : 2, width: 22, height: 22, borderRadius: "50%", background: on ? t.accentContrast : t.textSubtle }} /></div>;
  const on1 = f >= recF + 6;
  const settings = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 8, opacity: setO, transform: `translateX(${slide(actF - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Elige qué avisos quieres recibir" />
      <Card accent={false} pad="12px 14px">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1.5px solid ${on1 ? t.accent : "transparent"}`, background: t.mutedSurface, borderRadius: 12, padding: "12px 12px" }}><div style={{ fontSize: 17, fontWeight: 800 }}>Partido</div>{sw(on1)}</div>
        <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 8 }}>Programación, mensajes y recordatorio del próximo partido.</div>
      </Card>
    </div>
  );
  const sheetK = pop(f, fps, calF + 6, 12) * (1 - ease((f - (actF - 14)) / 8));
  const sheet = sheetK > 0.01 && (
    <div style={{ position: "absolute", left: 12, right: 12, top: BAR_TOP - 92, opacity: Math.min(1, sheetK * 2), transform: `translateY(${(1 - sheetK) * 60}px)`, background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 14, padding: "10px 14px", boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1, color: t.textMuted }}>CALENDARIO · JUEVES · 19:30</div>
      <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>Smash &amp; Lob · Jornada 2</div>
      <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>Polideportivo Pando</div>
    </div>
  );
  const notK = Math.min(ease((f - (llegaF - 12)) / 12), 1 - ease((f - (fechaF + 40)) / 10));
  const notif = notK > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: notK, transform: `translateY(${(1 - notK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Partido programado · Jornada 2</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>Jornada 2 · Jueves 19:30 · Polideportivo Pando</div>
      </div>
    </div>
  );
  const activeTab = f < proF - 8 ? 2 : f < progF - 12 ? 3 : f < actF - 10 ? 2 : 4;
  const ripples = [{ x: NATIVE_W / 2, y: 198, a: progF + 6 }, { x: NATIVE_W * 0.72, y: 240, a: calF - 2 }, { x: 348, y: 111, a: recF + 4 }];

  const TAGS: [number, string][] = [[S1 + 6, "TU PARTIDO"], [elF - 12, "ELIGE UN HUECO"], [proF - 10, "CHAT DE LA JORNADA"], [progF - 14, "PROGRAMAR"], [llegaF - 14, "AVISO A LOS DEMÁS"], [addF - 8, "AÑADIR AL CALENDARIO"], [actF - 10, "AJUSTES · NOTIFICACIONES"]];
  const tagI = f >= S4 - 10 ? -2 : TAGS.reduce((a, [s0], i) => (f >= s0 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0], 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  const example = f >= S1 - 6 && f < actF - 10;

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><Words text={"Ha llegado el día,\n¿cómo *organizas*\ntu próximo *partido*?"} size={96} stagger={4} /></div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn * (1 - winOut), transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})` }}>
            {detO > 0.01 && detail}{chatO > 0.01 && chat}{setO > 0.01 && settings}{sheet}
            <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><TabBar active={activeTab} /></div>
            {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={46} />)}
          </div>
          {notif}
        </div>
      </div>
      {[horF, elF, horaF, lugF, acuF, progF + 6, llegaF, calF, recF + 6].map((m, i) => sfx("pop", Math.max(2, m - 2), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}{sfx("ding", cuaF, 0.4)}{sfx("ding", progF + 18, 0.4)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <OutroSync league={league} ws={sceneWords(6)} /> },
];
export const ORGANIZA2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const OrganizaV2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-organiza-david.mp3" />;
