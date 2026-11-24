// Vídeo 08 (v2) · Subir un resultado: Registrar resultado → tres sets (cada set ganado = 1 punto, marcador no válido avisado) → basta con que lo suba uno de los cuatro
// → al guardar la clasificación se actualiza sola → notificaciones: «Falta el resultado». Móvil con réplicas (datos ficticios). Cierre estándar de la serie.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Ripple, Vs } from "./Presentacion3";
import { SyncWords, OutroSync } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Switch, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_liga08";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const league: LeagueConfig = PRO_LEAGUE;
const Q = league.exampleQuartet; // Alain, David, Álvaro, Nicolás (ficticio, sin coincidir con enfrentamientos reales)

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), END = B30(6);
  const hookW = ["Cómo", "se", "sube", "un", "resultado"].map((w) => at(0, w));
  const regF = at(1, "Registrar");
  const tresF = at(2, "tres"), puntoF = at(2, "punto"), marcF = at(2, "marcador"), valF = at(2, "válido");
  const unoF = at(3, "uno");
  const guardarF = at(4, "guardar"), clasF = at(4, "clasificación"), actF = at(4, "actualiza");
  const notiF = at(5, "notificaciones"), ajF = at(5, "Ajustes"), faltaF = at(5, "falta");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const detO = win(f, S1 - 10, regF + 12), formO = win(f, regF + 10, S4 - 8), rankO = win(f, S4 - 8, S5 - 8), setO = win(f, S5 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const rows = [[6, 4, 6], [3, 6, 2]];
  const setAt = [tresF + 6, tresF + 22, tresF + 38];
  const bad = f >= marcF - 4 && f < valF + 18;   // ejemplo de marcador no válido en el set 3
  const shown = (k: number) => f >= setAt[k];
  const total = (r: number) => [0, 1, 2].reduce((a, k) => a + (shown(k) && rows[r][k] > rows[1 - r][k] ? 1 : 0), 0);
  const detail = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Jornada 2" sub={`${league.season} · En curso`} right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: "#3b2f12", color: "#f2c14e" }}>Pendiente resultado</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={Q[0]} b={Q[1]} gold /><Vs /><PairBox a={Q[2]} b={Q[3]} gold /></div>
      <div style={{ borderRadius: 14, padding: "12px 0", textAlign: "center", fontSize: 15.5, fontWeight: 900, background: t.accent, color: t.accentContrast, marginTop: 6, boxShadow: f >= regF - 8 ? `0 0 18px ${t.accent}aa` : "none" }}>Registrar resultado</div>
    </div>
  );
  const saveP = f >= unoF + 20 && f < unoF + 40;
  const form = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: formO, transform: `translateX(${slideIn(f, regF + 10)}px)` }}>
      <HeaderCard title="Registrar resultado" sub="Jornada 2" />
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 12.5, color: t.textMuted, marginBottom: 6 }}>Completa los tres sets. Cada set ganado suma un punto.</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, fontSize: 11, fontWeight: 800, color: t.textMuted, paddingRight: 56 }}><span>Set 1</span><span>Set 2</span><span>Set 3</span></div>
        {[0, 1].map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, background: t.mutedSurface, borderRadius: 12, padding: "7px 9px", marginTop: 6 }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{r === 0 ? `${Q[0]}\n${Q[1]}` : `${Q[2]}\n${Q[3]}`}</div>
            {[0, 1, 2].map((k) => { const v = bad && k === 2 ? (r === 0 ? 9 : 2) : rows[r][k]; const bd = bad && k === 2; return (
              <div key={k} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${bd ? "#f87171" : shown(k) ? (rows[r][k] > rows[1 - r][k] ? t.accent : t.border) : t.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 900, color: bd ? "#f87171" : t.text }}>{shown(k) ? v : ""}</div>
            ); })}
            <div style={{ width: 44, textAlign: "center", fontSize: 26, fontWeight: 900, color: f >= puntoF - 6 ? t.accent : t.text, transform: `scale(${f >= puntoF - 6 && f < puntoF + 14 ? 1.25 : 1})` }}>{total(r)}</div>
          </div>
        ))}
        {bad && <div style={{ marginTop: 8, textAlign: "center", fontSize: 13.5, fontWeight: 900, color: "#f87171", opacity: pop(f, fps, marcF - 4, 10) }}>⚠ Marcador no válido: revisa el set 3</div>}
        <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "10px 0", marginTop: 10, textAlign: "center", fontSize: 15, fontWeight: 900, transform: `scale(${saveP ? 0.96 : 1})`, boxShadow: saveP ? `0 0 0 4px ${t.accent}44` : "none" }}>Guardar resultado</div>
      </Card>
      {f >= unoF - 6 && (
        <Card accent={false} pad="8px 12px">
          <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>BASTA CON UNO DE LOS CUATRO</div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {Q.map((n, i) => { const k = pop(f, fps, unoF - 4 + i * 5, 11); const me = i === 1 && f >= unoF + 6; return <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.9 + 0.1 * k})`, textAlign: "center" }}><Av i={i} size={40} ring={me ? t.accent : undefined} /><div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>{n}</div>{me && <div style={{ fontSize: 9.5, fontWeight: 900, color: t.accent }}>LO SUBE</div>}</div>; })}
          </div>
        </Card>
      )}
    </div>
  );
  /* clasificación que se actualiza sola */
  const NM = ["Unai", "Andoni", "Alain", "David", "Nicolás"];
  const ORD0 = ["Unai", "Andoni", "Alain", "David", "Nicolás"], ORD1 = ["Unai", "Alain", "Andoni", "David", "Nicolás"];
  const P0: Record<string, number> = { Unai: 9, Andoni: 8, Alain: 8, David: 6, Nicolás: 5 }, P1: Record<string, number> = { Unai: 9, Andoni: 8, Alain: 10, David: 8, Nicolás: 6 };
  const mv = ease((f - (actF + 4)) / 22);
  const rank = (
    <div style={{ ...base, opacity: rankO, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Clasificación" sub="Se actualiza sola" />
      <div style={{ position: "relative", height: 5 * 62, marginTop: 8 }}>
        {NM.map((n, i) => { const p0 = ORD0.indexOf(n), p1 = ORD1.indexOf(n); const pos = lerp(p0, p1, mv); const pts = Math.round(lerp(P0[n], P1[n], mv)); const up = n === "Alain" && mv > 0.1; return (
          <div key={n} style={{ position: "absolute", left: 0, right: 0, top: pos * 62, display: "flex", alignItems: "center", gap: 10, background: up ? `${t.accent}33` : t.surface, border: `1.5px solid ${up ? t.accent : t.border}`, borderRadius: 14, padding: "7px 12px" }}>
            <div style={{ width: 22, fontSize: 17, fontWeight: 900 }}>{Math.round(pos) + 1}</div><Av i={i + 2} size={36} /><div style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{n}</div><div style={{ fontSize: 20, fontWeight: 900 }}>{pts}</div>
          </div>
        ); })}
      </div>
    </div>
  );
  const on = true;
  const settings = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: setO, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Ajustes" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${f >= ajF - 4 ? t.accent : t.border}`, borderRadius: 14, padding: "10px 12px" }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Resultados y MVP</div><div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1 }}>Resultados, confirmaciones, votación y premios</div></div>
        <Switch on={on} />
      </div>
    </div>
  );
  const ntK = Math.min(ease((f - (faltaF - 12)) / 12), 1 - ease((f - (END - 24)) / 10));
  const notif = ntK > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: ntK, transform: `translateY(${(1 - ntK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Falta el resultado</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>No olvides registrar el resultado de tu partido de la Jornada 2.</div>
      </div>
    </div>
  );
  const ripples = [{ x: 206, y: 150, a: regF - 2 }];
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "TU PARTIDO"], [S2 + 4, "TRES SETS"], [S3 + 4, "LO SUBE UNO"], [S4 + 4, "CLASIFICACIÓN"], [S5 + 4, "AVISOS"]]} />
      <ExampleLabel show={f >= S1 && f < END - 14} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Cómo se sube\nun *resultado*?"} frames={hookW} size={110} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 14} overlay={notif}>
        {detO > 0.01 && detail}{formO > 0.01 && form}{rankO > 0.01 && rank}{setO > 0.01 && settings}
        {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
      </PhoneWin>
      {[regF, tresF, puntoF, marcF, unoF, guardarF, clasF, notiF, ajF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", faltaF - 8, 0.4)}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <OutroSync league={league} ws={ws} />, BOUNDS, tm, 6, "voice-liga08-david.mp3");
export const LIGA08_FRAMES = g.frames;
export const Liga08Resultado = g.Comp;
