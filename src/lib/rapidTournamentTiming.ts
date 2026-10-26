import { buildRapidRounds, getRapidBreakOffsetMinutes, getRapidPauseMinutes, RAPID_TOURNAMENT, type RapidBreakConfig, type RapidTournamentConfig } from "./rapidTournament"
export const PREPARATION_MS = RAPID_TOURNAMENT.preparationMinutes * 60_000
type Round = { round: number; startsAt: string; endsAt: string }
export type RapidTournamentTimingConfig = Pick<RapidTournamentConfig, "rounds" | "roundMinutes" | "transitionMinutes" | "preparationMinutes"> & RapidBreakConfig
const defaultTiming: RapidTournamentTimingConfig = RAPID_TOURNAMENT
export function getEffectiveRapidRounds<T extends Round>(rounds: readonly T[], anchor: string, config: RapidTournamentTimingConfig = defaultTiming) {
  const actual = buildRapidRounds(new Date(Date.parse(anchor) + config.preparationMinutes * 60_000), config)
  return rounds.map((round) => ({ ...round, ...actual[round.round - 1] }))
}
export type RapidCue = { id: string; at: number; kind: "preparation" | "start" | "two_minutes" | "end" | "finished" | "countdown"; round: number; count?: number }
export function buildRapidCues(startedAt: string, countdown = false, config: RapidTournamentTimingConfig = defaultTiming): RapidCue[] {
  const start = Date.parse(startedAt)
  const rounds = buildRapidRounds(new Date(start + config.preparationMinutes * 60_000), config)
  const cues: RapidCue[] = [...(config.preparationMinutes > 0 ? [{ id: "preparation", at: start, kind: "preparation" as const, round: 1 }] : []), ...rounds.flatMap((round): RapidCue[] => [
    { id: `start-${round.round}`, at: Date.parse(round.startsAt), kind: "start", round: round.round },
    ...(config.roundMinutes > 2 ? [{ id: `two-${round.round}`, at: Date.parse(round.endsAt) - 120_000, kind: "two_minutes" as const, round: round.round }] : []),
    ...(round.round === config.rounds || getRapidPauseMinutes(round.round,config) > 0 ? [{ id: `end-${round.round}`, at: Date.parse(round.endsAt), kind: round.round === config.rounds ? "finished" as const : "end" as const, round: round.round }] : []),
  ])]
  if (countdown) for (const cue of [...cues]) if (cue.kind === "start" || cue.kind === "end" || cue.kind === "finished") for (const count of [3, 2, 1]) cues.push({ id: `count-${cue.id}-${count}`, at: cue.at - count * 1000, kind: "countdown", round: cue.round, count })
  return cues.filter(cue => cue.at >= start).sort((a, b) => a.at - b.at)
}
export function getDueRapidCues(cues: readonly RapidCue[], previous: number, now: number) {
  return cues.filter((cue) => cue.at > previous && cue.at <= now && now - cue.at < (cue.kind === "countdown" ? 1000 : 3001))
}
export function getRapidCueAnnouncement(cue: RapidCue, config: RapidTournamentTimingConfig) {
  if (cue.kind === "preparation") return { source: config.preparationMinutes === 2 ? "Dos minutos de preparación" : "Calentamiento: {} minutos.", number: config.preparationMinutes === 2 ? undefined : config.preparationMinutes }
  if (cue.kind === "start") return { source: cue.round > 1 && getRapidPauseMinutes(cue.round-1,config) === 0 ? "Fin de ronda. Termina el punto en juego. Comienza la ronda {}" : "Comienza la ronda {}", number: cue.round }
  if (cue.kind === "two_minutes") return { source: "Quedan dos minutos" }
  if (cue.kind === "finished") return { source: "Tiempo de torneo finalizado. Termina el punto en juego." }
  const pause = getRapidPauseMinutes(cue.round,config)
  if (pause > config.transitionMinutes) return { source: "Fin de ronda. Termina el punto en juego. Descanso y cambio: {} minutos.", number: pause }
  if (config.transitionMinutes === 0) return { source: "Fin de ronda. Termina el punto en juego." }
  return { source: config.transitionMinutes === 3 ? "Fin de ronda. Termina el punto en juego. Tres minutos de cambio." : "Fin de ronda. Termina el punto en juego. Cambio: {} minutos.", number: config.transitionMinutes === 3 ? undefined : config.transitionMinutes }
}
export function getRapidLiveState(startedAt: string, now: number, config: RapidTournamentTimingConfig = defaultTiming) {
  const start = Date.parse(startedAt), first = start + config.preparationMinutes * 60_000
  const duration = config.roundMinutes * 60_000, pause = config.transitionMinutes * 60_000
  const finish = first + (config.rounds - 1) * (duration + pause) + duration + getRapidBreakOffsetMinutes(config.rounds,config)*60_000
  if (!Number.isFinite(start)) return null
  let phase: "preparation" | "playing" | "transition" | "ended" = "ended", round = config.rounds, from = finish, until = finish, generalBreak = false
  if (now < first) { phase = "preparation"; round = 1; from = start; until = first }
  else if (now >= finish) { phase = "ended"; round = config.rounds; from = finish; until = finish }
  else {
    for (let current=1;current<=config.rounds;current++) {
      const roundStart=first+(current-1)*(duration+pause)+getRapidBreakOffsetMinutes(current,config)*60_000
      const pauseMinutes=getRapidPauseMinutes(current,config)
      if(now<roundStart+duration){phase="playing";round=current;from=roundStart;until=roundStart+duration;break}
      if(now<roundStart+duration+pauseMinutes*60_000){phase="transition";round=current+1;from=roundStart+duration;until=from+pauseMinutes*60_000;generalBreak=pauseMinutes>config.transitionMinutes;break}
    }
  }
  return { phase, round, from, until, finish, generalBreak, remaining: Math.max(0, Math.ceil((until - now) / 1000)), duration: (until - from) / 1000 }
}
