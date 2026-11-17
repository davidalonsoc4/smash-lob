// Réplicas de componentes de la app (tema Competition) a tamaño nativo móvil (~412 px de ancho).
// Se escalan en el vídeo con CSS `zoom`.
import React from "react";
import { Img, staticFile } from "remotion";
import { useTheme } from "./kit";

export const NATIVE_W = 412;
export const Zoom: React.FC<{ z: number; children: React.ReactNode }> = ({ z, children }) => <div style={{ zoom: z }}>{children}</div>;

export const AppHeader: React.FC<{ title: string; subtitle: string; logo?: string }> = ({ title, subtitle, logo }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 18, padding: "12px 16px" }}>
      {logo && <Img src={staticFile(logo)} style={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }} />}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.3 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: t.textMuted, marginTop: 4 }}>{subtitle}</div>
      </div>
    </div>
  );
};

export const PersonIcon: React.FC<{ size?: number; color?: string }> = ({ size = 18, color }) => {
  const t = useTheme();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? t.textMuted} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={8} r={4} /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
};

export const Avatar: React.FC<{ size?: number; initials?: string }> = ({ size = 34, initials }) => {
  const t = useTheme();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${t.borderStrong}`, background: t.mutedSurface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: size * 0.42, color: t.text }}>
      {initials ?? <PersonIcon size={size * 0.55} />}
    </div>
  );
};

// "Mi próximo partido": dos píldoras de acento con VS en medio.
export const PairPills: React.FC<{ a: [string, string]; b: [string, string]; width?: number }> = ({ a, b, width = NATIVE_W }) => {
  const t = useTheme();
  const pill = (n: [string, string]) => (
    <div style={{ flex: 1, background: t.accent, color: t.accentContrast, borderRadius: 14, padding: "10px 6px", textAlign: "center", fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}>
      <div>{n[0]}</div><div>{n[1]}</div>
    </div>
  );
  return (
    <div style={{ width, display: "flex", alignItems: "center", gap: 8 }}>
      {pill(a)}
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: t.mutedSurface, color: t.textMuted, fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>VS</div>
      {pill(b)}
    </div>
  );
};

// Marcador de partido: S1 S2 S3 + total de sets (que son los puntos de cada jugador).
export type ScoreRow = { names: [string, string]; games: number[]; sets: number; winner: boolean };
export const MatchScore: React.FC<{ rows: [ScoreRow, ScoreRow]; shownSets: number; showTotals: boolean; totalScale?: number }> = ({ rows, shownSets, showTotals, totalScale = 1 }) => {
  const t = useTheme();
  const cell = (v: number | string, key: string, dim = false) => <div key={key} style={{ width: 34, textAlign: "center", fontSize: 21, fontWeight: 700, color: dim ? t.textSubtle : t.text }}>{v}</div>;
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.accent}66`, borderRadius: 18, padding: "10px 14px 12px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 0, fontSize: 12, color: t.textSubtle, fontWeight: 700, paddingBottom: 6 }}>
        {[1, 2, 3].map((n) => <div key={n} style={{ width: 34, textAlign: "center" }}>S{n}</div>)}
        <div style={{ width: 52, textAlign: "center" }}>Sets</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderTop: i ? `1px solid ${t.accent}` : "none" }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 800, lineHeight: 1.35 }}>{r.names[0]}<br />{r.names[1]}</div>
          {[0, 1, 2].map((s) => cell(s < shownSets ? r.games[s] : "", `g${s}`, s < shownSets && r.games[s] < rows[1 - i].games[s]))}
          <div style={{ width: 52, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: t.accent, color: t.accentContrast, fontSize: 22, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", opacity: showTotals ? 1 : 0, transform: `scale(${showTotals ? (r.winner ? totalScale : 1) : 0.6})` }}>{r.sets}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Tabla de clasificación. Las posiciones (pos) son flotantes para animar el reordenado.
export type RankRow = { key: string; name: string; pts: number; diff: number; j: number; pos: number; shownPos: number; moved: boolean; climbing: boolean; tie: boolean; opacity?: number };
export const RANK_ROW_H = 54;
const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);
export const RankingCard: React.FC<{ rows: RankRow[] }> = ({ rows }) => {
  const t = useTheme();
  const bars = [t.accent, "#c4c8d0", "#c9803d"];
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", height: 40, padding: "0 14px", fontSize: 12, fontWeight: 800, letterSpacing: 1.6, color: t.textSubtle, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ width: 50 }}>POS</div><div style={{ flex: 1 }}>JUGADOR</div>
        <div style={{ width: 26, textAlign: "right" }}>J</div><div style={{ width: 52, textAlign: "right" }}>DIF</div><div style={{ width: 52, textAlign: "right" }}>PTS</div>
      </div>
      <div style={{ position: "relative", height: rows.length * RANK_ROW_H }}>
        {rows.map((r) => (
          <div key={r.key} style={{ position: "absolute", top: r.pos * RANK_ROW_H, left: 0, right: 0, height: RANK_ROW_H, display: "flex", alignItems: "center", padding: "0 14px", borderBottom: `1px solid ${t.border}`, background: r.moved ? t.mutedSurface : t.surface, zIndex: r.moved ? 2 : 1, opacity: r.opacity ?? 1, boxShadow: r.moved ? "0 6px 20px rgba(0,0,0,.55)" : "none" }}>
            {r.shownPos < 3 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: bars[r.shownPos] }} />}
            <div style={{ width: 50 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, background: r.shownPos === 0 ? t.accent : "transparent", color: r.shownPos === 0 ? t.accentContrast : t.accent, border: r.shownPos === 0 ? "none" : `1.5px solid ${t.borderStrong}` }}>{r.shownPos + 1}</div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar size={34} />
              <div style={{ fontSize: 17, fontWeight: 800, whiteSpace: "nowrap" }}>{r.name}</div>
              {r.moved && <div style={{ fontSize: 15, fontWeight: 900, color: r.climbing ? t.accent : "#f87171" }}>{r.climbing ? "▲" : "▼"}</div>}
            </div>
            <div style={{ width: 26, textAlign: "right", fontSize: 14, color: t.textMuted, fontWeight: 600 }}>{r.j}</div>
            <div style={{ width: 52, textAlign: "right", fontSize: 16, fontWeight: 800, color: r.tie ? t.accent : t.text, textDecoration: r.tie ? `underline ${t.accent} 2px` : "none", textUnderlineOffset: 4 }}>{signed(r.diff)}</div>
            <div style={{ width: 52, textAlign: "right", fontSize: 24, fontWeight: 900 }}>{r.pts}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Tarjeta de cuenta atrás de temporada próxima.
export const CountdownCard: React.FC<{ days: number; hours: number; minutes: number; seconds: number; dateLabel: string; note: string }> = ({ days, hours, minutes, seconds, dateLabel, note }) => {
  const t = useTheme();
  const tile = (v: number, label: string) => (
    <div style={{ flex: 1, background: "rgba(255,255,255,.16)", borderRadius: 16, padding: "14px 0 12px", textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{String(v).padStart(2, "0")}</div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.8, marginTop: 8 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.accent, color: t.accentContrast, borderRadius: 34, padding: "70px 20px 64px", textAlign: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4 }}>LA TEMPORADA COMIENZA EN</div>
      <div style={{ display: "flex", gap: 8, margin: "26px 0 34px" }}>
        {tile(days, "DÍAS")}{tile(hours, "HORAS")}{tile(minutes, "MIN")}{tile(seconds, "SEG")}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{dateLabel.split(" · ").map((l, i) => <div key={i} style={{ fontSize: i === 0 ? 20 : 30, marginTop: i === 0 ? 0 : 4 }}>{l}</div>)}</div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginTop: 16, padding: "0 12px" }}>{note}</div>
    </div>
  );
};


// Tarjeta de jornada de apertura con la hora aún por confirmar (time = null).
export const OpeningCard: React.FC<{ eyebrow: string; weekday: string; day: string; month: string; place: string; time: string | null; note: string; placeP?: number; timeP?: number; noteP?: number }> = ({ eyebrow, weekday, day, month, place, time, note, placeP = 1, timeP = 1, noteP = 1 }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.accent, color: t.accentContrast, borderRadius: 34, padding: "46px 22px 40px", textAlign: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4 }}>{eyebrow}</div>
      <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 5, marginTop: 26 }}>{weekday}</div>
      <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1, letterSpacing: -4 }}>{day}</div>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6 }}>{month}</div>
      <div style={{ fontSize: 19, fontWeight: 800, marginTop: 22, opacity: placeP, transform: `scale(${0.9 + 0.1 * placeP})` }}>{place}</div>
      <div style={{ margin: "24px auto 0", opacity: timeP, transform: `scale(${0.8 + 0.2 * timeP})`, display: "inline-flex", alignItems: "center", gap: 10, background: t.accentContrast, color: t.accent, borderRadius: 999, padding: "10px 22px", fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.accent} strokeWidth={2.6} strokeLinecap="round"><circle cx={12} cy={12} r={9} /><path d="M12 7v5l3 2" /></svg>
        {time ?? "HORA POR CONFIRMAR"}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.35, marginTop: 18, padding: "0 10px", opacity: noteP }}>{note}</div>
    </div>
  );
};


