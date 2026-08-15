import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.19 proposal option detail and message timestamp alignment", () => {
  it("opens vote detail for one proposal option without requiring the whole proposal", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("expandedProposalOptionKey")
    expect(page).toContain("const detailKey = `${message.id}:${key}`")
    expect(page).toContain("proposalExpanded || expandedProposalOptionKey === detailKey")
    expect(page).toContain("setExpandedProposalOptionKey((current) => current === detailKey ? null : detailKey)")
    expect(page).toContain("setExpandedProposalOptionKey(null); setExpandedProposalId")
  })

  it("makes both date text and location text independently expandable", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain("proposalVoteDate(startsAt)")
    expect(page).toContain('invalidated ? "line-through text-neutral-500" : ""')
    expect(page).toContain('<span className="block text-sm font-bold">{String(payload.name ?? "Ubicación propuesta")}</span>')
    expect(page).toContain("aria-expanded={optionExpanded}")
    expect(page).toContain("aria-expanded={locationExpanded}")
    expect(page).toContain("current === locationDetailKey ? null : locationDetailKey")
  })

  it("anchors timestamp and receipts to the lower-right corner while reserving inline space", async () => {
    const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8")
    expect(page).toContain('mine ? "pr-16" : "pr-11"')
    expect(page).toContain('absolute bottom-0 right-0 inline-flex whitespace-nowrap leading-none')
    expect(page).toContain('<MessageReceipt message={message} me={me} participants={participants} />')
  })
})
