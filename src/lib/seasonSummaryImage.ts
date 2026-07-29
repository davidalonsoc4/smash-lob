export type SeasonSummaryHighlight = {
  label: string
  headline: string
  detail: string
}

export type SeasonSummaryStat = {
  label: string
  value: string
}

export type SeasonSummaryHeroKind = "champion" | "mvp" | "combined"

export type SeasonSummaryHeroPanel = {
  kind: SeasonSummaryHeroKind
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
  accentMuted: string
  inverseText: string
  inverseMuted: string
}

type TextAlignment = "left" | "center" | "right"

type TextLayout = {
  fontSize: number
  lineHeight: number
  lines: string[]
}

type HighlightLayout = {
  height: number
  headline: TextLayout
  detail: TextLayout
}

const CANVAS_WIDTH = 1080
const HORIZONTAL_PADDING = 54
const CONTENT_WIDTH = CANVAS_WIDTH - HORIZONTAL_PADDING * 2
const APP_ICON_PATH = "/icon-192.png"

function getCanvasPalette(): CanvasPalette {
  return {
    background: "#f3f4f2",
    surface: "#ffffff",
    surfaceAlt: "#f1f2ef",
    text: "#171817",
    muted: "#676c68",
    line: "#dfe1dc",
    accent: "#151615",
    accentMuted: "#cfd3ce",
    inverseText: "#ffffff",
    inverseMuted: "#c9ceca",
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

function drawSurfaceCard({
  context,
  palette,
  x,
  y,
  width,
  height,
  radius,
  shadow = true,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  height: number
  radius: number
  shadow?: boolean
}) {
  context.save()
  if (shadow) {
    context.shadowColor = "rgba(23, 24, 23, 0.08)"
    context.shadowBlur = 24
    context.shadowOffsetY = 10
  }
  fillRoundedRect(context, x, y, width, height, radius, palette.surface)
  context.restore()
  strokeRoundedRect(context, x, y, width, height, radius, palette.line)
}

function truncateTextToWidth(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) return text

  let visible = text
  while (visible.length > 1 && context.measureText(`${visible}…`).width > maxWidth) {
    visible = visible.slice(0, -1)
  }
  return `${visible.trimEnd()}…`
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
  const normalized = text.trim().replace(/\s+/g, " ")
  if (!normalized) return [""]

  const words = normalized.split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth) {
      current = candidate
      continue
    }

    if (current) {
      lines.push(current)
      current = word
    } else {
      lines.push(truncateTextToWidth(context, word, maxWidth))
      current = ""
    }
  }

  if (current) lines.push(current)
  const normalizedLines = lines.map((line) =>
    truncateTextToWidth(context, line, maxWidth),
  )
  if (normalizedLines.length <= maxLines) return normalizedLines

  const visible = normalizedLines.slice(0, maxLines)
  const overflowText = lines.slice(maxLines - 1).join(" ")
  visible[maxLines - 1] = truncateTextToWidth(context, overflowText, maxWidth)
  return visible
}

function fitTextLayout({
  context,
  text,
  maxWidth,
  maxLines,
  maxFontSize,
  minFontSize,
  fontWeight,
  lineHeightRatio = 1.08,
}: {
  context: CanvasRenderingContext2D
  text: string
  maxWidth: number
  maxLines: number
  maxFontSize: number
  minFontSize: number
  fontWeight: number
  lineHeightRatio?: number
}): TextLayout {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 2) {
    context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
    const lines = wrapTextLines({ context, text, maxWidth, maxLines })
    const hasTruncation = lines.some((line) => line.endsWith("…"))
    if (!hasTruncation || fontSize === minFontSize) {
      return {
        fontSize,
        lineHeight: Math.round(fontSize * lineHeightRatio),
        lines,
      }
    }
  }

  context.font = `${fontWeight} ${minFontSize}px Arial, sans-serif`
  return {
    fontSize: minFontSize,
    lineHeight: Math.round(minFontSize * lineHeightRatio),
    lines: wrapTextLines({ context, text, maxWidth, maxLines }),
  }
}

