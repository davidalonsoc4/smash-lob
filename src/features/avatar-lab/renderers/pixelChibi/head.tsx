import { PIXEL_OUTLINE } from "../pixelPalette"
import type { PixelLayerProps } from "./shared"

export function HeadBaseLayer({ palette }: PixelLayerProps) {
  return (
    <g data-avatar-layer="head-base">
      <rect x="84" y="96" width="28" height="22" fill={palette.outline} />
      <rect x="88" y="96" width="20" height="18" fill={palette.skin.main} />
      <rect x="88" y="96" width="20" height="5" fill={palette.skin.shadow} />
      <polygon points="64,34 128,34 136,42 140,54 140,86 136,98 128,106 116,112 76,112 64,106 56,98 52,86 52,54 56,42" fill={palette.outline} />
      <polygon points="66,40 126,40 132,46 136,58 136,84 132,96 124,102 112,108 78,108 66,102 60,96 56,84 56,58 60,46" fill={palette.skin.main} />
      <polygon points="60,48 68,42 68,98 76,106 66,102 60,96 56,84 56,58" fill={palette.skin.highlight} />
      <polygon points="124,42 132,48 136,58 136,84 132,96 124,102 120,98 124,88" fill={palette.skin.shadow} />
      <rect x="48" y="62" width="10" height="28" fill={palette.outline} />
      <rect x="50" y="66" width="8" height="20" fill={palette.skin.main} />
      <rect x="136" y="62" width="10" height="28" fill={palette.outline} />
      <rect x="136" y="66" width="8" height="20" fill={palette.skin.shadow} />
      <rect x="52" y="70" width="4" height="8" fill={palette.skin.shadow} />
      <rect x="138" y="70" width="4" height="8" fill={palette.skin.main} />
    </g>
  )
}

export function FaceLayer({ recipe, palette }: PixelLayerProps) {
  const angled = recipe.eyebrows.style === "angled_01"
  return (
    <g data-avatar-layer="face">
      {angled ? (
        <g>
          <polygon points="68,58 86,54 86,60 70,62" fill={palette.eyebrows.main} />
          <polygon points="108,54 126,58 124,62 108,60" fill={palette.eyebrows.main} />
        </g>
      ) : (
        <g>
          <rect x="68" y="56" width="18" height="6" fill={palette.eyebrows.main} />
          <rect x="108" y="56" width="18" height="6" fill={palette.eyebrows.main} />
          <rect x="72" y="54" width="14" height="2" fill={palette.eyebrows.highlight} />
          <rect x="108" y="54" width="14" height="2" fill={palette.eyebrows.highlight} />
        </g>
      )}
      <rect x="74" y="66" width="12" height="24" fill="#fffaf0" />
      <rect x="108" y="66" width="12" height="24" fill="#fffaf0" />
      <rect x="78" y="68" width="8" height="20" fill={palette.eyes.shadow} />
      <rect x="108" y="68" width="8" height="20" fill={palette.eyes.shadow} />
      <rect x="80" y="70" width="4" height="14" fill={PIXEL_OUTLINE} />
      <rect x="110" y="70" width="4" height="14" fill={PIXEL_OUTLINE} />
      <rect x="94" y="78" width="4" height="8" fill={palette.skin.shadow} />
      <rect x="98" y="84" width="4" height="3" fill={palette.skin.shadow} />
      <rect x="92" y="94" width="12" height="3" fill={palette.outline} />
      <rect x="96" y="94" width="6" height="1" fill={palette.skin.highlight} />
    </g>
  )
}

