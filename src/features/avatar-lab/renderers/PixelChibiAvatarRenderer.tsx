import type { AvatarRendererProps } from "../types"
import {
  PIXEL_PREVIEW_BACKGROUND,
} from "./pixelPalette"
import { PixelGrid, PixelShadow } from "./pixelChibi/background"
import { CharacterLayers } from "./pixelChibi/CharacterLayers"

export function PixelChibiAvatarRenderer({
  recipe,
  className,
  title = "Avatar Pixel Chibi de pádel",
  transparent = false,
  showReferenceGrid = false,
}: Omit<AvatarRendererProps, "world">) {
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 192 240"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="crispEdges"
      data-avatar-world="pixel_chibi"
      data-avatar-handedness={recipe.handedness}
      style={{ imageRendering: "pixelated" }}
    >
      {!transparent ? <rect width="192" height="240" fill={PIXEL_PREVIEW_BACKGROUND} /> : null}
      {showReferenceGrid && !transparent ? <PixelGrid /> : null}
      <PixelShadow />
      <CharacterLayers recipe={recipe} />
    </svg>
  )
}
