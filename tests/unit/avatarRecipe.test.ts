import { describe, expect, it } from "vitest"
import {
  DEFAULT_AVATAR_RECIPE,
  cloneAvatarRecipe,
  normalizeAvatarRecipe,
  validateAvatarRecipe,
  isAvatarRecipe,
} from "@/features/avatar-lab/recipe"

describe("avatar recipe", () => {
  it("matches the canonical reference by default", () => {
    expect(DEFAULT_AVATAR_RECIPE).toMatchObject({
      schemaVersion: 1,
      handedness: "right",
      skinTone: "medium_warm",
      hair: { style: "messy_short_01", color: "dark_brown" },
      beard: { style: "short_full_01", color: "dark_brown" },
      cap: { style: "backwards_01", color: "white" },
      shirt: { primaryColor: "light_blue" },
      shorts: { primaryColor: "black" },
      compressionSleeve: { enabled: true, side: "dominant", color: "black" },
      wristband: { enabled: true, side: "non_dominant", color: "white" },
      socks: { length: "high", primaryColor: "white" },
      shoes: { primaryColor: "white", secondaryColor: "black" },
      racket: { model: "round_b_01", primaryColor: "white", secondaryColor: "black" },
    })
    expect(validateAvatarRecipe(DEFAULT_AVATAR_RECIPE)).toEqual([])
  })

  it("rejects incomplete or world-specific persisted data", () => {
    expect(isAvatarRecipe({ schemaVersion: 1, handedness: "right" })).toBe(false)
    expect(isAvatarRecipe({ ...DEFAULT_AVATAR_RECIPE, pixelAvatarConfig: {} })).toBe(false)
    expect(isAvatarRecipe({
      ...DEFAULT_AVATAR_RECIPE,
      shirt: { ...DEFAULT_AVATAR_RECIPE.shirt, secondaryColor: "invalid" },
    })).toBe(false)
  })

  it("normalizes cap/headband and cap/hair incompatibilities", () => {
    const recipe = cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    recipe.headband.style = "basic_01"
    recipe.hair.style = "short_up_01"

    const normalized = normalizeAvatarRecipe(recipe)

    expect(normalized.cap.style).toBe("backwards_01")
    expect(normalized.headband.style).toBe("none")
    expect(normalized.hair.style).toBe("messy_short_01")
    expect(validateAvatarRecipe(normalized)).toEqual([])
  })
})
