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
  surfaceAlt: string
  text: string
  muted: string
  line: string
}

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 1920
const HORIZONTAL_PADDING = 72
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_PADDING * 2

function readCssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function getCanvasPalette(): CanvasPalette {
  const root = document.documentElement
  const colorful = root.dataset.style === "colorful"
  const dark = root.classList.contains("dark")

  return {
    primary: colorful ? readCssColor("--colorful-primary", "#5b5ce2") : dark ? "#f5f5f5" : "#171717",
    secondary: colorful ? readCssColor("--colorful-secondary", "#7c4dff") : dark ? "#d4d4d8" : "#525252",
    accent: colorful ? readCssColor("--colorful-accent", "#e94b9b") : dark ? "#a3a3a3" : "#8a8a8a",
    background: dark ? "#0b0b0d" : "#f5f5f7",
    surface: dark ? "#18181b" : "#ffffff",
    surfaceAlt: dark ? "#111114" : "#fafafa",
    text: dark ? "#fafafa" : "#171717",
    muted: dark ? "#b3b3b8" : "#666666",
    line: dark ? "rgba(255,255,255,0.12)" : "rgba(23,23,23,0.08)",
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

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) {
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  roundedRect(context, x, y, width, height, radius)
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.stroke()
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

function drawSectionLabel({
  context,
  palette,
  text,
  x,
  y,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  text: string
  x: number
  y: number
}) {
  context.fillStyle = palette.muted
  context.font = "800 24px Arial, sans-serif"
  context.fillText(text.toUpperCase(), x, y)
}

function drawStatPill({
  context,
  palette,
  text,
  x,
  y,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  text: string
  x: number
  y: number
}) {
  context.font = "800 24px Arial, sans-serif"
  const width = context.measureText(text).width + 34
  fillRoundedRect(context, x, y, width, 44, 18, palette.surfaceAlt)
  strokeRoundedRect(context, x, y, width, 44, 18, palette.line, 1)
  context.fillStyle = palette.text
  context.fillText(text, x + 17, y + 29)
}

function drawPodiumRow({
  context,
  palette,
  x,
  y,
  width,
  row,
  featured,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  row: { position: number; name: string; points: number }
  featured: boolean
}) {
  fillRoundedRect(context, x, y, width, 108, 28, palette.surface)
  strokeRoundedRect(context, x, y, width, 108, 28, featured ? `${palette.primary}33` : palette.line, featured ? 2 : 1)

  const badgeGradient = context.createLinearGradient(x, y, x + 150, y + 108)
  badgeGradient.addColorStop(0, palette.primary)
  badgeGradient.addColorStop(1, featured ? palette.secondary : palette.accent)
  fillRoundedRect(context, x + 24, y + 20, 96, 68, 22, badgeGradient)
  context.fillStyle = "#ffffff"
  context.font = "900 34px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText(`${row.position}º`, x + 72, y + 63)
  context.textAlign = "left"

  context.fillStyle = palette.text
  context.font = "900 32px Arial, sans-serif"
  drawWrappedText({
    context,
    text: row.name,
    x: x + 146,
    y: y + 50,
    maxWidth: width - 330,
    lineHeight: 34,
    maxLines: 2,
  })

  const pointsText = `${row.points} pts`
  context.font = "900 28px Arial, sans-serif"
  const pillWidth = Math.max(150, context.measureText(pointsText).width + 44)
  fillRoundedRect(context, x + width - pillWidth - 24, y + 28, pillWidth, 52, 20, palette.surfaceAlt)
  context.fillStyle = palette.text
  context.textAlign = "center"
  context.fillText(pointsText, x + width - pillWidth / 2 - 24, y + 62)
  context.textAlign = "left"
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
  const cardHeight = 250
  fillRoundedRect(context, x, y, width, cardHeight, 30, palette.surface)
  strokeRoundedRect(context, x, y, width, cardHeight, 30, palette.line, 1)

  fillRoundedRect(context, x + 24, y + 24, width - 48, 44, 18, palette.surfaceAlt)
  context.fillStyle = palette.muted
  context.font = "800 21px Arial, sans-serif"
  context.fillText(highlight.label.toUpperCase(), x + 42, y + 54)

  context.fillStyle = palette.text
  context.font = "900 33px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.headline,
    x: x + 28,
    y: y + 108,
    maxWidth: width - 56,
    lineHeight: 38,
    maxLines: 3,
  })

  context.fillStyle = palette.muted
  context.font = "700 22px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.detail,
    x: x + 28,
    y: y + 192,
    maxWidth: width - 56,
    lineHeight: 27,
    maxLines: 3,
  })
}

