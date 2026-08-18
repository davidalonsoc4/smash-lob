import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { buildApplicationToolItems, buildInviteRuleItems, buildSeasonConfigurationItems, type LeagueGuideSettings } from "@/lib/leagueGuide"

const read = (path: string) => readFile(path, "utf8")
const scheduledSettings: LeagueGuideSettings = { seasonStatus: "upcoming", scheduledStartAt: "2026-09-26T08:00:00.000Z", requiresThreeSets: true, mvpSystem: "voting", resultConfirmationMode: "required", registrationFee: { enabled: false, amount: 0, purpose: "" }, rosterMode: "fixed", playerCapacity: 8, registrationOpen: false, scheduleMode: "single", calendarMode: "balanced", roundWindowMode: "fixed-days", roundWindowDays: 14, allowPlayerIncidents: true, allowPlayerSubstitutions: true }

describe("v1.10.4 scheduled-season personal scope and guidance", () => {
  it("keeps global and personal routes outside the active league lock", async () => {
    const shell = await read("src/components/layout/AppShell.tsx")
    expect(shell).toContain('pathname === "/leagues"')
    expect(shell).toContain("isPersonalMatchesRoute ||")
    expect(shell).toContain("isPublicAccessRoute ||")
    expect(shell).toContain('router.replace("/")')
    expect(shell).toContain("scheduledSeasonHomeOnly && !isScheduledSeasonUtilityRoute")
    expect(shell).toContain('<BottomNav homeOnlyLocked={scheduledSeasonHomeOnly} />')
    expect(shell).toContain('const shouldShowLeagueSearch =\n    pathname === "/leagues"')
    expect(shell).toContain('const shouldShowPersonalMatchesNav =\n    isPersonalMatchesRoute')
    expect(shell).not.toContain('!scheduledSeasonHomeOnly && pathname === "/leagues"')
    expect(shell).not.toContain("!scheduledSeasonHomeOnly && isPersonalMatchesRoute")
  })
  it("documents personal scope and the scheduled-season boundary in Help", () => {
    for (const locale of ["es", "en", "eu"] as const) {
      const tools = buildApplicationToolItems({ settings: scheduledSettings, locale })
      expect(tools.map((item) => item.id)).toEqual(expect.arrayContaining(["league-scope", "scheduled-season-access", "friendly-matches"]))
      const season = buildSeasonConfigurationItems({ settings: scheduledSettings, locale, registrationAmountLabel: "0 €" })
      expect(season[0]?.id).toBe("scheduled-season")
    }
  })
  it("adds the scheduled-start boundary to invitation rules only while upcoming", () => {
    const upcomingRules = buildInviteRuleItems({ settings: scheduledSettings, locale: "es", registrationAmountLabel: "0 €" })
    expect(upcomingRules.map((item) => item.id)).toContain("invite-scheduled-start")
    expect(upcomingRules.find((item) => item.id === "invite-scheduled-start")?.description).toContain("Mis ligas")
    expect(upcomingRules.find((item) => item.id === "invite-scheduled-start")?.description).toContain("Mis partidos")
    const activeRules = buildInviteRuleItems({ settings: { ...scheduledSettings, seasonStatus: "active" }, locale: "es", registrationAmountLabel: "0 €" })
    expect(activeRules.map((item) => item.id)).not.toContain("invite-scheduled-start")
  })
  it("passes real season status into Help and invite guidance and refreshes tutorials", async () => {
    const [help, invite, tours] = await Promise.all([read("src/app/help/page.tsx"), read("src/components/invite/InviteFlow.tsx"), read("src/features/onboarding/tours.ts")])
    expect(help).toContain("seasonStatus: activeSeason.status")
    expect(invite).toContain("seasonStatus: activeSeason?.status")
    expect(tours).toContain("solo su competición queda bloqueada")
    expect(tours).toContain("administradores conservan acceso normal al calendario y la gestión")
    expect(tours).toContain('key: "home",\n    version: 7')
    expect(tours).toContain('key: "settings",\n    version: 4')
    expect(tours).toContain('key: "season-admin",\n    version: 3')
  })
})
