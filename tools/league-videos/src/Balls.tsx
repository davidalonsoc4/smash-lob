// Pelota de pádel de la serie: D (dorada, por defecto en todos los vídeos) y B (plana, alternativa clara).
import React, { useId } from "react";

const SEAM_L = "M 34 40 C 84 66, 84 134, 34 160";
const SEAM_R = "M 166 40 C 116 66, 116 134, 166 160";
type BallProps = { size: number };
const useIds = () => { const id = useId().replace(/:/g, ""); return { clip: `c${id}`, g: `g${id}`, f: `f${id}`, b: `b${id}` }; };

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

export const BallPlana: React.FC<BallProps> = ({ size }) => {
  const { clip } = useIds();
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
      <defs><clipPath id={clip}><circle cx={100} cy={100} r={92} /></clipPath></defs>
      <circle cx={100} cy={100} r={92} fill="#d8e31f" />
      <g clipPath={`url(#${clip})`}>
        <circle cx={128} cy={128} r={92} fill="#bcc715" />
        {[SEAM_L, SEAM_R].map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />)}
      </g>
    </svg>
  );
};

