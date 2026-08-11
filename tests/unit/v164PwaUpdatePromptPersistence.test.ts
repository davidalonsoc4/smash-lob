import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.6.4 PWA update prompt persistence", () => {
  it("remembers the handled pending update for the current app version and session", async () => {
    const source = await readFile("src/components/layout/PwaUpdatePrompt.tsx", "utf8")

    expect(source).toContain('import { APP_VERSION } from "@/lib/appVersion"')
    expect(source).toContain('`smash-lob-pwa-update-handled:${APP_VERSION}`')
    expect(source).toContain("window.sessionStorage.getItem(UPDATE_PROMPT_SESSION_KEY)")
    expect(source).toContain('window.sessionStorage.setItem(UPDATE_PROMPT_SESSION_KEY, \"handled\")')
    expect(source).toContain("function showWaitingWorker(worker: ServiceWorker)")
    expect(source).toContain("if (!wasUpdatePromptHandledThisSession())")
    expect(source).toContain("showWaitingWorker(registration.waiting)")
    expect(source).toContain("showWaitingWorker(registration.waiting ?? installing)")
  })

  it("treats both user actions as handled while keeping explicit worker activation", async () => {
    const source = await readFile("src/components/layout/PwaUpdatePrompt.tsx", "utf8")

    const updateNow = source.indexOf('markUpdatePromptHandledForSession()\n            setWaitingWorker(null)\n            setIsApplying(true)')
    const request = source.indexOf("requestPwaUpdate(", updateNow)
    expect(updateNow).toBeGreaterThanOrEqual(0)
    expect(request).toBeGreaterThan(updateNow)

    expect(source).toContain('onClick={() => {\n            markUpdatePromptHandledForSession()\n            setWaitingWorker(null)\n          }}')
    const updateLib = await readFile("src/lib/pwaUpdate.ts", "utf8")
    expect(updateLib).toContain('waitingWorker.postMessage({ type: "SKIP_WAITING" })')
  })
})
