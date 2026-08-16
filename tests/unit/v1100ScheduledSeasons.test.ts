import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import {
  SCHEDULED_SEASON_TIME_ZONE,
  datetimeLocalToIso,
  formatNextScheduledStartForInput,
  formatScheduledSeasonStart,
  getScheduledSeasonHomeStage,
  getSeasonCountdown,
  isScheduledSeasonDue,
  isScheduledSeasonHomeLocked,
  isScheduledSeasonPending,
  toDatetimeLocalValue,
} from "@/lib/seasonScheduling"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 scheduled season start", () => {
  it("distinguishes pending and due scheduled starts deterministically", () => {
    const now = Date.parse("2026-09-01T10:00:00.000Z")
    const future = "2026-09-03T12:30:00.000Z"

    expect(isScheduledSeasonPending("upcoming", future, now)).toBe(true)
    expect(isScheduledSeasonDue("upcoming", future, now)).toBe(false)
    expect(isScheduledSeasonPending("active", future, now)).toBe(false)
    expect(isScheduledSeasonDue("upcoming", future, Date.parse("2026-09-03T12:30:00.000Z"))).toBe(true)

    const countdown = getSeasonCountdown(future, now)
    expect(countdown).toMatchObject({ days: 2, hours: 2, minutes: 30, seconds: 0, isDue: false })
  })

  it("uses roster, registration and full-countdown stages in that order", () => {
    expect(getScheduledSeasonHomeStage({ isRosterComplete: false, registrationEnabled: true, registrationSettled: false })).toBe("roster")
    expect(getScheduledSeasonHomeStage({ isRosterComplete: true, registrationEnabled: true, registrationSettled: false })).toBe("registration")
    expect(getScheduledSeasonHomeStage({ isRosterComplete: true, registrationEnabled: true, registrationSettled: true })).toBe("countdown")
    expect(getScheduledSeasonHomeStage({ isRosterComplete: true, registrationEnabled: false, registrationSettled: true })).toBe("countdown")
  })

  it("anchors scheduled starts to Europe/Madrid and preloads a full hour", () => {
    expect(SCHEDULED_SEASON_TIME_ZONE).toBe("Europe/Madrid")
    expect(datetimeLocalToIso("2026-08-16T20:00")).toBe("2026-08-16T18:00:00.000Z")
    expect(datetimeLocalToIso("2026-12-16T20:00")).toBe("2026-12-16T19:00:00.000Z")
    expect(toDatetimeLocalValue("2026-08-16T18:00:00.000Z")).toBe("2026-08-16T20:00")
    expect(formatScheduledSeasonStart("2026-08-16T18:00:00.000Z")).toContain("20:00")
    expect(formatNextScheduledStartForInput(new Date("2026-08-16T17:57:11.000Z"))).toBe("2026-08-16T20:00")
    expect(datetimeLocalToIso("2026-03-29T02:00")).toBeNull()
    expect(datetimeLocalToIso("2026-10-25T02:00")).toBeNull()
  })

  it("persists the scheduled instant and activates due seasons server-side", async () => {
    const [migration, access, scheduler, createApi, startApi] = await Promise.all([
      read("supabase/migrations/20260816173000_add_competitive_player_images_and_scheduled_seasons.sql"),
      read("src/app/api/access/route.ts"),
      read("src/lib/serverScheduledSeason.ts"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/start/route.ts"),
    ])

    expect(migration).toContain("scheduled_start_at timestamptz")
    expect(access).toContain("activateDueScheduledSeasons")
    expect(scheduler).toContain('.lte("scheduled_start_at", nowIso)')
    expect(scheduler).toContain("startServerExistingSeason")
    expect(createApi).toContain("scheduled_start_must_be_future")
    expect(startApi).toContain("season_scheduled_start_pending")
  })

  it("blocks players before start while preserving admin operations and registration", async () => {
    const [matchAccess, chat, registration] = await Promise.all([
      read("src/lib/serverMatchAccess.ts"),
      read("src/app/api/matches/[matchId]/chat/route.ts"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/registration/route.ts"),
    ])

    expect(matchAccess).toContain('seasonRow.status === "upcoming" && !isAdmin')
    expect(matchAccess).toContain('error: isFuture ? "season_not_started" : "season_start_pending"')
    expect(chat).toContain('(seasonResult.data?.status === "upcoming" && !isAdmin)')
    expect(registration).toContain("joinSelfRegistrationSeason")
    expect(registration).not.toContain("season_not_started")
  })

  it("serializes round window days and three-set mode independently", async () => {
    const [seasonApi, admin, scheduledSettings] = await Promise.all([
      read("src/lib/supabaseSeasons.ts"),
      read("src/app/admin/season/page.tsx"),
      read("src/components/season/ScheduledStartSettingsPanel.tsx"),
    ])

    expect(seasonApi).toContain("roundWindowDays,\n        requiresThreeSets,")
    expect(seasonApi).not.toContain("roundWindowDays:\n        requiresThreeSets,")
    expect(admin).not.toContain("new Date(scheduledStartIso).getTime() > Date.now()")
    expect(scheduledSettings).toContain("scheduledStartIsFuture")
    expect(scheduledSettings).toContain("setScheduledStartIsFuture")
    expect(scheduledSettings).not.toContain("useEffect")
  })

  it("shows the programmed state, countdown and a one-shot refresh at activation time", async () => {
    const [home, admin, scheduledSettings, countdown] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/app/admin/season/page.tsx"),
      read("src/components/season/ScheduledStartSettingsPanel.tsx"),
      read("src/components/season/SeasonStartCountdown.tsx"),
    ])

    expect(home).toContain("showScheduledCountdownHero")
    expect(home).toContain("showScheduledRegistrationWaiting")
    expect(home).toContain("showScheduledRosterWaiting")
    expect(home).toContain("getScheduledSeasonHomeStage")
    expect(home).toContain("const playerCapacity = roundSettings.playerCapacity")
    expect(home).toContain('typeof playerCapacity === "number"')
    expect(home).toContain("playerCapacity > 0")
    expect(home).toContain("seasonRankingPlayers.length >= playerCapacity")
    expect(home).toContain("scheduledStartAt={roundSettings.scheduledStartAt} hero")
    expect(home).toContain("showScheduledRegistrationWaiting && shouldShowRegistrationPanel")
    expect(home).toContain("shouldShowRegistrationPanel && !isSeasonScheduled")
    expect(home).toContain("SeasonStartCountdown")
    expect(admin).toContain('type="datetime-local" step={3600}')
    expect(admin).toContain("ScheduledStartSettingsPanel")
    expect(scheduledSettings).toContain("toDatetimeLocalValue(roundSettings.scheduledStartAt)")
    expect(scheduledSettings).toContain("formatNextScheduledStartForInput()")
    expect(scheduledSettings).toContain("step={3600}")
    expect(scheduledSettings).toContain("Inicio programado desactivado.")
    expect(admin).toContain("Los jugadores pueden unirse y completar sus datos")
    expect(countdown).toContain('data-season-start-countdown={hero ? "hero" : "waiting"}')
    expect(countdown).toContain("LA TEMPORADA COMIENZA EN")
    expect(countdown).toContain("grid-cols-4")
    expect(countdown).toContain("min-h-[calc(100dvh-13rem)]")
    expect(countdown).toContain("sessionStorage")
    expect(countdown).toContain("window.location.reload()")
  })

  it("confines scheduled pre-start players to HOME until the season is actually active", async () => {
    const scheduled = "2026-09-03T12:30:00.000Z"

    expect(isScheduledSeasonHomeLocked("upcoming", scheduled, false)).toBe(true)
    expect(isScheduledSeasonHomeLocked("upcoming", "2026-01-01T00:00:00.000Z", false)).toBe(true)
    expect(isScheduledSeasonHomeLocked("upcoming", scheduled, true)).toBe(false)
    expect(isScheduledSeasonHomeLocked("upcoming", null, false)).toBe(false)
    expect(isScheduledSeasonHomeLocked("active", scheduled, false)).toBe(false)

    const [shell, nav] = await Promise.all([
      read("src/components/layout/AppShell.tsx"),
      read("src/components/layout/BottomNav.tsx"),
    ])

    expect(shell).toContain("isScheduledSeasonHomeLocked")
    expect(shell).toContain('router.replace("/")')
    expect(shell).toContain("data-scheduled-season-home-lock")
    expect(shell).toContain("<BottomNav homeOnlyLocked={scheduledSeasonHomeOnly} />")
    expect(shell).toContain('pathname === "/notifications"')
    expect(shell).toContain('pathname === "/help"')
    expect(shell).toContain('pathname === "/settings"')
    expect(shell).toContain('pathname.startsWith("/settings/")')
    expect(shell).toContain("scheduledSeasonHomeOnly && !isScheduledSeasonUtilityRoute")
    expect(shell).not.toContain("Activar VISTA ADMIN")
    expect(shell).not.toContain("setAdminViewEnabled(true)")
    expect(shell).toContain("const shouldShowSettingsButton =")
    expect(shell).toContain("const shouldShowHelpButton =")
    expect(shell).toContain("const shouldShowNotificationsButton =")
    expect(shell).toContain("const shouldShowPlayerInviteButton =")
    expect(shell).not.toContain("!isPublicAccessRoute && !scheduledSeasonHomeOnly")
    expect(nav).toContain('const isDisabled = homeOnlyLocked && item.href !== "/"')
    expect(nav).toContain("disabled")
    expect(nav).toContain("Disponible cuando comience la temporada")
  })

  it("ties pre-start player restrictions to VISTA ADMIN without weakening server admin authorization", async () => {
    const [access, home, matches, matchDetail, chatPage, matchAccess] = await Promise.all([
      read("src/context/LeagueAccessProvider.tsx"),
      read("src/app/page.tsx"),
      read("src/app/matches/page.tsx"),
      read("src/app/match/[id]/page.tsx"),
      read("src/app/match/[id]/chat/page.tsx"),
      read("src/lib/serverMatchAccess.ts"),
    ])
    expect(access).toContain("isAdminViewEnabled && hasLeagueAdminRole(leagueId)")
    expect(home).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason")
    expect(matches).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason")
    expect(matchDetail).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !isAdmin")
    expect(chatPage).toContain('activeSeason.status === "upcoming" && !isLeagueAdmin(activeLeague.id)')
    expect(matchAccess).toContain('seasonRow.status === "upcoming" && !isAdmin')
  })
})
