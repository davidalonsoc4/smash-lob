import { readLegacyRapidConfiguration, type TournamentFormat } from "./tournamentConfiguration"
import { defaultTraditionalSetup, type TraditionalSetup } from "./traditionalTournamentSetup"
import type { TraditionalStoredState } from "./traditionalTournamentState"
export type TournamentDraft = {
  duplicateOf: string
  name: string
  description: string
  format: TournamentFormat
  traditional?: TraditionalSetup
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
  traditional?: TraditionalStoredState | null
}): TournamentDraft {
  const format = data.tournament.configuration.format ?? "balanced_americana"
  if (!["balanced_americana","dynamic_mexicano","knockout","groups","groups_knockout"].includes(String(format))) throw new Error("unsupported_tournament_copy_format")
  const traditional=data.traditional
  if (["knockout","groups","groups_knockout"].includes(String(format)) && !traditional) throw new Error("unsupported_tournament_copy_format")
  const config = readLegacyRapidConfiguration(data.tournament.configuration)
  return {
    duplicateOf: data.tournament.id, name: data.tournament.name, description: data.tournament.description,
    format:format as TournamentFormat, pairing: traditional || data.tournament.configuration.pairing === "fixed" ? "fixed" : "rotating",
    ...(traditional?{traditional:{...defaultTraditionalSetup,...traditional.draw.configuration,drawMode:"manual" as const,order:[...traditional.draw.seedOrder],manualGroups:traditional.draw.groups.length>0,assignments:Object.fromEntries(traditional.draw.groups.flatMap((group,i)=>group.teamIds.map(id=>[id,i+1]))),scheduleMode:traditional.schedule.length?"automatic" as const:"manual" as const}}:{}),
    pairNumbers: data.players.map((player,index) => player.pairNumber ?? Math.floor(index/2)+1),
    players: data.players.map(player => player.name), playerUserIds: data.players.map(player => player.userId ?? null),
    courtNames: [...data.tournament.courtNames], reservationMinutes: config.reservationMinutes, preparationMinutes: config.preparationMinutes,
    rounds: config.rounds, roundMinutes: config.roundMinutes, transitionMinutes: config.transitionMinutes,
    breakMinutes: config.breakMinutes ?? 0, breakEveryRounds: config.breakEveryRounds ?? 0,
    logoUrl: data.tournament.logoUrl ?? null, accentColor: data.tournament.accentColor ?? null,
  }
}
