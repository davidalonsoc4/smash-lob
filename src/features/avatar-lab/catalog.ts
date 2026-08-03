import type { AvatarCategory, AvatarWorldDefinition } from "./types"

export const AVATAR_WORLDS: AvatarWorldDefinition[] = [
  {
    id: "pixel_chibi",
    label: "Pixel Chibi",
    description: "Avatar deportivo pixelado, modular y nítido.",
    available: true,
    rendererId: "pixel-chibi-v1",
  },
  {
    id: "chibi_illustrated",
    label: "Chibi ilustrado",
    description: "Segundo mundo visual previsto para una fase posterior.",
    available: false,
    rendererId: null,
  },
]

export const AVATAR_CATEGORIES: Array<{
  id: AvatarCategory
  label: string
  shortLabel: string
}> = [
  { id: "identity", label: "Identidad", shortLabel: "Identidad" },
  { id: "head", label: "Cabeza", shortLabel: "Cabeza" },
  { id: "outfit", label: "Ropa", shortLabel: "Ropa" },
  { id: "arms", label: "Brazos", shortLabel: "Brazos" },
  { id: "feet", label: "Piernas y pies", shortLabel: "Pies" },
  { id: "racket", label: "Pala", shortLabel: "Pala" },
]

export const HAIR_OPTIONS = [
  { value: "none", label: "Sin pelo" },
  { value: "messy_short_01", label: "Corto despeinado" },
  { value: "short_up_01", label: "Corto hacia arriba" },
] as const

export const BEARD_OPTIONS = [
  { value: "none", label: "Sin barba" },
  { value: "short_full_01", label: "Barba completa corta" },
  { value: "goatee_01", label: "Perilla" },
] as const

export const COLOR_SWATCHES = {
  skinTone: [
    { value: "light_warm", label: "Claro cálido", color: "#f0b27a" },
    { value: "medium_warm", label: "Medio cálido", color: "#d9824b" },
  ],
  hair: [
    { value: "dark_brown", label: "Castaño oscuro", color: "#3a2418" },
    { value: "black", label: "Negro", color: "#171717" },
  ],
  eyes: [
    { value: "dark_brown", label: "Marrón oscuro", color: "#2c1b14" },
    { value: "blue", label: "Azul", color: "#315f87" },
  ],
  cap: [
    { value: "white", label: "Blanca", color: "#f7f4ea" },
    { value: "black", label: "Negra", color: "#1a1a1a" },
  ],
  headband: [
    { value: "white", label: "Blanca", color: "#f7f4ea" },
    { value: "red", label: "Roja", color: "#b8493f" },
  ],
  shirt: [
    { value: "light_blue", label: "Azul claro", color: "#4fa5d8" },
    { value: "green", label: "Verde", color: "#4b9b76" },
  ],
  shirtSecondary: [
    { value: "light_blue_shadow", label: "Azul sombra", color: "#3f82b2" },
    { value: "green_shadow", label: "Verde sombra", color: "#367a5a" },
    { value: "white", label: "Blanco", color: "#f7f4ea" },
    { value: "black", label: "Negro", color: "#191b1d" },
  ],
  shorts: [
    { value: "black", label: "Negro", color: "#191b1d" },
    { value: "navy", label: "Azul marino", color: "#1e314a" },
  ],
  binary: [
    { value: "black", label: "Negro", color: "#191b1d" },
    { value: "white", label: "Blanco", color: "#f7f4ea" },
  ],
  shoes: [
    { value: "white", label: "Blancas", color: "#f7f4ea" },
    { value: "light_blue", label: "Azul claro", color: "#4fa5d8" },
  ],
} as const
