import { PIXEL_GRID } from "../pixelPalette"

export function PixelGrid() {
  return (
    <g aria-hidden="true" opacity="0.58">
      {Array.from({ length: 25 }, (_, index) => (
        <line key={`v-${index}`} x1={index * 8} x2={index * 8} y1="0" y2="240" stroke={PIXEL_GRID} strokeWidth="1" />
      ))}
      {Array.from({ length: 31 }, (_, index) => (
        <line key={`h-${index}`} x1="0" x2="192" y1={index * 8} y2={index * 8} stroke={PIXEL_GRID} strokeWidth="1" />
      ))}
    </g>
  )
}

export function PixelShadow() {
  return (
    <g aria-hidden="true">
      <rect x="58" y="226" width="76" height="4" fill="#cbbdad" />
      <rect x="68" y="222" width="58" height="4" fill="#ded2c4" />
      <rect x="78" y="230" width="38" height="2" fill="#bba997" />
    </g>
  )
}
