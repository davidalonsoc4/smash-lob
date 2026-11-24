// Tutorial genérico 16 · Estadísticas y récords: lo más destacado (más victorias, mejor diferencia, mejor racha) y los cinco análisis
// (clasificación, cara a cara, análisis individual, evolución de la liga, récords).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { HeaderCard } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen16";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), S7 = B30(7), END = B30(8);
  const hookW = ["Descubre", "qué", "cuentan", "tus", "resultados"].map((w) => at(0, w));
  const vicF = at(1, "victorias"), difF = at(1, "diferencia"), rachaF = at(1, "racha");
  const clasF = at(2, "clasificación"), caraF = at(3, "cara"), indF = at(4, "individual"), evoF = at(5, "evolución"), recF = at(6, "récords");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o = win(f, S1 - 10, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const HI: [string, string, string, number, number][] = [["Más victorias", "Ana", "5", vicF, 0], ["Mejor diferencia", "Beto", "+14", difF, 1], ["Mejor racha", "Carla", "4", rachaF, 2]];
  const AN: [string, string, number, string][] = [["Clasificación", "Tabla completa, puntos y balance", clasF, "rank"], ["Cara a cara", "Compara a dos jugadores", caraF, "user"], ["Análisis individual", "Compañero más fuerte, rivales y récords", indF, "ball"], ["Evolución de la liga", "Posición, puntos y diferencia", evoF, "layers"], ["Récords", "Los mejores registros de la liga", recF, "trophy"]];
  const cur = f >= recF - 6 ? 4 : f >= evoF - 6 ? 3 : f >= indF - 6 ? 2 : f >= caraF - 6 ? 1 : f >= clasF - 6 ? 0 : -1;
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "LO MÁS DESTACADO"], [S2 + 4, "CLASIFICACIÓN"], [S3 + 4, "CARA A CARA"], [S4 + 4, "ANÁLISIS INDIVIDUAL"], [S5 + 4, "EVOLUCIÓN"], [S6 + 4, "RÉCORDS"], [S7 + 4, "BUSCA TU MEJOR RACHA"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Descubre qué\ncuentan tus\n*resultados*"} frames={hookW} size={110} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {o > 0.01 && (
          <div style={{ ...base, display: "flex", flexDirection: "column", gap: 7, opacity: o }}>
            <HeaderCard title="Estadísticas" sub="Lo más destacado de la temporada" />
            <div style={{ display: "flex", gap: 6 }}>
              {HI.map(([l, n, v, af, i]) => { const k = pop(f, fps, af - 6, 11), hot = f >= af - 6 && f < af + 40; return (
                <div key={l} style={{ flex: 1, opacity: Math.min(1, k * 2), background: t.surface, border: `1.5px solid ${hot || f >= S2 ? (hot ? t.accent : t.border) : t.border}`, borderRadius: 12, padding: "7px 8px", textAlign: "center", transform: `scale(${hot ? 1.04 : 1})` }}>
                  <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: 0.8, color: t.textMuted }}>{l.toUpperCase()}</div>
                  <div style={{ display: "flex", justifyContent: "center", margin: "5px 0 2px" }}><Av i={i} size={28} /></div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 16, fontWeight: 900, color: t.accent }}>{v}</div>
                </div>
              ); })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted, padding: "2px 2px 0", opacity: pop(f, fps, S2 - 6, 10) }}>EXPLORAR ESTADÍSTICAS</div>
            {AN.map(([title, desc, af, ico], i) => { const k = pop(f, fps, af - 12, 11), hot = i === cur; return (
              <div key={title} style={{ opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 10, background: hot ? `${t.accent}26` : t.surface, border: `1.5px solid ${hot ? t.accent : t.border}`, borderRadius: 12, padding: "6px 10px", transform: `scale(${hot ? 1.02 : 1})` }}>
                <Icon name={ico} color={hot ? t.accent : t.textMuted} size={20} /><div><div style={{ fontSize: 14, fontWeight: 800, color: hot ? t.accent : t.text }}>{title}</div><div style={{ fontSize: 10.5, color: t.textMuted }}>{desc}</div></div>
              </div>
            ); })}
          </div>
        )}
      </PhoneWin>
      {[vicF, difF, rachaF, clasF, caraF, indF, evoF, recF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 8, "voice-gen16-david.mp3");
export const GEN16_FRAMES = g.frames;
export const Gen16Estadisticas = g.Comp;
