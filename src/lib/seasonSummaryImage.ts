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
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  line: string
  accent: string
  accentSoft: string
}

const CANVAS_WIDTH = 1080
const HORIZONTAL_PADDING = 64
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_PADDING * 2

function getCanvasPalette(): CanvasPalette {
  return {
    background: "#f4f4f2",
    surface: "#ffffff",
    surfaceAlt: "#f0f0ee",
    text: "#171717",
    muted: "#6b6b67",
    line: "#d8d8d3",
    accent: "#202020",
    accentSoft: "#e7e7e3",
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
  fillStyle: string,
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
  context.font = "800 21px Arial, sans-serif"
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

  const gap = 8
  const visibleStats = stats.slice(0, 3)
  const statWidth = (width - gap * (visibleStats.length - 1)) / visibleStats.length

  visibleStats.forEach((stat, index) => {
    const statX = x + index * (statWidth + gap)
    fillRoundedRect(context, statX, y, statWidth, 56, 14, palette.surfaceAlt)

    context.fillStyle = palette.muted
    context.font = "800 14px Arial, sans-serif"
    context.textAlign = "center"
    context.fillText(stat.label.toUpperCase(), statX + statWidth / 2, y + 20)

    context.fillStyle = palette.text
    context.font = "900 22px Arial, sans-serif"
    context.fillText(stat.value, statX + statWidth / 2, y + 44)
    context.textAlign = "left"
  })
}

function drawHeroCard({
  context,
  palette,
  x,
  y,
  width,
  hero,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  hero: SeasonSummaryHeroPanel
}) {
  const height = 214
  fillRoundedRect(context, x, y, width, height, 26, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 26, palette.line)
  fillRoundedRect(context, x, y, 8, height, 4, palette.accent)

  fillRoundedRect(context, x + 24, y + 20, Math.min(230, width - 48), 32, 12, palette.accentSoft)
  context.fillStyle = palette.text
  context.font = "800 17px Arial, sans-serif"
  context.fillText(hero.label.toUpperCase(), x + 38, y + 42)

  context.fillStyle = palette.text
  context.font = width < 600 ? "900 38px Arial, sans-serif" : "900 42px Arial, sans-serif"
  drawWrappedText({
    context,
    text: hero.value,
    x: x + 28,
    y: y + 94,
    maxWidth: width - 56,
    lineHeight: 42,
    maxLines: 2,
  })

  drawHeroStats({
    context,
    palette,
    x: x + 28,
    y: y + 148,
    width: width - 56,
    stats: hero.stats,
  })
}

function drawPodiumRow({
  context,
  palette,
  x,
  y,
  width,
  row,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  row: SeasonSummaryPodiumRow
}) {
  const height = 86
  fillRoundedRect(context, x, y, width, height, 20, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 20, palette.line)

  const badgeFill = row.position === 1 ? palette.accent : palette.accentSoft
  const badgeText = row.position === 1 ? "#ffffff" : palette.text
  fillRoundedRect(context, x + 14, y + 13, 60, 60, 18, badgeFill)
  context.fillStyle = badgeText
  context.font = "900 25px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText(`${row.position}º`, x + 44, y + 51)
  context.textAlign = "left"

  context.fillStyle = palette.text
  context.font = "900 29px Arial, sans-serif"
  drawWrappedText({
    context,
    text: row.name,
    x: x + 96,
    y: y + 51,
    maxWidth: width - 390,
    lineHeight: 31,
    maxLines: 1,
  })

  const statsX = x + width - 262
  context.fillStyle = palette.muted
  context.font = "800 15px Arial, sans-serif"
  context.fillText("PUNTOS", statsX, y + 31)
  context.fillText("DIF. JUEGOS", statsX, y + 60)

  context.fillStyle = palette.text
  context.font = "900 21px Arial, sans-serif"
  context.textAlign = "right"
  context.fillText(`${row.points} pts`, x + width - 22, y + 31)
  context.fillText(formatGamesDiff(row.gamesDiff), x + width - 22, y + 60)
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
  const height = 154
  fillRoundedRect(context, x, y, width, height, 20, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 20, palette.line)

  context.fillStyle = palette.muted
  context.font = "800 16px Arial, sans-serif"
  context.fillText(highlight.label.toUpperCase(), x + 20, y + 29)

  context.fillStyle = palette.text
  context.font = "900 27px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.headline,
    x: x + 20,
    y: y + 68,
    maxWidth: width - 40,
    lineHeight: 30,
    maxLines: 2,
  })

  context.fillStyle = palette.muted
  context.font = "700 18px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.detail,
    x: x + 20,
    y: y + 130,
    maxWidth: width - 40,
    lineHeight: 21,
    maxLines: 1,
  })
}

