import type { League, PlayerProfile, Season } from "@/data/fakeData"
import type { MatchData } from "@/context/MatchDataProvider"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import type { PersonalMatchItem } from "@/lib/personalMatches"
import { buildSeasonRounds } from "@/lib/rounds"
import { isRoundRevealedToPlayers } from "@/lib/progressiveCalendar"

/** A round window is an estimate, never a fabricated booking. Hidden teams never leave this boundary. */
export function getLeagueActivityMatches({ league, season, settings, matches, playerId, profiles, now }: {
  league: League; season: Season; settings: SeasonRoundSettings; matches: MatchData[]; playerId: string; profiles: PlayerProfile[]; now: Date
}): PersonalMatchItem[] {
  const rounds = buildSeasonRounds({season,settings,matches})
  const visible = (round: number) => season.status !== "upcoming" && isRoundRevealedToPlayers({round,seasonStatus:season.status,totalRounds:season.totalRounds,settings,matches,now})
  const base = { origin:"league" as const,leagueId:league.id,leagueName:league.name,seasonId:season.id,seasonName:season.name,canManage:false,canDelete:false }
  const own = matches.filter(match => visible(match.round) && [...match.teamA,...match.teamB].includes(playerId) && match.status !== "postponed").map(match => {
    const round = rounds.find(round => round.round === match.round)!
    return {...base,id:match.id,round:match.round,status:match.status === "finished" ? "finished" as const : "scheduled" as const,scheduledAt:match.status === "scheduling" ? null : match.scheduledAt,resultRecordedAt:match.resultRecordedAt,locationName:match.location,sets:match.sets,
      preview:{startsAt:round.startsAt,endsAt:round.endsAt,currentRound:round.status === "active" || round.status === "overdue",hidden:false},
      participants:[match.teamA,match.teamB].flatMap((team,index) => team.map((id,slot) => ({team:(index+1) as 1|2,slot:(slot+1) as 1|2,displayName:profiles.find(player=>player.id===id)?.displayName??"",isCurrentUser:id===playerId})))}
  })
  // Expose only the competition and its public timing; a hidden round may include a bye.
  const hidden = rounds.find(round => !visible(round.round) && matches.some(match=>match.round===round.round&&match.status!=="finished"))
  if (hidden && season.status !== "finished" && !own.some(match=>match.status!=="finished"&&(match.round??Infinity)<hidden.round)) {
    const opening = hidden.round === 1 && settings.openingRoundEnabled ? settings.openingRoundAt ?? null : null
    own.push({...base,id:`private:${season.id}:${hidden.round}`,round:hidden.round,status:"scheduled",scheduledAt:null,resultRecordedAt:null,locationName:null,sets:[],
      preview:{startsAt:opening??hidden.startsAt??settings.scheduledStartAt??null,endsAt:hidden.endsAt,currentRound:hidden.status === "active" || hidden.status === "overdue",hidden:true},
      participants:[{team:1,slot:1,displayName:"",isCurrentUser:true}]})
  }
  return own
}
