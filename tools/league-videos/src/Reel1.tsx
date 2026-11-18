// Instagram · Reel 1 (genérico, sin PRO League): «A ver si vamos un día a jugar a pádel» → la liguilla → Smash & Lob.
// Avatares básicos ficticios, réplicas simplificadas de la app, cierre con logo y eslogan. Voz: David Martin · Eleven v3.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, TimedWord, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { BOUNDS_01 as BOUNDS, VOICE_01 as VOICE } from "./voiceApp1";

type P = { ws: TimedWord[] };
const norm = (w: string) => w.replace(/[,.:;!?¡¿«»]/g, "").toLowerCase();
const sceneWords = (i: number): TimedWord[] =>
  VOICE.filter((x) => x.s >= BOUNDS[i] - 0.05 && x.s < BOUNDS[i + 1]).map((x) => ({ w: x.w, f: Math.max(0, Math.round((x.s - BOUNDS[i]) * 30)), e: Math.round((x.e - BOUNDS[i]) * 30) }));
const wf = (ws: TimedWord[], text: string, nth = 0) => {
  const m = ws.filter((x) => norm(x.w) === norm(text));
  return (m[nth] ?? m[0] ?? { f: 0 }).f;
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ---------- Avatares ficticios (círculo + carita) ---------- */
const COLORS = ["#477BD1", "#3D9D86", "#D4643C", "#8B5FC0", "#53B4D1", "#d7a544", "#C4567A", "#7FA650"];
const NAMES = ["Ana", "Beto", "Carla", "Dani", "Eli", "Fer", "Gus", "Hugo"];
const Av: React.FC<{ i: number; size?: number; ring?: string }> = ({ i, size = 120, ring }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS[i % 8], position: "relative", boxShadow: ring ? `0 0 0 ${Math.max(4, size / 18)}px ${ring}` : "none", flex: "none" }}>
    <div style={{ position: "absolute", left: size * 0.29, top: size * 0.38, width: size * 0.1, height: size * 0.13, borderRadius: "50%", background: "#111" }} />
    <div style={{ position: "absolute", right: size * 0.29, top: size * 0.38, width: size * 0.1, height: size * 0.13, borderRadius: "50%", background: "#111" }} />
    <div style={{ position: "absolute", left: size * 0.32, top: size * 0.52, width: size * 0.36, height: size * 0.2, borderRadius: `0 0 ${size}px ${size}px`, border: `${Math.max(3, size / 28)}px solid #111`, borderTop: "none" }} />
  </div>
);
const Chip: React.FC<{ children: React.ReactNode; gold?: boolean; size?: number }> = ({ children, gold, size = 40 }) => {
  const t = useTheme();
  return <div style={{ display: "inline-block", border: `3px solid ${t.accent}`, background: gold ? t.accent : t.surface, color: gold ? t.accentContrast : t.accent, borderRadius: 999, padding: "14px 36px", fontSize: size, fontWeight: 900, letterSpacing: 4 }}>{children}</div>;
};

