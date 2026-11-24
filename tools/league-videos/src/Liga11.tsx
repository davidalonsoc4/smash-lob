// Vídeo 11 (v2) · Partidos normales (amistosos): Mis partidos → Crear nuevo encuentro (jugadores o cualquier nombre) → guardar resultado ahora o más tarde
// → cada participante lo ve en su historial → no cuentan para la clasificación, sí para las estadísticas de Mi perfil → chat de cada partido.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard, PairBox, Ripple, Vs } from "./Presentacion3";
import { OutroSync, SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_liga11";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const league: LeagueConfig = PRO_LEAGUE;

/* barra de fuera de la liga: Competiciones · Mis partidos · Chats · Mi perfil */
const OutBar: React.FC<{ active: number }> = ({ active }) => {
  const t = useTheme();
  const items: [string, string][] = [["trophy", "Competiciones"], ["ball", "Mis partidos"], ["chat", "Chats"], ["user", "Mi perfil"]];
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 22, padding: 8, display: "flex", gap: 4 }}>
      {items.map(([ico, lab], i) => { const on = i === active; return (
        <div key={lab} style={{ flex: 1, borderRadius: 16, padding: "9px 0 8px", textAlign: "center", background: on ? t.accent : "transparent", color: on ? t.accentContrast : t.textMuted }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Icon name={ico} color={on ? t.accentContrast : t.textMuted} size={22} /></div>
          <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{lab}</div>
        </div>
      ); })}
    </div>
  );
};

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), END = B30(5);
  const hookW = ["Sabías", "que", "también", "puedes", "registrar", "tus", "partidos", "normales", "en", "la", "app"].map((w) => at(0, w));
  const misF = at(1, "Mis"), crearF = at(1, "Crear"), eligeF = at(1, "elige"), nombreF = at(1, "nombre"), guardaF = at(1, "guarda"), tardeF = at(1, "tarde");
  const histF = at(2, "historial");
  const clasF = at(3, "clasificación"), estF = at(3, "estadísticas"), parejaF = at(3, "pareja"), rivalF = at(3, "rival"), difF = at(3, "diferencia");
  const chatF = at(4, "chat");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const listO = win(f, S1 - 10, crearF + 14), formO = win(f, crearF + 12, S2 - 8), histO = win(f, S2 - 8, S3 - 8), statO = win(f, S3 - 8, S4 - 8), chatO = win(f, S4 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const list = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: listO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Mis partidos" sub="Partidos normales y de liga" />
      <Card accent={false} pad="10px 12px"><div style={{ fontSize: 13, color: t.textMuted }}>Aún no hay partidos normales</div></Card>
      <div style={{ position: "absolute", right: 0, top: 300, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "11px 18px", fontSize: 14, fontWeight: 900, boxShadow: f >= misF + 10 ? `0 0 18px ${t.accent}aa` : "none", opacity: pop(f, fps, misF + 4, 10) }}>＋ Crear nuevo encuentro</div>
    </div>
  );
  const typed = "Marcos".slice(0, Math.max(0, Math.min(6, Math.floor((f - (nombreF - 4)) / 4))));
  const form = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: formO, transform: `translateX(${slideIn(f, crearF + 12)}px)` }}>
      <HeaderCard title="Nuevo encuentro" sub="Jugadores y resultado" />
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>JUGADORES</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {["Alain", "David", "Unai"].map((n, i) => { const k = pop(f, fps, eligeF + i * 6, 11); return <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.9 + 0.1 * k})`, textAlign: "center" }}><Av i={i + 2} size={44} ring={t.accent} /><div style={{ fontSize: 11.5, fontWeight: 800, marginTop: 3 }}>{n}</div></div>; })}
          <div style={{ textAlign: "center" }}><div style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px dashed ${t.textSubtle}`, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: t.textMuted }}>{typed ? typed[0] : "+"}</div><div style={{ fontSize: 11.5, fontWeight: 800, marginTop: 3 }}>{typed || "Nombre…"}</div></div>
        </div>
        <div style={{ marginTop: 10, borderRadius: 10, background: t.mutedSurface, padding: "8px 10px", fontSize: 12.5, color: typed ? t.text : t.textSubtle, opacity: f >= nombreF - 8 ? 1 : 0 }}>Escribe cualquier nombre: {typed}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1, textAlign: "center", borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 900, background: f >= guardaF ? t.accent : t.mutedSurface, color: f >= guardaF ? t.accentContrast : t.textMuted, opacity: pop(f, fps, guardaF - 6, 10) }}>Guardar resultado ahora</div>
          <div style={{ flex: 1, textAlign: "center", borderRadius: 10, padding: "9px 0", fontSize: 13, fontWeight: 900, border: `1.5px solid ${f >= tardeF - 4 ? t.accent : t.border}`, color: f >= tardeF - 4 ? t.accent : t.textMuted, opacity: pop(f, fps, guardaF - 2, 10) }}>Más tarde</div>
        </div>
      </Card>
    </div>
  );
  const hist = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: histO, transform: `translateX(${slideIn(f, S2 - 8)}px)` }}>
      <HeaderCard title="Historial" sub="Tus partidos" />
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>PARTIDO NORMAL</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><PairBox a="Alain" b="David" /><Vs /><PairBox a="Unai" b="Marcos" /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13, fontWeight: 800 }}><span>6–4  3–6  6–2</span><span style={{ color: t.accent }}>Lo ve cada participante</span></div>
      </Card>
      <div style={{ display: "flex", justifyContent: "space-around", opacity: pop(f, fps, histF - 4, 10) }}>{["Alain", "David", "Unai", "Marcos"].map((n, i) => <div key={n} style={{ textAlign: "center" }}><Av i={i + 2} size={36} /><div style={{ fontSize: 10.5, fontWeight: 800 }}>{n}</div></div>)}</div>
    </div>
  );
  const stat = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: statO, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Clasificación de la liga" sub="Los partidos normales no cuentan" right={<div style={{ fontSize: 11, fontWeight: 900, color: "#f87171", opacity: pop(f, fps, clasF - 4, 10) }}>✕ no cuentan</div>} />
      {f >= estF - 10 && (
        <Card accent={false} pad="10px 12px">
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted, marginBottom: 8, opacity: pop(f, fps, estF - 6, 10) }}>MI PERFIL · ESTADÍSTICAS</div>
          {[["Mi mejor pareja", "David", parejaF, "user"], ["Mi mayor rival", "Unai", rivalF, "trophy"], ["Diferencia de juegos", "+14", difF, "rank"]].map(([lab, val, af, ico]) => { const k = pop(f, fps, (af as number) - 6, 11); return (
            <div key={lab as string} style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 30}px)`, display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${t.border}` }}>
              <Icon name={ico as string} color={t.accent} size={20} /><div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{lab as string}</div><div style={{ fontSize: 16, fontWeight: 900, color: t.accent }}>{val as string}</div>
            </div>
          ); })}
        </Card>
      )}
    </div>
  );
  const chat = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: chatO, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Chat del partido" sub="Partido normal" />
      {[["Alain", "¿Jugamos el sábado?", "#8ab4f8", false], ["Unai", "Por mí, perfecto", "#81c995", false], ["", "Hecho: sábado 11:00", "", true]].map(([n, txt, col, own], i) => { const k = pop(f, fps, chatF - 6 + i * 14, 11); return (
        <div key={i} style={{ alignSelf: own ? "flex-end" : "flex-start", opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 24}px)`, background: own ? t.accent : t.mutedSurface, color: own ? t.accentContrast : t.text, borderRadius: own ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px", maxWidth: 280 }}>
          {n && <div style={{ fontSize: 11.5, fontWeight: 900, color: col as string, marginBottom: 2 }}>{n as string}</div>}<div style={{ fontSize: 15, fontWeight: 700 }}>{txt as string}</div>
        </div>
      ); })}
    </div>
  );
  const active = f < S3 - 8 ? 1 : f < S4 - 8 ? 3 : 2;
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "MIS PARTIDOS"], [S2 + 4, "HISTORIAL"], [S3 + 4, "ESTADÍSTICAS"], [S4 + 4, "CADA PARTIDO, SU CHAT"]]} />
      <ExampleLabel show={f >= S1 && f < END - 14} />
      <div style={{ position: "absolute", top: 480, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Sabías que también\npuedes registrar tus\npartidos *normales*\nen la app?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4], hookW[5], hookW[6], hookW[7], hookW[8], hookW[9], hookW[10]]} size={88} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 14}>
        {listO > 0.01 && list}{formO > 0.01 && form}{histO > 0.01 && hist}{statO > 0.01 && stat}{chatO > 0.01 && chat}
        <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><OutBar active={active} /></div>
        <Ripple x={330} y={310} at={crearF - 2} size={40} />
      </PhoneWin>
      {[misF, crearF, eligeF, nombreF, guardaF, tardeF, histF, clasF, estF, parejaF, rivalF, difF, chatF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <OutroSync league={league} ws={ws} />, BOUNDS, tm, 5, "voice-liga11-david.mp3");
export const LIGA11_FRAMES = g.frames;
export const Liga11Amistosos = g.Comp;
