import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import type { RankingPlayer } from "@/lib/ranking"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

type ExportBranding = {
  leagueName: string
  seasonName: string
  leagueLogoUrl?: string | null
  includeLeagueLogo?: boolean
  includePlayerImages?: boolean
}

export type SeasonCalendarImageMode = "current" | "fixtures"

type CanvasPalette = {
  background: string
  surface: string
  surfaceAlt: string
  text: string
  muted: string
  line: string
  accent: string
  accentSoft: string
  inverseText: string
  inverseMuted: string
  gold: string
  silver: string
  bronze: string
  success: string
}

type DrawPlayerAvatarOptions = {
  context: CanvasRenderingContext2D
  playerName: string
  avatarUrl?: string | null
  avatarInitials?: string | null
  image: HTMLImageElement | null
  x: number
  y: number
  size: number
  radius?: number
  includeImage: boolean
}

const WIDTH = 1080
const PADDING = 54
const CONTENT_WIDTH = WIDTH - PADDING * 2
const APP_ICON_PATH = "/icon-192.png"
const HEADER_HEIGHT = 244
const HEADER_TOP = 34
const CONTENT_TOP = HEADER_TOP + HEADER_HEIGHT + 28
const FOOTER_HEIGHT = 80
const FOOTER_BOTTOM = 30

const palette: CanvasPalette = {
  background: "#f4f5f2",
  surface: "#ffffff",
  surfaceAlt: "#edf1ec",
  text: "#162018",
  muted: "#6e766f",
  line: "#dde3dc",
  accent: "#19211b",
  accentSoft: "#314034",
  inverseText: "#ffffff",
  inverseMuted: "#cfd7cf",
  gold: "#c79a2b",
  silver: "#8f9892",
  bronze: "#ab7249",
  success: "#2f6f4e",
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

function drawCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 28,
) {
  context.save()
  context.shadowColor = "rgba(12, 20, 14, 0.08)"
  context.shadowBlur = 24
  context.shadowOffsetY = 10
  fillRoundedRect(context, x, y, width, height, radius, palette.surface)
  context.restore()
  strokeRoundedRect(context, x, y, width, height, radius, palette.line)
}

function createCanvas(height: number) {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("canvas_not_available")
  }

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

function safeFilenamePart(value: string) {
  return (
    value
      .trim()
      .toLocaleLowerCase("es-ES")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "smash-lob"
  )
}

function truncateText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  if (context.measureText(value).width <= maxWidth) {
    return value
  }

  let visible = value
  while (
    visible.length > 1 &&
    context.measureText(`${visible.trimEnd()}…`).width > maxWidth
  ) {
    visible = visible.slice(0, -1)
  }

  return `${visible.trimEnd()}…`
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
    maxWidth?: number
    baseline?: CanvasTextBaseline
  },
) {
  context.font = `${options.weight ?? 700} ${options.size}px Arial, sans-serif`
  context.fillStyle = options.color ?? palette.text
  context.textAlign = options.align ?? "left"
  context.textBaseline = options.baseline ?? "alphabetic"
  const text = options.maxWidth
    ? truncateText(context, value, options.maxWidth)
    : value
  context.fillText(text, x, y)
}

function drawTextCenteredInBox(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    size: number
    weight?: number
    color?: string
    maxWidth?: number
  },
) {
  drawText(context, value, x + width / 2, y + height / 2, {
    size: options.size,
    weight: options.weight,
    color: options.color,
    maxWidth: options.maxWidth ?? Math.max(0, width - 8),
    align: "center",
    baseline: "middle",
  })
}

function getInitials(value: string, fallback = "SL") {
  const words = value.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return fallback
  }

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

