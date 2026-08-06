import { describe, expect, it } from "vitest"
import {
  DEFAULT_NOTION_AVATAR_RECIPE,
  NOTION_AVATAR_PART_ORDER,
  NOTION_AVATAR_PARTS,
  normalizeNotionAvatarRecipe,
  notionPartValues,
  randomNotionAvatarRecipe,
  updateNotionAvatarPart,
} from "@/features/avatar-lab/notionAvatarModel"

describe("Notion Avatar model", () => {
  it("imports every documented range from the official source", () => {
    expect(Object.fromEntries(
      NOTION_AVATAR_PART_ORDER.map((part) => [part, notionPartValues(part).length]),
    )).toEqual({
      face: 16,
      nose: 14,
      mouth: 20,
      eyes: 14,
      eyebrows: 16,
      glasses: 15,
      hair: 59,
      accessories: 15,
      details: 14,
      beard: 17,
    })
  })

  it("starts every category on visible style 1", () => {
    for (const part of NOTION_AVATAR_PART_ORDER) {
      expect(DEFAULT_NOTION_AVATAR_RECIPE[part]).toBe(0)
    }
  })

  it("normalizes invalid and out-of-range recipes", () => {
    const normalized = normalizeNotionAvatarRecipe({
      face: -3,
      hair: 999,
      mouth: 7.5,
      glasses: "4",
    })
    expect(normalized.face).toBe(0)
    expect(normalized.hair).toBe(NOTION_AVATAR_PARTS.hair.max)
    expect(normalized.mouth).toBe(DEFAULT_NOTION_AVATAR_RECIPE.mouth)
    expect(normalized.glasses).toBe(DEFAULT_NOTION_AVATAR_RECIPE.glasses)
  })

  it("updates one layer without mutating the original recipe", () => {
    const updated = updateNotionAvatarPart(DEFAULT_NOTION_AVATAR_RECIPE, "hair", 22)
    expect(updated.hair).toBe(22)
    expect(DEFAULT_NOTION_AVATAR_RECIPE.hair).not.toBe(22)
  })

  it("randomizes every layer within its supported range", () => {
    const low = randomNotionAvatarRecipe(() => 0)
    const high = randomNotionAvatarRecipe(() => 0.999999)
    for (const part of NOTION_AVATAR_PART_ORDER) {
      expect(low[part]).toBe(0)
      expect(high[part]).toBe(NOTION_AVATAR_PARTS[part].max)
    }
  })
})
