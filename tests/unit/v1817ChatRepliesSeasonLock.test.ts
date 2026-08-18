import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.17 finished-season lock and chat replies", () => {
  it("makes finished seasons immutable for non-superadmins in shared server gates", async () => {
    const seasonAccess = await readFile("src/lib/serverSeasonAccess.ts", "utf8")
    const matchAccess = await readFile("src/lib/serverMatchAccess.ts", "utf8")
    const substitutes = await readFile("src/lib/serverSubstitutes.ts", "utf8")
    expect(seasonAccess).toContain('status === "finished" && !access.actor.user.isSuperuser')
    expect(seasonAccess).toContain('error: "season_finished_read_only"')
    expect(seasonAccess).toContain("requireMutableSeasonForActor")
    expect(matchAccess).toContain("requireMutableSeason?: boolean")
    expect(matchAccess).toContain("options.requireMutableSeason && !user.isSuperuser")
    expect(matchAccess).toContain('seasonRow.status === "finished"')
    expect(substitutes).toContain("options.requireMutable && season.status === \"finished\" && !user.isSuperuser")
  })

  it("uses the mutable-season gate in match, result and season mutation APIs", async () => {
    const paths = [
      "src/app/api/matches/[matchId]/result/route.ts",
      "src/app/api/matches/[matchId]/schedule/route.ts",
      "src/app/api/matches/[matchId]/incident/route.ts",
      "src/app/api/matches/[matchId]/reservation-confirmation/route.ts",
      "src/app/api/result-confirmations/[matchId]/route.ts",
      "src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts",
      "src/app/api/leagues/[id]/seasons/[seasonId]/start/route.ts",
    ]
    for (const path of paths) {
      const source = await readFile(path, "utf8")
      expect(source, path).toMatch(/requireMutableSeason:\s*true|requireMutable:\s*true/)
    }
    const substitution = await readFile("src/app/api/matches/[matchId]/substitution/route.ts", "utf8")
    expect(substitution).toContain("getAuthorizedActor(matchId, true)")
    expect(substitution).toContain("requireMutableSeason,")
  })

  it("locks finished-season match UI while explicitly preserving the superadmin exception", async () => {
    const match = await readFile("src/app/match/[id]/page.tsx", "utf8")
    const admin = await readFile("src/app/admin/season/page.tsx", "utf8")
    expect(match).toContain('const canMutateSeason = activeSeason.status !== "finished" || isSuperuser')
    expect(match).toContain("const mutableAdmin = isAdmin && canMutateSeason")
    expect(admin).toContain("const canReopenFinishedSeason =\n    isSuperuser &&")
    expect(admin).toContain("readOnly={!isSuperuser}")
    expect(admin).toContain("La temporada finalizada está en solo lectura")
  })

  it("replies by swiping a message and persists a compact quoted reference", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    const route = await readFile("src/app/api/matches/[matchId]/chat/route.ts", "utf8")
    expect(page).toContain("beginReplySwipe")
    expect(page).toContain("moveReplySwipe")
    expect(page).toContain("Math.abs(dx) > Math.abs(dy) * 1.2")
    expect(page).toContain("dx >= 44")
    expect(page).toContain("const replyingHref = participantProfileHref(replyingParticipant)")
    expect(page).toContain("Responder a {replyingHref ? <Link href={replyingHref}")
    expect(page).toContain("{replyingTo.sender_display_name}</Link> : replyingTo.sender_display_name}")
    expect(page).toContain("payloadReplyReference(payload)")
    expect(route).toContain("replySource = toRecord(payload.replyTo)")
    expect(route).toContain("replyTo ? { replyTo } : {}")
  })

  it("pins reservation actions after a unanimous date without the old agreement panel", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("Acuerdo 4/4")
    expect(page).not.toContain("Acuerdo alcanzado")
    expect(page).not.toContain("Fecha acordada 4/4 · falta acordar ubicación")
    expect(page).toContain("<MatchReservationConfirmation")
    expect(page).toContain('displayedCoordination?.status === "awaiting_booking"')
    expect(page).toContain('openProposalMode("date")')
  })

  it("compacts chat with shared tail-free text bubbles and keeps only Settings floating on CHAT", async () => {
    const [page, shared, css, shell] = await Promise.all([
      readFile("src/app/match/[id]/chat/page.tsx", "utf8"),
      readFile("src/components/match/chat/MatchChatShared.tsx", "utf8"),
      readFile("src/app/globals.css", "utf8"),
      readFile("src/components/layout/AppShell.tsx", "utf8"),
    ])
    expect(page).toContain('ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"')
    expect(page).toContain("<MatchChatTextMessage")
    expect(shared).toContain('max-w-[86%] rounded-2xl px-2.5 py-1.5 shadow-sm')
    expect(shared).toContain('!previousSameSender ? "rounded-tl-md " : ""')
    expect(shared).toContain('!previousSameSender ? "rounded-tr-md " : ""')
    expect(shared).toContain('className="flex min-h-14 shrink-0 items-center justify-center border-t')
    expect(shared).not.toContain("chat-bubble-incoming-first")
    expect(css).not.toContain("chat-bubble-incoming-first")
    expect(css).not.toContain("border-top: 6px solid #fff")
    expect(shell).toContain("const shouldShowSettingsButton =\n    !isInitialSeasonSetupRoute && !isPublicAccessRoute")
    expect(shell).toContain("const shouldShowHelpButton =\n    !isMatchChatRoute &&")
    expect(shell).toContain("const shouldShowNotificationsButton =\n    !isMatchChatRoute &&")
    expect(shell).toContain('isMatchChatRoute ? "z-[70]" : "z-50"')
  })

  it("bumps the CHAT tutorial to explain swipe-to-reply", async () => {
    const tours = await readFile("src/features/onboarding/tours.ts", "utf8")
    expect(tours).toContain('{ key: "chat", version: 7')
    expect(tours).toContain("Desliza un mensaje hacia la derecha para responderlo")
  })
})
