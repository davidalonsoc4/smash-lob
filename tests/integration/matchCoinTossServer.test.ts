import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { chooseCoinToss, loadCoinToss, runCoinTossAction, tossCoin } from "@/lib/serverMatchCoinToss"

/** A one-table stand-in for Supabase: enough of the query chain used by the coin toss. */
function fakeSupabase() {
  let row: Record<string, unknown> | null = null
  const table = () => {
    let mode: "select" | "update" | "upsert" = "select"
    let patch: Record<string, unknown> = {}
    const filters: Array<[string, unknown]> = []
    const matches = () => row && filters.every(([column, value]) => (value === null ? row![column] == null : row![column] === value))
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (column: string, value: unknown) => { filters.push([column, value]); return chain },
      is: (column: string, value: unknown) => { filters.push([column, value]); return chain },
      update: (next: Record<string, unknown>) => { mode = "update"; patch = next; return chain },
      upsert: (next: Record<string, unknown>) => { mode = "upsert"; patch = next; return chain },
      maybeSingle: async () => {
        const found = matches()
        if (mode === "update" && found) row = { ...row, ...patch }
        return { data: found ? row : null, error: null }
      },
      single: async () => { row = { ...(row ?? {}), ...patch }; return { data: row, error: null } },
    }
    return chain
  }
  return { client: { from: () => table() } as never, get row() { return row } }
}

const target = { kind: "friendly" as const, matchId: "m1" }
const open = { state: "open" as const, opensAt: null }

describe("coin toss on the server", () => {
  it("decides the face itself and the called team decides the winner", async () => {
    const { client } = fakeSupabase()
    const faces = new Set<string>()
    for (let index = 0; index < 40; index++) {
      const tossed = await tossCoin(client, target, "user", 1)
      expect(tossed.ok).toBe(true)
      if (tossed.ok) {
        faces.add(tossed.toss.result)
        expect(tossed.toss.winnerTeam).toBe(tossed.toss.result === "heads" ? 1 : 2)
        expect(tossed.toss.winnerChoice).toBeNull()
      }
    }
    expect(faces).toEqual(new Set(["heads", "tails"]))
  })

  it("repeating replaces the toss and the choices, and counts one more", async () => {
    const fake = fakeSupabase()
    await tossCoin(fake.client, target, "user", 1)
    await chooseCoinToss(fake.client, target, "serve")
    const again = await tossCoin(fake.client, target, "user", 2)
    expect(again.ok && again.toss).toMatchObject({ tossCount: 2, winnerChoice: null, servingTeam: null, calledHeadsTeam: 2 })
  })

  it("lets the winner pick serve or return, once", async () => {
    const fake = fakeSupabase()
    await tossCoin(fake.client, target, "user", 1)
    const toss = await loadCoinToss(fake.client, target)
    const winner = toss.ok && toss.toss ? toss.toss.winnerTeam : 1
    const chosen = await chooseCoinToss(fake.client, target, "return")
    expect(chosen.ok && chosen.toss).toMatchObject({ winnerChoice: "return", servingTeam: winner === 1 ? 2 : 1 })
    expect(await chooseCoinToss(fake.client, target, "serve")).toEqual({ ok: false, error: "already_chosen" })
  })

  it("after a side choice, the other team picks serve or return, and cannot pick the side again", async () => {
    const fake = fakeSupabase()
    await tossCoin(fake.client, target, "user", 1)
    const toss = await loadCoinToss(fake.client, target)
    const winner = toss.ok && toss.toss ? toss.toss.winnerTeam : 1
    const side = await chooseCoinToss(fake.client, target, "side")
    expect(side.ok && side.toss).toMatchObject({ winnerChoice: "side", servingTeam: null })
    expect(await chooseCoinToss(fake.client, target, "side")).toEqual({ ok: false, error: "invalid_choice" })
    const other = await chooseCoinToss(fake.client, target, "serve")
    expect(other.ok && other.toss).toMatchObject({ otherChoice: "serve", servingTeam: winner === 1 ? 2 : 1 })
  })

  it("cannot pick before there is a toss", async () => {
    expect(await chooseCoinToss(fakeSupabase().client, target, "serve")).toEqual({ ok: false, error: "no_toss" })
  })
})

describe("coin toss requests", () => {
  const body = (value: unknown) => value as { action?: unknown; headsTeam?: unknown; choice?: unknown }

  it("rejects malformed requests", async () => {
    const { client } = fakeSupabase()
    for (const bad of [null, { action: "toss" }, { action: "toss", headsTeam: 3 }, { action: "choose", choice: "left" }, { action: "nope" }]) {
      expect((await runCoinTossAction({ supabase: client, target, userId: "u", body: body(bad), window: open })).status).toBe(400)
    }
  })

  it("does not toss outside the window", async () => {
    const { client } = fakeSupabase()
    const early = { state: "early" as const, opensAt: "2026-11-26T15:30:00.000Z" }
    const result = await runCoinTossAction({ supabase: client, target, userId: "u", body: { action: "toss", headsTeam: 1 }, window: early })
    expect(result).toMatchObject({ status: 409, json: { error: "coin_toss_closed" } })
  })

  it("tosses inside the window", async () => {
    const { client } = fakeSupabase()
    const result = await runCoinTossAction({ supabase: client, target, userId: "u", body: { action: "toss", headsTeam: 2 }, window: open })
    expect(result.status).toBe(200)
    expect(result.json.coinToss).toMatchObject({ calledHeadsTeam: 2, tossCount: 1 })
  })
})
