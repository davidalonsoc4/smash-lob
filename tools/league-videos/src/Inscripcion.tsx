// Vídeo: "¿Para qué es la inscripción?" — versión SIN cifras (publicable en cualquier momento).
// Los importes concretos irán en una segunda versión, cuando las reservas estén confirmadas.
import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Ball, Frame, SceneDef, VideoSeries, Words, pop, sfx, totalFrames, useTheme } from "./kit";
import { EconomyScreen, NATIVE_W, Zoom } from "./appUi";
import type { LeagueConfig } from "./Bienvenida";

type Props = { league: LeagueConfig };

/* ---------- Iconos ---------- */
const Ico: React.FC<{ name: "court" | "ball" | "gift" | "eye"; color: string; size?: number }> = ({ name, color, size = 28 }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...p}>
      {name === "court" && (<><rect x={2.5} y={5} width={19} height={14} rx={2} /><path d="M12 5v14M2.5 12h19" /></>)}
      {name === "ball" && (<><circle cx={12} cy={12} r={9} /><path d="M4.5 7.5c4 1.5 4 7.5 0 9M19.5 7.5c-4 1.5-4 7.5 0 9" /></>)}
      {name === "gift" && (<><rect x={3} y={8} width={18} height={5} rx={1} /><path d="M5 13v7h14v-7M12 8v12M12 8c-2.5 0-4-1-4-2.5S9.5 3 12 8zM12 8c2.5 0 4-1 4-2.5S14.5 3 12 8z" /></>)}
      {name === "eye" && (<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx={12} cy={12} r={3} /></>)}
    </svg>
  );
};

const CategoryCard: React.FC<{ icon: "court" | "ball" | "gift"; title: string; subtitle: string; badge?: string }> = ({ icon, title, subtitle, badge }) => {
  const t = useTheme();
  return (
    <div style={{ width: NATIVE_W, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, background: t.surface, border: `1px solid ${t.border}`, borderLeft: `5px solid ${t.accent}`, borderRadius: 18, padding: "14px 16px" }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={icon} color={t.accentContrast} size={28} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: t.textMuted, marginTop: 4, lineHeight: 1.3 }}>{subtitle}</div>
      </div>
      {badge && <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 999, padding: "5px 10px" }}>{badge}</div>}
    </div>
  );
};

/* 1 · Gancho */
const Hook: React.FC = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const bounce = Math.abs(Math.sin(f / 6)) * 120;
  const p = pop(f, fps, 24, 10);
  return (
    <Frame>
      <Words text={"¿Para qué es\nla *inscripción*?"} size={118} stagger={5} />
      <div style={{ marginTop: 90, transform: `translateY(${-bounce}px) scale(${p})` }}>
        <div style={{ width: 170, height: 170, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${t.accent} 60%, rgba(0,0,0,.35))`, boxShadow: `0 0 60px ${t.accent}80`, display: "flex", alignItems: "center", justifyContent: "center", color: t.accentContrast, fontSize: 110, fontWeight: 900 }}>€</div>
      </div>
    </Frame>
  );
};

/* 2 · Es un compromiso: ocho monedas entran en el bote de la liga */
const Commit = ({ league }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const n = league.playerNames.length;
  const landAt = (i: number) => 34 + i * 9 + 16;
  const landed = league.playerNames.filter((_, i) => f >= landAt(i)).length;
  const cardP = pop(f, fps, 4, 13);
  return (
    <Frame tag="LA INSCRIPCIÓN" caption="El dinero de la inscripción de los ocho jugadores se usa solo para la liga." captionStart={12}>
      <div style={{ position: "relative", width: 840, height: 900 }}>
        {league.playerNames.map((_, i) => {
          const x = 110 + (i % 4) * 190, startY = -80;
          const prog = interpolate(f, [34 + i * 9, landAt(i)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const y = startY + prog * 560;
          return <div key={i} style={{ position: "absolute", left: x, top: y + (i % 2) * 40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff3c9, ${t.accent} 60%, rgba(0,0,0,.35))`, color: t.accentContrast, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 70, fontWeight: 900, opacity: prog <= 0 ? 0 : prog >= 1 ? 0 : 1, zIndex: 2 }}>€</div>;
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: 420, transform: `scale(${0.9 + 0.1 * cardP})`, opacity: Math.min(1, cardP * 2) }}>
          <Zoom z={2.0}>
            <div style={{ width: NATIVE_W, boxSizing: "border-box", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 22, overflow: "hidden" }}>
              <div style={{ height: 6, background: t.accent }} />
              <div style={{ padding: "22px 20px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: t.textSubtle }}>BOTE DE LA LIGA</div>
                <div style={{ fontSize: 64, fontWeight: 900, color: t.accent, lineHeight: 1.1, marginTop: 8 }}>{landed}<span style={{ fontSize: 30, color: t.textMuted }}> / {n}</span></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textMuted, marginTop: 4 }}>jugadores inscritos</div>
              </div>
            </div>
          </Zoom>
        </div>
      </div>
      {league.playerNames.map((_, i) => sfx("pop", landAt(i), 0.3))}
    </Frame>
  );
};

