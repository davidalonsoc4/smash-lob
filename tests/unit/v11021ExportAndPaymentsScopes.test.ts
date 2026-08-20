import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { filterPaymentLedgerItems, type PaymentLedgerItem } from "@/lib/paymentLedger"

const read = (path: string) => readFile(path, "utf8")

const items: PaymentLedgerItem[] = [
  { source: "league", matchId: "m1", transferId: "t1", direction: "owe", amount: 10, isPaid: false, paidAt: null, eventAt: null, fromName: "A", toName: "B", leagueId: "l1", leagueName: "Liga 1", seasonId: "s1", seasonName: "T1", round: 1, href: "/match/m1" },
  { source: "league", matchId: "m2", transferId: "t2", direction: "owed", amount: 12, isPaid: false, paidAt: null, eventAt: null, fromName: "C", toName: "A", leagueId: "l1", leagueName: "Liga 1", seasonId: "s2", seasonName: "T2", round: 2, href: "/match/m2" },
  { source: "league", matchId: "m3", transferId: "t3", direction: "owe", amount: 8, isPaid: false, paidAt: null, eventAt: null, fromName: "A", toName: "D", leagueId: "l2", leagueName: "Liga 2", seasonId: "s3", seasonName: "T1", round: 1, href: "/match/m3" },
  { source: "friendly", matchId: "f1", transferId: "t4", direction: "owe", amount: 5, isPaid: false, paidAt: null, eventAt: null, fromName: "A", toName: "E", leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null, href: "/personal-matches/f1" },
]

describe("v1.10.21 export and payment scopes", () => {
  it("filters the payment ledger by the complete selected context", () => {
    expect(filterPaymentLedgerItems(items, { scope: "all" })).toHaveLength(4)
    expect(filterPaymentLedgerItems(items, { scope: "friendly" }).map((item) => item.matchId)).toEqual(["f1"])
    expect(filterPaymentLedgerItems(items, { scope: "league", leagueId: "l1", seasonId: "s1" }).map((item) => item.matchId)).toEqual(["m1"])
    expect(filterPaymentLedgerItems(items, { scope: "league", leagueId: "l1", seasonId: "s2" }).map((item) => item.matchId)).toEqual(["m2"])
  })

  it("keeps both fixture teams symmetric and shrinks long names before truncating", async () => {
    const source = await read("src/lib/seasonExportImages.ts")

    expect(source).toContain("const scoreCenterX = fixturesOnly ? x + width / 2 : regularScoreCenterX")
    expect(source).toContain("scoreCenterX - fixtureVsHalfGap - leftX")
    expect(source).toContain("rightContentEdge - rightX")
    expect(source).toContain("getFittedTextSize(context, playerName, maxTextWidth, 17, 13, 900)")
  })

  it("makes Todos, Liga and Amistosos change the full payments context", async () => {
    const page = await read("src/app/payments/page.tsx")

    expect(page).toContain('{ id: "league", label: tx("Liga") }')
    expect(page).toContain("const [selectedLeagueId, setSelectedLeagueId] = useState(activeLeague.id)")
    expect(page).toContain("const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason.id)")
    expect(page).toContain("filterPaymentLedgerItems(ledgerItems")
    expect(page).toContain("getPaymentLedgerPendingSummary(scopedLedgerItems)")
    expect(page).toContain('paymentScope === "league" ? (')
    expect(page).toContain('onChange={(event) => handleLeagueSelection(event.target.value)}')
    expect(page).toContain('onChange={(event) => setSelectedSeasonId(event.target.value)}')
  })
})
