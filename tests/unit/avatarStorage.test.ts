import { describe, expect, it } from "vitest"
import { DEFAULT_AVATAR_RECIPE, cloneAvatarRecipe } from "@/features/avatar-lab/recipe"
import {
  AVATAR_RECIPE_STORAGE_KEY,
  AVATAR_WORLD_STORAGE_KEY,
  loadAvatarRecipe,
  loadAvatarWorldPreference,
  resetAvatarLabStorage,
  saveAvatarRecipe,
  saveAvatarWorldPreference,
  type StorageLike,
} from "@/features/avatar-lab/storage"

function createStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe("avatar lab storage", () => {
  it("persists a versioned neutral recipe and viewer world", () => {
    const storage = createStorage()
    const recipe = cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    recipe.handedness = "left"
    recipe.shirt.primaryColor = "green"
    recipe.shirt.secondaryColor = "green_shadow"

    saveAvatarRecipe(storage, recipe)
    saveAvatarWorldPreference(storage, "pixel_chibi")

    expect(storage.values.has(AVATAR_RECIPE_STORAGE_KEY)).toBe(true)
    expect(storage.values.has(AVATAR_WORLD_STORAGE_KEY)).toBe(true)
    expect(loadAvatarRecipe(storage)).toEqual(recipe)
    expect(loadAvatarWorldPreference(storage)).toBe("pixel_chibi")
  })

  it("falls back safely and resets only experimental keys", () => {
    const storage = createStorage()
    storage.setItem(AVATAR_RECIPE_STORAGE_KEY, "{bad-json")
    storage.setItem(AVATAR_WORLD_STORAGE_KEY, "unknown")
    storage.setItem("another-key", "keep")

    expect(loadAvatarRecipe(storage)).toEqual(DEFAULT_AVATAR_RECIPE)
    expect(loadAvatarWorldPreference(storage)).toBe("pixel_chibi")

    resetAvatarLabStorage(storage)
    expect(storage.getItem(AVATAR_RECIPE_STORAGE_KEY)).toBeNull()
    expect(storage.getItem(AVATAR_WORLD_STORAGE_KEY)).toBeNull()
    expect(storage.getItem("another-key")).toBe("keep")
  })
})