/* 1 · Gancho: el chat de siempre */
const Hook: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const msgs = [
    { i: 0, text: "A ver si vamos un día a jugar a pádel", at: 2 },
    { i: 3, text: "Sí, tenemos que ir 😅", at: 22 },
    { i: 6, text: "Cuando queráis", at: 34 },
  ];
  const dots = pop(f, fps, 46, 12);
  return (
    <Frame timedWords={ws}>
      <div style={{ width: 920, display: "flex", flexDirection: "column", gap: 26 }}>
        {msgs.map((m) => { const p = pop(f, fps, m.at, 12); return (
          <div key={m.at} style={{ display: "flex", alignItems: "flex-end", gap: 18, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px)` }}>
            <Av i={m.i} size={86} />
            <div style={{ background: t.mutedSurface, border: `2px solid ${t.border}`, borderRadius: "30px 30px 30px 8px", padding: "22px 30px", fontSize: m.at === 2 ? 50 : 42, fontWeight: 700, maxWidth: 740, lineHeight: 1.2 }}>{m.text}</div>
          </div>); })}
        <div style={{ display: "flex", gap: 14, marginLeft: 104, opacity: dots, background: t.mutedSurface, width: 150, padding: "26px 30px", borderRadius: 40 }}>
          {[0, 1, 2].map((k) => <div key={k} style={{ width: 20, height: 20, borderRadius: "50%", background: t.textMuted, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((f - k * 4) / 5)) }} />)}
        </div>
      </div>
      {sfx("pop", 2, 0.3)}{sfx("pop", 22, 0.3)}{sfx("pop", 34, 0.3)}
    </Frame>
  );
};

/* 2 · Ese día nunca llega: calendario vacío */
const Never: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const nvF = wf(ws, "nunca"), dayF = wf(ws, "día", 1);
  const strike = interpolate(f, [nvF, nvF + 10], [0, 100], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12, width: 900 }}>
        {Array.from({ length: 28 }).map((_, i) => { const p = pop(f, fps, 2 + Math.floor(i / 7) * 5 + (i % 7), 14); return <div key={i} style={{ height: 96, borderRadius: 18, border: `2px solid ${t.border}`, background: t.surface, opacity: p, transform: `scale(${0.85 + 0.15 * p})`, fontSize: 28, fontWeight: 800, color: t.textSubtle, padding: 10 }}>{i + 1}</div>; })}
      </div>
      <div style={{ marginTop: 70, position: "relative", opacity: pop(f, fps, Math.max(0, dayF - 6), 12), fontSize: 76, fontWeight: 900 }}>
        un día de estos
        <div style={{ position: "absolute", left: 0, top: "52%", height: 9, width: `${strike}%`, background: t.accent, borderRadius: 5 }} />
      </div>
    </Frame>
  );
};

/* 3 · La liguilla entre nosotros: los 8 amigos */
const Group: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const lgF = wf(ws, "liguilla");
  const chip = pop(f, fps, Math.max(0, lgF - 4), 10);
  return (
    <Frame timedWords={ws}>
      <div style={{ opacity: chip, transform: `scale(${0.8 + 0.2 * chip})`, marginBottom: 70 }}><Chip gold>LIGUILLA</Chip></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "46px 40px" }}>
        {COLORS.map((_, i) => { const p = pop(f, fps, 4 + i * 5, 9); return <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: Math.min(1, p * 2), transform: `scale(${0.4 + 0.6 * p})` }}><Av i={i} size={170} /><div style={{ fontSize: 32, fontWeight: 800, color: t.textMuted }}>{NAMES[i]}</div></div>; })}
      </div>
    </Frame>
  );
};

/* 4 · Parejas rotativas: cada jornada, otra pareja */
const Pairs: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const orders = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]]; // pareja = posiciones (0,1) y (2,3)
  const step = f < 26 ? 0 : f < 50 ? 1 : 2;
  const mv = step === 0 ? 0 : pop(f, fps, step === 1 ? 26 : 50, 14);
  const slotX = (s: number) => -330 + s * 220 + (s >= 2 ? 40 : 0) - (s < 2 ? 0 : 0);
  const posOf = (av: number, ord: number[]) => ord.indexOf(av);
  const prev = orders[Math.max(0, step - 1)], cur = orders[step];
  return (
    <Frame timedWords={ws}>
      <Words text={"*Parejas* rotativas"} size={84} stagger={4} />
      <div style={{ position: "relative", width: 900, height: 300, marginTop: 50 }}>
        {[0, 1, 2, 3].map((av) => {
          const a = slotX(posOf(av, prev)), b = slotX(posOf(av, cur));
          const x = step === 0 ? slotX(posOf(av, cur)) : a + (b - a) * mv;
          const pairOfAv = posOf(av, cur) < 2 ? 0 : 1;
          return <div key={av} style={{ position: "absolute", left: 450 - 85 + x, top: 40 }}><Av i={av} size={170} ring={pairOfAv === 0 ? t.accent : "#53B4D1"} /></div>;
        })}
        <div style={{ position: "absolute", left: 450 - 28, top: 100, fontSize: 56, fontWeight: 900, color: t.textMuted }}>vs</div>
      </div>
      <div style={{ display: "flex", gap: 22, marginTop: 20 }}>
        {["J1", "J2", "J3"].map((j, k) => <div key={j} style={{ opacity: pop(f, fps, k === 0 ? 4 : k === 1 ? 26 : 50, 12), transform: `scale(${k === step ? 1.15 : 1})` }}><Chip gold={k === step} size={44}>{j}</Chip></div>)}
      </div>
    </Frame>
  );
};

/* 5 · Todos con y contra todos */
const Everyone: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const R = 330, cx = 450, cy = 400;
  const pt = (i: number) => [cx + R * Math.cos((i / 8) * Math.PI * 2 - Math.PI / 2), cy + R * Math.sin((i / 8) * Math.PI * 2 - Math.PI / 2)];
  const lines: [number, number][] = [];
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) lines.push([a, b]);
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", width: 900, height: 800 }}>
        <svg width={900} height={800} style={{ position: "absolute", inset: 0 }}>
          {lines.map(([a, b], k) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); const p = interpolate(f, [6 + k * 1.1, 14 + k * 1.1], [0, 1], clamp); return <line key={k} x1={x1} y1={y1} x2={x1 + (x2 - x1) * p} y2={y1 + (y2 - y1) * p} stroke={t.accent} strokeWidth={3} opacity={0.55} />; })}
        </svg>
        {COLORS.map((_, i) => { const [x, y] = pt(i); const p = pop(f, fps, i * 2, 10); return <div key={i} style={{ position: "absolute", left: x - 55, top: y - 55, transform: `scale(${p})` }}><Av i={i} size={110} /></div>; })}
      </div>
    </Frame>
  );
};

/* 6 · Clasificación individual */
const Ranking: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const pts = [[5, 38], [2, 35], [7, 31], [0, 28], [4, 24], [1, 21], [6, 17], [3, 12]];
  const lastF = wf(ws, "suyo") ;
  return (
    <Frame timedWords={ws}>
      <div style={{ marginBottom: 30, opacity: pop(f, fps, 0, 10) }}><Chip>CLASIFICACIÓN INDIVIDUAL</Chip></div>
      <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 11 }}>
        {pts.map(([av, p], r) => { const k = pop(f, fps, 6 + r * 4, 12); const first = r === 0; return (
          <div key={av} style={{ display: "flex", alignItems: "center", gap: 20, background: first ? `${t.accent}22` : t.mutedSurface, border: `2px solid ${first ? t.accent : "transparent"}`, borderRadius: 22, padding: "10px 22px", opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 120}px) scale(${first && f > lastF - 6 ? 1.03 : 1})` }}>
            <div style={{ width: 44, fontSize: 36, fontWeight: 900, color: first ? t.accent : t.textMuted }}>{r + 1}</div>
            <Av i={av} size={64} />
            <div style={{ flex: 1, fontSize: 38, fontWeight: 800 }}>{NAMES[av]}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: first ? t.accent : t.text }}>{p}</div>
          </div>); })}
      </div>
    </Frame>
  );
};

