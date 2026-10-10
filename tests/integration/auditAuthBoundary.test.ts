import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ auth: vi.fn(), client: vi.fn() }))
vi.mock("@/auth", () => ({ auth: mocks.auth }))
vi.mock("@/lib/supabaseServer", () => ({ createSupabaseServiceClient: mocks.client }))
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ user: { email: "fixture@example.test", name: "OAuth Name" } })
})

describe("authentication profile and role boundary", () => {
  it("does not restore privileges or profile edits made after the read", async () => {
    const stored = { id: "fixture", email: "fixture@example.test", display_name: "Saved profile", is_superuser: true, can_create_leagues: true }
    const upsert = vi.fn()
    const query = {
      select: () => query, eq: () => query, upsert,
      maybeSingle: vi.fn(async () => {
        const snapshot = { ...stored }
        stored.is_superuser = false
        stored.can_create_leagues = false
        stored.display_name = "Concurrent profile edit"
        return { data: snapshot, error: null }
      }),
    }
    mocks.client.mockReturnValue({ from: () => query })
    expect((await requireAuthenticatedAppUser()).ok).toBe(true)
    expect(upsert).not.toHaveBeenCalled()
    expect(stored).toMatchObject({ is_superuser: false, can_create_leagues: false, display_name: "Concurrent profile edit" })
    const next = await requireAuthenticatedAppUser()
    expect(next.ok && next.actor.user.isSuperuser).toBe(false)
  })

  it("ignores concurrent creation and rechecks suspension without supplying privileges", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const query = {
      select: () => query, eq: () => query, upsert,
      maybeSingle: vi.fn().mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: { id: "fixture", suspended_at: "2026-10-10" }, error: null }),
    }
    mocks.client.mockReturnValue({ from: () => query })
    expect(await requireAuthenticatedAppUser()).toEqual({ ok: false, status: 403, error: "account_suspended" })
    expect(upsert).toHaveBeenCalledWith(expect.not.objectContaining({ is_superuser: expect.anything() }), { onConflict: "email", ignoreDuplicates: true })
    expect(upsert.mock.calls[0][0]).not.toHaveProperty("can_create_leagues")
  })
})
