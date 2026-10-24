import { readLegacyRapidConfiguration } from "./tournamentConfiguration"
export type TournamentDraft = {
  duplicateOf: string
  name: string
  description: string
  format: "balanced_americana" | "dynamic_mexicano"
  pairing: "rotating" | "fixed"
  pairNumbers: number[]
  players: string[]
  playerUserIds: Array<string | null>
  courtNames: string[]
  reservationMinutes: number
  preparationMinutes: number
  rounds: number
  roundMinutes: number
  transitionMinutes: number
  breakMinutes: number
  breakEveryRounds: number
  logoUrl: string | null
  accentColor: string | null
}
export function tournamentDraftFromCopy(data: {
  tournament: { id: string; name: string; description: string; courtNames: string[]; configuration: Record<string, unknown>; logoUrl?: string | null; accentColor?: string | null }
  players: Array<{ name: string; userId?: string | null; pairNumber?: number | null }>
}): TournamentDraft {
  const format = data.tournament.configuration.format ?? "balanced_americana"
  if (format !== "balanced_americana" && format !== "dynamic_mexicano") throw new Error("unsupported_tournament_copy_format")
  const config = readLegacyRapidConfiguration(data.tournament.configuration)
  return {
    duplicateOf: data.tournament.id, name: data.tournament.name, description: data.tournament.description,
    format, pairing: data.tournament.configuration.pairing === "fixed" ? "fixed" : "rotating",
    pairNumbers: data.players.map((player,index) => player.pairNumber ?? Math.floor(index/2)+1),
    players: data.players.map(player => player.name), playerUserIds: data.players.map(player => player.userId ?? null),
    courtNames: [...data.tournament.courtNames], reservationMinutes: config.reservationMinutes, preparationMinutes: config.preparationMinutes,
    rounds: config.rounds, roundMinutes: config.roundMinutes, transitionMinutes: config.transitionMinutes,
    breakMinutes: config.breakMinutes ?? 0, breakEveryRounds: config.breakEveryRounds ?? 0,
    logoUrl: data.tournament.logoUrl ?? null, accentColor: data.tournament.accentColor ?? null,
  }
}