function drawTextLines({
  context,
  lines,
  x,
  y,
  width,
  height,
  lineHeight,
  align = "left",
}: {
  context: CanvasRenderingContext2D
  lines: string[]
  x: number
  y: number
  width: number
  height: number
  lineHeight: number
  align?: TextAlignment
}) {
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
  width,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  text: string
  x: number
  y: number
  width: number
}) {
  fillRoundedRect(context, x, y - 8, 16, 16, 6, palette.accent)
  context.fillStyle = palette.text
  context.font = "900 21px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText(text.toUpperCase(), x + 28, y)
  const labelWidth = context.measureText(text.toUpperCase()).width
  context.strokeStyle = palette.line
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(x + 48 + labelWidth, y)
  context.lineTo(x + width, y)
  context.stroke()
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
  withShadow = false,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  width: number
  height: number
  withShadow?: boolean
}) {
  const placement = getContainedImagePlacement({ image, x, y, width, height })

  context.save()
  if (withShadow) {
    context.shadowColor = "rgba(15, 23, 42, 0.14)"
    context.shadowBlur = 8
    context.shadowOffsetY = 2
  }
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

function drawCrownOutline({
  context,
  x,
  y,
  size,
  strokeStyle,
  lineWidth = 5,
}: {
  context: CanvasRenderingContext2D
  x: number
  y: number
  size: number
  strokeStyle: string
  lineWidth?: number
}) {
  context.save()
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.lineCap = "round"
  context.lineJoin = "round"

  context.beginPath()
  context.moveTo(x + size * 0.12, y + size * 0.28)
  context.lineTo(x + size * 0.3, y + size * 0.53)
  context.lineTo(x + size * 0.5, y + size * 0.18)
  context.lineTo(x + size * 0.7, y + size * 0.53)
  context.lineTo(x + size * 0.88, y + size * 0.28)
  context.lineTo(x + size * 0.78, y + size * 0.72)
  context.lineTo(x + size * 0.22, y + size * 0.72)
  context.closePath()
  context.stroke()

  context.beginPath()
  context.moveTo(x + size * 0.28, y + size * 0.82)
  context.lineTo(x + size * 0.72, y + size * 0.82)
  context.stroke()
  context.restore()
}

function drawStarOutline({
  context,
  x,
  y,
  size,
  strokeStyle,
  lineWidth = 5,
}: {
  context: CanvasRenderingContext2D
  x: number
  y: number
  size: number
  strokeStyle: string
  lineWidth?: number
}) {
  const centerX = x + size / 2
  const centerY = y + size / 2
  const outerRadius = size * 0.38
  const innerRadius = outerRadius * 0.46

  context.save()
  context.strokeStyle = strokeStyle
  context.lineWidth = lineWidth
  context.lineCap = "round"
  context.lineJoin = "round"
  context.beginPath()

  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? outerRadius : innerRadius
    const angle = -Math.PI / 2 + (point * Math.PI) / 5
    const pointX = centerX + Math.cos(angle) * radius
    const pointY = centerY + Math.sin(angle) * radius
    if (point === 0) context.moveTo(pointX, pointY)
    else context.lineTo(pointX, pointY)
  }

  context.closePath()
  context.stroke()
  context.restore()
}

