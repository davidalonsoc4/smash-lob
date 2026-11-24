// Tutorial genérico 10 · Quién lleva las bolas: según la liga, la organización asigna un encargado (por prioridad o entre jugadores elegidos)
// con aviso y recordatorio; si no reparte botes, cada partido estrena bote y el gasto se reparte. Nombres y avatares genéricos.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { ease } from "./Presentacion2";
import { Card, HeaderCard } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen10";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Ball: React.FC<{ size?: number }> = ({ size = 30 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #f3e27a, #c9c02a)", border: "2px solid #fff8", boxSizing: "border-box", flexShrink: 0 }} />
);

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), END = B30(6);
  const hookW = ["Quién", "lleva", "las", "bolas", "a", "tu", "partido"].map((w) => at(0, w));
  const ligaF = at(1, "liga");
  const orgF = at(2, "organización"), asignaF = at(2, "asigna"), encF = at(2, "encargado"), prioF = at(2, "prioridad"), elegF = at(2, "elegidos");
  const avisoF = at(3, "aviso"), recF = at(3, "recordatorio");
  const noF = at(4, "no"), nuevoF = at(4, "nuevo"), gastoF = at(4, "gasto");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S2 - 8), o2 = win(f, S2 - 8, S3 - 8), o3 = win(f, S3 - 8, S4 - 8), o4 = win(f, S4 - 8, S5 - 8), o5 = win(f, S5 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const names = ["Ana", "Beto", "Carla", "Dani"];

  const opts = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 12, opacity: o1, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Bolas del partido" sub="Depende de la liga" />
      {[["Liga con reparto de botes", "La organización asigna un encargado", ligaF + 6], ["Liga sin reparto de botes", "Cada partido estrena un bote nuevo", ligaF + 28]].map(([a, b, af]) => { const k = pop(f, fps, af as number, 11); return (
        <Card key={a as string} accent pad="16px 16px"><div style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 40}px)`, display: "flex", alignItems: "center", gap: 14 }}><Ball size={38} /><div><div style={{ fontSize: 19, fontWeight: 800 }}>{a as string}</div><div style={{ fontSize: 13.5, color: t.textMuted, marginTop: 3 }}>{b as string}</div></div></div></Card>
      ); })}
    </div>
  );

  const match = (hl: boolean, who: number, show2: boolean) => (
    <>
      <HeaderCard title="Partido de la jornada" sub="Sábado · 11:00 · Polideportivo" />
      <Card accent={false} pad="10px 12px">
        <div style={{ display: "flex", justifyContent: "space-around" }}>{names.map((n, i) => <div key={n} style={{ textAlign: "center" }}><Av i={i} size={46} /><div style={{ fontSize: 12, fontWeight: 800, marginTop: 3 }}>{n}</div></div>)}</div>
      </Card>
      <Card accent={hl} pad="12px 14px" style={{ boxShadow: hl ? `0 0 0 3px ${t.accent}44` : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Ball size={34} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>BOLAS</div><div style={{ fontSize: 15.5, fontWeight: 800 }}>Encargado de llevarlas</div></div>
          {show2 && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Av i={who} size={40} ring={t.accent} /><div style={{ fontSize: 14, fontWeight: 900 }}>{names[who]}</div></div>}
        </div>
      </Card>
    </>
  );

  const view2 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2, transform: `translateX(${slideIn(f, S2 - 10)}px)` }}>
      {match(f >= encF - 6, 1, f >= encF - 4)}
      <Card accent={false} pad="10px 12px">
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 6 }}>{f < elegF - 8 ? "ORDEN DE PRIORIDAD" : "JUGADORES ELEGIDOS"}</div>
        {names.map((n, i) => {
          const k = pop(f, fps, prioF + i * 6 - 10, 10);
          const chosen = f >= elegF - 8 ? i === 1 || i === 3 : false;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", opacity: f >= prioF - 12 ? Math.min(1, k * 2) : 0, transform: `translateX(${(1 - k) * 30}px)` }}>
              {f < elegF - 8 ? <div style={{ width: 24, fontSize: 15, fontWeight: 900, color: t.accent }}>{i + 1}.</div> : <div style={{ width: 24, height: 24, borderRadius: 7, border: `2px solid ${chosen ? t.accent : t.border}`, background: chosen ? t.accent : "transparent", color: t.accentContrast, fontSize: 15, fontWeight: 900, textAlign: "center", lineHeight: "20px" }}>{chosen ? "✓" : ""}</div>}
              <Av i={i} size={30} /><div style={{ fontSize: 15, fontWeight: 800 }}>{n}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );

  const note = (title: string, body: string, af: number, top: number) => { const k = pop(f, fps, af - 6, 11); return (
    <div style={{ position: "absolute", left: 14, right: 14, top, opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * -40}px)`, background: "#1c1d22", color: "#fff", borderRadius: 20, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 8px 24px #0008" }}>
      <Img src={staticFile("logo.png")} style={{ width: 40, height: 40, borderRadius: 10 }} />
      <div><div style={{ fontSize: 15.5, fontWeight: 900 }}>{title}</div><div style={{ fontSize: 13, color: "#cfd0d6", marginTop: 2, lineHeight: 1.3 }}>{body}</div></div>
    </div>
  ); };
  const view3 = (
    <div style={{ ...base, left: 0, top: 0, width: NATIVE_W, opacity: o3 }}>
      {note("Encargado de llevar las bolas", "Te toca llevar las bolas al partido del sábado.", avisoF, 40)}
      {note("Recordatorio · Bolas", "Hoy llevas las bolas: partido a las 11:00.", recF, 190)}
    </div>
  );

  const view4 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 10, opacity: o4, transform: `translateX(${slideIn(f, S4 - 10)}px)` }}>
      <HeaderCard title="Partido de la jornada" sub="Sin reparto de botes" />
      <Card accent pad="14px 16px">
        <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: pop(f, fps, nuevoF - 8, 10) }}><Ball size={40} /><div style={{ fontSize: 17, fontWeight: 800 }}>Bote nuevo en cada partido</div></div>
      </Card>
      {f >= gastoF - 10 && (
        <Card accent={false} pad="12px 14px">
          <div style={{ opacity: pop(f, fps, gastoF - 8, 10) }}>
            <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>GASTO REPARTIDO</div>
            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>{names.map((n, i) => <div key={n} style={{ textAlign: "center" }}><Av i={i} size={44} /><div style={{ fontSize: 12, fontWeight: 800, marginTop: 3 }}>{n}</div><div style={{ fontSize: 12.5, fontWeight: 900, color: t.accent }}>1,00 €</div></div>)}</div>
          </div>
        </Card>
      )}
    </div>
  );

  const view5 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o5, transform: `translateX(${slideIn(f, S5 - 10)}px)` }}>
      {match(true, 1, true)}
    </div>
  );

  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "DEPENDE DE LA LIGA"], [S2 + 4, "ENCARGADO ASIGNADO"], [S3 + 4, "AVISO Y RECORDATORIO"], [S4 + 4, "LIGA SIN REPARTO"], [S5 + 4, "MIRA QUIÉN LLEVA LAS BOLAS"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Quién lleva\nlas *bolas*\na tu partido?"} frames={hookW} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {o1 > 0.01 && opts}{o2 > 0.01 && view2}{o3 > 0.01 && view3}{o4 > 0.01 && view4}{o5 > 0.01 && view5}
      </PhoneWin>
      {[ligaF, orgF, asignaF, encF, prioF, elegF, avisoF, recF, noF, nuevoF, gastoF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 6, "voice-gen10-david.mp3");
export const GEN10_FRAMES = g.frames;
export const Gen10Bolas = g.Comp;
