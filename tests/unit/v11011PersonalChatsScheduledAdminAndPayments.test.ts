import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { createProgressItem, hasCompletedCurrentTour } from "@/features/onboarding/progress"
import { isPersonalMatchChatSchemaMissingError } from "@/lib/personalMatchChatSchema"
import { getOnboardingTours } from "@/features/onboarding/tours"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.11 personal chats, scheduled admin access and registration payments", () => {
  it("lists every friendly chat from Mis partidos without filtering by match status", async () => {
    const [nav, page, route] = await Promise.all([
      read("src/components/personal/PersonalMatchesNav.tsx"),
      read("src/app/personal-matches/chats/page.tsx"),
      read("src/app/api/personal-matches/chats/route.ts"),
    ])

    expect(nav).toContain('href: "/personal-matches/chats"')
    expect(nav).toContain('label: "Chats"')
    expect(nav).toContain("grid-cols-4")
    expect(page).toContain("data-personal-match-chats-list")
    expect(page).toContain("Historial eliminado")
    expect(page).toContain("Solo lectura")
    expect(route).toContain('.from("personal_matches")')
    expect(route).not.toContain('.eq("status"')
    expect(route).toContain("getPersonalMatchChatRealtimeTopic")
    expect(route).toContain("personal_match_chat_schema_missing")
  })

  it("explains a missing friendly-chat migration instead of a generic load failure", async () => {
    const [chatPage, chatRoute] = await Promise.all([
      read("src/app/personal-matches/[id]/chat/page.tsx"),
      read("src/app/api/personal-matches/[id]/chat/route.ts"),
    ])

    expect(chatPage).toContain("Falta aplicar la migración del chat")
    expect(chatRoute).toContain("isPersonalMatchChatSchemaMissingError")
    expect(chatRoute).toContain('reply("personal_match_chat_schema_missing", 503)')
    expect(
      isPersonalMatchChatSchemaMissingError({
        code: "PGRST205",
        message: "Could not find the table 'public.personal_match_chat_messages' in the schema cache",
      }),
    ).toBe(true)
    expect(isPersonalMatchChatSchemaMissingError({ code: "23505", message: "duplicate" })).toBe(false)
  })

  it("opens friendly player selectors as modal floating pickers with a blurred backdrop", async () => {
    const selector = await read("src/components/personal/PersonalMatchParticipantSelector.tsx")
    expect(selector).toContain('import { createPortal } from "react-dom"')
    expect(selector).toContain('aria-modal="true"')
    expect(selector).toContain("backdrop-blur-[1px]")
    expect(selector).toContain('document.body.style.overflow = "hidden"')
    expect(selector).toContain('event.key === "Escape"')
  })

  it("never auto-replays a tutorial key merely because its version increased", async () => {
    const tour = getOnboardingTours("es").find((item) => item.key === "home")!
    const progress = {
      home: createProgressItem({
        tourKey: "home",
        tourVersion: Math.max(1, tour.version - 1),
        status: "completed",
      }),
    }
    expect(hasCompletedCurrentTour(progress, tour)).toBe(true)

    const api = await read("src/app/api/onboarding/progress/route.ts")
    for (const key of ["chats", "match", "chat"]) {
      expect(api).toContain(`"${key}"`)
    }
  })

  it("lets a normal player persist only their own registration payment", async () => {
    const [route, client, home, panel] = await Promise.all([
      read("src/app/api/leagues/[id]/seasons/[seasonId]/registration-payment/route.ts"),
      read("src/lib/supabaseSeasons.ts"),
      read("src/app/page.tsx"),
      read("src/components/season/SeasonRegistrationPanel.tsx"),
    ])

    expect(route).toContain("actor.membership?.playerId !== playerId")
    expect(route).toContain('from("season_settings")')
    expect(route).toContain("registration_fee")
    expect(route).toContain("setSeasonRegistrationPaymentPaidStatus")
    expect(client).toContain("updateSupabaseSeasonRegistrationPayment")
    expect(home).toContain("await updateSupabaseSeasonRegistrationPayment")
    expect(panel).toContain("No se ha podido actualizar el pago de la inscripción.")
  })

  it("treats an upcoming scheduled season as normally navigable only in admin view", async () => {
    const [shell, dataHook, home, matches, detail, chat] = await Promise.all([
      read("src/components/layout/AppShell.tsx"),
      read("src/hooks/useCurrentLeagueData.ts"),
      read("src/app/page.tsx"),
      read("src/app/matches/page.tsx"),
      read("src/app/match/[id]/page.tsx"),
      read("src/app/match/[id]/chat/page.tsx"),
    ])

    expect(shell).toContain("canAccessAdmin")
    expect(shell).toContain("activeRoundSettings.scheduledStartAt")
    expect(dataHook).toContain("isLeagueAdmin(activeLeague.id)")
    expect(home).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason")
    expect(matches).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !canManageSeason")
    expect(detail).toContain("isPlayerSeasonLocked = isSeasonUpcoming && !isAdmin")
    expect(chat).toContain('activeSeason.status === "upcoming" && !isLeagueAdmin(activeLeague.id)')
    expect(home).toContain("round.status === \"upcoming\"")
  })

  it("exposes the season transparency report instead of the old placeholder", async () => {
    const finance = await read("src/components/season/SeasonFinanceScreen.tsx")
    expect(finance).toContain("data-season-finance-report")
    expect(finance).toContain("data-season-finance-report-preview")
    expect(finance).toContain("data-season-finance-report-excel")
    expect(finance).not.toContain("Generar informe de transparencia · Próximamente")
  })
})
