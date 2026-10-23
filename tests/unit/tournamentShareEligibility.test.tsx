// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { TournamentShareButton } from "@/components/tournament/TournamentShareButton"

vi.mock("@/components/spectator/FloatingSpectatorShareButton", () => ({
  FloatingSpectatorShareButton: ({ canShareLeague }: { canShareLeague: boolean }) => <output>{canShareLeague ? "invitable" : "closed"}</output>,
}))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it.each([
  ["creator", "draft", [{ userId: "linked" }], false],
  ["creator", "draft", [{ userId: "linked" }, { userId: null }], true],
  ["participant", "draft", [{ hasAccount: false }], false],
  ["creator", "finished", [{ userId: null }], false],
] as const)("restricts invitations by role, state and unlinked profiles: %s/%s", async (role, status, players, allowed) => {
  const json = vi.fn(async () => ({ access: { role }, tournament: { name: "Tournament", status }, players }))
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json })))
  render(<TournamentShareButton tournamentId="fixture" />)
  await waitFor(() => expect(json).toHaveBeenCalled())
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(allowed ? "invitable" : "closed"))
})
