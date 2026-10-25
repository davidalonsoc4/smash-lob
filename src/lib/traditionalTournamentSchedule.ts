import { resolveTraditionalTournament, type TraditionalMatch, type TraditionalPlan, type TraditionalSource } from "./traditionalTournament"

export type TraditionalScheduleEntry = { matchId: string; startsAt: string; endsAt: string; court: number }
export type TraditionalScheduleOptions = { startsAt: string; courts: number; matchMinutes: number; transitionMinutes: number }
function fail(message: string): never { throw new Error(message) }
function timestamp(value: string) {
  const parsed = Date.parse(value)
  if (typeof value !== "string" || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(parsed)) fail("invalid_traditional_schedule_time")
  return parsed
}
function scheduleContext(plan: TraditionalPlan, options: TraditionalScheduleOptions) {
  resolveTraditionalTournament(plan, [])
  if (!Number.isInteger(options.courts) || options.courts < 1 || options.courts > 4 ||
    !Number.isInteger(options.matchMinutes) || options.matchMinutes < 1 || options.matchMinutes > 240 ||
    !Number.isInteger(options.transitionMinutes) || options.transitionMinutes < 0 || options.transitionMinutes > 120) fail("invalid_traditional_schedule_configuration")
  const start = timestamp(options.startsAt), byId = new Map(plan.matches.map(match => [match.id, match]))
  const playable = plan.matches.filter(match => match.a !== null && match.b !== null)
  const dependencies = (source: TraditionalSource): string[] => {
    if (!source || source.kind === "team") return []
    if (source.kind === "group") return plan.matches.filter(match => match.groupId === source.groupId).map(match => match.id)
    const previous = byId.get(source.matchId)!
    return previous.a && previous.b ? [previous.id] : [...dependencies(previous.a), ...dependencies(previous.b)]
  }
  const possibleTeams = (source: TraditionalSource): string[] => {
    if (!source) return []
    if (source.kind === "team") return [source.teamId]
    if (source.kind === "group") return plan.groups.find(group => group.id === source.groupId)!.teamIds
    const previous = byId.get(source.matchId)!
    return [...new Set([...possibleTeams(previous.a), ...possibleTeams(previous.b)])]
  }
  const exclusive = (a: TraditionalSource, b: TraditionalSource) => a && b &&
    (a.kind === "group" && b.kind === "group" && a.groupId === b.groupId && a.position !== b.position ||
      (a.kind === "winner" || a.kind === "loser") && (b.kind === "winner" || b.kind === "loser") && a.matchId === b.matchId && a.kind !== b.kind)
  const shareTeam = (a: TraditionalMatch, b: TraditionalMatch) => [a.a, a.b].some(left => [b.a, b.b].some(right =>
    !exclusive(left, right) && possibleTeams(left).some(id => possibleTeams(right).includes(id))))
  return { start, byId, playable, dependencies, shareTeam }
}

// Court and team conflicts are checked even before the future opponents are known.
// Dates can span days/weeks; manual planning may leave later matches unscheduled.
export function validateTraditionalSchedule(plan: TraditionalPlan, entries: readonly TraditionalScheduleEntry[], options: TraditionalScheduleOptions) {
  const context = scheduleContext(plan, options), byId = new Map(entries.map(entry => [entry.matchId, entry]))
  if (byId.size !== entries.length || entries.some(entry => !context.playable.some(match => match.id === entry.matchId))) fail("invalid_traditional_schedule_match")
  const transition = options.transitionMinutes * 60000
  for (const entry of entries) {
    const start = timestamp(entry.startsAt), end = timestamp(entry.endsAt), match = context.byId.get(entry.matchId)!
    if (start < context.start || end <= start || !Number.isInteger(entry.court) || entry.court < 1 || entry.court > options.courts) fail("invalid_traditional_schedule_slot")
    for (const dependency of [...context.dependencies(match.a), ...context.dependencies(match.b)]) {
      const previous = byId.get(dependency)
      if (!previous || timestamp(previous.endsAt) + transition > start) fail("traditional_schedule_dependency_conflict")
    }
  }
  for (const entry of entries) {
    const start = timestamp(entry.startsAt), end = timestamp(entry.endsAt), match = context.byId.get(entry.matchId)!
    for (const other of entries) {
      if (entry.matchId >= other.matchId) continue
      if (start < timestamp(other.endsAt) + transition && timestamp(other.startsAt) < end + transition &&
        (entry.court === other.court || context.shareTeam(match, context.byId.get(other.matchId)!))) fail("traditional_schedule_overlap")
    }
  }
  return { complete: entries.length === context.playable.length, scheduled: entries.length, pending: context.playable.length - entries.length }
}

export function buildTraditionalSchedule(plan: TraditionalPlan, options: TraditionalScheduleOptions): TraditionalScheduleEntry[] {
  const context = scheduleContext(plan, options), entries: TraditionalScheduleEntry[] = [], byId = new Map<string, TraditionalScheduleEntry>()
  const transition = options.transitionMinutes * 60000, duration = options.matchMinutes * 60000
  for (const match of context.playable) {
    const earliest = Math.max(context.start, ...[...context.dependencies(match.a), ...context.dependencies(match.b)].map(id => timestamp(byId.get(id)!.endsAt) + transition))
    let best: { start: number; court: number } | null = null
    for (let court = 1; court <= options.courts; court++) {
      let start = earliest
      for (;;) {
        const conflicts = entries.filter(other => (court === other.court || context.shareTeam(match, context.byId.get(other.matchId)!)) &&
          start < timestamp(other.endsAt) + transition && timestamp(other.startsAt) < start + duration + transition)
        if (!conflicts.length) break
        start = Math.max(...conflicts.map(other => timestamp(other.endsAt) + transition))
      }
      if (!best || start < best.start) best = { start, court }
    }
    const entry = { matchId: match.id, court: best!.court, startsAt: new Date(best!.start).toISOString(), endsAt: new Date(best!.start + duration).toISOString() }
    entries.push(entry); byId.set(match.id, entry)
  }
  validateTraditionalSchedule(plan, entries, options)
  return entries
}
