import { describe, expect, it } from "vitest"
import {
  buildNotionAvatarPreviewUrl,
  notionAvatarRecipeFromSearchParams,
} from "@/features/avatar-lab/notionAvatarUrl"
import {
  DEFAULT_NOTION_AVATAR_RECIPE,
  NOTION_AVATAR_PART_ORDER,
  NOTION_AVATAR_PARTS,
} from "@/features/avatar-lab/notionAvatarModel"

describe("Notion Avatar preview URL", () => {
  it("serializes every layer through the local endpoint", () => {
    const url = new URL(buildNotionAvatarPreviewUrl(DEFAULT_NOTION_AVATAR_RECIPE, 3), "https://example.test")
    expect(url.pathname).toBe("/api/experimental/avatar-lab/notion-avatar")
    expect(url.searchParams.get("revision")).toBe("3")
    for (const part of NOTION_AVATAR_PART_ORDER) {
      expect(url.searchParams.get(part)).toBe(String(DEFAULT_NOTION_AVATAR_RECIPE[part]))
    }
  })

  it("clamps route parameters before requesting official layers", () => {
    const recipe = notionAvatarRecipeFromSearchParams(new URLSearchParams({
      face: "-9",
      hair: "999",
      mouth: "not-a-number",
    }))
    expect(recipe.face).toBe(0)
    expect(recipe.hair).toBe(NOTION_AVATAR_PARTS.hair.max)
    expect(recipe.mouth).toBe(DEFAULT_NOTION_AVATAR_RECIPE.mouth)
  })
})
