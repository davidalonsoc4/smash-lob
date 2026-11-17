import { describe, expect, it } from "vitest"
import {
  LEAGUE_CHAT_DELETE_WINDOW_MS,
  LEAGUE_CHAT_EDIT_WINDOW_MS,
  canDeleteLeagueChatMessage,
  canEditLeagueChatMessage,
} from "@/lib/leagueChatChangeWindow"

const sentAt = new Date("2026-11-17T12:00:00Z")
const later = (ms: number) => sentAt.getTime() + ms

describe("time limit to edit or delete a league chat message", () => {
  it("allows editing for 15 minutes and deleting for 1 hour", () => {
    expect(LEAGUE_CHAT_EDIT_WINDOW_MS).toBe(15 * 60_000)
    expect(LEAGUE_CHAT_DELETE_WINDOW_MS).toBe(60 * 60_000)
  })

  it("edits are possible until the 15 minutes are over", () => {
    const iso = sentAt.toISOString()
    expect(canEditLeagueChatMessage(iso, later(0))).toBe(true)
    expect(canEditLeagueChatMessage(iso, later(LEAGUE_CHAT_EDIT_WINDOW_MS))).toBe(true)
    expect(canEditLeagueChatMessage(iso, later(LEAGUE_CHAT_EDIT_WINDOW_MS + 1))).toBe(false)
  })

  it("deleting stays possible after editing is no longer allowed, up to 1 hour", () => {
    const iso = sentAt.toISOString()
    const twentyMinutes = later(20 * 60_000)
    expect(canEditLeagueChatMessage(iso, twentyMinutes)).toBe(false)
    expect(canDeleteLeagueChatMessage(iso, twentyMinutes)).toBe(true)
    expect(canDeleteLeagueChatMessage(iso, later(LEAGUE_CHAT_DELETE_WINDOW_MS + 1))).toBe(false)
  })

  it("never offers changes for a missing or invalid date", () => {
    expect(canEditLeagueChatMessage("not a date")).toBe(false)
    expect(canDeleteLeagueChatMessage("")).toBe(false)
  })
})
