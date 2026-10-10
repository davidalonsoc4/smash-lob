// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { PwaUpdatePrompt } from "@/components/layout/PwaUpdatePrompt"
import { isPwaUpdateSafe } from "@/lib/pwaUpdate"
vi.stubGlobal("React", React)
afterEach(() => { cleanup(); Reflect.deleteProperty(navigator, "serviceWorker"); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it("does not treat a blurred draft as safe even after a long idle period", () => {
  expect(isPwaUpdateSafe({ isVisible: true, hasFocus: true, isEditing: false, hasEditedInput: true, hasOpenDialog: false, idleMs: 3_600_000 })).toBe(false)
})

it("does not activate a waiting worker after editing and blurring a field", async () => {
  vi.stubGlobal("React", React)
  vi.useFakeTimers()
  vi.spyOn(document, "hasFocus").mockReturnValue(true)
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")
  const postMessage = vi.fn()
  const serviceWorker = new EventTarget() as EventTarget & { register: ReturnType<typeof vi.fn>; controller: object }
  serviceWorker.controller = {}
  serviceWorker.register = vi.fn().mockResolvedValue(Object.assign(new EventTarget(), { waiting: { postMessage }, installing: null }))
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker })
  const { getByRole } = render(<><PwaUpdatePrompt /><textarea aria-label="Draft" /><button>Outside</button></>)
  await Promise.resolve()
  const input = getByRole("textbox")
  input.focus()
  fireEvent.input(input, { target: { value: "Unsaved fixture" } })
  getByRole("button").focus()
  await vi.advanceTimersByTimeAsync(180_000)
  expect(postMessage).not.toHaveBeenCalled()
})
