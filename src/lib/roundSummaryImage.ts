import { normalizeImageUrl } from "@/lib/imageUrl"

export type RoundSummaryImagePerson = { name: string; avatarUrl?: string | null; avatarInitials?: string | null }
export type RoundSummaryImageResult = { teamA: RoundSummaryImagePerson[]; teamB: RoundSummaryImagePerson[]; pointsA: number | null; pointsB: number | null; sets: { a: number; b: number }[]; meta?: string | null }
export type RoundSummaryImageMvpItem = { label?: string; players: RoundSummaryImagePerson[]; pendingText?: string; detail?: string }
export type RoundSummaryImageHighlight = { variant?: "stat" | "mvp"; eyebrow: string; title: string; leftLabel: string; leftValue: string; centerValue: string; rightLabel: string; rightValue: string; teamA?: string[]; teamB?: string[]; score?: string; players?: RoundSummaryImagePerson[]; detail?: string; pendingText?: string }
export type RoundSummaryImageRankingRow = RoundSummaryImagePerson & { position: number; movement: string; gamesDiff: number; points: number }
export type RoundSummaryImageData = { leagueName: string; seasonName: string; leagueLogoUrl?: string | null; round: number; statusSummary: string; statusLabel: string; dateRange?: string | null; metrics: { finishedMatches: number; totalMatches: number; totalSets: number; totalGames: number }; results: RoundSummaryImageResult[]; mvp?: { title: string; items: RoundSummaryImageMvpItem[] } | null; highlights: RoundSummaryImageHighlight[]; highlightsPendingText?: string | null; rankingTitle: string; ranking: RoundSummaryImageRankingRow[]; rankingEmptyText?: string | null }
type Palette = { background: string; surface: string; surfaceAlt: string; text: string; muted: string; line: string; accent: string; inverseText: string; inverseMuted: string; success: string; danger: string }

const WIDTH = 1080
const PADDING = 54
const CONTENT_WIDTH = WIDTH - PADDING * 2
const APP_ICON_PATH = "/icon-192.png"
const palette: Palette = {
  background: "#f3f4f2",
  surface: "#ffffff",
  surfaceAlt: "#f1f2ef",
  text: "#171817",
  muted: "#676c68",
  line: "#dfe1dc",
  accent: "#151615",
  inverseText: "#ffffff",
  inverseMuted: "#c9ceca",
  success: "#147a4b",
  danger: "#c13d35",
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function fillRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = fill
  context.fill()
  context.restore()
}

function strokeRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, stroke: string, lineWidth = 2) {
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.strokeStyle = stroke
  context.lineWidth = lineWidth
  context.stroke()
  context.restore()
}

function drawCard(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 28) {
  context.save()
  context.shadowColor = "rgba(23, 24, 23, 0.08)"
  context.shadowBlur = 24
  context.shadowOffsetY = 10
  fillRoundedRect(context, x, y, width, height, radius, palette.surface)
  context.restore()
  strokeRoundedRect(context, x, y, width, height, radius, palette.line)
}

function drawText(context: CanvasRenderingContext2D, value: string, x: number, y: number, options: { size: number; weight?: number; color?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline; maxWidth?: number }) {
  context.save()
  context.font = `${options.weight ?? 700} ${options.size}px Arial, sans-serif`
  context.fillStyle = options.color ?? palette.text
  context.textAlign = options.align ?? "left"
  context.textBaseline = options.baseline ?? "alphabetic"
  if (options.maxWidth) context.fillText(value, x, y, options.maxWidth)
  else context.fillText(value, x, y)
  context.restore()
}

function truncateText(context: CanvasRenderingContext2D, value: string, maxWidth: number, font: string) {
  context.save()
  context.font = font
  if (context.measureText(value).width <= maxWidth) {
    context.restore()
    return value
  }
  let visible = value
  while (visible.length > 1 && context.measureText(`${visible.trimEnd()}…`).width > maxWidth) {
    visible = visible.slice(0, -1)
  }
  context.restore()
  return `${visible.trimEnd()}…`
}

function getInitials(value: string, fallback = "SL") {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return fallback
  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase() || fallback
}

