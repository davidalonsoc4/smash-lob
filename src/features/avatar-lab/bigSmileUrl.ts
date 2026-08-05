import {
  BIG_SMILE_ACCESSORIES,
  BIG_SMILE_BACKGROUND_FILLS,
  BIG_SMILE_EYES,
  BIG_SMILE_FLIPS,
  BIG_SMILE_HAIRS,
  BIG_SMILE_MOUTHS,
} from "./bigSmileOptions"

const HAIRS = new Set<string>(BIG_SMILE_HAIRS.map((item) => item.id))
const EYES = new Set<string>(BIG_SMILE_EYES.map((item) => item.id))
const MOUTHS = new Set<string>(BIG_SMILE_MOUTHS.map((item) => item.id))
const ACCESSORIES = new Set<string>(BIG_SMILE_ACCESSORIES.map((item) => item.id))
const BACKGROUND_FILLS = new Set<string>(BIG_SMILE_BACKGROUND_FILLS.map((item) => item.id))
const FLIPS = new Set<string>(BIG_SMILE_FLIPS.map((item) => item.id))

function pick(value: string | null, allowed: Set<string>, fallback: string) {
  return value && allowed.has(value) ? value : fallback
}

function numberInRange(value: string | null, fallback: number, min: number, max: number) {
  const parsed = value === null ? Number.NaN : Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function integerInRange(value: string | null, fallback: number, min: number, max: number) {
  return Math.round(numberInRange(value, fallback, min, max))
}

function normalizeHex(value: string | null, fallback: string) {
  const normalized = (value ?? "").trim().replace(/^#/, "").toLowerCase()
  return /^(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(normalized)
    ? normalized
    : fallback
}

export function buildDiceBearBigSmileUrl(searchParams: URLSearchParams) {
  const seed = (searchParams.get("seed") ?? "Davo").trim().slice(0, 100) || "Davo"
  const hair = pick(searchParams.get("hair"), HAIRS, "shortHair")
  const eyes = pick(searchParams.get("eyes"), EYES, "cheery")
  const mouth = pick(searchParams.get("mouth"), MOUTHS, "teethSmile")
  const accessories = pick(searchParams.get("accessories"), ACCESSORIES, "none")
  const backgroundFill = pick(searchParams.get("backgroundFill"), BACKGROUND_FILLS, "solid")
  const flip = pick(searchParams.get("flip"), FLIPS, "none")

  const hairColor = normalizeHex(searchParams.get("hairColor"), "71472d")
  const hairColor2 = normalizeHex(searchParams.get("hairColor2"), "e9b729")
  const hairColor3 = normalizeHex(searchParams.get("hairColor3"), "605de4")
  const hairColorFill = pick(searchParams.get("hairColorFill"), BACKGROUND_FILLS, "solid")
  const hairColorStops = integerInRange(searchParams.get("hairColorStops"), 2, 2, 3)
  const hairColorAngle = numberInRange(searchParams.get("hairColorAngle"), 0, -360, 360)
  const skinColor = normalizeHex(searchParams.get("skinColor"), "efcc9f")
  const skinColor2 = normalizeHex(searchParams.get("skinColor2"), "e2ba87")
  const skinColor3 = normalizeHex(searchParams.get("skinColor3"), "c99c62")
  const skinColorFill = pick(searchParams.get("skinColorFill"), BACKGROUND_FILLS, "solid")
  const skinColorStops = integerInRange(searchParams.get("skinColorStops"), 2, 2, 3)
  const skinColorAngle = numberInRange(searchParams.get("skinColorAngle"), 0, -360, 360)
  const backgroundColor = normalizeHex(searchParams.get("backgroundColor"), "dbeafe")
  const backgroundColor2 = normalizeHex(searchParams.get("backgroundColor2"), "ede9fe")
  const backgroundColor3 = normalizeHex(searchParams.get("backgroundColor3"), "dcfce7")

  const hairProbability = integerInRange(searchParams.get("hairProbability"), 100, 0, 100)
  const eyesProbability = integerInRange(searchParams.get("eyesProbability"), 100, 0, 100)
  const mouthProbability = integerInRange(searchParams.get("mouthProbability"), 100, 0, 100)
  const accessoriesProbability = accessories === "none"
    ? 0
    : integerInRange(searchParams.get("accessoriesProbability"), 100, 0, 100)

  const backgroundStops = integerInRange(searchParams.get("backgroundStops"), 2, 2, 3)
  const backgroundAngle = numberInRange(searchParams.get("backgroundAngle"), 35, -360, 360)
  const rotate = numberInRange(searchParams.get("rotate"), 0, -360, 360)
  const scale = numberInRange(searchParams.get("scale"), 1, 0, 10)
  const translateX = numberInRange(searchParams.get("translateX"), 0, -1000, 1000)
  const translateY = numberInRange(searchParams.get("translateY"), 0, -1000, 1000)
  const borderRadius = numberInRange(searchParams.get("borderRadius"), 0, 0, 50)

  const upstream = new URL("https://api.dicebear.com/10.x/big-smile/svg")
  upstream.searchParams.set("seed", seed)
  upstream.searchParams.set("size", "512")
  upstream.searchParams.set("hairVariant", hair)
  upstream.searchParams.set("hairProbability", String(hairProbability))
  upstream.searchParams.set("eyesVariant", eyes)
  upstream.searchParams.set("eyesProbability", String(eyesProbability))
  upstream.searchParams.set("mouthVariant", mouth)
  upstream.searchParams.set("mouthProbability", String(mouthProbability))
  const hairColors = hairColorFill === "solid"
    ? [hairColor]
    : hairColorStops === 3
      ? [hairColor, hairColor2, hairColor3]
      : [hairColor, hairColor2]
  upstream.searchParams.set("hairColor", hairColors.join(","))
  upstream.searchParams.set("hairColorFill", hairColorFill)
  if (hairColorFill !== "solid") {
    upstream.searchParams.set("hairColorFillStops", String(hairColorStops))
    upstream.searchParams.set("hairColorAngle", String(hairColorAngle))
  }

  const skinColors = skinColorFill === "solid"
    ? [skinColor]
    : skinColorStops === 3
      ? [skinColor, skinColor2, skinColor3]
      : [skinColor, skinColor2]
  upstream.searchParams.set("skinColor", skinColors.join(","))
  upstream.searchParams.set("skinColorFill", skinColorFill)
  if (skinColorFill !== "solid") {
    upstream.searchParams.set("skinColorFillStops", String(skinColorStops))
    upstream.searchParams.set("skinColorAngle", String(skinColorAngle))
  }
  upstream.searchParams.set("accessoriesProbability", String(accessoriesProbability))
  if (accessories !== "none") upstream.searchParams.set("accessoriesVariant", accessories)

  const backgroundColors = backgroundFill === "solid"
    ? [backgroundColor]
    : backgroundStops === 3
      ? [backgroundColor, backgroundColor2, backgroundColor3]
      : [backgroundColor, backgroundColor2]
  upstream.searchParams.set("backgroundColor", backgroundColors.join(","))
  upstream.searchParams.set("backgroundColorFill", backgroundFill)
  if (backgroundFill !== "solid") {
    upstream.searchParams.set("backgroundColorFillStops", String(backgroundStops))
    upstream.searchParams.set("backgroundColorAngle", String(backgroundAngle))
  }

  upstream.searchParams.set("flip", flip)
  upstream.searchParams.set("rotate", String(rotate))
  upstream.searchParams.set("scale", String(scale))
  upstream.searchParams.set("translateX", String(translateX))
  upstream.searchParams.set("translateY", String(translateY))
  upstream.searchParams.set("borderRadius", String(borderRadius))
  return upstream
}
