import {
  AVATAR_RECIPE_SCHEMA_VERSION,
  type AvatarRecipe,
  type AvatarRecipeValidationIssue,
} from "./types"

export const DEFAULT_AVATAR_RECIPE: AvatarRecipe = {
  schemaVersion: AVATAR_RECIPE_SCHEMA_VERSION,
  handedness: "right",
  skinTone: "medium_warm",
  head: { shape: "round_01" },
  hair: { style: "messy_short_01", color: "dark_brown" },
  beard: { style: "short_full_01", color: "dark_brown" },
  eyes: { style: "vertical_01", color: "dark_brown" },
  eyebrows: { style: "thick_straight_01", color: "dark_brown" },
  cap: { style: "backwards_01", color: "white" },
  headband: { style: "none", color: "white" },
  shirt: {
    model: "technical_basic_01",
    primaryColor: "light_blue",
    secondaryColor: "light_blue_shadow",
  },
  shorts: {
    model: "basic_01",
    primaryColor: "black",
    secondaryColor: "charcoal",
  },
  compressionSleeve: { enabled: true, side: "dominant", color: "black" },
  wristband: { enabled: true, side: "non_dominant", color: "white" },
  socks: { length: "high", primaryColor: "white" },
  shoes: { model: "court_01", primaryColor: "white", secondaryColor: "black" },
  racket: {
    model: "round_b_01",
    primaryColor: "white",
    secondaryColor: "black",
  },
}

export function cloneAvatarRecipe(recipe: AvatarRecipe): AvatarRecipe {
  return structuredClone(recipe)
}

export function normalizeAvatarRecipe(recipe: AvatarRecipe): AvatarRecipe {
  const next = cloneAvatarRecipe(recipe)

  if (next.cap.style !== "none") next.headband.style = "none"
  if (next.headband.style !== "none") next.cap.style = "none"
  if (next.cap.style !== "none" && next.hair.style === "short_up_01") {
    next.hair.style = "messy_short_01"
  }
  next.compressionSleeve.side ??= "dominant"
  next.wristband.side ??= "non_dominant"

  return next
}

export function validateAvatarRecipe(
  recipe: AvatarRecipe,
): AvatarRecipeValidationIssue[] {
  const issues: AvatarRecipeValidationIssue[] = []

  if (recipe.schemaVersion !== AVATAR_RECIPE_SCHEMA_VERSION) {
    issues.push({
      path: "schemaVersion",
      code: "unsupported_schema",
      message: `Se esperaba schemaVersion ${AVATAR_RECIPE_SCHEMA_VERSION}.`,
    })
  }
  if (recipe.cap.style !== "none" && recipe.headband.style !== "none") {
    issues.push({
      path: "cap/headband",
      code: "mutually_exclusive",
      message: "La gorra y la cinta no pueden estar activas a la vez.",
    })
  }
  if (recipe.cap.style !== "none" && recipe.hair.style === "short_up_01") {
    issues.push({
      path: "hair.style",
      code: "cap_incompatible_hair",
      message: "El peinado hacia arriba no es compatible con la gorra de la DEMO.",
    })
  }

  return issues
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T)
}

export function isAvatarRecipe(value: unknown): value is AvatarRecipe {
  if (!isRecord(value)) return false

  const allowedKeys = new Set([
    "schemaVersion",
    "handedness",
    "skinTone",
    "head",
    "hair",
    "beard",
    "eyes",
    "eyebrows",
    "cap",
    "headband",
    "shirt",
    "shorts",
    "compressionSleeve",
    "wristband",
    "socks",
    "shoes",
    "racket",
  ])
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false

  const head = value.head
  const hair = value.hair
  const beard = value.beard
  const eyes = value.eyes
  const eyebrows = value.eyebrows
  const cap = value.cap
  const headband = value.headband
  const shirt = value.shirt
  const shorts = value.shorts
  const compressionSleeve = value.compressionSleeve
  const wristband = value.wristband
  const socks = value.socks
  const shoes = value.shoes
  const racket = value.racket

  if (
    !isRecord(head) ||
    !isRecord(hair) ||
    !isRecord(beard) ||
    !isRecord(eyes) ||
    !isRecord(eyebrows) ||
    !isRecord(cap) ||
    !isRecord(headband) ||
    !isRecord(shirt) ||
    !isRecord(shorts) ||
    !isRecord(compressionSleeve) ||
    !isRecord(wristband) ||
    !isRecord(socks) ||
    !isRecord(shoes) ||
    !isRecord(racket)
  ) {
    return false
  }

  return (
    value.schemaVersion === AVATAR_RECIPE_SCHEMA_VERSION &&
    isOneOf(value.handedness, ["right", "left"] as const) &&
    isOneOf(value.skinTone, ["light_warm", "medium_warm"] as const) &&
    head.shape === "round_01" &&
    isOneOf(hair.style, ["none", "messy_short_01", "short_up_01"] as const) &&
    isOneOf(hair.color, ["dark_brown", "black"] as const) &&
    isOneOf(beard.style, ["none", "short_full_01", "goatee_01"] as const) &&
    isOneOf(beard.color, ["dark_brown", "black"] as const) &&
    eyes.style === "vertical_01" &&
    isOneOf(eyes.color, ["dark_brown", "blue"] as const) &&
    isOneOf(eyebrows.style, ["thick_straight_01", "angled_01"] as const) &&
    isOneOf(eyebrows.color, ["dark_brown", "black"] as const) &&
    isOneOf(cap.style, ["none", "backwards_01"] as const) &&
    isOneOf(cap.color, ["white", "black"] as const) &&
    isOneOf(headband.style, ["none", "basic_01"] as const) &&
    isOneOf(headband.color, ["white", "red"] as const) &&
    shirt.model === "technical_basic_01" &&
    isOneOf(shirt.primaryColor, ["light_blue", "green"] as const) &&
    isOneOf(shirt.secondaryColor, ["light_blue_shadow", "green_shadow", "white", "black"] as const) &&
    shorts.model === "basic_01" &&
    isOneOf(shorts.primaryColor, ["black", "navy"] as const) &&
    isOneOf(shorts.secondaryColor, ["charcoal", "black"] as const) &&
    typeof compressionSleeve.enabled === "boolean" &&
    isOneOf(compressionSleeve.side, ["dominant", "non_dominant"] as const) &&
    isOneOf(compressionSleeve.color, ["black", "white"] as const) &&
    typeof wristband.enabled === "boolean" &&
    isOneOf(wristband.side, ["dominant", "non_dominant"] as const) &&
    isOneOf(wristband.color, ["white", "black"] as const) &&
    isOneOf(socks.length, ["high", "short"] as const) &&
    isOneOf(socks.primaryColor, ["white", "black"] as const) &&
    shoes.model === "court_01" &&
    isOneOf(shoes.primaryColor, ["white", "light_blue"] as const) &&
    isOneOf(shoes.secondaryColor, ["black", "white"] as const) &&
    isOneOf(racket.model, ["round_b_01", "diamond_stripe_01"] as const) &&
    isOneOf(racket.primaryColor, ["white", "black"] as const) &&
    isOneOf(racket.secondaryColor, ["black", "light_blue"] as const)
  )
}
