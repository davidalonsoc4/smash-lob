// Tutorial genérico 9 · Aplazar, lesión y sustituciones: aplazar fuera de fecha, comunicar una incidencia, suplente solo para ese partido,
// los puntos/MVP/pagos son de quien juega y el reemplazo permanente lo hace la organización.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Vs } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen09";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S5 = B30(5), S6 = B30(6), END = B30(7);
  const hookW = ["Qué", "haces", "si", "no", "puedes", "jugar", "tu", "partido"].map((w) => at(0, w));
  const aplF = at(1, "aplazarlo"), sigF = at(1, "pendiente"), puntF = at(1, "puntúa"), bloqF = at(1, "bloquear");
  const lesF = at(2, "lesión"), noPF = at(2, "presenta"), incF = at(2, "incidencia");
  const suplF = at(3, "suplente"), solF = at(3, "solo");
  const ptsF = at(4, "puntos"), mvpF = at(4, "MVP"), pagF = at(4, "pagos");
  const permF = at(5, "permanente"), orgF = at(5, "organización");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S2 - 8), o2 = win(f, S2 - 8, S3 - 8), o3 = win(f, S3 - 8, S5 - 8), o4 = win(f, S5 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const post = f >= aplF + 30;
  const sub = f >= suplF + 20;
  const a1 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Jornada 3" sub="Detalle del partido" right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: post ? "#4a2a12" : t.mutedSurface, color: post ? "#fb923c" : t.text }}>{post ? "Aplazado fuera de fecha" : "Programado"}</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a="Ana" b="Beto" gold /><Vs /><PairBox a="Carla" b="Dani" gold /></div>
      <div style={{ borderRadius: 14, padding: "12px 0", textAlign: "center", fontSize: 15, fontWeight: 900, border: `1.5px solid ${f >= aplF - 6 ? t.accent : t.border}`, color: post ? t.textMuted : t.text, boxShadow: f >= aplF - 6 && !post ? `0 0 16px ${t.accent}66` : "none" }}>Aplazar fuera de fecha</div>
      {post && <Card accent={false} pad="9px 12px"><div style={{ fontSize: 12.5, lineHeight: 1.45, opacity: pop(f, fps, sigF - 4, 10) }}>• Sigue pendiente de jugarse<br /><span style={{ opacity: f >= puntF ? 1 : 0 }}>• No puntúa hasta que se juegue<br /></span><span style={{ opacity: f >= bloqF ? 1 : 0 }}>• Deja de bloquear la jornada siguiente</span></div></Card>}
    </div>
  );
  const INC = ["Lesión", "No se presenta", "Cancelado", "Otro"];
  const a2 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2, transform: `translateX(${slideIn(f, S2 - 8)}px)` }}>
      <HeaderCard title="Comunicar incidencia" sub="Jornada 3" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INC.map((c, i) => { const k = pop(f, fps, (i === 0 ? lesF : i === 1 ? noPF : lesF + 10 + i * 8) - 6, 10), on = (i === 0 && f >= lesF && f < noPF - 6) || (i === 1 && f >= noPF - 6); return <div key={c} style={{ opacity: Math.min(1, k * 2), borderRadius: 999, padding: "8px 14px", fontSize: 13.5, fontWeight: 800, background: on ? t.accent : t.mutedSurface, color: on ? t.accentContrast : t.text }}>{c}</div>; })}
        </div>
        <div style={{ marginTop: 12, borderRadius: 12, padding: "10px 0", textAlign: "center", fontSize: 14.5, fontWeight: 900, background: f >= incF - 4 ? t.accent : t.mutedSurface, color: f >= incF - 4 ? t.accentContrast : t.textMuted }}>Enviar a la administración</div>
        {f >= incF + 14 && <div style={{ marginTop: 8, textAlign: "center", fontSize: 12.5, fontWeight: 800, color: "#34d399", opacity: pop(f, fps, incF + 14, 10) }}>✓ La administración la revisa</div>}
      </Card>
    </div>
  );
  const a3 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o3, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Suplente" sub="Solo para este partido" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <div style={{ textAlign: "center", opacity: sub ? 0.4 : 1 }}><Av i={3} size={52} /><div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 3 }}>Dani</div></div>
          <div style={{ fontSize: 22, color: t.accent, opacity: pop(f, fps, suplF + 8, 10) }}>→</div>
          <div style={{ textAlign: "center", opacity: pop(f, fps, suplF + 14, 10) }}><Av i={6} size={52} ring={sub ? t.accent : undefined} /><div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 3 }}>Gus</div><div style={{ fontSize: 9.5, fontWeight: 900, color: t.accent }}>SUPLENTE</div></div>
        </div>
        {f >= solF && <div style={{ marginTop: 10, textAlign: "center", fontSize: 12.5, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, solF, 10) }}>Solo vale para este partido</div>}
      </Card>
      {f >= ptsF - 10 && (
        <Card accent={false} pad="9px 12px">
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted, marginBottom: 6 }}>SON DE QUIEN JUEGA DE VERDAD</div>
          <div style={{ display: "flex", gap: 8 }}>{[["Puntos", ptsF], ["MVP", mvpF], ["Pagos", pagF]].map(([l, af]) => <div key={l as string} style={{ flex: 1, textAlign: "center", borderRadius: 10, padding: "8px 0", fontSize: 13, fontWeight: 900, background: t.mutedSurface, color: t.accent, opacity: pop(f, fps, (af as number) - 6, 10) }}>{l as string}</div>)}</div>
        </Card>
      )}
    </div>
  );
  const a4 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o4, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Reemplazo permanente" sub="Desde una jornada" />
      <Card accent pad="12px 14px">
        <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: pop(f, fps, permF - 4, 10) }}><Icon name="lock" color={t.accent} size={30} /><div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.3 }}>Lo hace la organización</div></div>
        <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 8, opacity: f >= orgF ? 1 : 0 }}>No se gestiona desde el partido de un jugador.</div>
      </Card>
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "APLAZAR FUERA DE FECHA"], [S2 + 4, "LESIÓN O INCIDENCIA"], [S3 + 4, "SUPLENTE PUNTUAL"], [S5 + 4, "REEMPLAZO PERMANENTE"], [S6 + 4, "CONSULTA QUÉ PERMITE TU LIGA"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Qué haces si no\npuedes jugar\ntu *partido*?"} frames={hookW} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>{o1 > 0.01 && a1}{o2 > 0.01 && a2}{o3 > 0.01 && a3}{o4 > 0.01 && a4}</PhoneWin>
      {[aplF, sigF, puntF, bloqF, lesF, noPF, incF, suplF, solF, ptsF, mvpF, pagF, permF, orgF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen09-david.mp3");
export const GEN09_FRAMES = g.frames;
export const Gen09Aplazar = g.Comp;