export async function createSeasonSummaryImage(data: SeasonSummaryImageData) {
  const canvas = document.createElement("canvas")
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No se pudo preparar la imagen")

  const palette = getCanvasPalette()
  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  gradient.addColorStop(0, palette.background)
  gradient.addColorStop(0.52, `${palette.primary}20`)
  gradient.addColorStop(1, `${palette.accent}18`)
  context.fillStyle = gradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = palette.primary
  context.fillRect(0, 0, canvas.width, 18)

  context.fillStyle = palette.muted
  context.font = "800 26px Arial, sans-serif"
  context.fillText(data.leagueName.toUpperCase(), HORIZONTAL_PADDING, 92)

  context.fillStyle = palette.text
  context.font = "900 62px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.seasonName,
    x: HORIZONTAL_PADDING,
    y: 164,
    maxWidth: CONTENT_WIDTH,
    lineHeight: 70,
    maxLines: 2,
  })

  context.fillStyle = palette.muted
  context.font = "800 26px Arial, sans-serif"
  context.fillText("RESUMEN FINAL DE TEMPORADA", HORIZONTAL_PADDING, 258)

  const heroY = 312
  const heroHeight = 336
  fillRoundedRect(context, HORIZONTAL_PADDING, heroY, CONTENT_WIDTH, heroHeight, 42, palette.surface)
  const heroGradient = context.createLinearGradient(HORIZONTAL_PADDING, heroY, HORIZONTAL_PADDING + CONTENT_WIDTH, heroY + heroHeight)
  heroGradient.addColorStop(0, `${palette.primary}ef`)
  heroGradient.addColorStop(1, `${palette.secondary}f0`)
  fillRoundedRect(context, HORIZONTAL_PADDING, heroY, CONTENT_WIDTH, heroHeight, 42, heroGradient)

  context.fillStyle = "rgba(255,255,255,0.78)"
  context.font = "800 24px Arial, sans-serif"
  context.fillText(data.champion.includes(" / ") ? "CAMPEONES" : "CAMPEÓN", HORIZONTAL_PADDING + 42, heroY + 56)
  context.font = "800 24px Arial, sans-serif"
  context.fillText("MVP", HORIZONTAL_PADDING + 610, heroY + 56)

  context.fillStyle = "#ffffff"
  context.font = "900 56px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.champion,
    x: HORIZONTAL_PADDING + 42,
    y: heroY + 126,
    maxWidth: 500,
    lineHeight: 62,
    maxLines: 3,
  })

  context.font = "900 38px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.mvp,
    x: HORIZONTAL_PADDING + 610,
    y: heroY + 126,
    maxWidth: 260,
    lineHeight: 44,
    maxLines: 3,
  })

  drawStatPill({
    context,
    palette: { ...palette, text: "#ffffff", surfaceAlt: "rgba(255,255,255,0.14)", line: "rgba(255,255,255,0.18)" },
    text: `${Math.min(data.podium.length, 3)} puestos destacados`,
    x: HORIZONTAL_PADDING + 42,
    y: heroY + 258,
  })
  drawStatPill({
    context,
    palette: { ...palette, text: "#ffffff", surfaceAlt: "rgba(255,255,255,0.14)", line: "rgba(255,255,255,0.18)" },
    text: `${Math.min(data.highlights.length, 4)} momentos clave`,
    x: HORIZONTAL_PADDING + 354,
    y: heroY + 258,
  })

  const podiumY = 740
  drawSectionLabel({ context, palette, text: "Podio final", x: HORIZONTAL_PADDING, y: podiumY })
  data.podium.slice(0, 3).forEach((row, index) => {
    drawPodiumRow({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: podiumY + 34 + index * 126,
      width: CONTENT_WIDTH,
      row,
      featured: index === 0,
    })
  })

  const highlightsY = 1172
  drawSectionLabel({ context, palette, text: "Lo más destacado", x: HORIZONTAL_PADDING, y: highlightsY })
  data.highlights.slice(0, 4).forEach((highlight, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawMetricCard({
      context,
      palette,
      x: HORIZONTAL_PADDING + column * 468,
      y: highlightsY + 34 + row * 274,
      width: 448,
      highlight,
    })
  })

  context.fillStyle = palette.muted
  context.font = "700 22px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText("Smash & Lob", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 42)
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