type TextLayout = {
  fontSize: number
  lineHeight: number
  lines: string[]
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
      lines.push(truncateText(context, word, maxWidth, context.font))
      current = ""
    }
  }

  if (current) lines.push(current)
  if (lines.length <= maxLines) return lines
  const visible = lines.slice(0, maxLines)
  visible[maxLines - 1] = truncateText(context, lines.slice(maxLines - 1).join(" "), maxWidth, context.font)
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
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 1) {
    context.font = `${fontWeight} ${fontSize}px Arial, sans-serif`
    const lines = wrapTextLines({ context, text, maxWidth, maxLines })
    if (lines.length <= maxLines) {
      return { fontSize, lineHeight: Math.round(fontSize * lineHeightRatio), lines }
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
}: {
  context: CanvasRenderingContext2D
  lines: string[]
  x: number
  y: number
  width: number
  height: number
  lineHeight: number
}) {
  const totalHeight = lineHeight * Math.max(1, lines.length)
  let currentY = y + (height - totalHeight) / 2 + lineHeight * 0.78
  for (const line of lines) {
    context.fillText(line, x, currentY, width)
    currentY += lineHeight
  }
}

async function loadOptionalImage(src?: string | null) {
  const normalized = normalizeImageUrl(src ?? null)
  if (!normalized) return null

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = normalized
  })
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
  const sourceRatio = image.width / Math.max(1, image.height)
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height
  if (sourceRatio > targetRatio) drawHeight = width / sourceRatio
  else drawWidth = height * sourceRatio
  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2

  context.save()
  if (withShadow) {
    context.shadowColor = "rgba(15, 23, 42, 0.14)"
    context.shadowBlur = 8
    context.shadowOffsetY = 2
  }
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
  context.restore()
}

function drawImageCover({
  context,
  image,
  x,
  y,
  size,
  radius,
}: {
  context: CanvasRenderingContext2D
  image: HTMLImageElement
  x: number
  y: number
  size: number
  radius: number
}) {
  const sourceRatio = image.width / Math.max(1, image.height)
  let sourceWidth = image.width
  let sourceHeight = image.height
  let sourceX = 0
  let sourceY = 0
  if (sourceRatio > 1) {
    sourceWidth = image.height
    sourceX = (image.width - sourceWidth) / 2
  } else if (sourceRatio < 1) {
    sourceHeight = image.width
    sourceY = (image.height - sourceHeight) / 2
  }

  context.save()
  roundedRect(context, x, y, size, size, radius)
  context.clip()
  context.fillStyle = palette.surfaceAlt
  context.fillRect(x, y, size, size)
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, size, size)
  context.restore()
}

function drawAvatar({
  context,
  person,
  image,
  x,
  y,
  size,
}: {
  context: CanvasRenderingContext2D
  person: RoundSummaryImagePerson
  image: HTMLImageElement | null
  x: number
  y: number
  size: number
}) {
  if (image) {
    drawImageCover({ context, image, x, y, size, radius: Math.round(size / 2) })
    return
  }
  fillRoundedRect(context, x, y, size, size, size / 2, palette.surfaceAlt)
  drawText(context, person.avatarInitials || getInitials(person.name), x + size / 2, y + size / 2 + 1, {
    size: Math.round(size * 0.32),
    weight: 900,
    color: palette.accent,
    align: "center",
    baseline: "middle",
  })
}

function createCanvas(height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas_not_available")

  context.fillStyle = palette.background
  context.fillRect(0, 0, WIDTH, height)
  context.save()
  context.strokeStyle = "rgba(112, 119, 113, 0.08)"
  context.lineWidth = 2
  roundedRect(context, 28, 28, WIDTH - 56, height - 56, 48)
  context.stroke()
  context.setLineDash([10, 16])
  context.beginPath()
  context.moveTo(WIDTH / 2, 28)
  context.lineTo(WIDTH / 2, height - 28)
  context.stroke()
  context.restore()
  return { canvas, context }
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("image_export_failed"))
      else resolve(blob)
    }, "image/png")
  })
}

function sectionTitle(context: CanvasRenderingContext2D, title: string, y: number) {
  drawText(context, title.toUpperCase(), PADDING, y, {
    size: 19,
    weight: 900,
    color: palette.text,
    baseline: "middle",
  })
  context.save()
  context.fillStyle = palette.line
  context.fillRect(PADDING + 212, y - 1, CONTENT_WIDTH - 212, 2)
  context.restore()
}

