import { describe, expect, it } from "vitest"
import { DEFAULT_AVATAR_RECIPE, validateAvatarRecipe } from "@/features/avatar-lab/recipe"
import { randomizeAvatarRecipe } from "@/features/avatar-lab/randomize"

function sequence(values: number[]) {
  let index = 0
  return () => values[index++ % values.length]
}

describe("avatar randomization", () => {
  it("always returns a compatible recipe", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const random = sequence([(seed % 10) / 10, ((seed + 3) % 10) / 10, ((seed + 7) % 10) / 10, 0.1, 0.9, 0.4])
      const recipe = randomizeAvatarRecipe(DEFAULT_AVATAR_RECIPE, random)
      expect(validateAvatarRecipe(recipe)).toEqual([])
      if (recipe.cap.style !== "none") {
        expect(recipe.headband.style).toBe("none")
        expect(recipe.hair.style).not.toBe("short_up_01")
      }
    }
  })

  it("can produce left-handed recipes with relative equipment", () => {
    const recipe = randomizeAvatarRecipe(DEFAULT_AVATAR_RECIPE, () => 0.99)
    expect(recipe.handedness).toBe("left")
    expect(recipe.compressionSleeve.side).toBe("dominant")
    expect(["dominant", "non_dominant"]).toContain(recipe.wristband.side)
  })
})
