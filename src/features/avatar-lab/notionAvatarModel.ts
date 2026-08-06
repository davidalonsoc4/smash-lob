export const NOTION_AVATAR_PARTS = {
  face: { label: "Cara", max: 15 },
  nose: { label: "Nariz", max: 13 },
  mouth: { label: "Boca", max: 19 },
  eyes: { label: "Ojos", max: 13 },
  eyebrows: { label: "Cejas", max: 15 },
  glasses: { label: "Gafas", max: 14 },
  hair: { label: "Pelo", max: 58 },
  accessories: { label: "Accesorios", max: 14 },
  details: { label: "Detalles", max: 13 },
  beard: { label: "Barba", max: 16 },
} as const

export type NotionAvatarPart = keyof typeof NOTION_AVATAR_PARTS
export type NotionAvatarRecipe = Record<NotionAvatarPart, number>
export type NotionAvatarSavedState = {
  recipe: NotionAvatarRecipe
}

export const NOTION_AVATAR_PART_ORDER = Object.keys(
  NOTION_AVATAR_PARTS,
) as NotionAvatarPart[]

export const DEFAULT_NOTION_AVATAR_RECIPE: NotionAvatarRecipe = {
  face: 0,
  nose: 0,
  mouth: 0,
  eyes: 0,
  eyebrows: 0,
  glasses: 0,
  hair: 0,
  accessories: 0,
  details: 0,
  beard: 0,
}

export function notionPartValues(part: NotionAvatarPart) {
  return Array.from(
    { length: NOTION_AVATAR_PARTS[part].max + 1 },
    (_, index) => index,
  )
}

function clampIndex(value: unknown, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback
  return Math.min(max, Math.max(0, value))
}

export function normalizeNotionAvatarRecipe(
  value: unknown,
): NotionAvatarRecipe {
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<Record<NotionAvatarPart, unknown>>)
      : {}
  const normalized = {} as NotionAvatarRecipe

  for (const part of NOTION_AVATAR_PART_ORDER) {
    normalized[part] = clampIndex(
      candidate[part],
      NOTION_AVATAR_PARTS[part].max,
      DEFAULT_NOTION_AVATAR_RECIPE[part],
    )
  }

  return normalized
}

export function randomNotionAvatarRecipe(
  random = Math.random,
): NotionAvatarRecipe {
  const recipe = {} as NotionAvatarRecipe
  for (const part of NOTION_AVATAR_PART_ORDER) {
    recipe[part] = Math.floor(
      random() * (NOTION_AVATAR_PARTS[part].max + 1),
    )
  }
  return recipe
}

export function updateNotionAvatarPart(
  recipe: NotionAvatarRecipe,
  part: NotionAvatarPart,
  value: number,
): NotionAvatarRecipe {
  return {
    ...recipe,
    [part]: clampIndex(value, NOTION_AVATAR_PARTS[part].max, recipe[part]),
  }
}
