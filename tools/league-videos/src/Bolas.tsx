// Hoja de muestra: diseños de pelota de pádel (SVG) para elegir el definitivo de los vídeos.
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { FONT, makeTheme } from "./kit";

const t = makeTheme("#d7a544");
const SEAM_L = "M 34 40 C 84 66, 84 134, 34 160";
const SEAM_R = "M 166 40 C 116 66, 116 134, 166 160";

type BallProps = { size: number };
const useIds = () => { const id = useId().replace(/:/g, ""); return { clip: `c${id}`, g: `g${id}`, f: `f${id}`, b: `b${id}` }; };

export const BallRealista: React.FC<BallProps> = ({ size }) => {
  const { clip, g, f, b } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clip}><circle cx={100} cy={100} r={92} /></clipPath>
        <radialGradient id={g} cx="0.36" cy="0.3" r="0.85"><stop offset="0" stopColor="#f2f77f" /><stop offset="0.45" stopColor="#d3df1d" /><stop offset="1" stopColor="#8e9d0c" /></radialGradient>
        <filter id={f} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.3  0 0 0 0 0  0 0 0 1.1 -0.35" /></filter>
        <filter id={b}><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <ellipse cx={100} cy={196} rx={70} ry={9} fill="#000" opacity={0.4} filter={`url(#${b})`} />
      <circle cx={100} cy={100} r={92} fill={`url(#${g})`} />
      <g clipPath={`url(#${clip})`}>
        <rect x={0} y={0} width={200} height={200} filter={`url(#${f})`} opacity={0.55} />
        {[SEAM_L, SEAM_R].map((d, i) => <g key={i}><path d={d} fill="none" stroke="#5c6608" strokeWidth={13} opacity={0.35} transform="translate(2 3)" /><path d={d} fill="none" stroke="#f6f8e6" strokeWidth={9} strokeLinecap="round" /><path d={d} fill="none" stroke="#cfd6a0" strokeWidth={3} strokeLinecap="round" opacity={0.6} /></g>)}
        <circle cx={100} cy={100} r={92} fill="none" stroke="#6f7a0a" strokeWidth={14} opacity={0.35} />
        <ellipse cx={72} cy={56} rx={30} ry={16} fill="#fff" opacity={0.3} transform="rotate(-32 72 56)" filter={`url(#${b})`} />
      </g>
    </svg>
  );
};

export const BallPlana: React.FC<BallProps> = ({ size }) => {
  const { clip } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs><clipPath id={clip}><circle cx={100} cy={100} r={92} /></clipPath></defs>
      <circle cx={100} cy={100} r={92} fill="#d8e31f" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={128} cy={128} r={92} fill="#bcc715" />
        <circle cx={100} cy={100} r={92} fill="#d8e31f" clipPath="none" opacity={0} />
        {[SEAM_L, SEAM_R].map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />)}
      </g>
      <circle cx={100} cy={100} r={92} fill="none" stroke="#d8e31f" strokeWidth={0} />
    </svg>
  );
};

export const BallCartoon: React.FC<BallProps> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
    <defs><clipPath id="cc"><circle cx={100} cy={100} r={90} /></clipPath></defs>
    <circle cx={100} cy={100} r={90} fill="#e8ee33" />
    <g clipPath="url(#cc)">
      {[SEAM_L, SEAM_R].map((d, i) => <g key={i}><path d={d} fill="none" stroke="#1a1a1a" strokeWidth={17} strokeLinecap="round" /><path d={d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" /></g>)}
      <path d="M 60 150 Q 100 178 148 146" fill="none" stroke="#b8c012" strokeWidth={14} strokeLinecap="round" opacity={0.7} />
    </g>
    <circle cx={100} cy={100} r={90} fill="none" stroke="#1a1a1a" strokeWidth={9} />
    <ellipse cx={66} cy={58} rx={16} ry={9} fill="#fff" opacity={0.85} transform="rotate(-35 66 58)" />
  </svg>
);

export const BallDorada: React.FC<BallProps> = ({ size }) => {
  const { clip, g, b } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clip}><circle cx={100} cy={100} r={92} /></clipPath>
        <radialGradient id={g} cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#fbe7a6" /><stop offset="0.5" stopColor="#d7a544" /><stop offset="1" stopColor="#7d5a1a" /></radialGradient>
        <filter id={b}><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <circle cx={100} cy={100} r={104} fill="#d7a544" opacity={0.45} filter={`url(#${b})`} />
      <circle cx={100} cy={100} r={92} fill={`url(#${g})`} />
      <g clipPath={`url(#${clip})`}>
        {[SEAM_L, SEAM_R].map((d, i) => <g key={i}><path d={d} fill="none" stroke="#6b4a10" strokeWidth={12} opacity={0.4} transform="translate(2 3)" /><path d={d} fill="none" stroke="#fff3c9" strokeWidth={8} strokeLinecap="round" /></g>)}
        <ellipse cx={70} cy={56} rx={26} ry={13} fill="#fff" opacity={0.4} transform="rotate(-32 70 56)" />
      </g>
    </svg>
  );
};

