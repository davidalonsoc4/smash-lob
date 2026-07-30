import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import type { RankingPlayer } from "@/lib/ranking"

type ExportBranding = {
  leagueName: string
  seasonName: string
  leagueLogoUrl?: string | null
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
  gold: string
  silver: string
  bronze: string
}

const WIDTH = 1080
const PADDING = 54
const CONTENT_WIDTH = WIDTH - PADDING * 2
const APP_ICON_PATH = "/icon-192.png"

const palette: CanvasPalette = {
  background: "#f4f5f2",
  surface: "#ffffff",
  surfaceAlt: "#eef0eb",
  text: "#151715",
  muted: "#697069",
  line: "#dfe3dc",
  accent: "#111311",
  accentSoft: "#dce2db",
  gold: "#c79a2b",
  silver: "#8c9691",
  bronze: "#a96f45",
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
  radius = 26,
) {
  context.save()
  context.shadowColor = "rgba(21, 23, 21, 0.08)"
  context.shadowBlur = 24
  context.shadowOffsetY = 10
  fillRoundedRect(context, x, y, width, height, radius, palette.surface)
  context.restore()
  strokeRoundedRect(context, x, y, width, height, radius, palette.line)
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
  },
) {
  context.font = `${options.weight ?? 700} ${options.size}px Arial, sans-serif`
  context.fillStyle = options.color ?? palette.text
  context.textAlign = options.align ?? "left"
  context.textBaseline = "alphabetic"
  const text = options.maxWidth
    ? truncateText(context, value, options.maxWidth)
    : value
  context.fillText(text, x, y)
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return "SL"
  }

  return `${words[0]?.[0] ?? ""}${words.at(-1)?.[0] ?? ""}`.toUpperCase()
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

  return { canvas, context }
}

async function loadImage(url: string | null | undefined) {
  if (!url) {
    return null
  }

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  radius: number,
) {
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const offsetX = x + (size - width) / 2
  const offsetY = y + (size - height) / 2

  context.save()
  roundedRect(context, x, y, size, size, radius)
  context.clip()
  context.drawImage(image, offsetX, offsetY, width, height)
  context.restore()
}

async function drawHeader({
  context,
  branding,
  label,
}: {
  context: CanvasRenderingContext2D
  branding: ExportBranding
  label: string
}) {
  fillRoundedRect(context, PADDING, 42, CONTENT_WIDTH, 190, 34, palette.accent)

  const [leagueLogo, appIcon] = await Promise.all([
    loadImage(branding.leagueLogoUrl),
    loadImage(APP_ICON_PATH),
  ])
  const logoX = PADDING + 34
  const logoY = 77
  const logoSize = 120

  if (leagueLogo) {
    fillRoundedRect(
      context,
      logoX,
      logoY,
      logoSize,
      logoSize,
      26,
      "#ffffff",
    )
    drawCoverImage(context, leagueLogo, logoX + 8, logoY + 8, logoSize - 16, 20)
  } else {
    fillRoundedRect(
      context,
      logoX,
      logoY,
      logoSize,
      logoSize,
      26,
      "#ffffff",
    )
    drawText(context, getInitials(branding.leagueName), logoX + logoSize / 2, logoY + 76, {
      size: 42,
      weight: 900,
      color: palette.accent,
      align: "center",
    })
  }

  drawText(context, label.toUpperCase(), PADDING + 184, 91, {
    size: 20,
    weight: 900,
    color: "#bfc6bf",
    maxWidth: 610,
  })
  drawText(context, branding.leagueName, PADDING + 184, 139, {
    size: 40,
    weight: 900,
    color: "#ffffff",
    maxWidth: 690,
  })
  drawText(context, branding.seasonName, PADDING + 184, 181, {
    size: 25,
    weight: 800,
    color: "#d8ddd8",
    maxWidth: 690,
  })

  if (appIcon) {
    drawCoverImage(context, appIcon, WIDTH - PADDING - 56, 74, 42, 12)
  }
}

function drawFooter(
  context: CanvasRenderingContext2D,
  canvasHeight: number,
) {
  drawText(context, "Creado con Smash & Lob", WIDTH / 2, canvasHeight - 45, {
    size: 19,
    weight: 800,
    color: palette.muted,
    align: "center",
  })
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("image_export_failed"))
        return
      }

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      resolve()
    }, "image/png")
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

  return "Pendiente de programar"
}

function getMatchScore(match: MatchData) {
  if (match.status !== "finished") {
    return "VS"
  }

  const pointsA = match.pointsA ?? match.sets.filter((set) => set.a > set.b).length
  const pointsB = match.pointsB ?? match.sets.filter((set) => set.b > set.a).length
  return `${pointsA} – ${pointsB}`
}

