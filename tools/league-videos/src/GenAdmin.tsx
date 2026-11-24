// Marco de los tutoriales genéricos de administración (17, 21-28): cada vídeo es solo datos (vistas con tarjetas
// que aparecen al decirse su palabra). Mismo estilo que el resto de genéricos: etiqueta de ejemplo, móvil con réplica
// de la app, última frase en pantalla y cola silenciosa.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Frame, TimedWord, pop, sfx, useTheme } from "./kit";
import { NATIVE_W } from "./appUi";
import { ease } from "./Presentacion2";
import { Card, HeaderCard } from "./Presentacion3";
import { SyncWords } from "./SyncWords";
import { Av, ExampleLabel, PhoneWin, Tags, VW, mkGen, mkTiming, slideIn, win } from "./GenKit";

export type Anchor = [number, string] | [number, string, number]; // [escena, palabra, n-ésima]
export type Item =
  | { k: "row"; t: string; s?: string; ico?: string; a: Anchor; hl?: Anchor }
  | { k: "btn"; t: string; ghost?: boolean; a: Anchor; hl?: Anchor }
  | { k: "note"; t: string; tone?: "ok" | "no" | "info"; a: Anchor }
  | { k: "field"; l: string; v: string; a: Anchor }
  | { k: "toggle"; t: string; a: Anchor; on: Anchor }
  | { k: "avs"; names: string[]; a: Anchor; tag?: [string, Anchor] }
  | { k: "money"; l: string; v: string; a: Anchor; tone?: "ok" | "no" }
  | { k: "chips"; items: string[]; a: Anchor; sel?: number; selAt?: Anchor };
export type View = { a: number; b: number; title: string; sub?: string; items: Item[] };
export type Spec = { BOUNDS: number[]; VOICE: VW[]; voice: string; stageEnd: number; hook: { text: string; words: string[] }; tags: string[]; views: View[]; pops?: Anchor[] };

