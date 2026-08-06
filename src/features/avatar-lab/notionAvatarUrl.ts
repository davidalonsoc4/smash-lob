import {
  DEFAULT_NOTION_AVATAR_RECIPE,
  NOTION_AVATAR_PART_ORDER,
  normalizeNotionAvatarRecipe,
  type NotionAvatarRecipe,
} from "./notionAvatarModel"

export const NOTION_AVATAR_PREVIEW_PATH =
  "/api/experimental/avatar-lab/notion-avatar"

export function notionAvatarRecipeFromSearchParams(
  searchParams: URLSearchParams,
): NotionAvatarRecipe {
  const candidate = Object.fromEntries(
    NOTION_AVATAR_PART_ORDER.map((part) => [
      part,
      Number.parseInt(
        searchParams.get(part) ?? String(DEFAULT_NOTION_AVATAR_RECIPE[part]),
        10,
      ),
    ]),
  )

  return normalizeNotionAvatarRecipe(candidate)
}

export function buildNotionAvatarPreviewUrl(
  recipe: NotionAvatarRecipe,
  revision = 0,
) {
  const params = new URLSearchParams({ revision: String(revision) })
  for (const part of NOTION_AVATAR_PART_ORDER) {
    params.set(part, String(recipe[part]))
  }
  return `${NOTION_AVATAR_PREVIEW_PATH}?${params.toString()}`
}
