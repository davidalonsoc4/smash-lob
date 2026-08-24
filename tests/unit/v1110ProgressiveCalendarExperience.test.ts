import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import {
  getEffectiveRevealedThroughRound,
  getOfficialRoundStart,
  getOfficiallyStartedThroughRound,
  redactProgressiveMatch,
} from "@/lib/progressiveCalendar"

const read = (path: string) => readFile(path, "utf8")

function match(round: number, status: MatchData["status"] = "scheduling"): MatchData {
  return {
    id: `m-${round}`,
    leagueId: "league-1",
    seasonId: "season-1",
    round,
    teamA: ["p1", "p2"],
    teamB: ["p3", "p4"],
    pointsA: null,
    pointsB: null,
    sets: [],
    status,
    scheduledAt: null,
    dateLabel: null,
    location: null,
    resultRecordedAt: null,
    resultReportedByPlayerId: null,
    resultLocked: false,
    rankingCounts: true,
    resultCounts: true,
    coordinationStatus: null,
    incidentType: null,
    incidentStatus: null,
    incidentReason: null,
    incidentNotes: null,
    incidentCreatedAt: null,
    incidentResolvedAt: null,
    resolutionType: null,
    substitutions: [],
    courtBooking: {
      isReserved: false,
      reservations: [],
      ballPurchases: [],
      transfers: [],
      updatedAt: null,
    },
  } as MatchData
}

const progressiveSettings = {
  calendarVisibilityMode: "progressive" as const,
  revealedThroughRound: 1,
  openingRoundEnabled: true,
  openingRoundAt: "2026-09-27T08:00:00.000Z",
  roundWindowMode: "fixed-days" as const,
  seasonStartsAt: "2026-09-28",
  roundWindowDays: 14,
}