/* 7 · Se acabó perseguir: el caos se ordena y cada uno tiene su día */
const YourDay: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const swap = wf(ws, "gente") + 10, sbF = wf(ws, "todos");
  const chaos = [["¿Vamos?", -14, 0], ["¿Y tú?", 9, 120], ["Otro día…", -6, 240], ["No puedo", 12, 360], ["¿Quién se apunta?", -9, 480]] as const;
  const out = interpolate(f, [swap, swap + 10], [1, 0], clamp);
  const cal = pop(f, fps, swap + 6, 12);
  const mark = [0, 1, 2, 3];
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", width: 920, height: 900 }}>
        <div style={{ position: "absolute", inset: 0, opacity: out }}>
          {chaos.map(([text, rot, top], k) => <div key={k} style={{ position: "absolute", left: 40 + (k % 2) * 180, top: top * 1.4 + 40, transform: `rotate(${rot}deg) scale(${pop(f, fps, k * 5, 12)})`, background: t.mutedSurface, border: `2px solid ${t.border}`, borderRadius: 28, padding: "20px 34px", fontSize: 46, fontWeight: 700 }}>{text}</div>)}
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: cal, transform: `scale(${0.9 + 0.1 * cal})` }}>
          {mark.map((w) => { const m = pop(f, fps, sbF + w * 6, 11); return (
            <div key={w} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ width: 120, fontSize: 30, fontWeight: 900, color: t.textMuted }}>SEM {w + 1}</div>
              <div style={{ display: "flex", gap: 10, flex: 1 }}>
                {Array.from({ length: 7 }).map((_, d) => { const on = d === (w * 2 + 1) % 7; return <div key={d} style={{ flex: 1, height: 98, borderRadius: 18, border: `2px solid ${on && m > 0.5 ? t.accent : t.border}`, background: on && m > 0.5 ? t.accent : t.surface, color: t.accentContrast, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 900, transform: on ? `scale(${0.8 + 0.2 * m})` : "none" }}>{on && m > 0.5 ? "🎾" : ""}</div>; })}
              </div>
            </div>); })}
          <div style={{ marginTop: 50, textAlign: "center", opacity: pop(f, fps, sbF + 22, 11) }}><Chip gold>TU DÍA DE PÁDEL</Chip></div>
        </div>
      </div>
    </Frame>
  );
};

