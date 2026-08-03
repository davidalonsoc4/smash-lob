import type { PixelLayerProps } from "./shared"
import { relativeSideMatches } from "./shared"

export function LegsAndFeetLayer({ recipe, palette }: PixelLayerProps) {
  const high = recipe.socks.length === "high"
  const sockY = high ? 204 : 214
  const sockHeight = high ? 20 : 12
  return (
    <g data-avatar-layer="legs-feet">
      <rect x="74" y="194" width="22" height="32" fill={palette.outline} />
      <rect x="100" y="194" width="22" height="32" fill={palette.outline} />
      <rect x="78" y="194" width="16" height={high ? 12 : 22} fill={palette.skin.main} />
      <rect x="102" y="194" width="16" height={high ? 12 : 22} fill={palette.skin.main} />
      <rect x="78" y="194" width="4" height={high ? 12 : 22} fill={palette.skin.highlight} />
      <rect x="90" y="194" width="4" height={high ? 12 : 22} fill={palette.skin.shadow} />
      <rect x="102" y="194" width="4" height={high ? 12 : 22} fill={palette.skin.highlight} />
      <rect x="114" y="194" width="4" height={high ? 12 : 22} fill={palette.skin.shadow} />
      <rect x="76" y={sockY} width="20" height={sockHeight} fill={palette.socks.main} />
      <rect x="100" y={sockY} width="20" height={sockHeight} fill={palette.socks.main} />
      <rect x="76" y={sockY} width="4" height={sockHeight} fill={palette.socks.highlight} />
      <rect x="92" y={sockY} width="4" height={sockHeight} fill={palette.socks.shadow} />
      <rect x="116" y={sockY} width="4" height={sockHeight} fill={palette.socks.shadow} />
      {high ? (
        <>
          <rect x="82" y="208" width="8" height="3" fill={palette.socks.shadow} />
          <rect x="106" y="208" width="8" height="3" fill={palette.socks.shadow} />
        </>
      ) : null}
      <polygon points="66,218 92,218 100,224 98,232 62,232 62,226" fill={palette.outline} />
      <polygon points="104,218 126,218 136,224 134,232 100,232 100,226" fill={palette.outline} />
      <polygon points="68,220 90,220 96,224 94,228 66,228 66,224" fill={palette.shoes.main} />
      <polygon points="106,220 124,220 132,224 130,228 104,228 104,224" fill={palette.shoes.main} />
      <rect x="66" y="228" width="30" height="3" fill={palette.shoesSecondary.main} />
      <rect x="104" y="228" width="28" height="3" fill={palette.shoesSecondary.main} />
      <rect x="72" y="222" width="16" height="2" fill={palette.shoesSecondary.main} />
      <rect x="110" y="222" width="14" height="2" fill={palette.shoesSecondary.main} />
      <rect x="76" y="225" width="12" height="2" fill={palette.shoesSecondary.shadow} />
      <rect x="112" y="225" width="12" height="2" fill={palette.shoesSecondary.shadow} />
    </g>
  )
}

export function ShortsLayer({ palette }: PixelLayerProps) {
  return (
    <g data-avatar-layer="shorts">
      <polygon points="68,164 128,164 126,198 102,198 98,184 94,198 70,198" fill={palette.outline} />
      <polygon points="72,168 124,168 122,194 104,194 100,178 96,178 92,194 74,194" fill={palette.shorts.main} />
      <rect x="72" y="168" width="52" height="5" fill={palette.shorts.highlight} />
      <rect x="74" y="174" width="6" height="20" fill={palette.shorts.shadow} />
      <rect x="116" y="174" width="6" height="20" fill={palette.shorts.shadow} />
      <rect x="96" y="178" width="4" height="16" fill={palette.shortsSecondary.main} />
      <rect x="110" y="178" width="7" height="3" fill={palette.shortsSecondary.highlight} />
    </g>
  )
}

export function TorsoLayer({ palette }: PixelLayerProps) {
  return (
    <g data-avatar-layer="shirt">
      <polygon points="72,108 84,104 112,104 124,108 132,124 128,168 68,168 64,124" fill={palette.outline} />
      <polygon points="74,112 86,108 110,108 122,112 128,126 124,164 72,164 68,126" fill={palette.shirt.main} />
      <rect x="82" y="108" width="32" height="5" fill={palette.shirt.highlight} />
      <polygon points="116,112 122,114 126,128 122,156 116,160" fill={palette.shirt.shadow} />
      <polygon points="72,116 80,112 78,158 72,162 68,126" fill={palette.shirtSecondary.main} />
      <rect x="84" y="108" width="28" height="4" fill={palette.outline} />
      <rect x="88" y="108" width="20" height="4" fill={palette.skin.main} />
      <rect x="78" y="158" width="34" height="3" fill={palette.shirtSecondary.shadow} />
      <rect x="108" y="128" width="8" height="4" fill={palette.shirtSecondary.highlight} />
      <rect x="112" y="132" width="4" height="4" fill={palette.shirtSecondary.highlight} />
    </g>
  )
}

