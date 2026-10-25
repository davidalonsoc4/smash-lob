import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getLeagueActivityMatches } from "@/lib/leagueActivity"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import { selectCompetitionHighlights } from "@/lib/competitionOverview"
import { allMatches, leagues, seasons, playerProfiles, seasonRoundSettings } from "@/data/fakeData"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"

const now = new Date("2026-10-25T10:00:00Z")
const league = leagues[0], season = {...seasons.find(season=>season.id===league.activeSeasonId)!,status:"active" as const}
const seed = allMatches.find(match=>match.seasonId===season.id)!
const matches = [1,2,3].map(round=>({...seed,rankingCounts:true,incidentType:null,incidentStatus:null,incidentReason:null,incidentNotes:null,incidentCreatedAt:null,incidentResolvedAt:null,resolutionType:null,courtBooking:getEmptyCourtBooking(),resultReportedByPlayerId:null,resultLocked:false,id:`fixture-${round}`,round,status:"scheduling" as const,scheduledAt:null,resultRecordedAt:null,sets:[],pointsA:null,pointsB:null}))
const settings:SeasonRoundSettings = {...seasonRoundSettings[0],seasonId:season.id,leagueId:league.id,rosterMode:"fixed",playerCapacity:8,registrationOpen:false,rosterCompletedAt:null,scheduleMode:"single",calendarMode:"balanced",allowPlayerIncidents:false,allowPlayerSubstitutions:false,availabilityRecommendationsEnabled:false,organizationBallsAssigned:false,ballsAssignmentPriority:[]}
const context = {league,season:{...season,totalRounds:3},matches,playerId:seed.teamA[0],profiles:playerProfiles,now,settings:{...settings,roundWindowMode:"none" as const,manualActiveRound:2,calendarVisibilityMode:"full" as const}}
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(now)})
afterEach(()=>vi.useRealTimers())
describe("own league activity without speculative bookings or secret teams",()=>{
  it("prioritizes the active unscheduled round, then an explicitly booked match",()=>{
    const entries=getLeagueActivityMatches(context)
    expect(selectCompetitionHighlights(entries,now)[0].match.id).toBe("fixture-2")
    expect(entries.every(item=>item.scheduledAt===null)).toBe(true)
    const booked={...entries[2],id:"booked",scheduledAt:"2026-10-29T10:00:00Z"}
    expect(selectCompetitionHighlights([...entries,booked],now)[0].match.id).toBe("booked")
  })
  it("keeps the round window distinct from an exact scheduled time",()=>{
    const entries=getLeagueActivityMatches({...context,settings:{...context.settings,manualActiveRound:null,roundWindowMode:"fixed-days",seasonStartsAt:"2026-10-25",roundWindowDays:7}})
    expect(entries[0].scheduledAt).toBeNull()
    expect(entries[0].preview).toMatchObject({startsAt:"2026-10-25",endsAt:"2026-10-31",currentRound:true})
  })
  it("shows upcoming opening timing without exposing even an organizer's unredacted teams",()=>{
    const entries=getLeagueActivityMatches({...context,season:{...context.season,status:"upcoming"},settings:{...context.settings,scheduledStartAt:"2026-11-01T09:00:00Z",openingRoundEnabled:true,openingRoundAt:"2026-11-01T10:00:00Z"}})
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({scheduledAt:null,sets:[],locationName:null,preview:{hidden:true,startsAt:"2026-11-01T10:00:00Z"}})
    expect(entries[0].participants).toEqual([{team:1,slot:1,displayName:"",isCurrentUser:true}])
    expect(JSON.stringify(entries)).not.toContain(playerProfiles.find(player=>player.id===seed.teamB[0])!.displayName)
  })
  it("does not show another player's match and does not leak later progressive pairings",()=>{
    expect(getLeagueActivityMatches({...context,playerId:"not-a-player"})).toEqual([])
    const entries=getLeagueActivityMatches({...context,settings:{...context.settings,calendarVisibilityMode:"progressive",revealedThroughRound:1}})
    expect(entries.filter(item=>!item.preview?.hidden).map(item=>item.round)).toEqual([1])
  })
})