function drawHeroRoleIcon({
  context,
  palette,
  kind,
  x,
  y,
  size,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  kind: SeasonSummaryHeroKind
  x: number
  y: number
  size: number
}) {
  fillRoundedRect(context, x, y, size, size, 26, palette.surfaceAlt)
  strokeRoundedRect(context, x, y, size, size, 26, palette.line)

  if (kind === "champion") {
    drawCrownOutline({
      context,
      x: x + size * 0.16,
      y: y + size * 0.16,
      size: size * 0.68,
      strokeStyle: palette.text,
    })
    return
  }

  if (kind === "mvp") {
    drawStarOutline({
      context,
      x: x + size * 0.16,
      y: y + size * 0.16,
      size: size * 0.68,
      strokeStyle: palette.text,
    })
    return
  }

  drawCrownOutline({
    context,
    x: x + size * 0.12,
    y: y + size * 0.12,
    size: size * 0.56,
    strokeStyle: palette.text,
    lineWidth: 4,
  })
  drawStarOutline({
    context,
    x: x + size * 0.45,
    y: y + size * 0.43,
    size: size * 0.42,
    strokeStyle: palette.text,
    lineWidth: 4,
  })
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
  const height = 64
  const visibleStats = stats.slice(0, 3)
  const statWidth = (width - gap * (visibleStats.length - 1)) / visibleStats.length

  visibleStats.forEach((stat, index) => {
    const statX = x + index * (statWidth + gap)
    fillRoundedRect(context, statX, y, statWidth, height, 17, palette.surfaceAlt)

    context.fillStyle = palette.muted
    context.font = "900 13px Arial, sans-serif"
    drawCenteredText({
      context,
      text: stat.label.toUpperCase(),
      x: statX + statWidth / 2,
      y: y + 18,
    })

    context.fillStyle = palette.text
    context.font = "900 24px Arial, sans-serif"
    drawCenteredText({
      context,
      text: stat.value,
      x: statX + statWidth / 2,
      y: y + 45,
    })
  })
}

function drawHeroCard({
  context,
  palette,
  x,
  y,
  width,
  height,
  hero,
  heroImage,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  height: number
  hero: SeasonSummaryHeroPanel
  heroImage: HTMLImageElement | null
}) {
  const cardRadius = 32
  const contentAreaX = x + 56
  const contentAreaWidth = width - 90
  const topRowY = y + 30
  const roleSize = 88
  const roleGap = 30
  const roleX = contentAreaX
  const roleY = topRowY + 2
  const infoX = roleX + roleSize + roleGap
  const infoWidth = contentAreaWidth - roleSize - roleGap
  const statsY = y + height - 86
  const nameAreaY = topRowY + 24
  const nameAreaHeight = 68
  const imageSize = heroImage ? 76 : 0
  const imageGap = heroImage ? 18 : 0

  drawSurfaceCard({ context, palette, x, y, width, height, radius: cardRadius })
  fillRoundedRect(
    context,
    x + 18,
    y + 18,
    10,
    height - 36,
    5,
    palette.accent,
  )

  const labelFont = "900 15px Arial, sans-serif"
  context.font = labelFont
  const maxTextWidth = Math.max(220, infoWidth - imageSize - imageGap)
  const nameLayout = fitTextLayout({
    context,
    text: hero.value,
    maxWidth: maxTextWidth,
    maxLines: 2,
    maxFontSize: 44,
    minFontSize: 28,
    fontWeight: 900,
  })
  const measuredNameWidth = Math.min(
    maxTextWidth,
    Math.max(170, ...nameLayout.lines.map((line) => context.measureText(line).width + 8)),
  )
  const nameGroupWidth = imageSize + imageGap + measuredNameWidth
  const nameGroupX = infoX + Math.max(0, (infoWidth - nameGroupWidth) / 2)

  drawHeroRoleIcon({
    context,
    palette,
    kind: hero.kind,
    x: roleX,
    y: roleY,
    size: roleSize,
  })

  context.fillStyle = palette.muted
  context.font = labelFont
  drawCenteredText({
    context,
    text: hero.label.toUpperCase(),
    x: infoX + infoWidth / 2,
    y: topRowY + 12,
  })

  if (heroImage) {
    const imageY = nameAreaY + (nameAreaHeight - imageSize) / 2
    drawImageCover({
      context,
      image: heroImage,
      x: nameGroupX,
      y: imageY,
      width: imageSize,
      height: imageSize,
      radius: 23,
      background: palette.surfaceAlt,
    })
    strokeRoundedRect(
      context,
      nameGroupX,
      imageY,
      imageSize,
      imageSize,
      23,
      palette.line,
    )
  }

  context.fillStyle = palette.text
  context.font = `900 ${nameLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: nameLayout.lines,
    x: nameGroupX + imageSize + imageGap,
    y: nameAreaY,
    width: measuredNameWidth,
    height: nameAreaHeight,
    lineHeight: nameLayout.lineHeight,
    align: "center",
  })

  drawHeroStats({
    context,
    palette,
    x: contentAreaX,
    y: statsY,
    width: contentAreaWidth,
    stats: hero.stats,
  })
}

function drawPodiumRowContent({
  context,
  palette,
  x,
  y,
  width,
  height,
  row,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  height: number
  row: SeasonSummaryPodiumRow
}) {
  const badgeFill = row.position === 1 ? palette.accent : palette.surfaceAlt
  const badgeText = row.position === 1 ? palette.inverseText : palette.text
  const badgeSize = 62
  const badgeX = x + 18
  const badgeY = y + (height - badgeSize) / 2
  fillRoundedRect(context, badgeX, badgeY, badgeSize, badgeSize, 19, badgeFill)
  if (row.position !== 1) {
    strokeRoundedRect(context, badgeX, badgeY, badgeSize, badgeSize, 19, palette.line)
  }
  context.fillStyle = badgeText
  context.font = "900 25px Arial, sans-serif"
  drawCenteredText({
    context,
    text: `${row.position}º`,
    x: badgeX + badgeSize / 2,
    y: badgeY + badgeSize / 2,
  })

  const metricsWidth = 252
  const nameX = x + 102
  const nameWidth = width - (nameX - x) - metricsWidth - 20
  const nameLayout = fitTextLayout({
    context,
    text: row.name,
    maxWidth: nameWidth,
    maxLines: 2,
    maxFontSize: 29,
    minFontSize: 22,
    fontWeight: 900,
  })

  context.fillStyle = palette.text
  context.font = `900 ${nameLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: nameLayout.lines,
    x: nameX,
    y,
    width: nameWidth,
    height,
    lineHeight: nameLayout.lineHeight,
  })

  const metricsX = x + width - metricsWidth
  context.save()
  context.strokeStyle = palette.line
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(metricsX, y + 22)
  context.lineTo(metricsX, y + height - 22)
  context.stroke()
  context.restore()

  const metricWidth = metricsWidth / 2
  const metrics = [
    { label: "PUNTOS", value: `${row.points}` },
    { label: "DIF. JUEGOS", value: formatGamesDiff(row.gamesDiff) },
  ]

  metrics.forEach((metric, index) => {
    const metricCenterX = metricsX + metricWidth * index + metricWidth / 2
    context.fillStyle = palette.muted
    context.font = "900 13px Arial, sans-serif"
    drawCenteredText({ context, text: metric.label, x: metricCenterX, y: y + 37 })
    context.fillStyle = palette.text
    context.font = "900 24px Arial, sans-serif"
    drawCenteredText({ context, text: metric.value, x: metricCenterX, y: y + 68 })
  })
}