function drawGenericUserGlyph({
  context,
  x,
  y,
  size,
  color,
}: {
  context: CanvasRenderingContext2D
  x: number
  y: number
  size: number
  color: string
}) {
  const centerX = x + size / 2

  context.save()
  context.fillStyle = color
  context.beginPath()
  context.arc(centerX, y + size * 0.35, size * 0.17, 0, Math.PI * 2)
  context.fill()

  context.beginPath()
  context.moveTo(x + size * 0.18, y + size * 0.82)
  context.quadraticCurveTo(x + size * 0.24, y + size * 0.58, centerX, y + size * 0.58)
  context.quadraticCurveTo(x + size * 0.76, y + size * 0.58, x + size * 0.82, y + size * 0.82)
  context.lineTo(x + size * 0.18, y + size * 0.82)
  context.fill()
  context.restore()
}

function drawPlayerAvatar({
  context,
  playerName,
  avatarUrl,
  avatarInitials,
  image,
  x,
  y,
  size,
  radius = Math.round(size * 0.36),
  includeImage,
}: DrawPlayerAvatarOptions) {
  if (includeImage && image && isSafeImageUrl(avatarUrl)) {
    drawImageCover({
      context,
      image,
      x,
      y,
      width: size,
      height: size,
      radius,
      background: palette.surfaceAlt,
    })
    return
  }

  fillRoundedRect(context, x, y, size, size, radius, palette.surfaceAlt)

  if (includeImage) {
    drawGenericUserGlyph({
      context,
      x,
      y,
      size,
      color: "#6d756f",
    })
    return
  }

  drawText(context, avatarInitials || getInitials(playerName), x + size / 2, y + size / 2 + 1, {
    size: Math.max(12, Math.round(size * 0.34)),
    weight: 900,
    color: palette.text,
    align: "center",
    baseline: "middle",
  })
}

