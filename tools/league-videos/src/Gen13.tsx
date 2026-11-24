// Tutorial genérico 13 · Configurar tus notificaciones (Ajustes → Notificaciones: 6 interruptores, 2 siempre activos, depende de la liga).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { HeaderCard, Ripple, Sec } from "./Presentacion3";
import { SettingsRow } from "./Perfil";
import { SyncWords } from "./SyncWords";
import { ExampleLabel, GenOutro, PhoneWin, Switch, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen13";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const GROUPS: [string, string][] = [
  ["Antes de jugar", "Recordatorio del próximo partido, bolas y sorteo"],
  ["Cambios en tus partidos", "Fecha, hora, pista, reservas e incidencias"],
  ["Resultados y MVP", "Resultados, confirmaciones, votación y premios"],
  ["Mensajes del chat", "Chat de tus partidos y de tu liga"],
  ["Actualizaciones de liga", "Jornadas, temporadas, altas y comunicados"],
  ["Pagos", "Pagos de pista y recordatorios pendientes"],
];

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S4 = B30(4), S5 = B30(5), S6 = B30(6);
  const hookW = ["Elige", "qué", "avisos", "quieres", "recibir"].map((w) => at(0, w));
  const tapF = at(1, "Notificaciones");
  const gF = [at(2, "Antes"), at(2, "Cambios"), at(2, "Resultados"), at(2, "Mensajes"), at(2, "Actualizaciones"), at(2, "Pagos")];
  const soloF = at(3, "solo"), intF = at(3, "interesen");
  const novF = at(4, "novedades"), menF = at(4, "menciones");
  const mvpF = at(5, "MVP"), pagF = at(5, "pagos");
  const hookO = 1 - ease2(f, S1 - 16);
  const aO = win(f, S1 - 10, tapF + 14), bO = Math.max(win(f, tapF + 12, S4 - 8), win(f, S5 - 8, S6 - 12)), cO = win(f, S4 - 8, S5 - 8);
  const off = (i: number) => (i === 3 && f >= soloF + 4) || (i === 5 && f >= intF - 6);
  const hot = (i: number) => f >= gF[i] - 4 && f < gF[i] + 36;
  const dimR = (i: number) => (f >= S5 - 8 ? (i === 2 || i === 5 ? 1 : 0.4) : 1);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const hl = Math.min(1, Math.max(0, (f - (tapF - 8)) / 6)) * (f < tapF + 14 ? 1 : 0);

  const ajustes = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: aO, transform: `translateX(${-(1 - aO) * 20}px)` }}>
      <HeaderCard title="Ajustes" sub="Tu perfil y preferencias de la app" />
      <Sec title="Personal" />
      <div style={{ zoom: 0.94 }}><SettingsRow title="Mi perfil" desc="Tus datos, tu foto y cómo juegas." icon="user" hl={0} /></div>
      <div style={{ zoom: 0.94 }}><SettingsRow title="Notificaciones" desc="Elige qué avisos quieres recibir." icon="bell" hl={hl} /></div>
    </div>
  );
  const list = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 6, opacity: bO, transform: `translateX(${slideIn(f, f < S4 ? tapF + 12 : S5 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Elige qué avisos quieres recibir" />
      {GROUPS.map(([title, desc], i) => (
        <div key={title} style={{ opacity: Math.min(1, pop(f, fps, tapF + 16 + i * 3, 12) * 2) * dimR(i), display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${hot(i) ? t.accent : t.border}`, borderRadius: 14, padding: "8px 12px", transform: `scale(${hot(i) ? 1.02 : 1})` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{desc}</div>
          </div>
          {f >= S5 - 8 && (i === 2 || i === 5) && <div style={{ fontSize: 10, fontWeight: 900, color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 999, padding: "2px 7px", opacity: pop(f, fps, i === 2 ? mvpF - 4 : pagF - 4, 10) }}>SEGÚN TU LIGA</div>}
          <Switch on={!off(i)} />
        </div>
      ))}
    </div>
  );
  const locked = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: cO, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Siempre activos" sub="No se pueden apagar" />
      {[["Novedades de la liga", novF, "bell"], ["Menciones @ en un chat", menF, "chat"]].map(([title, af, ico]) => {
        const k = pop(f, fps, (af as number) - 6, 12);
        return (
          <div key={title as string} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.92 + 0.08 * k})`, display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 16, padding: "14px 14px" }}>
            <Icon name={ico as string} color={t.accent} size={26} />
            <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>{title as string}</div>
            <Icon name="lock" color={t.textMuted} size={18} /><Switch on locked />
          </div>
        );
      })}
    </div>
  );
  const ripples = [{ x: 206, y: 212, a: tapF - 2 }];

  return (
    <Frame timedWords={ws}>
      <Tags endF={S6} tags={[[S1 + 4, "AJUSTES"], [S2 + 4, "SEIS INTERRUPTORES"], [S4 + 4, "SIEMPRE ACTIVOS"], [S5 + 4, "SEGÚN TU LIGA"]]} />
      <ExampleLabel show={false} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Elige qué *avisos*\nquieres recibir"} frames={hookW} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={S6 - 12}>
        {aO > 0.01 && ajustes}{bO > 0.01 && list}{cO > 0.01 && locked}
        {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
      </PhoneWin>
      {[tapF, ...gF, novF, menF, mvpF, pagF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};
const ease2 = (f: number, a: number) => Math.min(1, Math.max(0, (f - a) / 12));

const g = mkGen((ws) => <Stage ws={ws} />, (ws) => <GenOutro ws={ws} line1="Revisa los *tuyos*" words1={["Revisa", "los", "tuyos"]} line2="*ahora*" words2={["ahora"]} lastWord="ahora" />, BOUNDS, tm, 6, "voice-gen13-david.mp3");
export const GEN13_FRAMES = g.frames;
export const Gen13Notificaciones = g.Comp;
