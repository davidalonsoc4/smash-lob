export const BIG_SMILE_HAIRS = [
  { id: "bangs", label: "Flequillo" },
  { id: "bowlCutHair", label: "Corte tazón" },
  { id: "braids", label: "Trenzas" },
  { id: "bunHair", label: "Moño" },
  { id: "curlyBob", label: "Bob rizado" },
  { id: "curlyShortHair", label: "Corto rizado" },
  { id: "froBun", label: "Moño afro" },
  { id: "halfShavedHead", label: "Rapado lateral" },
  { id: "mohawk", label: "Mohicano" },
  { id: "shavedHead", label: "Rapado" },
  { id: "shortHair", label: "Corto" },
  { id: "straightHair", label: "Liso" },
  { id: "wavyBob", label: "Bob ondulado" },
] as const

export const BIG_SMILE_EYES = [
  { id: "angry", label: "Enfadados" },
  { id: "cheery", label: "Alegres" },
  { id: "confused", label: "Confundidos" },
  { id: "normal", label: "Normales" },
  { id: "sad", label: "Tristes" },
  { id: "sleepy", label: "Dormidos" },
  { id: "starstruck", label: "Estrellas" },
  { id: "winking", label: "Guiño" },
] as const

export const BIG_SMILE_MOUTHS = [
  { id: "awkwardSmile", label: "Sonrisa tímida" },
  { id: "braces", label: "Brackets" },
  { id: "gapSmile", label: "Sonrisa separada" },
  { id: "kawaii", label: "Kawaii" },
  { id: "openSad", label: "Triste abierta" },
  { id: "openedSmile", label: "Sonrisa abierta" },
  { id: "teethSmile", label: "Dientes" },
  { id: "unimpressed", label: "Indiferente" },
] as const

export const BIG_SMILE_ACCESSORIES = [
  { id: "none", label: "Sin accesorio" },
  { id: "catEars", label: "Orejas de gato" },
  { id: "clownNose", label: "Nariz de payaso" },
  { id: "faceMask", label: "Mascarilla" },
  { id: "glasses", label: "Gafas" },
  { id: "mustache", label: "Bigote" },
  { id: "sailormoonCrown", label: "Corona" },
  { id: "sleepMask", label: "Antifaz" },
  { id: "sunglasses", label: "Gafas de sol" },
] as const

export const BIG_SMILE_HAIR_COLORS = [
  "220f00",
  "3a1a00",
  "71472d",
  "9a5b35",
  "e2ba87",
  "111827",
  "605de4",
  "238d80",
  "d56c0c",
  "e9b729",
  "be123c",
  "f8fafc",
] as const

export const BIG_SMILE_SKIN_COLORS = [
  "ffe4c0",
  "f5d7b1",
  "efcc9f",
  "e2ba87",
  "c99c62",
  "a47539",
  "8c5a2b",
  "643d19",
] as const

export const BIG_SMILE_BACKGROUNDS = [
  "f5f0e8",
  "ffffff",
  "dbeafe",
  "dcfce7",
  "fee2e2",
  "ede9fe",
  "fef3c7",
  "cffafe",
  "111827",
  "000000",
] as const

export const BIG_SMILE_FLIPS = [
  { id: "none", label: "Normal" },
  { id: "horizontal", label: "Espejo horizontal" },
  { id: "vertical", label: "Espejo vertical" },
  { id: "both", label: "Espejo doble" },
] as const

export const BIG_SMILE_BACKGROUND_FILLS = [
  { id: "solid", label: "Plano" },
  { id: "linear", label: "Degradado lineal" },
  { id: "radial", label: "Degradado radial" },
] as const

export type BigSmileHair = (typeof BIG_SMILE_HAIRS)[number]["id"]
export type BigSmileEyes = (typeof BIG_SMILE_EYES)[number]["id"]
export type BigSmileMouth = (typeof BIG_SMILE_MOUTHS)[number]["id"]
export type BigSmileAccessory = (typeof BIG_SMILE_ACCESSORIES)[number]["id"]
export type BigSmileFlip = (typeof BIG_SMILE_FLIPS)[number]["id"]
export type BigSmileBackgroundFill = (typeof BIG_SMILE_BACKGROUND_FILLS)[number]["id"]