function drawPodiumPanel({
  context,
  palette,
  x,
  y,
  width,
  rows,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  rows: SeasonSummaryPodiumRow[]
}) {
  const rowHeight = 100
  const panelHeight = rowHeight * rows.length
  drawSurfaceCard({ context, palette, x, y, width, height: panelHeight, radius: 28 })

  rows.forEach((row, index) => {
    const rowY = y + index * rowHeight
    drawPodiumRowContent({
      context,
      palette,
      x,
      y: rowY,
      width,
      height: rowHeight,
      row,
    })

    if (index < rows.length - 1) {
      context.save()
      context.strokeStyle = palette.line
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(x + 20, rowY + rowHeight)
      context.lineTo(x + width - 20, rowY + rowHeight)
      context.stroke()
      context.restore()
    }
  })
}

function getHighlightLayout({
  context,
  highlight,
  width,
}: {
  context: CanvasRenderingContext2D
  highlight: SeasonSummaryHighlight
  width: number
}): HighlightLayout {
  const textWidth = width - 68
  const headline = fitTextLayout({
    context,
    text: highlight.headline,
    maxWidth: textWidth,
    maxLines: 3,
    maxFontSize: 27,
    minFontSize: 23,
    fontWeight: 900,
  })
  const detail = fitTextLayout({
    context,
    text: highlight.detail,
    maxWidth: textWidth,
    maxLines: 2,
    maxFontSize: 18,
    minFontSize: 16,
    fontWeight: 700,
    lineHeightRatio: 1.15,
  })
  const contentHeight =
    18 + 10 + headline.lines.length * headline.lineHeight + 8 + detail.lines.length * detail.lineHeight

  return {
    height: Math.max(124, contentHeight + 36),
    headline,
    detail,
  }
}

