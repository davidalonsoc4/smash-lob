import {describe,expect,it} from "vitest"
import {defaultTraditionalSetup,previewTraditionalSetup,traditionalDrawOptions,traditionalErrorText,traditionalOrder} from "@/lib/traditionalTournamentSetup"
import {tournamentDraftFromCopy} from "@/lib/tournamentDraft"
import {buildTraditionalDraw,resolveTraditionalTournament} from "@/lib/traditionalTournament"
import {buildTraditionalSchedule} from "@/lib/traditionalTournamentSchedule"
const teams=Array.from({length:4},(_,i)=>({id:`pair-${i+1}`,playerIds:[`p${i*2}`,`p${i*2+1}`] as [string,string]}))
describe("traditional creation setup",()=>{
  it("keeps manual order and selected seeds, adding newly available pairs",()=>{
    const order=traditionalOrder(teams,["pair-3","pair-1","pair-7"])
    expect(order).toEqual(["pair-3","pair-1","pair-2","pair-4"])
    const options=traditionalDrawOptions(teams,{...defaultTraditionalSetup,order,seedCount:2})
    expect(options).toMatchObject({seededTeamIds:["pair-3","pair-1"]})
    expect(traditionalDrawOptions(teams,{...defaultTraditionalSetup,order,drawMode:"manual"})).toHaveProperty("manualOrder",order)
  })
  it("validates manual group distribution and sporting combinations before creation",()=>{
    const setup={...defaultTraditionalSetup,format:"groups_knockout" as const,groupCount:2,qualifiersPerGroup:1,manualGroups:true,assignments:{"pair-1":1,"pair-2":1,"pair-3":2,"pair-4":2}}
    expect(previewTraditionalSetup(teams,setup).plan?.groups.map(g=>g.teamIds)).toEqual([["pair-1","pair-2"],["pair-3","pair-4"]])
    expect(previewTraditionalSetup(teams,{...setup,assignments:{"pair-1":1}}).error).toBe("invalid_manual_groups")
    expect(previewTraditionalSetup(teams,{...defaultTraditionalSetup,thirdPlace:true,consolation:true}).error).toBe("consolation_duplicates_third_place")
    expect(traditionalErrorText("consolation_duplicates_third_place")).toContain("mismo partido")
  })
  it("copies traditional settings and roster into an independent fresh draw",()=>{
    const draw=buildTraditionalDraw({teams,configuration:{format:"groups_knockout",groupCount:2,qualifiersPerGroup:1,thirdPlace:false,consolation:true},seed:17})
    const schedule=buildTraditionalSchedule(draw,{startsAt:"2027-01-01T09:00:00Z",courts:2,matchMinutes:30,transitionMinutes:5})
    const data={tournament:{id:"original",name:"Groups",description:"Description",courtNames:["Court 1","Court 2"],configuration:{format:"groups_knockout",roundMinutes:30,transitionMinutes:5}},players:teams.flatMap(team=>team.playerIds.map(name=>({name,pairNumber:Number(team.id.split("-")[1]),userId:null}))),traditional:{draw,schedule,results:[],tieOrders:{},revision:5}}
    const draft=tournamentDraftFromCopy(data)
    expect(draft).toMatchObject({format:"groups_knockout",pairing:"fixed",traditional:{format:"groups_knockout",consolation:true,drawMode:"manual",scheduleMode:"automatic"}})
    const next=previewTraditionalSetup(teams,draft.traditional!).plan!
    expect(next.matches).toEqual(draw.matches)
    expect(resolveTraditionalTournament(next,[]).matches.every(match=>match.scoreA===null)).toBe(true)
    expect(draft).not.toHaveProperty("results");expect(draft).not.toHaveProperty("revision")
  })
})