/* 3 · En qué se usa (sin importes) */
const Uses: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const items: { at: number; icon: "court" | "ball" | "gift"; title: string; subtitle: string; badge?: string }[] = [
    { at: 26, icon: "court", title: "Pistas", subtitle: "Jornada de apertura y jornada de cierre" },
    { at: 168, icon: "ball", title: "Bolas", subtitle: "Para cada jornada" },
    { at: 250, icon: "gift", title: "Welcome pack", subtitle: "Un detalle de bienvenida", badge: "SORPRESA" },
  ];
  return (
    <Frame tag="EN QUÉ SE USA" caption="Sirve para reservar las pistas de la jornada de apertura y de cierre, comprar las bolas de cada jornada y preparar un detalle de bienvenida." captionStart={12}>
      <div style={{ display: "flex", flexDirection: "column", gap: 34, alignItems: "center" }}>
        {items.map((it) => {
          const p = pop(f, fps, it.at, 12);
          return (
            <div key={it.title} style={{ opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 700}px) scale(${0.95 + 0.05 * p})` }}>
              <Zoom z={2.2}><CategoryCard icon={it.icon} title={it.title} subtitle={it.subtitle} badge={it.badge} /></Zoom>
            </div>
          );
        })}
      </div>
      {items.map((it) => sfx("pop", it.at, 0.4))}
    </Frame>
  );
};

/* 4 · Transparencia: réplica de la pantalla "Economía de temporada" con los importes difuminados */
const Transparency: React.FC = () => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 4, 13);
  const tileProgress = [0, 1, 2, 3].map((i) => pop(f, fps, 14 + i * 6, 14));
  const rows = ["Reserva jornada de apertura", "Reserva jornada de cierre", "Bolas de cada jornada", "Welcome pack"];
  const rowProgress = rows.map((_, i) => pop(f, fps, 50 + i * 10, 14));
  const pill = pop(f, fps, 110, 12);
  return (
    <Frame tag="TRANSPARENCIA" caption="Cuando estén confirmadas las reservas, podrás ver todas las cuentas en la app." captionStart={12}>
      <div style={{ position: "absolute", top: 290, opacity: Math.min(1, p * 2), transform: `scale(${0.92 + 0.08 * p})` }}>
        <Zoom z={1.85}><EconomyScreen subtitle="Temporada 1 · Inscripción" rows={rows} rowProgress={rowProgress} tileProgress={tileProgress} hideAmounts /></Zoom>
      </div>
      <div style={{ position: "absolute", top: 1318, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: pill, transform: `scale(${0.9 + 0.1 * pill})` }}>
        <div style={{ background: t.surface, border: `2px solid ${t.accent}`, color: t.accent, fontWeight: 900, fontSize: 32, letterSpacing: 3, padding: "14px 34px", borderRadius: 999 }}>IMPORTES TRAS CONFIRMAR RESERVAS</div>
      </div>
      {rows.map((_, i) => sfx("pop", 50 + i * 10, 0.3))}
    </Frame>
  );
};

/* 5 · Cierre */
const Outro = ({ league }: Props) => {
  const t = useTheme(); const f = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = pop(f, fps, 0, 8);
  return (
    <Frame caption="Nos vemos en la pista." captionStart={10}>
      <Img src={staticFile(league.logo)} style={{ width: 340, height: 340, objectFit: "contain", filter: `drop-shadow(0 0 60px ${t.accent}66)`, transform: `scale(${p * (1 + Math.sin(f / 5) * 0.03)})` }} />
      <div style={{ height: 40 }} />
      <Words text={"Nos vemos\n*en la pista*"} size={130} delay={8} />
      <div style={{ marginTop: 60 }}><Ball size={80} /></div>
    </Frame>
  );
};

const makeScenes = (league: LeagueConfig): SceneDef[] => [
  { key: "hook", dur: 100, C: Hook },
  { key: "commit", dur: 215, C: () => <Commit league={league} /> },
  { key: "uses", dur: 345, C: Uses },
  { key: "transparency", dur: 190, C: Transparency },
  { key: "outro", dur: 95, C: () => <Outro league={league} /> },
];
export const INSCRIPCION_FRAMES_FN = (league: LeagueConfig) => totalFrames(makeScenes(league));
export const Inscripcion: React.FC<Props> = ({ league }) => <VideoSeries scenes={makeScenes(league)} accent={league.accent} />;
