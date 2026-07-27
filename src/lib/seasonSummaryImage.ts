export type SeasonSummaryHighlight = {
  label: string
  headline: string
  detail: string
}

export type SeasonSummaryImageData = {
  leagueName: string
  seasonName: string
  champion: string
  mvp: string
  podium: { position: number; name: string; points: number }[]
  highlights: SeasonSummaryHighlight[]
}

type CanvasPalette = {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
}

function readCssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function getCanvasPalette(): CanvasPalette {
  const root = document.documentElement
  const colorful = root.dataset.style === "colorful"
  const dark = root.classList.contains("dark")

  return {
    primary: colorful ? readCssColor("--colorful-primary", "#5b5ce2") : dark ? "#fafafa" : "#171717",
    secondary: colorful ? readCssColor("--colorful-secondary", "#7c4dff") : dark ? "#a3a3a3" : "#525252",
    accent: colorful ? readCssColor("--colorful-accent", "#e94b9b") : dark ? "#737373" : "#a3a3a3",
    background: dark ? "#0b0b0d" : "#f5f5f7",
    surface: dark ? "#18181b" : "#ffffff",
    text: dark ? "#fafafa" : "#171717",
    muted: dark ? "#a3a3a3" : "#666666",
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function drawWrappedText({
  context,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines = 2,
}: {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
  maxWidth: number
  lineHeight: number
  maxLines?: number
}) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || current.length === 0) {
      current = candidate
      return
    }
    lines.push(current)
    current = word
  })
  if (current) lines.push(current)

  const visible = lines.slice(0, maxLines)
  if (lines.length > maxLines && visible.length > 0) {
    let last = visible[visible.length - 1]
    while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1)
    }
    visible[visible.length - 1] = `${last}…`
  }

  visible.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
}

function drawMetricCard({
  context,
  palette,
  x,
  y,
  width,
  highlight,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  highlight: SeasonSummaryHighlight
}) {
  roundedRect(context, x, y, width, 172, 28)
  context.fillStyle = palette.surface
  context.fill()
  context.strokeStyle = `${palette.primary}55`
  context.lineWidth = 2
  context.stroke()

  context.fillStyle = palette.muted
  context.font = "800 22px Arial, sans-serif"
  context.fillText(highlight.label.toUpperCase(), x + 26, y + 36)

  context.fillStyle = palette.text
  context.font = "900 29px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.headline,
    x: x + 26,
    y: y + 76,
    maxWidth: width - 52,
    lineHeight: 32,
    maxLines: 2,
  })

  context.fillStyle = palette.muted
  context.font = "700 19px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.detail,
    x: x + 26,
    y: y + 137,
    maxWidth: width - 52,
    lineHeight: 21,
    maxLines: 2,
  })
}

export async function createSeasonSummaryImage(data: SeasonSummaryImageData) {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No se pudo preparar la imagen")

  const palette = getCanvasPalette()
  const gradient = context.createLinearGradient(0, 0, 1080, 1350)
  gradient.addColorStop(0, palette.background)
  gradient.addColorStop(0.48, `${palette.primary}22`)
  gradient.addColorStop(1, `${palette.accent}24`)
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = palette.primary
  context.fillRect(0, 0, canvas.width, 18)

  context.fillStyle = palette.muted
  context.font = "800 27px Arial, sans-serif"
  context.fillText(data.leagueName.toUpperCase(), 72, 88)
  context.fillStyle = palette.text
  context.font = "900 58px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.seasonName,
    x: 72,
    y: 158,
    maxWidth: 936,
    lineHeight: 66,
    maxLines: 2,
  })
  context.fillStyle = palette.muted
  context.font = "700 27px Arial, sans-serif"
  context.fillText("RESUMEN FINAL DE TEMPORADA", 72, 250)

  roundedRect(context, 72, 300, 936, 235, 36)
  const heroGradient = context.createLinearGradient(72, 300, 1008, 535)
  heroGradient.addColorStop(0, palette.primary)
  heroGradient.addColorStop(1, palette.secondary)
  context.fillStyle = heroGradient
  context.fill()
  context.fillStyle = "#ffffff"
  context.font = "800 27px Arial, sans-serif"
  context.fillText(data.champion.includes(" / ") ? "CAMPEONES" : "CAMPEÓN", 112, 358)
  context.font = "900 52px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.champion,
    x: 112,
    y: 424,
    maxWidth: 520,
    lineHeight: 56,
    maxLines: 2,
  })
  context.font = "800 25px Arial, sans-serif"
  context.fillText("MVP", 704, 358)
  context.font = "900 34px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.mvp,
    x: 704,
    y: 410,
    maxWidth: 250,
    lineHeight: 40,
    maxLines: 2,
  })

  context.fillStyle = palette.text
  context.font = "900 30px Arial, sans-serif"
  context.fillText("PODIO", 72, 600)
  data.podium.slice(0, 3).forEach((row, index) => {
    const y = 630 + index * 94
    roundedRect(context, 72, y, 936, 74, 22)
    context.fillStyle = palette.surface
    context.fill()
    context.fillStyle = index === 0 ? palette.primary : palette.muted
    context.font = "900 30px Arial, sans-serif"
    context.fillText(`${row.position}º`, 104, y + 48)
    context.fillStyle = palette.text
    context.font = "900 29px Arial, sans-serif"
    context.fillText(row.name, 175, y + 48)
    context.textAlign = "right"
    context.fillText(`${row.points} pts`, 968, y + 48)
    context.textAlign = "left"
  })

  data.highlights.slice(0, 4).forEach((highlight, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawMetricCard({
      context,
      palette,
      x: 72 + column * 478,
      y: 920 + row * 180,
      width: 458,
      highlight,
    })
  })

  context.fillStyle = palette.muted
  context.font = "700 22px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText("Smash & Lob", 540, 1312)
  context.textAlign = "left"

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/png",
    )
  })
}

export function downloadSeasonSummaryImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