export const mkAdmin = (sp: Spec) => {
  const tm = mkTiming(sp.BOUNDS, sp.VOICE);
  const { at, B30 } = tm;
  const A = (a: Anchor) => at(a[0], a[1], (a as [number, string, number])[2] ?? 0);

  const ItemView: React.FC<{ it: Item; f: number }> = ({ it, f }) => {
    const t = useTheme(); const { fps } = useVideoConfig();
    const af = A(it.a); const k = pop(f, fps, af - 6, 11);
    const st: React.CSSProperties = { opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 40}px)` };
    const hlOn = (h?: Anchor) => !!h && f >= A(h) - 4;
    const mark = (tone?: string) => (tone === "no" ? ["✕", "#f87171"] : tone === "info" ? ["i", t.accent] : ["✓", "#34d399"]);
    if (it.k === "row") {
      const hl = hlOn(it.hl);
      return (
        <div style={{ ...st, display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1.5px solid ${hl ? t.accent : t.border}`, borderRadius: 16, padding: "12px 14px", boxShadow: hl ? `0 0 0 3px ${t.accent}33` : "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", color: t.accent, fontWeight: 900, fontSize: 17, flexShrink: 0 }}>{it.ico ?? "•"}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16.5, fontWeight: 800 }}>{it.t}</div>{it.s && <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 2, lineHeight: 1.3 }}>{it.s}</div>}</div>
        </div>
      );
    }
    if (it.k === "btn") {
      const hl = hlOn(it.hl);
      return <div style={{ ...st, borderRadius: 14, padding: "13px 0", textAlign: "center", fontSize: 15.5, fontWeight: 900, background: it.ghost ? t.mutedSurface : t.accent, color: it.ghost ? t.text : t.accentContrast, border: it.ghost ? `1.5px solid ${t.border}` : "none", boxShadow: hl ? `0 0 18px ${t.accent}aa` : "none" }}>{it.t}</div>;
    }
    if (it.k === "note") {
      const [m, c] = mark(it.tone);
      return <div style={{ ...st, display: "flex", alignItems: "center", gap: 11, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "11px 13px" }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: c + "26", color: c, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m}</div><div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>{it.t}</div></div>;
    }
    if (it.k === "field") return <div style={{ ...st, background: t.mutedSurface, borderRadius: 12, padding: "8px 12px" }}><div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: t.textMuted }}>{it.l.toUpperCase()}</div><div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 1 }}>{it.v}</div></div>;
    if (it.k === "toggle") {
      const on = f >= A(it.on);
      return <div style={{ ...st, display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "12px 14px" }}><div style={{ flex: 1, fontSize: 15.5, fontWeight: 800 }}>{it.t}</div><div style={{ width: 46, height: 26, borderRadius: 13, background: on ? t.accent : t.border, position: "relative" }}><div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} /></div></div>;
    }
    if (it.k === "avs") {
      const tagOn = it.tag ? f >= A(it.tag[1]) - 4 : false;
      return <div style={{ ...st, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "10px 8px" }}><div style={{ display: "flex", justifyContent: "space-around" }}>{it.names.map((n, i) => <div key={n} style={{ textAlign: "center" }}><Av i={i} size={44} ring={tagOn && i === 0 ? t.accent : undefined} /><div style={{ fontSize: 12, fontWeight: 800, marginTop: 3 }}>{n}</div></div>)}</div>{it.tag && <div style={{ textAlign: "center", marginTop: 8, fontSize: 12.5, fontWeight: 900, color: t.accent, opacity: tagOn ? 1 : 0 }}>{it.tag[0]}</div>}</div>;
    }
    if (it.k === "money") {
      const c = it.tone === "no" ? "#f87171" : it.tone === "ok" ? "#34d399" : t.text;
      return <div style={{ ...st, display: "flex", alignItems: "center", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "12px 14px" }}><div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>{it.l}</div><div style={{ fontSize: 17, fontWeight: 900, color: c }}>{it.v}</div></div>;
    }
    const sel = it.sel !== undefined && it.selAt && f >= A(it.selAt) - 4 ? it.sel : -1;
    return <div style={{ ...st, display: "flex", gap: 6, flexWrap: "wrap" }}>{it.items.map((c, i) => <div key={c} style={{ padding: "9px 12px", borderRadius: 12, fontSize: 13.5, fontWeight: 800, background: i === sel ? t.accent : t.mutedSurface, color: i === sel ? t.accentContrast : t.textMuted, border: `1px solid ${i === sel ? t.accent : t.border}` }}>{c}</div>)}</div>;
  };

  const Stage: React.FC<{ ws: TimedWord[] }> = ({ ws }) => {
    const f = useCurrentFrame();
    const S = (i: number) => B30(i); const END = B30(sp.stageEnd);
    const hookO = 1 - ease((f - (S(1) - 16)) / 12);
    const base = { position: "absolute" as const, left: 12, top: 12, width: NATIVE_W - 24 };
    const hookW = sp.hook.words.map((w) => at(0, w));
    return (
      <Frame timedWords={ws}>
        <Tags endF={END} tags={sp.tags.map((l, i) => [S(i + 1) + 4, l] as [number, string])} />
        <ExampleLabel show={f >= S(1) && f < END - 12} />
        <div style={{ position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: hookO }}><SyncWords text={sp.hook.text} frames={hookW} size={96} /></div>
        <PhoneWin inF={S(1) - 12} outF={END - 12}>
          {sp.views.map((v, vi) => {
            const o = win(f, S(v.a) - 10, Math.min(S(v.b + 1) - 8, END - 12));
            if (o <= 0.01) return null;
            return (
              <div key={vi} style={{ ...base, display: "flex", flexDirection: "column", gap: 9, opacity: o, transform: `translateX(${slideIn(f, S(v.a) - 10)}px)` }}>
                <HeaderCard title={v.title} sub={v.sub} />
                {v.items.map((it, ii) => <ItemView key={ii} it={it} f={f} />)}
              </div>
            );
          })}
        </PhoneWin>
        {(sp.pops ?? []).map((a, i) => sfx("pop", Math.max(2, A(a) - 3), 0.25 + (i % 4 === 0 ? 0.05 : 0)))}
      </Frame>
    );
  };
  const g = mkGen((ws) => <Stage ws={ws} />, null, sp.BOUNDS, tm, sp.stageEnd, sp.voice);
  return { frames: g.frames, Comp: g.Comp };
};
// (Card se reexporta para vistas a medida)
export { Card };
