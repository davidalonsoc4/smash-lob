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
  const capEnabled = random() > 0.5
  const headbandEnabled = !capEnabled && random() > 0.55
  const shirtPrimary = pick(["light_blue", "green"] as const, random)
  const shortsPrimary = pick(["black", "navy"] as const, random)
  const shoesPrimary = pick(["white", "light_blue"] as const, random)

  return normalizeAvatarRecipe({
    ...base,
    handedness: pick(["right", "left"] as const, random),
    skinTone: pick(["light_warm", "medium_warm"] as const, random),
    hair: {
      style: capEnabled
        ? pick(["none", "messy_short_01"] as const, random)
        : pick(["none", "messy_short_01", "short_up_01"] as const, random),
      color: pick(["dark_brown", "black"] as const, random),
    },
    beard: {
      style: pick(["none", "short_full_01", "goatee_01"] as const, random),
      color: pick(["dark_brown", "black"] as const, random),
    },
    eyes: { ...base.eyes, color: pick(["dark_brown", "blue"] as const, random) },
    eyebrows: {
      style: pick(["thick_straight_01", "angled_01"] as const, random),
      color: pick(["dark_brown", "black"] as const, random),
    },
    cap: {
      style: capEnabled ? "backwards_01" : "none",
      color: pick(["white", "black"] as const, random),
    },
    headband: {
      style: headbandEnabled ? "basic_01" : "none",
      color: pick(["white", "red"] as const, random),
    },
    shirt: {
      ...base.shirt,
      primaryColor: shirtPrimary,
      secondaryColor: pick(
        shirtPrimary === "light_blue"
          ? (["light_blue_shadow", "white", "black"] as const)
          : (["green_shadow", "white", "black"] as const),
        random,
      ),
    },
    shorts: {
      ...base.shorts,
      primaryColor: shortsPrimary,
      secondaryColor: shortsPrimary === "black" ? "charcoal" : "black",
    },
    compressionSleeve: {
      enabled: random() > 0.35,
      side: "dominant",
      color: pick(["black", "white"] as const, random),
    },
    wristband: {
      enabled: random() > 0.35,
      side: pick(["dominant", "non_dominant"] as const, random),
      color: pick(["white", "black"] as const, random),
    },
    socks: {
      length: pick(["high", "short"] as const, random),
      primaryColor: pick(["white", "black"] as const, random),
    },
    shoes: {
      ...base.shoes,
      primaryColor: shoesPrimary,
      secondaryColor: shoesPrimary === "white" ? "black" : "white",
    },
    racket: {
      model: pick(["round_b_01", "diamond_stripe_01"] as const, random),
      primaryColor: pick(["white", "black"] as const, random),
      secondaryColor: pick(["black", "light_blue"] as const, random),
    },
  })
}
