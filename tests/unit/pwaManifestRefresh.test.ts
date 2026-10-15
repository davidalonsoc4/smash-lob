import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { describe, expect, it, vi } from "vitest"

function worker() {
  const cached = new Map<string, Response>()
  const listeners = new Map<string, (event: unknown) => void>()
  const fetch = vi.fn<typeof globalThis.fetch>()
  const put = vi.fn(async (request: Request, response: Response) => { cached.set(request.url, response) })
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: { location: { origin: "https://app.example.test" }, addEventListener: (name: string, handler: (event: unknown) => void) => listeners.set(name, handler) },
    caches: { open: async () => ({ put }), match: async (request: Request) => cached.get(request.url)?.clone() },
    fetch, URL, Response,
  })
  function request(path = "/manifest.webmanifest") {
    const respondWith = vi.fn()
    listeners.get("fetch")!({ request: new Request(new URL(path, "https://app.example.test")), respondWith })
    return respondWith.mock.calls[0]?.[0] as Promise<Response> | undefined
  }
  return { cached, fetch, put, request }
}
const manifest = (body: string) => new Response(body, { headers: { "content-type": "application/manifest+json" } })
describe("automatic installed-app manifest refresh", () => {
  it("replaces old installation colors from the network and keeps the latest manifest offline", async () => {
    const w = worker()
    w.cached.set("https://app.example.test/manifest.webmanifest", manifest('{"theme_color":"#ffffff"}'))
    w.fetch.mockResolvedValueOnce(manifest('{"id":"/","display":"standalone"}'))
    expect(await (await w.request())!.json()).toEqual({ id: "/", display: "standalone" })
    expect(w.fetch).toHaveBeenCalledOnce()
    w.fetch.mockRejectedValueOnce(new Error("offline"))
    expect(await (await w.request())!.json()).toEqual({ id: "/", display: "standalone" })
  })
  it("returns fresh metadata even if device storage is full", async () => {
    const w = worker()
    w.put.mockRejectedValueOnce(new Error("quota"))
    w.fetch.mockResolvedValueOnce(manifest('{"id":"/"}'))
    expect(await (await w.request())!.json()).toEqual({ id: "/" })
  })
  it.each([new Response("unavailable", { status: 503 }), new Response("login page", { headers: { "content-type": "text/html" } })])("does not cache an error or protection page", async (response) => {
    const w = worker()
    w.cached.set("https://app.example.test/manifest.webmanifest", manifest('{"id":"/"}'))
    w.fetch.mockResolvedValueOnce(response)
    expect(await (await w.request())!.json()).toEqual({ id: "/" })
    expect(w.put).not.toHaveBeenCalled()
  })
  it("leaves foreign-origin manifests alone", () => {
    const w = worker()
    expect(w.request("https://other.example.test/manifest.webmanifest")).toBeUndefined()
    expect(w.fetch).not.toHaveBeenCalled()
  })
})