function formatScheduledAt(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getMatchStatusLabel(match: MatchData) {
  if (match.status === "finished") {
    return match.rankingCounts === false ? "Finalizado · no puntúa" : "Finalizado"
  }

  if (match.status === "postponed") {
    return "Aplazado"
  }

  if (match.status === "scheduled") {
    return "Programado"
  }

  return "Pendiente"
}

function getMatchStatusColor(match: MatchData) {
  if (match.status === "finished") {
    return { background: "#e9f5ee", text: palette.success }
  }

  if (match.status === "postponed") {
    return { background: "#fff1d9", text: "#9a6400" }
  }

  if (match.status === "scheduled") {
    return { background: "#edf1ff", text: "#4059ab" }
  }

  return { background: palette.surfaceAlt, text: palette.muted }
}

function getMatchScore(match: MatchData) {
  if (match.status !== "finished") {
    return "VS"
  }

  const pointsA = match.pointsA ?? match.sets.filter((set) => set.a > set.b).length
  const pointsB = match.pointsB ?? match.sets.filter((set) => set.b > set.a).length
  return `${pointsA} – ${pointsB}`
}

function formatSetScores(match: MatchData) {
  if (match.sets.length === 0) {
    return null
  }

  return match.sets.map((set) => `${set.a}-${set.b}`).join("   ·   ")
}

async function drawHeader({
  context,
  leagueName,
  seasonName,
  leagueLogo,
  label,
}: {
  context: CanvasRenderingContext2D
  leagueName: string
  seasonName: string
  leagueLogo: HTMLImageElement | null
  label: string
}) {
  fillRoundedRect(context, PADDING, HEADER_TOP, CONTENT_WIDTH, HEADER_HEIGHT, 38, palette.accent)

  context.save()
  roundedRect(context, PADDING, HEADER_TOP, CONTENT_WIDTH, HEADER_HEIGHT, 38)
  context.clip()
  context.strokeStyle = "rgba(255, 255, 255, 0.08)"
  context.lineWidth = 3
  context.beginPath()
  context.arc(PADDING + CONTENT_WIDTH - 40, HEADER_TOP + HEADER_HEIGHT + 8, 240, Math.PI, Math.PI * 1.65)
  context.stroke()
  context.beginPath()
  context.moveTo(PADDING + CONTENT_WIDTH * 0.56, HEADER_TOP - 24)
  context.lineTo(PADDING + CONTENT_WIDTH + 46, HEADER_TOP + HEADER_HEIGHT * 0.66)
  context.stroke()
  context.restore()

  const textLeft = PADDING + 30
  let textRight = PADDING + CONTENT_WIDTH - 30

  if (leagueLogo) {
    const logoTop = HEADER_TOP + 16
    const logoRightMargin = 18
    const logoBottomMargin = 16
    const logoMaxHeight = HEADER_HEIGHT - (logoTop - HEADER_TOP) - logoBottomMargin
    const logoAspect = leagueLogo.naturalWidth / Math.max(1, leagueLogo.naturalHeight)
    const logoWidth = logoMaxHeight * logoAspect
    const logoX = PADDING + CONTENT_WIDTH - logoWidth - logoRightMargin
    drawTransparentImageContain({
      context,
      image: leagueLogo,
      x: logoX,
      y: logoTop,
      width: logoWidth,
      height: logoMaxHeight,
      withShadow: true,
    })
    textRight = logoX - 18
  }

  const availableWidth = Math.max(280, textRight - textLeft)

  drawText(context, label.toUpperCase(), textLeft, HEADER_TOP + 40, {
    size: 15,
    weight: 900,
    color: palette.inverseMuted,
    baseline: "middle",
    maxWidth: availableWidth,
  })

  drawText(context, leagueName.toUpperCase(), textLeft, HEADER_TOP + 105, {
    size: 24,
    weight: 900,
    color: palette.inverseMuted,
    maxWidth: availableWidth,
  })

  drawText(context, seasonName, textLeft, HEADER_TOP + 180, {
    size: 54,
    weight: 900,
    color: palette.inverseText,
    maxWidth: availableWidth,
  })
}

function drawBrandMark({
  context,
  appIcon,
  x,
  y,
  size,
}: {
  context: CanvasRenderingContext2D
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
  drawText(context, "S&L", x + size / 2, y + size / 2 + 1, {
    size: Math.round(size * 0.28),
    weight: 900,
    color: palette.accent,
    align: "center",
    baseline: "middle",
  })
}

function drawFooter({
  context,
  canvasHeight,
  appIcon,
}: {
  context: CanvasRenderingContext2D
  canvasHeight: number
  appIcon: HTMLImageElement | null
}) {
  const iconSize = 50
  const textBlockWidth = 152
  const groupWidth = iconSize + 16 + textBlockWidth
  const groupX = (WIDTH - groupWidth) / 2
  const groupY = canvasHeight - FOOTER_BOTTOM - FOOTER_HEIGHT + 10

  drawBrandMark({ context, appIcon, x: groupX, y: groupY, size: iconSize })

  drawText(context, "Creado con", groupX + iconSize + 16, groupY + 18, {
    size: 15,
    weight: 700,
    color: palette.muted,
    baseline: "middle",
  })
  drawText(context, "Smash & Lob", groupX + iconSize + 16, groupY + 40, {
    size: 21,
    weight: 900,
    color: palette.text,
    baseline: "middle",
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("image_export_failed"))
        return
      }

      resolve(blob)
    }, "image/png")
  })
}