function getPlayerName(playerId: string, players: Map<string, PlayerProfile>) {
  return players.get(playerId)?.displayName ?? "Jugador"
}

function drawMatchCard({
  context,
  match,
  players,
  x,
  y,
  width,
}: {
  context: CanvasRenderingContext2D
  match: MatchData
  players: Map<string, PlayerProfile>
  x: number
  y: number
  width: number
}) {
  const height = 178
  drawCard(context, x, y, width, height, 24)

  const meta = [
    formatScheduledAt(match.scheduledAt) ?? match.dateLabel,
    getScheduleLocationDisplayText(match.location),
  ]
    .filter(Boolean)
    .join(" · ")

  drawText(context, getMatchStatusLabel(match), x + 24, y + 31, {
    size: 16,
    weight: 900,
    color: match.status === "finished" ? "#2f6f4e" : palette.muted,
    maxWidth: width - 48,
  })
  drawText(context, meta || "Fecha y lugar pendientes", x + 24, y + 57, {
    size: 15,
    weight: 700,
    color: palette.muted,
    maxWidth: width - 48,
  })

  const teamWidth = width * 0.35
  drawText(
    context,
    match.teamA.map((id) => getPlayerName(id, players)).join(" / "),
    x + 24,
    y + 108,
    { size: 22, weight: 900, maxWidth: teamWidth },
  )
  drawText(context, getMatchScore(match), x + width / 2, y + 109, {
    size: 27,
    weight: 900,
    align: "center",
  })
  drawText(
    context,
    match.teamB.map((id) => getPlayerName(id, players)).join(" / "),
    x + width - 24,
    y + 108,
    { size: 22, weight: 900, align: "right", maxWidth: teamWidth },
  )

  if (match.sets.length > 0) {
    drawText(
      context,
      match.sets.map((set) => `${set.a}-${set.b}`).join("   "),
      x + width / 2,
      y + 145,
      { size: 16, weight: 800, color: palette.muted, align: "center" },
    )
  }
}

