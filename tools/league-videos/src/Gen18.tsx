// Tutorial genérico 18 · Partidos normales (amistosos): crear (fecha, lugar, jugadores), con cuenta o solo un nombre,
// quién puede editar y quién borrar, y lo mismo que en la liga (moneda, resultado, chat). Nombres y avatares genéricos.
import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { Icon } from "./Presentacion";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, Ripple } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen18";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), END = B30(6);
  const hookW = ["Quieres", "jugar", "un", "partido", "fuera", "de", "la", "liga"].map((w) => at(0, w));
  const creaF = at(1, "Crea"), fechaF = at(1, "fecha"), lugarF = at(1, "lugar"), invitaF = at(1, "invita");
  const cuentaF = at(2, "cuenta"), nombreF = at(2, "nombre");
  const editarF = at(3, "editar"), creoF = at(3, "creó"), borrarF = at(3, "borrar");
  const monedaF = at(4, "moneda"), resF = at(4, "resultado"), chatF = at(4, "chat");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const listO = win(f, S1 - 10, creaF + 14), formO = win(f, creaF + 12, S4 - 8), featO = win(f, S4 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const slots: { n: string; acc: boolean; i: number }[] = [{ n: "Ana", acc: true, i: 0 }, { n: "Beto", acc: true, i: 1 }, { n: "Carla", acc: false, i: 2 }, { n: "Dani", acc: false, i: 3 }];
  const list = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: listO, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>
      <HeaderCard title="Mis partidos" sub="Partidos normales fuera de la liga" />
      <div style={{ borderRadius: 14, padding: "12px 0", textAlign: "center", fontSize: 15.5, fontWeight: 900, background: t.accent, color: t.accentContrast, boxShadow: f >= creaF - 8 ? `0 0 18px ${t.accent}aa` : "none" }}>＋ Crear nuevo encuentro</div>
    </div>
  );
  const canEdit = (i: number) => f >= editarF - 4 && (i < 2 || i === 0);
  const form = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: formO, transform: `translateX(${slideIn(f, creaF + 12)}px)` }}>
      <HeaderCard title="Nuevo encuentro" sub="Fecha, lugar y jugadores" />
      <Card accent={false} pad="10px 12px">
        {[["FECHA", "Sábado · 11:00", fechaF, "clock"], ["LUGAR", "Polideportivo", lugarF, "pin"]].map(([lab, val, af, ico]) => (
          <div key={lab as string} style={{ display: "flex", alignItems: "center", gap: 10, background: t.mutedSurface, borderRadius: 12, padding: "8px 11px", marginBottom: 6, opacity: pop(f, fps, (af as number) - 6, 10) }}>
            <Icon name={ico as string} color={t.accent} size={18} /><div><div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>{lab as string}</div><div style={{ fontSize: 15, fontWeight: 800 }}>{val as string}</div></div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, margin: "8px 0 6px" }}>JUGADORES</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {slots.map((s, k) => {
            const q = pop(f, fps, invitaF + k * 7, 11);
            const tag = s.acc ? f >= cuentaF - 4 : f >= nombreF - 4;
            return (
              <div key={s.n} style={{ textAlign: "center", opacity: Math.min(1, q * 2), transform: `scale(${0.9 + 0.1 * q})` }}>
                <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", lineHeight: 0 }}>{s.acc ? <div style={{ width: 48, height: 48, lineHeight: 0, display: "block" }}><Av i={s.i} size={48} ring={canEdit(k) && f < borrarF - 6 ? t.accent : undefined} /></div> : <div style={{ width: 48, height: 48, borderRadius: "50%", boxSizing: "border-box", background: t.mutedSurface, border: `1.5px dashed ${t.textSubtle}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, lineHeight: 1, color: t.textMuted }}>{s.n[0]}</div>}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 3 }}>{s.n}</div>
                <div style={{ fontSize: 9.5, fontWeight: 900, marginTop: 1, color: s.acc ? t.accent : t.textMuted, opacity: tag ? 1 : 0 }}>{s.acc ? "CON CUENTA" : "SOLO NOMBRE"}</div>
              </div>
            );
          })}
        </div>
      </Card>
      {f >= editarF - 6 && (
        <Card accent={false} pad="9px 12px">
          {[["✎ Editar", "Quien lo creó y los jugadores con cuenta", editarF, "#34d399"], ["✕ Borrar", "Solo quien lo creó", borrarF, "#f87171"]].map(([lab, who, af, col]) => { const k = pop(f, fps, (af as number) - 6, 10); return (
            <div key={lab as string} style={{ display: "flex", alignItems: "center", gap: 10, opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 30}px)`, padding: "5px 0" }}>
              <div style={{ minWidth: 74, fontSize: 14, fontWeight: 900, color: col as string }}>{lab as string}</div><div style={{ fontSize: 12.5, color: t.textMuted, lineHeight: 1.25 }}>{who as string}</div>
            </div>
          ); })}
        </Card>
      )}
      {f >= creoF - 4 && <div style={{ alignSelf: "center", fontSize: 11.5, fontWeight: 800, color: t.textMuted, opacity: pop(f, fps, creoF - 4, 10) }}>★ El creador es Ana</div>}
    </div>
  );
  const feats: [string, number, React.ReactNode][] = [
    ["Lanza la moneda", monedaF, <Img key="c" src={staticFile("coin-smash.png")} style={{ width: 44, height: 44, borderRadius: "50%" }} />],
    ["Registra el resultado", resF, <Icon key="r" name="check" color={t.accent} size={30} />],
    ["Usa el chat del partido", chatF, <Icon key="h" name="chat" color={t.accent} size={30} />],
  ];
  const features = (
    <div style={{ ...base, top: 80, display: "flex", flexDirection: "column", gap: 12, opacity: featO }}>
      {feats.map(([lab, af, ico]) => { const k = pop(f, fps, af - 6, 11); return (
        <div key={lab} style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 60}px)`, display: "flex", alignItems: "center", gap: 14, background: t.surface, border: `1.5px solid ${t.accent}`, borderRadius: 16, padding: "14px 16px" }}>
          <div style={{ width: 46, display: "flex", justifyContent: "center" }}>{ico}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{lab}</div>
        </div>
      ); })}
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "CREA UN AMISTOSO"], [S2 + 4, "JUGADORES"], [S3 + 4, "EDITAR Y BORRAR"], [S4 + 4, "COMO EN LA LIGA"], [S5 + 4, "CREA AHORA TU PRÓXIMO AMISTOSO"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"¿Quieres jugar\nun partido *fuera*\nde la liga?"} frames={[hookW[0], hookW[1], hookW[2], hookW[3], hookW[4], hookW[5], hookW[6], hookW[7]]} size={100} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {listO > 0.01 && list}{formO > 0.01 && form}{featO > 0.01 && features}
        <Ripple x={206} y={92} at={creaF - 2} size={40} />
      </PhoneWin>
      {[creaF, fechaF, lugarF, invitaF, cuentaF, nombreF, editarF, borrarF, monedaF, resF, chatF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 6, "voice-gen18-david.mp3");
export const GEN18_FRAMES = g.frames;
export const Gen18Amistosos = g.Comp;
