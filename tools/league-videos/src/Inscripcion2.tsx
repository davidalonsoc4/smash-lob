// Vídeo «Para qué es la inscripción» (v2, sin cifras): una sola escena con elementos compartidos.
// Los 8 jugadores (avatares) aportan monedas al bote → el bote se reparte en pistas, bolas, detalle sorpresa y premio →
// lo que sobra vuelve a los jugadores → cuentas claras (importes cifrados) con pregunta/respuesta → cierre estándar.
// Voz: David Martin · Eleven v3 (una toma, pausas por bloques con retime_voice.py). Sin cifras ni pantallas privadas.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { COLORS, LOOKS, PlayerA, shade } from "./Avatars";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Outro } from "./Bienvenida2";
import { Ico } from "./Inscripcion";
import { ease } from "./Presentacion2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceInscripcion";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const Coin: React.FC<{ x: number; y: number; size?: number; o?: number }> = ({ x, y, size = 34, o = 1 }) => (
  <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: "50%", opacity: o,
    background: "radial-gradient(circle at 35% 30%, #fff3c9, #d7a544 58%, #8a6420)", boxShadow: "0 0 14px rgba(215,165,68,.55)", border: "2px solid #f2d98f55" }} />
);

const Stage = ({ ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3);
  const dineroF = at(1, "dinero"), ligaF = at(1, "liga");
  const cardF = [at(1, "pistas"), at(1, "bolas"), at(1, "detalle"), at(1, "premio")];
  const devF = at(2, "devuelve"), cuF = at(2, "cuentas"), pregF = at(2, "pregúntanos"), ensF = at(2, "enseñamos");

  /* avatares: de la cuadrícula del gancho a la fila superior (mismo elemento) */
  const rowK = ease((f - (S1 - 8)) / 24);
  const av = (i: number) => {
    const gx = 540 + ((i % 4) - 1.5) * 190, gy = 860 + Math.floor(i / 4) * 200;
    const rx = 540 + (i - 3.5) * 118, ry = 330;
    return { x: lerp(gx, rx, rowK), y: lerp(gy, ry, rowK), size: lerp(150, 104, rowK) };
  };
  const hookO = 1 - ease((f - (S1 - 16)) / 12);

  /* bote: grande en el centro → compacto arriba mientras se reparte → grande otra vez al devolver */
  const potK = ease((f - (ligaF - 8)) / 22) - ease((f - (S2 - 6)) / 22);
  const potTop = lerp(540, 430, potK), potH = lerp(240, 150, potK);
  const potO = Math.min(ease((f - (S1 + 4)) / 14), 1 - ease((f - (cuF - 14)) / 12));
  const slot = (j: number) => ({ x: 540 + (j - 3.5) * 62, y: potTop + potH - 44 });
  const FLY = 16;
  const inStart = (i: number) => dineroF + i * 6, outStart = (i: number) => devF + i * 5;
  const fly = (start: number, from: { x: number; y: number }, to: { x: number; y: number }, dur = FLY) => {
    const k = ease((f - start) / dur);
    return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) - Math.sin(Math.PI * k) * 70, vis: f >= start && f < start + dur };
  };
  const filled = (j: number) => f >= inStart(j) + FLY && f < outStart(j);
  const left = Array.from({ length: 8 }).filter((_, j) => filled(j)).length;
  void left;

  /* tarjetas de uso del dinero */
  const CARDS: { ico: "court" | "ball" | "gift" | "trophy"; title: string; sub: string }[] = [
    { ico: "court", title: "Pistas", sub: "Jornada de apertura y de cierre" },
    { ico: "ball", title: "Bolas", sub: "Las de cada partido" },
    { ico: "gift", title: "Detalle de bienvenida", sub: "Será una sorpresa" },
    { ico: "trophy", title: "Premio", sub: "Para la liga" },
  ];
  const cc = (n: number) => ({ x: n % 2 === 0 ? 295 : 785, y: 780 + Math.floor(n / 2) * 260 });
  const cardsO = 1 - ease((f - (S2 - 14)) / 14);

  /* cuentas claras */
  const ledK = pop(f, fps, cuF - 4, 12);
  const ledO = Math.min(1, ledK) * 1;
  const ROWS = ["Pistas", "Bolas", "Detalle", "Premio"];
  const asker = 2;
  const askK = pop(f, fps, pregF, 10), ansK = pop(f, fps, ensF - 2, 10);

  /* etiqueta superior */
  const TAGS: [number, string][] = [[S1 + 4, "EL DINERO DE LA LIGA"], [cardF[0] - 12, "EN QUÉ SE USA"], [S2 + 2, "LO QUE SOBRA"], [cuF - 8, "CUENTAS CLARAS"]];
  const tagI = f >= S3 - 10 ? -2 : TAGS.reduce((a, [s0], i) => (f >= s0 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0], 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill: React.CSSProperties = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" };
  const outO = 1 - ease((f - (S3 - 14)) / 12);

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: outO }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>

      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><Words text={"¿Para qué es\nla *inscripción*?"} size={110} stagger={4} /></div>

      {/* bote de la liga */}
      <div style={{ position: "absolute", left: 160, width: 760, top: potTop, height: potH, opacity: potO * outO, borderRadius: 34, background: t.surface, border: `2px solid ${t.accent}66`, boxShadow: `0 0 50px ${t.accent}22` }}>
        <div style={{ position: "absolute", top: lerp(24, 14, potK), left: 0, right: 0, textAlign: "center", fontSize: lerp(46, 34, potK), fontWeight: 900 }}>Bote de la <span style={{ color: t.accent }}>liga</span></div>
        {Array.from({ length: 8 }).map((_, j) => { const s = slot(j); return <div key={j} style={{ position: "absolute", left: s.x - 160 - 17, top: s.y - potTop - 17, width: 34, height: 34, borderRadius: "50%", border: `2px dashed ${t.accent}55` }} />; })}
      </div>
      {Array.from({ length: 8 }).map((_, j) => {
        const s = slot(j);
        const a = av(j);
        const fin = fly(inStart(j), { x: a.x, y: a.y + 56 }, s), fout = fly(outStart(j), s, { x: a.x, y: a.y + 56 });
        return (
          <React.Fragment key={j}>
            {filled(j) && <Coin x={s.x} y={s.y} o={potO * outO} />}
            {fin.vis && <Coin x={fin.x} y={fin.y} />}
            {fout.vis && <Coin x={fout.x} y={fout.y} />}
          </React.Fragment>
        );
      })}

      {/* el bote se reparte */}
      {CARDS.map((c, n) => {
        const p = pop(f, fps, cardF[n], 12), pos = cc(n);
        const fl = fly(cardF[n] - 12, { x: 540, y: potTop + potH / 2 }, pos, 14);
        return (
          <React.Fragment key={n}>
            <div style={{ position: "absolute", left: pos.x - 235, top: pos.y - 115, width: 470, height: 230, boxSizing: "border-box", borderRadius: 30, background: t.surface, border: `2px solid ${f >= cardF[n] && f < cardF[n] + 24 ? t.accent : t.border}`, opacity: p * cardsO * outO, transform: `scale(${0.88 + 0.12 * p})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 20px", textAlign: "center" }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", background: `${t.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ico name={c.ico} color={t.accent} size={52} /></div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.05 }}>{c.title}</div>
              <div style={{ fontSize: 24, color: t.textMuted, lineHeight: 1.1 }}>{c.sub}</div>
            </div>
            {fl.vis && <Coin x={fl.x} y={fl.y} />}
          </React.Fragment>
        );
      })}

      {/* cuentas claras: lista con importes cifrados */}
      {ledO > 0.01 && (
        <div style={{ position: "absolute", left: 160, width: 760, top: 520, opacity: ledO * outO, transform: `scale(${0.92 + 0.08 * ledK})`, borderRadius: 34, background: t.surface, border: `2px solid ${t.accent}66`, padding: "26px 40px 20px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", background: `${t.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}><Ico name="eye" color={t.accent} size={46} /></div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>Cuentas de la <span style={{ color: t.accent }}>liga</span></div>
          </div>
          {ROWS.map((r, i) => { const p = pop(f, fps, cuF + 6 + i * 5, 12); return (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 700, padding: "12px 6px", borderTop: `1px solid ${t.border}`, opacity: clamp01(p) }}><span>{r}</span><span style={{ color: t.textMuted, letterSpacing: 4 }}>•••• €</span></div>
          ); })}
        </div>
      )}
      {askK > 0.01 && <div style={{ position: "absolute", left: 130, top: 1010, opacity: askK * outO, transform: `scale(${0.9 + 0.1 * askK})`, transformOrigin: "left top", background: t.mutedSurface, borderRadius: "30px 30px 30px 8px", padding: "20px 34px", fontSize: 36, fontWeight: 700 }}>¿Tengo una duda?</div>}
      {ansK > 0.01 && <div style={{ position: "absolute", right: 130, top: 1130, opacity: ansK * outO, transform: `scale(${0.9 + 0.1 * ansK})`, transformOrigin: "right top", background: t.accent, color: t.accentContrast, borderRadius: "30px 30px 8px 30px", padding: "20px 34px", fontSize: 36, fontWeight: 900 }}>Te las enseñamos</div>}

      {/* jugadores (mismos elementos del gancho a la fila superior) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = av(i), p = pop(f, fps, 6 + i * 3, 10);
        const back = f >= outStart(i) + FLY && f < outStart(i) + FLY + 24;
        const ask = i === asker && f >= pregF - 4;
        return (
          <div key={i} style={{ position: "absolute", left: a.x - a.size / 2, top: a.y - a.size / 2, opacity: outO, transform: `scale(${p})` }}>
            <PlayerA look={LOOKS[i]} size={a.size} bg={shade(COLORS[i], 0.55)} ring={back || ask ? t.accent : undefined} />
          </div>
        );
      })}
      {[...cardF, devF, cuF, pregF, ensF].map((m, i) => sfx("pop", Math.max(2, m - 4), 0.28 + (i % 3 === 0 ? 0.05 : 0)))}
      {Array.from({ length: 8 }).map((_, i) => sfx("pop", inStart(i) + FLY - 3, 0.18))}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[3] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 3)} /> },
  { key: "outro", dur: Math.round((BOUNDS[4] - BOUNDS[3]) * 30), C: () => <Outro league={league} ws={sceneWords(3)} /> },
];
export const INSCRIPCION2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Inscripcion2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-inscripcion-david.mp3" />;