function drawHighlightCard({
  context,
  palette,
  x,
  y,
  width,
  highlight,
  layout,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  x: number
  y: number
  width: number
  highlight: SeasonSummaryHighlight
  layout: HighlightLayout
}) {
  drawSurfaceCard({
    context,
    palette,
    x,
    y,
    width,
    height: layout.height,
    radius: 24,
    shadow: false,
  })
  fillRoundedRect(context, x + 16, y + 18, 8, layout.height - 36, 4, palette.accentMuted)

  const textX = x + 42
  const contentHeight =
    18 + 10 + layout.headline.lines.length * layout.headline.lineHeight + 8 + layout.detail.lines.length * layout.detail.lineHeight
  let cursorY = y + (layout.height - contentHeight) / 2

  context.fillStyle = palette.muted
  context.font = "900 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "top"
  context.fillText(highlight.label.toUpperCase(), textX, cursorY)
  context.restore()
  cursorY += 28

  context.fillStyle = palette.text
  context.font = `900 ${layout.headline.fontSize}px Arial, sans-serif`
  context.save()
  context.textBaseline = "top"
  layout.headline.lines.forEach((line, index) => {
    context.fillText(line, textX, cursorY + index * layout.headline.lineHeight)
  })
  context.restore()
  cursorY += layout.headline.lines.length * layout.headline.lineHeight + 8

  context.fillStyle = palette.muted
  context.font = `700 ${layout.detail.fontSize}px Arial, sans-serif`
  context.save()
  context.textBaseline = "top"
  layout.detail.lines.forEach((line, index) => {
    context.fillText(line, textX, cursorY + index * layout.detail.lineHeight)
  })
  context.restore()

}

function drawBrandMark({
  context,
  palette,
  appIcon,
  x,
  y,
  size,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  appIcon: HTMLImageElement | null
  x: number
  y: number
  size: number
}) {
  if (appIcon) {
    drawImageCover({
      context,
      image: appIcon,
      x,
      y,
      width: size,
      height: size,
      radius: Math.round(size * 0.24),
      background: palette.surface,
    })
    return
  }

  fillRoundedRect(context, x, y, size, size, Math.round(size * 0.24), palette.surface)
  context.fillStyle = palette.accent
  context.font = `900 ${Math.round(size * 0.28)}px Arial, sans-serif`
  drawCenteredText({ context, text: "S&L", x: x + size / 2, y: y + size / 2 })
}

