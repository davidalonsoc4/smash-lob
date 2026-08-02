import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import { matchIncidentTypeLabels } from "@/lib/matchIncidents"
import type { RankingPlayer } from "@/lib/ranking"

export type ExportCell = string | number | boolean | null | undefined
export type ExportRows = ExportCell[][]

export function protectSpreadsheetCell(value: ExportCell): ExportCell {
  if (typeof value !== "string") {
    return value
  }

  return /^[=+\-@]/.test(value) ? `'${value}` : value
}

function escapeCsvCell(value: ExportCell) {
  const safeValue = protectSpreadsheetCell(value)
  const text =
    safeValue === null || safeValue === undefined ? "" : String(safeValue)

  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function buildCsv(rows: ExportRows) {
  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n")
}

export function getExportSafeFilenamePart(value: string) {
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

function downloadCsv(filename: string, rows: ExportRows) {
  const csv = `\uFEFF${buildCsv(rows)}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function buildRankingExportRows(ranking: RankingPlayer[]): ExportRows {
  return [
    [
      "Posición",
      "Jugador",
      "Puntos",
      "Partidos",
      "Victorias",
      "Derrotas",
      "Juegos a favor",
      "Juegos en contra",
      "Diferencia de juegos",
      "Estado",
    ],
    ...ranking.map((player, index) => [
      index + 1,
      player.displayName,
      player.points,
      player.matchesPlayed,
      player.wins,
      player.losses,
      player.gamesFor,
      player.gamesAgainst,
      player.gamesDiff,
      player.seasonPlayerStatus === "withdrawn" ? "Baja" : "Activo",
    ]),
  ]
}

export function exportRankingCsv({
  leagueName,
  seasonName,
  ranking,
}: {
  leagueName: string
  seasonName: string
  ranking: RankingPlayer[]
}) {
  downloadCsv(
    `${getExportSafeFilenamePart(leagueName)}-${getExportSafeFilenamePart(seasonName)}-clasificacion.csv`,
    buildRankingExportRows(ranking),
  )
}

function getPlayerName(playerId: string, playersById: Map<string, PlayerProfile>) {
  return playersById.get(playerId)?.displayName ?? playerId
}

function getResolutionLabel(match: MatchData) {
  switch (match.resolutionType) {
    case "cancelled":
      return "Cancelado"
    case "no_show":
      return "No presentado"
    case "abandoned":
      return "Abandono"
    case "administrative":
      return "Resultado administrativo"
    case "postponed":
      return "Aplazado"
    case "played":
      return "Jugado"
    default:
      return match.status === "finished"
        ? "Jugado"
        : match.status === "scheduled"
          ? "Programado"
          : match.status === "postponed"
            ? "Aplazado"
            : "Sin programar"
  }
}

export function buildResultsExportRows({
  matches,
  players,
}: {
  matches: MatchData[]
  players: PlayerProfile[]
}): ExportRows {
  const playersById = new Map(players.map((player) => [player.id, player]))

  return [
    [
      "Jornada",
      "Estado",
      "Fecha",
      "Lugar",
      "Pareja A",
      "Pareja B",
      "Sets A",
      "Sets B",
      "Detalle de sets",
      "Cuenta para clasificación",
      "Incidencia",
      "Motivo",
    ],
    ...[...matches]
      .sort((left, right) => left.round - right.round)
      .map((match) => [
        match.round,
        getResolutionLabel(match),
        match.scheduledAt ?? match.dateLabel ?? "",
        getScheduleLocationDisplayText(match.location) ?? "",
        match.teamA.map((id) => getPlayerName(id, playersById)).join(" / "),
        match.teamB.map((id) => getPlayerName(id, playersById)).join(" / "),
        match.pointsA ?? "",
        match.pointsB ?? "",
        match.sets.map((set) => `${set.a}-${set.b}`).join(" | "),
        match.status !== "finished"
          ? ""
          : match.resultCounts === false
            ? "No"
            : "Sí",
        match.incidentType ? matchIncidentTypeLabels[match.incidentType] : "",
        match.incidentReason ?? "",
      ]),
  ]
}

export function exportResultsCsv({
  leagueName,
  seasonName,
  matches,
  players,
}: {
  leagueName: string
  seasonName: string
  matches: MatchData[]
  players: PlayerProfile[]
}) {
  downloadCsv(
    `${getExportSafeFilenamePart(leagueName)}-${getExportSafeFilenamePart(seasonName)}-resultados.csv`,
    buildResultsExportRows({ matches, players }),
  )
}
