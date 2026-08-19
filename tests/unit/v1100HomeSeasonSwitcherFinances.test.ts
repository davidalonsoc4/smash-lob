import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { getSeasonRegistrationFinanceSummary, normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
const read = (path: string) => readFile(path, "utf8")

describe("v1.10.0 HOME season switcher and registration finances", () => {
  it("views another HOME season without changing the real active-season pointer", async () => {
    const [home, data, tours] = await Promise.all([read("src/app/page.tsx"), read("src/hooks/useCurrentLeagueData.ts"), read("src/features/onboarding/tours.ts")])
    expect(home).toContain('dataTour: "home-season-switcher"'); expect(home).toContain('id="home-season-picker"'); expect(home).toContain("setSelectedHomeSeasonId(season.id)"); expect(home).toContain("selectableHomeSeasons.length > 1")
    expect(data).toContain("selectedSeasonId?: string | null"); expect(data).toContain("requestedSeason ??"); expect(home).not.toContain("activeSeasonIds[")
    expect(tours).toContain("Consulta otras temporadas"); expect(tours).toContain("Browse other seasons"); expect(tours).toContain("Ikusi beste denboraldiak")
  })

  it("embeds registration below the countdown inside Próxima temporada", async () => {
    const [home, panel] = await Promise.all([read("src/app/page.tsx"), read("src/components/season/SeasonRegistrationPanel.tsx")])
    const card = home.indexOf('{tx("Próxima temporada")}</p>'), registration = home.indexOf("showScheduledRegistrationWaiting && shouldShowRegistrationPanel"), announcements = home.indexOf('data-tour="home-announcements"')
    expect(card).toBeGreaterThan(-1); expect(registration).toBeGreaterThan(card); expect(announcements).toBeGreaterThan(registration); expect(home).toContain("<SeasonRegistrationPanel\n                  embedded"); expect(panel).toContain("embedded?: boolean")
  })

  it("subtracts expenses from real registration income", () => {
    const fee = normalizeSeasonRegistrationFee({ enabled: true, amount: 20, purpose: "Temporada", payments: [{ playerId: "p1", isPaid: true, paidAt: "2026-08-16T18:00:00.000Z" }, { playerId: "p2", isPaid: false, paidAt: null }, { playerId: "p3", isPaid: false, paidAt: null }], expenses: [{ id: "e1", title: "Bolas", amount: 12.5, createdAt: "2026-08-16T18:10:00.000Z" }, { id: "e2", title: "Trofeo", amount: 7.5, createdAt: "2026-08-16T18:20:00.000Z" }] })
    expect(getSeasonRegistrationFinanceSummary({ registrationFee: fee, playerIds: ["p1", "p2", "p3"], settledPlayerIds: ["p3"] })).toMatchObject({ collected: 20, pending: 20, spent: 20, available: 0, paidCount: 1, pendingCount: 1 })
  })

  it("exposes admin finance UI, expense API, tutorial and search entry", async () => {
    const [screen, route, admin, settings, search] = await Promise.all([read("src/components/season/SeasonFinanceScreen.tsx"), read("src/app/api/leagues/[id]/seasons/[seasonId]/expenses/route.ts"), read("src/app/admin/page.tsx"), read("src/app/admin/season/page.tsx"), read("src/lib/settingsSearch.ts")])
    for (const text of ["Ingresado", "Pendiente", "Gastado", "Disponible", "Registrar gasto"]) expect(screen).toContain(text)
    expect(route).toContain("export async function POST"); expect(route).toContain("export async function DELETE"); expect(route).toContain("registration_not_enabled")
    expect(admin).toContain('href="/admin/season/finances"'); expect(settings).toContain('data-tour="season-admin-finances"'); expect(search).toContain('seasonFinances: "/admin/season/finances"')
  })
})
