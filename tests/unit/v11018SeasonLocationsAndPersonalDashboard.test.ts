import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.18 season roster, locations and personal dashboard", () => {
  it("auto-enrolls selected continuing players in later self-registration seasons without inheriting paid fees", async () => {
    const [page, route, server] = await Promise.all([
      read("src/app/admin/season/page.tsx"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/lib/serverSeasonMutations.ts"),
    ])

    expect(page).toContain("Los jugadores de la temporada anterior están seleccionados por defecto")
    expect(page).toContain("playerIds: selectedPlayerIds")
    expect(route).toContain("playerIds.length > playerCapacity")
    expect(server).toContain("shouldAutoEnrollCreator")
    expect(server).toContain("isFirstLeagueSeason")
    expect(server).toContain("paidPlayerIds: []")
    expect(server).toContain("registrationOpen:")
  })

  it("can select registered app users using only public profile identity and link them directly into the league", async () => {
    const [page, directory, route, server] = await Promise.all([
      read("src/app/admin/season/page.tsx"),
      read("src/app/api/leagues/[id]/player-directory/route.ts"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/lib/serverSeasonMutations.ts"),
    ])

    expect(page).toContain("Seleccionar jugador de Smash & Lob")
    expect(page).toContain("appUserIds: rosterMode === \"fixed\" ? selectedAppUserIds : []")
    expect(directory).toContain('select("id,display_name,first_name,last_name,avatar_url,profile_completed_at")')
    expect(directory).not.toContain("email")
    expect(route).toContain("appUserIds")
    expect(server).toContain("season_app_membership_link_failed")
    expect(server).toContain("avatar_url: typeof appUser.avatar_url")
  })

  it("stores friendly location identity and court separately and stops rebuilding the catalog from match text", async () => {
    const [migration, createRoute, updateRoute, schedulePanel, globals] = await Promise.all([
      read("supabase/migrations/20260819173000_personal_locations_and_match_dashboard.sql"),
      read("src/app/api/personal-matches/route.ts"),
      read("src/app/api/personal-matches/[id]/route.ts"),
      read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
      read("src/lib/serverGlobalLocations.ts"),
    ])

    expect(migration).toContain("location_id uuid references public.padel_locations(id) on delete set null")
    expect(migration).toContain("location_court text")
    expect(migration).toContain("location_snapshot jsonb")
    expect(schedulePanel).toContain("locationName: input.location")
    expect(createRoute).toContain("location_court: structuredLocation.selectedCourt")
    expect(updateRoute).toContain("location_snapshot: locationSnapshot")
    expect(globals).toContain("Once padel_locations exists it is the single source of truth")
  })

  it("allows superadmin catalog deletion while preserving history and exposes exact usages with future correction actions", async () => {
    const [server, api, admin] = await Promise.all([
      read("src/lib/serverGlobalLocations.ts"),
      read("src/app/api/application-admin/locations/route.ts"),
      read("src/components/application-admin/ApplicationAdminManagement.tsx"),
    ])

    expect(server).toContain("Match snapshots are")
    expect(server).toContain("changeManagedLocationUsage")
    expect(server).toContain("clearManagedLocationUsage")
    expect(api).toContain('action === "change_usage"')
    expect(admin).toContain("Cambiar…")
    expect(admin).toContain("Quitar ubicación")
    expect(admin).toContain("El histórico de partidos se conserva")
  })

  it("shows all future friendlies in Próximos, keeps league matches out, and sends past scheduled friendlies to history", async () => {
    const [migration, server, page] = await Promise.all([
      read("supabase/migrations/20260819173000_personal_locations_and_match_dashboard.sql"),
      read("src/lib/serverPersonalMatches.ts"),
      read("src/app/personal-matches/page.tsx"),
    ])

    const nextFunction = migration.slice(migration.indexOf("create or replace function public.server_next_user_matches"))
    expect(nextFunction).toContain("'friendly'::text as source")
    expect(nextFunction).not.toContain("'league'::text as source")
    expect(migration).toContain("pm.status = 'scheduled' and pm.played_at < now()")
    expect(server).toContain("upcoming: upcomingFriendlyItems")
    expect(page).toContain("dashboard.upcoming.map")
  })

  it("keeps the friendly calendar action styled when flex sizing is supplied by the schedule row", async () => {
    const button = await read("src/components/personal/PersonalAddToCalendarButton.tsx")
    expect(button).toContain("inline-flex w-full rounded-lg border border-neutral-950 bg-neutral-950")
    expect(button).toContain('${className ?? ""}')
  })
})
