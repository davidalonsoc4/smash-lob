// Tutorial genérico 4 · Estados de un partido: sin programar → programado → pendiente de resultado → finalizado, y el estado especial «aplazado fuera de fecha».
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Vs } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen04";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S6 = B30(6), END = B30(7);
  const hookW = ["En", "qué", "estado", "está", "tu", "partido"].map((w) => at(0, w));
  const progF = at(1, "programar"), lugarF = at(2, "lugar"), programadoF = at(2, "programado");
  const pendF = at(3, "pendiente"), finF = at(3, "finalizado");
  const aplF = at(4, "aplazado"), puntF = at(5, "puntúa"), bloqF = at(5, "bloquear"), sigF = at(5, "siguiente");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S4 - 8), o2 = win(f, S4 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const state = f < S2 - 4 ? 0 : f < pendF - 6 ? 1 : f < finF - 6 ? 2 : 3;
  const CH: [string, string, string][] = [["Sin programar", t.mutedSurface, t.text], ["Programado", t.mutedSurface, t.text], ["Pendiente resultado", "#3b2f12", "#f2c14e"], ["Finalizado", "#0f3d2e", "#34d399"]];
  const [lab, bg, fg] = CH[state];
  const unl = f >= sigF + 16;
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "SIN PROGRAMAR"], [S2 + 4, "PROGRAMADO"], [S3 + 4, "PENDIENTE · FINALIZADO"], [S4 + 4, "APLAZADO FUERA DE FECHA"], [S6 + 4, "CONSULTA EL ESTADO DE TU PARTIDO"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿En qué *estado*\nestá tu partido?"} frames={hookW} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {o1 > 0.01 && (
          <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1 }}>
            <HeaderCard title="Partidos" sub="Jornada 2" />
            <Card accent pad="10px 12px">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Jornada 2</div>
                <div key={state} style={{ fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: bg, color: fg, transform: `scale(${1 + 0.12 * Math.max(0, 1 - (f - (state === 0 ? S1 : state === 1 ? S2 - 4 : state === 2 ? pendF - 6 : finF - 6)) / 10)})` }}>{lab}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}><PairBox a="Ana" b="Beto" gold /><Vs /><PairBox a="Carla" b="Dani" gold /></div>
              <div style={{ fontSize: 12.5, marginTop: 8, color: state === 0 ? t.textMuted : t.text, display: "flex", alignItems: "center", gap: 6 }}>
                {state === 0 ? "Falta añadir hora, fecha y lugar" : <><Icon name="clock" color={t.accent} size={15} />Jueves · 19:30 · Polideportivo</>}
                {state === 3 && <span style={{ marginLeft: "auto", fontSize: 16, fontWeight: 900, color: "#34d399" }}>2 – 1</span>}
              </div>
            </Card>
            <div style={{ fontSize: 11.5, color: t.textMuted, textAlign: "center", opacity: pop(f, fps, lugarF - 4, 10) }}>{state === 1 ? "Ya tiene fecha, hora o lugar" : ""}</div>
          </div>
        )}
        {o2 > 0.01 && (
          <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2 }}>
            <HeaderCard title="Partidos" sub="Jornada 3" />
            <Card accent pad="10px 12px">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 15, fontWeight: 800 }}>Jornada 3</div><div style={{ fontSize: 12, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: "#4a2a12", color: "#fb923c", opacity: pop(f, fps, aplF - 4, 10) }}>Aplazado fuera de fecha</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}><PairBox a="Ana" b="Carla" /><Vs /><PairBox a="Beto" b="Dani" /></div>
              <div style={{ fontSize: 12.5, marginTop: 8, color: t.textMuted, opacity: pop(f, fps, puntF - 30, 10) }}>Pendiente de jugarse · necesita nueva fecha</div>
            </Card>
            <div style={{ display: "flex", gap: 8, opacity: pop(f, fps, puntF - 6, 10) }}>
              <div style={{ flex: 1, background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: "9px 10px", fontSize: 12.5, fontWeight: 700 }}>No puntúa hasta que se juegue</div>
              <div style={{ flex: 1, background: t.surface, border: `1.5px solid ${unl ? t.accent : t.border}`, borderRadius: 14, padding: "9px 10px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>{unl ? "Jornada 4 abierta" : "Jornada 4"}<Icon name="lock" color={unl ? t.accent : t.textMuted} size={16} /></div>
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, textAlign: "center", opacity: pop(f, fps, bloqF, 10) }}>Deja de bloquear la jornada siguiente</div>
          </div>
        )}
      </PhoneWin>
      {[progF, programadoF, pendF, finF, aplF, puntF, bloqF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen04-david.mp3");
export const GEN04_FRAMES = g.frames;
export const Gen04Estados = g.Comp;
