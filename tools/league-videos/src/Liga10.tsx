// Vídeo 10 (v2) · Clasificación, desempate y MVP: cada set ganado = 1 punto → empate: diferencia de juegos → MVP de jornada (automático avanzado):
// pareja ganadora más dominante → mejor rendimiento individual → si están muy igualados, lo comparten → MVP de temporada = más jornadas ganadas.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W, TabBar } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard } from "./Presentacion3";
import { OutroSync, SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_liga10";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const league: LeagueConfig = PRO_LEAGUE;
const ROWS: [string, number, number, number][] = [["Unai", 9, 4, 2], ["Alain", 8, 5, 4], ["Andoni", 8, 3, 3], ["David", 6, 0, 0], ["Nicolás", 5, -2, 0]]; // nombre, puntos, dif. juegos, avatar

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), S7 = B30(7), END = B30(8);
  const hookW = ["Cómo", "se", "decide", "la", "clasificación", "y", "el", "MVP"].map((w) => at(0, w));
  const puntoF = at(1, "punto"), empateF = at(2, "empate"), difF = at(2, "diferencia");
  const mvpF = at(3, "MVP"), domF = at(4, "dominante"), rendF = at(5, "rendido"), tempF = at(5, "temporada"), compF = at(6, "comparten"), tmpF = at(7, "temporada"), ganeF = at(7, "gane");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const rankO = win(f, S1 - 10, S3 - 8), jorO = win(f, S3 - 8, S5 - 8), parO = win(f, S5 - 8, S7 - 8), seaO = win(f, S7 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const colHot = (c: number) => (f >= S2 - 4 ? (c === 1 ? f >= difF - 4 : c === 0 ? f < difF - 4 : false) : c === 0);
  const rank = (
    <div style={{ ...base, opacity: rankO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Clasificación" sub={league.season} />
      <div style={{ display: "flex", padding: "8px 10px 2px 74px", fontSize: 10.5, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted }}><div style={{ flex: 1 }}>JUGADOR</div><div style={{ width: 46, textAlign: "right", color: colHot(0) ? t.accent : t.textMuted }}>PTS</div><div style={{ width: 46, textAlign: "right", color: colHot(1) ? t.accent : t.textMuted }}>DIF</div></div>
      {ROWS.map(([n, pts, dif, av], i) => {
        const k = pop(f, fps, S1 + 2 + i * 4, 11), tie = (n === "Alain" || n === "Andoni") && f >= empateF - 4;
        const plus = n === "Unai" && f >= puntoF - 4 && f < puntoF + 40;
        return (
          <div key={n} style={{ opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 8, background: tie && f >= difF - 4 && n === "Alain" ? `${t.accent}26` : t.surface, border: `1.5px solid ${tie ? t.accent : t.border}`, borderRadius: 12, padding: "5px 10px", marginTop: 5 }}>
            <div style={{ width: 20, fontSize: 15, fontWeight: 900 }}>{i + 1}</div><Av i={i + 2 + av * 0} size={34} /><div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{n}</div>
            <div style={{ width: 46, textAlign: "right", fontSize: 17, fontWeight: 900, color: plus ? t.accent : t.text }}>{pts + (plus ? 1 : 0)}</div>
            <div style={{ width: 46, textAlign: "right", fontSize: 14, fontWeight: 800, color: t.textMuted }}>{dif > 0 ? "+" : ""}{dif}</div>
          </div>
        );
      })}
      {f >= empateF && <div style={{ textAlign: "center", marginTop: 8, fontSize: 12.5, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, empateF, 10) }}>Alain y Andoni empatan: decide la diferencia de juegos</div>}
    </div>
  );
  /* jornada terminada: resultados y pareja más dominante */
  const MATCH: [string, string, string, number][] = [["Alain · David", "Álvaro · Nicolás", "6–2  6–1  6–2", 9], ["Unai · Andoni", "Álvaro · David", "6–4  3–6  6–4", 3], ["Nicolás · Unai", "Andoni · Alain", "4–6  6–3  4–6", -3]];
  const jor = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 7, opacity: jorO, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Jornada 2" sub="Todos los partidos terminados" right={f >= mvpF - 4 ? <div style={{ fontSize: 12, fontWeight: 900, borderRadius: 999, padding: "4px 10px", background: t.accent, color: t.accentContrast, opacity: pop(f, fps, mvpF - 4, 10) }}>MVP</div> : undefined} />
      {MATCH.map(([a, b, sc, diff], i) => { const k = pop(f, fps, S3 + 4 + i * 6, 11), dom = i === 0 && f >= domF - 8; return (
        <div key={a} style={{ opacity: Math.min(1, k * 2), background: dom ? `${t.accent}26` : t.surface, border: `1.5px solid ${dom ? t.accent : t.border}`, borderRadius: 14, padding: "8px 12px", transform: `scale(${dom ? 1.02 : 1})` }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800 }}><span>{a}</span><span style={{ color: t.textMuted }}>vs</span><span>{b}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 12.5, color: t.textMuted }}><span>{sc}</span><span style={{ fontWeight: 900, color: dom ? t.accent : t.textMuted }}>{diff > 0 ? "+" : ""}{diff} juegos</span></div>
        </div>
      ); })}
      {f >= domF && <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 800, color: t.accent, opacity: pop(f, fps, domF, 10) }}>Pareja más dominante</div>}
    </div>
  );
  /* dentro de la pareja: quién ha rendido más; si están igualados, lo comparten */
  const both = f >= compF - 6;
  const par = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: parO, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="MVP de la jornada" sub="Alain · David" />
      {[["Alain", 0.86], ["David", both ? 0.85 : 0.74]].map(([n, v], i) => { const k = pop(f, fps, rendF - 20 + i * 10, 11), mvp = i === 0 || both; const show = f >= (both ? compF : rendF + 8) && mvp; return (
        <Card key={n as string} accent={false} pad="10px 12px">
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: Math.min(1, k * 2) }}>
            <Av i={i + 3} size={44} ring={show ? t.accent : undefined} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800 }}>{n as string}</div>
              <div style={{ height: 6, borderRadius: 3, background: t.mutedSurface, marginTop: 6 }}><div style={{ width: `${(v as number) * Math.min(1, (f - (rendF - 14 + i * 10)) / 30) * 100}%`, height: 6, borderRadius: 3, background: t.accent }} /></div>
              <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 3 }}>Rendimiento de la temporada, con quién y contra quién juega</div></div>
            {show && <div style={{ opacity: pop(f, fps, both ? compF : rendF + 8, 10) }}><Icon name="trophy" color={t.accent} size={30} /></div>}
          </div>
        </Card>
      ); })}
      {both && <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, color: t.accent, opacity: pop(f, fps, compF, 10) }}>MVP compartido</div>}
    </div>
  );
  /* MVP de temporada: quien más jornadas gane */
  const SEA: [string, number][] = [["Alain", 3], ["Unai", 2], ["David", 1], ["Andoni", 1]];
  const sea = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 7, opacity: seaO, transform: `translateX(${slideIn(f, S7 - 8)}px)` }}>
      <HeaderCard title="MVP de la temporada" sub="Jornadas ganadas como MVP" />
      {SEA.map(([n, c], i) => { const k = pop(f, fps, tmpF - 4 + i * 6, 11), lead = i === 0 && f >= ganeF; return (
        <div key={n} style={{ opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 10, background: lead ? `${t.accent}26` : t.surface, border: `1.5px solid ${lead ? t.accent : t.border}`, borderRadius: 14, padding: "8px 12px" }}>
          <Av i={i + 2} size={38} /><div style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{n}</div>
          <div style={{ display: "flex", gap: 3 }}>{Array.from({ length: c }).map((_, j) => <Icon key={j} name="trophy" color={t.accent} size={20} />)}</div>
        </div>
      ); })}
    </div>
  );
  const active = 1;
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "UN SET = 1 PUNTO"], [S2 + 4, "EMPATE: DIFERENCIA"], [S3 + 4, "MVP DE JORNADA"], [S4 + 4, "PAREJA DOMINANTE"], [S5 + 4, "RENDIMIENTO"], [S6 + 4, "SI ESTÁN IGUALADOS"], [S7 + 4, "MVP DE TEMPORADA"]]} />
      <ExampleLabel show={f >= S1 && f < END - 14} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Cómo se decide\nla *clasificación*\ny el *MVP*?"} frames={hookW} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 14}>
        {rankO > 0.01 && rank}{jorO > 0.01 && jor}{parO > 0.01 && par}{seaO > 0.01 && sea}
        <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><TabBar active={active} /></div>
      </PhoneWin>
      {[puntoF, empateF, difF, mvpF, domF, rendF, tempF, compF, tmpF, ganeF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <OutroSync league={league} ws={ws} />, BOUNDS, tm, 8, "voice-liga10-david.mp3");
export const LIGA10_FRAMES = g.frames;
export const Liga10Clasificacion = g.Comp;
