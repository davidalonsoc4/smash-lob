import "server-only"

import type { ChangelogCategory, ChangelogRelease } from "@/lib/changelog"
import { getVersionBlock } from "@/lib/changelogGrouping"

const PUBLIC_NEW_COPY: Partial<
  Record<string, { title?: string; summary: string }>
> = {
  "v1.10.0": {
    summary:
      "La aplicación incorpora perfiles personalizados, temporadas con fecha de inicio y nuevas imágenes listas para compartir desde el Centro de Difusión.",
  },
}

const PUBLIC_COPY: Record<
  Exclude<ChangelogCategory, "new">,
  { title: string; summary: string; change: string }
> = {
  improvement: {
    title: "Mejoras generales de la aplicación",
    summary:
      "Esta versión mejora distintos aspectos de uso, presentación y funcionamiento.",
    change:
      "Se han realizado ajustes generales para ofrecer una experiencia más clara y fluida.",
  },
  fix: {
    title: "Correcciones y estabilidad",
    summary:
      "Esta versión corrige incidencias detectadas y refuerza el funcionamiento habitual.",
    change:
      "Se han corregido errores y aplicado ajustes de estabilidad.",
  },
  foundation: {
    title: "Mantenimiento y preparación interna",
    summary:
      "Esta versión incorpora mantenimiento interno para mantener la aplicación preparada y fiable.",
    change:
      "Se han actualizado controles internos, mantenimiento y tareas de preparación.",
  },
}

function toPublicRelease(release: ChangelogRelease): ChangelogRelease {
  const datedRelease = release.date ? { date: release.date } : {}

  if (release.category === "new") {
    const publicCopy = PUBLIC_NEW_COPY[release.version]
    return {
      version: release.version,
      ...datedRelease,
      category: release.category,
      title: publicCopy?.title ?? release.title,
      summary: publicCopy?.summary ?? release.summary,
      changes: [],
    }
  }

  const copy = PUBLIC_COPY[release.category]
  return {
    version: release.version,
    ...datedRelease,
    category: release.category,
    title: copy.title,
    summary: copy.summary,
    changes: [copy.change],
  }
}

function hasSamePublicCopy(
  first: ChangelogRelease,
  second: ChangelogRelease,
) {
  return (
    first.category === second.category &&
    first.title === second.title &&
    first.summary === second.summary &&
    first.changes.length === second.changes.length &&
    first.changes.every((change, index) => change === second.changes[index])
  )
}

function formatRange(oldest: string | undefined, latest: string | undefined) {
  if (!latest) return oldest
  if (!oldest || oldest === latest) return latest
  return `${oldest} – ${latest}`
}

export function buildPublicChangelog(
  releases: ChangelogRelease[],
): ChangelogRelease[] {
  const groups: Array<{
    latestSource: ChangelogRelease
    release: ChangelogRelease
  }> = []

  releases.forEach((sourceRelease) => {
    const publicRelease = toPublicRelease(sourceRelease)
    const previousGroup = groups.at(-1)
    const startsNewGroup =
      !previousGroup ||
      sourceRelease.category === "new" ||
      previousGroup.release.category === "new" ||
      getVersionBlock(sourceRelease.version) !==
        getVersionBlock(previousGroup.latestSource.version) ||
      !hasSamePublicCopy(publicRelease, previousGroup.release)

    if (startsNewGroup) {
      groups.push({
        latestSource: sourceRelease,
        release: publicRelease,
      })
      return
    }

    const dateRange = formatRange(
      sourceRelease.date,
      previousGroup.latestSource.date,
    )
    const groupedDates = dateRange
      ? {
          dateRange,
          ...(sourceRelease.date ? { firstDate: sourceRelease.date } : {}),
          ...(previousGroup.latestSource.date
            ? { latestDate: previousGroup.latestSource.date }
            : {}),
        }
      : {}

    previousGroup.release = {
      ...previousGroup.release,
      version:
        formatRange(
          sourceRelease.version,
          previousGroup.latestSource.version,
        ) ?? previousGroup.release.version,
      ...groupedDates,
    }
  })

  return groups.map(({ release }) => release)
}
