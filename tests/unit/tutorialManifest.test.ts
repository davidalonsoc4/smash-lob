import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { zipSync, strToU8 } from "fflate"
import { applyBulkManifest, matchLeagueNames, parseBulkManifest, planBulkTutorials, readZipFiles } from "@/lib/tutorialBulk"

const file = (name: string, type: string) => new File([new Uint8Array(100)], name, { type })

describe("bulk tutorial manifest", () => {
  it("reads destination, screen, audience and leagues, with defaults at the top", () => {
    const manifest = parseBulkManifest(JSON.stringify({
      destino: "genérico", quien: "Público",
      videos: [
        { archivo: "05_sorteo.mp4", titulo: "Sorteo del saque", descripcion: "La moneda", pantalla: "MATCH" },
        { archivo: "19_liguilla.mp4", destino: "redes" },
        { archivo: "x.mp4", destino: "ligas", ligas: ["Liga Árbol"] },
        { archivo: "bad.mp4", pantalla: "nada", quien: "todos", destino: "otra" },
      ],
    }))!
    const get = (name: string) => manifest.byFile.get(name)!
    expect(get("05_sorteo")).toMatchObject({ title: "Sorteo del saque", description: "La moneda", screen: "match", destination: "generic", audience: "public", order: 0 })
    expect(get("19_liguilla").destination).toBe("social")
    expect(get("x").leagueNames).toEqual(["Liga Árbol"])
    expect(manifest.warnings.map((item) => item.reason).sort()).toEqual(["bad_audience", "bad_destination", "bad_screen"])
    expect(get("bad").screen).toBeUndefined()
  })

  it("accepts a plain list and rejects what is not JSON", () => {
    expect(parseBulkManifest(JSON.stringify([{ archivo: "a.mp4" }]))?.byFile.size).toBe(1)
    expect(parseBulkManifest("esto no es json")).toBeNull()
    expect(parseBulkManifest("{\"videos\": 3}")).toBeNull()
  })

  it("applies the manifest order, titles and named thumbnails, and reports missing files", () => {
    const files = [file("b.mp4", "video/mp4"), file("a.mp4", "video/mp4"), file("portada.png", "image/png")]
    const manifest = parseBulkManifest(JSON.stringify({ videos: [{ archivo: "b.mp4", titulo: "Segundo", miniatura: "portada.png" }, { archivo: "a.mp4" }, { archivo: "falta.mp4" }] }))
    const { entries, warnings } = applyBulkManifest(planBulkTutorials(files), manifest, files)
    expect(entries.map((entry) => entry.title)).toEqual(["Segundo", "A"])
    expect(entries[0].poster?.name).toBe("portada.png")
    expect(warnings).toEqual([{ reason: "no_file", detail: "falta" }])
  })

  it("matches league names ignoring case and accents", () => {
    const leagues = [{ id: "1", name: "Liga Árbol" }, { id: "2", name: "Otra" }]
    expect(matchLeagueNames(["liga arbol", "Nada"], leagues)).toEqual({ ids: ["1"], unknown: ["Nada"] })
  })

  it("keeps manifest.json when a zip is unpacked", async () => {
    const zip = zipSync({ "pack/manifest.json": strToU8("{\"videos\":[]}"), "pack/01.mp4": new Uint8Array(10), "pack/notas.txt": new Uint8Array(5) })
    const files = await readZipFiles(new File([zip as BlobPart], "pack.zip", { type: "application/zip" }))
    expect(files.map((item) => item.name).sort()).toEqual(["01.mp4", "manifest.json"])
  })

  it("the manifest of the instructions doc is valid and complete", () => {
    const doc = readFileSync("docs/INSTRUCCIONES_ZIP_VIDEOS.md", "utf8")
    const json = doc.split("## manifest.json")[1]?.split("```json")[1]?.split("```")[0] ?? ""
    const manifest = parseBulkManifest(json)!
    expect(manifest.warnings).toEqual([])
    expect(manifest.byFile.size).toBe(28)
    for (const name of manifest.byFile.keys()) expect(doc).toContain(name)
  })
})
