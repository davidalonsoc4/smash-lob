import { describe, expect, it, vi } from "vitest"
import { mapTournamentData } from "@/lib/serverRapidTournaments"
import { buildTraditionalDraw } from "@/lib/traditionalTournament"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"
vi.mock("@/lib/serverAuth",()=>({requireAuthenticatedAppUser:vi.fn()}))

function fixture(missingState=false){
  const players=Array.from({length:8},(_,i)=>({id:`player-${i+1}`,slot:String.fromCharCode(65+i),full_name:`Synthetic ${i+1}`,pair_number:Math.floor(i/2)+1,user_id:i===0?"linked-account":null}))
  const teams=Array.from({length:4},(_,i)=>({id:`pair-${i+1}`,playerIds:[players[i*2].id,players[i*2+1].id] as [string,string]}))
  const draw=buildTraditionalDraw({teams,configuration:{format:"knockout",groupCount:0,qualifiersPerGroup:0,thirdPlace:false,consolation:false},seed:7})
  const parent={id:"tournament",name:"Synthetic draw",description:"",starts_at:"2026-11-01T09:00:00Z",started_at:null,status:"draft",tournament_mode:"traditional",format:"knockout",pairing:"fixed",player_count:8,court_count:2,round_count:3,round_minutes:30,transition_minutes:5,preparation_minutes:0,safety_margin_minutes:0,court_one_name:"One",court_two_name:"Two"}
  const from=vi.fn((table:string)=>{
    const value=table==="rapid_tournaments"?parent:table==="rapid_tournament_players"?players:table==="traditional_tournament_state"?{draw,results:[],schedule:[],tie_orders:{},revision:0}:[]
    const response={data:value,error:table==="traditional_tournament_state"&&missingState?{code:"42P01"}:null}
    return {select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),order:vi.fn().mockReturnThis(),single:vi.fn().mockResolvedValue(response),maybeSingle:vi.fn().mockResolvedValue(response),then:(resolve:(value:unknown)=>void)=>Promise.resolve(response).then(resolve)}
  })
  return {actor:{supabase:{from},user:{id:"creator"}} as unknown as AuthenticatedAppUser,from,draw}
}
describe("traditional mapping through the existing tournament read",()=>{
  it.each([true,false])("retains shared roster identity and redacts account links for non-managers (%j)",async canManage=>{
    const {actor,from,draw}=fixture(),result=await mapTournamentData(actor,"tournament",canManage)
    expect(result.error).toBeNull()
    expect(result.data?.traditional?.draw).toEqual(draw)
    expect(result.data?.tournament.mode).toBe("traditional")
    expect(result.data?.rounds).toEqual([]);expect(result.data?.matches).toEqual([])
    if(canManage)expect(result.data?.players[0]).toHaveProperty("userId","linked-account")
    else {
      expect(result.data?.players[0]).toHaveProperty("hasAccount",true)
      expect(result.data?.players.every(player=>!("userId" in player))).toBe(true)
    }
    expect(from.mock.calls.filter(([table])=>table==="traditional_tournament_state")).toHaveLength(1)
  })
  it("fails explicitly for missing or invalid traditional state",async()=>{
    const {actor}=fixture(true)
    expect(await mapTournamentData(actor,"tournament",true)).toEqual({data:null,error:"tournament_read_failed"})
  })
})
