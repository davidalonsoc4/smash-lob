import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock("@/lib/serverAuth", () => ({ requireAuthenticatedAppUser: mocks.auth }))
vi.mock("@/lib/serverRateLimit", () => ({ enforceRequestRateLimit: vi.fn().mockResolvedValue(null) }))
vi.mock("@/lib/serverApplicationAdminAudit", () => ({ recordApplicationAdminAudit: vi.fn() }))
vi.mock("server-only", () => ({}))

import { DELETE, PATCH } from "@/app/api/application-admin/tutorials/[tutorialId]/route"
import { GET, POST, PUT } from "@/app/api/application-admin/tutorials/route"
import { POST as UPLOAD } from "@/app/api/application-admin/tutorials/upload/route"

const id = "11111111-2222-4333-8444-555555555555"
const context = { params: Promise.resolve({ tutorialId: id }) }
const json = (body: unknown) => new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })

function actor(isSuperuser: boolean) {
  const from = vi.fn()
  mocks.auth.mockResolvedValue({ ok: true, actor: { user: { id: "u", email: "u@example.com", isSuperuser }, supabase: { from, storage: { from: vi.fn() } } } })
  return from
}

describe("tutorial management is for the application superuser only", () => {
  beforeEach(() => vi.clearAllMocks())

  it("rejects people who are not signed in", async () => {
    mocks.auth.mockResolvedValue({ ok: false, status: 401, error: "unauthenticated" })
    expect((await GET()).status).toBe(401)
    expect((await UPLOAD(json({ contentType: "video/mp4", size: 10 }))).status).toBe(401)
  })

  it("rejects an ordinary user on every action without touching the database", async () => {
    const from = actor(false)
    expect((await GET()).status).toBe(403)
    expect((await POST(json({ title: "x" }))).status).toBe(403)
    expect((await PUT(json({ order: [id] }))).status).toBe(403)
    expect((await PATCH(json({ title: "x", audience: "public" }), context)).status).toBe(403)
    expect((await DELETE(new Request("http://localhost/x", { method: "DELETE" }), context)).status).toBe(403)
    expect((await UPLOAD(json({ contentType: "video/mp4", size: 10 }))).status).toBe(403)
    expect(from).not.toHaveBeenCalled()
  })

  it("validates input for the superuser before writing anything", async () => {
    const from = actor(true)
    expect((await POST(json({ title: "", audience: "public", videoPath: `${id}.mp4` }))).status).toBe(400)
    expect((await POST(json({ title: "ok", audience: "leagues", leagueIds: [], videoPath: `${id}.mp4` }))).status).toBe(400)
    expect((await POST(json({ title: "ok", audience: "public", videoPath: "../etc/passwd" }))).status).toBe(400)
    expect((await PUT(json({ order: ["nope"] }))).status).toBe(400)
    expect((await UPLOAD(json({ contentType: "video/webm", size: 10 }))).status).toBe(400)
    expect((await UPLOAD(json({ contentType: "video/mp4", size: 60 * 1024 * 1024 }))).status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })
})
