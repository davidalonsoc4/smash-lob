// Tutorial genérico 7 · Confirmar o marcar como incorrecto un resultado: aviso → revisar marcador → confirmar / marcar incorrecto → depende de la liga
// (adicional · obligatoria con 24 h y recordatorios · sin confirmaciones).
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Ripple, Vs } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen07";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), S7 = B30(7), END = B30(8);
  const hookW = ["El", "otro", "equipo", "ha", "subido", "el", "resultado"].map((w) => at(0, w));
  const avisoF = at(1, "aviso"), marcF = at(1, "marcador"), confF = at(2, "confírmalo"), incF = at(2, "incorrecto"), revF = at(2, "revisa");
  const adicF = at(4, "adicional"), regF = at(4, "registra"), oblF = at(5, "obligatoria"), h24F = at(5, "24"), recF = at(5, "recordatorios"), nadaF = at(6, "nada");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const detO = win(f, S1 - 10, S3 - 8), modO = win(f, S3 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const confirmed = f >= confF + 14 && f < incF - 10;
  const wrong = f >= incF - 4 && f < S3 - 8;
  const detail = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Jornada 2" sub="Detalle del partido" right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: "#3b2f12", color: "#f2c14e" }}>{wrong ? "En revisión" : confirmed ? "Confirmado" : "Por confirmar"}</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a="Ana" b="Beto" gold /><Vs /><PairBox a="Carla" b="Dani" gold /></div>
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted }}>RESULTADO REGISTRADO POR EL OTRO EQUIPO</div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 24, fontWeight: 900, opacity: pop(f, fps, marcF - 6, 10) }}><span>6 – 4</span><span>3 – 6</span><span>6 – 2</span></div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, textAlign: "center", borderRadius: 12, padding: "11px 0", fontSize: 14, fontWeight: 900, background: confirmed ? "#34d399" : "#34d39922", color: confirmed ? "#06281b" : "#34d399", opacity: pop(f, fps, confF - 14, 10) }}>✓ Confirmar</div>
          <div style={{ flex: 1, textAlign: "center", borderRadius: 12, padding: "11px 0", fontSize: 14, fontWeight: 900, background: wrong ? "#f87171" : "#f8717122", color: wrong ? "#2b0a0a" : "#f87171", opacity: pop(f, fps, confF - 14, 10) }}>✕ Marcar incorrecto</div>
        </div>
        {wrong && <div style={{ marginTop: 10, textAlign: "center", fontSize: 12.5, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, revF - 10, 10) }}>La administración lo revisa</div>}
      </Card>
    </div>
  );
  const MODES: [string, string, number][] = [
    ["Confirmación adicional", "Se puede confirmar o marcar como incorrecto, pero ya cuenta desde que se registra.", adicF],
    ["Confirmación obligatoria", "Suma cuando lo confirman los demás o, si nadie lo marca, a las 24 h. Recordatorios mientras esté pendiente.", oblF],
    ["Sin confirmaciones", "No hay nada que hacer: el resultado cuenta al guardarlo.", nadaF - 20],
  ];
  const on = (i: number) => f >= MODES[i][2] - 8 && (i === 2 || f < MODES[i + 1][2] - 8);
  const modes = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: modO, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Confirmación del resultado" sub="Depende de la liga" />
      {MODES.map(([title, desc, af], i) => { const k = pop(f, fps, af - 14, 12), hl = on(i); return (
        <div key={title} style={{ opacity: Math.min(1, k * 2), transform: `scale(${hl ? 1.02 : 1})`, background: t.surface, border: `1.5px solid ${hl ? t.accent : t.border}`, borderRadius: 14, padding: "9px 12px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: hl ? t.accent : t.text }}>{title}</div>
          <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>{desc}</div>
          {i === 1 && hl && f >= h24F - 6 && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><Icon name="clock" color={t.accent} size={16} /><div style={{ flex: 1, height: 6, borderRadius: 3, background: t.mutedSurface }}><div style={{ width: `${Math.min(100, ((f - h24F) / 70) * 100)}%`, height: 6, borderRadius: 3, background: t.accent }} /></div><span style={{ fontSize: 11.5, fontWeight: 900, color: t.accent }}>24 h</span>{f >= recF && <Icon name="bell" color={t.accent} size={16} />}</div>}
        </div>
      ); })}
    </div>
  );
  const ntK = Math.min(ease((f - (avisoF - 14)) / 12), 1 - ease((f - (avisoF + 60)) / 10));
  const notif = ntK > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: ntK, transform: `translateY(${(1 - ntK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Resultado registrado</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>El otro equipo ha registrado el resultado de tu partido.</div>
      </div>
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "RECIBES UN AVISO"], [S2 + 4, "CONFIRMA O MARCA"], [S3 + 4, "DEPENDE DE LA LIGA"], [S4 + 4, "CONFIRMACIÓN ADICIONAL"], [S5 + 4, "CONFIRMACIÓN OBLIGATORIA"], [S6 + 4, "SIN CONFIRMACIONES"], [S7 + 4, "REVISA TUS AVISOS DE RESULTADOS"]]} />
      <ExampleLabel show={f >= S1 && f < S3 - 8} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"El otro equipo\nha subido el\n*resultado*"} frames={hookW} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12} overlay={notif}>
        {detO > 0.01 && detail}{modO > 0.01 && modes}
        <Ripple x={110} y={250} at={confF - 2} size={36} />
      </PhoneWin>
      {[avisoF, marcF, confF, incF, adicF, oblF, h24F, recF, nadaF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", avisoF - 8, 0.4)}{void regF}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 8, "voice-gen07-david.mp3");
export const GEN07_FRAMES = g.frames;
export const Gen07Confirmar = g.Comp;
