import { describe, expect, it, vi } from "vitest"
import { executeTraditionalTournamentCommand, readTraditionalTournament } from "@/lib/serverTraditionalTournaments"
import { buildTraditionalDraw, resolveTraditionalTournament, type TraditionalResult } from "@/lib/traditionalTournament"
import { buildTraditionalSchedule } from "@/lib/traditionalTournamentSchedule"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"

const options={startsAt:"2026-11-01T09:00:00Z",courts:2,matchMinutes:30,transitionMinutes:5}
function fixture(status="in_progress"){
  const draw=buildTraditionalDraw({teams:Array.from({length:4},(_,i)=>({id:`pair-${i+1}`,playerIds:[`p${i*2}`,`p${i*2+1}`]})),configuration:{format:"knockout",groupCount:0,qualifiersPerGroup:0,thirdPlace:false,consolation:false},seed:7})
  const row={draw,results:[] as TraditionalResult[],schedule:buildTraditionalSchedule(draw,options),tie_orders:{},revision:3}
  const metadata={tournament_mode:"traditional",starts_at:options.startsAt,court_count:2,round_minutes:30,transition_minutes:5,status}
  const rpc=vi.fn().mockResolvedValue({data:4,error:null})
  const from=vi.fn((table:string)=>({select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue({data:metadata,error:null}),maybeSingle:vi.fn(async()=>({data:table==="traditional_tournament_state"?row:null,error:null}))}))
  return {row,metadata,rpc,actor:{supabase:{from,rpc},user:{id:"creator"}} as unknown as AuthenticatedAppUser}
}
const score = (match: ReturnType<typeof resolveTraditionalTournament>["matches"][number]):TraditionalResult=>({matchId:match.id,teamAId:match.teamAId!,teamBId:match.teamBId!,scoreA:20,scoreB:10})
describe("traditional server commands",()=>{
  it("reads and validates the stored state",async()=>{
    const {actor,row}=fixture()
    expect(await readTraditionalTournament(actor,"tournament",options)).toMatchObject({error:null,data:{draw:row.draw,revision:3}})
  })
  it("starts a draft through the revision-checked RPC",async()=>{
    const {actor,rpc}=fixture("draft")
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"start",revision:3})).toEqual({ok:true,revision:4})
    expect(rpc).toHaveBeenCalledWith("update_traditional_tournament",expect.objectContaining({p_action:"start",p_actor_user_id:"creator",p_expected_revision:3,p_results:null,p_draw:null}))
  })
  it.each([undefined,-1,1.5,2,"3"])("rejects invalid or stale revision %j without writing",async revision=>{
    const {actor,rpc}=fixture()
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision})).toMatchObject({ok:false,status:409})
    expect(rpc).not.toHaveBeenCalled()
  })
  it("saves the actual resolved opponents, rejecting blank/invalid scores and knockout draws",async()=>{
    const {actor,row,rpc}=fixture(),match=resolveTraditionalTournament(row.draw,[]).matches[0]
    for(const [scoreA,scoreB] of [["20",10],["",10],[-1,10],[0,0],[10,10]]){
      expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision:3,matchId:match.id,scoreA,scoreB})).toMatchObject({ok:false,status:400})
    }
    expect(rpc).not.toHaveBeenCalled()
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision:3,matchId:match.id,scoreA:20,scoreB:10})).toMatchObject({ok:true})
    expect(rpc).toHaveBeenCalledWith("update_traditional_tournament",expect.objectContaining({p_results:[score(match)]}))
  })
  it("cannot record a pending final or finish with incomplete results",async()=>{
    const {actor,row,rpc}=fixture()
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision:3,matchId:row.draw.matches.at(-1)!.id,scoreA:20,scoreB:10})).toMatchObject({ok:false,status:409})
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"finish",revision:3})).toMatchObject({ok:false,status:409})
    expect(rpc).not.toHaveBeenCalled()
  })
  it("locks the played final's opponents after an earlier result correction",async()=>{
    const {actor,row,rpc}=fixture()
    row.results=resolveTraditionalTournament(row.draw,[]).matches.filter(m=>m.state==="ready").map(score)
    row.results.push(score(resolveTraditionalTournament(row.draw,row.results).matches.at(-1)!))
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision:3,matchId:row.results[0].matchId,scoreA:5,scoreB:20})).toEqual({ok:false,status:409,error:"played_traditional_match_changed"})
    expect(rpc).not.toHaveBeenCalled()
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"finish",revision:3})).toMatchObject({ok:true})
  })
  it("redraws only a draft, retaining team and player identities",async()=>{
    const {actor,row,rpc}=fixture("draft")
    const manualOrder=[...row.draw.seedOrder].reverse()
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"draw",revision:3,manualOrder})).toMatchObject({ok:true})
    expect(rpc).toHaveBeenCalledWith("update_traditional_tournament",expect.objectContaining({p_draw:expect.objectContaining({teams:row.draw.teams,seedOrder:manualOrder}),p_results:null,p_tie_orders:{}}))
  })
  it("validates manual calendars and permits a fully manual unplanned draft",async()=>{
    const {actor,row,rpc}=fixture("draft")
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"schedule",revision:3,schedule:[]})).toMatchObject({ok:true})
    rpc.mockClear()
    const bad=row.schedule.map((entry,i)=>({...entry,court:i===1?1:entry.court}))
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"schedule",revision:3,schedule:bad})).toMatchObject({ok:false,status:400})
    expect(rpc).not.toHaveBeenCalled()
  })
  it("rejects actions in an incompatible status and never modifies rapid tournaments",async()=>{
    const {actor,rpc,metadata}=fixture("draft")
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"result",revision:3})).toMatchObject({ok:false,status:409})
    metadata.status="finished"
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"schedule",revision:3})).toMatchObject({ok:false,status:409})
    metadata.tournament_mode="rapid"
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"start",revision:3})).toMatchObject({ok:false,status:404})
    expect(rpc).not.toHaveBeenCalled()
  })
  it("propagates a racing revision failure and a database failure without claiming success",async()=>{
    const {actor,rpc}=fixture("draft")
    rpc.mockResolvedValueOnce({data:-1,error:null})
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"start",revision:3})).toMatchObject({ok:false,status:409})
    rpc.mockResolvedValueOnce({data:null,error:{code:"XX000"}})
    expect(await executeTraditionalTournamentCommand(actor,"tournament",{action:"start",revision:3})).toMatchObject({ok:false,status:500})
  })
})
