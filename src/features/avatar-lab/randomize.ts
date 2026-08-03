import { normalizeAvatarRecipe } from "./recipe"
import type { AvatarRecipe } from "./types"

function pick<T>(values: readonly T[], random: () => number): T {
  const index = Math.min(values.length - 1, Math.floor(random() * values.length))
  return values[index]
}

export function randomizeAvatarRecipe(
  base: AvatarRecipe,
  random: () => number = Math.random,
): AvatarRecipe {
  const shirtPrimary = pick(["light_blue", "green"] as const, random)
  const shortsPrimary = pick(["black", "navy"] as const, random)
  const shoesPrimary = pick(["white", "light_blue"] as const, random)

  return normalizeAvatarRecipe({
    ...base,
    handedness: pick(["right", "left"] as const, random),
    skinTone: pick(["light_warm", "medium_warm"] as const, random),
    hair: {
      style: "messy_short_01",
      color: pick(["dark_brown", "black"] as const, random),
    },
    beard: {
      style: "short_full_01",
      color: pick(["dark_brown", "black"] as const, random),
    },
    eyes: { ...base.eyes, color: pick(["dark_brown", "blue"] as const, random) },
    eyebrows: {
      style: "thick_straight_01",
      color: "dark_brown",
    },
    cap: {
      style: "backwards_01",
      color: pick(["white", "black"] as const, random),
    },
    headband: {
      style: "none",
      color: "white",
    },
    shirt: {
      ...base.shirt,
      primaryColor: shirtPrimary,
      secondaryColor: shirtPrimary === "light_blue" ? "light_blue_shadow" : "green_shadow",
    },
    shorts: {
      ...base.shorts,
      primaryColor: shortsPrimary,
      secondaryColor: shortsPrimary === "black" ? "charcoal" : "black",
    },
    compressionSleeve: {
      enabled: true,
      side: "dominant",
      color: pick(["black", "white"] as const, random),
    },
    wristband: {
      enabled: true,
      side: "non_dominant",
      color: pick(["white", "black"] as const, random),
    },
    socks: {
      length: "high",
      primaryColor: pick(["white", "black"] as const, random),
    },
    shoes: {
      ...base.shoes,
      primaryColor: shoesPrimary,
      secondaryColor: shoesPrimary === "white" ? "black" : "white",
    },
    racket: {
      model: "round_b_01",
      primaryColor: "white",
      secondaryColor: "black",
    },
  })
}
