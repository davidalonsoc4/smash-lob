// Tutorial genérico 2 · Cómo se puntúa: cada set ganado = 1 punto (3-0 → 3/0, 2-1 → 2/1), si la liga no exige 3 sets solo cuentan los jugados,
// orden: puntos → diferencia de juegos → juegos a favor, y todo se actualiza al guardar cada resultado. Avatares y nombres genéricos.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { ease } from "./Presentacion2";
import { SyncWords } from "./SyncWords";
import { Av, Tags, mkGen, mkTiming } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen02";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Marcador de un partido: filas de pareja con puntos por set (pips) y puntos totales */
const Score: React.FC<{ x: number; y: number; sets: [number, number][]; winnerLeft: boolean; showPts: number; played?: number; opacity: number }> = ({ x, y, sets, winnerLeft, showPts, played = 3, opacity }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pts = (r: 0 | 1) => sets.slice(0, played).filter(([a, b]) => (r === 0 ? a > b : b > a)).length;
  void winnerLeft;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 860, opacity }}>
      {[0, 1].map((r) => (
        <div key={r} style={{ display: "flex", alignItems: "center", gap: 18, background: t.surface, border: `2px solid ${t.border}`, borderRadius: 30, padding: "22px 28px", marginBottom: 18 }}>
          <div style={{ width: 230, fontSize: 40, fontWeight: 800 }}>{r === 0 ? "Ana y Beto" : "Carla y Dani"}</div>
          {sets.map(([a, b], k) => {
            const won = k < played && (r === 0 ? a > b : b > a);
            return <div key={k} style={{ width: 96, height: 96, borderRadius: 22, border: `3px ${k >= played ? "dashed" : "solid"} ${won ? t.accent : t.border}`, background: won ? `${t.accent}22` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 900, opacity: k >= played ? 0.35 : 1 }}>{k >= played ? "–" : r === 0 ? a : b}</div>;
          })}
          <div style={{ flex: 1 }} />
          <div style={{ minWidth: 110, height: 96, borderRadius: 48, background: pts(r as 0 | 1) > 0 ? t.accent : t.mutedSurface, color: pts(r as 0 | 1) > 0 ? t.accentContrast : t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54, fontWeight: 900, transform: `scale(${0.7 + 0.3 * pop(f, fps, showPts + r * 8, 9)})`, opacity: Math.min(1, pop(f, fps, showPts + r * 8, 9) * 2) }}>{pts(r as 0 | 1)} <span style={{ fontSize: 26, marginLeft: 6, opacity: 0.8 }}>pts</span></div>
        </div>
      ))}
    </div>
  );
};

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), END = B30(7);
  const hookW = ["Cómo", "se", "puntúa", "en", "Smash", "&", "Lob"].map((w) => at(0, w));
  const setF = at(1, "set"), puntoF = at(1, "punto");
  const tresF = at(2, "tres", 1), dosF = at(2, "dos"), pierdeF = at(2, "pierde");
  const jugarF = at(3, "jugar"), cuentanF = at(3, "cuentan");
  const ordenF = at(4, "ordena"), puntosF = at(4, "puntos"), difF = at(4, "diferencia"), favorF = at(4, "favor");
  const guardaF = at(5, "guarda"), actF = at(5, "actualiza");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = Math.min(ease((f - (S1 - 8)) / 12), 1 - ease((f - (S2 - 10)) / 10));
  const o2a = Math.min(ease((f - (S2 - 8)) / 12), 1 - ease((f - (S3 - 10)) / 10));
  const o3 = Math.min(ease((f - (S3 - 8)) / 12), 1 - ease((f - (S4 - 10)) / 10));
  const o4 = Math.min(ease((f - (S4 - 8)) / 12), 1 - ease((f - (END - 12)) / 10));
  // marcador de ejemplo del bloque 2: 3-0 y luego 2-1
  const swap = f >= dosF - 10;
  const sets2: [number, number][] = swap ? [[6, 4], [3, 6], [6, 2]] : [[6, 4], [6, 3], [6, 2]];
  // clasificación
  const NAMES = ["Ana", "Beto", "Carla", "Dani"];
  const PTS0: Record<string, [number, number, number]> = { Carla: [12, 4, 51], Ana: [12, 2, 49], Dani: [10, 1, 44], Beto: [8, -1, 40] };
  const PTS1: Record<string, [number, number, number]> = { Carla: [13, 5, 54], Ana: [14, 6, 55], Dani: [10, 1, 44], Beto: [8, -1, 40] };
  const ORD0 = ["Carla", "Ana", "Dani", "Beto"], ORD1 = ["Ana", "Carla", "Dani", "Beto"];
  const mv = ease((f - (actF + 4)) / 24);
  const saveK = f >= guardaF - 4 && f < guardaF + 24;
  const dim = (c: number) => (f >= ordenF && f < favorF + 40 ? (c === 0 && f >= puntosF - 4 ? 1 : c === 1 && f >= difF - 4 ? 1 : c === 2 && f >= favorF - 4 ? 1 : 0.35) : 1);
  const Tbl = (
    <div style={{ position: "absolute", left: 110, right: 110, top: 520, opacity: o4 }}>
      <div style={{ display: "flex", padding: "0 30px 10px 140px", fontSize: 26, fontWeight: 900, letterSpacing: 2, color: t.textMuted }}>
        <div style={{ flex: 1 }}>JUGADOR</div><div style={{ width: 130, textAlign: "right", opacity: dim(0), color: dim(0) === 1 && f >= ordenF ? t.accent : t.textMuted }}>PTS</div><div style={{ width: 130, textAlign: "right", opacity: dim(1), color: dim(1) === 1 && f >= difF - 4 ? t.accent : t.textMuted }}>DIF</div><div style={{ width: 130, textAlign: "right", opacity: dim(2), color: dim(2) === 1 && f >= favorF - 4 ? t.accent : t.textMuted }}>JF</div>
      </div>
      <div style={{ position: "relative", height: 4 * 128 }}>
        {NAMES.map((n, i) => {
          const p0 = ORD0.indexOf(n), p1 = ORD1.indexOf(n), pos = lerp(p0, p1, mv);
          const v0 = PTS0[n], v1 = PTS1[n];
          const v = [0, 1, 2].map((c) => Math.round(lerp(v0[c], v1[c], mv)));
          const up = p1 < p0 && mv > 0.1;
          const k = pop(f, fps, S4 + 4 + p0 * 5, 11);
          return (
            <div key={n} style={{ position: "absolute", left: 0, right: 0, top: pos * 128, opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 20, background: up ? `${t.accent}33` : t.surface, border: `2px solid ${up ? t.accent : t.border}`, borderRadius: 28, padding: "16px 30px", height: 108, boxSizing: "border-box" }}>
              <div style={{ width: 40, fontSize: 40, fontWeight: 900 }}>{Math.round(pos) + 1}</div>
              <Av i={NAMES.indexOf(n) === 2 ? 2 : i} size={72} />
              <div style={{ flex: 1, fontSize: 42, fontWeight: 800 }}>{n}</div>
              <div style={{ width: 130, textAlign: "right", fontSize: 44, fontWeight: 900, opacity: dim(0) }}>{v[0]}</div>
              <div style={{ width: 130, textAlign: "right", fontSize: 40, fontWeight: 800, opacity: dim(1) }}>{v[1] > 0 ? "+" : ""}{v[1]}</div>
              <div style={{ width: 130, textAlign: "right", fontSize: 40, fontWeight: 800, opacity: dim(2) }}>{v[2]}</div>
            </div>
          );
        })}
      </div>
      {f >= ordenF && f < guardaF - 20 && <div style={{ marginTop: 24, textAlign: "center", fontSize: 32, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, ordenF, 10) }}>Ana y Carla empatan a puntos: decide la diferencia</div>}
      {f >= guardaF - 20 && f < actF + 40 && <div style={{ marginTop: 28, display: "flex", justifyContent: "center", opacity: pop(f, fps, guardaF - 20, 10) }}><div style={{ background: t.accent, color: t.accentContrast, borderRadius: 24, padding: "22px 60px", fontSize: 44, fontWeight: 900, transform: `scale(${saveK ? 0.96 : 1})`, boxShadow: saveK ? `0 0 0 8px ${t.accent}44` : "none" }}>Guardar resultado</div></div>}
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "CADA SET = 1 PUNTO"], [S2 + 4, "TRES A CERO · DOS A UNO"], [S3 + 4, "SOLO LOS SETS JUGADOS"], [S4 + 4, "ORDEN DE LA TABLA"], [S5 + 4, "SE ACTUALIZA SOLA"], [S6 + 4, "CONSULTA LA CLASIFICACIÓN DE TU LIGA"]]} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Cómo se *puntúa*\nen Smash and Lob?"} frames={hookW} size={104} /></div>
      <Score x={110} y={560} sets={[[6, 4], [4, 6], [6, 2]]} winnerLeft played={f >= puntoF - 10 ? 1 : 1} showPts={puntoF - 4} opacity={o1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", opacity: o1 * pop(f, fps, setF - 4, 10) }}><span style={{ fontSize: 120, fontWeight: 900, color: t.accent }}>1 set</span><span style={{ fontSize: 70, fontWeight: 900 }}> = </span><span style={{ fontSize: 120, fontWeight: 900, color: t.accent }}>1 punto</span></div>
      <Score x={110} y={520} sets={sets2} winnerLeft showPts={f < dosF - 10 ? tresF : dosF} opacity={o2a} />
      <div style={{ position: "absolute", left: 110, right: 110, top: 880, textAlign: "center", fontSize: 50, fontWeight: 800, color: t.textMuted, opacity: o2a * pop(f, fps, (swap ? pierdeF : tresF) + 6, 10) }}>{swap ? "Dos a uno: 2 puntos y 1 para quien pierde" : "Tres a cero: 3 puntos para la pareja ganadora"}</div>
      <Score x={110} y={520} sets={[[6, 2], [6, 3], [6, 0]]} winnerLeft played={2} showPts={cuentanF} opacity={o3} />
      <div style={{ position: "absolute", left: 110, right: 110, top: 880, textAlign: "center", fontSize: 50, fontWeight: 800, color: t.textMuted, opacity: o3 * pop(f, fps, jugarF + 4, 10) }}>Si la liga no exige los tres sets, cuentan solo los jugados</div>
      {Tbl}
      <div style={{ position: "absolute", top: 1140, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, Math.max(0, (f - (S6 - 4)) / 8)) * (1 - ease((f - (END - 12)) / 10)) }}><SyncWords text={"Consulta la *clasificación*\nde tu *liga*"} frames={["Consulta", "la", "clasificación", "de", "tu", "liga"].map((w) => at(6, w))} size={68} /></div>
      {[setF, puntoF, tresF, dosF, jugarF, cuentanF, puntosF, difF, favorF, guardaF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen02-david.mp3");
export const GEN02_FRAMES = g.frames;
export const Gen02Puntuacion = g.Comp;
