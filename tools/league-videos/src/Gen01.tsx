// Tutorial genérico 1 · Cómo funciona una liga: parejas, cada set ganado = 1 punto, la pareja cambia cada jornada,
// duración (una vuelta / ida y vuelta / varias) y gana quien más puntos suma. Avatares y nombres genéricos.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { SyncWords } from "./SyncWords";
import { Av, GenOutro, Tags, mkGen, mkTiming } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen01";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const NAMES = ["Ana", "Beto", "Carla", "Dani"];
// posiciones de los 4 huecos: A1, A2 (pareja izquierda), B1, B2 (pareja derecha)
const SLOT = [{ x: 290, y: 600 }, { x: 290, y: 860 }, { x: 790, y: 600 }, { x: 790, y: 860 }];
// jugador i → hueco en cada jornada
const ASSIGN = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]];
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5);
  const hookW = ["Cómo", "funciona", "una", "liga", "en", "Smash", "&", "Lob"].map((w) => at(0, w));
  const parF = at(1, "parejas"), indF = at(1, "individual"), setF = at(1, "set"), puntoF = at(1, "punto");
  const jorF = at(2, "jornada"), camF = at(2, "cambia"), conF = at(2, "contra"), todF = at(2, "todos", 1);
  const unaF = at(3, "una"), idaF = at(3, "ida"), variasF = at(3, "varias");
  const ganaF = at(4, "Gana"), regF = at(4, "regularidad");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const arenaO = Math.min(ease((f - (S1 - 8)) / 14), 1 - ease((f - (S3 - 12)) / 10));
  // jornada actual (0,1,2) con transición suave
  const j1 = ease((f - (camF - 4)) / 20), j2 = ease((f - (conF - 4)) / 20);
  const slotOf = (i: number) => {
    const a = ASSIGN[0][i], b = ASSIGN[1][i], c = ASSIGN[2][i];
    const s = f < conF - 4 ? [a, b, j1] : [b, c, j2];
    const from = SLOT[s[0]], to = SLOT[s[1]];
    return { x: lerp(from.x, to.x, s[2]), y: lerp(from.y, to.y, s[2]) };
  };
  const jornada = f < camF - 4 ? 1 : f < conF - 4 ? 2 : 3;
  // puntos individuales (tras ganar el set, solo en la jornada 1)
  const won = f >= puntoF - 10;
  const pts = (i: number) => (won && (i === 0 || i === 1) ? 1 : 0);
  const pairK = pop(f, fps, parF - 6, 12) * (1 - ease((f - (camF - 4)) / 14) * 0);
  const showPoints = f >= indF - 4;
  // tarjetas de duración
  const cards = [
    { at: unaF, title: "Una sola vuelta", n: 1 },
    { at: idaF, title: "Ida y vuelta", n: 2 },
    { at: variasF, title: "Varias vueltas", n: 3 },
  ];
  const durO = Math.min(ease((f - (S3 - 4)) / 12), 1 - ease((f - (S4 - 2)) / 10));
  // clasificación
  const tabO = ease((f - (S4 - 4)) / 14) * (1 - ease((f - (S5 - 14)) / 12));
  const TABLE = [["Ana", 14], ["Carla", 12], ["Beto", 11], ["Dani", 9]] as const;
  const leadK = pop(f, fps, ganaF + 6, 10);

  return (
    <Frame timedWords={ws}>
      <Tags endF={S5} tags={[[S1 + 4, "CADA SET = 1 PUNTO"], [S2 + 4, "LAS PAREJAS CAMBIAN"], [S3 + 4, "DURACIÓN"], [S4 + 4, "CLASIFICACIÓN"]]} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Cómo funciona\nuna *liga*\nen Smash and Lob?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4], hookW[5], hookW[6], hookW[7]]} size={100} /></div>
      <div style={{ position: "absolute", inset: 0, opacity: arenaO }}>
        {/* jornada */}
        <div style={{ position: "absolute", top: 390, left: 0, right: 0, textAlign: "center", fontSize: 40, fontWeight: 900, letterSpacing: 6, color: t.textMuted, opacity: pop(f, fps, jorF - 6, 10) }}>JORNADA {jornada}</div>
        {/* parejas (cajas) */}
        {[0, 1].map((p) => (
          <div key={p} style={{ position: "absolute", left: p === 0 ? 150 : 650, top: 485, width: 280, height: 510, borderRadius: 40, border: `3px solid ${t.accent}`, background: `${t.accent}12`, opacity: Math.min(1, pairK * 2), transform: `scale(${0.9 + 0.1 * pairK})` }} />
        ))}
        {/* VS y marcador */}
        <div style={{ position: "absolute", left: 440, top: 640, width: 200, textAlign: "center", fontSize: 54, fontWeight: 900, color: t.textMuted, opacity: pairK }}>VS</div>
        {f >= setF - 4 && f < S2 - 8 && (
          <div style={{ position: "absolute", left: 400, top: 740, width: 280, textAlign: "center", opacity: pop(f, fps, setF - 4, 10) }}>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: t.textMuted }}>SET 1</div>
            <div style={{ fontSize: 64, fontWeight: 900 }}><span style={{ color: t.accent }}>6</span> – 4</div>
          </div>
        )}
        {/* avatares */}
        {NAMES.map((n, i) => {
          const p = slotOf(i);
          const k = pop(f, fps, S1 + 4 + i * 4, 10);
          return (
            <div key={n} style={{ position: "absolute", left: p.x - 70, top: p.y - 70, width: 140, textAlign: "center", transform: `scale(${k})` }}>
              <Av i={i + (i > 1 ? 1 : 0) * 1} size={140} ring={pts(i) ? t.accent : undefined} />
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{n}</div>
              {showPoints && <div style={{ position: "absolute", right: -18, top: -10, minWidth: 54, height: 54, borderRadius: 27, background: pts(i) ? t.accent : t.mutedSurface, color: pts(i) ? t.accentContrast : t.textMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, border: `3px solid ${t.bg}`, transform: `scale(${pts(i) ? 1 + 0.25 * Math.max(0, 1 - (f - (puntoF - 10)) / 8) : 1})` }}>{pts(i)}</div>}
            </div>
          );
        })}
      </div>
      {/* duración */}
      <div style={{ position: "absolute", left: 100, right: 100, top: 420, opacity: durO, display: "flex", flexDirection: "column", gap: 40 }}>
        {cards.map((c) => { const k = pop(f, fps, c.at - 4, 11); return (
          <div key={c.title} style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 90}px)`, display: "flex", alignItems: "center", justifyContent: "space-between", background: t.surface, border: `2px solid ${t.accent}`, borderRadius: 34, padding: "34px 44px" }}>
            <div style={{ fontSize: 50, fontWeight: 900 }}>{c.title}</div>
            <div style={{ display: "flex", gap: 10 }}>{Array.from({ length: c.n }).map((_, j) => <Icon key={j} name="cal" color={t.accent} size={52} />)}</div>
          </div>
        ); })}
      </div>
      {/* clasificación */}
      <div style={{ position: "absolute", left: 110, right: 110, top: 430, opacity: tabO, display: "flex", flexDirection: "column", gap: 24 }}>
        {TABLE.map(([n, p], i) => { const k = pop(f, fps, S4 + 8 + i * 6, 12); const lead = i === 0 && f >= ganaF + 4; return (
          <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 70}px) scale(${lead ? 1 + 0.04 * leadK : 1})`, display: "flex", alignItems: "center", gap: 24, background: lead ? t.accent : t.surface, color: lead ? t.accentContrast : t.text, border: `2px solid ${lead ? t.accent : t.border}`, borderRadius: 30, padding: "20px 30px" }}>
            <div style={{ fontSize: 44, fontWeight: 900, width: 50 }}>{i + 1}</div>
            <Av i={n === "Ana" ? 0 : n === "Carla" ? 2 : n === "Beto" ? 1 : 3} size={80} />
            <div style={{ flex: 1, fontSize: 46, fontWeight: 800 }}>{n}</div>
            <div style={{ fontSize: 52, fontWeight: 900 }}>{p} <span style={{ fontSize: 26, fontWeight: 800, opacity: 0.7 }}>pts</span></div>
          </div>
        ); })}
        <div style={{ textAlign: "center", fontSize: 34, fontWeight: 800, color: t.textMuted, marginTop: 10, opacity: pop(f, fps, regF - 4, 10) }}>Premia la regularidad</div>
      </div>
      {[S1 + 6, parF, indF, setF, puntoF, jorF, camF, conF, unaF, idaF, variasF, ganaF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
      <div style={{ opacity: 0 }}>{todF}</div>
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <GenOutro ws={ws} line1="Mira en tu *liga*" words1={["Mira", "en", "tu", "liga"]} line2="cómo está *configurada*" words2={["cómo", "está", "configurada"]} lastWord="configurada" />, BOUNDS, tm, 5, "voice-gen01-david.mp3");
export const GEN01_FRAMES = g.frames;
export const Gen01ComoFunciona = g.Comp;
