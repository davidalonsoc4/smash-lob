// Shared by server boundaries and ranking adapters. Keep the database integer range.
export const TOURNAMENT_MAX_POINTS = 2_147_483_647
export function parseTournamentPoints(scoreA: unknown, scoreB: unknown): { a: number; b: number } | null {
  if (typeof scoreA !== "number" || typeof scoreB !== "number" ||
    !Number.isSafeInteger(scoreA) || !Number.isSafeInteger(scoreB) ||
    scoreA < 0 || scoreB < 0 || scoreA > TOURNAMENT_MAX_POINTS || scoreB > TOURNAMENT_MAX_POINTS ||
    scoreA + scoreB <= 0) return null
  return { a: scoreA, b: scoreB }
}
