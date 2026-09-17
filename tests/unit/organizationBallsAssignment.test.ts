import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  isBallsAssignmentPriorityRef,
  hasScheduledStartChanged,
  moveBallsAssignmentPriority,
  resolveBallsAssignmentPriority,
} from "@/lib/organizationBallsAssignment"

describe("organization ball assignment priorities", () => {
  it("accepts stable references for saved, draft, app, and self players", () => {
    expect(isBallsAssignmentPriorityRef("61c7a276-c36b-4c1f-9a2a-c9a26089280e")).toBe(true)
    expect(isBallsAssignmentPriorityRef("new:0")).toBe(true)
    expect(isBallsAssignmentPriorityRef("app:61c7a276-c36b-4c1f-9a2a-c9a26089280e")).toBe(true)
    expect(isBallsAssignmentPriorityRef("self:creator")).toBe(true)
    expect(isBallsAssignmentPriorityRef("new:-1")).toBe(false)
    expect(isBallsAssignmentPriorityRef("app:not-a-uuid")).toBe(false)
  })

  it("allows an unchanged historical start date while detecting real schedule edits", () => {
    expect(hasScheduledStartChanged("2026-08-26T09:00:00.000Z", "2026-08-26T11:00:00+02:00")).toBe(false)
    expect(hasScheduledStartChanged("2026-08-26T09:00:00.000Z", null)).toBe(true)
    expect(hasScheduledStartChanged(null, "2026-09-18T09:00:00.000Z")).toBe(true)
  })

  it("moves entries in either direction and keeps boundary moves unchanged", () => {
    const priority = ["david", "alain", "alvaro"]

    expect(moveBallsAssignmentPriority(priority, 1, -1)).toEqual(["alain", "david", "alvaro"])
    expect(moveBallsAssignmentPriority(priority, 1, 1)).toEqual(["david", "alvaro", "alain"])
    expect(moveBallsAssignmentPriority(priority, 0, -1)).toEqual(priority)
    expect(moveBallsAssignmentPriority(priority, 2, 1)).toEqual(priority)
  })

  it("resolves submitted order to the IDs created for the season roster", () => {
    expect(
      resolveBallsAssignmentPriority({
        refs: [
          "app:61c7a276-c36b-4c1f-9a2a-c9a26089280e",
          "new:1",
          "e9400016-a53e-4e4d-a006-844d8494b348",
          "self:creator",
        ],
        finalPlayerIds: [
          "e9400016-a53e-4e4d-a006-844d8494b348",
          "new-player-0",
          "new-player-1",
          "app-player-0",
          "creator-player",
        ],
        newPlayerIds: ["new-player-0", "new-player-1"],
        appUserIds: ["61c7a276-c36b-4c1f-9a2a-c9a26089280e"],
        appPlayerIds: ["app-player-0"],
        selfPlayerId: "creator-player",
      }),
    ).toEqual(["app-player-0", "new-player-1", "e9400016-a53e-4e4d-a006-844d8494b348", "creator-player"])
  })

  it("rejects references that cannot resolve to a unique roster member", () => {
    const common = {
      finalPlayerIds: ["player-1"],
      newPlayerIds: [],
      appUserIds: [],
      appPlayerIds: [],
      selfPlayerId: null,
    }
    expect(resolveBallsAssignmentPriority({ ...common, refs: ["new:0"] })).toBeNull()
    expect(resolveBallsAssignmentPriority({ ...common, refs: ["player-1", "player-1"] })).toBeNull()
  })

  it("wires draft priority references through season creation", async () => {
    const route = await readFile("src/app/api/leagues/[id]/seasons/route.ts", "utf8")
    const form = await readFile("src/app/admin/season/page.tsx", "utf8")
    const priorityHelper = await readFile("src/lib/organizationBallsAssignment.ts", "utf8")
    const mutations = await readFile("src/lib/serverSeasonMutations.ts", "utf8")

    expect(route).toContain("parseBallsAssignmentPriority(body?.ballsAssignmentPriority ?? [])")
    expect(form).toContain("buildBallsAssignmentPriorityEntries({")
    expect(form).toContain("{player.name}")
    expect(form).toContain('href: "#bolas-organizacion", label: "Bolas asignadas"')
    expect(form).toContain("preview.custodianPlayerIds.map((playerId)")
    expect(form).toContain("preview.botesByPlayerId[playerId]")
    expect(form).toContain("El reparto se calculará cuando la plantilla esté completa y se genere el calendario.")
    expect(form).toContain("moveBallsAssignmentPriority(normalizedPriority, index, -1)")
    expect(form).toContain("moveBallsAssignmentPriority(normalizedPriority, index, 1)")
    expect(form).toContain("moveBallsAssignmentPriority(effectiveBallsAssignmentPriority, index, -1)")
    expect(form).toContain("moveBallsAssignmentPriority(effectiveBallsAssignmentPriority, index, 1)")
    expect(priorityHelper).toContain('ref: `new:${index}`')
    expect(priorityHelper).toContain('ref: `app:${userId}`')
    expect(mutations).toContain("resolveBallsAssignmentPriority({")
  })

  it("persists the selected-custodian mode and validates schedule coverage", async () => {
    const [route, settingsRoute, form, mutations, migration] = await Promise.all([
      readFile("src/app/api/leagues/[id]/seasons/route.ts", "utf8"),
      readFile("src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts", "utf8"),
      readFile("src/app/admin/season/page.tsx", "utf8"),
      readFile("src/lib/serverSeasonMutations.ts", "utf8"),
      readFile("supabase/migrations/20260917120000_add_manual_ball_custodian_selection.sql", "utf8"),
    ])

    expect(route).toContain("ballsAssignmentCustodianIds")
    expect(form).toContain('setBallsAssignmentMode("selected")')
    expect(form).toContain("ballsAssignmentCustodianIds: effectiveBallsAssignmentCustodianRefs")
    expect(mutations).toContain("balls_assignment_custodian_ids: cleanBallsAssignmentCustodianIds")
    expect(mutations).toContain("balls_assignment_custodians_do_not_cover_schedule")
    expect(settingsRoute.indexOf("const { data: ballsSettings"))
      .toBeLessThan(settingsRoute.indexOf('if (access.season.status !== "upcoming")'))
    expect(migration).toContain("balls_assignment_mode IN ('priority', 'selected')")
    expect(migration).toContain("balls_assignment_custodian_ids uuid[]")
  })
})
