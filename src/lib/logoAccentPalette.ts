type Hsl = { h: number; s: number; l: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function rgbToHsl(red: number, green: number, blue: number): Hsl {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2
  if (delta === 0) return { h: 0, s: 0, l: lightness }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  const hue = max === r
    ? 60 * (((g - b) / delta) % 6)
    : max === g
      ? 60 * ((b - r) / delta + 2)
      : 60 * ((r - g) / delta + 4)
  return { h: (hue + 360) % 360, s: saturation, l: lightness }
}

function hslToHex({ h, s, l }: Hsl) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const segment = h / 60
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1))
  const [r1, g1, b1] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary]
  const offset = l - chroma / 2
  return `#${[r1, g1, b1].map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

function hueDistance(first: number, second: number) {
  const distance = Math.abs(first - second)
  return Math.min(distance, 360 - distance)
}

function usableAccent(hsl: Hsl): Hsl {
  return {
    h: hsl.h,
    s: clamp(hsl.s, 0.52, 0.9),
    l: clamp(hsl.l, 0.38, 0.64),
  }
}

export function buildLogoAccentPalette(pixels: Uint8ClampedArray) {
  const bins = new Map<number, { red: number; green: number; blue: number; weight: number; score: number }>()
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255
    if (alpha < 0.55) continue
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    const hsl = rgbToHsl(red, green, blue)
    if (hsl.s < 0.16 || hsl.l < 0.07 || hsl.l > 0.93) continue

    const key = (red >> 5) * 64 + (green >> 5) * 8 + (blue >> 5)
    const weight = alpha * (0.55 + hsl.s * 0.75)
    const current = bins.get(key) ?? { red: 0, green: 0, blue: 0, weight: 0, score: 0 }
    current.red += red * weight
    current.green += green * weight
    current.blue += blue * weight
    current.weight += weight
    current.score += weight * (1 - Math.abs(hsl.l - 0.52) * 0.35)
    bins.set(key, current)
  }

  const selected: Hsl[] = []
  const ranked = [...bins.values()].sort((first, second) => second.score - first.score)
  for (const color of ranked) {
    const hsl = usableAccent(rgbToHsl(color.red / color.weight, color.green / color.weight, color.blue / color.weight))
    if (selected.some((item) => hueDistance(item.h, hsl.h) < 22 && Math.abs(item.l - hsl.l) < 0.14)) continue
    selected.push(hsl)
    if (selected.length === 3) break
  }
  if (selected.length === 0) return []

  const base = selected[0]
  for (const shift of [-30, 30, 180]) {
    if (selected.length === 4) break
    const candidate = { h: (base.h + shift + 360) % 360, s: base.s, l: base.l }
    if (!selected.some((item) => hueDistance(item.h, candidate.h) < 18)) selected.push(candidate)
  }
  return selected.slice(0, 4).map(hslToHex)
}

function loadLogoImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (!/^(data:|blob:)/i.test(source)) image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("logo_load_failed"))
    image.src = source
  })
}

export async function extractLogoAccentPalette(source: string) {
  const image = await loadLogoImage(source)
  const canvas = document.createElement("canvas")
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return []
  const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
  return buildLogoAccentPalette(context.getImageData(0, 0, canvas.width, canvas.height).data)
}
