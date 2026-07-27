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

type TextAlignment = "left" | "center" | "right"

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

function drawTextBlock({
  context,
  text,
  x,
  y,
  width,
  height,
  lineHeight,
  maxLines = 2,
  align = "left",
}: {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
  width: number
  height: number
  lineHeight: number
  maxLines?: number
  align?: TextAlignment
}) {
  const lines = wrapTextLines({ context, text, maxWidth: width, maxLines })
  const centerY = y + height / 2
  const firstLineY = centerY - ((lines.length - 1) * lineHeight) / 2
  const textX = align === "center" ? x + width / 2 : align === "right" ? x + width : x

  context.save()
  context.textAlign = align
  context.textBaseline = "middle"
  lines.forEach((line, index) => {
    context.fillText(line, textX, firstLineY + index * lineHeight)
  })
  context.restore()

  return lines
}

function drawCenteredText({
  context,
  text,
  x,
  y,
}: {
  context: CanvasRenderingContext2D
  text: string
  x: number
  y: number
}) {
  context.save()
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, x, y)
  context.restore()
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
  context.save()
  context.textBaseline = "middle"
  context.fillText(text.toUpperCase(), x, y)
  context.restore()
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

function getContainedImagePlacement({
  image,
  x,
  y,
  width,
  height,
}: {
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}) {
  const sourceRatio = image.width / image.height
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio
  } else {
    drawWidth = height * sourceRatio
  }

  return {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  }
}

