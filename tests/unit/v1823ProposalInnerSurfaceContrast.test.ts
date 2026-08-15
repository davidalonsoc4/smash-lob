import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.23 proposal inner surface contrast", () => {
  it("keeps the sender-colored proposal shell but restores light voting content", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('mine ? "bg-neutral-950" : "border border-neutral-200 bg-white text-neutral-950"')
    expect(page).toContain('text-neutral-950 ${invalidated ? "bg-neutral-100 opacity-70" : "bg-neutral-50"}')
    expect(page).toContain('className="mt-1.5 flex items-start gap-2 rounded-xl bg-neutral-50 px-2.5 py-1.5 text-neutral-950"')
    expect(page).toContain('const idleVoteClass = "border-neutral-200 bg-white text-neutral-500"')
    expect(page).not.toContain('mine ? "bg-white/10" : "bg-neutral-50"')
    expect(page).not.toContain("proposalVoteDetailRows(message, key, mine)")
    expect(page).not.toContain("proposalControls(message, locationKey, mine)")
  })

  it("keeps agreement and discarded badges readable on the light inner surface", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('bg-emerald-100 px-1.5 py-px type-caption font-black uppercase tracking-wide text-emerald-700')
    expect(page).toContain('bg-neutral-200 px-1.5 py-px type-caption font-black uppercase tracking-wide text-neutral-600')
  })

  it("keeps own proposal primary color on the shell without leaking white text into inner vote surfaces", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('mine ? "bg-neutral-950" : "border border-neutral-200 bg-white text-neutral-950"')
    expect(page).not.toContain('mine ? "bg-neutral-950 text-white" : "border border-neutral-200 bg-white text-neutral-950"')
    expect(page).toContain('mine ? "bg-neutral-950 text-white" : "text-neutral-950"')
    expect(page).toContain('type-caption font-semibold ${mine ? "text-neutral-300" : "text-neutral-400"}`}>Toca para ver quién ha votado</p>')
    expect(page).toContain('className="shrink-0"><span className={`inline-flex whitespace-nowrap leading-none ${mine ? "text-neutral-300" : "text-neutral-400"}`}')
    expect(page).toContain('className="origin-right scale-90 type-caption"')
    expect(page).toContain('const idleVoteClass = "border-neutral-200 bg-white text-neutral-500"')
  })
})