function drawHeader({
  context,
  palette,
  leagueLogo,
  data,
  x,
  y,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  leagueLogo: HTMLImageElement | null
  data: SeasonSummaryImageData
  x: number
  y: number
  width: number
  height: number
}) {
  fillRoundedRect(context, x, y, width, height, 38, palette.accent)

  context.save()
  roundedRect(context, x, y, width, height, 38)
  context.clip()
  context.strokeStyle = "rgba(255, 255, 255, 0.075)"
  context.lineWidth = 3
  context.beginPath()
  context.arc(x + width - 36, y + height + 10, 248, Math.PI, Math.PI * 1.65)
  context.stroke()
  context.beginPath()
  context.moveTo(x + width * 0.55, y - 20)
  context.lineTo(x + width + 40, y + height * 0.65)
  context.stroke()
  context.restore()

  const logoRightMargin = 18
  const logoTop = y + 18
  const logoBottomMargin = 18
  const logoMaxHeight = leagueLogo ? height - (logoTop - y) - logoBottomMargin : 0
  const logoAspect = leagueLogo ? leagueLogo.naturalWidth / Math.max(1, leagueLogo.naturalHeight) : 1
  const leagueLogoWidth = leagueLogo ? logoMaxHeight * logoAspect : 0
  const leagueLogoX = x + width - leagueLogoWidth - logoRightMargin
  if (leagueLogo) {
    drawTransparentImageContain({
      context,
      image: leagueLogo,
      x: leagueLogoX,
      y: logoTop,
      width: leagueLogoWidth,
      height: logoMaxHeight,
      withShadow: true,
    })
  }

  const textLeft = x + 30
  const textRight = leagueLogo ? leagueLogoX - 18 : x + width - 30
  const titleWidth = Math.max(240, textRight - textLeft)

  context.fillStyle = palette.inverseMuted
  context.font = "900 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("RESUMEN FINAL DE TEMPORADA", textLeft, y + 38)
  context.restore()

  const leagueLayout = fitTextLayout({
    context,
    text: data.leagueName.toUpperCase(),
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 24,
    minFontSize: 18,
    fontWeight: 900,
  })
  context.fillStyle = palette.inverseMuted
  context.font = `900 ${leagueLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: leagueLayout.lines,
    x: textLeft,
    y: y + 84,
    width: titleWidth,
    height: 48,
    lineHeight: leagueLayout.lineHeight,
  })

  const seasonLayout = fitTextLayout({
    context,
    text: data.seasonName,
    maxWidth: titleWidth,
    maxLines: 2,
    maxFontSize: 56,
    minFontSize: 36,
    fontWeight: 900,
  })
  context.fillStyle = palette.inverseText
  context.font = `900 ${seasonLayout.fontSize}px Arial, sans-serif`
  drawTextLines({
    context,
    lines: seasonLayout.lines,
    x: textLeft,
    y: y + 136,
    width: titleWidth,
    height: 84,
    lineHeight: seasonLayout.lineHeight,
  })
}

function drawCanvasBackground({
  context,
  palette,
  width,
  height,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  width: number
  height: number
}) {
  context.fillStyle = palette.background
  context.fillRect(0, 0, width, height)

  context.save()
  context.strokeStyle = "rgba(112, 119, 113, 0.08)"
  context.lineWidth = 2
  roundedRect(context, 28, 28, width - 56, height - 56, 48)
  context.stroke()
  context.setLineDash([10, 16])
  context.beginPath()
  context.moveTo(width / 2, 28)
  context.lineTo(width / 2, height - 28)
  context.stroke()
  context.restore()
}

function drawFooter({
  context,
  palette,
  appIcon,
  x,
  y,
  width,
}: {
  context: CanvasRenderingContext2D
  palette: CanvasPalette
  appIcon: HTMLImageElement | null
  x: number
  y: number
  width: number
}) {
  const iconSize = 52
  const textBlockWidth = 132
  const groupWidth = iconSize + 16 + textBlockWidth
  const groupX = x + (width - groupWidth) / 2
  drawBrandMark({ context, palette, appIcon, x: groupX, y: y + 5, size: iconSize })

  context.fillStyle = palette.muted
  context.font = "700 15px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("Creado con", groupX + iconSize + 16, y + 22)
  context.restore()

  context.fillStyle = palette.text
  context.font = "900 21px Arial, sans-serif"
  context.save()
  context.textBaseline = "middle"
  context.fillText("Smash & Lob", groupX + iconSize + 16, y + 44)
  context.restore()
}

export async function createSeasonSummaryImage(
  data: SeasonSummaryImageData,
  options: SeasonSummaryImageOptions = {},
) {
  const includeLeagueLogo = options.includeLeagueLogo === true
  const includeHeroImages = options.includeHeroImages === true
  const heroes = data.heroes.slice(0, 2)
  const heroCount = Math.max(1, heroes.length)
  const podiumRowsData = data.podium.slice(0, 3)
  const highlights = data.highlights.slice(0, 4)

  const [appIconImage, leagueLogoImage, heroImages] = await Promise.all([
    loadOptionalImage(APP_ICON_PATH),
    includeLeagueLogo ? loadOptionalImage(data.leagueLogoUrl ?? null) : Promise.resolve(null),
    Promise.all(
      heroes.map((hero) =>
        includeHeroImages ? loadOptionalImage(hero.imageUrl ?? null) : Promise.resolve(null),
      ),
    ),
  ])

  const measurementCanvas = document.createElement("canvas")
  const measurementContext = measurementCanvas.getContext("2d")
  if (!measurementContext) throw new Error("No se pudo preparar la imagen")

  const headerHeight = 254
  const heroHeight = 220
  const heroGap = 16
  const podiumRowHeight = 100
  const podiumHeight = podiumRowsData.length * podiumRowHeight
  const highlightGap = 12
  const highlightLayouts = highlights.map((highlight) =>
    getHighlightLayout({
      context: measurementContext,
      highlight,
      width: CONTENT_WIDTH,
    }),
  )
  const highlightsHeight =
    highlightLayouts.reduce((total, layout) => total + layout.height, 0) +
    Math.max(0, highlightLayouts.length - 1) * highlightGap

  const topPadding = 34
  const headerGap = 22
  const afterHeroesGap = 40
  const sectionLabelHeight = 28
  const labelToPanelGap = 14
  const betweenSectionsGap = 40
  const footerGap = 32
  const footerHeight = 62
  const bottomPadding = 34

  const heroesHeight = heroCount * heroHeight + Math.max(0, heroCount - 1) * heroGap
  const canvasHeight =
    topPadding +
    headerHeight +
    headerGap +
    heroesHeight +
    afterHeroesGap +
    sectionLabelHeight +
    labelToPanelGap +
    podiumHeight +
    betweenSectionsGap +
    sectionLabelHeight +
    labelToPanelGap +
    highlightsHeight +
    footerGap +
    footerHeight +
    bottomPadding

  const canvas = document.createElement("canvas")
  canvas.width = CANVAS_WIDTH
  canvas.height = canvasHeight
  const context = canvas.getContext("2d")
  if (!context) throw new Error("No se pudo preparar la imagen")

  const palette = getCanvasPalette()
  drawCanvasBackground({ context, palette, width: canvas.width, height: canvas.height })

  let currentY = topPadding
  drawHeader({
    context,
    palette,
    leagueLogo: leagueLogoImage,
    data,
    x: HORIZONTAL_PADDING,
    y: currentY,
    width: CONTENT_WIDTH,
    height: headerHeight,
  })
  currentY += headerHeight + headerGap

  const heroesToDraw = heroes.length > 0 ? heroes : data.heroes.slice(0, 1)
  heroesToDraw.forEach((hero, index) => {
    drawHeroCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: currentY + index * (heroHeight + heroGap),
      width: CONTENT_WIDTH,
      height: heroHeight,
      hero,
      heroImage: heroImages[index] ?? null,
    })
  })
  currentY += heroesHeight + afterHeroesGap

  drawSectionLabel({
    context,
    palette,
    text: "Podio final",
    x: HORIZONTAL_PADDING,
    y: currentY + sectionLabelHeight / 2,
    width: CONTENT_WIDTH,
  })
  currentY += sectionLabelHeight + labelToPanelGap
  if (podiumRowsData.length > 0) {
    drawPodiumPanel({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: currentY,
      width: CONTENT_WIDTH,
      rows: podiumRowsData,
    })
  }
  currentY += podiumHeight + betweenSectionsGap

  drawSectionLabel({
    context,
    palette,
    text: "Lo más destacado",
    x: HORIZONTAL_PADDING,
    y: currentY + sectionLabelHeight / 2,
    width: CONTENT_WIDTH,
  })
  currentY += sectionLabelHeight + labelToPanelGap

  highlights.forEach((highlight, index) => {
    const layout = highlightLayouts[index]
    drawHighlightCard({
      context,
      palette,
      x: HORIZONTAL_PADDING,
      y: currentY,
      width: CONTENT_WIDTH,
      highlight,
      layout,
    })
    currentY += layout.height + (index < highlights.length - 1 ? highlightGap : 0)
  })

  currentY += footerGap
  drawFooter({
    context,
    palette,
    appIcon: appIconImage,
    x: HORIZONTAL_PADDING,
    y: currentY,
    width: CONTENT_WIDTH,
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