export const BallLinea: React.FC<BallProps> = ({ size }) => {
  const { clip } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs><clipPath id={clip}><circle cx={100} cy={100} r={90} /></clipPath></defs>
      <circle cx={100} cy={100} r={90} fill="#d7a544" opacity={0.14} />
      <g clipPath={`url(#${clip})`}>{[SEAM_L, SEAM_R].map((d, i) => <path key={i} d={d} fill="none" stroke="#d7a544" strokeWidth={8} strokeLinecap="round" />)}</g>
      <circle cx={100} cy={100} r={90} fill="none" stroke="#d7a544" strokeWidth={9} />
    </svg>
  );
};

export const BallNeon: React.FC<BallProps> = ({ size }) => {
  const { clip, g, b } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={clip}><circle cx={100} cy={100} r={80} /></clipPath>
        <radialGradient id={g} cx="0.38" cy="0.32" r="0.8"><stop offset="0" stopColor="#f8ff9a" /><stop offset="0.5" stopColor="#c9ff2e" /><stop offset="1" stopColor="#5fa800" /></radialGradient>
        <filter id={b}><feGaussianBlur stdDeviation="12" /></filter>
      </defs>
      {[40, 100, 160].map((y, i) => <rect key={i} x={-30 - i * 8} y={y - 4} width={70 - i * 10} height={8} rx={4} fill="#c9ff2e" opacity={0.5 - i * 0.12} />)}
      <circle cx={110} cy={100} r={100} fill="#c9ff2e" opacity={0.4} filter={`url(#${b})`} />
      <g transform="translate(10 0)">
        <circle cx={100} cy={100} r={80} fill={`url(#${g})`} />
        <g clipPath={`url(#${clip})`}>
          {[SEAM_L, SEAM_R].map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" transform="translate(0 0) scale(0.92) translate(8 8)" />)}
          <ellipse cx={72} cy={62} rx={22} ry={11} fill="#fff" opacity={0.55} transform="rotate(-32 72 62)" />
        </g>
      </g>
    </svg>
  );
};

const DESIGNS: { id: string; name: string; C: React.FC<BallProps>; note: string }[] = [
  { id: "A", name: "Realista", C: BallRealista, note: "fieltro y volumen" },
  { id: "B", name: "Plana", C: BallPlana, note: "icono limpio" },
  { id: "C", name: "Cartoon", C: BallCartoon, note: "contorno grueso" },
  { id: "D", name: "Dorada", C: BallDorada, note: "color de marca" },
  { id: "E", name: "Línea", C: BallLinea, note: "solo contorno dorado" },
  { id: "F", name: "Neón", C: BallNeon, note: "con brillo y estela" },
];

export const BolasMuestra: React.FC = () => (
  <AbsoluteFill style={{ background: t.bg, fontFamily: FONT, color: t.text, padding: 50 }}>
    <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 4, marginBottom: 30 }}>PELOTAS DE PÁDEL · ELIGE UNA</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
      {DESIGNS.map(({ id, name, C, note }) => (
        <div key={id} style={{ background: t.surface, border: `2px solid ${t.border}`, borderRadius: 30, padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ height: 270, display: "flex", alignItems: "center" }}><C size={250} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, height: 64 }}><C size={30} /><C size={48} /><C size={64} /></div>
          <div style={{ fontSize: 36, fontWeight: 900 }}><span style={{ color: t.accent }}>{id}</span> · {name}</div>
          <div style={{ fontSize: 24, color: t.textMuted }}>{note}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);
