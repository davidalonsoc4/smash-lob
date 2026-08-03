import type { AvatarRendererProps } from "../types"
import { PIXEL_PREVIEW_BACKGROUND } from "./pixelPalette"
import { PixelGrid, PixelShadow } from "./pixelChibi/background"

const BASE_IMAGE_RIGHT = "/avatars/pixel-chibi/rendered/canonical-base.png"
const BASE_IMAGE_LEFT = "/avatars/pixel-chibi/rendered/canonical-base-left.png"

type OverlayRule = {
  key: string
  layer: string
  href: string
}

function getOverlayRules(recipe: Omit<AvatarRendererProps, "world">["recipe"]): OverlayRule[] {
  const overlays: OverlayRule[] = []

  if (recipe.skinTone === "light_warm") {
    overlays.push({ key: "skin-light", layer: "skin", href: "/avatars/pixel-chibi/rendered/overlay-skin-light.png" })
  }
  if (recipe.hair.color === "black") {
    overlays.push({ key: "hair-black", layer: "hair", href: "/avatars/pixel-chibi/rendered/overlay-hair-black.png" })
  }
  if (recipe.beard.color === "black") {
    overlays.push({ key: "beard-black", layer: "beard", href: "/avatars/pixel-chibi/rendered/overlay-beard-black.png" })
  }
  if (recipe.eyes.color === "blue") {
    overlays.push({ key: "eyes-blue", layer: "eyes", href: "/avatars/pixel-chibi/rendered/overlay-eyes-blue.png" })
  }
  if (recipe.cap.color === "black") {
    overlays.push({ key: "cap-black", layer: "cap", href: "/avatars/pixel-chibi/rendered/overlay-cap-black.png" })
  }
  if (recipe.shirt.primaryColor === "green") {
    overlays.push({ key: "shirt-green", layer: "shirt", href: "/avatars/pixel-chibi/rendered/overlay-shirt-green.png" })
  }
  if (recipe.shorts.primaryColor === "navy") {
    overlays.push({ key: "shorts-navy", layer: "shorts", href: "/avatars/pixel-chibi/rendered/overlay-shorts-navy.png" })
  }
  if (recipe.compressionSleeve.color === "white") {
    overlays.push({ key: "sleeve-white", layer: "compression-sleeve", href: "/avatars/pixel-chibi/rendered/overlay-sleeve-white.png" })
  }
  if (recipe.wristband.color === "black") {
    overlays.push({ key: "wristband-black", layer: "wristband", href: "/avatars/pixel-chibi/rendered/overlay-wristband-black.png" })
  }
  if (recipe.socks.primaryColor === "black") {
    overlays.push({ key: "socks-black", layer: "socks", href: "/avatars/pixel-chibi/rendered/overlay-socks-black.png" })
  }
  if (recipe.shoes.primaryColor === "light_blue") {
    overlays.push({ key: "shoes-light-blue", layer: "shoes", href: "/avatars/pixel-chibi/rendered/overlay-shoes-light-blue.png" })
  }

  return overlays
}

function CharacterRasterLayers({ recipe }: { recipe: Omit<AvatarRendererProps, "world">["recipe"] }) {
  const leftHanded = recipe.handedness === "left"
  const overlays = getOverlayRules(recipe)
  const baseHref = leftHanded ? BASE_IMAGE_LEFT : BASE_IMAGE_RIGHT

  return (
    <g data-avatar-handedness-asset={recipe.handedness}>
      <image
        href={baseHref}
        x="0"
        y="0"
        width="192"
        height="240"
        preserveAspectRatio="none"
        data-avatar-layer="canonical-base"
        data-logo-orientation="unmirrored"
      />
      <g transform={leftHanded ? "translate(192 0) scale(-1 1)" : undefined} data-avatar-overlays-mirrored={leftHanded ? "true" : "false"}>
        {overlays.map((overlay) => (
          <image
            key={overlay.key}
            href={overlay.href}
            x="0"
            y="0"
            width="192"
            height="240"
            preserveAspectRatio="none"
            data-avatar-layer={overlay.layer}
            data-avatar-variant={overlay.key}
          />
        ))}
      </g>
    </g>
  )
}

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
      <CharacterRasterLayers recipe={recipe} />
    </svg>
  )
}
