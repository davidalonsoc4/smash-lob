// Avatares ficticios estilo A: bustos ilustrados sencillos (gorra, cinta, coleta, moño, gafas…). Sin nombres ni caras reales.
import React, { useId } from "react";

export const COLORS = ["#477BD1", "#3D9D86", "#D4643C", "#8B5FC0", "#53B4D1", "#d7a544", "#C4567A", "#7FA650"];
export type Look = { skin: string; hair: string; style: "short" | "cap" | "band" | "pony" | "long" | "bald" | "wavy" | "bun"; shirt: string; beard?: boolean; glasses?: boolean; racket: string };
export const LOOKS: Look[] = [
  { skin: "#f1c9a5", hair: "#2a1b12", style: "short", shirt: COLORS[0], racket: "#d7a544" },
  { skin: "#c98e6a", hair: "#111111", style: "cap", shirt: COLORS[1], beard: true, racket: "#477BD1" },
  { skin: "#8d5a3b", hair: "#1c1c1c", style: "band", shirt: COLORS[2], racket: "#f4f3ef" },
  { skin: "#e8b78f", hair: "#a05a2c", style: "pony", shirt: COLORS[3], racket: "#53B4D1" },
  { skin: "#a86f4a", hair: "#3b2a20", style: "short", shirt: COLORS[4], glasses: true, racket: "#D4643C" },
  { skin: "#f5d3b8", hair: "#c9a15a", style: "long", shirt: COLORS[5], racket: "#3D9D86" },
  { skin: "#6b4430", hair: "#111111", style: "wavy", shirt: COLORS[6], beard: true, racket: "#d7a544" },
  { skin: "#d9a577", hair: "#7a4b2a", style: "bun", shirt: COLORS[7], racket: "#8B5FC0" },
];
export const shade = (hex: string, k: number) => { const c = hex.replace("#", ""); const n = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * k)))); return `#${n.map((v) => v.toString(16).padStart(2, "0")).join("")}`; };

const Racket: React.FC<{ color: string; rot?: number }> = ({ color, rot = 28 }) => (
  <g transform={`translate(152 152) rotate(${rot})`}>
    <rect x={-5} y={26} width={10} height={34} rx={4} fill="#262626" />
    <ellipse cx={0} cy={0} rx={27} ry={33} fill={color} stroke="#111" strokeWidth={4} />
    {[[-10, -14], [10, -14], [0, -4], [-12, 8], [12, 8], [0, 18], [-6, -22], [6, 4]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={3.4} fill="#111" opacity={0.55} />)}
  </g>
);

export const PlayerA: React.FC<{ look: Look; size: number; bg: string; swing?: number; racket?: boolean; ring?: string }> = ({ look, size, bg, swing = 0, racket: showRacket = false, ring }) => {
  const id = useId().replace(/:/g, "");
  const { skin, hair, style, shirt, glasses, racket } = look;
  const dark = shade(skin, 0.86);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: "visible", flex: "none", borderRadius: "50%", boxShadow: ring ? `0 0 0 ${Math.max(4, size / 18)}px ${ring}` : "none" }}>
      <defs><clipPath id={id}><circle cx={100} cy={100} r={100} /></clipPath></defs>
      <circle cx={100} cy={100} r={100} fill={bg} />
      <g clipPath={`url(#${id})`}>
        {style === "long" && <path d="M54 90 Q48 36 100 38 Q152 36 146 90 L156 160 L44 160 Z" fill={hair} />}
        {style === "pony" && <><circle cx={150} cy={74} r={15} fill={hair} /><rect x={138} y={70} width={8} height={8} fill={shade(hair, 0.6)} /></>}
        {style === "bun" && <circle cx={100} cy={32} r={19} fill={hair} />}
        <path d="M18 200 Q22 146 100 138 Q178 146 182 200 Z" fill={shirt} />
        <path d="M82 142 L100 164 L118 142" fill="none" stroke="#f4f3ef" strokeWidth={6} strokeLinejoin="round" opacity={0.9} />
        <rect x={86} y={118} width={28} height={30} rx={10} fill={dark} />
        <circle cx={59} cy={98} r={9} fill={skin} /><circle cx={141} cy={98} r={9} fill={skin} />
        <ellipse cx={100} cy={92} rx={42} ry={46} fill={skin} />
        {look.beard && <path d="M60 100 Q62 142 100 144 Q138 142 140 100 Q132 126 100 128 Q68 126 60 100 Z" fill={hair} />}
        {(style === "short" || style === "band" || style === "pony" || style === "long") && <path d="M56 90 Q54 40 100 42 Q146 40 144 90 Q134 66 100 68 Q66 66 56 90 Z" fill={hair} />}
        {style === "wavy" && <path d="M54 92 Q46 38 100 38 Q154 38 146 92 Q138 60 116 66 Q100 52 84 66 Q62 60 54 92 Z" fill={hair} />}
        {style === "bun" && <path d="M56 90 Q54 40 100 42 Q146 40 144 90 Q134 66 100 68 Q66 66 56 90 Z" fill={hair} />}
        {style === "band" && <rect x={56} y={64} width={88} height={13} rx={5} fill={racket} />}
        {style === "cap" && <><path d="M54 84 Q56 36 100 36 Q144 36 146 84 Z" fill={shade(shirt, 0.9)} /><path d="M92 80 Q132 70 168 84 Q146 94 92 90 Z" fill={shade(shirt, 0.75)} /></>}
        <circle cx={84} cy={94} r={5.2} fill="#1a1a1a" /><circle cx={116} cy={94} r={5.2} fill="#1a1a1a" />
        <path d="M84 114 Q100 128 116 114" fill="none" stroke="#1a1a1a" strokeWidth={4.5} strokeLinecap="round" />
        {glasses && <g fill="none" stroke="#1a1a1a" strokeWidth={4}><circle cx={84} cy={94} r={13} /><circle cx={116} cy={94} r={13} /><path d="M97 94 H103" /></g>}
      </g>
      {showRacket && <g transform={`rotate(${swing} 152 152)`}><Racket color={racket} /></g>}
    </svg>
  );
};

