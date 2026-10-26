import { describe, expect, it } from "vitest"
import { groupGlobalChats, type GlobalChatTiming } from "@/lib/globalChatOverview"
const now=Date.parse("2026-10-25T10:00:00Z")
const chat=(id:string,overrides:Partial<GlobalChatTiming>={}):GlobalChatTiming=>({id,origin:"league",round:2,currentRound:2,seasonStatus:"active",status:"scheduling",scheduledAt:null,resultRecordedAt:null,readOnly:false,lastMessage:null,...overrides})
describe("global chat grouping and proximity",()=>{
  it("never treats a remote round as active even if somebody has already posted",()=>{
    const groups=groupGlobalChats([chat("r10",{round:10,lastMessage:{createdAt:new Date(now).toISOString()}}),chat("r4",{round:4}),chat("r3",{round:3}),chat("r2")],now)
    expect(groups.active.map(chat=>chat.id)).toEqual(["r2","r3","r4"])
    expect(groups.upcoming.map(chat=>chat.id)).toEqual(["r10"])
  })
  it("puts finished seasons and matches in history and upcoming seasons out of active",()=>{
    const groups=groupGlobalChats([chat("old",{seasonStatus:"finished"}),chat("done",{status:"finished"}),chat("next",{seasonStatus:"upcoming"}),chat("friendly",{origin:"friendly",scheduledAt:new Date(now+86400000).toISOString()})],now)
    expect(groups.finished).toHaveLength(2)
    expect(groups.upcoming[0].id).toBe("next")
    expect(groups.active[0].id).toBe("friendly")
  })
  it("sorts booked nearby fixtures chronologically, not from most distant to nearest",()=>{
    const groups=groupGlobalChats([chat("later",{scheduledAt:new Date(now+3*86400000).toISOString()}),chat("soon",{scheduledAt:new Date(now+86400000).toISOString()})],now)
    expect(groups.active.map(chat=>chat.id)).toEqual(["soon","later"])
  })
})
