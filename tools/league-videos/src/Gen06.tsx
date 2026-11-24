// Tutorial genérico 6 · Subir el resultado: Registrar resultado, cada set ganado suma un punto, tres sets obligatorios o solo los jugados,
// y los tres modos de confirmación (sin confirmaciones / adicional / obligatoria con validación a las 24 h). Nombres y avatares genéricos.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Ripple, Vs } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen06";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const N = ["Ana", "Beto", "Carla", "Dani"];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), S7 = B30(7), END = B30(8);
  const hookW = ["Has", "terminado", "de", "jugar", "registra", "el", "resultado"].map((w) => at(0, w));
  const regF = at(1, "Registrar");
  const juegosF = at(2, "juegos"), setF = at(2, "set", 1), puntoF = at(2, "punto");
  const treF = at(3, "tres"), soloF = at(3, "solo");
  const c1F = at(4, "confirmaciones"), c2F = at(5, "adicional"), c3F = at(6, "obligatoria"), confirmarloF = at(5, "confirmarlo"), h24F = at(6, "24");
  const clasF = at(7, "clasificación");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const detO = win(f, S1 - 10, regF + 14), formO = win(f, regF + 12, S4 - 8), modO = win(f, S4 - 8, S7 - 8), rankO = win(f, S7 - 8, END - 14);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const names = N;
  // marcador
  const rows = [[6, 4, 6], [3, 6, 2]];
  const setAt = [juegosF + 6, juegosF + 22, juegosF + 38];
  const solo = f >= soloF - 6;                       // modo «solo los sets jugados»: el tercer set queda sin jugar
  const shown = (k: number) => f >= setAt[k] && !(solo && k === 2);
  const total = (r: number) => [0, 1, 2].reduce((a, k) => a + (shown(k) && rows[r][k] > rows[1 - r][k] ? 1 : 0), 0);
  const detail = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Jornada 1" sub="Detalle del partido" right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: "#3b2f12", color: "#f2c14e" }}>Pendiente resultado</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={names[0]} b={names[1]} gold /><Vs /><PairBox a={names[2]} b={names[3]} gold /></div>
      <div style={{ borderRadius: 14, padding: "12px 0", textAlign: "center", fontSize: 15.5, fontWeight: 900, background: t.accent, color: t.accentContrast, marginTop: 6, boxShadow: f >= regF - 8 ? `0 0 18px ${t.accent}aa` : "none" }}>Registrar resultado</div>
    </div>
  );
  const form = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: formO, transform: `translateX(${slideIn(f, regF + 12)}px)` }}>
      <HeaderCard title="Registrar resultado" sub="Jornada 1" />
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 6 }}>{solo ? "Se guardan solo los sets jugados." : "Introduce los tres sets. Cada set ganado suma un punto."}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, fontSize: 11, fontWeight: 800, color: t.textMuted, paddingRight: 56 }}><span>Set 1</span><span>Set 2</span><span>Set 3</span></div>
        {[0, 1].map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, background: t.mutedSurface, borderRadius: 12, padding: "7px 9px", marginTop: 6 }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{r === 0 ? `${N[0]}\n${N[1]}` : `${N[2]}\n${N[3]}`}</div>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px ${solo && k === 2 ? "dashed" : "solid"} ${shown(k) ? (rows[r][k] > rows[1 - r][k] ? t.accent : t.border) : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 900, opacity: solo && k === 2 ? 0.4 : 1 }}>{shown(k) ? rows[r][k] : ""}</div>
            ))}
            <div style={{ width: 44, textAlign: "center", fontSize: 26, fontWeight: 900, color: f >= puntoF - 6 ? t.accent : t.text, transform: `scale(${f >= puntoF - 6 && f < puntoF + 14 ? 1.25 : 1})` }}>{total(r)}</div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {[["3 sets siempre", !solo], ["Solo los jugados", solo]].map(([lab, on]) => <div key={lab as string} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 10, fontSize: 12.5, fontWeight: 800, background: on ? t.accent : t.mutedSurface, color: on ? t.accentContrast : t.textMuted, opacity: f >= treF - 6 ? 1 : 0 }}>{lab as string}</div>)}
        </div>
        <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "10px 0", marginTop: 10, textAlign: "center", fontSize: 15, fontWeight: 900 }}>Guardar resultado</div>
      </Card>
    </div>
  );
  /* modos de confirmación */
  const MODES: [string, string, number][] = [
    ["Sin confirmaciones", "El resultado cuenta al guardarlo.", c1F],
    ["Confirmación adicional", "Se puede confirmar o impugnar, pero ya cuenta desde que se registra.", c2F],
    ["Confirmación obligatoria", "Suma cuando lo confirman los demás o, si nadie lo impugna, a las 24 h.", c3F],
  ];
  const modeOn = (i: number) => f >= MODES[i][2] - 8 && (i === 2 || f < MODES[i + 1][2] - 8);
  const modes = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: modO, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Confirmación del resultado" sub="Depende de cómo esté configurada la liga" />
      {MODES.map(([title, desc, af], i) => {
        const k = pop(f, fps, af - 12, 12), on = modeOn(i);
        return (
          <div key={title} style={{ opacity: Math.min(1, k * 2), transform: `scale(${on ? 1.02 : 1})`, background: t.surface, border: `1.5px solid ${on ? t.accent : t.border}`, borderRadius: 14, padding: "9px 12px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: on ? t.accent : t.text }}>{title}</div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
            {i === 1 && on && f >= confirmarloF - 4 && <div style={{ display: "flex", gap: 8, marginTop: 6, opacity: pop(f, fps, confirmarloF - 4, 10) }}><div style={{ flex: 1, textAlign: "center", borderRadius: 8, padding: "5px 0", background: "#34d39922", color: "#34d399", fontSize: 12, fontWeight: 900 }}>✓ Confirmar</div><div style={{ flex: 1, textAlign: "center", borderRadius: 8, padding: "5px 0", background: "#f8717122", color: "#f87171", fontSize: 12, fontWeight: 900 }}>✕ Impugnar</div></div>}
            {i === 2 && on && f >= h24F - 6 && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, opacity: pop(f, fps, h24F - 6, 10) }}><Icon name="clock" color={t.accent} size={16} /><div style={{ flex: 1, height: 6, borderRadius: 3, background: t.mutedSurface }}><div style={{ width: `${Math.min(100, ((f - h24F) / 60) * 100)}%`, height: 6, borderRadius: 3, background: t.accent }} /></div><span style={{ fontSize: 11.5, fontWeight: 900, color: t.accent }}>24 h</span></div>}
          </div>
        );
      })}
    </div>
  );
  /* clasificación que se actualiza sola */
  const before = [["Carla", 12, 2], ["Dani", 10, 1], ["Ana", 10, 0], ["Beto", 8, 3]] as const;
  void before;
  const ORDER0 = ["Carla", "Dani", "Ana", "Beto"], ORDER1 = ["Carla", "Ana", "Dani", "Beto"];
  const PTS0: Record<string, number> = { Carla: 12, Dani: 10, Ana: 10, Beto: 8 }, PTS1: Record<string, number> = { Carla: 13, Dani: 11, Ana: 12, Beto: 10 };
  const mv = ease((f - (clasF + 10)) / 22);
  const rank = (
    <div style={{ ...base, opacity: rankO, transform: `translateX(${slideIn(f, S7 - 8)}px)` }}>
      <HeaderCard title="Clasificación" sub="Se actualiza sola" />
      <div style={{ position: "relative", height: 280, marginTop: 8 }}>
        {N.map((n, i) => { const p0 = ORDER0.indexOf(n), p1 = ORDER1.indexOf(n); const pos = lerp(p0, p1, mv); const pts = Math.round(lerp(PTS0[n], PTS1[n], mv)); const up = p1 < p0 && mv > 0.1; return (
          <div key={n} style={{ position: "absolute", left: 0, right: 0, top: pos * 66, display: "flex", alignItems: "center", gap: 10, background: up ? `${t.accent}33` : t.surface, border: `1.5px solid ${up ? t.accent : t.border}`, borderRadius: 14, padding: "8px 12px" }}>
            <div style={{ width: 22, fontSize: 18, fontWeight: 900 }}>{Math.round(pos) + 1}</div><Av i={i} size={40} /><div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 22, fontWeight: 900 }}>{pts}</div>
          </div>
        ); })}
      </div>
    </div>
  );
  const ripples = [{ x: 206, y: 200, a: regF - 2 }, { x: 206, y: 392, a: S4 - 70 }];
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "TU PARTIDO"], [S2 + 4, "SETS Y PUNTOS"], [S3 + 4, "¿TRES SETS?"], [S4 + 4, "SIN CONFIRMACIONES"], [c2F - 12, "CONFIRMACIÓN ADICIONAL"], [c3F - 12, "CONFIRMACIÓN OBLIGATORIA"], [S7 + 4, "CLASIFICACIÓN"]]} />
      <ExampleLabel show={f >= S1 && f < END - 14} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Has terminado\nde jugar:\n*registra* el resultado"} frames={hookW} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 14}>
        {detO > 0.01 && detail}{formO > 0.01 && form}{modO > 0.01 && modes}{rankO > 0.01 && rank}
        {[ripples[0]].map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
      </PhoneWin>
      {[regF, juegosF, setAt[1], setAt[2], puntoF, treF, soloF, c1F, c2F, confirmarloF, c3F, h24F, clasF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", clasF + 10, 0.4)}
      <div style={{ opacity: 0 }}>{setF + S5 + S6 + S3 + S2}</div>
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 8, "voice-gen06-david.mp3");
export const GEN06_FRAMES = g.frames;
export const Gen06Resultado = g.Comp;
