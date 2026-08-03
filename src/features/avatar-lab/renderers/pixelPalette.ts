import type { AvatarRecipe } from "../types"

type Surface = { main: string; shadow: string; highlight: string }

const surfaces: Record<string, Surface> = {
  skin_light_warm: { main: "#f0b27a", shadow: "#d9824b", highlight: "#ffd0a0" },
  skin_medium_warm: { main: "#e39052", shadow: "#b85d35", highlight: "#ffb979" },
  dark_brown: { main: "#3a2418", shadow: "#25150f", highlight: "#5a3724" },
  black: { main: "#1b1b1d", shadow: "#0f1011", highlight: "#34363a" },
  charcoal: { main: "#303236", shadow: "#191b1d", highlight: "#484b50" },
  navy: { main: "#263a56", shadow: "#162338", highlight: "#3b5577" },
  white: { main: "#f7f4ea", shadow: "#d6d1c7", highlight: "#fffdf8" },
  light_blue: { main: "#55a9d9", shadow: "#3f82b2", highlight: "#79c3e9" },
  light_blue_shadow: { main: "#3f82b2", shadow: "#2d638d", highlight: "#55a9d9" },
  green: { main: "#4f9f79", shadow: "#367a5a", highlight: "#72bb96" },
  green_shadow: { main: "#367a5a", shadow: "#25563f", highlight: "#4f9f79" },
  red: { main: "#b8493f", shadow: "#7d2e2a", highlight: "#d96b60" },
  blue: { main: "#315f87", shadow: "#213e5b", highlight: "#4f82ad" },
  grey: { main: "#777b80", shadow: "#50545a", highlight: "#a4a7aa" },
}

export const PIXEL_OUTLINE = "#17110d"
export const PIXEL_GRID = "#ded6ca"
export const PIXEL_PREVIEW_BACKGROUND = "#faf7f0"

export function getSurface(token: string): Surface {
  return surfaces[token] ?? surfaces.grey
}

export function getPixelPalette(recipe: AvatarRecipe) {
  return {
    outline: PIXEL_OUTLINE,
    skin: getSurface(`skin_${recipe.skinTone}`),
    hair: getSurface(recipe.hair.color),
    beard: getSurface(recipe.beard.color),
    eyes: getSurface(recipe.eyes.color),
    eyebrows: getSurface(recipe.eyebrows.color),
    cap: getSurface(recipe.cap.color),
    headband: getSurface(recipe.headband.color),
    shirt: getSurface(recipe.shirt.primaryColor),
    shirtSecondary: getSurface(recipe.shirt.secondaryColor),
    shorts: getSurface(recipe.shorts.primaryColor),
    shortsSecondary: getSurface(recipe.shorts.secondaryColor),
    sleeve: getSurface(recipe.compressionSleeve.color),
    wristband: getSurface(recipe.wristband.color),
    socks: getSurface(recipe.socks.primaryColor),
    shoes: getSurface(recipe.shoes.primaryColor),
    shoesSecondary: getSurface(recipe.shoes.secondaryColor),
    racket: getSurface(recipe.racket.primaryColor),
    racketSecondary: getSurface(recipe.racket.secondaryColor),
  }
}
