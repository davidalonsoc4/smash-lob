import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.5 chat proposal voting and programming status", () => {
  it("uses weekday-aware dates in proposal draft and sent proposal rows", async () => { const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8"); expect(page).toContain("calendarWeekday(localDateValue(date))"); expect(page).toContain("proposalVoteDate(startsAt)"); expect(page).toContain('weekday: "long"'); expect(page).toContain('year: "numeric"') })
  it("uses accessible visual yes/no controls with selected green and red states", async () => { const page = await readFile("src/app/match/[id]/chat/page.tsx", "utf8"); expect(page).toContain("Me viene bien"); expect(page).toContain("No puedo"); expect(page).toContain("bg-emerald-600 text-white"); expect(page).toContain("bg-red-600 text-white") })
  it("labels unscheduled editable detail as manual scheduling", async () => { const es = await readFile("src/i18n/locales/es.ts", "utf8"); const form = await readFile("src/components/match/MatchScheduleForm.tsx", "utf8"); expect(es).toContain('addScheduleTitle: "Programación manual"'); expect(form).toContain("t.matchDetail.addScheduleTitle") })
  it("keeps unscheduled neutral and gives intermediate coordination states distinct subtle tones", async () => { const styles = await readFile("src/lib/statusStyles.ts", "utf8"); expect(styles).toContain('scheduling: "neutral"'); expect(styles).toContain('coordinating: "violet"'); expect(styles).toContain('awaiting_booking: "indigo"'); expect(styles).toContain("status-tone-violet"); expect(styles).toContain("status-tone-indigo") })
})
