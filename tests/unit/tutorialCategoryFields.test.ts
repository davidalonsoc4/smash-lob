import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: vi.fn() }))
vi.mock("@/lib/serverTutorialChatShare", () => ({ announceTutorialInLeagues: vi.fn() }))

describe("tutorial fields with a category", () => {
  it("forces social media material to a private draft with no leagues, screen or schedule", async () => {
    const { parseTutorialFields } = await import("@/lib/serverTutorialAdmin")
    const fields = parseTutorialFields({
      title: "Reel de bienvenida", audience: "public", category: "social", leagueIds: ["0a6f4a2e-2d6b-4d0e-9f77-2f6a3f0b6c11"],
      screen: "ranking", publishAt: "2999-01-01T00:00:00.000Z",
    })
    expect(fields).toMatchObject({ category: "social", audience: "draft", leagueIds: [], screen: null, publishAt: null })
  })

  it("keeps the audience of an app tutorial and defaults to the app category", async () => {
    const { parseTutorialFields } = await import("@/lib/serverTutorialAdmin")
    expect(parseTutorialFields({ title: "Inicio", audience: "public" })).toMatchObject({ category: "app", audience: "public" })
    expect(parseTutorialFields({ title: "Inicio", audience: "public", category: "otro" })).toBeNull()
  })
})
