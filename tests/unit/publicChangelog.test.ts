import { describe, expect, it } from "vitest"
import type { ChangelogCategory, ChangelogRelease } from "@/lib/changelog"
import { buildPublicChangelog } from "@/lib/publicChangelog"

function release(
  version: string,
  date: string | undefined,
  category: ChangelogCategory,
  title = version,
  summary = `Resumen ${version}`,
): ChangelogRelease {
  return {
    version,
    date,
    category,
    title,
    summary,
    changes: [`Detalle ${version}`],
  }
}

describe("public changelog", () => {
  it("collapses consecutive generic releases into version and date ranges", () => {
    const publicReleases = buildPublicChangelog([
      release("v1.10.8", "17 de agosto de 2026", "improvement"),
      release("v1.10.7", "17 de agosto de 2026", "improvement"),
      release("v1.10.6", "17 de agosto de 2026", "improvement"),
      release("v1.10.5", "16 de agosto de 2026", "improvement"),
      release("v1.10.4", "16 de agosto de 2026", "fix"),
      release("v1.10.3", "15 de agosto de 2026", "fix"),
    ])

    expect(publicReleases).toHaveLength(2)
    expect(publicReleases[0]).toMatchObject({
      version: "v1.10.5 – v1.10.8",
      date: "17 de agosto de 2026",
      dateRange: "16 de agosto de 2026 – 17 de agosto de 2026",
      firstDate: "16 de agosto de 2026",
      latestDate: "17 de agosto de 2026",
      title: "Mejoras generales de la aplicación",
      category: "improvement",
    })
    expect(publicReleases[1]).toMatchObject({
      version: "v1.10.3 – v1.10.4",
      date: "16 de agosto de 2026",
      dateRange: "15 de agosto de 2026 – 16 de agosto de 2026",
      firstDate: "15 de agosto de 2026",
      latestDate: "16 de agosto de 2026",
      title: "Correcciones y estabilidad",
      category: "fix",
    })
  })

  it("keeps every novelty concrete and separate", () => {
    const publicReleases = buildPublicChangelog([
      release(
        "v1.9.0",
        "16 de agosto de 2026",
        "new",
        "Centro de Difusión",
        "Crea piezas listas para compartir.",
      ),
      release(
        "v1.8.0",
        "15 de agosto de 2026",
        "new",
        "Resumen de Jornada",
        "Comparte resultados y destacados.",
      ),
    ])

    expect(publicReleases).toEqual([
      {
        version: "v1.9.0",
        date: "16 de agosto de 2026",
        category: "new",
        title: "Centro de Difusión",
        summary: "Crea piezas listas para compartir.",
        changes: [],
      },
      {
        version: "v1.8.0",
        date: "15 de agosto de 2026",
        category: "new",
        title: "Resumen de Jornada",
        summary: "Comparte resultados y destacados.",
        changes: [],
      },
    ])
  })

  it("never groups equivalent copy across minor version series", () => {
    const publicReleases = buildPublicChangelog([
      release("v1.10.1", "17 de agosto de 2026", "improvement"),
      release("v1.9.9", "16 de agosto de 2026", "improvement"),
    ])

    expect(publicReleases.map(({ version }) => version)).toEqual([
      "v1.10.1",
      "v1.9.9",
    ])
  })

  it("omits empty date metadata from undated public releases", () => {
    const publicReleases = buildPublicChangelog([
      release("v0.9.15", undefined, "improvement"),
      release("v0.9.14", undefined, "improvement"),
    ])

    expect(publicReleases).toEqual([
      {
        version: "v0.9.14 – v0.9.15",
        category: "improvement",
        title: "Mejoras generales de la aplicación",
        summary:
          "Esta versión mejora distintos aspectos de uso, presentación y funcionamiento.",
        changes: [
          "Se han realizado ajustes generales para ofrecer una experiencia más clara y fluida.",
        ],
      },
    ])
  })

  it("uses curated, user-facing copy for technical novelty summaries", () => {
    const [publicRelease] = buildPublicChangelog([
      release(
        "v1.10.0",
        "16 de agosto de 2026",
        "new",
        "Perfiles, temporadas programadas y Centro de Difusión",
        "Resumen con overrides competitivos y activación server-side.",
      ),
    ])

    expect(publicRelease.summary).toBe(
      "La aplicación incorpora perfiles personalizados, temporadas con fecha de inicio y nuevas imágenes listas para compartir desde el Centro de Difusión.",
    )
    expect(publicRelease.summary).not.toMatch(/overrides|server-side/i)
  })
})
