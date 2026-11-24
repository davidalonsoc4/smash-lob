import { describe, expect, it } from "vitest"
import { planBulkTutorials, titleFromFileName } from "@/lib/tutorialBulk"

const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type })

describe("bulk tutorial plan", () => {
  it("pairs a video with the picture that has the same name", () => {
    const plan = planBulkTutorials([file("02-chat.mp4", "video/mp4"), file("02-CHAT.png", "image/png"), file("01-inicio.mp4", "video/mp4")])
    expect(plan.entries.map((entry) => entry.video.name)).toEqual(["01-inicio.mp4", "02-chat.mp4"])
    expect(plan.entries[0].poster).toBeNull()
    expect(plan.entries[1].poster?.name).toBe("02-CHAT.png")
    expect(plan.ignored).toEqual([])
  })

  it("orders numbered files naturally", () => {
    const plan = planBulkTutorials([file("10-b.mp4", "video/mp4"), file("2-a.mp4", "video/mp4")])
    expect(plan.entries.map((entry) => entry.video.name)).toEqual(["2-a.mp4", "10-b.mp4"])
  })

  it("reports what cannot be used", () => {
    const plan = planBulkTutorials([file("a.mov", "video/quicktime"), file("lonely.jpg", "image/jpeg"), file("big.mp4", "video/mp4", 51 * 1024 * 1024)])
    expect(plan.entries).toEqual([])
    expect(plan.ignored.map((item) => item.reason).sort()).toEqual(["no_video", "not_supported", "too_big"])
  })

  it("builds a readable title from the file name", () => {
    expect(titleFromFileName("03_chat-de-la-liga.mp4")).toBe("Chat de la liga")
    expect(titleFromFileName("Bienvenida.mp4")).toBe("Bienvenida")
    expect(titleFromFileName("07.mp4")).toBe("07")
  })
})
