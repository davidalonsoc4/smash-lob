import type { AvatarRecipe } from "../../types"
import { getPixelPalette } from "../pixelPalette"
import { ArmsLayer, LegsAndFeetLayer, ShortsLayer, TorsoLayer } from "./body"
import { BeardLayer, FaceLayer, HairLayer, HeadBaseLayer, HeadwearLayer } from "./head"
import { RacketLayer, RacketMark } from "./racket"

export function CharacterLayers({ recipe }: { recipe: AvatarRecipe }) {
  const palette = getPixelPalette(recipe)
  const mirrored = recipe.handedness === "left"
  return (
    <>
      <g transform={mirrored ? "translate(192 0) scale(-1 1)" : undefined} data-avatar-mirrored={mirrored ? "true" : "false"}>
        <RacketLayer recipe={recipe} palette={palette} />
        <LegsAndFeetLayer recipe={recipe} palette={palette} />
        <ShortsLayer recipe={recipe} palette={palette} />
        <TorsoLayer recipe={recipe} palette={palette} />
        <ArmsLayer recipe={recipe} palette={palette} />
        <HeadBaseLayer recipe={recipe} palette={palette} />
        <BeardLayer recipe={recipe} palette={palette} />
        <FaceLayer recipe={recipe} palette={palette} />
        <HairLayer recipe={recipe} palette={palette} />
        <HeadwearLayer recipe={recipe} palette={palette} />
      </g>
      <RacketMark recipe={recipe} />
    </>
  )
}
