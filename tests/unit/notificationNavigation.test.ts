import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { MessageChannel } from "node:worker_threads"
import { expect, it, vi } from "vitest"

const origin = "https://example.test"
const path = "/open?target=%2Fmatch%2Fmatch-1%2Fchat"

function clickNotification(windows: unknown[]) {
  const handlers = new Map<string, (event: unknown) => void>()
  const openWindow = vi.fn()
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL, MessageChannel, setTimeout, clearTimeout,
    self: {
      location: { origin },
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler),
      clients: { matchAll: async () => windows, openWindow },
    },
  })
  let completion: Promise<unknown> | undefined
  handlers.get("notificationclick")?.({
    notification: { close: vi.fn(), data: { url: path } },
    waitUntil: (work: Promise<unknown>) => { completion = work },
  })
  return { completion, openWindow }
}

it("opens a notification in the existing app without reloading the document", async () => {
  const window = {
    url: origin + "/leagues",
    postMessage: vi.fn((_message, [port]: [import("node:worker_threads").MessagePort]) => {
      port.postMessage("navigating")
      port.close()
    }),
    navigate: vi.fn(),
    focus: vi.fn(),
  }
  const { completion, openWindow } = clickNotification([window])
  await completion
  expect(window.postMessage.mock.calls[0]?.[0]).toEqual({ type: "OPEN_NOTIFICATION", url: origin + path })
  expect(window.focus).toHaveBeenCalledOnce()
  expect(window.navigate).not.toHaveBeenCalled()
  expect(openWindow).not.toHaveBeenCalled()
})

it("opens the notification URL when the app has no open window", async () => {
  const { completion, openWindow } = clickNotification([])
  await completion
  expect(openWindow).toHaveBeenCalledWith(origin + path)
})

it("falls back to loading the URL when an older open app does not acknowledge the message", async () => {
  const window = {
    url: origin + "/leagues",
    postMessage: vi.fn((_message, [port]: [import("node:worker_threads").MessagePort]) => port.close()),
    navigate: vi.fn(async () => null),
    focus: vi.fn(),
  }
  const { completion } = clickNotification([window])
  await completion
  expect(window.navigate).toHaveBeenCalledWith(origin + path)
  expect(window.focus).toHaveBeenCalledOnce()
})
