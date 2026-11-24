// Tutorial genérico 15 · Apariencia e idioma: Ajustes → Temas y apariencia (tema base claro/oscuro/sistema, estilo y paleta; solo en el dispositivo) e Idioma (es/en/eu).
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { ease } from "./Presentacion2";
import { Card, HeaderCard, Ripple } from "./Presentacion3";
import { Segmented } from "./Perfil";
import { SyncWords } from "./SyncWords";
import { ExampleLabel, PhoneWin, Tags, mkGen, mkTiming, slideIn, win } from "./GenKit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voice_gen15";

const tm = mkTiming(BOUNDS, VOICE);
const { at, B30 } = tm;

const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const S1 = B30(1), S2 = B30(2), S3 = B30(3), S4 = B30(4), S5 = B30(5), S6 = B30(6), END = B30(7);
  const hookW = ["Deja", "la", "app", "a", "tu", "gusto"].map((w) => at(0, w));
  const ajF = at(1, "Ajustes"), temasF = at(1, "Temas");
  const claroF = at(2, "claro"), oscuroF = at(2, "oscuro"), autoF = at(2, "automático");
  const estiloF = at(3, "estilo"), paletaF = at(3, "paleta");
  const dispF = at(4, "dispositivo");
  const idiomaF = at(5, "Idioma"), esF = at(5, "español"), enF = at(5, "inglés"), euF = at(5, "euskera");
  const hookO = 1 - ease((f - (S1 - 16)) / 12);
  const o1 = win(f, S1 - 10, S2 - 8), o2 = win(f, S2 - 8, S3 - 8), o3 = win(f, S3 - 8, S4 - 8), o4 = win(f, S4 - 8, S5 - 8), o5 = win(f, S5 - 8, S6 - 8), o6 = win(f, S6 - 8, END - 12);
  const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
  const row = (title: string, desc: string, hl: boolean) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${hl ? t.accent : t.border}`, borderRadius: 16, padding: "12px 14px", boxShadow: hl ? `0 0 0 3px ${t.accent}33` : "none" }}>
      <div style={{ width: 36, height: 36, borderRadius: 12, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", color: t.accent, fontWeight: 900, fontSize: 18 }}>◐</div>
      <div style={{ flex: 1 }}><div style={{ fontSize: 17, fontWeight: 800 }}>{title}</div><div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2 }}>{desc}</div></div>
      <div style={{ color: t.textMuted, fontSize: 20 }}>›</div>
    </div>
  );
  const settings = (hl: boolean) => (
    <>
      <HeaderCard title="Ajustes" sub="Tu cuenta y tu app" />
      {row("Mi perfil", "Nombre, imagen y posición", false)}
      {row("Temas y apariencia", "Tema, estilo y paleta", hl)}
      {row("Idioma", "Español, inglés o euskera", false)}
    </>
  );
  const v1 = <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o1, transform: `translateX(${slideIn(f, S1 - 10)}px)` }}>{settings(f >= temasF - 6)}</div>;

  const sel = f >= autoF - 4 ? 2 : f >= oscuroF - 4 ? 1 : 0;
  const dark = sel === 1;
  const v2 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 10, opacity: o2, transform: `translateX(${slideIn(f, S2 - 10)}px)` }}>
      <HeaderCard title="Temas y apariencia" sub="Tema base" />
      <Card accent={false} pad="12px 12px"><Segmented label="Tema base" options={["Claro", "Oscuro", "Sistema"]} sel={f >= claroF - 8 ? sel : 0} /></Card>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", opacity: pop(f, fps, claroF - 6, 10) }}>
        {[["#f4f1ea", "#1a1a1a"], ["#14161b", "#f2f2f2"]].map(([bg, fg], i) => (
          <div key={i} style={{ width: 150, height: 130, borderRadius: 16, background: bg, border: `2px solid ${(i === 1) === dark && sel < 2 ? t.accent : t.border}`, padding: 12, boxSizing: "border-box" }}>
            <div style={{ height: 14, width: "60%", borderRadius: 7, background: fg, opacity: 0.8 }} /><div style={{ height: 10, width: "85%", borderRadius: 5, background: fg, opacity: 0.35, marginTop: 10 }} /><div style={{ height: 28, borderRadius: 10, background: "#d7a544", marginTop: 14 }} />
          </div>
        ))}
      </div>
      {sel === 2 && <div style={{ alignSelf: "center", fontSize: 13.5, fontWeight: 800, color: t.accent }}>Sigue el tema de tu móvil</div>}
    </div>
  );

  const pal = ["#d7a544", "#4aa3df", "#34c28a", "#a06be0", "#e0614f"];
  const palSel = f >= paletaF + 18 ? 1 : f >= paletaF + 8 ? 2 : 0;
  const v3 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 10, opacity: o3, transform: `translateX(${slideIn(f, S3 - 10)}px)` }}>
      <HeaderCard title="Temas y apariencia" sub="Estilo y paleta" />
      <Card accent={false} pad="12px 12px">
        <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, marginBottom: 8 }}>ESTILO</div>
        <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2].map((i) => { const k = pop(f, fps, estiloF - 6 + i * 6, 10); return <div key={i} style={{ flex: 1, height: 70, borderRadius: 14, background: t.mutedSurface, border: `1.5px solid ${i === 0 ? t.accent : t.border}`, opacity: Math.min(1, k * 2), padding: 10, boxSizing: "border-box" }}><div style={{ height: 9, width: "60%", borderRadius: 5, background: t.textMuted, opacity: 0.6 }} /><div style={{ height: 22, borderRadius: i === 1 ? 4 : i === 2 ? 14 : 9, background: t.accent, marginTop: 10 }} /></div>; })}</div>
        <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted, margin: "14px 0 8px" }}>PALETA DE COLOR</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>{pal.map((c, i) => { const k = pop(f, fps, paletaF - 6 + i * 5, 10); return <div key={c} style={{ width: 46, height: 46, borderRadius: "50%", background: c, opacity: Math.min(1, k * 2), border: i === palSel ? `3px solid ${t.text}` : "3px solid transparent", boxSizing: "border-box" }} />; })}</div>
      </Card>
    </div>
  );

  const v4 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 12, opacity: o4, transform: `translateX(${slideIn(f, S4 - 10)}px)` }}>
      <HeaderCard title="Temas y apariencia" sub="Solo en este dispositivo" />
      <Card accent pad="18px 16px">
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: pop(f, fps, dispF - 40, 12) }}>
          <div style={{ width: 34, height: 58, borderRadius: 9, border: `3px solid ${t.accent}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", color: t.accent, fontWeight: 900, fontSize: 18 }}>✓</div>
          <div><div style={{ fontSize: 17, fontWeight: 800 }}>Se guarda en tu dispositivo</div><div style={{ fontSize: 13, color: t.textMuted, marginTop: 3 }}>No cambia en tus otros dispositivos ni para otros jugadores</div></div>
        </div>
      </Card>
    </div>
  );

  const langs = [["Español", esF], ["English", enF], ["Euskera", euF]] as const;
  const langSel = f >= euF - 4 ? 2 : f >= enF - 4 ? 1 : 0;
  const v5 = (
    <div style={{ ...base, display: "flex", flexDirection: "column", gap: 10, opacity: o5, transform: `translateX(${slideIn(f, S5 - 10)}px)` }}>
      <HeaderCard title="Idioma" sub="Elige el idioma de la app" />
      {langs.map(([n, af], i) => { const k = pop(f, fps, af - 8, 10); return (
        <div key={n} style={{ opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 40}px)`, display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${i === langSel ? t.accent : t.border}`, borderRadius: 16, padding: "16px 16px" }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 800 }}>{n}</div>{i === langSel && <div style={{ color: t.accent, fontWeight: 900, fontSize: 20 }}>✓</div>}
        </div>
      ); })}
    </div>
  );
  const v6 = <div style={{ ...base, display: "flex", flexDirection: "column", gap: 8, opacity: o6, transform: `translateX(${slideIn(f, S6 - 10)}px)` }}>{settings(true)}</div>;

  return (
    <Frame timedWords={ws}>
      <Tags endF={END} tags={[[S1 + 4, "AJUSTES · TEMAS"], [S2 + 4, "TEMA BASE"], [S3 + 4, "ESTILO Y PALETA"], [S4 + 4, "SOLO EN TU DISPOSITIVO"], [S5 + 4, "IDIOMA"], [S6 + 4, "DEJA LA APP A TU GUSTO"]]} />
      <ExampleLabel show={f >= S1 && f < END - 12} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={"Deja la app\na tu *gusto*"} frames={hookW} size={104} /></div>
      <PhoneWin inF={S1 - 12} outF={END - 12}>
        {o1 > 0.01 && v1}{o2 > 0.01 && v2}{o3 > 0.01 && v3}{o4 > 0.01 && v4}{o5 > 0.01 && v5}{o6 > 0.01 && v6}
        <Ripple x={206} y={190} at={temasF - 2} size={40} />
      </PhoneWin>
      {[ajF, temasF, claroF, oscuroF, autoF, estiloF, paletaF, dispF, idiomaF, esF, enF, euF].map((m, i) => sfx("pop", Math.max(2, m - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
    </Frame>
  );
};

const g = mkGen((ws) => <Stage ws={ws} />, null, BOUNDS, tm, 7, "voice-gen15-david.mp3");
export const GEN15_FRAMES = g.frames;
export const Gen15Apariencia = g.Comp;
