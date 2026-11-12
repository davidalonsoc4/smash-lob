import { beforeEach, expect, it, vi } from "vitest"
import { PERSONAL_PROFILE_ACCOUNT_HEADER } from "@/lib/personalMatches"

const { authenticate, loadDashboard } = vi.hoisted(() => ({
  authenticate: vi.fn(),
  loadDashboard: vi.fn(),
}))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: authenticate }))
vi.mock("@/lib/serverPersonalMatches", () => ({ loadPersonalMatchesDashboard: loadDashboard }))

import { GET } from "@/app/api/personal-matches/route"

beforeEach(() => {
  authenticate.mockResolvedValue({ ok: true, actor: { user: { email: "qa-profile@example.test" } } })
  loadDashboard.mockResolvedValue({ items: [], hasMore: false, nextOffset: null, upcoming: [] })
})

it("rejects a profile pagination request if the cookie now belongs to another account", async () => {
  const request = new Request("http://localhost/api/personal-matches?limit=50", {
    headers: { [PERSONAL_PROFILE_ACCOUNT_HEADER]: "other-qa%40example.test" },
  })
  expect((await GET(request)).status).toBe(403)
  expect(loadDashboard).not.toHaveBeenCalled()
})

it("loads profile history for the matching account and keeps standard dashboard requests working", async () => {
  const url = "http://localhost/api/personal-matches?limit=50"
  const profile = new Request(url, { headers: { [PERSONAL_PROFILE_ACCOUNT_HEADER]: "qa-profile%40example.test" } })
  expect((await GET(profile)).status).toBe(200)
  expect((await GET(new Request(url))).status).toBe(200)
  expect(loadDashboard).toHaveBeenCalledTimes(2)
})
