// Vídeo 09 (v2) · Cuenta atrás y desbloqueo del 20-dic: cuenta atrás en Inicio → tarjeta de la jornada de apertura (una semana antes) → emparejamientos sorpresa
// → el 20-dic la liga se desbloquea y llega una notificación → Jornada 1 y las siguientes según se completen → candados en calendario y chats → notificaciones.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
import { CountdownCard, NATIVE_W, OpeningCard, TabBar } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard, PairBox, Vs } from "./Presentacion3";
import { HORA } from "./Reserva";
import { OutroSync, SyncWords } from "./SyncWords";
import { ExampleLabel, PhoneWin, Switch, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_liga09";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const league: LeagueConfig = PRO_LEAGUE;
const Q = league.exampleQuartet;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), S7 = B30(7), END = B30(8);
  const hookW = ["Qué", "pasa", "hasta", "el", "20", "de", "diciembre"].map((w) => at(0, w));
  const cuentaF = at(1, "cuenta"), tarjF = at(2, "tarjeta"), lugarF = at(2, "lugar");
  const sorpF = at(3, "sorpresa");
  const desbF = at(4, "desbloquea"), notiF = at(4, "notificación");
  const entF = at(5, "Entonces"), sigF = at(5, "siguientes"), antF = at(5, "anteriores");
  const candF = at(6, "candado"), chatsF = at(6, "chats");
  const actF = at(7, "Activa"), partF = at(7, "partido");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const homeO = win(f, S1 - 10, S5 - 8), jorO = win(f, S5 - 8, S6 - 8), lockO = win(f, S6 - 8, S7 - 8), setO = win(f, S7 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  /* cuenta atrás: baja un segundo cada ~15 cuadros; al desbloquear llega a cero */
  const secs = Math.max(0, 7 * 86400 + 5 * 3600 + 41 * 60 + 30 - Math.floor((f - S1) / 15) - (f >= desbF - 20 ? Math.min(1, (f - (desbF - 20)) / 40) * (7 * 86400 + 5 * 3600 + 41 * 60) : 0));
  const unlocked = f >= desbF + 6;
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const tarjK = pop(f, fps, tarjF - 6, 12), sorK = pop(f, fps, sorpF - 14, 12);
  const shrink = ease((f - (tarjF - 12)) / 18) * (unlocked ? 0 : 1);
  const scCount = lerp(0.94, 0.46, shrink);
  const home = (
    <div style={{ ...base, height: 400, opacity: homeO, transform: `translateX(${-(1 - homeO) * 20}px)` }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, transformOrigin: "top left", transform: `scale(${unlocked ? 0.94 : scCount})` }}>
        {unlocked ? (
          <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.accent, color: t.accentContrast, borderRadius: 34, padding: "110px 20px 110px", textAlign: "center", opacity: pop(f, fps, desbF + 6, 10) }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4 }}>20 DE DICIEMBRE</div>
            <div style={{ fontSize: 52, fontWeight: 900, marginTop: 16 }}>Liga desbloqueada</div>
          </div>
        ) : <CountdownCard days={d} hours={h} minutes={m} seconds={s} dateLabel={"DOMINGO · 20 DE DICIEMBRE"} note="Los emparejamientos son una sorpresa" />}
      </div>
      {f >= tarjF - 12 && !unlocked && (
        <div style={{ position: "absolute", left: 196, top: 0, width: NATIVE_W, transformOrigin: "top left", transform: `scale(0.46) translateX(${(1 - tarjK) * 300}px)`, opacity: Math.min(1, tarjK * 2) }}>
          <OpeningCard eyebrow="JORNADA DE APERTURA" weekday="DOMINGO" day="20" month="DICIEMBRE" place={league.opening.place} time={f >= lugarF - 40 ? HORA : null} note="" placeP={pop(f, fps, lugarF - 50, 10)} timeP={pop(f, fps, lugarF - 40, 10)} noteP={0} />
        </div>
      )}
      {f >= sorpF - 18 && f < desbF - 30 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 215 }}>
          <Card accent={false} pad="9px 12px">
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted, marginBottom: 6, opacity: sorK }}>JORNADA 1 · EMPAREJAMIENTOS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: sorK }}><PairBox a="?" b="?" /><Vs /><PairBox a="?" b="?" /></div>
          </Card>
        </div>
      )}
    </div>
  );
  /* jornadas: la 1 se abre, las siguientes van apareciendo */
  const jor = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: jorO, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Calendario" sub={league.season} />
      {[1, 2, 3, 4].map((j) => {
        const openAt = j === 1 ? entF + 4 : j === 2 ? sigF + 4 : j === 3 ? antF - 8 : 9e9;
        const open = f >= openAt, k = pop(f, fps, S5 + j * 5, 11);
        return (
          <div key={j} style={{ opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${open ? t.accent : t.border}`, borderRadius: 14, padding: "9px 12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: open ? t.text : t.textMuted }}>Jornada {j}</div>
              {open ? <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}><div style={{ flex: 1 }}><PairBox a={j === 1 ? Q[0] : "…"} b={j === 1 ? Q[1] : "…"} gold={j === 1} /></div><Vs /><div style={{ flex: 1 }}><PairBox a={j === 1 ? Q[2] : "…"} b={j === 1 ? Q[3] : "…"} gold={j === 1} /></div></div> : <div style={{ fontSize: 11.5, color: t.textSubtle, marginTop: 1 }}>Se desbloquea al completarse la anterior</div>}
            </div>
            {!open && <Icon name="lock" color={t.textMuted} size={22} />}
          </div>
        );
      })}
    </div>
  );
  /* candados en calendario y chats */
  const onChats = f >= chatsF - 6;
  const lockScr = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: lockO, transform: `translateX(${slideIn(f, S6 - 8)}px)` }}>
      <HeaderCard title={onChats ? "Chats" : "Calendario"} sub={onChats ? "Chats de jornada" : league.season} />
      {[1, 2, 3].map((j) => { const k = pop(f, fps, (onChats ? chatsF : candF) + j * 5, 11); const lk = j > 1; return (
        <div key={j + (onChats ? 10 : 0)} style={{ opacity: Math.min(1, k * 2), display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${lk && f >= candF ? t.border : t.accent}`, borderRadius: 14, padding: "11px 12px" }}>
          <Icon name={onChats ? "chat" : "cal"} color={lk ? t.textMuted : t.accent} size={22} />
          <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: lk ? t.textMuted : t.text }}>{onChats ? `Chat · Jornada ${j}` : `Jornada ${j}`}</div>
          {lk && <Icon name="lock" color={t.textMuted} size={22} />}
        </div>
      ); })}
    </div>
  );
  const sw = f >= actF + 14;
  const settings = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: setO, transform: `translateX(${slideIn(f, S7 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Ajustes" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${sw ? t.accent : t.border}`, borderRadius: 14, padding: "10px 12px" }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Actualizaciones de liga</div><div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1 }}>Jornadas, temporadas, altas y comunicados</div></div>
        <Switch on={sw} />
      </div>
    </div>
  );
  /* notificación de Android al desbloquear */
  const ntK = Math.min(ease((f - (notiF - 16)) / 12), 1 - ease((f - (notiF + 60)) / 10));
  const notif = ntK > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: ntK, transform: `translateY(${(1 - ntK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Liga desbloqueada</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>Ya puedes ver tus enfrentamientos de la Jornada 1.</div>
      </div>
    </div>
  );
  const active = f < S5 - 8 ? 0 : f < S6 - 8 ? 2 : f < chatsF - 6 ? 2 : f < S7 - 8 ? 3 : 4;
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "LA CUENTA ATRÁS"], [S2 + 4, "SEMANA DE APERTURA"], [S3 + 4, "SORPRESA"], [S4 + 4, "20 DE DICIEMBRE"], [S5 + 4, "JORNADA 1 Y SIGUIENTES"], [S6 + 4, "CANDADOS"], [S7 + 4, "AVISOS"]]} />
      <ExampleLabel show={f >= S5 - 8 && f < S7 - 8} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Qué pasa hasta\nel 20 de *diciembre*?"} frames={hookW} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 14} overlay={notif}>
        {homeO > 0.01 && home}{jorO > 0.01 && jor}{lockO > 0.01 && lockScr}{setO > 0.01 && settings}
        <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><TabBar active={active} /></div>
      </PhoneWin>
      {[cuentaF, tarjF, lugarF, sorpF, desbF, entF, sigF, candF, chatsF, actF, partF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", notiF - 8, 0.4)}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <OutroSync league={league} ws={ws} />, BOUNDS, tm, 8, "voice-liga09-david.mp3");
export const LIGA09_FRAMES = g.frames;
export const Liga09Cuenta = g.Comp;
