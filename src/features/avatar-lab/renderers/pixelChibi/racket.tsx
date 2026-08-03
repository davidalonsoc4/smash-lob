import type { AvatarRecipe } from "../../types"
import { PIXEL_OUTLINE } from "../pixelPalette"
import type { PixelLayerProps } from "./shared"

export function RacketLayer({ recipe, palette }: PixelLayerProps) {
  const diamond = recipe.racket.model === "diamond_stripe_01"
  return (
    <g data-avatar-layer="racket">
      <polygon
        points={diamond ? "16,58 36,46 56,58 64,82 58,108 40,124 20,108 10,82" : "20,58 40,50 58,60 66,78 64,98 54,116 36,126 18,114 10,96 10,76"}
        fill={palette.outline}
      />
      <polygon
        points={diamond ? "18,62 36,52 52,62 58,82 54,104 40,118 24,104 16,82" : "22,64 40,56 54,64 60,80 58,96 50,108 36,118 22,108 16,94 16,78"}
        fill={palette.racket.main}
      />
      <polygon
        points={diamond ? "20,64 36,54 50,64 52,70 22,70" : "24,66 40,60 52,66 54,72 22,72"}
        fill={palette.racket.highlight}
      />
      <rect x="34" y="118" width="12" height="32" fill={palette.outline} />
      <rect x="36" y="120" width="8" height="27" fill={palette.racketSecondary.main} />
      <rect x="34" y="142" width="12" height="18" fill={palette.outline} />
      <rect x="36" y="144" width="8" height="14" fill={palette.racketSecondary.shadow} />
      <path d="M38 158H44V164H48V178H44V184H36V180H32V166H36V162H38Z" fill={palette.outline} />
      <path d="M38 162H42V166H44V176H42V180H38V178H36V168H38Z" fill={palette.racketSecondary.main} />
      {[
        [26, 74], [34, 72], [42, 72], [50, 76], [22, 82], [30, 82], [38, 80],
        [48, 84], [22, 92], [30, 92], [40, 92], [50, 94], [26, 102], [36, 102], [46, 104],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" fill={palette.racketSecondary.main} />
      ))}
      {diamond ? (
        <g>
          <rect x="22" y="84" width="30" height="5" fill={palette.racketSecondary.main} />
          <rect x="26" y="90" width="24" height="4" fill={palette.racketSecondary.shadow} />
        </g>
      ) : null}
    </g>
  )
}

export function RacketMark({ recipe }: { recipe: AvatarRecipe }) {
  if (recipe.racket.model !== "round_b_01") return null
  const translateX = recipe.handedness === "left" ? 116 : 0
  return (
    <g data-avatar-layer="racket-mark" data-logo-orientation="unmirrored" transform={`translate(${translateX} 0)`} fill={PIXEL_OUTLINE}>
      <rect x="28" y="80" width="5" height="24" />
      <rect x="33" y="80" width="13" height="5" />
      <rect x="33" y="90" width="11" height="5" />
      <rect x="33" y="99" width="13" height="5" />
      <rect x="44" y="84" width="5" height="8" />
      <rect x="44" y="94" width="5" height="7" />
    </g>
  )
}
