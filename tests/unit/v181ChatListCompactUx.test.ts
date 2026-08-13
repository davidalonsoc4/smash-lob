import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.1 chats list and compact match-chat UX", () => {
  it("keeps active chats first without a separate active heading and uses first names", async () => {
    const page = await readFile("src/app/chats/page.tsx", "utf8")
    expect(page).not.toContain(">Chats activos<")
    expect(page).toContain(">Chats finalizados<")
    expect(page).toContain("function firstName")
    expect(page).toContain("return `con ${firstName(chat.partner)")
    expect(page.indexOf("<ChatCards chats={activeChats} />")).toBeLessThan(page.indexOf("<ChatCards chats={finishedChats} />"))
  })

  it("keeps recommended location names fully visible", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("whitespace-normal break-words")
    expect(page).toContain("grid-cols-1")
    expect(page).not.toContain("truncate rounded-xl border px-2.5 py-2 text-left text-xs font-black")
  })

  it("keeps the player panel in code but hidden by default", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("const SHOW_MATCH_TEAMS_PANEL = false")
    expect(page).toContain("SHOW_MATCH_TEAMS_PANEL && match")
    expect(page).toContain("<MatchTeamsPanel")
  })
})
