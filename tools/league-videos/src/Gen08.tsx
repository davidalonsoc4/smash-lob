// Tutorial genérico 8 · MVP: votar y premios. Sin MVP / automático básico o avanzado / por votación (3 votos, jornada = suma de votos), recordatorio y aviso de premio.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen08";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), END = B30(7);
  const hookW = ["Al", "terminar", "el", "partido", "quién", "ha", "sido", "el", "MVP"].map((w) => at(0, w));
  const noF = at(2, "no"), autoF = at(2, "automáticamente"), basF = at(2, "básica"), avF = at(2, "avanzada");
  const votF = at(3, "votación"), mismoF = at(3, "mismo");
  const tresF = at(4, "tres"), jorF = at(4, "jornada", 0), sumF = at(4, "suman");
  const recF = at(5, "recordatorio"), premF = at(5, "premios");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S3 - 8), o2 = win(f, S3 - 8, S4 - 8), o3 = win(f, S4 - 8, S5 - 8), o4 = win(f, S5 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const MODES: [string, string, number][] = [["Sin sistema MVP", "No se elegirán MVP.", noF], ["MVP automático", "Se elige con los resultados.", autoF], ["MVP automático avanzado", "Mira también el rendimiento individual.", avF], ["MVP por votación", "Votan los jugadores del partido.", votF]];
  const hl = (i: number) => (i === 0 ? f >= noF - 6 && f < autoF - 6 : i === 1 ? f >= autoF - 6 && f < avF - 8 : i === 2 ? f >= avF - 8 && f < S3 - 8 : false);
  const modes = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Sistema MVP" sub="Lo decide cada liga" />
      {MODES.map(([title, desc, af], i) => { const k = pop(f, fps, af - 12, 11); return (
        <div key={title} style={{ opacity: Math.min(1, k * 2), background: t.surface, border: `1.5px solid ${hl(i) ? t.accent : t.border}`, borderRadius: 14, padding: "9px 12px", transform: `scale(${hl(i) ? 1.02 : 1})` }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: hl(i) ? t.accent : t.text }}>{title}</div><div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{desc}</div>
        </div>
      ); })}
    </div>
  );
  const vote = f >= mismoF - 30 ? 1 : f >= votF + 20 ? 0 : -1;
  const vot = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Vota al MVP" sub="Jornada 2 · tu partido" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {["Beto", "Carla", "Dani"].map((n, i) => { const k = pop(f, fps, votF + i * 6, 11), pick = i === 1 && f >= votF + 30; return (
            <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `scale(${pick ? 1.1 : 1})`, textAlign: "center" }}><Av i={i + 1} size={52} ring={pick ? t.accent : undefined} /><div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 3 }}>{n}</div></div>
          ); })}
        </div>
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 12, color: t.textMuted, opacity: f >= mismoF - 50 ? 1 : 0 }}>No puedes votarte a ti mismo</div>
      </Card>
      {vote >= 0 && <div style={{ borderRadius: 14, padding: "11px 0", textAlign: "center", fontSize: 15, fontWeight: 900, background: t.accent, color: t.accentContrast, opacity: pop(f, fps, votF + 34, 10) }}>Votar</div>}
    </div>
  );
  const nv = Math.min(3, Math.max(0, Math.floor((f - tresF) / 12) + 1));
  const sum = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o3, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="MVP del partido" sub="Con tres votos se decide" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Av i={2} size={54} ring={nv >= 3 ? t.accent : undefined} /><div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800 }}>Carla</div><div style={{ display: "flex", gap: 6, marginTop: 6 }}>{[1, 2, 3].map((v) => <div key={v} style={{ width: 22, height: 22, borderRadius: "50%", background: nv >= v ? t.accent : t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center" }}>{nv >= v && <Icon name="check" color={t.accentContrast} size={14} />}</div>)}</div></div>
          {nv >= 3 && <Icon name="trophy" color={t.accent} size={32} />}
        </div>
      </Card>
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted, marginBottom: 6, opacity: pop(f, fps, jorF - 4, 10) }}>MVP DE LA JORNADA · SUMA DE VOTOS</div>
        {[["Carla", 3], ["Ana", 2], ["Dani", 1]].map(([n, v], i) => <div key={n as string} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", opacity: pop(f, fps, sumF - 6 + i * 6, 10) }}><div style={{ width: 52, fontSize: 13, fontWeight: 800 }}>{n as string}</div><div style={{ flex: 1, height: 8, borderRadius: 4, background: t.mutedSurface }}><div style={{ width: `${((v as number) / 3) * 100}%`, height: 8, borderRadius: 4, background: i === 0 ? t.accent : t.textSubtle }} /></div><div style={{ fontSize: 12, fontWeight: 900 }}>{v as number}</div></div>)}
      </Card>
    </div>
  );
  const ntK = (a: number) => Math.min(ease((f - (a - 14)) / 12), 1 - ease((f - (a + 50)) / 10));
  const nt1 = ntK(recF), nt2 = ntK(premF);
  const card = (k: number, title: string, body: string) => k > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: k, transform: `translateY(${(1 - k) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>{title}</div><div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>{body}</div>
      </div>
    </div>
  );
  const avisos = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o4, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Resultados y MVP" />
      {[["Votación MVP", "Recordatorios para emitir tu voto.", recF], ["MVP concedidos", "MVP del partido y de la jornada.", premF]].map(([a, b, af]) => { const k = pop(f, fps, (af as number) - 8, 11); return <div key={a as string} style={{ opacity: Math.min(1, k * 2), background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "10px 12px" }}><div style={{ fontSize: 15, fontWeight: 800 }}>{a as string}</div><div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>{b as string}</div></div>; })}
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "DEPENDE DE LA LIGA"], [S2 + 4, "AUTOMÁTICO O SIN MVP"], [S3 + 4, "POR VOTACIÓN"], [S4 + 4, "TRES VOTOS"], [S5 + 4, "AVISOS"], [S6 + 4, "MIRA QUÉ SISTEMA USA TU LIGA"]]} />
      <ExampleLabel show={f >= S2 && f < S5 - 8} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Al terminar el partido,\n¿quién ha sido\nel *MVP*?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4], hookW[5], hookW[6], hookW[7], hookW[8]]} size={96} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12} overlay={<>{card(nt1, "Votación MVP", "Te falta votar al MVP de tu partido.")}{card(nt2, "MVP del partido", "Ya hay MVP en tu partido de la Jornada 2.")}</>}>
        {o1 > 0.01 && modes}{o2 > 0.01 && vot}{o3 > 0.01 && sum}{o4 > 0.01 && avisos}
      </PhoneWin>
      {[noF, autoF, basF, avF, votF, tresF, jorF, recF, premF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", recF - 8, 0.4)}{sfx("ding", premF - 8, 0.4)}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen08-david.mp3");
export const GEN08_FRAMES = g.frames;
export const Gen08Mvp = g.Comp;
