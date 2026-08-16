import { normalizeImageUrl } from "@/lib/imageUrl"

export type RoundSummaryImagePerson = {
  name: string
  avatarUrl?: string | null
  avatarInitials?: string | null
}

export type RoundSummaryImageResult = {
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
  statusLabel?: string
}

export type RoundSummaryImageMvpItem = {
  label?: string
  players: RoundSummaryImagePerson[]
  pendingText?: string
  detail?: string
}

export type RoundSummaryImageHighlight = {
  eyebrow: string
  title: string
  leftLabel: string
  leftValue: string
  centerValue: string
  rightLabel: string
  rightValue: string
  teamA?: string[]
  teamB?: string[]
  score?: string
}

export type RoundSummaryImageRankingRow = RoundSummaryImagePerson & {
  position: number
  movement: string
  gamesDiff: number
  points: number
}

export type RoundSummaryImageData = {
  leagueName: string
  seasonName: string
  leagueLogoUrl?: string | null
  round: number
  statusSummary: string
  statusLabel: string
  dateRange?: string | null
  metrics: {
    finishedMatches: number
    totalMatches: number
    totalSets: number
    totalGames: number
  }
  results: RoundSummaryImageResult[]
  mvp?: {
    title: string
    items: RoundSummaryImageMvpItem[]
  } | null
  highlights: RoundSummaryImageHighlight[]
  highlightsPendingText?: string | null
  rankingTitle: string
  ranking: RoundSummaryImageRankingRow[]
}

type Palette = {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  line: string
  accent: string
  inverseText: string
  inverseMuted: string
  success: string
  danger: string
}

const WIDTH = 1080
const PADDING = 54
const CONTENT_WIDTH = WIDTH - PADDING * 2
const APP_ICON_PATH = "/icon-192.png"
const palette: Palette = {
  background: "#f4f5f2",
  surface: "#ffffff",
  surfaceAlt: "#edf1ec",
  text: "#162018",
  muted: "#6e766f",
  line: "#dde3dc",
  accent: "#19211b",
  inverseText: "#ffffff",
  inverseMuted: "#cfd6d1",
  success: "#147a4b",
  danger: "#c13d35",
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.fillStyle = fill
  context.fill()
  context.restore()
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth = 2,
) {
  context.save()
  roundedRect(context, x, y, width, height, radius)
  context.strokeStyle = stroke
  context.lineWidth = lineWidth
  context.stroke()
  context.restore()
}

function drawCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 24,
) {
  fillRoundedRect(context, x, y, width, height, radius, palette.surface)
  strokeRoundedRect(context, x, y, width, height, radius, palette.line)
}

function drawText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  options: {
    size: number
    weight?: number
    color?: string
    align?: CanvasTextAlign
    baseline?: CanvasTextBaseline
    maxWidth?: number
  },
) {
  context.save()
  context.font = `${options.weight ?? 700} ${options.size}px Arial, sans-serif`
  context.fillStyle = options.color ?? palette.text
  context.textAlign = options.align ?? "left"
  context.textBaseline = options.baseline ?? "alphabetic"
  if (options.maxWidth) context.fillText(value, x, y, options.maxWidth)
  else context.fillText(value, x, y)
  context.restore()
}

function truncateText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  font: string,
) {
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
  context.strokeStyle = "rgba(107, 118, 111, 0.08)"
  context.lineWidth = 2
  roundedRect(context, 28, 28, WIDTH - 56, height - 56, 44)
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
}

function resultHeight() {
  return 146
}

function mvpItemHeight(item: RoundSummaryImageMvpItem) {
  return item.players.length > 1 ? 108 : 92
}

function highlightHeight(highlight: RoundSummaryImageHighlight) {
  return highlight.teamA && highlight.teamB ? 174 : 122
}

