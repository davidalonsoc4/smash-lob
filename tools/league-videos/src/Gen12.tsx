// Vídeo genérico de ayuda «Instalar la app y activar los avisos» (sin liga ni jugadores concretos).
// Android (botón Instalar) → iPhone (Compartir → Añadir a pantalla de inicio) → abrirla desde el icono → activar notificaciones
// (con un aviso de ejemplo) → «en iPhone la app tiene que estar instalada» → «Hazlo ahora: son dos minutos».
// Voz: David Martin · Eleven v3 (una toma, pausas por bloques). Réplicas de pantalla con datos ficticios.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, Ripple, SCR_H, WIN_H, WIN_W, Z } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceGen12";

const ACCENT = "#d7a544";
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const win = (f: number, a: number, b: number) => Math.min(ease((f - a) / 12), 1 - ease((f - b) / 10));

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6);
  const hookW = ["Instala", "Smash", "and", "Lob", "en", "tu", "móvil"].map((w) => at(0, w));
  const ofF = at(1, "ofrezca"), insF = at(1, "Instalar");
  const comF = at(2, "Compartir"), añaF = at(2, "Añadir");
  const iconF = at(3, "icono");
  const notiF = at(4, "notificaciones"), partF = at(4, "partido"), sorF = at(4, "sorteo");
  const ipF = at(5, "iPhone"), insdF = at(5, "instalada");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const winIn = ease((f - (S1 - 12)) / 20), winOut = ease((f - (S6 - 12)) / 12);

  const aO = win(f, S1 - 10, S2 - 8), iO = win(f, S2 - 8, S3 - 8), hO = win(f, S3 - 8, S4 - 8), nO = win(f, S4 - 8, S5 - 8), cO = win(f, S5 - 8, S6 - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };

  /* Android: tarjeta de instalación (réplica del aviso de la app) */
  const cardK = pop(f, fps, ofF - 8, 12);
  const installing = f >= insF + 6;
  const android = (
    <div style={{ ...base, opacity: aO }}>
      <HeaderCard title="Mis Competiciones" sub="Tus ligas y torneos" />
      <div style={{ marginTop: 8 }}><Card accent><div style={{ height: 70 }} /></Card></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 262, opacity: Math.min(1, cardK * 2), transform: `translateY(${(1 - cardK) * 80}px)` }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 12, boxShadow: "0 8px 30px rgba(0,0,0,.5)", color: "#111" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Img src={staticFile("logo.png")} style={{ width: 38, height: 38, borderRadius: 10 }} />
            <div><div style={{ fontSize: 14.5, fontWeight: 900 }}>Instala Smash &amp; Lob</div><div style={{ fontSize: 11.5, color: "#555", marginTop: 3, lineHeight: 1.35 }}>Accede como una app del móvil, sin buscarla en el navegador.</div></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ background: "#0a0a0a", color: "#fff", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 900, boxShadow: installing ? `0 0 0 3px ${ACCENT}` : "none" }}>{installing ? "Instalando…" : "Instalar"}</div>
            <div style={{ background: "#eee", color: "#333", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 800 }}>Ahora no</div>
          </div>
        </div>
      </div>
    </div>
  );

  /* iPhone: barra de Safari + hoja Compartir */
  const sheetK = ease((f - (comF - 4)) / 14);
  const rowHot = f >= añaF - 4;
  const iphone = (
    <div style={{ position: "absolute", inset: 0, opacity: iO }}>
      <div style={{ ...base }}><HeaderCard title="Mis Competiciones" sub="Tus ligas y torneos" /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 410, height: 64, background: "#1c1c1e", borderTop: "1px solid #333", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {["‹", "›"].map((s) => <div key={s} style={{ fontSize: 26, color: "#6b6b70" }}>{s}</div>)}
        <div style={{ borderRadius: 10, padding: 6, background: f >= comF - 6 && f < comF + 10 ? `${ACCENT}44` : "transparent" }}><Icon name="share" color="#4c9aff" size={24} /></div>
        <Icon name="cal" color="#6b6b70" size={24} /><Icon name="layers" color="#6b6b70" size={24} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 276, background: "#2a2a2e", borderRadius: "22px 22px 0 0", transform: `translateY(${(1 - sheetK) * 290}px)`, padding: "14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid #3d3d42" }}>
          <Img src={staticFile("logo.png")} style={{ width: 34, height: 34, borderRadius: 9 }} /><div><div style={{ fontSize: 14, fontWeight: 800 }}>Smash &amp; Lob</div><div style={{ fontSize: 11, color: "#8e8e93" }}>Opciones</div></div>
        </div>
        {["Copiar", "Añadir a marcadores", "Añadir a pantalla de inicio", "Imprimir"].map((r, i) => {
          const hot = i === 2 && rowHot;
          return <div key={r} style={{ marginTop: 6, padding: "10px 12px", borderRadius: 10, background: hot ? ACCENT : "#333338", color: hot ? "#1a1a1a" : "#eee", fontSize: 14.5, fontWeight: hot ? 900 : 700, display: "flex", justifyContent: "space-between" }}><span>{r}</span><span>{i === 2 ? "＋" : ""}</span></div>;
        })}
      </div>
    </div>
  );

  /* pantalla de inicio con el icono */
  const openK = ease((f - (iconF + 8)) / 14);
  const tapIcon = f >= iconF - 8 && f < iconF + 14;
  const grid = [["#4c6ef5", "#fa5252", "#40c057", "#fab005"], ["#7950f2", "APP", "#15aabf", "#fd7e14"], ["#e64980", "#12b886", "#868e96", "#228be6"]];
  const home = (
    <div style={{ position: "absolute", inset: 0, opacity: hO, background: "linear-gradient(160deg,#16213e,#0f0f1a 60%,#1a1233)" }}>
      <div style={{ position: "absolute", top: 40, left: 18, right: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26 }}>
        {grid.flat().map((c, i) => c === "APP" ? (
          <div key={i} style={{ textAlign: "center", transform: `scale(${1 + (tapIcon ? 0.12 : 0)})` }}>
            <Img src={staticFile("logo.png")} style={{ width: 62, height: 62, borderRadius: 16, boxShadow: tapIcon ? `0 0 22px ${ACCENT}` : "none" }} />
            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 700 }}>Smash &amp; Lob</div>
          </div>
        ) : <div key={i} style={{ width: 62, height: 62, borderRadius: 16, background: c, opacity: 0.85 }} />)}
      </div>
      {openK > 0.01 && <div style={{ position: "absolute", inset: 0, background: t.bg, opacity: openK, display: "flex", alignItems: "center", justifyContent: "center" }}><Img src={staticFile("logo.png")} style={{ width: 110 * (0.6 + 0.4 * openK), height: 110 * (0.6 + 0.4 * openK), borderRadius: 26 }} /></div>}
    </div>
  );

  /* Ajustes → Notificaciones: activar en el dispositivo + aviso de ejemplo */
  const on = f >= notiF + 22;
  const ntK = Math.min(ease((f - (sorF - 12)) / 12), 1 - ease((f - (S5 - 14)) / 10));
  const notif = (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: ntK, transform: `translateY(${(1 - ntK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Sorteo del saque</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>¡Ya puedes sortear el saque de tu partido!</div>
      </div>
    </div>
  );
  const notifs = (
    <div style={{ ...base, opacity: nO }}>
      <HeaderCard title="Notificaciones" sub="Elige qué avisos quieres recibir" />
      <div style={{ marginTop: 8 }}>
        <Card accent={false} pad="12px 14px">
          <div style={{ fontSize: 16, fontWeight: 800 }}>Avisos en este dispositivo</div>
          <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 4, lineHeight: 1.35 }}>Recibe avisos de partido, sorteo y resultados.</div>
          <div style={{ marginTop: 10, borderRadius: 12, padding: "11px 0", textAlign: "center", fontSize: 15, fontWeight: 900, background: on ? t.mutedSurface : t.accent, color: on ? "#34d399" : t.accentContrast }}>{on ? "✓ Notificaciones activadas" : "Activar notificaciones"}</div>
        </Card>
      </div>
    </div>
  );

  /* iPhone: instala primero, avisos después */
  const c1 = pop(f, fps, ipF + 4, 12), c2 = pop(f, fps, insdF - 6, 12);
  const chip = (k: number, n: number, label: string, ico: string) => (
    <div style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.9 + 0.1 * k})`, display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 16, padding: "14px 16px" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.accent, color: t.accentContrast, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
      <Icon name={ico} color={t.accent} size={24} /><div style={{ fontSize: 17, fontWeight: 800 }}>{label}</div>
    </div>
  );
  const callout = (
    <div style={{ ...base, top: 120, opacity: cO }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {chip(c1, 1, "Instala la app", "plus")}
        {chip(c2, 2, "Después, los avisos", "bell")}
      </div>
    </div>
  );

  const TAGS: [number, string][] = [[S1 + 4, "ANDROID"], [S2 + 4, "IPHONE"], [S3 + 4, "ABRIR LA APP"], [S4 + 4, "NOTIFICACIONES"], [S5 + 4, "EN IPHONE"]];
  const tagI = f >= S6 - 10 ? -2 : TAGS.reduce((a, [s0], i) => (f >= s0 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0], 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  const ripples = [{ x: 60, y: 332, a: insF - 2 }, { x: 206, y: 442, a: comF - 4 }, { x: 206, y: 362, a: añaF - 2 }, { x: 155, y: 160, a: iconF - 2 }, { x: 206, y: 190, a: notiF + 20 }];

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: hookO }}>
        <Img src={staticFile("logo.png")} style={{ width: 230, height: 230, borderRadius: 52, transform: `scale(${pop(f, fps, 4, 9)})`, boxShadow: `0 0 80px ${ACCENT}66` }} />
        <div style={{ height: 50 }} />
        <SyncWords text={"Instala *Smash & Lob*\nen tu móvil"} frames={hookW.slice(0, 1).concat(hookW.slice(1, 2), hookW.slice(2, 3), hookW.slice(3, 4), hookW.slice(4, 5), hookW.slice(5, 6), hookW.slice(6, 7))} size={92} />
      </div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn * (1 - winOut), transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})` }}>
            {aO > 0.01 && android}{iO > 0.01 && iphone}{hO > 0.01 && home}{nO > 0.01 && notifs}{cO > 0.01 && callout}
            {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
          </div>
          {notif}
        </div>
      </div>
      {[insF, comF, añaF, iconF, notiF + 20, partF, sorF, ipF, insdF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}{sfx("ding", sorF - 6, 0.4)}
    </Frame>
  );
};

/* Cierre propio: «Hazlo ahora: son dos minutos.» */
const Outro: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const mF = wf(ws, "minutos");
  const bounce = Math.abs(Math.sin((f - mF) / 7)) * 60 * Math.exp(-Math.max(0, f - mF) / 40);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile("logo.png")} style={{ width: 260, height: 260, borderRadius: 58, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})`, boxShadow: `0 0 80px ${t.accent}66` }} />
      <div style={{ height: 40 }} />
      <SyncWords text={"Hazlo *ahora*"} frames={[wf(ws, "Hazlo"), wf(ws, "ahora")]} size={124} />
      <div style={{ height: 24 }} />
      <SyncWords text={"son dos *minutos*"} frames={[wf(ws, "son"), wf(ws, "dos"), mF]} size={80} />
      <div style={{ marginTop: 64, opacity: pop(f, fps, mF, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {sfx("ding", mF, 0.5)}
    </Frame>
  );
};

const makeScenes = (): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Outro ws={sceneWords(6)} /> },
];
export const GEN12_FRAMES = totalFrames(makeScenes());
export const Gen12Instalar: React.FC = () => <VideoSeries scenes={makeScenes()} accent={ACCENT} voice="voice-gen12-david.mp3" />;
void WIN_H;