export function ArmsLayer({ recipe, palette }: PixelLayerProps) {
  const dominantSleeve = recipe.compressionSleeve.enabled && relativeSideMatches(recipe.compressionSleeve.side, "dominant")
  const nonDominantSleeve = recipe.compressionSleeve.enabled && relativeSideMatches(recipe.compressionSleeve.side, "non_dominant")
  const dominantWristband = recipe.wristband.enabled && relativeSideMatches(recipe.wristband.side, "dominant")
  const nonDominantWristband = recipe.wristband.enabled && relativeSideMatches(recipe.wristband.side, "non_dominant")

  return (
    <g data-avatar-layer="arms">
      <polygon points="64,120 74,120 78,134 68,150 58,148 56,134" fill={palette.outline} />
      <polygon points="66,124 72,124 74,134 66,146 60,144 60,134" fill={palette.skin.main} />
      <rect x="60" y="124" width="5" height="18" fill={palette.skin.highlight} />
      {dominantSleeve ? (
        <g data-avatar-layer="compression-sleeve">
          <polygon points="64,120 74,120 76,136 68,150 58,148 56,134" fill={palette.outline} />
          <polygon points="64,124 70,124 72,136 66,146 60,144 60,134" fill={palette.sleeve.main} />
          <rect x="60" y="126" width="4" height="16" fill={palette.sleeve.highlight} />
        </g>
      ) : null}
      {dominantWristband ? (
        <g data-avatar-layer="wristband-dominant">
          <rect x="58" y="140" width="12" height="10" fill={palette.outline} />
          <rect x="60" y="142" width="8" height="6" fill={palette.wristband.main} />
        </g>
      ) : null}
      <polygon points="50,138 64,138 70,146 66,160 52,162 44,154 44,144" fill={palette.outline} />
      <polygon points="52,142 62,142 66,148 62,156 52,158 48,152 48,146" fill={palette.skin.main} />
      <rect x="48" y="144" width="4" height="10" fill={palette.skin.highlight} />
      <rect x="58" y="142" width="4" height="14" fill={palette.skin.shadow} />
      <rect x="44" y="146" width="6" height="4" fill={palette.outline} />
      <rect x="48" y="150" width="6" height="4" fill={palette.outline} />

      <polygon points="122,120 132,120 140,134 138,156 126,164 118,156 120,134" fill={palette.outline} />
      <polygon points="124,124 130,124 136,136 134,152 128,158 122,154 124,136" fill={palette.skin.main} />
      <rect x="124" y="124" width="4" height="30" fill={palette.skin.highlight} />
      <rect x="132" y="132" width="4" height="20" fill={palette.skin.shadow} />
      {nonDominantSleeve ? (
        <g data-avatar-layer="compression-sleeve">
          <polygon points="122,120 132,120 140,134 138,156 126,164 118,156 120,134" fill={palette.outline} />
          <polygon points="124,124 130,124 136,136 134,152 128,158 122,154 124,136" fill={palette.sleeve.main} />
          <rect x="124" y="126" width="4" height="26" fill={palette.sleeve.highlight} />
        </g>
      ) : null}
      {nonDominantWristband ? (
        <g data-avatar-layer="wristband-non-dominant">
          <rect x="120" y="142" width="18" height="12" fill={palette.outline} />
          <rect x="124" y="144" width="10" height="8" fill={palette.wristband.main} />
          <rect x="124" y="144" width="3" height="8" fill={palette.wristband.highlight} />
        </g>
      ) : null}
      <polygon points="124,154 138,150 144,158 142,170 130,176 120,168" fill={palette.outline} />
      <polygon points="128,156 136,154 140,160 138,166 132,170 124,166" fill={palette.skin.main} />
      <rect x="126" y="158" width="4" height="8" fill={palette.skin.highlight} />
      <rect x="136" y="158" width="4" height="8" fill={palette.skin.shadow} />
    </g>
  )
}
