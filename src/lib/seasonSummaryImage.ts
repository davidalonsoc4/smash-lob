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
  imageUrl?: string | null
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
  leagueLogoUrl?: string | null
  heroes: SeasonSummaryHeroPanel[]
  podium: SeasonSummaryPodiumRow[]
  highlights: SeasonSummaryHighlight[]
}

export type SeasonSummaryImageOptions = {
  includeLeagueLogo?: boolean
  includeHeroImages?: boolean
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

async function loadOptionalImage(src?: string | null) {
  if (!src) return null

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function drawImageCover({
  context,
  image,
  x,
  y,
  width,
  height,
  radius,
  background,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  radius: number
  background: string
}) {
  fillRoundedRect(context, x, y, width, height, radius, background)
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.clip()

  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height
  let drawX = x
  let drawY = y

  if (sourceRatio > targetRatio) {
    drawWidth = height * sourceRatio
    drawX = x - (drawWidth - width) / 2
  } else {
    drawHeight = width / sourceRatio
    drawY = y - (drawHeight - height) / 2
  }

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  context.restore()
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

  const gap = 10
  const visibleStats = stats.slice(0, 3)
  const statWidth = (width - gap * (visibleStats.length - 1)) / visibleStats.length

  visibleStats.forEach((stat, index) => {
    const statX = x + index * (statWidth + gap)
    fillRoundedRect(context, statX, y, statWidth, 66, 16, palette.surfaceAlt)

    context.fillStyle = palette.muted
    context.font = "800 13px Arial, sans-serif"
    context.textAlign = "center"
    context.fillText(stat.label.toUpperCase(), statX + statWidth / 2, y + 22)

    context.fillStyle = palette.text
    context.font = "900 24px Arial, sans-serif"
    context.fillText(stat.value, statX + statWidth / 2, y + 48)
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
  heroImage,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  hero: SeasonSummaryHeroPanel
  heroImage: HTMLImageElement | null
}) {
  const height = 224
  fillRoundedRect(context, x, y, width, height, 28, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 28, palette.line)
  fillRoundedRect(context, x + 18, y + 18, 12, height - 36, 10, palette.accent)

  const paddingX = 42
  const labelWidth = Math.min(280, width - 84)
  fillRoundedRect(context, x + paddingX, y + 24, labelWidth, 34, 14, palette.accentSoft)
  context.fillStyle = palette.text
  context.font = "800 17px Arial, sans-serif"
  context.fillText(hero.label.toUpperCase(), x + paddingX + 14, y + 46)

  const imageSize = heroImage ? 118 : 0
  const imageGap = heroImage ? 20 : 0
  const textWidth = width - paddingX * 2 - imageSize - imageGap
  const textX = x + paddingX
  const nameTop = y + 82

  if (heroImage) {
    drawImageCover({
      context,
      image: heroImage,
      x: x + width - paddingX - imageSize,
      y: y + 60,
      width: imageSize,
      height: imageSize,
      radius: 26,
      background: palette.surfaceAlt,
    })
    strokeRoundedRect(
      context,
      x + width - paddingX - imageSize,
      y + 60,
      imageSize,
      imageSize,
      26,
      palette.line,
    )
  }

  context.fillStyle = palette.text
  context.font = "900 40px Arial, sans-serif"
  const lines = wrapTextLines({
    context,
    text: hero.value,
    maxWidth: textWidth,
    maxLines: 2,
  })
  const lineHeight = 42
  const nameBlockHeight = lineHeight * lines.length
  const nameY = nameTop + Math.max(0, (54 - nameBlockHeight) / 2) + 34
  drawLines({ context, lines, x: textX, y: nameY, lineHeight })

  drawHeroStats({
    context,
    palette,
    x: textX,
    y: y + height - 86,
    width: width - paddingX * 2,
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
  const height = 94
  fillRoundedRect(context, x, y, width, height, 20, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 20, palette.line)

  const badgeFill = row.position === 1 ? palette.accent : palette.accentSoft
  const badgeText = row.position === 1 ? "#ffffff" : palette.text
  fillRoundedRect(context, x + 14, y + 17, 60, 60, 18, badgeFill)
  context.fillStyle = badgeText
  context.font = "900 25px Arial, sans-serif"
  context.textAlign = "center"
  context.fillText(`${row.position}º`, x + 44, y + 56)
  context.textAlign = "left"

  context.fillStyle = palette.text
  context.font = "900 28px Arial, sans-serif"
  drawWrappedText({
    context,
    text: row.name,
    x: x + 98,
    y: y + 54,
    maxWidth: width - 386,
    lineHeight: 30,
    maxLines: 1,
  })

  const statsX = x + width - 248
  context.fillStyle = palette.muted
  context.font = "800 15px Arial, sans-serif"
  context.fillText("PUNTOS", statsX, y + 34)
  context.fillText("DIF. JUEGOS", statsX, y + 65)

  context.fillStyle = palette.text
  context.font = "900 21px Arial, sans-serif"
  context.textAlign = "right"
  context.fillText(`${row.points} pts`, x + width - 22, y + 34)
  context.fillText(formatGamesDiff(row.gamesDiff), x + width - 22, y + 65)
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
  const height = 172
  fillRoundedRect(context, x, y, width, height, 20, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 20, palette.line)

  context.fillStyle = palette.muted
  context.font = "800 15px Arial, sans-serif"
  context.fillText(highlight.label.toUpperCase(), x + 20, y + 30)

  context.fillStyle = palette.text
  context.font = "900 27px Arial, sans-serif"
  drawWrappedText({
    context,
    text: highlight.headline,
    x: x + 20,
    y: y + 69,
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
    y: y + 127,
    maxWidth: width - 40,
    lineHeight: 21,
    maxLines: 2,
  })
}

export async function createSeasonSummaryImage(
  data: SeasonSummaryImageData,
  options: SeasonSummaryImageOptions = {},
) {
  const includeLeagueLogo = options.includeLeagueLogo === true
  const includeHeroImages = options.includeHeroImages === true
  const heroCount = Math.max(1, Math.min(data.heroes.length, 2))
  const heroHeight = 224
  const heroGap = 18
  const podiumRows = Math.min(data.podium.length, 3)
  const highlightRows = Math.min(data.highlights.length, 4)
  const podiumHeight = podiumRows * 106
  const highlightsHeight = highlightRows * 184

  const [leagueLogoImage, heroImages] = await Promise.all([
    includeLeagueLogo ? loadOptionalImage(data.leagueLogoUrl ?? null) : Promise.resolve(null),
    Promise.all(
      data.heroes.slice(0, 2).map((hero) =>
        includeHeroImages ? loadOptionalImage(hero.imageUrl ?? null) : Promise.resolve(null),
      ),
    ),
  ])

  const headerHeight = 228
  const canvasHeight =
    headerHeight +
    heroCount * heroHeight +
    (heroCount - 1) * heroGap +
    62 +
    30 +
    podiumHeight +
    60 +
    30 +
    highlightsHeight +
    92

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

  const logoSize = leagueLogoImage ? 92 : 0
  const headerTextX = HORIZONTAL_PADDING
  const headerTitleX = HORIZONTAL_PADDING + (leagueLogoImage ? logoSize + 24 : 0)

  if (leagueLogoImage) {
    drawImageCover({
      context,
      image: leagueLogoImage,
      x: HORIZONTAL_PADDING,
      y: 42,
      width: logoSize,
      height: logoSize,
      radius: 26,
      background: palette.surface,
    })
    strokeRoundedRect(context, HORIZONTAL_PADDING, 42, logoSize, logoSize, 26, palette.line)
  }

  context.fillStyle = palette.muted
  context.font = "800 22px Arial, sans-serif"
  context.fillText(data.leagueName.toUpperCase(), headerTitleX, 70)

  context.fillStyle = palette.text
  context.font = "900 54px Arial, sans-serif"
  drawWrappedText({
    context,
    text: data.seasonName,
    x: headerTitleX,
    y: 132,
    maxWidth: CONTENT_WIDTH - (leagueLogoImage ? logoSize + 24 : 0),
    lineHeight: 58,
    maxLines: 1,
  })

  context.fillStyle = palette.muted
  context.font = "800 21px Arial, sans-serif"
  context.fillText("RESUMEN FINAL DE TEMPORADA", headerTitleX, 182)

  const heroY = headerHeight
  data.heroes.slice(0, 2).forEach((hero, index) => {
    drawHeroCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: heroY + index * (heroHeight + heroGap),
      width: CONTENT_WIDTH,
      hero,
      heroImage: heroImages[index] ?? null,
    })
  })

  const podiumY = heroY + heroCount * heroHeight + (heroCount - 1) * heroGap + 58
  drawSectionLabel({ context, palette, text: "Podio final", x: headerTextX, y: podiumY })
  data.podium.slice(0, 3).forEach((row, index) => {
    drawPodiumRow({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: podiumY + 24 + index * 106,
      width: CONTENT_WIDTH,
      row,
    })
  })

  const highlightsY = podiumY + 24 + podiumHeight + 58
  drawSectionLabel({
    context,
    palette,
    text: "Lo más destacado",
    x: headerTextX,
    y: highlightsY,
  })

  data.highlights.slice(0, 4).forEach((highlight, index) => {
    drawHighlightCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: highlightsY + 24 + index * 184,
      width: CONTENT_WIDTH,
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
