import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.8.12 chats compact polish", () => {
  it("labels the viewer as Yo in the last-message preview", async () => { const api = await readFile("src/app/api/chats/route.ts", "utf8"); expect(api).toContain('last.sender_user_id === user.id ? "Yo" : last.sender_display_name') })
  it("uses one continuous accent per joined chat stack", async () => { const page = await readFile("src/app/chats/page.tsx", "utf8"); const css = await readFile("src/app/globals.css", "utf8"); expect(page).toContain('className="chat-list-stack overflow-hidden rounded-xl"'); expect(page).not.toContain("chat-list-card app-card-explicit-accent"); expect(css).toContain(".chat-list-stack::before"); expect(css).not.toContain(".chat-list-card::before") })
  it("keeps only meaningful active statuses and makes them visually quieter", async () => { const page = await readFile("src/app/chats/page.tsx", "utf8"); expect(page).not.toContain('scheduling: ["Sin programar"'); expect(page).toContain('return status === "scheduling" ? null'); expect(page).toContain('"h-2.5 w-2.5 rounded-full "'); expect(page).toContain('<StatusHelp kind={chat.readOnly ? "chat" : "match-participant"}'); expect(page).not.toContain("visibleStatusId"); expect(page).toContain("dotColors") })
})