const GRID_GAP = 18

function resultHeight() {
  return 146
}

function highlightHeight(highlight: RoundSummaryImageHighlight) {
  if (highlight.variant === "mvp") return highlight.players && highlight.players.length > 1 ? 132 : 118
  return highlight.teamA && highlight.teamB ? 170 : 138
}

function buildDisplayHighlights(data: RoundSummaryImageData): RoundSummaryImageHighlight[] {
  const mvpCards = data.mvp?.items.map((item) => ({
    variant: "mvp" as const,
    eyebrow: data.mvp?.title ?? "MVP",
    title: item.label ?? (item.players.length ? "Jugador destacado" : "MVP pendiente"),
    leftLabel: "",
    leftValue: "",
    centerValue: "",
    rightLabel: "",
    rightValue: "",
    players: item.players,
    pendingText: item.pendingText,
    detail: item.detail,
  })) ?? []
  return [...mvpCards, ...data.highlights]
}

function calculateHeight(data: RoundSummaryImageData) {
  const displayHighlights = buildDisplayHighlights(data)
  let height = 54 + 254 + 28 + 136 + 26
  height += 42 + Math.max(1, Math.ceil(data.results.length / 2)) * (resultHeight() + 12) + 18
  height += 42
  if (displayHighlights.length) {
    for (let index = 0; index < displayHighlights.length; index += 2) {
      height += Math.max(...displayHighlights.slice(index, index + 2).map(highlightHeight)) + 12
    }
  } else height += 82
  if (data.ranking.length > 0) {
    height += 18 + 42 + 64 + data.ranking.length * 66
  }
  height += 96
  return Math.ceil(height)
}

function drawHeader({
  context,
  data,
  leagueLogo,
}: {
  context: CanvasRenderingContext2D
  data: RoundSummaryImageData
  leagueLogo: HTMLImageElement | null
}) {
  const y = 54
  const height = 254
  fillRoundedRect(context, PADDING, y, CONTENT_WIDTH, height, 38, palette.accent)

  context.save()
  roundedRect(context, PADDING, y, CONTENT_WIDTH, height, 38)
  context.clip()
  context.strokeStyle = "rgba(255, 255, 255, 0.075)"
  context.lineWidth = 3
  context.beginPath()
  context.arc(PADDING + CONTENT_WIDTH - 36, y + height + 10, 248, Math.PI, Math.PI * 1.65)
  context.stroke()
  context.beginPath()
  context.moveTo(PADDING + CONTENT_WIDTH * 0.55, y - 20)
  context.lineTo(PADDING + CONTENT_WIDTH + 40, y + height * 0.65)
  context.stroke()
  context.restore()

  const textLeft = PADDING + 30
  const logoTop = y + 18
  const logoBottomMargin = 18
  const logoMaxHeight = leagueLogo ? height - (logoTop - y) - logoBottomMargin : 0
  const logoAspect = leagueLogo ? leagueLogo.naturalWidth / Math.max(1, leagueLogo.naturalHeight) : 1
  const leagueLogoWidth = leagueLogo ? logoMaxHeight * logoAspect : 0
  const leagueLogoX = PADDING + CONTENT_WIDTH - leagueLogoWidth - 18
  if (leagueLogo) {
    drawTransparentImageContain({ context, image: leagueLogo, x: leagueLogoX, y: logoTop, width: leagueLogoWidth, height: logoMaxHeight, withShadow: true })
  }

  const textRight = leagueLogo ? leagueLogoX - 18 : PADDING + CONTENT_WIDTH - 30
  const titleWidth = Math.max(240, textRight - textLeft)

  drawText(context, `RESUMEN DE JORNADA ${data.round}`, textLeft, y + 38, {
    size: 15,
    weight: 900,
    color: palette.inverseMuted,
    baseline: "middle",
    maxWidth: titleWidth,
  })

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
  drawTextLines({ context, lines: leagueLayout.lines, x: textLeft, y: y + 84, width: titleWidth, height: 48, lineHeight: leagueLayout.lineHeight })

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
  drawTextLines({ context, lines: seasonLayout.lines, x: textLeft, y: y + 136, width: titleWidth, height: 84, lineHeight: seasonLayout.lineHeight })
}

