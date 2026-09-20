import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"
import { sanitizePublicSpectatorMatch } from "@/lib/publicSpectator"
import { normalizeSpectatorInviteAppearance } from "@/lib/spectatorTheme"

describe("public spectator data", () => {
  it("normalizes an invite appearance to an immutable safe theme", () => {
    expect(normalizeSpectatorInviteAppearance({
      visualStyle: "competition",
      baseTheme: "light",
      palette: "unknown" as never,
      competitionAccent: "gold",
      accentColor: "#abc",
    })).toEqual({
      visualStyle: "competition",
      baseTheme: "light",
      palette: "classic",
      competitionAccent: "gold",
      accentColor: "#D7A544",
    })
  })

  it("returns only public match fields and never includes internal identifiers or operations", () => {
    const result = sanitizePublicSpectatorMatch({
      match: {
        id: "internal-match-id",
        leagueId: "internal-league-id",
        seasonId: "internal-season-id",
        round: 2,
        status: "finished",
        teamA: ["player-a", "player-b"],
        teamB: ["player-c", "player-d"],
        pointsA: 2,
        pointsB: 1,
        sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 2 }],
        scheduledAt: "2026-09-17T18:00:00.000Z",
        location: "Padel Indoor",
        resultReportedByPlayerId: "private-reporter-id",
        incidentNotes: "private incident",
        courtBooking: { transfers: ["private payment"] },
      } as never,
      playerNameById: new Map([
        ["player-a", "Ana"], ["player-b", "Luis"],
        ["player-c", "Eva"], ["player-d", "Raúl"],
      ]),
      revealParticipants: true,
      revealSchedule: true,
    })

    expect(result).toEqual({
      round: 2,
      status: "finished",
      teams: [["Ana", "Luis"], ["Eva", "Raúl"]],
      score: {
        sets: [{ a: 6, b: 4 }, { a: 3, b: 6 }, { a: 6, b: 2 }],
        pointsA: 2,
        pointsB: 1,
      },
      scheduledAt: "2026-09-17T18:00:00.000Z",
      location: "Padel Indoor",
    })
    expect(JSON.stringify(result)).not.toMatch(/internal-|private/)
  })

  it("can reveal an opening time without revealing any pairing", () => {
    const result = sanitizePublicSpectatorMatch({
      match: {
        id: "internal-match-id",
        leagueId: "internal-league-id",
        seasonId: "internal-season-id",
        round: 1,
        status: "scheduled",
        teamA: ["player-a", "player-b"],
        teamB: ["player-c", "player-d"],
        pointsA: null,
        pointsB: null,
        sets: [],
        scheduledAt: "2026-09-17T18:00:00.000Z",
        location: "Padel Indoor",
      } as never,
      playerNameById: new Map([["player-a", "Ana"]]),
      revealParticipants: false,
      revealSchedule: true,
    })

    expect(result.teams).toBeNull()
    expect(result.status).toBe("hidden")
    expect(result.scheduledAt).toBe("2026-09-17T18:00:00.000Z")
    expect(JSON.stringify(result)).not.toContain("Ana")
    expect(JSON.stringify(result)).not.toContain("player-a")
  })

  it("opens the full league for an authenticated member using a spectator link", async () => {
    const flow = await readFile("src/components/spectator/SpectatorInviteFlow.tsx", "utf8")
    const route = await readFile("src/app/api/spectator-invites/[code]/route.ts", "utf8")
    expect(route).toContain("viewerAccess")
    expect(route).toContain("league_memberships")
    expect(flow).toContain('invite.viewerAccess === "member"')
    expect(flow).toContain('window.localStorage.setItem("smash-lob-active-league", invite.leagueId)')
    expect(flow).toContain('router.replace("/")')
    expect(flow).toContain("hasFullLeagueAccess")
    expect(flow).toContain("applySpectatorInviteAppearance")
  })

  it("does not mistake ThemeProvider defaults for an explicit appearance preference", async () => {
    const theme = await readFile("src/context/ThemeProvider.tsx", "utf8")
    const helper = await readFile("src/lib/spectatorTheme.ts", "utf8")
    const publicView = await readFile("src/components/spectator/PublicSpectatorView.tsx", "utf8")
    expect(theme).toContain("APPEARANCE_PREFERENCE_STORAGE_KEY")
    expect(theme).toContain("readHadStoredAppearancePreference")
    expect(helper).toContain('localStorage.getItem(APPEARANCE_PREFERENCE_STORAGE_KEY) === "1"')
    expect(theme).toContain('pathname.startsWith("/spectate/")')
    expect(publicView).toContain('sessionStatus === "authenticated"')
  })
})
