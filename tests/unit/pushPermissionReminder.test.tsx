// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { PushPermissionReminder } from "@/components/notifications/PushPermissionReminder"

const mocks = vi.hoisted(() => ({ path: "/leagues", request: vi.fn() }))
vi.mock("next/navigation", () => ({ usePathname: () => mocks.path, useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/context/ActiveLeagueProvider", () => ({ useActiveLeague: () => ({ activeLeagueId: "league" }) }))
vi.mock("@/context/LeagueAccessProvider", () => ({ useLeagueAccess: () => ({
  canAccessLeague: () => true, getMembershipForLeague: () => ({ playerId: "player" }), isLeagueSpectator: () => false,
}) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text }) }))
vi.mock("@/lib/pushClient", () => ({
  ensurePushSubscriptionForLeague: mocks.request,
  getPushSupportStatus: () => "supported",
  isPushAutoRegistrationDisabled: () => false,
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it("offers push once per cooldown even if the user ignores the reminder", () => {
  vi.useFakeTimers()
  vi.stubGlobal("Notification", { permission: "default" })
  const view = render(<PushPermissionReminder />)
  act(() => vi.advanceTimersByTime(4500))
  expect(screen.getByRole("button", { name: "Activar notificaciones" })).toBeVisible()
  expect(mocks.request).not.toHaveBeenCalled()
  mocks.path = "/personal-matches"
  view.rerender(<PushPermissionReminder />)
  expect(screen.queryByRole("button", { name: "Activar notificaciones" })).toBeNull()
  mocks.path = "/leagues"
  view.rerender(<PushPermissionReminder />)
  act(() => vi.advanceTimersByTime(4500))
  expect(screen.queryByRole("button", { name: "Activar notificaciones" })).toBeNull()
  act(() => vi.advanceTimersByTime(14 * 24 * 60 * 60 * 1000))
  view.unmount()
  render(<PushPermissionReminder />)
  act(() => vi.advanceTimersByTime(4500))
  expect(screen.getByRole("button", { name: "Activar notificaciones" })).toBeVisible()
})