// Pantalla "Economía de temporada" (transparencia). Con hideAmounts los importes salen difuminados.
export const EconomyScreen: React.FC<{ subtitle: string; rows: string[]; rowProgress: number[]; tileProgress: number[]; hideAmounts: boolean }> = ({ subtitle, rows, rowProgress, tileProgress, hideAmounts }) => {
  const t = useTheme();
  const amt = (v: string, size: number, weight = 800, color?: string) => (
    <span style={{ fontSize: size, fontWeight: weight, color: color ?? t.text, filter: hideAmounts ? "blur(7px)" : "none", whiteSpace: "nowrap" }}>{v}</span>
  );
  const tiles: [string, string, string][] = [
    ["INGRESADO", "000,00 €", "8 cuotas aportadas"],
    ["PENDIENTE", "000,00 €", "0 jugadores"],
    ["GASTADO", "000,00 €", "gastos registrados"],
    ["DISPONIBLE", "000,00 €", "saldo de la liga"],
  ];
  return (
    <div style={{ width: NATIVE_W, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 16, padding: "12px 16px" }}>
        <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: 0.4 }}>Economía de temporada</div>
        <div style={{ fontSize: 14, color: t.textMuted, marginTop: 3 }}>{subtitle}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tiles.map(([label, value, sub], i) => (
          <div key={label} style={{ boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "13px 15px", opacity: tileProgress[i] ?? 1, transform: `scale(${0.9 + 0.1 * (tileProgress[i] ?? 1)})` }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, color: t.textMuted }}>{label}</div>
            <div style={{ marginTop: 6 }}>{amt(value, 27, 800)}</div>
            <div style={{ fontSize: 12.5, color: t.textMuted, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: "14px 16px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Gastos registrados</div>
          {amt("000,00 €", 15, 800, t.textMuted)}
        </div>
        {rows.map((r, i) => (
          <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderTop: `1px solid ${t.border}`, opacity: rowProgress[i] ?? 1, transform: `translateX(${(1 - (rowProgress[i] ?? 1)) * 60}px)` }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, paddingRight: 10 }}>{r}</div>
            {amt("00,00 €", 18, 800)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Barra de pestañas inferior (Inicio · Ranking · Calendario · Chats · Perfil).
const TabIcon: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" {...p}>
      {name === "home" && (<><path d="M3 10.5 12 3l9 7.5V21H3z" /><path d="M9 21v-6h6v6" /></>)}
      {name === "rank" && (<><path d="M6 20v-8M12 20V4M18 20V9" /></>)}
      {name === "cal" && (<><rect x={3} y={5} width={18} height={16} rx={3} /><path d="M3 10h18M8 3v4M16 3v4" /></>)}
      {name === "chat" && (<><path d="M4 5h16v11H9l-5 4z" /></>)}
      {name === "user" && (<><circle cx={12} cy={8} r={4} /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>)}
    </svg>
  );
};
export const TAB_ITEMS = [["home", "Inicio"], ["rank", "Ranking"], ["cal", "Calendario"], ["chat", "Chats"], ["user", "Perfil"]] as const;
export const TabBar: React.FC<{ active: number; progress?: number }> = ({ active, progress = 1 }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 22, padding: 8, display: "flex", gap: 4 }}>
      {TAB_ITEMS.map(([icon, label], i) => {
        const on = i === active;
        return (
          <div key={label} style={{ flex: 1, borderRadius: 16, padding: "9px 0 8px", textAlign: "center", background: on ? t.accent : "transparent", color: on ? t.accentContrast : t.textMuted, transform: `scale(${on ? 0.92 + 0.08 * progress : 1})` }}>
            <div style={{ display: "flex", justifyContent: "center" }}><TabIcon name={icon} color={on ? t.accentContrast : t.textMuted} /></div>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
};
