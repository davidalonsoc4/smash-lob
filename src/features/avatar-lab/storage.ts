import {
  DEFAULT_AVATAR_RECIPE,
  cloneAvatarRecipe,
  isAvatarRecipe,
  normalizeAvatarRecipe,
} from "./recipe"
import type { AvatarRecipe, AvatarWorldPreference } from "./types"

export const AVATAR_RECIPE_STORAGE_KEY = "smash-lob-avatar-lab-recipe-v1"
export const AVATAR_WORLD_STORAGE_KEY = "smash-lob-avatar-lab-world-v1"

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

export function loadAvatarRecipe(storage: StorageLike): AvatarRecipe {
  try {
    const raw = storage.getItem(AVATAR_RECIPE_STORAGE_KEY)
    if (!raw) return cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    const parsed: unknown = JSON.parse(raw)
    return isAvatarRecipe(parsed)
      ? normalizeAvatarRecipe(parsed)
      : cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
  } catch {
    return cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
  }
}

export function saveAvatarRecipe(storage: StorageLike, recipe: AvatarRecipe) {
  storage.setItem(
    AVATAR_RECIPE_STORAGE_KEY,
    JSON.stringify(normalizeAvatarRecipe(recipe)),
  )
}

export function loadAvatarWorldPreference(
  storage: StorageLike,
): AvatarWorldPreference {
  const value = storage.getItem(AVATAR_WORLD_STORAGE_KEY)
  return value === "chibi_illustrated" ? "chibi_illustrated" : "pixel_chibi"
}

export function saveAvatarWorldPreference(
  storage: StorageLike,
  world: AvatarWorldPreference,
) {
  storage.setItem(AVATAR_WORLD_STORAGE_KEY, world)
}

export function resetAvatarLabStorage(storage: StorageLike) {
  storage.removeItem(AVATAR_RECIPE_STORAGE_KEY)
  storage.removeItem(AVATAR_WORLD_STORAGE_KEY)
}
