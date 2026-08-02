import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("service worker lifecycle", () => {
  it("versions the shell, cleans old caches and updates only on request", async () => {
    const source = await readFile("public/sw.js", "utf8")

    expect(source).toContain('CACHE_VERSION = "smash-lob-v1.1.0-rc.1"')
    expect(source).toContain('caches.match("/offline")')
    expect(source).toContain('event.data?.type === "SKIP_WAITING"')
    expect(source).not.toContain("event.waitUntil(self.skipWaiting())")
  })
})