function drawStatusCard(context: CanvasRenderingContext2D, data: RoundSummaryImageData, y: number) {
  drawCard(context, PADDING, y, CONTENT_WIDTH, 136)
  if (data.dateRange) {
    drawText(context, data.dateRange, PADDING + 28, y + 28, { size: 15, weight: 700, color: palette.muted, baseline: "middle" })
  }
  const metrics = [
    [`${data.metrics.finishedMatches}/${data.metrics.totalMatches}`, "Partidos"],
    [String(data.metrics.totalSets), "Sets"],
    [String(data.metrics.totalGames), "Juegos"],
  ]
  const boxWidth = (CONTENT_WIDTH - 56 - 24) / 3
  metrics.forEach(([value, label], index) => {
    const x = PADDING + 28 + index * (boxWidth + 12)
    fillRoundedRect(context, x, y + 48, boxWidth, 64, 15, palette.surfaceAlt)
    drawText(context, value, x + boxWidth / 2, y + 72, { size: 23, weight: 900, align: "center", baseline: "middle" })
    drawText(context, label, x + boxWidth / 2, y + 96, { size: 12, weight: 800, color: palette.muted, align: "center", baseline: "middle" })
  })
}

function getResultPoints(result: RoundSummaryImageResult, side: "A" | "B") {
  const explicit = side === "A" ? result.pointsA : result.pointsB
  if (explicit !== null) return explicit
  return result.sets.filter((set) => side === "A" ? set.a > set.b : set.b > set.a).length
}

function drawResultCard(context: CanvasRenderingContext2D, result: RoundSummaryImageResult, x: number, y: number, width: number, images: Map<string, HTMLImageElement | null>) {
  drawCard(context, x, y, width, resultHeight())
  drawText(context, result.meta ?? "Fecha y lugar pendientes", x + 20, y + 26, {
    size: 14,
    weight: 700,
    color: palette.muted,
    baseline: "middle",
    maxWidth: width - 40,
  })
  context.fillStyle = palette.line
  context.fillRect(x + 20, y + 44, width - 40, 1)

  const teamAreaWidth = width * 0.36
  const centerWidth = width * 0.16
  const leftX = x + 20
  const centerX = x + teamAreaWidth + 20
  const rightX = x + width - 20 - teamAreaWidth
  const firstRowCenterY = y + 72
  const rowGap = 28
  const avatarSize = 22

  ;[[result.teamA, leftX, "left"], [result.teamB, rightX + teamAreaWidth, "right"]].forEach(([players, textX, align]) => {
    ;(players as RoundSummaryImagePerson[]).slice(0, 2).forEach((player, index) => {
      const rowY = firstRowCenterY + index * rowGap
      const avatarX = align === "left" ? (textX as number) : (textX as number) - teamAreaWidth
      drawAvatar({
        context,
        person: player,
        image: player.avatarUrl ? images.get(player.avatarUrl) ?? null : null,
        x: align === "left" ? avatarX : avatarX + teamAreaWidth - avatarSize,
        y: rowY - avatarSize / 2,
        size: avatarSize,
      })
      drawText(
        context,
        truncateText(context, player.name, teamAreaWidth - avatarSize - 10, "900 15px Arial, sans-serif"),
        align === "left" ? avatarX + avatarSize + 8 : avatarX + teamAreaWidth - avatarSize - 8,
        rowY,
        {
          size: 15,
          weight: 900,
          align: align as CanvasTextAlign,
          baseline: "middle",
        },
      )
    })
  })

  drawText(context, `${getResultPoints(result, "A")} – ${getResultPoints(result, "B")}`, centerX + centerWidth / 2, y + 78, {
    size: 25,
    weight: 900,
    color: palette.success,
    align: "center",
    baseline: "middle",
  })

  const sets = result.sets.length ? result.sets.map((set) => `${set.a}-${set.b}`).join("   ·   ") : "Sin resultado registrado"
  drawText(context, sets, centerX + centerWidth / 2, y + 121, {
    size: 13,
    weight: 800,
    color: palette.muted,
    align: "center",
    baseline: "middle",
    maxWidth: width - 44,
  })
}

