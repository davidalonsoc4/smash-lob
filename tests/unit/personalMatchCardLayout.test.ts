import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("personal match card layout", () => {
  it("keeps origin in the header and shared match metadata below both pair panels", async () => {
    const [card, eventMeta, setGameScore] = await Promise.all([
      read("src/components/personal/PersonalMatchCard.tsx"),
      read("src/components/matches/MatchEventMeta.tsx"),
      read("src/components/matches/SetGameScore.tsx"),
    ])

    const preview = await read("src/components/matches/MatchPreviewTeams.tsx")
    expect(card).toContain("<MatchPreviewTeams")
    expect(preview).toContain('rounded-xl bg-neutral-50 px-3 py-1')
    expect(preview).toContain("grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)]")
    expect(card).toContain("getPersonalMatchOutcome(match)")
    expect(card).toContain('outcome === "win"')
    expect(card).toContain('outcome === "loss"')
    expect(card).toContain('<MatchOutcomeBadge outcome=')
    expect(card).toContain("getPersonalMatchOriginBadgeClass(match)")
    expect(card).toContain("getPersonalMatchOriginLabel(match)")
    expect(card).toContain("<MatchEventMeta")
    expect(card).toContain("locationText={match.scheduleLocation ?? match.locationName}")
    expect(card).toContain("locationFallback={null}")
    expect(card).toContain("hideMissingRows")
    expect(card).toContain("eventAt={match.scheduledAt}")
    expect(card.indexOf("getPersonalMatchOriginLabel(match)")).toBeLessThan(
      card.indexOf("<div className=\"flex items-center gap-3\">"),
    )
    expect(eventMeta).toContain("formatMatchEventDateTime")
    expect(eventMeta).toContain("weekday: \"long\"")
    expect(eventMeta).toContain("hideMissingRows?: boolean")
    expect(preview).toContain("<SetGameScore")
    expect(setGameScore).toContain("style={{ fontWeight: won ? 700 : 400 }}")
    expect(setGameScore).toContain("border-transparent bg-neutral-100")
    expect(setGameScore).toContain("text-xs text-neutral-400")
    expect(setGameScore).not.toContain("bg-white")
  })
})
