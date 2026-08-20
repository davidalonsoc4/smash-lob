import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { getPaymentLedgerPendingSummary } from "@/lib/paymentLedger"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.20 personal payments", () => {
  it("aggregates pending amounts across league and friendly sources", () => {
    const summary = getPaymentLedgerPendingSummary([
      {
        source: "league",
        matchId: "m1",
        transferId: "t1",
        direction: "owe",
        amount: 8.5,
        isPaid: false,
        paidAt: null,
        eventAt: null,
        fromName: "Davo",
        toName: "Alvaro",
        leagueId: "l1",
        leagueName: "Liga A",
        seasonId: "s1",
        seasonName: "T1",
        round: 2,
        href: "/match/m1",
      },
      {
        source: "friendly",
        matchId: "m2",
        transferId: "t2",
        direction: "owed",
        amount: 10,
        isPaid: false,
        paidAt: null,
        eventAt: null,
        fromName: "Unai",
        toName: "Davo",
        leagueId: null,
        leagueName: null,
        seasonId: null,
        seasonName: null,
        round: null,
        href: "/personal-matches/m2",
      },
      {
        source: "friendly",
        matchId: "m3",
        transferId: "t3",
        direction: "owe",
        amount: 5,
        isPaid: true,
        paidAt: "2026-08-20T00:00:00.000Z",
        eventAt: null,
        fromName: "Davo",
        toName: "Nico",
        leagueId: null,
        leagueName: null,
        seasonId: null,
        seasonName: null,
        round: null,
        href: "/personal-matches/m3",
      },
    ])

    expect(summary).toEqual({
      owedByMe: 8.5,
      owedToMe: 10,
      owedByMeCount: 1,
      owedToMeCount: 1,
    })
  })

  it("keeps friendly booking amounts editable from an empty booking", async () => {
    const panel = await read("src/components/match/CourtBookingPanel.tsx")

    expect(panel).toContain("return [currentUserId]")
    expect(panel).toContain("participantIds.includes(currentUserId) ? [currentUserId] : []")
    expect(panel).toContain("editableBallPurchaseInput")
    expect(panel).toContain("selectBallBuyer(editableBallPurchaseInput.playerId)")
  })

  it("loads a protected account ledger with leagues and friendlies", async () => {
    const route = await read("src/app/api/payments/ledger/route.ts")
    const page = await read("src/app/payments/page.tsx")
    const settings = await read("src/app/settings/page.tsx")

    expect(route).toContain("requireAuthenticatedAppUser")
    expect(route).toContain('.from("league_memberships")')
    expect(route).toContain('.from("personal_match_bookings")')
    expect(page).toContain('type PaymentScope = "all" | "league" | "friendly"')
    expect(page).toContain('selectedLeagueId')
    expect(page).toContain('filterPaymentLedgerItems')
    expect(settings).toContain("getPaymentLedgerPendingSummary")
  })
})
