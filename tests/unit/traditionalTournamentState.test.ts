import { describe, expect, it } from "vitest"
import { buildTraditionalDraw, resolveTraditionalTournament } from "@/lib/traditionalTournament"
import { readTraditionalStoredState } from "@/lib/traditionalTournamentState"
import { buildTraditionalSchedule } from "@/lib/traditionalTournamentSchedule"

const options = { startsAt:"2026-11-01T09:00:00Z", courts:2,matchMinutes:30,transitionMinutes:5 }
const draw = buildTraditionalDraw({ teams:Array.from({length:4},(_,i)=>({id:`pair-${i+1}`,playerIds:[`p${i*2}`,`p${i*2+1}`]})),configuration:{format:"knockout",groupCount:0,qualifiersPerGroup:0,thirdPlace:false,consolation:false},seed:7 })
const row = () => ({draw:structuredClone(draw),results:[],schedule:buildTraditionalSchedule(draw,options),tie_orders:{},revision:0})
function reordered(value: unknown): unknown {
  return Array.isArray(value) ? value.map(reordered) : value && typeof value==="object" ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,reordered(value)])) : value
}
describe("stored traditional state",()=>{
  it("decodes jsonb key order without relying on casts, preserving its canonical draw",()=>{
    const state=readTraditionalStoredState(reordered(row()),options)
    expect(state.draw).toEqual(draw)
    expect(state.revision).toBe(0)
    expect(resolveTraditionalTournament(state.draw,state.results).complete).toBe(false)
  })
  it("accepts unscheduled future matches and manual planning",()=>{
    expect(readTraditionalStoredState({...row(),schedule:[]},options).schedule).toEqual([])
  })
  it.each([null,[],{}, {revision:-1}, {revision:0,draw:[]}])("rejects malformed state %j",value=>{
    expect(()=>readTraditionalStoredState(value,options)).toThrow()
  })
  it("rejects a noncanonical graph, even if it references valid teams",()=>{
    const changed=row();changed.draw.matches[0].b=changed.draw.matches[1].b
    expect(()=>readTraditionalStoredState(changed,options)).toThrow("invalid_traditional_state")
  })
  it("rejects impossible result identities and malformed numeric/time fields",()=>{
    const ready=resolveTraditionalTournament(draw,[]).matches[0]
    const results=[{matchId:ready.id,teamAId:ready.teamAId,teamBId:ready.teamBId,scoreA:20,scoreB:10}]
    expect(readTraditionalStoredState({...row(),results},options).results).toEqual(results)
    expect(()=>readTraditionalStoredState({...row(),results:[{...results[0],teamAId:"unknown"}]},options)).toThrow("played_traditional_match_changed")
    expect(()=>readTraditionalStoredState({...row(),results:[{...results[0],scoreA:"20"}]},options)).toThrow("invalid_traditional_state")
    expect(()=>readTraditionalStoredState({...row(),schedule:[{...row().schedule[0],startsAt:27}]},options)).toThrow("invalid_traditional_state")
  })
})
