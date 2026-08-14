import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.1 match chat composer UX", () => {
  it("lets the composer follow normal focus and only restores it after sending text", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("function focusComposerAfterSend")
    expect(page).toContain('post("text", {}, text, true)')
    expect(page).toContain("composerRef.current?.blur()")
    expect(page).not.toContain("function preserveComposerFocus")
    expect(page).not.toContain("function handleComposerBlur")
    expect(page).not.toContain("autoFocus")
    expect(page).not.toContain('data-chat-secondary-input="true"')
  })

  it("uses a paperclip and cleaner proposal choices", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('aria-label="Adjuntar propuesta"')
    expect(page).toContain('title="Proponer fecha o ubicación"')
    expect(page).toContain("Adjuntar al chat")
    expect(page).toContain("Propón horarios")
    expect(page).toContain("Propón una pista")
    expect(page).not.toContain('aria-label="Acciones del partido"')
    expect(page).not.toContain('<select value={locationDraft}')
  })

  it("opens match detail from the chat title", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('import Link from "next/link"')
    expect(page).toContain('href={`/match/${id}`}')
    expect(page).toContain('aria-label="Abrir detalle del partido"')
    expect(page).not.toContain("pointer-events-none absolute left-1/2")
  })
})
