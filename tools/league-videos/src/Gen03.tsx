// Tutorial genérico 3 · Tu primera jornada paso a paso: encontrar tu partido, emparejamientos visibles o progresivos, margen de jornada,
// propuestas de fecha en el chat (los cuatro votan), recomendaciones de horario (si la liga las activa), confirmar sitio y pista.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W, TabBar } from "./appUi";
import { Icon } from "./Presentacion";
import { Suggest } from "./Perfil";
import { BAR_TOP, Card, HeaderCard, PairBox, Ripple, Sec, Vs } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen03";
import { ease } from "./Presentacion2";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S4 = B30(4), S5 = B30(5), S6 = B30(6);
  const hookW = ["Cómo", "organizas", "tu", "primera", "jornada"].map((w) => at(0, w));
  const abreF = at(1, "Abre"), tuyoF = at(1, "tuyo"), quienF = at(1, "quién");
  const todosF = at(2, "todos"), descF = at(2, "descubriendo");
  const margenF = at(3, "margen"), plazoF = at(3, "plazo");
  const chatF = at(4, "chat"), fechasF = at(4, "fechas"), cuatroF = at(4, "cuatro"), aprobF = at(4, "aprobada"), pendF = at(4, "pendiente");
  const recoF = at(5, "recomienda"), dispF = at(5, "disponibilidad");
  const confF = at(6, "Confirma"), progF = at(6, "programado");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);

  const matchO = win(f, S1 - 10, S4 - 8);       // pantalla Partidos (scenes 1-3) -> más tarde detalle
  const chatO = win(f, S4 - 8, S5 - 8);         // chat con propuestas
  const detO = Math.max(win(f, S5 - 8, S6 - 6), win(f, S6 - 6, B30(7) - 12));
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const names = ["Ana", "Beto", "Carla", "Dani"];
  const prog = f >= progF - 6;
  const reserva = f >= confF - 6 && !prog;

  /* Partidos: tarjeta de mi partido + emparejamientos visibles / progresivos + margen */
  const matches = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: matchO }}>
      <HeaderCard title="Partidos" sub="Jornada 1" />
      <Card accent pad="10px 12px">
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: t.textMuted, marginBottom: 6 }}>TU PARTIDO</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, transform: `scale(${f >= tuyoF - 4 && f < tuyoF + 20 ? 1.03 : 1})` }}><PairBox a={names[0]} b={names[1]} gold /><Vs /><PairBox a={names[2]} b={names[3]} gold /></div>
      </Card>
      {f >= todosF - 10 && (
        <Card accent={false} pad="10px 12px">
          <div style={{ fontSize: 13.5, fontWeight: 900, marginBottom: 6 }}>Emparejamientos según la liga</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ opacity: pop(f, fps, todosF - 6, 10), border: `1.5px solid ${f >= descF - 10 ? t.border : t.accent}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, fontWeight: 700 }}>▦ Calendario completo desde el principio</div>
            <div style={{ opacity: pop(f, fps, descF - 8, 10), border: `1.5px solid ${f >= descF - 10 ? t.accent : t.border}`, borderRadius: 10, padding: "8px 10px", fontSize: 13, fontWeight: 700 }}>🔓 Se descubren jornada a jornada</div>
          </div>
        </Card>
      )}
      {f >= margenF - 10 && (
        <Card accent={false} pad="10px 12px">
          <div style={{ fontSize: 13.5, fontWeight: 900, marginBottom: 6 }}>Margen de la jornada</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, opacity: pop(f, fps, margenF - 6, 10), border: `1.5px solid ${t.accent}`, borderRadius: 10, padding: "8px 8px", fontSize: 12.5, fontWeight: 700, textAlign: "center" }}>⏱ X días por jornada</div>
            <div style={{ flex: 1, opacity: pop(f, fps, plazoF - 8, 10), border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "8px 8px", fontSize: 12.5, fontWeight: 700, textAlign: "center" }}>∞ Sin plazo</div>
          </div>
        </Card>
      )}
    </div>
  );
  /* Chat: propuestas de fecha con votos de los cuatro */
  const vote = (i: number) => f >= cuatroF + 6 + i * 8;
  const chat = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: chatO, transform: `translateX(${slideIn(f, S4 - 8)}px)` }}>
      <HeaderCard title="Chat del partido" sub="Jornada 1" />
      <Card accent={false} pad="10px 12px">
        <div style={{ opacity: pop(f, fps, fechasF - 6, 10) }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: t.textMuted }}>PROPUESTA DE FECHA</div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3 }}>Jueves · 19:30</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
          {names.map((n, i) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ position: "relative" }}><Av i={i} size={44} />{vote(i) && <div style={{ position: "absolute", right: -6, bottom: -4, width: 20, height: 20, borderRadius: "50%", background: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" color="#06281b" size={13} /></div>}</div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{n}</div>
            </div>
          ))}
        </div>
        {f >= aprobF - 4 && <div style={{ marginTop: 10, textAlign: "center", fontSize: 13.5, fontWeight: 900, color: "#34d399", opacity: pop(f, fps, aprobF - 4, 10) }}>✓ Fecha aprobada</div>}
      </Card>
      {f >= pendF - 4 && <div style={{ alignSelf: "center", opacity: pop(f, fps, pendF - 4, 10), background: "#3b2f12", color: "#f2c14e", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 900 }}>Pendiente de reserva</div>}
    </div>
  );
  /* Detalle: recomendaciones de horario (si la liga lo activa) + confirmar sitio y pista */
  const detail = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: detO, transform: `translateX(${slideIn(f, S5 - 8)}px)` }}>
      <HeaderCard title="Jornada 1" sub="Detalle del partido" right={<div style={{ fontSize: 11.5, fontWeight: 800, borderRadius: 999, padding: "4px 10px", background: prog ? t.mutedSurface : "#3b2f12", color: prog ? t.text : "#f2c14e" }}>{prog ? "Programado" : "Pendiente de reserva"}</div>} />
      {f < confF - 8 ? (
        <>
          <div style={{ opacity: pop(f, fps, recoF - 4, 10) }}><Sec title="Horarios recomendados" /></div>
          <div style={{ zoom: (NATIVE_W - 24) / NATIVE_W }}><Suggest date="JUEVES" time="19:30 – 21:30" at={recoF} /></div>
          <div style={{ zoom: (NATIVE_W - 24) / NATIVE_W }}><Suggest date="SÁBADO" time="10:00 – 12:00" at={dispF} /></div>
          <div style={{ fontSize: 12, color: t.textMuted, textAlign: "center", opacity: pop(f, fps, recoF + 8, 10) }}>Solo si la liga lo tiene activado</div>
        </>
      ) : (
        <Card accent={false} pad="10px 14px">
          <div style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 6 }}>Reserva</div>
          <div style={{ background: t.mutedSurface, borderRadius: 12, padding: "9px 11px", opacity: pop(f, fps, confF, 10) }}>
            <div style={{ fontSize: 12.5, color: t.textMuted }}>Jueves · 19:30</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}><Icon name="pin" color={t.text} size={16} />Pista 3 · Polideportivo</div>
          </div>
          <div style={{ marginTop: 8, borderRadius: 12, padding: "9px 0", textAlign: "center", fontSize: 14.5, fontWeight: 900, background: prog ? t.mutedSurface : t.accent, color: prog ? "#34d399" : t.accentContrast }}>{prog ? "✓ Programado" : "Confirmar sitio y pista"}</div>
        </Card>
      )}
    </div>
  );
  const tabActive = f < S4 - 8 ? 2 : f < S5 - 8 ? 3 : 2;
  const ripples = [{ x: 206, y: 150, a: tuyoF - 2 }, { x: 206, y: reserva ? 260 : 260, a: confF + 14 }];
  return (
    <Frame timedWords={ws}>
      <Tags endF={S6 + (B30(7) - S6)} tags={[[S1 + 4, "TU PARTIDO"], [todosF - 12, "EMPAREJAMIENTOS"], [margenF - 12, "MARGEN"], [S4 + 4, "CHAT DEL PARTIDO"], [S5 + 4, "HORARIOS"], [confF - 12, "RESERVA"]]} />
      <ExampleLabel show={f >= S1 && f < B30(7) - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Cómo organizas\ntu *primera*\njornada?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4]]} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={B30(7) - 12}>
        {matchO > 0.01 && matches}{chatO > 0.01 && chat}{detO > 0.01 && detail}
        <div style={{ position: "absolute", left: 0, top: BAR_TOP + 4 }}><TabBar active={tabActive} /></div>
        {ripples.map((r, i) => <Ripple key={i} x={r.x} y={r.y} at={r.a} size={40} />)}
      </PhoneWin>
      {[abreF, tuyoF, quienF, todosF, descF, margenF, plazoF, chatF, fechasF, cuatroF, aprobF, recoF, confF, progF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen03-david.mp3");
export const GEN03_FRAMES = g.frames;
export const Gen03Primera = g.Comp;
