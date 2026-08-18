import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.15 scheduled self-registration calendar preparation", () => {
  it("prepares existing and future scheduled seasons before due activation", async () => {
    const [access, scheduler] = await Promise.all([
      read("src/app/api/access/route.ts"),
      read("src/lib/serverScheduledSeason.ts"),
    ])

    const prepareCalendarCall = access.indexOf(
      "await prepareScheduledSeasonCalendars",
    )
    const activateSeasonCall = access.indexOf(
      "await activateDueScheduledSeasons",
    )

    expect(prepareCalendarCall).toBeGreaterThan(-1)
    expect(activateSeasonCall).toBeGreaterThan(-1)
    expect(prepareCalendarCall).toBeLessThan(activateSeasonCall)
    expect(scheduler).toContain(
      'eq("roster_mode", "self_registration")',
    )
    expect(scheduler).toContain(
      '.not("scheduled_start_at", "is", null)',
    )
    expect(scheduler).toContain(
      "prepareServerSelfRegistrationSeasonCalendar",
    )
    expect(scheduler).toContain(
      'joinedSeason.status !== "upcoming"',
    )
  })

  it("generates the deterministic balanced calendar without activating the season", async () => {
    const [mutations, migration] = await Promise.all([
      read("src/lib/serverSeasonMutations.ts"),
      read(
        "supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql",
      ),
    ])

    expect(mutations).toContain(
      "prepareServerSelfRegistrationSeasonCalendar",
    )
    expect(mutations).toContain(
      '"server_prepare_self_registration_season_calendar"',
    )
    expect(mutations).toContain("generateBalancedCalendar({")
    expect(mutations).toContain(
      'typeof settingsRow.scheduled_start_at !== "string"',
    )

    const prepareSql = migration.split(
      "-- If the roster changes before the scheduled start",
    )[0]

    expect(prepareSql).toContain(
      "CREATE OR REPLACE FUNCTION public.server_prepare_self_registration_season_calendar",
    )
    expect(prepareSql).toContain("v_season.status <> 'upcoming'")
    expect(prepareSql).toContain("v_settings.scheduled_start_at IS NULL")
    expect(prepareSql).toContain("INSERT INTO public.matches")
    expect(prepareSql).not.toContain("SET status = 'active'")
    expect(prepareSql).not.toContain("active_season_id")
  })

  it("reuses a prepared calendar at real start instead of duplicating matches", async () => {
    const [mutations, migration] = await Promise.all([
      read("src/lib/serverSeasonMutations.ts"),
      read(
        "supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql",
      ),
    ])

    expect(mutations).toContain('"season_calendar_invalid"')
    expect(mutations).not.toContain('"season_matches_already_exist"')

    const startSql = migration.split(
      "-- Starting a self-registration season now reuses a calendar prepared while it was upcoming.",
    )[1]

    expect(startSql).toContain(
      "CREATE OR REPLACE FUNCTION public.server_start_self_registration_season",
    )
    expect(startSql).toContain("IF v_existing_matches > 0 THEN")
    expect(startSql).toContain("v_existing_matches <> v_expected_matches")
    expect(startSql).toContain("RAISE EXCEPTION 'season_calendar_invalid'")
    expect(startSql).toContain("ELSE")
    expect(startSql).toContain("INSERT INTO public.matches")
    expect(startSql).toContain("SET status = 'active'")
  })

  it("invalidates prepared matches if the pre-start roster changes", async () => {
    const migration = await read(
      "supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql",
    )

    const removeSql = migration
      .split("-- If the roster changes before the scheduled start")[1]
      .split(
        "-- Starting a self-registration season now reuses a calendar prepared while it was upcoming.",
      )[0]

    expect(removeSql).toContain(
      "CREATE OR REPLACE FUNCTION public.server_remove_self_registration_player",
    )
    expect(removeSql).toContain("DELETE FROM public.matches AS match_row")
    expect(removeSql).toContain("registration_open = true")
    expect(removeSql).toContain("roster_completed_at = NULL")
  })

  it("keeps registration payments as an activation gate, not a calendar-generation gate", async () => {
    const migration = await read(
      "supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql",
    )

    const prepareSql = migration.split(
      "-- If the roster changes before the scheduled start",
    )[0]
    const startSql = migration.split(
      "-- Starting a self-registration season now reuses a calendar prepared while it was upcoming.",
    )[1]

    expect(prepareSql).not.toContain("registration_unsettled")
    expect(startSql).toContain("registration_unsettled")
  })
})
