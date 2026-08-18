import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.9.8 quick product polish", () => {
  it("offers PWA installation only on HOME to authenticated users with a stored league membership", async () => {
    const prompt = await read("src/components/layout/PwaInstallPrompt.tsx")

    expect(prompt).toContain('const membershipsStorageKey = "smash-lob-user-league-memberships"')
    expect(prompt).toContain('status === "authenticated"')
    expect(prompt).toContain('pathname === "/"')
    expect(prompt).toContain("hasStoredLeagueMembership(sessionUserId)")
    expect(prompt).toContain("if (!canOfferInstall || !isVisible || isStandaloneDisplay())")
    expect(prompt).not.toContain("isEntryExperience")
  })

  it("uses a compact numeric date in the pinned reservation summary", async () => {
    const chat = await read("src/app/match/[id]/chat/page.tsx")

    expect(chat).toContain("const reservationSummaryDate =")
    expect(chat).toContain('day: "2-digit", month: "2-digit", year: "numeric"')
    expect(chat).toContain("reservationSummaryDate(reservationSummary.scheduledAt)")
  })

  it("matches the visible same-sender gap through the shared text-bubble geometry", async () => {
    const [chat, shared] = await Promise.all([
      read("src/app/match/[id]/chat/page.tsx"),
      read("src/components/match/chat/MatchChatShared.tsx"),
    ])

    expect(chat).toContain('rowSpacing = index ? previousSameSender ? "mt-px" : "mt-1.5" : ""')
    expect(shared).toContain('border border-transparent bg-clip-padding bg-neutral-950 text-white')
    expect(shared).toContain('border border-neutral-200 bg-white text-neutral-950')
  })

  it("shows only the current value for En racha", async () => {
    const summary = await read("src/lib/roundSummary.ts")

    expect(summary).toContain('leftLabel: "Racha actual"')
    expect(summary).toContain("leftValue: formatWinCount(bestStreak.streak)")
    expect(summary).toContain('centerValue: ""')
    expect(summary).not.toContain("previousStreak")
  })

  it("stacks both player names in every match-based round highlight without slash-separated pair names", async () => {
    const page = await read("src/app/round/[id]/page.tsx")

    expect(page).toContain("function teamPlayerNames")
    expect(page).toContain("teamPlayerNames(highlightedMatch.teamA, players).map")
    expect(page).toContain("teamPlayerNames(highlightedMatch.teamB, players).map")
    expect(page).not.toContain("teamName(highlightedMatch.teamA, players)")
    expect(page).not.toContain("teamName(highlightedMatch.teamB, players)")
  })

  it("memoizes reservation-location fallbacks so eslint no longer reports unstable hook dependencies", async () => {
    const component = await read("src/components/match/MatchReservationConfirmation.tsx")

    expect(component).toContain("() => coordination.approvedLocations ?? []")
    expect(component).toContain("[coordination.approvedLocations]")
    expect(component).toContain("() => coordination.rejectedLocations ?? []")
    expect(component).toContain("[coordination.rejectedLocations]")
  })
})
