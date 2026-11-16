import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { sanitizePublicPersonalMatch } from "@/lib/publicPersonalMatch"
import { getPublicPersonalMatchUrl } from "@/lib/personalMatchShare"
import { proxy } from "@/proxy"

const participants = [
  { team: 2, slot: 2, display_name: "Dani", user_id: "secret-user-4", avatar_url: "https://x/a.png" },
  { team: 1, slot: 2, display_name: " Bea ", user_id: "secret-user-2" },
  { team: 1, slot: 1, display_name: "Ana", user_id: "secret-user-1" },
  { team: 2, slot: 1, display_name: null, user_id: null },
]

describe("public personal match projection", () => {
  it("exposes only names, date, place and result, ordered by team and slot", () => {
    const view = sanitizePublicPersonalMatch(
      { played_at: "2026-11-20T18:00:00.000Z", location_name: "Club Norte", sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }], status: "finished" },
      participants,
    )

    expect(view).toEqual({
      status: "finished",
      scheduledAt: "2026-11-20T18:00:00.000Z",
      location: "Club Norte",
      teams: [["Ana", "Bea"], ["Jugador", "Dani"]],
      sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 7, b: 5 }],
    })
    expect(JSON.stringify(view)).not.toMatch(/secret-user|avatar|a\.png/)
  })

  it("hides placeholder sets until the match is finished and drops malformed ones", () => {
    const scheduled = sanitizePublicPersonalMatch(
      { played_at: null, location_name: null, sets: [{ a: 0, b: 0 }], status: "scheduled" },
      participants,
    )
    expect(scheduled).toMatchObject({ status: "scheduled", scheduledAt: null, location: null, sets: [] })

    const finished = sanitizePublicPersonalMatch(
      { played_at: null, location_name: null, sets: [{ a: 6, b: 1 }, { a: "x", b: 2 }, null, { a: 1.5, b: 2 }], status: "finished" },
      participants,
    )
    expect(finished.sets).toEqual([{ a: 6, b: 1 }])
  })

  it("builds a stable, single-purpose URL under the spectator namespace", () => {
    expect(getPublicPersonalMatchUrl(" PM-ABCD-EFGH-JKLM ")).toMatch(/\/spectate\/match\/PM-ABCD-EFGH-JKLM$/)
  })

  it("lets the anonymous share link through the proxy without widening the route", () => {
    expect(proxy(new NextRequest("https://smashandlob.com/spectate/match/PM-ABCD-EFGH-JKLM")).status).not.toBe(404)
    expect(proxy(new NextRequest("https://smashandlob.com/spectate/match/PM-ABCD-EFGH-JKLM/extra")).status).toBe(404)
  })
})