function drawTransparentImageContain({
  context,
  image,
  x,
  y,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
}) {
  const placement = getContainedImagePlacement({ image, x, y, width, height })

  context.save()
  context.shadowColor = "rgba(15, 23, 42, 0.14)"
  context.shadowBlur = 8
  context.shadowOffsetY = 2
  context.drawImage(
    image,
    placement.x,
    placement.y,
    placement.width,
    placement.height,
  )
  context.restore()
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
  const height = 66
  const visibleStats = stats.slice(0, 3)
  const statWidth = (width - gap * (visibleStats.length - 1)) / visibleStats.length

  visibleStats.forEach((stat, index) => {
    const statX = x + index * (statWidth + gap)
    fillRoundedRect(context, statX, y, statWidth, height, 16, palette.surfaceAlt)

    context.fillStyle = palette.muted
    context.font = "800 13px Arial, sans-serif"
    drawCenteredText({
      context,
      text: stat.label.toUpperCase(),
      x: statX + statWidth / 2,
      y: y + 20,
    })

    context.fillStyle = palette.text
    context.font = "900 24px Arial, sans-serif"
    drawCenteredText({
      context,
      text: stat.value,
      x: statX + statWidth / 2,
      y: y + 46,
    })
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
  const horizontalPadding = 42
  const statsY = y + height - 82

  fillRoundedRect(context, x, y, width, height, 28, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 28, palette.line)
  fillRoundedRect(context, x + 18, y + 18, 12, height - 36, 10, palette.accent)

  context.font = "800 17px Arial, sans-serif"
  const labelText = hero.label.toUpperCase()
  const labelWidth = Math.min(
    width - horizontalPadding * 2,
    Math.max(190, context.measureText(labelText).width + 32),
  )
  const labelX = x + horizontalPadding
  const labelY = y + 22
  const labelHeight = 36
  fillRoundedRect(context, labelX, labelY, labelWidth, labelHeight, 14, palette.accentSoft)
  context.fillStyle = palette.text
  drawCenteredText({
    context,
    text: labelText,
    x: labelX + labelWidth / 2,
    y: labelY + labelHeight / 2,
  })

  const imageSize = heroImage ? 96 : 0
  const imageGap = heroImage ? 20 : 0
  const imageX = x + width - horizontalPadding - imageSize
  const imageY = y + 62
  const nameX = x + horizontalPadding
  const nameY = y + 64
  const nameWidth = width - horizontalPadding * 2 - imageSize - imageGap
  const nameHeight = statsY - nameY - 10

  if (heroImage) {
    drawImageCover({
      context,
      image: heroImage,
      x: imageX,
      y: imageY,
      width: imageSize,
      height: imageSize,
      radius: 24,
      background: palette.surfaceAlt,
    })
    strokeRoundedRect(
      context,
      imageX,
      imageY,
      imageSize,
      imageSize,
      24,
      palette.line,
    )
  }

  context.fillStyle = palette.text
  context.font = "900 40px Arial, sans-serif"
  drawTextBlock({
    context,
    text: hero.value,
    x: nameX,
    y: nameY,
    width: nameWidth,
    height: nameHeight,
    lineHeight: 42,
    maxLines: 2,
    align: "center",
  })

  drawHeroStats({
    context,
    palette,
    x: x + horizontalPadding,
    y: statsY,
    width: width - horizontalPadding * 2,
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
  const badgeX = x + 14
  const badgeY = y + 17
  const badgeSize = 60
  fillRoundedRect(context, badgeX, badgeY, badgeSize, badgeSize, 18, badgeFill)
  context.fillStyle = badgeText
  context.font = "900 25px Arial, sans-serif"
  drawCenteredText({
    context,
    text: `${row.position}º`,
    x: badgeX + badgeSize / 2,
    y: badgeY + badgeSize / 2,
  })

  context.fillStyle = palette.text
  context.font = "900 28px Arial, sans-serif"
  drawTextBlock({
    context,
    text: row.name,
    x: x + 98,
    y,
    width: width - 386,
    height,
    lineHeight: 30,
    maxLines: 1,
  })

  const statsX = x + width - 248
  context.fillStyle = palette.muted
  context.font = "800 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("PUNTOS", statsX, y + 31)
  context.fillText("DIF. JUEGOS", statsX, y + 63)
  context.restore()

  context.fillStyle = palette.text
  context.font = "900 21px Arial, sans-serif"
  context.save()
  context.textAlign = "right"
  context.textBaseline = "middle"
  context.fillText(`${row.points} pts`, x + width - 22, y + 31)
  context.fillText(formatGamesDiff(row.gamesDiff), x + width - 22, y + 63)
  context.restore()
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
  const horizontalPadding = 20
  fillRoundedRect(context, x, y, width, height, 20, palette.surface)
  strokeRoundedRect(context, x, y, width, height, 20, palette.line)

  context.fillStyle = palette.muted
  context.font = "800 15px Arial, sans-serif"
  drawTextBlock({
    context,
    text: highlight.label.toUpperCase(),
    x: x + horizontalPadding,
    y: y + 12,
    width: width - horizontalPadding * 2,
    height: 28,
    lineHeight: 18,
    maxLines: 1,
  })

  context.fillStyle = palette.text
  context.font = "900 27px Arial, sans-serif"
  drawTextBlock({
    context,
    text: highlight.headline,
    x: x + horizontalPadding,
    y: y + 42,
    width: width - horizontalPadding * 2,
    height: 62,
    lineHeight: 30,
    maxLines: 2,
  })

  context.fillStyle = palette.muted
  context.font = "700 18px Arial, sans-serif"
  drawTextBlock({
    context,
    text: highlight.detail,
    x: x + horizontalPadding,
    y: y + 106,
    width: width - horizontalPadding * 2,
    height: 50,
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
  const headerTextWidth = CONTENT_WIDTH - (leagueLogoImage ? logoSize + 24 : 0)

  if (leagueLogoImage) {
    drawTransparentImageContain({
      context,
      image: leagueLogoImage,
      x: HORIZONTAL_PADDING,
      y: 42,
      width: logoSize,
      height: logoSize,
    })
  }

  context.fillStyle = palette.muted
  context.font = "800 22px Arial, sans-serif"
  drawTextBlock({
    context,
    text: data.leagueName.toUpperCase(),
    x: headerTitleX,
    y: 46,
    width: headerTextWidth,
    height: 34,
    lineHeight: 24,
    maxLines: 1,
  })

  context.fillStyle = palette.text
  context.font = "900 54px Arial, sans-serif"
  drawTextBlock({
    context,
    text: data.seasonName,
    x: headerTitleX,
    y: 82,
    width: headerTextWidth,
    height: 76,
    lineHeight: 58,
    maxLines: 1,
  })

  context.fillStyle = palette.muted
  context.font = "800 21px Arial, sans-serif"
  drawTextBlock({
    context,
    text: "RESUMEN FINAL DE TEMPORADA",
    x: headerTitleX,
    y: 160,
    width: headerTextWidth,
    height: 40,
    lineHeight: 24,
    maxLines: 1,
  })

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
  drawCenteredText({
    context,
    text: "Smash & Lob",
    x: CANVAS_WIDTH / 2,
    y: canvasHeight - 30,
  })

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
