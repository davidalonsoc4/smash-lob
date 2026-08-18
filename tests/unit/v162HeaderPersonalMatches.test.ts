import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFileSync(path, "utf8")

describe("v1.6.2 homogeneous headers and personal match flow", () => {
  it("left-aligns HOME identity when a league has no logo", () => {
    const home = read("src/app/page.tsx")
    expect(home).toContain('className={activeLeague.logoUrl ? "flex items-start gap-3" : "block"}')
    expect(home).toContain('className="min-w-0 flex-1"')
  })

  it("shows season and season status below Jornada like Ranking", () => {
    const matchPage = read("src/app/match/[id]/page.tsx")
    const detail = read("src/components/match/MatchDetailView.tsx")
    expect(matchPage).toContain("<SeasonContextLine")
    expect(matchPage).toContain("seasonName={activeSeason.name}")
    expect(matchPage).toContain("t.rounds.statusActive")
    expect(matchPage).not.toContain("eyebrow={activeLeague.name}")
    expect(detail).toContain("context?: ReactNode")
    expect(detail).toContain("{context ?? (subtitle ? (")
  })

  it("adds a floating create encounter button above personal navigation", () => {
    const page = read("src/app/personal-matches/page.tsx")
    expect(page).toContain('aria-label="Crear nuevo encuentro"')
    expect(page).toContain('href="/personal-matches/new"')
    expect(page).toContain('bottom: "calc(78px + env(safe-area-inset-bottom, 0px))"')
    expect(page).toContain(">+</span>")
  })

  it("replaces Programar / Ya jugado tabs with an optional result", () => {
    const page = read("src/app/personal-matches/new/page.tsx")
    expect(page).toContain("Crear encuentro")
    expect(page).toContain("formatNextFullHourForDateTimeInput(now)")
    expect(page).toContain('type="datetime-local"')
    expect(page).toContain("step={3600}")
    expect(page).toContain("Resultado · opcional")
    expect(page).toContain("const [includeResult, setIncludeResult] = useState(false)")
    expect(page).toContain('status: includeResult ? "finished" : "scheduled"')
    expect(page).toContain("Añadir resultado")
    expect(page).not.toContain('setStatus("scheduled")')
    expect(page).not.toContain('setStatus("finished")')
  })
})
