import { beforeEach, expect, it, vi } from "vitest"
const state = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), from: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: state.auth }))
vi.mock("@/lib/serverLeagueAccess", () => ({ getServerLeagueActor: state.access }))
import { GET } from "@/app/api/leagues/[id]/player-directory/route"

const request = () => new Request("https://example.test/api/leagues/new/player-directory")
beforeEach(() => { vi.clearAllMocks(); state.auth.mockResolvedValue({ ok: true, actor: { user: { id: "self", isSuperuser: false, canCreateLeagues: true }, supabase: { from: state.from } } }) })
it("allows a creator to choose profiles before saving any league, excluding their own account", async () => {
  state.from.mockReturnValue({ select: () => ({ not: async () => ({ data: [{ id: "self", display_name: "Yo" }, { id: "other", display_name: "Ana", avatar_url: null }], error: null }) }) })
  const response = await GET(request(), { params: Promise.resolve({ id: "new" }) })
  expect(response.status).toBe(200)
  expect((await response.json()).people).toEqual([{ userId: "other", displayName: "Ana", avatarUrl: null }])
  expect(state.from).toHaveBeenCalledTimes(1)
  expect(state.from).toHaveBeenCalledWith("app_users")
  expect(state.access).not.toHaveBeenCalled()
})
it("denies draft directory to accounts without creator permission", async () => {
  state.auth.mockResolvedValue({ ok: true, actor: { user: { id: "self", isSuperuser: false, canCreateLeagues: false } } })
  expect((await GET(request(), { params: Promise.resolve({ id: "new" }) })).status).toBe(403)
  expect(state.from).not.toHaveBeenCalled()
})
it("requires authentication for the draft directory", async () => {
  state.auth.mockResolvedValue({ ok: false, status: 401, error: "unauthenticated" })
  expect((await GET(request(), { params: Promise.resolve({ id: "new" }) })).status).toBe(401)
  expect(state.from).not.toHaveBeenCalled()
})
it("keeps league administration access checks for existing leagues", async () => {
  const id = "40000000-0000-4000-8000-000000000001"
  state.access.mockResolvedValue({ ok: false, status: 403, error: "forbidden" })
  expect((await GET(request(), { params: Promise.resolve({ id }) })).status).toBe(403)
  expect(state.access).toHaveBeenCalledWith(id, { requireAdmin: true })
  expect(state.auth).not.toHaveBeenCalled()
})
it("rejects invalid league identifiers without looking up profiles", async () => {
  expect((await GET(request(), { params: Promise.resolve({ id: "invalid" }) })).status).toBe(400)
  expect(state.from).not.toHaveBeenCalled()
  expect(state.auth).not.toHaveBeenCalled()
})
