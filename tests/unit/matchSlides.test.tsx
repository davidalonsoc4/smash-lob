// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { MatchSlides } from "@/components/ui/MatchSlides"

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers() })
it("settles after touch release even without scrollend, without interrupting a held gesture", () => {
  vi.useFakeTimers()
  const onChange = vi.fn()
  const { unmount } = render(<MatchSlides index={0} onChange={onChange} label="Partidos"><a href="/a">Liga</a><a href="/b">Mío</a></MatchSlides>)
  const slider = screen.getByRole("group")
  Object.defineProperty(slider, "clientWidth", { value: 320 })
  slider.scrollTo = vi.fn()
  fireEvent.touchStart(slider)
  slider.scrollLeft = 40
  fireEvent.scroll(slider)
  act(() => vi.advanceTimersByTime(200))
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.touchEnd(slider)
  act(() => vi.advanceTimersByTime(200))
  expect(slider.scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "instant" })
  expect(onChange).toHaveBeenLastCalledWith(0)
  fireEvent.scroll(slider)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
it("keeps a single card unchanged and enables snapping when a second card arrives", () => {
  const { rerender } = render(<MatchSlides index={0} onChange={() => {}} label="Partidos"><a href="/a">Liga</a></MatchSlides>)
  expect(screen.queryByRole("group")).toBeNull()
  rerender(<MatchSlides index={0} onChange={() => {}} label="Partidos"><a href="/a">Liga</a><a href="/b">Mío</a></MatchSlides>)
  expect(screen.getByRole("group")).toBeVisible()
  expect(screen.queryByRole("link", { name: "Mío" })).toBeNull()
})
it("settles to a complete card and only exposes the selected panel to keyboard and assistive tech", () => {
  const onChange = vi.fn()
  const { rerender } = render(<MatchSlides index={0} onChange={onChange} label="Partidos"><a href="/a">Liga</a><a href="/b">Mío</a></MatchSlides>)
  const slider = screen.getByRole("group")
  Object.defineProperty(slider, "clientWidth", { value: 320 })
  const scrollTo = vi.fn()
  slider.style.columnGap = "12px"
  slider.scrollTo = scrollTo
  expect(screen.getByRole("link", { name: "Liga" })).toBeVisible()
  expect(screen.queryByRole("link", { name: "Mío" })).toBeNull()
  expect(slider.children[1]).toHaveAttribute("inert")
  slider.scrollLeft = 40
  fireEvent(slider, new Event("scrollend", { bubbles: true }))
  expect(onChange).toHaveBeenLastCalledWith(0)
  expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "instant" })
  slider.scrollLeft = 332
  fireEvent(slider, new Event("scrollend", { bubbles: true }))
  expect(onChange).toHaveBeenLastCalledWith(1)
  rerender(<MatchSlides index={1} onChange={onChange} label="Partidos"><a href="/a">Liga</a><a href="/b">Mío</a></MatchSlides>)
  expect(scrollTo).toHaveBeenCalledWith({ left: 332, behavior: "instant" })
  expect(screen.queryByRole("link", { name: "Liga" })).toBeNull()
  expect(screen.getByRole("link", { name: "Mío" })).toBeVisible()
})
