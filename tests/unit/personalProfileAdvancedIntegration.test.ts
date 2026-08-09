import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("personal profile advanced statistics", () => {
  it("exposes summary, relation rankings and head-to-head under the existing filters", async () => {
    const [page, view, stats] = await Promise.all([
      read("src/app/personal-matches/profile/page.tsx"),
      read("src/components/personal/PersonalProfileStatistics.tsx"),
      read("src/lib/personalProfileStats.ts"),
    ])

    expect(page).toContain("Todos los partidos")
    expect(page).toContain("Todas las ligas")
    expect(page).toContain("Todas las temporadas")
    expect(page).toContain("getPersonalProfileHeadToHead")
    expect(view).toContain("Resumen")
    expect(view).toContain("Parejas / rivales")
    expect(view).toContain("Cara a cara")
    expect(view).toContain("Mejor pareja")
    expect(view).toContain("Peor pareja")
    expect(view).toContain("Rival más vencido")
    expect(view).toContain("Némesis")
    expect(view).toContain("Partidos al 3º")
    expect(view).toContain("Remontadas")
    expect(view).toContain("Enfrentamientos directos")
    expect(view).toContain("Rendimiento de la pareja")
    expect(stats).toContain("decidingSetWinRate")
    expect(stats).toContain("currentForm")
  })

  it("uses stable participant identities and requests avatars only for the profile history", async () => {
    const [types, route, server, page] = await Promise.all([
      read("src/lib/personalMatches.ts"),
      read("src/app/api/personal-matches/route.ts"),
      read("src/lib/serverPersonalMatches.ts"),
      read("src/app/personal-matches/profile/page.tsx"),
    ])

    expect(types).toContain("personKey?: string | null")
    expect(route).toContain('searchParams.get("includeAvatars")')
    expect(page).toContain("includeAvatars=1")
    expect(server).toContain("getParticipantPersonKey")
    expect(server).toContain('`user:${userId}`')
    expect(server).toContain('`player:${playerId}`')
    expect(server).toContain("participantMembershipsResult")
  })
})