describe("v1.11.0 progressive calendar and player experience", () => {
  it("keeps the opening round outside the regular 14-day cadence in Europe/Madrid", () => {
    expect(getOfficialRoundStart({ round: 1, settings: progressiveSettings })?.toISOString()).toBe(
      "2026-09-27T08:00:00.000Z",
    )
    expect(getOfficialRoundStart({ round: 2, settings: progressiveSettings })?.toISOString()).toBe(
      "2026-09-27T22:00:00.000Z",
    )
    expect(getOfficialRoundStart({ round: 3, settings: progressiveSettings })?.toISOString()).toBe(
      "2026-10-11T22:00:00.000Z",
    )
    expect(getOfficialRoundStart({ round: 4, settings: progressiveSettings })?.toISOString()).toBe(
      "2026-10-25T23:00:00.000Z",
    )
  })

  it("reveals the next round on completion and never later than its official start", () => {
    const matches = [match(1, "finished"), match(2), match(3), match(4)]
    expect(
      getEffectiveRevealedThroughRound({
        seasonStatus: "active",
        totalRounds: 4,
        settings: progressiveSettings,
        matches,
        now: new Date("2026-09-27T12:00:00.000Z"),
      }),
    ).toBe(2)

    expect(
      getOfficiallyStartedThroughRound({
        totalRounds: 4,
        settings: progressiveSettings,
        now: new Date("2026-10-11T22:00:00.000Z"),
      }),
    ).toBe(3)

    expect(
      getEffectiveRevealedThroughRound({
        seasonStatus: "active",
        totalRounds: 4,
        settings: progressiveSettings,
        matches: [match(1), match(2), match(3), match(4)],
        now: new Date("2026-10-11T22:00:00.000Z"),
      }),
    ).toBe(3)
  })

  it("does not auto-reveal an upcoming season and fully redacts hidden match details", () => {
    const hidden = match(3, "scheduled")
    hidden.scheduledAt = "2026-10-12T18:00:00.000Z"
    hidden.location = "Pando"
    hidden.pointsA = 2
    hidden.courtBooking.isReserved = true

    expect(
      getEffectiveRevealedThroughRound({
        seasonStatus: "upcoming",
        totalRounds: 4,
        settings: { ...progressiveSettings, revealedThroughRound: 0 },
        matches: [hidden],
        now: new Date("2026-10-20T12:00:00.000Z"),
      }),
    ).toBe(0)

    const redacted = redactProgressiveMatch(hidden)
    expect(redacted.teamA).toEqual([])
    expect(redacted.teamB).toEqual([])
    expect(redacted.scheduledAt).toBeNull()
    expect(redacted.location).toBeNull()
    expect(redacted.pointsA).toBeNull()
    expect(redacted.courtBooking.isReserved).toBe(false)
  })

  it("persists progressive visibility, opening round and per-league experience mode", async () => {
    const [migration, repairMigration, openingLocationMigration, schemaProbe, access, settingsApi, createApi, experienceApi, adminSeason, settingsSearch] = await Promise.all([
      read("supabase/migrations/20260824011500_add_progressive_calendar_and_experience_mode.sql"),
      read("supabase/migrations/20260824090500_repair_progressive_experience_schema.sql"),
      read("supabase/migrations/20260824115500_add_opening_round_location.sql"),
      read("scripts/verify-v1110-pre-schema.mjs"),
      read("src/app/api/access/route.ts"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/app/api/leagues/[id]/experience-mode/route.ts"),
      read("src/app/admin/season/page.tsx"),
      read("src/lib/settingsSearch.ts"),
    ])

    expect(migration).toContain("calendar_visibility_mode text not null default 'full'")
    expect(migration).toContain("revealed_through_round integer not null default 0")
    expect(migration).toContain("opening_round_enabled boolean not null default false")
    expect(migration).toContain("experience_mode text not null default 'admin'")
    expect(repairMigration).toContain("add column if not exists experience_mode text")
    expect(repairMigration).toContain("notify pgrst, 'reload schema'")
    expect(openingLocationMigration).toContain("opening_round_location text")
    expect(schemaProbe).toContain('select("experience_mode")')
    expect(schemaProbe).toContain("opening_round_location")
    expect(schemaProbe).toContain("v1.11.0 PRE schema probe: OK")
    expect(settingsApi).toContain("calendarVisibilityMode")
    expect(settingsApi).toContain("openingRoundEnabled")
    expect(settingsApi).toContain("openingRoundLocation")
    expect(createApi).toContain("openingRoundAt")
    expect(createApi).toContain("openingRoundLocation")
    expect(adminSeason).toContain("openingRoundLocationId")
    expect(adminSeason).toContain("createScheduledLeagueLocationValue(selectedOpeningLocation, null)")
    expect(settingsSearch).toContain('title: "Modo de experiencia"')
    expect(settingsSearch).toContain('"preseasonSecrets"')
    expect(settingsSearch).toContain('"openingRound"')
    expect(settingsSearch).toContain('"calendarVisibility"')
    expect(settingsSearch).toContain('"rerollCalendar"')
    expect(access).toContain("canSeeCompetitionAdminData")
    expect(access).toContain("redactProgressiveMatch")
    expect(experienceApi).toContain('value === "admin" || value === "player" || value === "player_experience"')
  })

  it("makes player experience affect competition data even for superusers and keeps explicit admin access in hybrid mode", async () => {
    const [access, matchAccess, leagueAccess, settings, shell] = await Promise.all([
      read("src/app/api/access/route.ts"),
      read("src/lib/serverMatchAccess.ts"),
      read("src/context/LeagueAccessProvider.tsx"),
      read("src/app/settings/page.tsx"),
      read("src/components/layout/AppShell.tsx"),
    ])

    expect(access).toContain("if (!membership) return isSuperuser")
    expect(access).toContain('membership.experienceMode === "player_experience"')
    expect(matchAccess).toContain('const experienceMode = membership?.experienceMode ?? "admin"')
    expect(matchAccess).toContain('(!membership || experienceMode === "admin")')
    expect(leagueAccess).toContain('mode === "admin" || (mode === "player_experience" && adminSnapshotContext)')
    expect(settings).toContain("EXPERIENCIA JUGADOR")
    expect(settings).toContain("Solo este ajuste seguirá permitiéndote volver a modo admin.")
    expect(settings).toContain('role="radiogroup"')
    expect(settings).toContain('role="radio"')
    expect(shell).toContain("isAdminOnlyRoute")
  })

  it("protects hidden pairings across chat, activity and push while supporting a true balanced-calendar reroll", async () => {
    const [chats, serverActivity, serverPush, mutations, repairApi, admin] = await Promise.all([
      read("src/app/api/chats/route.ts"),
      read("src/lib/serverActivity.ts"),
      read("src/lib/serverPushDispatch.ts"),
      read("src/lib/serverSeasonMutations.ts"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/repair-calendar/route.ts"),
      read("src/app/admin/season/page.tsx"),
    ])

    expect(chats).toContain("getEffectiveRevealedThroughRound")
    expect(chats).toContain("visibleMatchRows")
    expect(chats).toContain('settingsResult.data?.calendar_visibility_mode === "progressive"')
    expect(serverActivity).toContain("hiddenMatchIds")
    expect(serverActivity).toContain("revealed_through_round")
    expect(serverActivity).toContain("viewer.isCompetitionAdmin")
    expect(serverPush).toContain('reason: "progressive_round_hidden"')
    expect(serverPush).toContain("revealed_through_round")
    expect(mutations).toContain("randomInt")
    expect(mutations).toContain("season_calendar_reroll_no_alternative")
    expect(mutations).toContain("opening_round_schedule_sync_failed")
    expect(mutations).toContain("location: settings.openingRoundLocation ?? null")
    expect(mutations).toContain("location: openingRoundAt && match.round === 1 ? openingRoundLocation : null")
    expect(repairApi).toContain("const reroll = body?.reroll === true")
    expect(admin).toContain("t.adminSeason.rerollButton")
    expect(admin).toContain("rerollCalendar")
  })
})
