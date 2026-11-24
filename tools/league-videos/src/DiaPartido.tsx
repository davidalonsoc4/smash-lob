// Vídeo «Día de partido»: abres la aplicación y en la primera pantalla está la tarjeta de tu próximo partido (acceso rápido);
// detalle (hora, lugar, Cómo llegar) → sorteo del saque con la moneda 3D (caras recortadas de la app y animación de lanzamiento) →
// notificación de Android «Falta el resultado» → registrar resultado → la clasificación se actualiza sola → «Tú disfruta del partido».
// Móvil con pantallas replicadas (datos ficticios). Voz: David Martin · Eleven v3 (una toma, pausas con retime_voice.py). Sin pelota guía.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import type { RankRow } from "./appUi";
import { DIFF, LeagueConfig, PRO_LEAGUE, PTS, rankAt } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { MorphBar, ease } from "./Presentacion2";
import { BAR_TOP, Card, HeaderCard, PairBox, RankTable, Ripple, SCR_H, Sec, Vs, WIN_H, WIN_W, Z } from "./Presentacion3";
import { Outro } from "./Bienvenida2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceDiaPartido";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- moneda 3D (caras recortadas de la app: Smash y Lob) ---------- */
export const Coin3D: React.FC<{ size: number; y: number; rx: number; ry: number; rz: number; scale: number }> = ({ size, y, rx, ry, rz, scale }) => {
  const T = size * 0.06;
  const layers = Array.from({ length: 14 });
  return (
    <div style={{ perspective: 1400, width: size, height: size }}>
      <div style={{ position: "relative", width: size, height: size, transformStyle: "preserve-3d", transform: `translateY(${y}px) scale(${scale}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        {layers.map((_, i) => <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", background: i % 2 ? "#cfd2d6" : "#7d8086", transform: `translateZ(${-T / 2 + (i * T) / (layers.length - 1)}px)` }} />)}
        <Img src={staticFile("coin-smash.png")} style={{ position: "absolute", inset: 0, width: size, height: size, backfaceVisibility: "hidden", transform: `translateZ(${T / 2}px)` }} />
        <Img src={staticFile("coin-lob.png")} style={{ position: "absolute", inset: 0, width: size, height: size, backfaceVisibility: "hidden", transform: `rotateX(180deg) translateZ(${T / 2}px)` }} />
      </div>
    </div>
  );
};
// trayectoria del lanzamiento: sube hasta salir de pantalla, cae girando y rebota dos veces
export const tossY = (t: number, peak: number) => {
  if (t <= 0) return 0;
  if (t < 0.34) { const u = t / 0.34; return -peak * (1 - (1 - u) * (1 - u)); }       // sube (frena)
  if (t < 0.76) { const u = (t - 0.34) / 0.42; return -peak * (1 - u * u); }            // cae (acelera)
  if (t < 0.88) { const u = (t - 0.76) / 0.12; return -110 * (1 - (2 * u - 1) ** 2); } // primer bote
  if (t < 0.96) { const u = (t - 0.88) / 0.08; return -36 * (1 - (2 * u - 1) ** 2); }  // segundo bote
  return 0;
};

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q4 = league.exampleQuartet, NAMES = league.playerNames;
  const S = { card: B30(1), detail: B30(2), coin: B30(3), result: B30(4), thanks: B30(5), end: B30(6) };
  const tapF = at(2, "Entra") - 2, comoF = at(2, "cómo"), llegarF = at(2, "llegar");
  const lanzaF = at(3, "lanza"), aireF = at(3, "aire");
  const notiF = at(4, "notificación"), regF = at(4, "registres"), resF = at(4, "resultado"), guaF = at(4, "guardas"), claF = at(4, "clasificación"), actF = at(4, "actualiza");
  const tuF = at(5, "Tú"), demF = at(5, "demás");
  const winIn = ease((f - (S.card - 14)) / 20);
  const hookO = (1 - ease((f - (S.card - 18)) / 12)) * Math.min(1, pop(f, fps, 6, 10) * 2);

  const tossed = f >= S.result + 14;                       // tras el sorteo la pantalla del partido cambia (Pendiente resultado)
  const scrollY = ease((f - (regF - 18)) / 22) * 128;      // el usuario baja hasta «Registrar resultado»
  /* pantallas del móvil */
  const homeO = Math.min(ease((f - (S.card - 6)) / 14), 1 - ease((f - (tapF + 14)) / 10));
  const detailO = Math.min(ease((f - (tapF + 12)) / 14), 1 - ease((f - (claF - 12)) / 10));
  const rankO = ease((f - (claF - 8)) / 14);
  const morph = ease((f - (tapF + 8)) / 24);
  const activeIn = f < claF - 8 ? 2 : 1;
  const names4 = [q4[0], q4[1], q4[2], q4[3]];

  /* tarjeta del próximo partido (home) */
  const cardGlow = Math.max(0, Math.sin(((f - (at(1, "tarjeta") - 6)) / 40) * Math.PI)) * (f > at(1, "tarjeta") - 6 && f < tapF ? 1 : 0);
  const home = (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 9 }}>
      <HeaderCard title="Mis Competiciones" />
      <Sec title="Actividad personal" right="Tu próximo partido" />
      <div style={{ transform: `scale(${1 + 0.02 * cardGlow})`, boxShadow: `0 0 ${24 * cardGlow}px ${t.accent}88`, borderRadius: 18 }}>
        <Card accent pad="10px 14px">
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 6 }}>{league.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PairBox a={names4[0]} b={names4[1]} gold /><Vs /><PairBox a={names4[2]} b={names4[3]} gold /></div>
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, lineHeight: 1.45 }}>
            <div><div style={{ fontWeight: 700 }}>Viernes · 27 nov 2026 · 19:30</div><div style={{ color: t.textMuted }}>Polideportivo Pando</div></div><Icon name="cal" color={t.accent} size={26} />
          </div>
        </Card>
      </div>
    </div>
  );

  /* registrar resultado */
  const fill = (a: number) => pop(f, fps, a, 9);
  const sets: [number, number][] = [[6, 3], [4, 6], [6, 2]];
  const setAt = [regF + 4, resF - 4, guaF - 26];
  const saveP = f >= guaF - 2 && f < guaF + 12 ? 1 : 0;
  const reg = (
    <Card accent={false} pad="9px 12px">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><div style={{ width: 4, height: 16, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 16.5, fontWeight: 800 }}>Registrar resultado</div></div>
      <div style={{ fontSize: 13, color: t.textMuted, paddingLeft: 4 }}>Introduce los tres sets. Cada set ganado suma un punto.</div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, fontSize: 12, color: t.textMuted, paddingRight: 8 }}><span style={{ width: 40, textAlign: "center" }}>Set 1</span><span style={{ width: 40, textAlign: "center" }}>Set 2</span><span style={{ width: 40, textAlign: "center" }}>Set 3</span><span style={{ width: 70, textAlign: "center", color: t.text, fontWeight: 700 }}>Resultado</span></div>
      {[0, 1].map((r) => {
        const total = sets.reduce((a, s, i) => a + (f >= setAt[i] && s[r] > s[1 - r] ? 1 : 0), 0);
        return (
          <div key={r} style={{ width: NATIVE_W - 24 - 24, boxSizing: "border-box", background: t.mutedSurface, borderRadius: 14, padding: "6px 8px", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}><div>{names4[r * 2]}</div><div>{names4[r * 2 + 1]}</div></div>
            {sets.map((s, i) => { const k = f >= setAt[i] ? fill(setAt[i]) : 0; return <div key={i} style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${k > 0.3 ? t.accent : t.border}`, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800, transform: `scale(${0.7 + 0.3 * k})`, opacity: k > 0 ? 1 : 0.5 }}>{k > 0.3 ? s[r] : ""}</div>; })}
            <div style={{ width: 70, textAlign: "center", fontSize: 28, fontWeight: 900 }}>{total}</div>
          </div>);
      })}
      <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "10px 0", marginTop: 8, textAlign: "center", fontSize: 15, fontWeight: 900, transform: `scale(${saveP ? 0.96 : 1})`, boxShadow: saveP ? `0 0 0 4px ${t.accent}44` : "none" }}>Guardar resultado</div>
    </Card>
  );

  /* detalle del partido */
  const comoPulse = f >= llegarF - 18 && f < llegarF + 14 ? 1 + 0.06 * Math.sin(((f - (llegarF - 18)) / 32) * Math.PI) : 1;
  const detail = (
    <div style={{ position: "absolute", left: 12, top: 12 - (tossed ? scrollY : 0), display: "flex", flexDirection: "column", gap: 8 }}>
      <HeaderCard title="Jornada 2" sub={`${league.season} · En curso`} right={tossed ? <div style={{ fontSize: 12, color: "#f2c14e", background: "#3b2f12", borderRadius: 999, padding: "4px 10px", fontWeight: 700 }}>Pendiente resultado</div> : <div style={{ fontSize: 12, color: t.text, background: t.mutedSurface, borderRadius: 999, padding: "4px 10px", fontWeight: 700 }}>Programado</div>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: NATIVE_W - 24 }}>
        {[[names4[0], names4[1]], [names4[2], names4[3]]].map(([a, b], i) => <React.Fragment key={i}>{i === 1 && <Vs />}<div style={{ flex: 1, textAlign: "center", background: t.surface, border: `1px solid ${t.accent}88`, borderRadius: 16, padding: "9px 0", fontWeight: 800, fontSize: 17, lineHeight: 1.5 }}>{a}<div style={{ height: 1, background: `${t.accent}99`, margin: "4px 18px" }} />{b}</div></React.Fragment>)}
      </div>
      <Card accent={false} pad="9px 14px"><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 4, height: 16, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 16.5, fontWeight: 800 }}>Sorteo del saque</div></div>{tossed ? <><div style={{ fontSize: 14.5, marginTop: 4 }}>{q4[0]} y {q4[1]} <b style={{ borderBottom: `2px solid ${t.accent}` }}>empiezan sacando</b></div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 3 }}>{q4[2]} y {q4[3]} restan</div></> : <><div style={{ fontSize: 13, marginTop: 4 }}>Tira la moneda para empezar el partido</div><div style={{ fontSize: 10.5, letterSpacing: 1, color: t.textMuted, marginTop: 3 }}>TOCA LA MONEDA PARA LANZARLA →</div></>}</div>
        <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", boxShadow: `0 0 ${14 * (f >= lanzaF - 28 && f < lanzaF - 6 ? 1 : 0)}px ${t.accent}` }}><Img src={staticFile("coin-smash.png")} style={{ width: 54, height: 54 }} /></div></div></Card>
      {tossed && reg}
      <Card accent={false} pad="9px 14px">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ width: 4, height: 16, borderRadius: 2, background: t.accent }} /><div style={{ fontSize: 16.5, fontWeight: 800 }}>Programación</div></div>
        <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "8px 11px" }}>
          <div style={{ fontSize: 12.5, color: t.textMuted }}>Viernes · 27 de noviembre de 2026 · 19:30</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}><Icon name="pin" color={t.text} size={16} />Polideportivo Pando</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, background: t.accent, color: t.accentContrast, borderRadius: 10, padding: "7px 0", textAlign: "center", fontSize: 13.5, fontWeight: 800, transform: `scale(${comoPulse})`, boxShadow: comoPulse > 1.01 ? `0 0 16px ${t.accent}aa` : "none" }}>➤ Cómo llegar</div>
            <div style={{ flex: 1, background: t.accent, color: t.accentContrast, borderRadius: 10, padding: "7px 0", textAlign: "center", fontSize: 13.5, fontWeight: 800, opacity: 0.85 }}>▦ Calendario</div>
          </div>
        </div>
      </Card>
    </div>
  );

  /* ranking que se actualiza */
  const rkFrom = rankAt(NAMES, 1), rkTo = rankAt(NAMES, 2), rkK = ease((f - actF + 4) / 26);
  const rkRows: RankRow[] = NAMES.map((n) => { const pos = rkFrom[n] + (rkTo[n] - rkFrom[n]) * rkK; return { key: n, name: n.split(" ")[0], pts: Math.round(PTS[n][1] + (PTS[n][2] - PTS[n][1]) * rkK), diff: Math.round(DIFF[n][1] + (DIFF[n][2] - DIFF[n][1]) * rkK), j: 2, pos, shownPos: Math.round(pos), moved: rkFrom[n] !== rkTo[n] && rkK < 0.95, climbing: rkTo[n] < rkFrom[n], tie: false }; });
  const rank = <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 9 }}><HeaderCard title="Ranking individual" sub={`${league.season} · En curso`} /><RankTable rows={rkRows} /></div>;

  /* moneda: pantalla completa con lanzamiento 3D */
  const coinIn = Math.min(ease((f - (lanzaF - 34)) / 14), 1 - ease((f - (S.result + 22)) / 12));
  const D = 84, tossAt = aireF - 6;
  const tt = clamp01((f - tossAt) / D);
  const spin = tt <= 0 ? 0 : 360 * 6 * (1 - Math.pow(1 - tt, 2.2));
  const peak = 980;
  const yy = tossY(tt, peak) * 1;
  const high = clamp01(-yy / peak);
  const coinSize = 400;
  const landed = tt >= 0.97;
  const resK = pop(f, fps, tossAt + Math.round(D * 0.98), 10);
  const idleBob = tt <= 0 ? Math.sin(f / 9) * 6 : 0;
  const swipeText = tt <= 0;
  const coin = (
    <div style={{ position: "absolute", inset: 0, background: "#0a0a0a", opacity: coinIn, transform: `translateY(${(1 - coinIn) * 120}px)`, zIndex: 20 }}>
      <div style={{ position: "absolute", right: 36, top: 40, background: "#2b2b2e", borderRadius: 999, padding: "16px 36px", fontSize: 36, color: "#f4f3ef" }}>Cerrar</div>
      <div style={{ position: "absolute", left: (WIN_W - coinSize) / 2, top: 150 + yy + idleBob }}>
        <div style={{ position: "absolute", left: 40, right: 40, top: coinSize - 20 - yy, height: 46, borderRadius: "50%", background: "#000", opacity: Math.max(0, 0.55 - high * 0.5), filter: "blur(16px)", transform: `scaleX(${1 - 0.4 * high})` }} />
        <Coin3D size={coinSize} y={0} rx={spin} ry={Math.sin(tt * Math.PI * 4) * 10} rz={Math.sin(tt * Math.PI * 3) * 7} scale={1 + 0.22 * high} />
      </div>
      {swipeText && <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center" }}>
        <div style={{ fontSize: 36, color: "#b5b8bf", lineHeight: 1.5 }}>{q4[0]} y {q4[1]}: <b style={{ color: "#f4c542" }}>Smash</b><br />{q4[2]} y {q4[3]}: <b style={{ color: "#f4c542" }}>Lob</b></div>
        <div style={{ fontSize: 50, fontWeight: 800, marginTop: 18 }}>Desliza hacia arriba para lanzar</div>
        <div style={{ margin: "26px 40px 0", background: "#2b2b2e", borderRadius: 30, padding: "30px 0", fontSize: 44, color: "#f4f3ef", transform: `scale(${f >= tossAt - 6 ? 0.97 : 1})` }}>Lanzar</div>
      </div>}
      {landed && <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", opacity: Math.min(1, resK * 1.5), transform: `translateY(${(1 - resK) * 40}px)` }}>
        <div style={{ fontSize: 74, fontWeight: 900, letterSpacing: 3 }}>SMASH</div>
        <div style={{ fontSize: 34, color: "#b5b8bf", marginTop: -4 }}>(remate)</div>
        <div style={{ fontSize: 44, marginTop: 14 }}>Ganan <b style={{ color: "#f4c542" }}>{q4[0]} y {q4[1]}</b></div>
        <div style={{ fontSize: 34, color: "#b5b8bf", margin: "12px 0" }}>¿Qué eliges?</div>
        <div style={{ display: "flex", gap: 22, padding: "0 40px" }}>
          {[["Sacar", "Empiezan sacando"], ["Restar", "Empiezan restando"]].map(([a, b]) => <div key={a} style={{ flex: 1, background: "#fff", color: "#111", borderRadius: 26, padding: "20px 0" }}><div style={{ fontSize: 42 }}>{a}</div><div style={{ fontSize: 26, color: "#555" }}>{b}</div></div>)}
        </div>
      </div>}
    </div>
  );

  /* notificación de Android */
  const notK = Math.min(ease((f - (notiF - 12)) / 12), 1 - ease((f - (regF + 18)) / 10));
  const notif = (
    <div style={{ position: "absolute", left: 28, right: 28, top: 26, opacity: notK, transform: `translateY(${(1 - notK) * -170}px)`, zIndex: 30 }}>
      <div style={{ background: "#26272b", borderRadius: 40, padding: "26px 32px", boxShadow: "0 20px 60px rgba(0,0,0,.6)", border: "1px solid #3a3b40" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26, color: "#b5b8bf" }}><Img src={staticFile("logo.png")} style={{ width: 42, height: 42, borderRadius: 12 }} /><span>Smash & Lob · ahora</span></div>
        <div style={{ fontSize: 40, fontWeight: 800, marginTop: 14 }}>Falta el resultado</div>
        <div style={{ fontSize: 33, color: "#d6d8dc", marginTop: 6, lineHeight: 1.3 }}>No olvides registrar el resultado de tu partido de la Jornada 2.</div>
      </div>
    </div>
  );

  /* cierre: «Tú disfruta del partido…» */
  const thanksK = ease((f - (tuF - 8)) / 16);
  const dimWin = Math.max(thanksK * 0.78, 0);
  const demK = pop(f, fps, demF - 4, 11);

  const TAGS: [number, string][] = [[S.card + 6, "ACCESO RÁPIDO"], [tapF, "TU PARTIDO"], [lanzaF - 6, "SORTEO DEL SAQUE"], [notiF - 6, "AL TERMINAR"], [claF - 8, "CLASIFICACIÓN"]];
  const tagI = f >= S.thanks - 10 ? -2 : TAGS.reduce((a, [s0], i) => (f >= s0 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0], 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" as const };
  const example = f >= S.card && f < S.thanks - 10;
  const ripples = [{ x: NATIVE_W / 2, y: 108, a: tapF }, { x: NATIVE_W / 2, y: 170, a: lanzaF - 6 }, { x: NATIVE_W / 2, y: 290, a: guaF }];

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><Words text={"Es día de *partido*\n¿Por dónde\n*empiezas*?"} size={104} stagger={4} /></div>
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn, transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})`, opacity: 1 - dimWin }}>
            {homeO > 0.01 && <div style={{ opacity: homeO, transform: `translateX(${-(1 - homeO) * 20}px)` }}>{home}</div>}
            {detailO > 0.01 && <div style={{ opacity: detailO, transform: `translateX(${(1 - ease((f - (tapF + 12)) / 14)) * 40}px)` }}>{detail}</div>}
                        {rankO > 0.01 && <div style={{ opacity: rankO, transform: `translateX(${(1 - rankO) * 40}px)` }}>{rank}</div>}
            <div style={{ position: "absolute", left: 0, top: BAR_TOP, width: NATIVE_W }}><MorphBar m={morph} activeOut={f < tapF ? 0 : -1} activeIn={activeIn} dim={[]} lock={[]} /></div>
            {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={46} />)}
          </div>
          {coin}
          {notif}
        </div>
      </div>
      {/* «Tú disfruta del partido: de lo demás se encarga la aplicación» */}
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: thanksK }}>
        <Words text={"Tú *disfruta*\ndel partido"} size={120} delay={Math.max(0, tuF - S.thanks)} stagger={5} />
        <div style={{ marginTop: 70, opacity: demK, transform: `scale(${0.85 + 0.15 * demK})`, display: "flex", alignItems: "center", gap: 28 }}>
          <Img src={staticFile("logo.png")} style={{ width: 150, height: 150, borderRadius: 34 }} />
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.15 }}>De lo demás se<br />encarga la <span style={{ color: t.accent }}>app</span></div>
        </div>
        <div style={{ marginTop: 50 }}><Ball size={80} /></div>
      </div>
      {[tapF, comoF, lanzaF, notiF, regF, guaF, claF, demF].map((m, i) => sfx("pop", Math.max(2, m - 4), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}{sfx("ding", tossAt + Math.round(D * 0.76), 0.5)}{sfx("ding", notiF, 0.4)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Outro league={league} ws={sceneWords(6)} /> },
];
export const DIAPARTIDO_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const DiaPartido: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-dia-partido-david.mp3" />;
void interpolate; void WIN_H; void Sec;