/* 8 · Así nace Smash & Lob */
const Logo: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 2, 8);
  const sm = wf(ws, "smash");
  const burst = interpolate(f, [sm, sm + 20], [0, 1], clamp);
  return (
    <Frame timedWords={ws}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 380 + burst * 560, height: 380 + burst * 560, borderRadius: "50%", border: `6px solid ${t.accent}`, opacity: burst > 0 ? 0.8 * (1 - burst) : 0 }} />
        <Img src={staticFile("logo.png")} style={{ width: 420, height: 420, objectFit: "contain", borderRadius: 90, filter: `drop-shadow(0 0 ${60 + 80 * Math.sin(Math.min(1, burst) * Math.PI)}px ${t.accent}aa)`, transform: `scale(${p * (1 + 0.1 * Math.sin(Math.min(1, burst) * Math.PI))})` }} />
      </div>
      <div style={{ marginTop: 60, fontSize: 104, fontWeight: 900, opacity: pop(f, fps, Math.max(0, sm - 2), 10) }}>Smash <span style={{ color: t.accent }}>&</span> Lob</div>
      {sfx("ding", sm, 0.5)}
    </Frame>
  );
};

/* 9 · Un formato: crear la liguilla y que la app lo gestione todo */
const MiniCard: React.FC<{ at: number; title: string; children: React.ReactNode; lock?: boolean }> = ({ at, title, children }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, at, 12);
  return (
    <div style={{ opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * -160}px) scale(${0.92 + 0.08 * p})`, background: t.surface, border: `2px solid ${t.borderStrong}`, borderRadius: 30, padding: "20px 28px", width: 900, boxShadow: "0 18px 50px rgba(0,0,0,.45)" }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, color: t.textMuted, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
};
const Format: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const calF = wf(ws, "calendario"), resF = wf(ws, "resultados"), clF = wf(ws, "clasificación"), autoF = wf(ws, "automáticamente");
  const showApp = f >= calF - 12;
  const head = pop(f, fps, 2, 11);
  const btn = f > 66 ? 0.95 : 1;
  const created = pop(f, fps, 74, 12);
  const autoP = pop(f, fps, autoF, 9);
  return (
    <Frame timedWords={ws}>
      {!showApp ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
          <div style={{ opacity: head, transform: `scale(${0.85 + 0.15 * head})` }}><Words text={"Un *formato*"} size={110} stagger={4} /></div>
          <div style={{ display: "flex", gap: 14 }}>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ transform: `scale(${pop(f, fps, 24 + i * 4, 10)})` }}><Av i={i} size={104} /></div>)}</div>
          <div style={{ background: t.accent, color: t.accentContrast, borderRadius: 28, padding: "30px 64px", fontSize: 50, fontWeight: 900, transform: `scale(${btn})`, boxShadow: f > 66 ? `0 0 0 10px ${t.accent}44` : "none", opacity: pop(f, fps, 50, 12) }}>+ Crear mi liguilla</div>
          <div style={{ opacity: created, fontSize: 44, fontWeight: 800, color: t.textMuted }}>Fácil, en un minuto</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", position: "relative" }}>
          <MiniCard at={calF - 12} title="CALENDARIO">
            {[["J1", "Jugada", "🔓"], ["J2", "Jugando", "🔓"], ["J3", "Secreta", "🔒"]].map(([j, s, l], k) => <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 800, padding: "8px 0", color: k === 2 ? t.textSubtle : t.text }}><span>Jornada {j.slice(1)}</span><span>{l} {s}</span></div>)}
          </MiniCard>
          <MiniCard at={resF - 12} title="RESULTADO">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", fontSize: 38, fontWeight: 900 }}>
              <span style={{ display: "flex", gap: 8 }}><Av i={0} size={56} /><Av i={1} size={56} /></span><span style={{ color: t.accent, fontSize: 64 }}>6 – 4</span><span style={{ display: "flex", gap: 8 }}><Av i={2} size={56} /><Av i={3} size={56} /></span>
            </div>
          </MiniCard>
          <MiniCard at={clF - 12} title="CLASIFICACIÓN">
            {[[5, 38], [2, 35], [7, 31]].map(([a, p], r) => <div key={a} style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 0", fontSize: 34, fontWeight: 800 }}><span style={{ width: 36, color: r === 0 ? t.accent : t.textMuted }}>{r + 1}</span><Av i={a} size={50} /><span style={{ flex: 1 }}>{NAMES[a]}</span><span style={{ color: r === 0 ? t.accent : t.text }}>{p}</span></div>)}
          </MiniCard>
          <div style={{ opacity: Math.min(1, autoP * 2), transform: `scale(${0.7 + 0.3 * autoP})` }}><Chip gold>✓ AUTOMÁTICO</Chip></div>
        </div>
      )}
      {sfx("pop", Math.max(1, calF - 12), 0.35)}{sfx("pop", Math.max(1, resF - 12), 0.35)}{sfx("pop", Math.max(1, clF - 12), 0.35)}{sfx("ding", autoF, 0.45)}
    </Frame>
  );
};

/* 10 · Próximamente + Instagram */
const Soon: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  const igF = wf(ws, "síguenos");
  const ig = pop(f, fps, igF, 10);
  return (
    <Frame timedWords={ws}>
      <div style={{ transform: `scale(${p * (1 + 0.025 * Math.sin(f / 6))})`, border: `4px solid ${t.accent}`, color: t.accent, borderRadius: 999, padding: "30px 70px", fontSize: 78, fontWeight: 900, letterSpacing: 8, boxShadow: `0 0 60px ${t.accent}55` }}>PRÓXIMAMENTE</div>
      <div style={{ height: 90 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 28, opacity: Math.min(1, ig * 2), transform: `translateY(${(1 - ig) * 60}px)` }}>
        <div style={{ width: 110, height: 110, borderRadius: 30, border: `8px solid ${t.accent}`, position: "relative" }}>
          <div style={{ position: "absolute", inset: 22, borderRadius: "50%", border: `8px solid ${t.accent}` }} />
          <div style={{ position: "absolute", right: 14, top: 14, width: 12, height: 12, borderRadius: "50%", background: t.accent }} />
        </div>
        <div style={{ fontSize: 76, fontWeight: 900 }}>@smashandlob</div>
      </div>
      {sfx("ding", 0, 0.45)}{sfx("pop", igF, 0.4)}
    </Frame>
  );
};

/* 11 · Cierre: eslogan con pelota */
const Outro: React.FC<P> = ({ ws }) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const logo = pop(f, fps, 0, 9);
  const pa = wf(ws, "para"), nu = wf(ws, "nunca"), su = wf(ws, "suficiente"), pd = wf(ws, "pádel");
  const marks = [pa, nu, su, pd];
  const words = ["Para los que", "nunca tienen", "suficiente", "pádel"];
  const burst = interpolate(f, [pd, pd + 18], [0, 1], clamp);
  const bounce = Math.abs(Math.sin((f - pd) / 7)) * 60 * Math.exp(-Math.max(0, f - pd) / 40);
  return (
    <Frame timedWords={ws}>
      <Img src={staticFile("logo.png")} style={{ width: 230, height: 230, borderRadius: 52, objectFit: "contain", transform: `scale(${logo})`, filter: `drop-shadow(0 0 40px ${t.accent}88)` }} />
      <div style={{ height: 40 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {words.map((w, i) => { const k = pop(f, fps, Math.max(0, marks[i] - 3), 9); return <div key={w} style={{ opacity: Math.min(1, k * 2), transform: `scale(${0.6 + 0.4 * k})`, fontSize: i === 3 ? 170 : 92, fontWeight: 900, lineHeight: 1.1, color: i >= 2 ? t.accent : t.text, textShadow: i === 3 ? `0 0 ${50 * (1 - burst)}px ${t.accent}` : "none" }}>{w}</div>; })}
      </div>
      <div style={{ marginTop: 30, opacity: pop(f, fps, pd, 9), transform: `translateY(${-bounce}px)` }}><Ball size={84} /></div>
      {marks.map((m) => sfx("pop", Math.max(1, m - 3), 0.45))}{sfx("ding", pd, 0.5)}
    </Frame>
  );
};

const COMPS: React.FC<P>[] = [Hook, Never, Group, Pairs, Everyone, Ranking, YourDay, Logo, Format, Soon, Outro];
const KEYS = ["hook", "never", "group", "pairs", "everyone", "ranking", "yourday", "logo", "format", "soon", "outro"];
const makeScenes = (): SceneDef[] => COMPS.map((C, i) => ({ key: KEYS[i], dur: Math.round((BOUNDS[i + 1] - BOUNDS[i]) * 30), C: () => <C ws={sceneWords(i)} /> }));
export const REEL1_FRAMES = totalFrames(makeScenes());
export const Reel1: React.FC = () => <VideoSeries scenes={makeScenes()} accent="#d7a544" voice="voice-app1-david.mp3" />;
