import type { AvatarRecipe, AvatarRelativeSide } from "../../types"
import { getPixelPalette } from "../pixelPalette"

export type PixelPalette = ReturnType<typeof getPixelPalette>
export type PixelLayerProps = { recipe: AvatarRecipe; palette: PixelPalette }

export function relativeSideMatches(side: AvatarRelativeSide, target: AvatarRelativeSide) {
  return side === target
}
