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

describe("bulk tutorials from a .zip", () => {
  it("unpacks videos and thumbnails, flattening folders and skipping hidden and macOS files", async () => {
    const { zipSync } = await import("fflate")
    const bytes = new Uint8Array(200).fill(7)
    const zip = zipSync({
      "tutoriales/01-inicio.mp4": bytes,
      "tutoriales/01-inicio.png": bytes,
      "__MACOSX/tutoriales/._01-inicio.mp4": bytes,
      "tutoriales/.DS_Store": bytes,
      "tutoriales/notas.txt": bytes,
      "02-chat.mp4": bytes,
    })
    const { isZipFile, readZipFiles } = await import("@/lib/tutorialBulk")
    const archive = new File([zip as BlobPart], "videos.zip", { type: "application/zip" })
    expect(isZipFile(archive)).toBe(true)
    const files = await readZipFiles(archive)
    expect(files.map((item) => `${item.name}:${item.type}`).sort()).toEqual(["01-inicio.mp4:video/mp4", "01-inicio.png:image/png", "02-chat.mp4:video/mp4"])
    const plan = planBulkTutorials(files)
    expect(plan.entries.map((entry) => [entry.title, entry.poster?.name ?? null])).toEqual([["Inicio", "01-inicio.png"], ["Chat", null]])
  })

  it("rejects a file that is not a zip", async () => {
    const { readZipFiles } = await import("@/lib/tutorialBulk")
    await expect(readZipFiles(new File([new Uint8Array(50)], "roto.zip"))).rejects.toBeTruthy()
  })
})