export function downloadSeasonExportImage(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function drawMatchCard({
  context,
  match,
  players,
  avatarImages,
  x,
  y,
  width,
  includePlayerImages,
  mode,
}: {
  context: CanvasRenderingContext2D
  match: MatchData
  players: Map<string, PlayerProfile>
  avatarImages: Map<string, HTMLImageElement | null>
  x: number
  y: number
  width: number
  includePlayerImages: boolean
  mode: SeasonCalendarImageMode
}) {
  const fixturesOnly = mode === "fixtures"
  const height = fixturesOnly ? 112 : 172
  drawCard(context, x, y, width, height, 26)

  if (!fixturesOnly) {
    const statusPalette = getMatchStatusColor(match)
    const statusLabel = getMatchStatusLabel(match)
    const meta = [
      formatScheduledAt(match.scheduledAt) ?? match.dateLabel,
      getScheduleLocationDisplayText(match.location),
    ]
      .filter(Boolean)
      .join(" · ")

    fillRoundedRect(context, x + 24, y + 22, 174, 30, 15, statusPalette.background)
    drawTextCenteredInBox(context, statusLabel, x + 24, y + 22, 174, 30, {
      size: 14,
      weight: 900,
      color: statusPalette.text,
      maxWidth: 150,
    })
    drawText(context, meta || "Fecha y lugar pendientes", x + width - 24, y + 37, {
      size: 14,
      weight: 700,
      color: palette.muted,
      align: "right",
      baseline: "middle",
      maxWidth: width - 240,
    })

    context.fillStyle = palette.line
    context.fillRect(x + 24, y + 68, width - 48, 1)
  }

  const teamAreaWidth = width * 0.35
  const centerWidth = width * 0.18
  const leftX = x + 24
  const centerX = x + teamAreaWidth + 24
  const rightX = x + width - 24 - teamAreaWidth
  const firstRowCenterY = fixturesOnly ? y + 34 : y + 90
  const rowGap = fixturesOnly ? 38 : 36

  const teams = [
    { ids: match.teamA, x: leftX, align: "left" as const },
    { ids: match.teamB, x: rightX, align: "right" as const },
  ]

  teams.forEach((team) => {
    team.ids.slice(0, 2).forEach((playerId, index) => {
      const profile = players.get(playerId)
      const rowCenterY = firstRowCenterY + index * rowGap
      const avatarSize = 26
      const avatarX = team.align === "left" ? team.x : team.x + teamAreaWidth - avatarSize
      const textX = team.align === "left" ? avatarX + avatarSize + 10 : avatarX - 10
      const maxTextWidth = teamAreaWidth - avatarSize - 14

      drawPlayerAvatar({
        context,
        playerName: profile?.displayName ?? "Jugador",
        avatarUrl: profile?.avatarUrl,
        avatarInitials: profile?.avatarInitials,
        image: avatarImages.get(playerId) ?? null,
        x: avatarX,
        y: rowCenterY - avatarSize / 2,
        size: avatarSize,
        radius: 9,
        includeImage: includePlayerImages,
      })

      drawText(context, profile?.displayName ?? "Jugador", textX, rowCenterY, {
        size: 17,
        weight: 900,
        color: palette.text,
        align: team.align,
        baseline: "middle",
        maxWidth: maxTextWidth,
      })
    })
  })

  drawText(
    context,
    fixturesOnly ? "VS" : getMatchScore(match),
    centerX + centerWidth / 2,
    fixturesOnly ? y + 53 : y + 112,
    {
      size: fixturesOnly ? 23 : match.status === "finished" ? 29 : 24,
      weight: 900,
      color: palette.text,
      align: "center",
      baseline: "middle",
    },
  )

  if (!fixturesOnly) {
    if (match.status === "finished" && match.sets.length > 0) {
      drawText(context, formatSetScores(match) ?? "", centerX + centerWidth / 2, y + 149, {
        size: 15,
        weight: 800,
        color: palette.muted,
        align: "center",
        baseline: "middle",
        maxWidth: width - 60,
      })
    } else {
      drawText(
        context,
        match.status === "postponed"
          ? "Pendiente de nueva fecha"
          : "Sin resultado todavía",
        centerX + centerWidth / 2,
        y + 149,
        {
          size: 14,
          weight: 700,
          color: palette.muted,
          align: "center",
          baseline: "middle",
          maxWidth: width - 60,
        },
      )
    }
  }
}

export async function createSeasonCalendarImage({
  leagueName,
  seasonName,
  leagueLogoUrl,
  includeLeagueLogo = true,
  includePlayerImages = true,
  mode = "current",
  matches,
  players,
}: ExportBranding & {
  mode?: SeasonCalendarImageMode
  matches: MatchData[]
  players: PlayerProfile[]
}) {
  const matchesByRound = new Map<number, MatchData[]>()

  ;[...matches]
    .sort((left, right) => left.round - right.round)
    .forEach((match) => {
      const roundMatches = matchesByRound.get(match.round) ?? []
      roundMatches.push(match)
      matchesByRound.set(match.round, roundMatches)
    })

  const rounds = Array.from(matchesByRound.entries())
  const cardHeight = mode === "fixtures" ? 124 : 184
  const roundHeights = rounds.map(
    ([, roundMatches]) => 50 + Math.ceil(roundMatches.length / 2) * cardHeight,
  )
  const canvasHeight = Math.max(
    760,
    CONTENT_TOP +
      roundHeights.reduce((total, height) => total + height, 0) +
      FOOTER_HEIGHT +
      FOOTER_BOTTOM +
      26,
  )
  const { canvas, context } = createCanvas(canvasHeight)

  const playerImageIds = includePlayerImages
    ? Array.from(
        new Set(
          players
            .filter((player) => isSafeImageUrl(player.avatarUrl))
            .map((player) => player.id),
        ),
      )
    : []
  const [leagueLogo, appIcon, playerImages] = await Promise.all([
    includeLeagueLogo
      ? loadOptionalImage(leagueLogoUrl ?? null)
      : Promise.resolve(null),
    loadOptionalImage(APP_ICON_PATH),
    Promise.all(
      playerImageIds.map(async (playerId) => {
        const player = players.find((item) => item.id === playerId)
        return [playerId, await loadOptionalImage(player?.avatarUrl ?? null)] as const
      }),
    ),
  ])
  const avatarImages = new Map(playerImages)

  await drawHeader({
    context,
    leagueName,
    seasonName,
    leagueLogo,
    label:
      mode === "fixtures"
        ? "Calendario de enfrentamientos"
        : "Calendario actual",
  })

  const playersById = new Map(players.map((player) => [player.id, player]))
  let y = CONTENT_TOP

  for (const [round, roundMatches] of rounds) {
    drawText(context, `JORNADA ${round}`, PADDING, y + 20, {
      size: 20,
      weight: 900,
      color: palette.muted,
      baseline: "middle",
    })
    context.fillStyle = palette.line
    context.fillRect(PADDING + 154, y + 18, CONTENT_WIDTH - 154, 2)
    y += 44

    const cardGap = 18
    const cardWidth = (CONTENT_WIDTH - cardGap) / 2

    for (const [index, match] of roundMatches.entries()) {
      const column = index % 2
      const row = Math.floor(index / 2)
      await drawMatchCard({
        context,
        match,
        players: playersById,
        avatarImages,
        x: PADDING + column * (cardWidth + cardGap),
        y: y + row * cardHeight,
        width: cardWidth,
        includePlayerImages,
        mode,
      })
    }

    y += Math.ceil(roundMatches.length / 2) * cardHeight + 2
  }

  drawFooter({ context, canvasHeight, appIcon })

  return canvasToBlob(canvas)
}

export async function exportSeasonCalendarImage(
  input: Parameters<typeof createSeasonCalendarImage>[0],
) {
  const blob = await createSeasonCalendarImage(input)
  const suffix = input.mode === "fixtures" ? "calendario-enfrentamientos" : "calendario-actual"
  downloadSeasonExportImage(
    blob,
    `${safeFilenamePart(input.leagueName)}-${safeFilenamePart(input.seasonName)}-${suffix}.png`,
  )
}

function drawPodiumCard({
  context,
  player,
  playerImage,
  position,
  x,
  y,
  width,
  includePlayerImages,
}: {
  context: CanvasRenderingContext2D
  player: RankingPlayer
  playerImage: HTMLImageElement | null
  position: number
  x: number
  y: number
  width: number
  includePlayerImages: boolean
}) {
  const accent = position === 1 ? palette.gold : position === 2 ? palette.silver : palette.bronze
  const cardHeight = 156
  const radius = 28
  drawCard(context, x, y, width, cardHeight, radius)
  context.save()
  roundedRect(context, x, y, width, cardHeight, radius)
  context.clip()
  context.fillStyle = accent
  context.fillRect(x, y, 10, cardHeight)
  context.restore()

  drawPlayerAvatar({
    context,
    playerName: player.displayName,
    avatarUrl: player.avatarUrl,
    avatarInitials: player.avatarInitials,
    image: playerImage,
    x: x + 22,
    y: y + 22,
    size: 52,
    radius: 16,
    includeImage: includePlayerImages,
  })

  fillRoundedRect(context, x + width - 58, y + 22, 34, 34, 12, `${accent}22`)
  drawTextCenteredInBox(context, String(position), x + width - 58, y + 22, 34, 34, {
    size: 17,
    weight: 900,
    color: accent,
  })

  drawText(context, player.displayName, x + 86, y + 46, {
    size: 20,
    weight: 900,
    maxWidth: width - 132,
    baseline: "middle",
  })
  drawText(context, `${player.points} PTS`, x + 86, y + 70, {
    size: 15,
    weight: 900,
    color: palette.muted,
    baseline: "middle",
  })
  drawText(context, `${player.wins} victorias`, x + 22, y + 112, {
    size: 15,
    weight: 800,
    color: palette.muted,
    baseline: "middle",
  })
  drawText(context, `Dif. juegos ${player.gamesDiff >= 0 ? "+" : ""}${player.gamesDiff}`, x + width - 22, y + 112, {
    size: 15,
    weight: 800,
    color: palette.muted,
    align: "right",
    baseline: "middle",
  })
}

export async function createSeasonRankingImage({
  leagueName,
  seasonName,
  leagueLogoUrl,
  includeLeagueLogo = true,
  includePlayerImages = true,
  ranking,
}: ExportBranding & {
  ranking: RankingPlayer[]
}) {
  const tableRows = Math.max(ranking.length, 1)
  const tableHeight = 72 + tableRows * 82
  const podiumHeight = ranking.length > 0 ? 168 : 0
  const canvasHeight = CONTENT_TOP + podiumHeight + 28 + tableHeight + FOOTER_HEIGHT + FOOTER_BOTTOM + 34
  const { canvas, context } = createCanvas(canvasHeight)

  const playerImageIds = includePlayerImages
    ? Array.from(new Set(ranking.filter((player) => isSafeImageUrl(player.avatarUrl)).map((player) => player.id)))
    : []
  const [leagueLogo, appIcon, playerImages] = await Promise.all([
    includeLeagueLogo ? loadOptionalImage(leagueLogoUrl ?? null) : Promise.resolve(null),
    loadOptionalImage(APP_ICON_PATH),
    Promise.all(
      playerImageIds.map(async (playerId) => {
        const player = ranking.find((item) => item.id === playerId)
        return [playerId, await loadOptionalImage(player?.avatarUrl ?? null)] as const
      }),
    ),
  ])
  const avatarImages = new Map(playerImages)

  await drawHeader({
    context,
    leagueName,
    seasonName,
    leagueLogo,
    label: "Clasificación de temporada",
  })

  const podium = ranking.slice(0, 3)
  if (podium.length > 0) {
    const podiumGap = 16
    const podiumWidth = (CONTENT_WIDTH - podiumGap * 2) / 3
    podium.forEach((player, index) => {
      drawPodiumCard({
        context,
        player,
        playerImage: avatarImages.get(player.id) ?? null,
        position: index + 1,
        x: PADDING + index * (podiumWidth + podiumGap),
        y: CONTENT_TOP,
        width: podiumWidth,
        includePlayerImages,
      })
    })
  }

  const tableY = CONTENT_TOP + podiumHeight + 10
  drawCard(context, PADDING, tableY, CONTENT_WIDTH, tableHeight, 30)
  fillRoundedRect(context, PADDING, tableY, CONTENT_WIDTH, 72, 30, palette.accent)
  context.fillStyle = palette.accent
  context.fillRect(PADDING, tableY + 42, CONTENT_WIDTH, 30)

  drawText(context, "POS", PADDING + 32, tableY + 36, {
    size: 16,
    weight: 900,
    color: palette.inverseText,
    baseline: "middle",
  })
  drawText(context, "JUGADOR", PADDING + 126, tableY + 36, {
    size: 16,
    weight: 900,
    color: palette.inverseText,
    baseline: "middle",
  })
  const columns = [
    ["PTS", WIDTH - PADDING - 300],
    ["PJ", WIDTH - PADDING - 205],
    ["PG", WIDTH - PADDING - 125],
    ["DG", WIDTH - PADDING - 34],
  ] as const
  columns.forEach(([label, columnX]) => {
    drawText(context, label, columnX, tableY + 36, {
      size: 16,
      weight: 900,
      color: palette.inverseText,
      align: "right",
      baseline: "middle",
    })
  })

  if (ranking.length === 0) {
    drawText(context, "Todavía no hay jugadores en la clasificación", WIDTH / 2, tableY + 118, {
      size: 21,
      weight: 800,
      color: palette.muted,
      align: "center",
      baseline: "middle",
    })
  }

  ranking.forEach((player, index) => {
    const rowY = tableY + 72 + index * 82
    const rowCenterY = rowY + 41
    if (index % 2 === 1) {
      context.fillStyle = "#f7f8f6"
      context.fillRect(PADDING + 1, rowY, CONTENT_WIDTH - 2, 82)
    }
    if (index > 0) {
      context.fillStyle = palette.line
      context.fillRect(PADDING + 24, rowY, CONTENT_WIDTH - 48, 1)
    }

    drawText(context, String(index + 1), PADDING + 46, rowCenterY, {
      size: 23,
      weight: 900,
      align: "center",
      baseline: "middle",
    })

    drawPlayerAvatar({
      context,
      playerName: player.displayName,
      avatarUrl: player.avatarUrl,
      avatarInitials: player.avatarInitials,
      image: avatarImages.get(player.id) ?? null,
      x: PADDING + 84,
      y: rowCenterY - 24,
      size: 48,
      radius: 16,
      includeImage: includePlayerImages,
    })

    drawText(context, player.displayName, PADDING + 148, rowCenterY, {
      size: 22,
      weight: 900,
      maxWidth: CONTENT_WIDTH - 460,
      baseline: "middle",
    })

    const values = [
      [String(player.points), WIDTH - PADDING - 300],
      [String(player.matchesPlayed), WIDTH - PADDING - 205],
      [String(player.wins), WIDTH - PADDING - 125],
      [`${player.gamesDiff >= 0 ? "+" : ""}${player.gamesDiff}`, WIDTH - PADDING - 34],
    ] as const

    values.forEach(([value, columnX], valueIndex) => {
      drawText(context, value, columnX, rowCenterY, {
        size: valueIndex === 0 ? 24 : 20,
        weight: 900,
        color: valueIndex === 0 ? palette.text : palette.muted,
        align: "right",
        baseline: "middle",
      })
    })
  })

  drawFooter({ context, canvasHeight, appIcon })

  return canvasToBlob(canvas)
}

export async function exportSeasonRankingImage(
  input: Parameters<typeof createSeasonRankingImage>[0],
) {
  const blob = await createSeasonRankingImage(input)
  downloadSeasonExportImage(
    blob,
    `${safeFilenamePart(input.leagueName)}-${safeFilenamePart(input.seasonName)}-clasificacion.png`,
  )
}