function calculateHeight(data: RoundSummaryImageData) {
  let height = 54 + 244 + 28
  height += 164 + 30
  height += 42 + data.results.length * (resultHeight() + 12) + 20
  if (data.mvp) {
    height += 42 + data.mvp.items.reduce((total, item) => total + mvpItemHeight(item) + 12, 0) + 20
  }
  height += 42
  if (data.highlights.length) {
    height += data.highlights.reduce((total, item) => total + highlightHeight(item) + 12, 0)
  } else {
    height += 82
  }
  height += 20 + 42 + 54 + data.ranking.length * 66 + 20
  height += 100
  return Math.max(1500, Math.ceil(height))
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
  const height = 244
  fillRoundedRect(context, PADDING, y, CONTENT_WIDTH, height, 38, palette.accent)

  context.save()
  roundedRect(context, PADDING, y, CONTENT_WIDTH, height, 38)
  context.clip()
  context.strokeStyle = "rgba(255, 255, 255, 0.08)"
  context.lineWidth = 3
  context.beginPath()
  context.arc(PADDING + CONTENT_WIDTH - 40, y + height + 8, 240, Math.PI, Math.PI * 1.65)
  context.stroke()
  context.beginPath()
  context.moveTo(PADDING + CONTENT_WIDTH * 0.56, y - 24)
  context.lineTo(PADDING + CONTENT_WIDTH + 46, y + height * 0.66)
  context.stroke()
  context.restore()

  const textLeft = PADDING + 30
  let textRight = PADDING + CONTENT_WIDTH - 30
  if (leagueLogo) {
    const logoTop = y + 16
    const logoHeight = height - 32
    const logoWidth = logoHeight * (leagueLogo.naturalWidth / Math.max(1, leagueLogo.naturalHeight))
    const logoX = PADDING + CONTENT_WIDTH - logoWidth - 18
    drawTransparentImageContain({ context, image: leagueLogo, x: logoX, y: logoTop, width: logoWidth, height: logoHeight, withShadow: true })
    textRight = logoX - 18
  }
  const availableWidth = Math.max(290, textRight - textLeft)

  drawText(context, `RESUMEN DE JORNADA ${data.round}`, textLeft, y + 40, {
    size: 15,
    weight: 900,
    color: palette.inverseMuted,
    baseline: "middle",
    maxWidth: availableWidth,
  })
  drawText(context, data.leagueName.toUpperCase(), textLeft, y + 105, {
    size: 24,
    weight: 900,
    color: palette.inverseMuted,
    maxWidth: availableWidth,
  })
  drawText(context, data.seasonName, textLeft, y + 180, {
    size: 54,
    weight: 900,
    color: palette.inverseText,
    maxWidth: availableWidth,
  })
}

function drawStatusCard(context: CanvasRenderingContext2D, data: RoundSummaryImageData, y: number) {
  drawCard(context, PADDING, y, CONTENT_WIDTH, 164)
  drawText(context, data.statusSummary, PADDING + 28, y + 38, { size: 26, weight: 900 })
  if (data.dateRange) drawText(context, data.dateRange, PADDING + 28, y + 67, { size: 15, weight: 700, color: palette.muted })

  const badgeWidth = Math.max(112, Math.min(190, 44 + data.statusLabel.length * 10))
  fillRoundedRect(context, PADDING + CONTENT_WIDTH - badgeWidth - 26, y + 24, badgeWidth, 38, 19, palette.surfaceAlt)
  drawText(context, data.statusLabel.toUpperCase(), PADDING + CONTENT_WIDTH - badgeWidth / 2 - 26, y + 43, {
    size: 14,
    weight: 900,
    color: palette.text,
    align: "center",
    baseline: "middle",
  })

  const metrics = [
    [`${data.metrics.finishedMatches}/${data.metrics.totalMatches}`, "Partidos"],
    [String(data.metrics.totalSets), "Sets"],
    [String(data.metrics.totalGames), "Juegos"],
  ]
  const boxWidth = (CONTENT_WIDTH - 56 - 24) / 3
  metrics.forEach(([value, label], index) => {
    const x = PADDING + 28 + index * (boxWidth + 12)
    fillRoundedRect(context, x, y + 88, boxWidth, 54, 15, palette.surfaceAlt)
    drawText(context, value, x + boxWidth / 2, y + 108, { size: 21, weight: 900, align: "center", baseline: "middle" })
    drawText(context, label, x + boxWidth / 2, y + 130, { size: 12, weight: 800, color: palette.muted, align: "center", baseline: "middle" })
  })
}

function getResultPoints(result: RoundSummaryImageResult, side: "A" | "B") {
  const explicit = side === "A" ? result.pointsA : result.pointsB
  if (explicit !== null) return explicit
  return result.sets.filter((set) => side === "A" ? set.a > set.b : set.b > set.a).length
}

