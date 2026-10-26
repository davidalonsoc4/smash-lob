import { describe, expect, it } from "vitest"
import { auditSeasonCalendar, generateBalancedCalendar, getSeasonMaxRoundCount, isOptimizedCustomSeasonCalendar } from "@/lib/calendar"
import { RAPID_TOURNAMENT_SLOTS, generateBalancedAmericanaFixtures, validateTournamentParticipants } from "@/lib/rapidTournament"
import { calculateMexicanoStandings, generateDynamicMexicanoRound, type MexicanoMatch } from "@/lib/dynamicMexicano"
import { fixedTeamsFromPlayers, generateFixedRapidRound, calculateFixedRapidStandings } from "@/lib/fixedRapidTournament"
import { buildTraditionalDraw } from "@/lib/traditionalTournament"

describe("32 total players across competitions", () => {
  it.each([25,26,27,28,29,30,31,32])("keeps full and custom league calendars valid for %i players", count => {
    const playerIds=Array.from({length:count},(_,i)=>`id-${i}`)
    for(const rounds of [count%4?count:count-1,getSeasonMaxRoundCount(count),11]) {
      const matches=generateBalancedCalendar({leagueId:"league",seasonId:"season",playerIds,scheduleMode:"extended",targetRoundCount:rounds})
      const audit=auditSeasonCalendar({matches,playerIds,mode:"extended",expectedRoundCount:rounds})
      expect(audit.isBalanced||isOptimizedCustomSeasonCalendar(audit)).toBe(true)
      expect(audit.consecutiveByeCount).toBe(0)
      expect(audit.repeatedMatchCount).toBe(0)
      expect(audit.roundCount).toBe(rounds)
    }
  },15000)
  it("preserves the legacy slots while covering all 32 unique identities",()=>{
    expect(RAPID_TOURNAMENT_SLOTS).toHaveLength(32)
    expect(RAPID_TOURNAMENT_SLOTS.slice(0,24).join("")).toBe("ABCDEFGHIJKLMNOPQRSTUVWX")
    expect(new Set(RAPID_TOURNAMENT_SLOTS).size).toBe(32)
    const names=RAPID_TOURNAMENT_SLOTS.map((_,i)=>`Player ${i}`)
    expect(validateTournamentParticipants(names,32).ok).toBe(true)
    expect(validateTournamentParticipants([...names,"Extra"],33).ok).toBe(false)
    const fixtures=generateBalancedAmericanaFixtures(32,4,8,()=>.37)
    expect(fixtures).toHaveLength(32)
    for(const slot of RAPID_TOURNAMENT_SLOTS)expect(fixtures.filter(m=>[...m.teamA,...m.teamB].includes(slot))).toHaveLength(4)
  })
  it.each([25,26,27,28,29,30,31,32])("completes balanced Mexicano participation for %i individuals",count=>{
    const players=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`Person ${i}`})),history:MexicanoMatch[]=[]
    for(let round=1;round<=8;round++){
      const next=generateDynamicMexicanoRound({players,history,courts:4,round,seed:31})
      const active=next.matches.flatMap(m=>[...m.teamAIds,...m.teamBIds])
      expect(new Set(active).size).toBe(active.length)
      history.push(...next.matches.map(m=>({...m,round,scoreA:16,scoreB:12})))
    }
    const played=calculateMexicanoStandings(players,history,8).map(p=>p.played)
    expect(Math.max(...played)-Math.min(...played)).toBeLessThanOrEqual(1)
  })
  it("keeps sixteen fixed teams intact through all Mexicano rounds",()=>{
    const players=Array.from({length:32},(_,i)=>({id:`p${i}`,pairNumber:Math.floor(i/2)+1}))
    const teams=fixedTeamsFromPlayers(players),history:MexicanoMatch[]=[]
    expect(teams).toHaveLength(16)
    for(let round=1;round<=8;round++)history.push(...generateFixedRapidRound({teams,history,courts:4,round,seed:31,format:"dynamic_mexicano"}).matches.map(m=>({...m,round,scoreA:16,scoreB:12})))
    expect(calculateFixedRapidStandings(teams,history,"dynamic_mexicano").map(t=>t.played)).toEqual(Array(16).fill(4))
    const draw=buildTraditionalDraw({teams,configuration:{format:"groups",groupCount:1,qualifiersPerGroup:0,thirdPlace:false,consolation:false},seed:31})
    expect(draw.matches).toHaveLength(120)
  })
})
