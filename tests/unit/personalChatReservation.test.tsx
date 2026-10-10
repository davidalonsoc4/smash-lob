// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import PersonalChat from "@/app/personal-matches/[id]/chat/page"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import type { PersonalMatchItem } from "@/lib/personalMatches"
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "qa-friendly" }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (text: string) => text, locale: "es" }) }))
vi.mock("@/lib/chatRealtimeClient", () => ({ CHAT_UNREAD_LOCAL_REFRESH_EVENT: "qa-unread", subscribeChatRealtime: () => () => {} }))
vi.mock("@/components/match/chat/MatchChatShared", () => ({
  MatchChatScreen: ({ topContent }: { topContent: React.ReactNode }) => <div>{topContent}</div>,
  MatchChatComposer: () => null, MatchChatReadOnlyBar: () => null, MatchChatTextMessage: () => null, MatchChatWriteWindowBanner: () => null,
  resizeMatchChatComposer: () => {}, useMatchChatAutoScroll: () => {}, useMatchChatViewport: () => {},
}))
const match: PersonalMatchItem = { id: "qa-friendly", origin: "friendly", status: "scheduled", scheduledAt: "2026-10-12T17:00:00Z", resultRecordedAt: null, locationName: "Pista QA", sets: [], participants: [{ team: 1, slot: 1, displayName: "Ana QA", isCurrentUser: true }], canManage: true, canDelete: true, leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null, courtBooking: { isReserved: true, reservations: [], ballPurchases: [], transfers: [], updatedAt: null } }
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
function respond(item: PersonalMatchItem) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ match: item, messages: [], participants: [], currentUserId: "qa", readOnly: false }) }))
}
it("shows a saved reservation and opens the existing calendar chooser", async () => {
  respond(match)
  const modal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", "") })
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: modal })
  render(<PersonalChat />)
  const trigger = await screen.findByRole("button", { name: /Reserva.*Guardar en calendario/ })
  expect(trigger).toHaveTextContent("Pista QA")
  expect(trigger).toHaveTextContent("2026")
  fireEvent.click(trigger)
  expect(modal).toHaveBeenCalledOnce()
  expect(screen.getByRole("button", { name: "Google Calendar" })).toBeVisible()
  expect(screen.getByRole("button", { name: "Apple Calendar / otros (.ics)" })).toBeVisible()
})
it.each([{ ...match, courtBooking: { ...match.courtBooking!, isReserved: false } }, { ...match, scheduledAt: null }])("does not invent a reservation without a booking and valid date", async (item) => {
  respond(item); render(<PersonalChat />)
  await vi.waitFor(() => expect(fetch).toHaveBeenCalled())
  expect(screen.queryByRole("button", { name: /Reserva/ })).toBeNull()
})
it("preserves the normal calendar button styling with layout classes", () => {
  render(<PersonalAddToCalendarButton match={match} className="flex-1" />)
  expect(screen.getByRole("button", { name: "Añadir al calendario" })).toHaveClass("rounded-lg", "border-neutral-950", "flex-1")
})
