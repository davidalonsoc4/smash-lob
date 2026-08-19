import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("personal matches upcoming visibility", () => {
  it("does not render the whole upcoming section until a future match exists", async () => {
    const source = await readFile("src/app/personal-matches/page.tsx", "utf8")

    expect(source).toContain("!loading && dashboard.upcoming.length > 0 ? (")
    expect(source).toContain("Próximos partidos")
    expect(source).toContain("dashboard.upcoming.map")
    expect(source).toContain('key={`upcoming-${match.id}`}')
    expect(source).not.toContain("Sin partidos programados")
    expect(source).not.toContain("Buscando tu próximo partido...")
  })
})