export function BeardLayer({ recipe, palette }: PixelLayerProps) {
  if (recipe.beard.style === "none") return null
  if (recipe.beard.style === "goatee_01") {
    return (
      <g data-avatar-layer="beard">
        <rect x="88" y="90" width="20" height="5" fill={palette.beard.main} />
        <rect x="92" y="94" width="12" height="14" fill={palette.beard.main} />
        <rect x="96" y="104" width="8" height="6" fill={palette.beard.shadow} />
        <rect x="92" y="94" width="4" height="8" fill={palette.beard.highlight} />
      </g>
    )
  }
  return (
    <g data-avatar-layer="beard">
      <polygon points="62,84 70,88 74,96 82,102 82,108 72,106 64,100 62,92" fill={palette.beard.main} />
      <polygon points="132,84 124,88 120,96 112,102 112,108 122,106 130,100 132,92" fill={palette.beard.main} />
      <polygon points="78,102 84,108 110,108 116,102 116,108 108,114 86,114 78,108" fill={palette.beard.main} />
      <rect x="84" y="88" width="12" height="5" fill={palette.beard.main} />
      <rect x="100" y="88" width="12" height="5" fill={palette.beard.main} />
      <rect x="90" y="90" width="16" height="4" fill={palette.beard.main} />
      <polygon points="66,94 74,98 82,104 82,108 72,104 66,100" fill={palette.beard.shadow} />
      <polygon points="128,94 120,98 112,104 112,108 122,104 128,100" fill={palette.beard.shadow} />
      <rect x="86" y="108" width="22" height="4" fill={palette.beard.shadow} />
      <rect x="86" y="88" width="8" height="2" fill={palette.beard.highlight} />
      <rect x="102" y="88" width="8" height="2" fill={palette.beard.highlight} />
    </g>
  )
}

export function HairLayer({ recipe, palette }: PixelLayerProps) {
  if (recipe.hair.style === "none") return null
  if (recipe.hair.style === "short_up_01") {
    return (
      <g data-avatar-layer="hair">
        <polygon points="58,48 58,36 66,36 66,26 76,26 76,16 86,16 86,26 96,20 104,20 104,30 114,24 124,28 124,38 132,42 132,54 124,50 118,44 72,44 66,54" fill={palette.hair.main} />
        <polygon points="62,40 68,32 76,32 76,24 82,24 82,36 94,28 100,28 98,40" fill={palette.hair.highlight} />
        <polygon points="108,32 122,32 122,40 130,44 130,52 118,46" fill={palette.hair.shadow} />
      </g>
    )
  }
  return (
    <g data-avatar-layer="hair">
      <polygon points="54,58 50,54 54,48 50,44 58,42 54,36 64,36 62,30 72,32 72,24 82,28 88,20 96,28 104,22 110,30 120,28 120,36 130,36 128,44 136,48 132,56 122,50 116,44 72,44 66,52 64,64" fill={palette.hair.main} />
      <polygon points="54,52 60,46 58,40 68,42 68,34 78,36 82,28 88,36 96,30 102,36 114,34 114,40 124,40 122,46 132,50 126,52 116,44 72,44 64,56" fill={palette.hair.highlight} />
      <polygon points="106,32 120,32 120,38 130,38 128,44 136,48 132,56 120,48 116,42" fill={palette.hair.shadow} />
      <rect x="56" y="54" width="8" height="18" fill={palette.hair.shadow} />
      <rect x="128" y="52" width="8" height="20" fill={palette.hair.shadow} />
    </g>
  )
}

export function HeadwearLayer({ recipe, palette }: PixelLayerProps) {
  if (recipe.cap.style !== "none") {
    return (
      <g data-avatar-layer="cap">
        <polygon points="62,34 64,24 72,24 72,18 84,18 84,14 112,14 112,18 124,18 124,22 132,22 132,28 138,28 138,36 146,40 146,50 140,56 132,54 132,44 124,38 74,38 68,44 62,42" fill={palette.outline} />
        <polygon points="66,34 68,26 76,26 76,22 88,22 88,18 110,18 110,22 122,22 122,26 130,26 130,32 136,32 136,38 142,42 142,48 138,52 134,50 134,42 124,34 74,34 68,40 66,40" fill={palette.cap.main} />
        <polygon points="68,28 76,28 76,24 88,24 88,20 110,20 110,24 122,24 122,28 128,28 128,32 76,32 70,36" fill={palette.cap.highlight} />
        <polygon points="124,28 132,32 132,38 138,40 138,48 134,50 132,42 124,36" fill={palette.cap.shadow} />
        <rect x="88" y="18" width="22" height="4" fill={palette.cap.shadow} />
      </g>
    )
  }
  if (recipe.headband.style !== "none") {
    return (
      <g data-avatar-layer="headband">
        <rect x="58" y="42" width="76" height="10" fill={palette.outline} />
        <rect x="62" y="44" width="68" height="6" fill={palette.headband.main} />
        <rect x="62" y="44" width="68" height="2" fill={palette.headband.highlight} />
        <polygon points="130,46 140,50 138,58 132,54" fill={palette.headband.shadow} />
      </g>
    )
  }
  return null
}