function drawHighlightCard(context: CanvasRenderingContext2D, item: RoundSummaryImageHighlight, x: number, y: number, width: number, images: Map<string, HTMLImageElement | null>) {
  if (item.variant === "mvp") {
    const height = highlightHeight(item)
    drawCard(context, x, y, width, height)
    drawText(context, item.eyebrow.toUpperCase(), x + 20, y + 24, { size: 11, weight: 900, color: palette.muted })
    drawText(context, truncateText(context, item.title, width - 40, "900 18px Arial, sans-serif"), x + 20, y + 48, { size: 18, weight: 900 })
    if (item.players?.length) {
      const avatarSize = 40
      item.players.slice(0, 2).forEach((player, index) => {
        const rowX = x + 20 + index * Math.min(240, width / 2 - 28)
        drawAvatar({ context, person: player, image: player.avatarUrl ? images.get(player.avatarUrl) ?? null : null, x: rowX, y: y + 68, size: avatarSize })
        drawText(context, truncateText(context, player.name, 160, "900 17px Arial, sans-serif"), rowX + 52, y + 84, { size: 17, weight: 900, baseline: "middle", maxWidth: 160 })
        drawText(context, "Jugador destacado", rowX + 52, y + 105, { size: 12, weight: 800, color: palette.muted, baseline: "middle", maxWidth: 160 })
      })
    } else {
      drawText(context, item.pendingText ?? "Pendiente", x + 20, y + 88, { size: 17, weight: 800, color: palette.muted, baseline: "middle", maxWidth: width - 40 })
    }
    if (item.detail) drawText(context, item.detail, x + width - 20, y + height - 18, { size: 12, weight: 700, color: palette.muted, align: "right", baseline: "middle", maxWidth: width - 40 })
    return
  }

  drawCard(context, x, y, width, highlightHeight(item))
  drawText(context, item.eyebrow.toUpperCase(), x + 20, y + 24, { size: 11, weight: 900, color: palette.muted })
  drawText(context, truncateText(context, item.title, width - 40, "900 18px Arial, sans-serif"), x + 20, y + 48, { size: 18, weight: 900 })
  let comparisonY = y + 82
  if (item.teamA && item.teamB) {
    const teamWidth = Math.max(108, (width - 150) / 2)
    ;[[item.teamA, x + 20, "left"], [item.teamB, x + width - 20, "right"]].forEach(([names, textX, align]) => {
      ;(names as string[]).slice(0, 2).forEach((name, index) =>
        drawText(context, truncateText(context, name, teamWidth, "900 15px Arial, sans-serif"), textX as number, y + 78 + index * 21, {
          size: 15,
          weight: 900,
          align: align as CanvasTextAlign,
          baseline: "middle",
        }),
      )
    })
    if (item.score) {
      drawText(context, item.score, x + width / 2, y + 88, {
        size: 26,
        weight: 900,
        color: palette.success,
        align: "center",
        baseline: "middle",
      })
    }
    comparisonY = y + 122
  }
  context.save(); context.strokeStyle = palette.line; context.lineWidth = 1; context.beginPath(); context.moveTo(x + 20, comparisonY - 10); context.lineTo(x + width - 20, comparisonY - 10); context.stroke(); context.restore()
  drawText(context, item.leftLabel.toUpperCase(), x + 20, comparisonY + 2, { size: 10, weight: 900, color: palette.muted, baseline: "middle" })
  drawText(context, item.leftValue, x + 20, comparisonY + 25, { size: 15, weight: 900, baseline: "middle", maxWidth: width * 0.34 })
  drawText(context, item.centerValue, x + width / 2, comparisonY + 14, { size: 11, weight: 900, color: palette.muted, align: "center", baseline: "middle", maxWidth: width * 0.26 })
  if (item.rightValue || item.rightLabel) {
    drawText(context, item.rightLabel.toUpperCase(), x + width - 20, comparisonY + 2, { size: 10, weight: 900, color: palette.muted, align: "right", baseline: "middle" })
    drawText(context, item.rightValue, x + width - 20, comparisonY + 25, { size: 15, weight: 900, align: "right", baseline: "middle", maxWidth: width * 0.34 })
  }
}