function drawTeamNames(context: CanvasRenderingContext2D, names: string[], x: number, y: number, width: number, align: CanvasTextAlign) {
  const safeNames = names.length ? names.slice(0, 2) : ["Jugador"]
  safeNames.forEach((name, index) => {
    const font = "800 20px Arial, sans-serif"
    const text = truncateText(context, name, width, font)
    drawText(context, text, x, y + index * 28, { size: 20, weight: 800, color: palette.text, align })
  })
}

function drawResultCard(context: CanvasRenderingContext2D, result: RoundSummaryImageResult, y: number) {
  const height = resultHeight()
  drawCard(context, PADDING, y, CONTENT_WIDTH, height)
  const centerX = WIDTH / 2
  const pointsA = getResultPoints(result, "A")
  const pointsB = getResultPoints(result, "B")

  drawTeamNames(context, result.teamA, PADDING + 26, y + 42, 325, "left")
  drawTeamNames(context, result.teamB, PADDING + CONTENT_WIDTH - 26, y + 42, 325, "right")
  fillRoundedRect(context, centerX - 55, y + 24, 110, 48, 24, palette.accent)
  drawText(context, `${pointsA}–${pointsB}`, centerX, y + 48, { size: 22, weight: 900, color: palette.inverseText, align: "center", baseline: "middle" })

  const sets = result.sets.length ? result.sets.map((set) => `${set.a}-${set.b}`).join("  ·  ") : result.statusLabel ?? "Pendiente"
  drawText(context, sets, centerX, y + 106, { size: 17, weight: 800, color: palette.muted, align: "center", baseline: "middle", maxWidth: CONTENT_WIDTH - 80 })
}

function drawMvpItem({
  context,
  item,
  y,
  images,
}: {
  context: CanvasRenderingContext2D
  item: RoundSummaryImageMvpItem
  y: number
  images: Map<string, HTMLImageElement | null>
}) {
  const height = mvpItemHeight(item)
  drawCard(context, PADDING, y, CONTENT_WIDTH, height)
  const x = PADDING + 24
  if (item.label) {
    drawText(context, item.label.toUpperCase(), x, y + 27, { size: 12, weight: 900, color: palette.muted })
  }

  if (!item.players.length) {
    drawText(context, item.pendingText ?? "Pendiente", x, y + (item.label ? 60 : 46), { size: 18, weight: 800, color: palette.muted })
    return
  }

  const avatarSize = 48
  const playersY = y + (item.label ? 43 : 20)
  item.players.slice(0, 2).forEach((person, index) => {
    const rowX = x + index * 430
    drawAvatar({ context, person, image: person.avatarUrl ? images.get(person.avatarUrl) ?? null : null, x: rowX, y: playersY, size: avatarSize })
    const name = truncateText(context, person.name, 330, "900 19px Arial, sans-serif")
    drawText(context, name, rowX + 62, playersY + 24, { size: 19, weight: 900, baseline: "middle" })
  })
  if (item.detail) drawText(context, item.detail, PADDING + CONTENT_WIDTH - 24, y + height - 18, { size: 12, weight: 700, color: palette.muted, align: "right" })
}

