// Tutorial genérico 14 · Tu perfil y tu disponibilidad: Ajustes → Mi perfil (nombre, imagen, mano dominante, posición) → Mi disponibilidad (si la liga lo usa:
// rápido o por días, horarios para los cuatro) → sin indicar nada = disponibilidad total.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { ease } from "./Presentacion2";
import { HeaderCard, Ripple, Sec } from "./Presentacion3";
import { DAYS, DayChips, Panel, Segmented, SettingsRow, Suggest, TimeBox } from "./Perfil";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen14";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), END = B30(5);
  const hookW = ["Deja", "listo", "tu", "perfil"].map((w) => at(0, w));
  const perfF = at(1, "perfil"), nomF = at(1, "nombre"), imgF = at(1, "imagen"), manoF = at(1, "mano"), posF = at(1, "posición");
  const dispF = at(2, "disponibilidad"), diasF = at(2, "días"), rapF = at(2, "rápido"), horF = at(2, "horarios");
  const nadaF = at(3, "nada"), totF = at(3, "total");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, perfF + 14), o2 = win(f, perfF + 12, S2 - 8), o3 = win(f, S2 - 8, S3 - 8), o4 = win(f, S3 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const hl = Math.min(1, Math.max(0, (f - (perfF - 8)) / 6)) * (f < perfF + 14 ? 1 : 0);
  const lit = DAYS.map((_, i) => f >= diasF + i * 4 && i < 5);
  const ajustes = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1, transform: `translateX(${-(1 - o1) * 20}px)` }}>
      <HeaderCard title="Ajustes" sub="Tu perfil y preferencias de la app" />
      <Sec title="Personal" />
      <div style={{ zoom: 0.94 }}><SettingsRow title="Mi perfil" desc="Tus datos, tu imagen y cómo juegas." icon="user" hl={hl} /></div>
      <div style={{ zoom: 0.94 }}><SettingsRow title="Mi disponibilidad" desc="Define cuándo puedes jugar." icon="clock" hl={0} /></div>
    </div>
  );
  const perfil = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o2, transform: `translateX(${slideIn(f, perfF + 12)}px)` }}>
      <HeaderCard title="Mi perfil" sub="Tus datos y cómo juegas" />
      <div style={{ zoom: 0.94 }}>
        <Panel>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ transform: `scale(${f >= imgF - 4 && f < imgF + 24 ? 1.12 : 1})` }}><Av i={0} size={48} ring={f >= imgF - 4 ? t.accent : undefined} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>NOMBRE</div><div style={{ padding: "7px 10px", borderRadius: 10, background: t.mutedSurface, border: `1px solid ${f >= nomF - 4 ? t.accent : t.border}`, fontSize: 15, fontWeight: 800, marginTop: 4 }}>Ana</div></div>
          </div>
          <Segmented label="Mano dominante" options={["Derecha", "Izquierda"]} sel={f >= manoF + 18 ? 0 : -1} />
          <Segmented label="Posición preferida" options={["Drive", "Revés", "Versátil"]} sel={f >= posF + 22 ? 0 : -1} />
        </Panel>
      </div>
    </div>
  );
  const disp = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o3, transform: `translateX(${slideIn(f, S2 - 8)}px)` }}>
      <HeaderCard title="Mi disponibilidad" sub="Para las recomendaciones de horario" />
      <div style={{ zoom: 0.94 }}>
        <Panel>
          <Segmented label="Modo" options={["Rápido", "Por días"]} sel={f >= rapF ? 0 : -1} />
          <DayChips lit={lit} />
          <div style={{ display: "flex", gap: 10 }}><TimeBox label="DESDE" value="19:00" on={f >= diasF + 24} /><TimeBox label="HASTA" value="21:00" on={f >= diasF + 30} /></div>
        </Panel>
      </div>
      {f >= horF - 6 && <div style={{ zoom: (NATIVE_W - 24) / NATIVE_W }}><Suggest date="SÁBADO" time="19:00 – 21:00" at={horF - 4} /></div>}
    </div>
  );
  const total = f >= totF - 6;
  const tot = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o4, transform: `translateX(${slideIn(f, S3 - 8)}px)` }}>
      <HeaderCard title="Mi disponibilidad" sub="Sin franjas indicadas" />
      <div style={{ zoom: 0.94 }}><Panel><div style={{ fontSize: 17, fontWeight: 800 }}>{total ? "Sin franjas: disponibilidad total" : "Sin franjas indicadas"}</div><DayChips lit={DAYS.map(() => total)} /></Panel></div>
      {total && <div style={{ alignSelf: "center", marginTop: 12, background: t.accent, color: t.accentContrast, borderRadius: 999, padding: "10px 24px", fontSize: 19, fontWeight: 900, opacity: pop(f, fps, totF - 6, 12) }}>Disponibilidad total</div>}
    </div>
  );
  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "AJUSTES · MI PERFIL"], [S2 + 4, "SI TU LIGA LO USA"], [S3 + 4, "SIN INDICAR NADA"], [at(4, "Completa") - 10, "COMPLETA TU PERFIL AHORA"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Deja listo\ntu *perfil*"} frames={hookW} size={120} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {o1 > 0.01 && ajustes}{o2 > 0.01 && perfil}{o3 > 0.01 && disp}{o4 > 0.01 && tot}
        <Ripple x={206} y={146} at={perfF - 2} size={38} />
      </PhoneWin>
      {[perfF, nomF, imgF, manoF, posF, dispF, diasF, rapF, horF, nadaF, totF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};
const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 5, "voice-gen14-david.mp3");
export const GEN14_FRAMES = g.frames;
export const Gen14Perfil = g.Comp;
