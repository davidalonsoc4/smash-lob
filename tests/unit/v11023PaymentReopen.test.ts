import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.23 payment reopen", () => {
  it("lets Mis pagos reopen only transfers exposed as manageable", async () => {
    const page = await read("src/app/payments/page.tsx")
    const ledger = await read("src/lib/paymentLedger.ts")

    expect(ledger).toContain("canMarkPending?: boolean")
    expect(page).toContain("item.canMarkPending ? (")
    expect(page).toContain('tx("Marcar como pendiente")')
    expect(page).toContain("onSetPaidStatus(item, false)")
    expect(page).toContain("setPaymentLedgerTransferPaid(item, isPaid)")
  })

  it("exposes reopen permission from the same server rules used by league and friendly APIs", async () => {
    const ledgerRoute = await read("src/app/api/payments/ledger/route.ts")
    const leagueRoute = await read(
      "src/app/api/matches/[matchId]/court-booking/transfers/[transferId]/route.ts",
    )
    const friendlyRoute = await read(
      "src/app/api/personal-matches/[id]/court-booking/transfers/[transferId]/route.ts",
    )

    expect(ledgerRoute).toContain('membership.role === "creator" || membership.role === "admin"')
    expect(ledgerRoute).toContain("transfer.toPlayerId === currentPlayerId")
    expect(ledgerRoute).toContain("managedLeagueIds.has(match.league_id)")
    expect(ledgerRoute).toContain("transfer.toPlayerId === currentParticipantId")
    expect(ledgerRoute).toContain("match?.created_by_user_id === actor.user.id")

    expect(leagueRoute).toContain("canManageAsRecipient")
    expect(leagueRoute).toContain("canMarkOwnDebtPaid")
    expect(friendlyRoute).toContain("access.isCreator")
    expect(friendlyRoute).toContain("!transfer.isPaid && body.isPaid")
  })

  it("keeps translations for the reversible payment action", async () => {
    const text = await read("src/i18n/leagueText.ts")

    expect(text).toContain('"Marcar como pendiente": "Mark as pending"')
    expect(text).toContain('"Marcar como pendiente": "Zain dagoela markatu"')
  })
})