export async function createSeasonSummaryImage(data: SeasonSummaryImageData) {
  const heroCount = Math.max(1, Math.min(data.heroes.length, 2))
  const heroHeight = 214
  const heroGap = 16
  const podiumRows = Math.min(data.podium.length, 3)
  const highlightRows = Math.ceil(Math.min(data.highlights.length, 4) / 2)
  const podiumHeight = podiumRows * 98
  const highlightsHeight = highlightRows * 170
  const canvasHeight = 238 + heroHeight + 64 + 30 + podiumHeight + 58 + 30 + highlightsHeight + 84

  const canvas = document.createElement("canvas")
  canvas.width = CANVAS_WIDTH
  canvas.height = canvasHeight
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No se pudo preparar la imagen")

  const palette = getCanvasPalette()
  context.fillStyle = palette.background
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = palette.accent
  context.fillRect(0, 0, canvas.width, 10)

  context.fillStyle = palette.muted
  context.font = "800 22px Arial, sans-serif"
  context.fillText(data.leagueName.toUpperCase(), HORIZONTAL_PADDING, 64)

  context.fillStyle = palette.text
  context.font = "900 54px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.seasonName,
    x: HORIZONTAL_PADDING,
    y: 126,
    maxWidth: CONTENT_WIDTH,
    lineHeight: 58,
    maxLines: 1,
  })

  context.fillStyle = palette.muted
  context.font = "800 21px Arial, sans-serif"
  context.fillText("RESUMEN FINAL DE TEMPORADA", HORIZONTAL_PADDING, 178)

  const heroY = 210
  if (heroCount === 1) {
    drawHeroCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: heroY,
      width: CONTENT_WIDTH,
      hero: data.heroes[0],
    })
  } else {
    const heroWidth = (CONTENT_WIDTH - heroGap) / 2
    data.heroes.slice(0, 2).forEach((hero, index) => {
      drawHeroCard({
        context,
        palette,
        x: HORIZONTAL_PADDING + index * (heroWidth + heroGap),
        y: heroY,
        width: heroWidth,
        hero,
      })
    })
  }

  const podiumY = heroY + heroHeight + 58
  drawSectionLabel({ context, palette, text: "Podio final", x: HORIZONTAL_PADDING, y: podiumY })
  data.podium.slice(0, 3).forEach((row, index) => {
    drawPodiumRow({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: podiumY + 22 + index * 98,
      width: CONTENT_WIDTH,
      row,
    })
  })

  const highlightsY = podiumY + 22 + podiumHeight + 52
  drawSectionLabel({
    context,
    palette,
    text: "Lo más destacado",
    x: HORIZONTAL_PADDING,
    y: highlightsY,
  })

  const highlightGap = 16
  const highlightWidth = (CONTENT_WIDTH - highlightGap) / 2
  data.highlights.slice(0, 4).forEach((highlight, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawHighlightCard({
      context,
      palette,
      x: HORIZONTAL_PADDING + column * (highlightWidth + highlightGap),
      y: highlightsY + 22 + row * 170,
      width: highlightWidth,
      highlight,
    })
  })

  context.fillStyle = palette.muted
  context.font = "700 18px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText("Smash & Lob", CANVAS_WIDTH / 2, canvasHeight - 30)
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
