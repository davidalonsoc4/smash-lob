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
const CANVAS_HEIGHT = 2400
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

function wrapTextLines({
  context,
  text,
  maxWidth,
  maxLines,
}: {
  context: CanvasRenderingContext2D
  text: string
  maxWidth: number
  maxLines: number
}) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }

  if (current) lines.push(current)

  if (lines.length <= maxLines) return lines

  const visible = lines.slice(0, maxLines)
  let last = visible[visible.length - 1] ?? ""
  while (last.length > 1 && context.measureText(`${last}…`).width > maxWidth) {
    last = last.slice(0, -1)
  }
  visible[visible.length - 1] = `${last}…`
  return visible
}

function drawLines({
  context,
  lines,
  x,
  y,
  lineHeight,
}: {
  context: CanvasRenderingContext2D
  lines: string[]
  x: number
  y: number
  lineHeight: number
}) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
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
  const lines = wrapTextLines({ context, text, maxWidth, maxLines })
  drawLines({ context, lines, x, y, lineHeight })
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

function drawHeroCard({
  context,
  palette,
  x,
  y,
  width,
  label,
  value,
  gradientStart,
  gradientEnd,
  big = false,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  label: string
  value: string
  gradientStart: string
  gradientEnd: string
  big?: boolean
}) {
  const height = big ? 220 : 180
  const gradient = context.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, gradientStart)
  gradient.addColorStop(1, gradientEnd)
  fillRoundedRect(context, x, y, width, height, 38, gradient)

  context.fillStyle = "rgba(255,255,255,0.8)"
  context.font = "800 24px Arial, sans-serif"
  context.fillText(label, x + 34, y + 50)

  context.fillStyle = "#ffffff"
  context.font = big ? "900 52px Arial, sans-serif" : "900 42px Arial, sans-serif"
  drawWrappedText({
    context,
    text: value,
    x: x + 34,
    y: y + 112,
    maxWidth: width - 68,
    lineHeight: big ? 56 : 46,
    maxLines: 3,
  })
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
  const height = 116
  fillRoundedRect(context, x, y, width, height, 28, palette.surface)
  strokeRoundedRect(
    context,
    x,
    y,
    width,
    height,
    28,
    featured ? `${palette.primary}40` : palette.line,
    featured ? 2 : 1,
  )

  const badgeGradient = context.createLinearGradient(x + 24, y + 24, x + 128, y + 92)
  badgeGradient.addColorStop(0, palette.primary)
  badgeGradient.addColorStop(1, featured ? palette.secondary : palette.accent)
  fillRoundedRect(context, x + 24, y + 22, 104, 72, 22, badgeGradient)
  context.fillStyle = "#ffffff"
  context.font = "900 34px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText(`${row.position}º`, x + 76, y + 67)
  context.textAlign = "left"

  context.fillStyle = palette.text
  context.font = "900 32px Arial, sans-serif"
  drawWrappedText({
    context,
    text: row.name,
    x: x + 156,
    y: y + 51,
    maxWidth: width - 356,
    lineHeight: 34,
    maxLines: 2,
  })

  const pointsText = `${row.points} pts`
  context.font = "900 28px Arial, sans-serif"
  const pillWidth = Math.max(150, context.measureText(pointsText).width + 42)
  fillRoundedRect(context, x + width - pillWidth - 24, y + 32, pillWidth, 52, 20, palette.surfaceAlt)
  context.fillStyle = palette.text
  context.textAlign = "center"
  context.fillText(pointsText, x + width - pillWidth / 2 - 24, y + 66)
  context.textAlign = "left"
}

function drawHighlightCard({
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
  const height = 220
  fillRoundedRect(context, x, y, width, height, 30, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 30, palette.line, 1)

  fillRoundedRect(context, x + 24, y + 24, width - 48, 42, 16, palette.surfaceAlt)
  context.fillStyle = palette.muted
  context.font = "800 20px Arial, sans-serif"
  context.fillText(highlight.label.toUpperCase(), x + 42, y + 51)

  context.fillStyle = palette.text
  context.font = "900 34px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.headline,
    x: x + 28,
    y: y + 106,
    maxWidth: width - 56,
    lineHeight: 38,
    maxLines: 2,
  })

  context.fillStyle = palette.muted
  context.font = "700 23px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.detail,
    x: x + 28,
    y: y + 164,
    maxWidth: width - 56,
    lineHeight: 28,
    maxLines: 2,
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

  drawHeroCard({
    context,
    palette,
    x: HORIZONTAL_PADDING,
    y: 310,
    width: CONTENT_WIDTH,
    label: data.champion.includes(" / ") ? "CAMPEONES" : "CAMPEÓN",
    value: data.champion,
    gradientStart: `${palette.primary}ef`,
    gradientEnd: `${palette.secondary}f0`,
    big: true,
  })

  drawHeroCard({
    context,
    palette,
    x: HORIZONTAL_PADDING,
    y: 554,
    width: CONTENT_WIDTH,
    label: "MVP",
    value: data.mvp,
    gradientStart: `${palette.secondary}ea`,
    gradientEnd: `${palette.accent}e8`,
  })

  drawStatPill({
    context,
    palette,
    text: `${Math.min(data.podium.length, 3)} puestos destacados`,
    x: HORIZONTAL_PADDING,
    y: 758,
  })
  drawStatPill({
    context,
    palette,
    text: `${Math.min(data.highlights.length, 4)} momentos clave`,
    x: HORIZONTAL_PADDING + 314,
    y: 758,
  })

  const podiumY = 870
  drawSectionLabel({ context, palette, text: "Podio final", x: HORIZONTAL_PADDING, y: podiumY })
  data.podium.slice(0, 3).forEach((row, index) => {
    drawPodiumRow({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: podiumY + 34 + index * 136,
      width: CONTENT_WIDTH,
      row,
      featured: index === 0,
    })
  })

  const highlightsY = 1330
  drawSectionLabel({ context, palette, text: "Lo más destacado", x: HORIZONTAL_PADDING, y: highlightsY })
  data.highlights.slice(0, 4).forEach((highlight, index) => {
    drawHighlightCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: highlightsY + 34 + index * 244,
      width: CONTENT_WIDTH,
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
