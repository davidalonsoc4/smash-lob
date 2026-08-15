import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.22 chat location alignment and chats cleanup", () => {
  it("centers a proposed location vertically until an agreement badge needs room", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("locationAgreed = optionHasAgreement(message, locationKey)")
    expect(page).toContain('className={`flex min-h-10 w-full flex-col text-left ${locationAgreed ? "items-start justify-start" : "justify-center"}`}')
    expect(page).toContain("{locationAgreed ? <span")
    expect(page).toContain(">Acuerdo 4/4</span> : null}")
  })

  it("removes conversation chevrons and gives the content their space back", async () => {
    const page = await readFile("src/app/chats/page.tsx", "utf8")
    expect(page).toContain('className="min-w-0 flex-1 py-3 pl-4 pr-4"')
    expect(page).not.toContain('group-active:translate-x-0.5')
    expect(page).not.toContain('<path d="m9 18 6-6-6-6" />')
    expect(page).not.toContain('className="flex w-9 shrink-0 items-center justify-center')
  })
})
