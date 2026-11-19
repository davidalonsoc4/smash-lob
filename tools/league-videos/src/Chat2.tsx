// Vídeo 3 (v2): chat de la liga. Móvil con réplicas de las pantallas reales (datos ficticios): lista de chats → chat de la liga con el
// mensaje NOVEDAD (vídeo con miniatura 16:9, como en la app) → notificaciones y ajustes como bolitas sueltas → chat de la jornada con la pareja
// y los rivales → sin grupos nuevos cada semana → escribir al chat si hay un problema. Sin pelota guía. Cierre con rebote de la pelota dorada.
// Voz: la original + cierre sobrio empalmado (voice04c). El primer vídeo que se publica en el chat de la liga.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { LeagueConfig, PRO_LEAGUE } from "./Bienvenida";
import { Icon } from "./Presentacion";
import { MorphBar, ease } from "./Presentacion2";
import { BAR_TOP, Card, ChatItem, HeaderCard, Ripple, SCR_H, Sec, WIN_H, WIN_W, Z, dropY } from "./Presentacion3";
import { Outro } from "./Bienvenida2";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice04c";

type P = { league: LeagueConfig; ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿]/g, "").toLowerCase();
const wordsBetween = (i0: number, i1: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i0] - 0.05 && x.s < BOUNDS[i1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i0]) * 30)), e: Math.round((x.e - BOUNDS[i0]) * 30) }));
const sceneWords = (i: number) => wordsBetween(i, i + 1);
const wf = (ws: TimedWord[], text: string, nth = 0) => { const m = ws.filter((x) => norm(x.w) === norm(text)); return (m[nth] ?? m[0] ?? { f: 0 }).f; };
const B30 = (i: number) => Math.round(BOUNDS[i] * 30);
const at = (i: number, text: string, nth = 0) => B30(i) + wf(sceneWords(i), text, nth);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- piezas de la pantalla de chat ---------- */
const TopBar: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => {
  const t = useTheme();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: 50, boxSizing: "border-box", background: t.surface, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10, padding: "0 12px" }}>
      <div style={{ fontSize: 24, color: t.textMuted, lineHeight: 1, marginTop: -2 }}>‹</div>
      <div><div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>{sub && <div style={{ fontSize: 11.5, color: t.textMuted }}>{sub}</div>}</div>
    </div>
  );
};
const SendBall: React.FC<{ color: string }> = ({ color }) => (
  <svg width={26} height={26} viewBox="0 0 26 26" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round">
    <circle cx={16} cy={11} r={6.5} /><path d="M10.6 9c3 .4 4.6 2.4 4.7 4.6M17 4.8c-.2 2.2.8 4 2.6 5.2" /><path d="M2 13h6M4 17h5M6 21h4" opacity={0.7} />
  </svg>
);
const InputBar: React.FC<{ text?: string; caret?: boolean; sendPulse?: number }> = ({ text, caret, sendPulse = 0 }) => {
  const t = useTheme();
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, width: NATIVE_W, height: 62, boxSizing: "border-box", background: t.bg, borderTop: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 8, padding: "0 10px" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="plus" color={t.text} size={22} /></div>
      <div style={{ flex: 1, height: 40, boxSizing: "border-box", borderRadius: 14, border: `1px solid ${t.border}`, background: t.surface, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 14.5, color: text ? t.text : t.textSubtle, overflow: "hidden", whiteSpace: "nowrap" }}>{text || "Escribe un mensaje…"}{caret && <span style={{ width: 2, height: 18, background: t.accent, marginLeft: 1 }} />}</div>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: sendPulse > 0 ? t.accent : t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: `scale(${1 + 0.15 * sendPulse})` }}><SendBall color={sendPulse > 0 ? t.accentContrast : t.textMuted} /></div>
    </div>
  );
};
const Bubble: React.FC<{ name?: string; color?: string; text: string; own?: boolean; k: number }> = ({ name, color, text, own, k }) => {
  const t = useTheme();
  return (
    <div style={{ alignSelf: own ? "flex-end" : "flex-start", maxWidth: 300, opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 24}px) scale(${0.92 + 0.08 * k})`, transformOrigin: own ? "100% 100%" : "0 100%", background: own ? t.accent : t.mutedSurface, color: own ? t.accentContrast : t.text, borderRadius: own ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px" }}>
      {name && <div style={{ fontSize: 11.5, fontWeight: 800, color: color ?? t.accent, marginBottom: 2 }}>{name}</div>}
      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3 }}>{text}</div>
    </div>
  );
};
const NovedadCard: React.FC<{ league: LeagueConfig; k: number; playPulse: number }> = ({ league, k, playPulse }) => {
  const t = useTheme();
  const TW = 322, TH = Math.round((TW * 9) / 16);
  return (
    <div style={{ opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 40}px) scale(${0.94 + 0.06 * k})`, transformOrigin: "50% 100%", width: 368, boxSizing: "border-box", background: "#3a1d10", border: "2px solid #e8962a", borderRadius: 20, padding: "10px 12px 12px", alignSelf: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fbbf24", fontSize: 12.5, fontWeight: 900, letterSpacing: 2.4 }}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg><span style={{ color: t.textMuted }}>NOVEDAD</span></div>
        <div style={{ fontSize: 12, color: t.textMuted }}>14:44</div>
      </div>
      <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 4 }}>{league.name}</div>
      <div style={{ position: "relative", width: TW, height: TH, margin: "8px auto 6px", borderRadius: 14, overflow: "hidden" }}>
        <Img src={staticFile("thumb-03-chat.jpg")} style={{ width: TW, height: TH, objectFit: "cover" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: "50%", background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.18 * playPulse})` }}><div style={{ width: 0, height: 0, borderTop: "9px solid transparent", borderBottom: "9px solid transparent", borderLeft: "15px solid #fff", marginLeft: 4 }} /></div>
        <div style={{ position: "absolute", left: 8, bottom: 8, background: "rgba(0,0,0,.75)", borderRadius: 8, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>0:36</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#ffe9c2" }}>Chat de la liga</div>
    </div>
  );
};

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";
const WaLogo: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
    <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 24 24"><path d={WA_PATH} fill="#fff" /></svg>
  </div>
);

const Stage = ({ league, ws }: P) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const q4 = league.exampleQuartet;
  const S = { main: B30(1), notify: B30(2), round: B30(3), nog: B30(4), prob: B30(5), end: B30(6) };
  const m1 = at(1, "comunicaciones"), m2 = at(1, "avisos"), m3 = at(1, "novedades"), esteF = at(1, "este");
  const notiF = at(2, "notificaciones"), ajF = at(2, "Ajustes"), actF = at(2, "actualizada");
  const propF = at(3, "propio"), fechF = at(3, "fechas"), lugF = at(3, "lugares"), cuaF = at(3, "cuadrar");
  const grupoF = at(4, "grupo"), crearF4 = at(4, "crear") - 6;
  const probF = at(5, "problema"), aquiF = at(5, "aquí");
  const winIn = ease((f - (S.main + 8)) / 20);
  const hookO = (1 - ease((f - (S.main + 2)) / 12)) * Math.min(1, pop(f, fps, 6, 10) * 2);

  /* pantallas */
  type Sc = { from: number; to: number; id: string };
  const scs: Sc[] = [
    { id: "list1", from: S.main + 12, to: S.main + 62 },
    { id: "gen1", from: S.main + 56, to: S.round - 4 },
    { id: "list2", from: S.round - 4, to: propF + 22 },
    { id: "match", from: propF + 16, to: S.prob - 4 },
    { id: "gen2", from: S.prob - 4, to: S.end + 40 },
  ];
  const lvl = (s: Sc) => { const inn = ease((f - s.from) / 14), out = 1 - ease((f - (s.to - 6)) / 8); return { inn, o: Math.min(inn, out) }; };
  const barO = Math.max(lvl(scs[0]).o, lvl(scs[2]).o);
  const dimO = Math.max(ease((f - (S.notify - 2)) / 12) * (1 - ease((f - (S.round - 16)) / 12)), ease((f - (S.nog - 2)) / 12) * (1 - ease((f - (S.prob - 18)) / 12)));

  const listScreen = (rip?: number) => (
    <div style={{ position: "absolute", left: 12, top: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <HeaderCard title="Chats" sub={`${league.season} · En curso`} />
      <Sec title="Chat general" />
      <div style={{ outline: rip !== undefined && f >= rip ? `2px solid ${t.accent}` : "none", borderRadius: 18 }}>
        <Card pad="10px 14px"><div style={{ fontSize: 17, fontWeight: 800 }}>{league.name}</div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{league.season} · 8 participantes</div>
          <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 8, paddingTop: 7, fontSize: 12, color: t.textMuted, display: "flex", justifyContent: "space-between" }}><span><b style={{ color: t.text }}>{league.name}:</b> Novedad: Chat de la liga</span><span>14:44</span></div></Card>
      </div>
      <Sec title="Activos" />
      <div style={{ outline: f >= propF && f < propF + 24 ? `2px solid ${t.accent}` : "none", borderRadius: 18 }}><ChatItem title="Jornada 1" sub={`con ${q4[0]} vs ${q4[2]} y ${q4[3]}`} last="Sin mensajes todavía" /></div>
    </div>
  );

  /* chat de la liga: los mensajes se apilan desde abajo */
  const genMsgs = (final: boolean) => {
    const k1 = final ? 1 : pop(f, fps, m1 - 6, 11), k2 = final ? 1 : pop(f, fps, m2 - 6, 11), k3 = final ? 1 : pop(f, fps, m3 - 6, 12);
    const newest = final ? 1 : (f >= m3 - 6 ? k3 : f >= m2 - 6 ? k2 : k1);
    const newestH = f >= m3 - 6 || final ? 300 : 56;
    const pulse = f >= esteF && f < esteF + 14 ? Math.sin(((f - esteF) / 14) * Math.PI) : 0;
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, bottom: 62, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 8, display: "flex", flexDirection: "column", gap: 8, transform: `translateY(${(1 - newest) * newestH}px)` }}>
          {(final || f >= m1 - 6) && <Bubble name={league.name} text="Jornada de apertura: domingo 20 de diciembre" k={k1} />}
          {(final || f >= m2 - 6) && <Bubble name={league.name} text="Aviso: activa las notificaciones" k={k2} />}
          {(final || f >= m3 - 6) && <NovedadCard league={league} k={k3} playPulse={pulse} />}
        </div>
      </div>
    );
  };
  const typed = "Tengo un problema con mi partido";
  const tp = clamp01((f - (probF - 4)) / (aquiF - 6 - (probF - 4)));
  const typedText = f < aquiF - 2 ? typed.slice(0, Math.floor(tp * typed.length)) : "";
  const sentK = pop(f, fps, aquiF, 11);
  const sendPulse = f >= aquiF - 2 && f < aquiF + 12 ? 1 : 0;

  /* chat de la jornada */
  const mk = (a: number) => pop(f, fps, a - 4, 11);

  const TAGS: [number, string][] = [[S.main + 16, "CHAT DE LA LIGA"], [S.notify, "NOTIFICACIONES"], [S.round, "CHAT DE TU PARTIDO"], [S.nog, "SIN GRUPOS NUEVOS"], [S.prob, "¿ALGÚN PROBLEMA?"]];
  const tagI = TAGS.reduce((a, [s0], i) => (f >= s0 - 4 ? i : a), -1);
  const tagK = tagI < 0 ? 0 : pop(f, fps, TAGS[tagI][0] - 4, 12);
  const prev = tagI > 0 ? TAGS[tagI - 1][1] : "";
  const pill = { background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 5, padding: "14px 34px", borderRadius: 999, whiteSpace: "nowrap" as const };
  const example = f >= propF - 10 && f < S.prob - 6;

  /* bolitas de notificaciones y grupos tachados (sobre el móvil atenuado) */
  const switchOn = ease((f - (notiF + 4)) / 10);
  const drop = (a: number, dur = 22) => (f - (a - dur)) / dur;
  const fadeNotify = 1 - ease((f - (S.round - 22)) / 12);
  const Row: React.FC<{ q: number; children: React.ReactNode; out: number }> = ({ q, children, out }) => <div style={{ display: "flex", alignItems: "center", gap: 36, opacity: (q > 0 ? 1 : 0) * out, transform: `translateY(${dropY(q)}px)` }}>{children}</div>;
  const Circle: React.FC<{ ic: string }> = ({ ic }) => <div style={{ width: 160, height: 160, borderRadius: "50%", background: t.surface, border: `5px solid ${t.accent}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 50px ${t.accent}55`, flexShrink: 0 }}><Icon name={ic} color={t.accent} size={84} /></div>;
  const fadeGroups = 1 - ease((f - (S.prob - 2)) / 12);

  return (
    <Frame timedWords={ws}>
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {tagI >= 0 && <div style={{ position: "relative" }}>
          {prev && <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", opacity: 1 - tagK, ...pill }}>{prev}</div>}
          <div style={{ opacity: tagK, transform: `scale(${0.9 + 0.1 * tagK})`, ...pill }}>{TAGS[tagI][1]}</div>
        </div>}
      </div>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><Words text={"¿Ya has entrado\nen el *chat*\nde la liga?"} size={104} stagger={4} /></div>
      {example && <div style={{ position: "absolute", top: 232, left: 0, right: 0, textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: 5, color: t.textSubtle }}>EJEMPLO · DATOS FICTICIOS</div>}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: winIn, transform: `translateY(${(1 - winIn) * 120}px) scale(${0.94 + 0.06 * winIn})` }}>
        <div style={{ position: "relative", width: WIN_W, height: WIN_H, borderRadius: 56, border: `4px solid ${t.borderStrong}`, overflow: "hidden", background: t.bg, boxShadow: `0 30px 80px rgba(0,0,0,.55), 0 0 0 1px ${t.border}`, boxSizing: "content-box" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: NATIVE_W, height: SCR_H, transformOrigin: "0 0", transform: `scale(${Z})`, opacity: 1 - 0.78 * dimO }}>
            {(() => { const l = lvl(scs[0]); return l.o > 0.01 && <div style={{ opacity: l.o, transform: `translateX(${(1 - l.inn) * 40}px)` }}>{listScreen(S.main + 42)}</div>; })()}
            {(() => { const l = lvl(scs[1]); return l.o > 0.01 && <div style={{ position: "absolute", inset: 0, opacity: l.o, transform: `translateX(${(1 - l.inn) * 46}px)` }}><TopBar title={league.name} sub={`${league.season} · 8 participantes`} />{genMsgs(false)}<InputBar /></div>; })()}
            {(() => { const l = lvl(scs[2]); return l.o > 0.01 && <div style={{ opacity: l.o, transform: `translateX(${(1 - l.inn) * 40}px)` }}>{listScreen()}</div>; })()}
            {(() => { const l = lvl(scs[3]); return l.o > 0.01 && (
              <div style={{ position: "absolute", inset: 0, opacity: l.o, transform: `translateX(${(1 - l.inn) * 46}px)` }}>
                <TopBar title="Jornada 1" sub={`con ${q4[0]} vs ${q4[2]} y ${q4[3]}`} />
                <div style={{ position: "absolute", left: 12, right: 12, top: 62, display: "flex", flexDirection: "column", gap: 10 }}>
                  {f >= fechF - 4 && <Bubble name={q4[2]} color="#8ab4f8" text="¿Jugamos el jueves?" k={mk(fechF)} />}
                  {f >= lugF - 4 && <Bubble name={q4[3]} color="#81c995" text="Mejor en Pando, a las 19:30" k={mk(lugF)} />}
                  {f >= cuaF - 4 && <Bubble own text="Perfecto, cuadrado 👍" k={mk(cuaF)} />}
                </div>
                <InputBar />
              </div>); })()}
            {(() => { const l = lvl(scs[4]); return l.o > 0.01 && (
              <div style={{ position: "absolute", inset: 0, opacity: l.o, transform: `translateX(${(1 - l.inn) * 46}px)` }}>
                <TopBar title={league.name} sub={`${league.season} · 8 participantes`} />
                <div style={{ position: "absolute", left: 0, right: 0, top: 50, bottom: 62, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 12, right: 12, bottom: 8, display: "flex", flexDirection: "column", gap: 8, transform: `translateY(${(1 - sentK) * 56}px)` }}>
                    <div style={{ transform: `translateY(${-0}px)` }}><NovedadCard league={league} k={1} playPulse={0} /></div>
                    {f >= aquiF - 2 && <Bubble own text={typed} k={sentK} />}
                  </div>
                </div>
                <InputBar text={typedText} caret={!!typedText && f % 20 < 12} sendPulse={sendPulse} />
              </div>); })()}
            {barO > 0.01 && <div style={{ position: "absolute", left: 0, top: BAR_TOP, width: NATIVE_W, opacity: barO }}><MorphBar m={1} activeOut={-1} activeIn={3} dim={[]} lock={[]} /></div>}
            <Ripple x={NATIVE_W / 2} y={148} at={S.main + 42} size={46} />
            <Ripple x={NATIVE_W / 2} y={278} at={propF} size={46} />
          </div>
          {/* notificaciones y ajustes: bolitas sueltas */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 44, paddingLeft: 110 }}>
            <Row q={drop(notiF)} out={fadeNotify}><Circle ic="bell" /><div style={{ display: "flex", alignItems: "center", gap: 22 }}><div style={{ fontSize: 56, fontWeight: 900 }}>Notificaciones</div>
              <div style={{ width: 120, height: 66, borderRadius: 33, background: switchOn > 0.5 ? t.accent : t.mutedSurface, position: "relative" }}><div style={{ position: "absolute", top: 7, left: 7 + 54 * switchOn, width: 52, height: 52, borderRadius: "50%", background: "#fff" }} /></div></div></Row>
            <Row q={drop(ajF)} out={fadeNotify}><Circle ic="sliders" /><div style={{ fontSize: 56, fontWeight: 900 }}>Ajustes</div></Row>
            <Row q={drop(at(2, "aplicación"))} out={fadeNotify}><div style={{ display: "flex", alignItems: "center", gap: 22, border: `4px solid ${t.accent}`, background: t.surface, borderRadius: 999, padding: "20px 40px" }}><Icon name="check" color={t.accent} size={64} /><div style={{ fontSize: 50, fontWeight: 900, opacity: pop(f, fps, actF - 4, 10) }}>App actualizada</div></div></Row>
          </div>
          {/* sin grupos nuevos cada semana */}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 34, opacity: fadeGroups }}>
            {[1, 2, 3].map((n, i) => {
              const a0 = crearF4 + i * 14;                // aparece
              const k = pop(f, fps, a0, 11);
              const cross = ease((f - (a0 + 10)) / 24);   // se va tachando poco a poco, cada uno a su ritmo
              return (
                <div key={n} style={{ position: "relative", opacity: k, transform: `scale(${0.8 + 0.2 * k})`, display: "flex", alignItems: "center", gap: 24, background: t.surface, border: `3px solid ${cross > 0.95 ? "#6b3a37" : t.borderStrong}`, borderRadius: 40, padding: "26px 44px", width: 640 }}>
                  <WaLogo size={84} />
                  <div style={{ fontSize: 46, fontWeight: 800, color: cross > 0.3 ? t.textSubtle : t.text }}>Grupo · semana {n}</div>
                  <div style={{ position: "absolute", left: 30, top: "50%", marginTop: -4, height: 8, width: `${cross * 580}px`, background: "#e5584f", borderRadius: 4 }} />
                </div>); })}
            <div style={{ opacity: ease((f - (crearF4 + 14 * 2 + 28)) / 10), transform: `scale(${0.85 + 0.15 * ease((f - (crearF4 + 14 * 2 + 28)) / 10)})`, marginTop: 10, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "20px 54px", fontSize: 50, fontWeight: 900, letterSpacing: 3 }}>UN SOLO CHAT</div>
          </div>
        </div>
      </div>
      {[m1, m2, m3, esteF, notiF, ajF, actF, propF, fechF, lugF, cuaF, grupoF, probF].map((m, i) => sfx("pop", Math.max(2, m - 4), 0.3 + (i % 3 === 0 ? 0.05 : 0)))}{sfx("ding", aquiF, 0.5)}
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "stage", dur: Math.round(BOUNDS[6] * 30), C: () => <Stage league={league} ws={wordsBetween(0, 6)} /> },
  { key: "outro", dur: Math.round((BOUNDS[7] - BOUNDS[6]) * 30), C: () => <Outro league={league} ws={sceneWords(6)} /> },
];
export const CHAT2_FRAMES = totalFrames(makeScenes(PRO_LEAGUE));
export const Chat2: React.FC<{ league: LeagueConfig }> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} voice="voice-04c-david.mp3" />;
