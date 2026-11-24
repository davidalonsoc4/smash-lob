// Tutorial genérico 11 · Pagos de pista: quien paga lo indica en el partido y la app calcula quién debe a quién; Mis pagos (debes / te deben, liga o amistoso);
// marcar como pagado o pendiente; avisos y recordatorios si la liga controla los pagos; saldado. Importes ficticios.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { ease } from "./Presentacion2";
import { Card, HeaderCard } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen11";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), END = B30(7);
  const hookW = ["Quién", "te", "debe", "y", "a", "quién", "debes"].map((w) => at(0, w));
  const pagaF = at(1, "paga"), calcF = at(1, "calcula");
  const mpF = at(2, "pagos"), debesF = at(2, "debes"), debenF = at(2, "deben"), ligaF = at(2, "liga"), amisF = at(2, "amistoso");
  const pagasF = at(3, "pagas"), marcaF = at(3, "marca"), pendF = at(3, "pendiente");
  const avisF = at(4, "avisos"), recoF = at(4, "recordatorios");
  const saldF = at(5, "saldado");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S2 - 8), o2 = win(f, S2 - 8, S4 - 8), o3 = win(f, S4 - 8, S5 - 8), o4 = win(f, S5 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const a1 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Pagos y reservas" sub="Jornada 2 · Pista" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: pop(f, fps, pagaF - 6, 10) }}><Av i={0} size={40} ring={t.accent} /><div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>Ana pagó la pista</div><div style={{ fontSize: 18, fontWeight: 900, color: t.accent }}>24,00 €</div></div>
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: t.textMuted, margin: "10px 0 4px", opacity: pop(f, fps, calcF - 8, 10) }}>LA APP CALCULA</div>
        {["Beto", "Carla", "Dani"].map((n, i) => <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14, fontWeight: 700, opacity: pop(f, fps, calcF + i * 6, 10) }}><span>{n} → Ana</span><span style={{ fontWeight: 900 }}>6,00 €</span></div>)}
      </Card>
    </div>
  );
  const paid = f >= marcaF + 12, back = f >= pendF + 8;
  const stateP = back ? false : paid;
  const a2 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2, transform: `translateX(${slideIn(f, S2 - 8)}px)` }}>
      <HeaderCard title="Mis pagos" sub="Liga y amistosos de tu cuenta" />
      <div style={{ display: "flex", gap: 8 }}>
        {[["Debes", "6,00 €", debesF], ["Te deben", "9,00 €", debenF]].map(([l, v, af]) => <div key={l as string} style={{ flex: 1, background: t.surface, border: `1.5px solid ${t.border}`, borderRadius: 14, padding: "8px 10px", opacity: pop(f, fps, (af as number) - 6, 10) }}><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>{(l as string).toUpperCase()}</div><div style={{ fontSize: 20, fontWeight: 900, marginTop: 2, color: l === "Debes" ? "#f87171" : "#34d399" }}>{(f >= S3 && l === "Debes" && stateP) ? "0,00 €" : (v as string)}</div></div>)}
      </div>
      {[["Debes pagar a Ana", "6,00 €", "Liga", 0], ["Carla debe pagarte", "3,00 €", "Amistoso", 1]].map(([lab, amt, org, i]) => { const k = pop(f, fps, mpF + (i as number) * 8, 11), isFirst = i === 0; return (
        <div key={lab as string} style={{ opacity: Math.min(1, k * 2), background: t.surface, border: `1.5px solid ${isFirst && f >= marcaF - 4 ? t.accent : t.border}`, borderRadius: 14, padding: "9px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 14.5, fontWeight: 800 }}>{lab as string}</div><div style={{ fontSize: 15, fontWeight: 900 }}>{amt as string}</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ fontSize: 10.5, fontWeight: 900, borderRadius: 999, padding: "2px 8px", background: t.mutedSurface, color: (org === "Liga" && f >= ligaF - 4) || (org === "Amistoso" && f >= amisF - 4) ? t.accent : t.textMuted }}>{org as string}</div>
            {isFirst && <div style={{ marginLeft: "auto", borderRadius: 10, padding: "6px 12px", fontSize: 12.5, fontWeight: 900, background: stateP ? "#34d399" : t.accent, color: stateP ? "#06281b" : t.accentContrast, opacity: f >= pagasF - 6 ? 1 : 0.0 }}>{stateP ? "✓ Pagado" : back ? "Marcar como pagado" : "Marcar como pagado"}</div>}
          </div>
        </div>
      ); })}
      {f >= pendF && <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, pendF, 10) }}>Puedes dejarlo como pendiente</div>}
    </div>
  );
  const nt = (a: number) => Math.min(ease((f - (a - 14)) / 12), 1 - ease((f - (a + 54)) / 10));
  const card = (k: number, title: string, body: string) => k > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: k, transform: `translateY(${(1 - k) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>{title}</div><div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>{body}</div>
      </div>
    </div>
  );
  const a3 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o3, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Pagos" />
      <div style={{ background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "10px 12px", opacity: pop(f, fps, avisF - 8, 10) }}><div style={{ fontSize: 15, fontWeight: 800 }}>Pagos</div><div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 2 }}>Pagos de pista recibidos y recordatorios de pagos pendientes.</div></div>
    </div>
  );
  const a4 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o4, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Mis pagos" sub="Liga y amistosos de tu cuenta" />
      <Card accent pad="18px 14px"><div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, color: "#34d399", opacity: pop(f, fps, saldF - 4, 10) }}>✓ Saldado</div><div style={{ textAlign: "center", fontSize: 12.5, color: t.textMuted, marginTop: 6 }}>No hay pagos pendientes</div></Card>
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "QUIEN PAGA, LO INDICA"], [S2 + 4, "MIS PAGOS"], [S3 + 4, "PAGADO O PENDIENTE"], [S4 + 4, "AVISOS DE PAGOS"], [S5 + 4, "SALDADO"], [S6 + 4, "REVISA MIS PAGOS"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Quién te *debe*\ny a quién\ndebes?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4], hookW[5], hookW[6]]} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12} overlay={<>{card(nt(avisF), "Pago recibido", "Beto ha marcado como pagada la pista.")}{card(nt(recoF + 30), "Pago pendiente", "Recuerda pagar tu parte de la pista.")}</>}>
        {o1 > 0.01 && a1}{o2 > 0.01 && a2}{o3 > 0.01 && a3}{o4 > 0.01 && a4}
      </PhoneWin>
      {[pagaF, calcF, mpF, debesF, debenF, pagasF, marcaF, pendF, avisF, saldF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", avisF - 8, 0.4)}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen11-david.mp3");
export const GEN11_FRAMES = g.frames;
export const Gen11Pagos = g.Comp;
