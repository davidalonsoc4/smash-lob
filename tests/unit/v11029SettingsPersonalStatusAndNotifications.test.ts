import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.29 settings lock, personal status and friendly notification parity", () => {
  it("keeps the whole Settings context reachable during a programmed-season lock", async () => {
    const shell = await read("src/components/layout/AppShell.tsx")

    expect(shell).toContain("const isSettingsContextRoute =")
    expect(shell).toContain("const isScheduledSeasonUtilityRoute =")
    expect(shell).toContain('pathname === "/" ||\n    isSettingsContextRoute ||')
    expect(shell).toContain("scheduledSeasonHomeOnly && !isScheduledSeasonUtilityRoute")
  })

  it("uses the same temporal match lifecycle in Mis partidos and the detail", async () => {
    const card = await read("src/components/personal/PersonalMatchCard.tsx")

    expect(card).toContain('import { getMatchDisplayStatus } from "@/lib/matchLifecycle"')
    expect(card).toContain("const displayStatus = getMatchDisplayStatus({")
    expect(card).toContain('? "En juego"')
    expect(card).toContain('? "Pendiente de resultado"')
    expect(card).toContain("getMatchStatusBadgeClassName(displayStatus)")
  })

  it("renames the player-facing opening state to NOVEDADES", async () => {
    const [countdown, scheduledCheck, push, center] = await Promise.all([
      read("src/components/season/SeasonStartCountdown.tsx"),
      read("src/app/api/notifications/scheduled-check/route.ts"),
      read("src/lib/serverPushDispatch.ts"),
      read("src/app/notifications/page.tsx"),
    ])

    expect(countdown).toContain('tx("¡NOVEDADES!")')
    expect(countdown).not.toContain('tx("HAY NOVEDADES")')
    expect(scheduledCheck).toContain('title: "¡Novedades!"')
    expect(push).toContain('return "¡Novedades!"')
    expect(center).toContain('return "¡Novedades!"')
  })

  it("adds applicable league-equivalent automatic reminders to friendlies", async () => {
    const [route, automation, personalPush, migration] = await Promise.all([
      read("src/app/api/notifications/scheduled-check/route.ts"),
      read("src/lib/serverPersonalMatchAutomation.ts"),
      read("src/lib/serverPersonalMatchPush.ts"),
      read("supabase/migrations/20260821123000_add_personal_match_notification_events.sql"),
    ])

    expect(route).toContain("runPersonalMatchNotificationAutomation({ supabase, now })")
    expect(automation).toContain('eventKey: "upcoming_120"')
    expect(automation).toContain('preferenceKey: "match_upcoming"')
    expect(automation).toContain('title: "Próximo amistoso"')
    expect(automation).toContain("getDueMatchResultReminderHours({")
    expect(automation).toContain('preferenceKey: "match_results"')
    expect(automation).toContain('title: "Falta el resultado"')
    expect(personalPush).toContain('.from("notification_preferences")')
    expect(personalPush).toContain("preferences[preferenceKey]")
    expect(migration).toContain("unique (match_id, event_key)")
  })
})
