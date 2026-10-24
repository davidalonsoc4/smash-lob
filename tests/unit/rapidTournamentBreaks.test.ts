import { describe,expect,it } from "vitest"
import { buildRapidRounds } from "@/lib/rapidTournament"
import { getRecommendedRapidRounds,planRapidTournament } from "@/lib/tournamentConfiguration"
import { buildRapidCues,getRapidCueAnnouncement,getRapidLiveState } from "@/lib/rapidTournamentTiming"

const config={players:12,courts:2,rounds:6,roundMinutes:16,transitionMinutes:3,preparationMinutes:2,reservationMinutes:120,pairing:"rotating" as const,breakMinutes:5,breakEveryRounds:3}
const anchor="2027-01-01T09:00:00Z", start=Date.parse(anchor)
describe("rapid tournament general breaks",()=>{
  it("counts only pauses before another round, preserving two safety minutes",()=>{
    expect(planRapidTournament(config)).toMatchObject({ok:true,scheduledMinutes:118,safetyMinutes:2,breakCount:1,totalBreakMinutes:5})
    expect(planRapidTournament({...config,breakMinutes:6})).toMatchObject({ok:false,error:"insufficient_safety_margin"})
    const rounds=buildRapidRounds(new Date(start+120_000),config)
    expect(rounds[2].endsAt).toBe("2027-01-01T09:56:00.000Z")
    expect(rounds[3].startsAt).toBe("2027-01-01T10:04:00.000Z")
    expect(rounds[5].endsAt).toBe("2027-01-01T10:58:00.000Z")
    expect(getRecommendedRapidRounds(120,16,3,2,config)).toBe(6)
    expect(getRecommendedRapidRounds(120,16,3,2,{...config,breakMinutes:10})).toBe(5)
  })
  it("continues live clocks and cues from actual start across the extended pause",()=>{
    expect(getRapidLiveState(anchor,start+56*60_000,config)).toMatchObject({phase:"transition",generalBreak:true,round:4,remaining:480})
    expect(getRapidLiveState(anchor,start+64*60_000,config)).toMatchObject({phase:"playing",generalBreak:false,round:4,remaining:960})
    expect(getRapidLiveState(anchor,start+118*60_000,config)).toMatchObject({phase:"ended",remaining:0})
    const cue=buildRapidCues(anchor,true,config).find(cue=>cue.kind==="end"&&cue.round===3)!
    expect(cue.at).toBe(start+56*60_000)
    expect(getRapidCueAnnouncement(cue,config)).toMatchObject({number:8})
  })
  it("keeps a break even when ordinary transitions are zero",()=>{
    const settings={...config,transitionMinutes:0,breakEveryRounds:1}
    const cues=buildRapidCues(anchor,false,settings)
    expect(cues.filter(cue=>cue.kind==="end")).toHaveLength(5)
    expect(getRapidCueAnnouncement(cues.find(cue=>cue.kind==="start"&&cue.round===2)!,settings).source).toBe("Comienza la ronda {}")
  })
  it.each([{breakMinutes:5,breakEveryRounds:0},{breakMinutes:0,breakEveryRounds:3},{breakMinutes:-1,breakEveryRounds:2},{breakMinutes:5,breakEveryRounds:1.5}])("rejects an inconsistent break %j",patch=>{
    expect(planRapidTournament({...config,...patch}).ok).toBe(false)
  })
})