function drawHighlightCard(context: CanvasRenderingContext2D, item: RoundSummaryImageHighlight, y: number) {
  const height = highlightHeight(item)
  drawCard(context, PADDING, y, CONTENT_WIDTH, height)
  drawText(context, item.eyebrow.toUpperCase(), PADDING + 24, y + 27, { size: 12, weight: 900, color: palette.muted })
  const title = truncateText(context, item.title, CONTENT_WIDTH - 48, "900 19px Arial, sans-serif")
  drawText(context, title, PADDING + 24, y + 55, { size: 19, weight: 900 })

  let comparisonY = y + 82
  if (item.teamA && item.teamB) {
    drawTeamNames(context, item.teamA, PADDING + 24, y + 91, 330, "left")
    drawTeamNames(context, item.teamB, PADDING + CONTENT_WIDTH - 24, y + 91, 330, "right")
    if (item.score) {
      fillRoundedRect(context, WIDTH / 2 - 48, y + 74, 96, 38, 19, palette.accent)
      drawText(context, item.score, WIDTH / 2, y + 93, { size: 16, weight: 900, color: palette.inverseText, align: "center", baseline: "middle" })
    }
    comparisonY = y + 131
  }

  context.save()
  context.strokeStyle = palette.line
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(PADDING + 24, comparisonY - 17)
  context.lineTo(PADDING + CONTENT_WIDTH - 24, comparisonY - 17)
  context.stroke()
  context.restore()

  drawText(context, item.leftLabel.toUpperCase(), PADDING + 24, comparisonY, { size: 10, weight: 900, color: palette.muted, baseline: "middle" })
  drawText(context, item.leftValue, PADDING + 24, comparisonY + 22, { size: 16, weight: 900, baseline: "middle" })
  drawText(context, item.centerValue, WIDTH / 2, comparisonY + 11, { size: 12, weight: 900, color: palette.muted, align: "center", baseline: "middle" })
  if (item.rightValue || item.rightLabel) {
    drawText(context, item.rightLabel.toUpperCase(), PADDING + CONTENT_WIDTH - 24, comparisonY, { size: 10, weight: 900, color: palette.muted, align: "right", baseline: "middle" })
    drawText(context, item.rightValue, PADDING + CONTENT_WIDTH - 24, comparisonY + 22, { size: 16, weight: 900, align: "right", baseline: "middle" })
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
  const headerHeight = 54
  const rowHeight = 66
  const height = headerHeight + data.ranking.length * rowHeight
  drawCard(context, PADDING, y, CONTENT_WIDTH, height)
  fillRoundedRect(context, PADDING, y, CONTENT_WIDTH, headerHeight, 24, palette.surfaceAlt)
  context.save()
  context.fillStyle = palette.surfaceAlt
  context.fillRect(PADDING, y + 28, CONTENT_WIDTH, 26)
  context.restore()

  const nameX = PADDING + 96
  const movementX = PADDING + CONTENT_WIDTH - 250
  const diffX = PADDING + CONTENT_WIDTH - 135
  const pointsX = PADDING + CONTENT_WIDTH - 30
  drawText(context, "POS", PADDING + 32, y + 28, { size: 11, weight: 900, color: palette.muted, align: "center", baseline: "middle" })
  drawText(context, "JUGADOR", nameX, y + 28, { size: 11, weight: 900, color: palette.muted, baseline: "middle" })
  drawText(context, "MOV", movementX, y + 28, { size: 11, weight: 900, color: palette.muted, align: "center", baseline: "middle" })
  drawText(context, "DIF", diffX, y + 28, { size: 11, weight: 900, color: palette.muted, align: "right", baseline: "middle" })
  drawText(context, "PTS", pointsX, y + 28, { size: 11, weight: 900, color: palette.muted, align: "right", baseline: "middle" })

  data.ranking.forEach((player, index) => {
    const rowY = y + headerHeight + index * rowHeight
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
  const iconSize = 50
  const textBlockWidth = 152
  const groupWidth = iconSize + 16 + textBlockWidth
  const x = (WIDTH - groupWidth) / 2
  const y = canvasHeight - 82
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
    ...(data.mvp?.items.flatMap((item) => item.players) ?? []),
    ...data.ranking,
  ]
  const urls = [...new Set(people.map((person) => person.avatarUrl).filter((url): url is string => Boolean(url)))]
  const loaded = await Promise.all(urls.map(async (url) => [url, await loadOptionalImage(url)] as const))
  const images = new Map<string, HTMLImageElement | null>(loaded)

  drawHeader({ context, data, leagueLogo })
  let y = 54 + 244 + 28
  drawStatusCard(context, data, y)
  y += 164 + 30

  sectionTitle(context, "Resultados", y + 14)
  y += 42
  data.results.forEach((result) => {
    drawResultCard(context, result, y)
    y += resultHeight() + 12
  })
  y += 8

  if (data.mvp) {
    sectionTitle(context, data.mvp.title, y + 14)
    y += 42
    data.mvp.items.forEach((item) => {
      drawMvpItem({ context, item, y, images })
      y += mvpItemHeight(item) + 12
    })
    y += 8
  }

  sectionTitle(context, "Lo más destacado", y + 14)
  y += 42
  if (data.highlights.length) {
    data.highlights.forEach((highlight) => {
      drawHighlightCard(context, highlight, y)
      y += highlightHeight(highlight) + 12
    })
  } else {
    drawCard(context, PADDING, y, CONTENT_WIDTH, 82)
    drawText(context, data.highlightsPendingText ?? "No hay un dato destacado adicional para esta jornada.", PADDING + 24, y + 41, { size: 17, weight: 800, color: palette.muted, baseline: "middle", maxWidth: CONTENT_WIDTH - 48 })
    y += 94
  }
  y += 8

  sectionTitle(context, data.rankingTitle, y + 14)
  y += 42
  drawRanking({ context, data, y, images })
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
