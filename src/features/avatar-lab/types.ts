export const AVATAR_RECIPE_SCHEMA_VERSION = 1 as const
export const AVATAR_LAB_VERSION = "Avatar Lab DEMO 0.1" as const

export type AvatarWorld = "pixel_chibi" | "chibi_illustrated"
export type AvatarWorldPreference = AvatarWorld
export type AvatarHandedness = "right" | "left"
export type AvatarRelativeSide = "dominant" | "non_dominant"

export type AvatarRecipe = {
  schemaVersion: typeof AVATAR_RECIPE_SCHEMA_VERSION
  handedness: AvatarHandedness
  skinTone: "light_warm" | "medium_warm"
  head: { shape: "round_01" }
  hair: {
    style: "none" | "messy_short_01" | "short_up_01"
    color: "dark_brown" | "black"
  }
  beard: {
    style: "none" | "short_full_01" | "goatee_01"
    color: "dark_brown" | "black"
  }
  eyes: { style: "vertical_01"; color: "dark_brown" | "blue" }
  eyebrows: {
    style: "thick_straight_01" | "angled_01"
    color: "dark_brown" | "black"
  }
  cap: { style: "none" | "backwards_01"; color: "white" | "black" }
  headband: { style: "none" | "basic_01"; color: "white" | "red" }
  shirt: {
    model: "technical_basic_01"
    primaryColor: "light_blue" | "green"
    secondaryColor: "light_blue_shadow" | "green_shadow" | "white" | "black"
  }
  shorts: {
    model: "basic_01"
    primaryColor: "black" | "navy"
    secondaryColor: "charcoal" | "black"
  }
  compressionSleeve: {
    enabled: boolean
    side: AvatarRelativeSide
    color: "black" | "white"
  }
  wristband: {
    enabled: boolean
    side: AvatarRelativeSide
    color: "white" | "black"
  }
  socks: { length: "high" | "short"; primaryColor: "white" | "black" }
  shoes: {
    model: "court_01"
    primaryColor: "white" | "light_blue"
    secondaryColor: "black" | "white"
  }
  racket: {
    model: "round_b_01" | "diamond_stripe_01"
    primaryColor: "white" | "black"
    secondaryColor: "black" | "light_blue"
  }
}

export type AvatarCategory =
  | "identity"
  | "head"
  | "outfit"
  | "arms"
  | "feet"
  | "racket"


export type AvatarRendererId = "pixel-chibi-v1" | "chibi-illustrated-v1"

export type AvatarWorldVariant = {
  rendererPrimitive: string
} | null

export type AvatarAssetManifestEntry = {
  id: string
  category: string
  supportsColor: boolean
  rendererPrimitive: string
  worldVariants: Record<AvatarWorld, AvatarWorldVariant>
  compatibility?: { excludes: string[] }
}

export type AvatarAssetManifest = {
  manifestVersion: number
  recipeSchemaVersion: number
  demoVersion: string
  worlds: Array<{
    id: AvatarWorld
    available: boolean
    rendererId: AvatarRendererId | null
  }>
  masterTemplate: {
    world: "pixel_chibi"
    viewBox: [number, number, number, number]
    gridUnit: number
    recommendedPixelStep: number
    centerAxisX: number
    groundLineY: number
    characterTopY: number
    characterBottomY: number
    headBounds: [number, number, number, number]
    torsoBounds: [number, number, number, number]
    dominantRacketBoundsRightHanded: [number, number, number, number]
    safeMargin: number
    lightingDirection: "top_left"
  }
  assets: AvatarAssetManifestEntry[]
}

export type AvatarRendererContract = {
  id: AvatarRendererId
  world: AvatarWorld
  supportsTransparentBackground: boolean
}

export type AvatarWorldDefinition = {
  id: AvatarWorld
  label: string
  description: string
  available: boolean
  rendererId: AvatarRendererId | null
}

export type AvatarRendererProps = {
  recipe: AvatarRecipe
  world: AvatarWorld
  className?: string
  title?: string
  transparent?: boolean
  showReferenceGrid?: boolean
}

export type AvatarRecipeValidationIssue = {
  path: string
  code: string
  message: string
}
