export type SeasonSummaryHighlight = {
  label: string
  headline: string
  detail: string
}

export type SeasonSummaryStat = {
  label: string
  value: string
}

export type SeasonSummaryHeroPanel = {
  label: string
  value: string
  stats: SeasonSummaryStat[]
}

export type SeasonSummaryPodiumRow = {
  position: number
  name: string
  points: number
  gamesDiff: number
}

export type SeasonSummaryImageData = {
  leagueName: string
  seasonName: string
  heroes: SeasonSummaryHeroPanel[]
  podium: SeasonSummaryPodiumRow[]
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
const HORIZONTAL_PADDING = 72
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_PADDING * 2

function readCssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function getCanvasPalette(): CanvasPalette {
  const root = document.documentElement
  const colorful = root.dataset.style === "colorful"

  return {
    primary: colorful ? readCssColor("--colorful-primary", "#5b5ce2") : "#171717",
    secondary: colorful ? readCssColor("--colorful-secondary", "#7c4dff") : "#4f46e5",
    accent: colorful ? readCssColor("--colorful-accent", "#e94b9b") : "#db2777",
    background: "#f6f4ef",
    surface: "#ffffff",
    surfaceAlt: "#f4f4f5",
    text: "#171717",
    muted: "#666666",
    line: "rgba(23,23,23,0.08)",
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
  return lines
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

function formatGamesDiff(value: number) {
  if (value > 0) return `+${value}`
  return `${value}`
}

function drawHeroStats({
  context,
  palette,
  x,
  y,
  width,
  stats,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  stats: SeasonSummaryStat[]
}) {
  if (stats.length === 0) return

  const gap = 12
  const statWidth = (width - gap * (stats.length - 1)) / stats.length

  stats.forEach((stat, index) => {
    const statX = x + index * (statWidth + gap)
    fillRoundedRect(context, statX, y, statWidth, 74, 22, palette.surface)
    strokeRoundedRect(context, statX, y, statWidth, 74, 22, palette.line, 1)

    context.fillStyle = palette.muted
    context.font = "800 18px Arial, sans-serif"
    context.textAlign = "center"
    context.fillText(stat.label.toUpperCase(), statX + statWidth / 2, y + 26)

    context.fillStyle = palette.text
    context.font = "900 28px Arial, sans-serif"
    context.fillText(stat.value, statX + statWidth / 2, y + 58)
    context.textAlign = "left"
  })
}

function drawHeroCard({
  context,
  palette,
  x,
  y,
  width,
  label,
  value,
  stats,
  gradientStart,
  gradientEnd,
  height,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  label: string
  value: string
  stats: SeasonSummaryStat[]
  gradientStart: string
  gradientEnd: string
  height: number
}) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, gradientStart)
  gradient.addColorStop(1, gradientEnd)
  fillRoundedRect(context, x, y, width, height, 38, gradient)
  strokeRoundedRect(context, x, y, width, height, 38, palette.line, 1)

  fillRoundedRect(context, x + 30, y + 24, 240, 42, 16, palette.surface)
  context.fillStyle = palette.text
  context.font = "800 22px Arial, sans-serif"
  context.fillText(label, x + 48, y + 52)

  context.fillStyle = palette.text
  context.font = "900 56px Arial, sans-serif"
  drawWrappedText({
    context,
    text: value,
    x: x + 34,
    y: y + 120,
    maxWidth: width - 68,
    lineHeight: 56,
    maxLines: 2,
  })

  drawHeroStats({
    context,
    palette,
    x: x + 34,
    y: y + height - 96,
    width: width - 68,
    stats: stats.slice(0, 3),
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
  row: SeasonSummaryPodiumRow
  featured: boolean
}) {
  const height = 128
  fillRoundedRect(context, x, y, width, height, 28, palette.surface)
  strokeRoundedRect(
    context,
    x,
    y,
    width,
    height,
    28,
    featured ? `${palette.secondary}30` : palette.line,
    featured ? 2 : 1,
  )

  const badgeGradient = context.createLinearGradient(x + 24, y + 24, x + 118, y + 106)
  badgeGradient.addColorStop(0, featured ? palette.secondary : palette.primary)
  badgeGradient.addColorStop(1, featured ? palette.accent : palette.secondary)
  fillRoundedRect(context, x + 24, y + 22, 94, 84, 24, badgeGradient)
  context.fillStyle = "#ffffff"
  context.font = "900 34px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText(`${row.position}º`, x + 71, y + 72)
  context.textAlign = "left"

  context.fillStyle = palette.text
  context.font = "900 32px Arial, sans-serif"
  const nameLines = wrapTextLines({
    context,
    text: row.name,
    maxWidth: width - 414,
    maxLines: 2,
  })
  const nameBlockHeight = nameLines.length * 34
  const nameStartY = y + height / 2 - nameBlockHeight / 2 + 16
  drawLines({
    context,
    lines: nameLines,
    x: x + 148,
    y: nameStartY,
    lineHeight: 34,
  })

  const statX = x + width - 212
  fillRoundedRect(context, statX, y + 24, 188, 34, 14, palette.surfaceAlt)
  fillRoundedRect(context, statX, y + 70, 188, 34, 14, palette.surfaceAlt)

  context.fillStyle = palette.muted
  context.font = "800 18px Arial, sans-serif"
  context.fillText("Puntos", statX + 16, y + 46)
  context.fillText("Dif. juegos", statX + 16, y + 92)

  context.fillStyle = palette.text
  context.font = "900 22px Arial, sans-serif"
  context.textAlign = "right"
  context.fillText(`${row.points} pts`, statX + 172, y + 46)
  context.fillText(formatGamesDiff(row.gamesDiff), statX + 172, y + 92)
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
  const height = 216
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
  const heroCount = Math.max(1, data.heroes.length)
  const heroHeight = heroCount === 1 ? 252 : 226
  const heroGap = 24
  const podiumRows = Math.min(data.podium.length, 3)
  const highlightRows = Math.min(data.highlights.length, 4)
  const heroBlockHeight = heroCount * heroHeight + (heroCount - 1) * heroGap
  const podiumBlockHeight = podiumRows > 0 ? 34 + podiumRows * 144 : 34
  const highlightBlockHeight = highlightRows > 0 ? 34 + highlightRows * 234 : 34
  const canvasHeight = Math.max(
    2220,
    310 + heroBlockHeight + 82 + podiumBlockHeight + 96 + highlightBlockHeight + 120,
  )

  const canvas = document.createElement("canvas")
  canvas.width = CANVAS_WIDTH
  canvas.height = canvasHeight
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No se pudo preparar la imagen")

  const palette = getCanvasPalette()
  const backgroundGradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, canvasHeight)
  backgroundGradient.addColorStop(0, palette.background)
  backgroundGradient.addColorStop(0.68, "#fbfaf7")
  backgroundGradient.addColorStop(1, "#f2eee6")
  context.fillStyle = backgroundGradient
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = palette.primary
  context.fillRect(0, 0, canvas.width, 12)

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

  let cursorY = 310
  data.heroes.forEach((hero, index) => {
    drawHeroCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: cursorY,
      width: CONTENT_WIDTH,
      label: hero.label,
      value: hero.value,
      stats: hero.stats,
      gradientStart: index === 0 ? "#ffffff" : "#fffafc",
      gradientEnd: index === 0 ? "#f4efff" : "#fef2f6",
      height: heroHeight,
    })
    cursorY += heroHeight + heroGap
  })

  const podiumY = cursorY + 54
  drawSectionLabel({ context, palette, text: "Podio final", x: HORIZONTAL_PADDING, y: podiumY })
  data.podium.slice(0, 3).forEach((row, index) => {
    drawPodiumRow({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: podiumY + 34 + index * 144,
      width: CONTENT_WIDTH,
      row,
      featured: index === 0,
    })
  })

  const highlightsY = podiumY + 34 + podiumRows * 144 + 82
  drawSectionLabel({
    context,
    palette,
    text: "Lo más destacado",
    x: HORIZONTAL_PADDING,
    y: highlightsY,
  })
  data.highlights.slice(0, 4).forEach((highlight, index) => {
    drawHighlightCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: highlightsY + 34 + index * 234,
      width: CONTENT_WIDTH,
      highlight,
    })
  })

  context.fillStyle = palette.muted
  context.font = "700 22px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText("Smash & Lob", CANVAS_WIDTH / 2, canvasHeight - 42)
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
