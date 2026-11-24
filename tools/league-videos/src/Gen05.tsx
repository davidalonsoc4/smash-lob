// Tutorial genérico 5 · El sorteo del saque: se activa 30 min antes (aviso), cualquiera de los cuatro jugadores lanza la moneda,
// el resultado lo ven todos, vale para liga y amistosos, y el aviso se puede desactivar en notificaciones. Nombres y avatares genéricos.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Coin3D, tossY } from "./DiaPartido";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, PairBox, Ripple, Vs, WIN_W } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Switch, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen05";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const N = ["Ana", "Beto", "Carla", "Dani"];

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6);
  const hookW = ["Quién", "saca", "primero", "Que", "lo", "decida", "la", "moneda"].map((w) => at(0, w));
  const mediaF = at(1, "Media"), avisoF = at(1, "aviso"), puedesF = at(1, "puedes");
  const cuatroF = at(2, "cuatro"), deslizaF = at(2, "desliza"), giraF = at(2, "girar");
  const verF = at(3, "ven"), restaF = at(3, "resta");
  const ligaF = at(4, "liga"), amisF = at(4, "amistosos");
  const desF = at(5, "desactivarlo");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const detO = win(f, S1 - 10, S5 - 8), setO = win(f, S5 - 8, S6 - 6);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };

  const open = f >= mediaF + 26;                      // el sorteo se activa
  const tossed = f >= restaF - 2;
  const detail = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Jornada 1" sub="Detalle del partido" right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: t.mutedSurface }}>Programado</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={N[0]} b={N[1]} gold /><Vs /><PairBox a={N[2]} b={N[3]} gold /></div>
      <Card accent={false} pad="10px 14px">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 4, height: 16, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 16.5, fontWeight: 800 }}>Sorteo del saque</div></div>
            {tossed ? <><div style={{ fontSize: 14.5, marginTop: 4 }}>{N[0]} y {N[1]} <b style={{ borderBottom: `2px solid ${t.accent}` }}>empiezan sacando</b></div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>{N[2]} y {N[3]} restan</div></>
              : open ? <div style={{ fontSize: 13, marginTop: 4 }}>Tira la moneda para empezar el partido</div>
              : <div style={{ fontSize: 13, marginTop: 4, color: t.textMuted }}>La moneda se activa 30 min antes</div>}
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", opacity: open ? 1 : 0.35, boxShadow: open && !tossed ? `0 0 ${12 + 6 * Math.sin(f / 5)}px ${t.accent}` : "none" }}><Img src={staticFile("coin-smash.png")} style={{ width: 54, height: 54 }} /></div>
            {!open && f >= mediaF - 6 && <div style={{ position: "absolute", right: -6, top: -10, background: t.accent, color: t.accentContrast, fontSize: 11, fontWeight: 900, borderRadius: 999, padding: "2px 7px", opacity: pop(f, fps, mediaF - 6, 10) }}>−30 min</div>}
          </div>
        </div>
      </Card>
      {tossed && (
        <Card accent={false} pad="10px 12px">
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {N.map((n, i) => { const k = pop(f, fps, verF + i * 6, 11); const saca = i < 2; return (
              <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.9 + 0.1 * k})`, textAlign: "center" }}><Av i={i} size={46} ring={saca ? t.accent : undefined} /><div style={{ fontSize: 11.5, fontWeight: 800, marginTop: 2 }}>{n}</div><div style={{ fontSize: 10.5, fontWeight: 900, color: saca ? t.accent : t.textMuted }}>{saca ? "SACA" : "RESTA"}</div></div>
            ); })}
          </div>
        </Card>
      )}
      {f >= ligaF - 8 && (
        <div style={{ display: "flex", gap: 8 }}>
          {[["Partido de liga", ligaF], ["Amistoso", amisF]].map(([lab, af]) => { const k = pop(f, fps, (af as number) - 8, 11); return <div key={lab as string} style={{ flex: 1, opacity: Math.min(1, k * 2), transform: `scale(${0.92 + 0.08 * k})`, display: "flex", alignItems: "center", gap: 8, background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "8px 10px" }}><div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden" }}><Img src={staticFile("coin-smash.png")} style={{ width: 28, height: 28 }} /></div><div style={{ fontSize: 13, fontWeight: 800 }}>{lab as string}</div></div>; })}
        </div>
      )}
    </div>
  );
  const off = f >= desF + 6;
  const settings = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: setO, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Notificaciones" sub="Elige qué avisos quieres recibir" />
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 14, padding: "10px 12px" }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>Antes de jugar</div><div style={{ fontSize: 10.5, color: t.textMuted, marginTop: 1 }}>Recordatorio del próximo partido, bolas y sorteo del saque</div></div>
        <Switch on={!off} />
      </div>
    </div>
  );

  /* moneda 3D (misma animación que «Día de partido») */
  const coinIn = Math.min(ease((f - (S2 - 6)) / 14), 1 - ease((f - (S3 + 40)) / 12));
  const D = 84, tossAt = giraF - 30;
  const tt = clamp01((f - tossAt) / D);
  const spin = tt <= 0 ? 0 : 360 * 6 * (1 - Math.pow(1 - tt, 2.2));
  const peak = 980, yy = tossY(tt, peak), high = clamp01(-yy / peak), coinSize = 400, landed = tt >= 0.97;
  const resK = pop(f, fps, tossAt + Math.round(D * 0.98), 10);
  const idleBob = tt <= 0 ? Math.sin(f / 9) * 6 : 0;
  const hand = (i: number) => f >= cuatroF - 4 + i * 8 && f < cuatroF + 44 + i * 8;
  const coin = coinIn > 0.01 && (
    <div style={{ position: "absolute", inset: 0, background: "#0a0a0a", opacity: coinIn, transform: `translateY(${(1 - coinIn) * 120}px)`, zIndex: 20 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, display: "flex", justifyContent: "center", gap: 36 }}>
        {N.map((n, i) => <div key={n} style={{ textAlign: "center", transform: `scale(${hand(i) ? 1.12 : 1})`, opacity: pop(f, fps, S2 + i * 4, 10) }}><Av i={i} size={110} ring={hand(i) ? t.accent : undefined} /><div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{n}</div></div>)}
      </div>
      <div style={{ position: "absolute", left: (WIN_W - coinSize) / 2, top: 260 + yy + idleBob }}>
        <div style={{ position: "absolute", left: 40, right: 40, top: coinSize - 20 - yy, height: 46, borderRadius: "50%", background: "#000", opacity: Math.max(0, 0.55 - high * 0.5), filter: "blur(16px)", transform: `scaleX(${1 - 0.4 * high})` }} />
        <Coin3D size={coinSize} y={0} rx={spin} ry={Math.sin(tt * Math.PI * 4) * 10} rz={Math.sin(tt * Math.PI * 3) * 7} scale={1 + 0.22 * high} />
      </div>
      {tt <= 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center" }}><div style={{ fontSize: 50, fontWeight: 800 }}>Desliza hacia arriba para lanzar</div><div style={{ margin: "26px 40px 0", background: "#2b2b2e", borderRadius: 30, padding: "30px 0", fontSize: 44, color: "#f4f3ef" }}>Lanzar</div></div>}
      {landed && <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", opacity: Math.min(1, resK * 1.5), transform: `translateY(${(1 - resK) * 40}px)` }}>
        <div style={{ fontSize: 74, fontWeight: 900, letterSpacing: 3 }}>SMASH</div>
        <div style={{ fontSize: 44, marginTop: 10 }}>Ganan <b style={{ color: "#f4c542" }}>{N[0]} y {N[1]}</b></div>
      </div>}
    </div>
  );
  /* aviso de Android */
  const notK = Math.min(ease((f - (avisoF - 14)) / 12), 1 - ease((f - (puedesF + 70)) / 10));
  const notif = notK > 0.01 && (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: notK, transform: `translateY(${(1 - notK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Sorteo del saque</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>¡Ya puedes sortear el saque de tu partido!</div>
      </div>
    </div>
  );
  const ripples = [{ x: 380, y: 150, a: S2 - 14 }];
  return (
    <Frame timedWords={ws}>
      <Tags endF={S6} tags={[[S1 + 4, "30 MINUTOS ANTES"], [S2 + 4, "LANZA LA MONEDA"], [S3 + 4, "LO VEN TODOS"], [S4 + 4, "LIGA Y AMISTOSOS"], [S5 + 4, "NOTIFICACIONES"]]} />
      <ExampleLabel show={f >= S1 && f < S5 - 8} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Quién saca *primero*?\nQue lo decida\nla *moneda*"} frames={hookW} size={96} /></div>
      <PhoneWin inF={S1 - 12} outF={S6 - 12} overlay={<>{coin}{notif}</>}>
        {detO > 0.01 && detail}{setO > 0.01 && settings}
        {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
      </PhoneWin>
      {[mediaF, avisoF, cuatroF, deslizaF, verF, ligaF, amisF, desF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}{sfx("ding", avisoF - 8, 0.4)}{sfx("ding", tossAt + Math.round(D * 0.76), 0.5)}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 6, "voice-gen05-david.mp3");
export const GEN05_FRAMES = g.frames;
export const Gen05Sorteo = g.Comp;
