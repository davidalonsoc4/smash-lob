import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.28 automatic states and friendly notifications", () => {
  it("refreshes preseason state silently and keeps HOME on the current route", async () => {
    const [countdown, accessProvider, refreshEvents] = await Promise.all([
      read("src/components/season/SeasonStartCountdown.tsx"),
      read("src/context/LeagueAccessProvider.tsx"),
      read("src/lib/appRefreshEvents.ts"),
    ])

    expect(countdown).toContain('tx("¡NOVEDADES!")')
    expect(countdown).toContain('tx("DESCUBRIRÁS TODOS LOS EMPAREJAMIENTOS EN")')
    expect(countdown).toContain("requestLeagueAccessRefresh()")
    expect(countdown).toContain('tx("PREPARANDO INICIO")')
    expect(countdown).not.toContain('tx("Activación automática")')
    expect(countdown).not.toContain("window.location.reload")
    expect(refreshEvents).toContain('LEAGUE_ACCESS_REFRESH_EVENT = "smash-lob:refresh-league-access"')
    expect(accessProvider).toContain("window.addEventListener(LEAGUE_ACCESS_REFRESH_EVENT")
    expect(accessProvider).toContain("void refreshLeagueAccess()")
  })

  it("automatically starts due programmed seasons and merges the season/J1 push", async () => {
    const [route, automation, scheduledSeason] = await Promise.all([
      read("src/app/api/notifications/scheduled-check/route.ts"),
      read("src/lib/serverScheduledSeasonAutomation.ts"),
      read("src/lib/serverScheduledSeason.ts"),
    ])

    expect(route).toContain("runScheduledSeasonStartAutomation({ supabase, now })")
    expect(scheduledSeason).toContain("activateDueScheduledSeasonsFromAutomation")
    expect(automation).toContain('type: "season_started"')
    expect(automation).toContain('title: "¡Empieza la temporada!"')
    expect(automation).toContain("combinedRoundOneSeasonIds.add(setting.season_id)")
    expect(automation).toContain("Math.abs(roundStart - seasonStart) <= 60_000")
    expect(route).toContain("seasonStartAutomation.combinedRoundOneSeasonIds.has(match.season_id)")
    expect(route).toContain("continue;")
  })

  it("shows friendly chat messages optimistically and pushes chat plus match changes", async () => {
    const [chatPage, chatRoute, personalPush, matchRoute, bookingRoute, transferRoute] = await Promise.all([
      read("src/app/personal-matches/[id]/chat/page.tsx"),
      read("src/app/api/personal-matches/[id]/chat/route.ts"),
      read("src/lib/serverPersonalMatchPush.ts"),
      read("src/app/api/personal-matches/[id]/route.ts"),
      read("src/app/api/personal-matches/[id]/court-booking/route.ts"),
      read("src/app/api/personal-matches/[id]/court-booking/transfers/[transferId]/route.ts"),
    ])

    expect(chatPage).toContain("optimisticMessage")
    expect(chatPage).toContain("messages: [...current.messages, optimisticMessage]")
    expect(chatPage).toContain("function createPendingMessageId()")
    expect(chatPage).toContain('typeof cryptoApi.randomUUID === "function"')
    expect(chatPage).toContain('typeof cryptoApi.getRandomValues === "function"')
    expect(chatPage).toContain("fallbackPendingMessageSequence")
    expect(chatPage).toContain("const optimisticId = createPendingMessageId()")
    expect(chatPage).not.toContain("const optimisticId = `pending-${crypto.randomUUID()}`")
    expect(chatRoute).toContain('title: "Nuevo mensaje · Amistoso"')
    expect(chatRoute).toContain('visiblePath: `/personal-matches/${match.id}/chat`')
    expect(personalPush).toContain('.from("push_subscriptions")')
    expect(personalPush).toContain("userId !== actorUserId")
    expect(matchRoute).toContain('title: "Amistoso actualizado"')
    expect(matchRoute).toContain('title: "Resultado del amistoso"')
    expect(bookingRoute).toContain('title: "Reserva del amistoso"')
    expect(transferRoute).toContain('title: "Pago del amistoso"')
  })

  it("uses the same Chats icon in league and personal-match navigation", async () => {
    const [personalNav, leagueNav] = await Promise.all([
      read("src/components/personal/PersonalMatchesNav.tsx"),
      read("src/components/layout/BottomNav.tsx"),
    ])

    const bubblePath = 'M5 18.5 3.5 21l3.7-1A9 9 0 1 0 5 18.5Z'
    const linesPath = 'M8 10.5h8M8 14h5'
    expect(personalNav).toContain(bubblePath)
    expect(personalNav).toContain(linesPath)
    expect(leagueNav).toContain(bubblePath)
    expect(leagueNav).toContain(linesPath)
    expect(personalNav).not.toContain('M5 5.5h14a2 2 0 0 1 2 2v8')
  })

  it("never forces the browser permission prompt and periodically offers an explicit action", async () => {
    const [autoPush, reminder, settingsSearch, serviceWorker] = await Promise.all([
      read("src/components/notifications/AutoPushRegistration.tsx"),
      read("src/components/notifications/PushPermissionReminder.tsx"),
      read("src/lib/settingsSearch.ts"),
      read("public/sw.js"),
    ])

    expect(autoPush).toContain("requestPermissionIfNeeded: false")
    expect(reminder).toContain("requestPermissionIfNeeded: true")
    expect(reminder).toContain("14 * 24 * 60 * 60 * 1000")
    expect(reminder).toContain("Activar notificaciones")
    expect(reminder).toContain("Revisar permisos")
    expect(settingsSearch).toContain('preseasonSecrets: { title: "Fase secreta"')
    expect(settingsSearch).toContain('preseasonSecrets: "/admin/season#fase-secreta"')
    expect(serviceWorker).toContain("payload.visiblePath")
  })
})
