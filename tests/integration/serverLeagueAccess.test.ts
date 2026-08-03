import { beforeEach, describe, expect, it, vi } from "vitest"

const requireAuthenticatedAppUser = vi.fn()

vi.mock("@/lib/serverAuth", () => ({
  requireAuthenticatedAppUser,
}))

const { getServerLeagueViewer } = await import("@/lib/serverLeagueAccess")

function queryResult(data: unknown) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  return query
}

function authenticate({
  role = null,
  spectator = false,
  isSuperuser = false,
}: {
  role?: "creator" | "admin" | "player" | null
  spectator?: boolean
  isSuperuser?: boolean
}) {
  const from = vi.fn((table: string) =>
    table === "league_memberships"
      ? queryResult(
          role
            ? { role, player_id: "player-a", joined_at: "2026-08-02" }
            : null,
        )
      : queryResult(spectator ? { joined_at: "2026-08-02" } : null),
  )

  requireAuthenticatedAppUser.mockResolvedValue({
    ok: true,
    actor: {
      supabase: { from },
      user: {
        id: "user-a",
        email: "user@example.test",
        displayName: "Test User",
        firstName: "Test",
        lastName: "User",
        profileCompletedAt: "2026-08-02",
        availabilityCompletedAt: "2026-08-02",
        avatarUrl: null,
        isSuperuser,
      },
    },
  })
}

describe("server league authorization", () => {
  beforeEach(() => {
    requireAuthenticatedAppUser.mockReset()
  })

  it("fails closed without a session", async () => {
    requireAuthenticatedAppUser.mockResolvedValue({
      ok: false,
      status: 401,
      error: "unauthenticated",
    })

    await expect(
      getServerLeagueViewer("league-b", { requireAccess: true }),
    ).resolves.toEqual({
      ok: false,
      status: 401,
      error: "unauthenticated",
    })
  })

  it("blocks an authenticated outsider from another league", async () => {
    authenticate({})
    await expect(
      getServerLeagueViewer("league-b", { requireAccess: true }),
    ).resolves.toMatchObject({ ok: false, status: 403, error: "forbidden" })
  })

  it("allows a spectator to read but not administer", async () => {
    authenticate({ spectator: true })
    await expect(
      getServerLeagueViewer("league-a", { requireAccess: true }),
    ).resolves.toMatchObject({
      ok: true,
      actor: { isSpectator: true, isAdmin: false },
    })
    await expect(
      getServerLeagueViewer("league-a", { requireAdmin: true }),
    ).resolves.toMatchObject({ ok: false, status: 403 })
  })

  it("blocks a player from admin actions", async () => {
    authenticate({ role: "player" })
    await expect(
      getServerLeagueViewer("league-a", { requireAdmin: true }),
    ).resolves.toMatchObject({ ok: false, status: 403 })
  })

  it.each(["admin", "creator"] as const)(
    "allows the %s role to administer its league",
    async (role) => {
      authenticate({ role })
      await expect(
        getServerLeagueViewer("league-a", { requireAdmin: true }),
      ).resolves.toMatchObject({
        ok: true,
        actor: { isAdmin: true, membership: { role } },
      })
    },
  )

  it("allows a superuser without inventing a creator membership", async () => {
    authenticate({ isSuperuser: true })
    await expect(
      getServerLeagueViewer("league-a", { requireAdmin: true }),
    ).resolves.toMatchObject({
      ok: true,
      actor: { isAdmin: true, membership: null },
    })
  })
})
