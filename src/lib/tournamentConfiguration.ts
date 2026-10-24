import { RAPID_TOURNAMENT, type RapidTournamentConfig } from "./rapidTournament"

export type TournamentPairing = "rotating" | "fixed"
export type TournamentFormat = "balanced_americana" | "dynamic_mexicano" | "knockout" | "groups" | "groups_knockout"
export type TournamentRole = "creator" | "admin" | "participant" | "spectator"
export type TournamentResultPolicy = "free" | "opponent_confirmation" | "admin_approval"
export type TournamentScoring = "timed_points" | "points" | "games" | "sets" | "tiebreak"
export type RapidPlanningInput = RapidTournamentConfig & { pairing: TournamentPairing }
export function getRecommendedRapidRounds(reservation: number, minutes: number, transition: number, preparation: number) {
  return Math.max(0, Math.min(100, Math.floor((reservation - preparation - 2 + transition) / (minutes + transition))))
}

// Pure planning shared by previews and server validation. This does not activate new formats.
export function planRapidTournament(config: RapidPlanningInput) {
  const { players, courts, rounds, roundMinutes, transitionMinutes, preparationMinutes, reservationMinutes, pairing } = config
  if (![players, courts, rounds, roundMinutes, transitionMinutes, preparationMinutes, reservationMinutes].every(Number.isSafeInteger) ||
    players < 4 || players > 24 || courts < 1 || courts > 6 || rounds < 1 || rounds > 100 ||
    roundMinutes < 1 || transitionMinutes < 0 || preparationMinutes < 0 || reservationMinutes < 1 ||
    (pairing !== "fixed" && pairing !== "rotating")) return { ok: false as const, error: "invalid_tournament_configuration" }
  if (pairing === "fixed" && players % 2 !== 0) return { ok: false as const, error: "fixed_pairs_require_even_players" }
  const activeCourts = Math.min(courts, Math.floor(players / 4))
  const matchCount = rounds * activeCourts
  const minimumMatchesPerPlayer = Math.floor(matchCount * 4 / players)
  const maximumMatchesPerPlayer = Math.ceil(matchCount * 4 / players)
  if (!minimumMatchesPerPlayer) return { ok: false as const, error: "insufficient_matches_for_all_players" }
  const scheduledMinutes = preparationMinutes + rounds * roundMinutes + (rounds - 1) * transitionMinutes
  const safetyMinutes = reservationMinutes - scheduledMinutes
  if (safetyMinutes < 2) return { ok: false as const, error: "insufficient_safety_margin" }
  return {
    ok: true as const, activeCourts, matchCount, scheduledMinutes, safetyMinutes,
    maximumPreparationMinutes: reservationMinutes - 2 - rounds * roundMinutes - (rounds - 1) * transitionMinutes,
    minimumMatchesPerPlayer, maximumMatchesPerPlayer,
    minimumRestRoundsPerPlayer: rounds - maximumMatchesPerPlayer,
    maximumRestRoundsPerPlayer: rounds - minimumMatchesPerPlayer,
    minimumPlayingMinutesPerPlayer: minimumMatchesPerPlayer * roundMinutes,
    maximumPlayingMinutesPerPlayer: maximumMatchesPerPlayer * roundMinutes,
    exactParticipationPossible: pairing === "fixed" ? (matchCount * 2) % (players / 2) === 0 : (matchCount * 4) % players === 0,
  }
}

// Existing persisted tournaments omitted some configuration fields. Keep original defaults.
export function readLegacyRapidConfiguration(value: Record<string, unknown>): RapidTournamentConfig {
  const read = (key: keyof RapidTournamentConfig) => typeof value[key] === "number" ? value[key] as number : RAPID_TOURNAMENT[key]
  return { players: read("players"), courts: read("courts"), rounds: read("rounds"),
    roundMinutes: read("roundMinutes"), transitionMinutes: read("transitionMinutes"),
    preparationMinutes: read("preparationMinutes"), reservationMinutes: read("reservationMinutes") }
}
