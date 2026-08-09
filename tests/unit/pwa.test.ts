import { readFile } from "node:fs/promises"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PWA_UPDATE_RELOAD_FALLBACK_MS,
  requestPwaUpdate,
} from "@/lib/pwaUpdate"

afterEach(() => {
  vi.useRealTimers()
})

describe("service worker lifecycle", () => {
  it("versions the shell, cleans old caches and updates only on request", async () => {
    const source = await readFile("public/sw.js", "utf8")

    expect(source).toContain('CACHE_VERSION = "smash-lob-v1.5.4"')
    expect(source).toContain('caches.match("/offline")')
    expect(source).toContain('event.data?.type === "SKIP_WAITING"')
    expect(source).toContain("event.waitUntil(self.skipWaiting())")
  })

  it("requests activation and reloads if Android does not emit controllerchange", () => {
    vi.useFakeTimers()
    const postMessage = vi.fn()
    const reload = vi.fn()

    requestPwaUpdate({ postMessage }, reload)

    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" })
    expect(reload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(PWA_UPDATE_RELOAD_FALLBACK_MS)

    expect(reload).toHaveBeenCalledOnce()
  })

  it("still schedules a reload if the waiting worker became unavailable", () => {
    vi.useFakeTimers()
    const reload = vi.fn()

    requestPwaUpdate(
      {
        postMessage() {
          throw new Error("redundant-worker")
        },
      },
      reload,
    )

    vi.advanceTimersByTime(PWA_UPDATE_RELOAD_FALLBACK_MS)

    expect(reload).toHaveBeenCalledOnce()
  })
})
