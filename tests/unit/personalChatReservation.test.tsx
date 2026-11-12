// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import PersonalChat from "@/app/personal-matches/[id]/chat/page"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import type { PersonalMatchItem } from "@/lib/personalMatches"
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { email: "qa@example.test" } } }) }))
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "qa-friendly" }) }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ t: { matchResult: { pendingScheduleTitle: "Resultado pendiente" } }, tx: (text: string) => text, locale: "es" }) }))
vi.mock("@/lib/chatRealtimeClient", () => ({ CHAT_UNREAD_LOCAL_REFRESH_EVENT: "qa-unread", subscribeChatRealtime: () => () => {} }))
vi.mock("@/components/match/chat/MatchChatShared", () => ({
  MatchChatScreen: ({ topContent, loading, emptyState }: { topContent: React.ReactNode; loading: boolean; emptyState: React.ReactNode }) => <div>{topContent}{!loading && emptyState}</div>,
  MatchChatComposer: () => null, MatchChatReadOnlyBar: () => null, MatchChatTextMessage: () => null, MatchChatWriteWindowBanner: () => null,
  resizeMatchChatComposer: () => {}, useMatchChatAutoScroll: () => {}, useMatchChatViewport: () => {},
}))
const match: PersonalMatchItem = { id: "qa-friendly", origin: "friendly", status: "scheduled", scheduledAt: "2099-10-12T17:00:00Z", resultRecordedAt: null, locationName: "Pista QA", sets: [], participants: [{ team: 1, slot: 1, displayName: "Ana QA", isCurrentUser: true }], canManage: true, canDelete: true, leagueId: null, leagueName: null, seasonId: null, seasonName: null, round: null, courtBooking: { isReserved: true, reservations: [], ballPurchases: [], transfers: [], updatedAt: null } }
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
  expect(trigger).toHaveTextContent("2099")
  fireEvent.click(trigger)
  expect(modal).toHaveBeenCalledOnce()
  expect(screen.getByRole("button", { name: "Google Calendar" })).toBeVisible()
  expect(screen.getByRole("button", { name: "Apple Calendar / otros (.ics)" })).toBeVisible()
})
it.each([
  { ...match, courtBooking: { ...match.courtBooking!, isReserved: false } },
  { ...match, scheduledAt: null },
  { ...match, scheduledAt: "2000-10-12T17:00:00Z" },
  { ...match, status: "finished" as const },
])("only shows a calendar action for a future, reserved, unfinished match", async (item) => {
  respond(item); render(<PersonalChat />)
  await screen.findByText("Aún no hay mensajes")
  expect(screen.queryByRole("button", { name: /Reserva/ })).toBeNull()
})
it("links to the friendly match when the reservation has elapsed without a result", async () => {
  respond({ ...match, scheduledAt: "2000-10-12T17:00:00Z" })
  render(<PersonalChat />)
  expect(await screen.findByRole("link", { name: "Resultado pendiente Ver partido" })).toHaveAttribute("href", "/personal-matches/qa-friendly")
})
it("preserves the normal calendar button styling with layout classes", () => {
  render(<PersonalAddToCalendarButton match={match} className="flex-1" />)
  expect(screen.getByRole("button", { name: "Añadir al calendario" })).toHaveClass("rounded-lg", "border-neutral-950", "flex-1")
})
