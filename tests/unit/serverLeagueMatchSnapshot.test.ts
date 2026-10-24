import { describe,expect,it,vi } from "vitest"
import { readLeagueMatchSnapshot } from "@/lib/serverLeagueMatchSnapshot"
import type { AuthenticatedAppUser } from "@/lib/serverAuth"

function client(pages:Array<{data:Record<string,unknown>[]|null;error:null|{message:string}}>){
  const query={select:vi.fn(),in:vi.fn(),order:vi.fn(),range:vi.fn()}
  query.select.mockReturnValue(query);query.in.mockReturnValue(query);query.order.mockReturnValue(query)
  pages.forEach(page=>query.range.mockResolvedValueOnce(page))
  return {query,db:{from:vi.fn(()=>query)} as unknown as AuthenticatedAppUser["supabase"]}
}
describe("complete league match snapshots",()=>{
  it("reads all 1488 matches of a maximum-length 32-player season in the authorized scope",async()=>{
    const rows=Array.from({length:1488},(_,i)=>({id:`match-${i}`}))
    const {db,query}=client([{data:rows.slice(0,1000),error:null},{data:rows.slice(1000),error:null}])
    const result=await readLeagueMatchSnapshot(db,["authorized-league"])
    expect(result.data).toEqual(rows)
    expect(query.range.mock.calls).toEqual([[0,999],[1000,1999]])
    expect(query.in.mock.calls).toEqual([["league_id",["authorized-league"]],["league_id",["authorized-league"]]])
    expect(query.order.mock.calls).toEqual([["id"],["id"]])
  })
  it("does not return a partial calendar after a failed subsequent page",async()=>{
    const error={message:"read failed"},{db}=client([{data:Array.from({length:1000},(_,i)=>({id:String(i)})),error:null},{data:null,error}])
    expect(await readLeagueMatchSnapshot(db,["league"])).toEqual({data:null,error})
  })
})
