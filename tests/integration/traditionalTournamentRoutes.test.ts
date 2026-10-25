import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks=vi.hoisted(()=>({access:vi.fn(),command:vi.fn(),limit:vi.fn()}))
vi.mock("@/lib/serverRapidTournaments",()=>({requireRapidTournamentCreator:mocks.access}))
vi.mock("@/lib/serverTraditionalTournaments",()=>({executeTraditionalTournamentCommand:mocks.command}))
vi.mock("@/lib/serverRateLimit",()=>({enforceRequestRateLimit:mocks.limit}))
import { PATCH } from "@/app/api/tournaments/[id]/traditional/route"
const id="47b0b645-4790-491f-8f15-b1fe8bf8be13",actor={user:{id:"creator"}}
const params={params:Promise.resolve({id})}
const request=(body:unknown)=>new Request(`http://localhost/api/tournaments/${id}/traditional`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
describe("traditional tournament management route",()=>{
  beforeEach(()=>{
    vi.clearAllMocks();mocks.limit.mockResolvedValue(null)
    mocks.access.mockResolvedValue({ok:true,actor,tournamentId:id})
    mocks.command.mockResolvedValue({ok:true,revision:4})
  })
  it.each([401,403,404])("does not mutate without creator authorization (%i)",async status=>{
    mocks.access.mockResolvedValue({ok:false,status,error:"tournament_not_found"})
    expect((await PATCH(request({action:"start",revision:3}),params)).status).toBe(status)
    expect(mocks.command).not.toHaveBeenCalled()
  })
  it("passes the authenticated actor and preserves revision conflict responses",async()=>{
    const body={action:"result",revision:3,matchId:"main-1-1",scoreA:20,scoreB:10}
    const response=await PATCH(request(body),params)
    expect(response.status).toBe(200);expect(await response.json()).toEqual({ok:true,revision:4})
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(mocks.command).toHaveBeenCalledWith(actor,id,body)
    mocks.command.mockResolvedValue({ok:false,status:409,error:"traditional_tournament_changed_refresh"})
    expect((await PATCH(request(body),params)).status).toBe(409)
  })
  it("enforces rate limits before access or mutation",async()=>{
    mocks.limit.mockResolvedValue(new Response(null,{status:429}))
    expect((await PATCH(request({action:"start",revision:3}),params)).status).toBe(429)
    expect(mocks.access).not.toHaveBeenCalled();expect(mocks.command).not.toHaveBeenCalled()
  })
  it("rejects malformed JSON without executing a command",async()=>{
    expect((await PATCH(new Request("http://localhost",{method:"PATCH",body:"{"}),params)).status).toBe(400)
    expect(mocks.command).not.toHaveBeenCalled()
  })
})
