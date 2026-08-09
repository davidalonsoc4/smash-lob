import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("match detail pairing panel", () => {
  it("gives the matchup its own prominent layout with avatars and league positions", async () => {
    const [panel, leaguePage, personalPage, personalServer, personalModel] = await Promise.all([
      read("src/components/match/MatchDetailPairingPanel.tsx"),
      read("src/app/match/[id]/page.tsx"),
      read("src/app/personal-matches/[id]/page.tsx"),
      read("src/lib/serverPersonalMatches.ts"),
      read("src/lib/personalMatches.ts"),
    ])

    expect(panel).toContain("Emparejamiento")
    expect(panel).toContain('label="Pareja A"')
    expect(panel).toContain('label="Pareja B"')
    expect(panel).toContain('const pairPlayers = playerIds.map')
    expect(panel).toContain('<PlayerAvatar')
    expect(panel).toContain('size="md"')
    expect(panel).toContain('const showAvatars = [...teamA, ...teamB].some')
    expect(panel).toContain('isSafeImageUrl(getPlayerById(playerId, players)?.avatarUrl)')
    expect(panel).toContain('{showAvatars ? (')
    expect(panel).toContain('mt-3 flex min-w-0 items-center justify-center gap-2')
    expect(panel).toContain('text-[16px] font-black')
    expect(panel).toContain("line-clamp-2")
    expect(panel).not.toContain(">\n          Partido\n        </p>")
    expect(panel).toContain("[overflow-wrap:anywhere]")
    expect(panel).toContain("#{position} en liga")
    expect(panel).toContain('alignment="left"')
    expect(panel).toContain('alignment="right"')
    expect(panel).toContain('alignment === "right" ? "text-right" : "text-left"')
    expect(panel).toContain('truncate text-center text-[12px]')
    expect(panel).toContain("points !== null && points !== undefined")
    expect(panel).toContain("sets.length > 0")

    expect(leaguePage).toContain("<MatchDetailPairingPanel")
    expect(leaguePage).toContain("getRankingPosition(rankingPlayers, playerId)")
    expect(leaguePage).toContain("rankingPositions={rankingPositions}")
    expect(leaguePage).not.toContain("<MatchScoreboard")

    expect(personalPage).toContain("<MatchDetailPairingPanel")
    expect(personalPage).toContain("linkPlayers={false}")
    expect(personalPage).toContain("avatarUrl: participant.avatarUrl ?? null")
    expect(personalPage).toContain('className="absolute right-0 top-0 flex shrink-0 flex-col items-end gap-1 text-right"')
    expect(personalPage).toContain("Amistoso")
    expect(personalPage).not.toContain("<MatchScoreboard")

    expect(personalModel).toContain("avatarUrl?: string | null")
    expect(personalServer).toContain('.from("app_users")')
    expect(personalServer).toContain('.select("id,avatar_url")')
    expect(personalServer).toContain("avatarUrlByUserId")
  })
})
