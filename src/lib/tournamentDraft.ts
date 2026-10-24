import { readLegacyRapidConfiguration } from "./tournamentConfiguration"
export type TournamentDraft = {
  duplicateOf: string
  name: string
  description: string
  format: "balanced_americana" | "dynamic_mexicano"
  players: string[]
  playerUserIds: Array<string | null>
  courtNames: string[]
  reservationMinutes: number
  preparationMinutes: number
}
export function tournamentDraftFromCopy(data: {
  tournament: { id: string; name: string; description: string; courtNames: string[]; configuration: Record<string, unknown> }
  players: Array<{ name: string; userId?: string | null }>
}): TournamentDraft {
  const format = data.tournament.configuration.format ?? "balanced_americana"
  if (format !== "balanced_americana" && format !== "dynamic_mexicano") throw new Error("unsupported_tournament_copy_format")
  const config = readLegacyRapidConfiguration(data.tournament.configuration)
  return {
    duplicateOf: data.tournament.id, name: data.tournament.name, description: data.tournament.description,
    format,
    players: data.players.map(player => player.name), playerUserIds: data.players.map(player => player.userId ?? null),
    courtNames: [...data.tournament.courtNames], reservationMinutes: config.reservationMinutes, preparationMinutes: config.preparationMinutes,
  }
}