export async function exportSeasonCalendarImage({
  leagueName,
  seasonName,
  leagueLogoUrl,
  matches,
  players,
}: ExportBranding & {
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
  const roundHeights = rounds.map(([, roundMatches]) =>
    62 + Math.ceil(roundMatches.length / 2) * 198,
  )
  const canvasHeight = Math.max(
    720,
    280 + roundHeights.reduce((total, height) => total + height, 0) + 92,
  )
  const { canvas, context } = createCanvas(canvasHeight)

  await drawHeader({
    context,
    branding: { leagueName, seasonName, leagueLogoUrl },
    label: "Calendario de temporada",
  })

  const playersById = new Map(players.map((player) => [player.id, player]))
  let y = 270

  rounds.forEach(([round, roundMatches]) => {
    drawText(context, `JORNADA ${round}`, PADDING, y + 28, {
      size: 20,
      weight: 900,
      color: palette.muted,
    })
    context.fillStyle = palette.line
    context.fillRect(PADDING + 154, y + 20, CONTENT_WIDTH - 154, 2)
    y += 52

    const cardGap = 18
    const cardWidth = (CONTENT_WIDTH - cardGap) / 2

    roundMatches.forEach((match, index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      drawMatchCard({
        context,
        match,
        players: playersById,
        x: PADDING + column * (cardWidth + cardGap),
        y: y + row * 198,
        width: cardWidth,
      })
    })

    y += Math.ceil(roundMatches.length / 2) * 198 + 10
  })

  drawFooter(context, canvasHeight)

  await downloadCanvas(
    canvas,
    `${safeFilenamePart(leagueName)}-${safeFilenamePart(seasonName)}-calendario.png`,
  )
}

function drawPodiumCard({
  context,
  player,
  position,
  x,
  y,
  width,
}: {
  context: CanvasRenderingContext2D
  player: RankingPlayer
  position: number
  x: number
  y: number
  width: number
}) {
  const accent = position === 1 ? palette.gold : position === 2 ? palette.silver : palette.bronze
  drawCard(context, x, y, width, 164, 26)
  context.fillStyle = accent
  context.fillRect(x, y + 26, 8, 112)
  fillRoundedRect(context, x + 26, y + 28, 58, 58, 18, palette.surfaceAlt)
  drawText(context, String(position), x + 55, y + 68, {
    size: 28,
    weight: 900,
    color: accent,
    align: "center",
  })
  drawText(context, player.displayName, x + 98, y + 55, {
    size: 23,
    weight: 900,
    maxWidth: width - 120,
  })
  drawText(context, `${player.points} PTS`, x + 98, y + 82, {
    size: 17,
    weight: 900,
    color: palette.muted,
  })
  drawText(context, `${player.wins} victorias`, x + 26, y + 126, {
    size: 17,
    weight: 800,
    color: palette.muted,
  })
  drawText(context, `Dif. juegos ${player.gamesDiff >= 0 ? "+" : ""}${player.gamesDiff}`, x + width - 26, y + 126, {
    size: 17,
    weight: 800,
    color: palette.muted,
    align: "right",
  })
}

export async function exportSeasonRankingImage({
  leagueName,
  seasonName,
  leagueLogoUrl,
  ranking,
}: ExportBranding & {
  ranking: RankingPlayer[]
}) {
  const tableRows = Math.max(ranking.length, 1)
  const canvasHeight = 650 + tableRows * 82
  const { canvas, context } = createCanvas(canvasHeight)

  await drawHeader({
    context,
    branding: { leagueName, seasonName, leagueLogoUrl },
    label: "Clasificación de temporada",
  })

  const podium = ranking.slice(0, 3)
  const podiumGap = 16
  const podiumWidth = (CONTENT_WIDTH - podiumGap * 2) / 3

  podium.forEach((player, index) => {
    drawPodiumCard({
      context,
      player,
      position: index + 1,
      x: PADDING + index * (podiumWidth + podiumGap),
      y: 270,
      width: podiumWidth,
    })
  })

  const tableY = 474
  drawCard(context, PADDING, tableY, CONTENT_WIDTH, 72 + tableRows * 82, 30)
  fillRoundedRect(context, PADDING, tableY, CONTENT_WIDTH, 72, 30, palette.accent)
  context.fillRect(PADDING, tableY + 42, CONTENT_WIDTH, 30)

  drawText(context, "POS", PADDING + 30, tableY + 46, {
    size: 16,
    weight: 900,
    color: "#ffffff",
  })
  drawText(context, "JUGADOR", PADDING + 116, tableY + 46, {
    size: 16,
    weight: 900,
    color: "#ffffff",
  })
  const columns = [
    ["PTS", WIDTH - PADDING - 300],
    ["PJ", WIDTH - PADDING - 205],
    ["PG", WIDTH - PADDING - 125],
    ["DG", WIDTH - PADDING - 34],
  ] as const
  columns.forEach(([label, x]) => {
    drawText(context, label, x, tableY + 46, {
      size: 16,
      weight: 900,
      color: "#ffffff",
      align: "right",
    })
  })

  if (ranking.length === 0) {
    drawText(context, "Todavía no hay jugadores en la clasificación", WIDTH / 2, tableY + 124, {
      size: 21,
      weight: 800,
      color: palette.muted,
      align: "center",
    })
  }

  ranking.forEach((player, index) => {
    const rowY = tableY + 72 + index * 82
    if (index % 2 === 1) {
      context.fillStyle = "#f7f8f6"
      context.fillRect(PADDING + 1, rowY, CONTENT_WIDTH - 2, 82)
    }
    if (index > 0) {
      context.fillStyle = palette.line
      context.fillRect(PADDING + 24, rowY, CONTENT_WIDTH - 48, 1)
    }

    drawText(context, String(index + 1), PADDING + 43, rowY + 51, {
      size: 23,
      weight: 900,
      align: "center",
    })
    fillRoundedRect(context, PADDING + 86, rowY + 17, 48, 48, 16, palette.surfaceAlt)
    drawText(context, getInitials(player.displayName), PADDING + 110, rowY + 50, {
      size: 16,
      weight: 900,
      align: "center",
    })
    drawText(context, player.displayName, PADDING + 150, rowY + 48, {
      size: 22,
      weight: 900,
      maxWidth: CONTENT_WIDTH - 465,
    })

    const values = [
      [String(player.points), WIDTH - PADDING - 300],
      [String(player.matchesPlayed), WIDTH - PADDING - 205],
      [String(player.wins), WIDTH - PADDING - 125],
      [`${player.gamesDiff >= 0 ? "+" : ""}${player.gamesDiff}`, WIDTH - PADDING - 34],
    ] as const
    values.forEach(([value, x], valueIndex) => {
      drawText(context, value, x, rowY + 50, {
        size: valueIndex === 0 ? 24 : 20,
        weight: 900,
        color: valueIndex === 0 ? palette.text : palette.muted,
        align: "right",
      })
    })
  })

  drawFooter(context, canvasHeight)

  await downloadCanvas(
    canvas,
    `${safeFilenamePart(leagueName)}-${safeFilenamePart(seasonName)}-clasificacion.png`,
  )
}