function drawRanking({
  context,
  data,
  y,
  images,
}: {
  context: CanvasRenderingContext2D
  data: RoundSummaryImageData
  y: number
  images: Map<string, HTMLImageElement | null>
}) {
  const headerHeight = 64
  const rowHeight = 66
  const height = headerHeight + Math.max(1, data.ranking.length) * rowHeight
  fillRoundedRect(context, PADDING, y, CONTENT_WIDTH, height, 24, palette.surface)
  context.save()
  roundedRect(context, PADDING, y, CONTENT_WIDTH, height, 24)
  context.clip()
  fillRoundedRect(context, PADDING, y, CONTENT_WIDTH, headerHeight, 24, palette.accent)
  context.fillStyle = palette.accent
  context.fillRect(PADDING, y + 34, CONTENT_WIDTH, 30)

  const nameX = PADDING + 96
  const movementX = PADDING + CONTENT_WIDTH - 250
  const diffX = PADDING + CONTENT_WIDTH - 135
  const pointsX = PADDING + CONTENT_WIDTH - 30
  drawText(context, "POS", PADDING + 32, y + 32, { size: 11, weight: 900, color: palette.inverseText, align: "center", baseline: "middle" })
  drawText(context, "JUGADOR", nameX, y + 32, { size: 11, weight: 900, color: palette.inverseText, baseline: "middle" })
  drawText(context, "MOV", movementX, y + 32, { size: 11, weight: 900, color: palette.inverseText, align: "center", baseline: "middle" })
  drawText(context, "DIF", diffX, y + 32, { size: 11, weight: 900, color: palette.inverseText, align: "right", baseline: "middle" })
  drawText(context, "PTS", pointsX, y + 32, { size: 11, weight: 900, color: palette.inverseText, align: "right", baseline: "middle" })

  if (!data.ranking.length) drawText(context, data.rankingEmptyText ?? "No ha habido cambios de posición tras la jornada.", WIDTH / 2, y + headerHeight + rowHeight / 2, { size: 17, weight: 800, color: palette.muted, align: "center", baseline: "middle", maxWidth: CONTENT_WIDTH - 48 })

  data.ranking.forEach((player, index) => {
    const rowY = y + headerHeight + index * rowHeight
    if (index % 2 === 1) {
      context.fillStyle = "#f7f8f6"
      context.fillRect(PADDING + 1, rowY, CONTENT_WIDTH - 2, rowHeight)
    }
    if (index > 0) {
      context.save()
      context.strokeStyle = palette.line
      context.beginPath()
      context.moveTo(PADDING + 24, rowY)
      context.lineTo(PADDING + CONTENT_WIDTH - 24, rowY)
      context.stroke()
      context.restore()
    }
    drawText(context, String(player.position), PADDING + 32, rowY + rowHeight / 2, { size: 17, weight: 900, align: "center", baseline: "middle" })
    const avatarSize = 38
    drawAvatar({ context, person: player, image: player.avatarUrl ? images.get(player.avatarUrl) ?? null : null, x: PADDING + 62, y: rowY + 14, size: avatarSize })
    const name = truncateText(context, player.name, 430, "900 18px Arial, sans-serif")
    drawText(context, name, nameX + 18, rowY + rowHeight / 2, { size: 18, weight: 900, baseline: "middle" })
    const movementColor = player.movement.startsWith("▲") ? palette.success : player.movement.startsWith("▼") ? palette.danger : palette.muted
    drawText(context, player.movement, movementX, rowY + rowHeight / 2, { size: 14, weight: 900, color: movementColor, align: "center", baseline: "middle" })
    drawText(context, `${player.gamesDiff > 0 ? "+" : ""}${player.gamesDiff}`, diffX, rowY + rowHeight / 2, { size: 16, weight: 900, align: "right", baseline: "middle" })
    drawText(context, String(player.points), pointsX, rowY + rowHeight / 2, { size: 18, weight: 900, align: "right", baseline: "middle" })
  })

  context.restore()
  strokeRoundedRect(context, PADDING, y, CONTENT_WIDTH, height, 24, palette.line)
}

