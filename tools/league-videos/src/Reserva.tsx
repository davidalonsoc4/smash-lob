// Vídeo «Confirmación de la reserva» (1-dic): ya hay pista. Tarjeta de la jornada de apertura (domingo 20 de diciembre, Polideportivo Pando,
// hora exacta) → «No será solo jugar: reserva ese domingo para nosotros» (sello RESERVADO) → cierre propio: «Ya queda menos. Nos vemos en la pista».
// Sin plan del día (va en otro vídeo). La hora (HORA) es un dato aparte: al confirmarla se cambia aquí y se regenera solo su frase en la voz.
// Voz: David Martin · Eleven v3 (una toma, pausas por bloques con retime_voice.py).
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, pop, sfx, totalFrames, useTheme } from "./kit";
import { OpeningCard, Zoom } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { ease } from "./Presentacion2";
import { SyncWords } from "./SyncWords";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceReserva";

export const HORA = "12:00"; // hora exacta (provisional hasta confirmar la reserva)

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3);
  const hookW = ["Es", "oficial", "ya", "tenemos", "pista"].map((w) => at(0, w));
  const apF = at(1, "apertura"), polF = at(1, "Polideportivo"), horaF = at(1, "12:00");
  const resF = at(2, "reserva"), domF = at(2, "domingo"), nosF = at(2, "nosotros");
  const hookO = 1 - ease((f - (S1 - 18)) / 12);
  const cardK = ease((f - (S1 - 6)) / 18) * (1 - ease((f - (S3 - 14)) / 12));
  const shrink = ease((f - (S2 - 6)) / 18);                     // en el bloque 2 la tarjeta baja y se hace más pequeña
  const stampK = pop(f, fps, resF + 2, 9);
  const tagK = pop(f, fps, S1 + 4, 12) * (1 - ease((f - (S3 - 14)) / 12));
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  const textO = ease((f - (S2 - 2)) / 12) * (1 - ease((f - (S3 - 14)) / 12));
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: tagK }}><div style={{ transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>JORNADA DE APERTURA</div></div>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Es *oficial*:\nya tenemos\n*pista*"} frames={hookW} size={118} /></div>
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: textO }}>
        <SyncWords text={"No será solo\n*jugar*"} frames={[at(2, "No"), at(2, "será"), at(2, "solo"), at(2, "jugar")]} size={104} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330 + shrink * 330, display: "flex", justifyContent: "center", opacity: cardK, transform: `translateY(${(1 - cardK) * 140}px) scale(${(0.94 + 0.06 * cardK) * (1 - 0.2 * shrink)})`, transformOrigin: "50% 0" }}>
        <div style={{ position: "relative" }}>
          <Zoom z={2.1}><OpeningCard eyebrow="JORNADA DE APERTURA" weekday="DOMINGO" day="20" month="DICIEMBRE" place={league.opening.place} time={f >= horaF - 4 ? HORA : null} note={league.name} placeP={pop(f, fps, polF - 6, 11)} timeP={pop(f, fps, horaF - 4, 10)} noteP={pop(f, fps, S1 + 6, 11)} /></Zoom>
          {stampK > 0.01 && (
            <div style={{ position: "absolute", left: "50%", top: "97%", transform: `translate(-50%, -50%) rotate(-7deg) scale(${1.5 - 0.5 * stampK})`, opacity: Math.min(1, stampK * 1.6), border: `10px solid ${t.accentContrast}`, color: t.accentContrast, background: `${t.accent}`, borderRadius: 26, padding: "10px 44px", fontSize: 92, fontWeight: 900, letterSpacing: 6, boxShadow: "0 14px 50px rgba(0,0,0,.45)" }}>RESERVADO</div>
          )}
        </div>
      </div>
      {[apF, polF, horaF].map((m, i) => sfx("pop", Math.max(2, m - 4), 0.3 + (i === 2 ? 0.1 : 0)))}{sfx("ding", resF + 2, 0.5)}
      <div style={{ opacity: 0 }}>{domF + nosF}</div>
    </Frame>
  );
};

/* Cierre propio: «Ya queda menos. Nos vemos en la pista.» (cada palabra, cuando la dice la voz) */
const Outro = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const nF = wf(ws, "pista");
  const bounce = Math.abs(Math.sin((f - nF) / 7)) * 60 * Math.exp(-Math.max(0, f - nF) / 40);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile(league.logo)} style={{ width: 300, height: 300, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 30 }} />
      <SyncWords text={"Ya queda *menos*"} frames={[wf(ws, "Ya"), wf(ws, "queda"), wf(ws, "menos")]} size={118} />
      <div style={{ height: 26 }} />
      <SyncWords text={"Nos vemos en la *pista*"} frames={[wf(ws, "Nos"), wf(ws, "vemos"), wf(ws, "en"), wf(ws, "la"), nF]} size={74} />
      <div style={{ marginTop: 40, opacity: pop(f, fps, nF, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {sfx("ding", nF, 0.5)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[3] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 3)} /> },
  { key: "outro", dur: Math.round((BOUNDS[4] - BOUNDS[3]) * 30), C: () => <Outro league={league} ws={sceneWords(3)} /> },
];
export const RESERVA_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Reserva: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-reserva-david.mp3" />;
