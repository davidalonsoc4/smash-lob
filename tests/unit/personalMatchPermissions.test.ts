import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { canManagePersonalMatch } from "@/lib/personalMatchPermissions"

describe("friendly match permissions", () => {
  const creator = "creator-account"
  const partner = "linked-partner-account"
  const opponent = "linked-opponent-account"
  const outsider = "unrelated-account"

  it("allows the creator and every linked participant to edit", () => {
    expect(canManagePersonalMatch(creator, creator, true)).toBe(true)
    expect(canManagePersonalMatch(partner, creator, true)).toBe(true)
    expect(canManagePersonalMatch(opponent, creator, true)).toBe(true)
  })

  it("rejects strangers and external names without linked accounts", () => {
    expect(canManagePersonalMatch(outsider, creator, false)).toBe(false)
    expect(canManagePersonalMatch("", creator, false)).toBe(false)
    expect(canManagePersonalMatch(outsider, null, false)).toBe(false)
  })

  it("keeps creator permissions when an old participant link is missing", () => {
    expect(canManagePersonalMatch(creator, creator, false)).toBe(true)
  })

  it("enforces membership on the server, not only in the UI", async () => {
    const server = await readFile("src/lib/serverPersonalMatches.ts", "utf8")
    const route = await readFile("src/app/api/personal-matches/[id]/route.ts", "utf8")
    expect(server).toContain("canManage: canManagePersonalMatch(")
    expect(server).toContain('.eq("match_id", matchId)')
    expect(server).toContain('.eq("user_id", actor.user.id)')
    expect(server).toContain("personal_match_access_lookup_failed")
    expect(route).toContain("loadManageablePersonalMatch(authResult.actor, matchId)")
    expect(route).toContain('action === "result"')
    expect(route).toContain('action === "schedule"')
    expect(route).toContain('action === "participants"')
  })

  it("preserves other-league accounts when participants are updated", async () => {
    const server = await readFile("src/lib/serverPersonalMatches.ts", "utf8")
    const panel = await readFile("src/components/personal/PersonalMatchParticipantsPanel.tsx", "utf8")
    expect(server).toContain("existingParticipants: ReadonlyArray<")
    expect(server).toContain("const originalParticipants = originalResult.data ?? []")
    expect(server).toContain("    originalParticipants,")
    expect(panel).toContain("const existing = match.participants.flatMap")
  })

  it("does not grant deleting matches or global payment administration to participants", async () => {
    const server = await readFile("src/lib/serverPersonalMatches.ts", "utf8")
    const route = await readFile("src/app/api/personal-matches/[id]/route.ts", "utf8")
    const booking = await readFile("src/components/personal/PersonalMatchCourtBookingPanel.tsx", "utf8")
    expect(server).toContain("canDelete: row.created_by_user_id === currentUserId")
    expect(route).toContain("match.created_by_user_id !== authResult.actor.user.id")
    expect(booking).toContain("canManageAllPayments={match.canDelete}")
  })
})