function drawBrandMark(context: CanvasRenderingContext2D, appIcon: HTMLImageElement | null, x: number, y: number, size: number) {
  if (appIcon) {
    drawImageCover({ context, image: appIcon, x, y, size, radius: Math.round(size * 0.24) })
    return
  }
  fillRoundedRect(context, x, y, size, size, Math.round(size * 0.24), palette.surface)
  drawText(context, "S&L", x + size / 2, y + size / 2 + 1, { size: Math.round(size * 0.28), weight: 900, color: palette.accent, align: "center", baseline: "middle" })
}

function drawFooter(context: CanvasRenderingContext2D, canvasHeight: number, appIcon: HTMLImageElement | null) {
  const iconSize = 52
  const textBlockWidth = 132
  const groupWidth = iconSize + 16 + textBlockWidth
  const x = (WIDTH - groupWidth) / 2
  const y = canvasHeight - 84
  drawBrandMark(context, appIcon, x, y, iconSize)
  drawText(context, "Creado con", x + iconSize + 16, y + 18, { size: 15, weight: 700, color: palette.muted, baseline: "middle" })
  drawText(context, "Smash & Lob", x + iconSize + 16, y + 40, { size: 21, weight: 900, baseline: "middle" })
}

export async function createRoundSummaryImage(data: RoundSummaryImageData) {
  const canvasHeight = calculateHeight(data)
  const { canvas, context } = createCanvas(canvasHeight)
  const leagueLogo = await loadOptionalImage(data.leagueLogoUrl)
  const appIcon = await loadOptionalImage(APP_ICON_PATH)

  const people = [
    ...(data.results.flatMap((result) => [...result.teamA, ...result.teamB])),
    ...(data.mvp?.items.flatMap((item) => item.players) ?? []),
    ...buildDisplayHighlights(data).flatMap((item) => item.players ?? []),
    ...data.ranking,
  ]
  const urls = [...new Set(people.map((person) => person.avatarUrl).filter((url): url is string => Boolean(url)))]
  const loaded = await Promise.all(urls.map(async (url) => [url, await loadOptionalImage(url)] as const))
  const images = new Map<string, HTMLImageElement | null>(loaded)

  drawHeader({ context, data, leagueLogo })
  let y = 54 + 254 + 28
  drawStatusCard(context, data, y)
  y += 136 + 26

  sectionTitle(context, "Resultados", y + 14)
  y += 42
  const resultCardWidth = (CONTENT_WIDTH - GRID_GAP) / 2
  data.results.forEach((result, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    drawResultCard(context, result, PADDING + column * (resultCardWidth + GRID_GAP), y + row * (resultHeight() + 12), resultCardWidth, images)
  })
  y += Math.max(1, Math.ceil(data.results.length / 2)) * (resultHeight() + 12) - 4

  const displayHighlights = buildDisplayHighlights(data)
  sectionTitle(context, "Lo más destacado", y + 14)
  y += 42
  if (displayHighlights.length) {
    const highlightCardWidth = (CONTENT_WIDTH - GRID_GAP) / 2
    for (let index = 0; index < displayHighlights.length; index += 2) {
      const rowItems = displayHighlights.slice(index, index + 2)
      const rowY = y
      rowItems.forEach((highlight, rowIndex) => {
        drawHighlightCard(context, highlight, PADDING + rowIndex * (highlightCardWidth + GRID_GAP), rowY, highlightCardWidth, images)
      })
      y += Math.max(...rowItems.map((item) => highlightHeight(item))) + 12
    }
  } else {
    drawCard(context, PADDING, y, CONTENT_WIDTH, 82)
    drawText(context, data.highlightsPendingText ?? "No hay un dato destacado adicional para esta jornada.", PADDING + 24, y + 41, { size: 17, weight: 800, color: palette.muted, baseline: "middle", maxWidth: CONTENT_WIDTH - 48 })
    y += 94
  }
  y += 8

  if (data.ranking.length > 0) {
    sectionTitle(context, data.rankingTitle, y + 14)
    y += 42
    drawRanking({ context, data, y, images })
  }
  drawFooter(context, canvasHeight, appIcon)

  return canvasToBlob(canvas)
}

export function downloadRoundSummaryImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
