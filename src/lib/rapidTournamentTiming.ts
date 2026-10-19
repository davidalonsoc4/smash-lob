import { buildRapidRounds, RAPID_TOURNAMENT, type RapidTournamentConfig } from "./rapidTournament"
export const PREPARATION_MS = RAPID_TOURNAMENT.preparationMinutes * 60_000
type Round = { round: number; startsAt: string; endsAt: string }
export type RapidTournamentTimingConfig = Pick<RapidTournamentConfig, "rounds" | "roundMinutes" | "transitionMinutes" | "preparationMinutes">
const defaultTiming: RapidTournamentTimingConfig = RAPID_TOURNAMENT
export function getEffectiveRapidRounds<T extends Round>(rounds: readonly T[], anchor: string, config: RapidTournamentTimingConfig = defaultTiming) {
  const actual = buildRapidRounds(new Date(Date.parse(anchor) + config.preparationMinutes * 60_000), config)
  return rounds.map((round) => ({ ...round, ...actual[round.round - 1] }))
}
export type RapidCue = { id: string; at: number; kind: "preparation" | "start" | "two_minutes" | "end" | "finished" | "countdown"; round: number; count?: number }
export function buildRapidCues(startedAt: string, countdown = false, config: RapidTournamentTimingConfig = defaultTiming): RapidCue[] {
  const start = Date.parse(startedAt)
  const rounds = buildRapidRounds(new Date(start + config.preparationMinutes * 60_000), config)
  const cues: RapidCue[] = [{ id: "preparation", at: start, kind: "preparation", round: 1 }, ...rounds.flatMap((round): RapidCue[] => [
    { id: `start-${round.round}`, at: Date.parse(round.startsAt), kind: "start", round: round.round },
    { id: `two-${round.round}`, at: Date.parse(round.endsAt) - 120_000, kind: "two_minutes", round: round.round },
    { id: `end-${round.round}`, at: Date.parse(round.endsAt), kind: round.round === config.rounds ? "finished" : "end", round: round.round },
  ])]
  if (countdown) for (const cue of [...cues]) if (cue.kind === "start" || cue.kind === "end" || cue.kind === "finished") for (const count of [3, 2, 1]) cues.push({ id: `count-${cue.id}-${count}`, at: cue.at - count * 1000, kind: "countdown", round: cue.round, count })
  return cues.sort((a, b) => a.at - b.at)
}
export function getDueRapidCues(cues: readonly RapidCue[], previous: number, now: number) {
  return cues.filter((cue) => cue.at > previous && cue.at <= now && now - cue.at < (cue.kind === "countdown" ? 1000 : 3001))
}
export function getRapidLiveState(startedAt: string, now: number, config: RapidTournamentTimingConfig = defaultTiming) {
  const start = Date.parse(startedAt), first = start + config.preparationMinutes * 60_000
  const duration = config.roundMinutes * 60_000, pause = config.transitionMinutes * 60_000
  const finish = first + (config.rounds - 1) * (duration + pause) + duration
  if (!Number.isFinite(start)) return null
  let phase: "preparation" | "playing" | "transition" | "ended", round: number, from: number, until: number
  if (now < first) { phase = "preparation"; round = 1; from = start; until = first }
  else if (now >= finish) { phase = "ended"; round = config.rounds; from = finish; until = finish }
  else {
    const index = Math.floor((now - first) / (duration + pause)), roundStart = first + index * (duration + pause)
    if (now < roundStart + duration) { phase = "playing"; round = index + 1; from = roundStart; until = roundStart + duration }
    else { phase = "transition"; round = index + 2; from = roundStart + duration; until = roundStart + duration + pause }
  }
  return { phase, round, from, until, finish, remaining: Math.max(0, Math.ceil((until - now) / 1000)), duration: (until - from) / 1000 }
}
