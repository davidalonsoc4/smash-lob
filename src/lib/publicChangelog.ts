import "server-only"

import type { ChangelogCategory, ChangelogRelease } from "@/lib/changelog"

const PUBLIC_COPY: Record<
  ChangelogCategory,
  { title: string; summary: string; change: string }
> = {
  new: {
    title: "Nuevas funciones y opciones",
    summary:
      "Esta versión incorpora nuevas posibilidades para seguir utilizando y gestionando la aplicación.",
    change:
      "Se han añadido o ampliado funciones disponibles para los usuarios.",
  },
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

export function buildPublicChangelog(
  releases: ChangelogRelease[],
): ChangelogRelease[] {
  return releases.map((release) => {
    const copy = PUBLIC_COPY[release.category]
    return {
      version: release.version,
      date: release.date,
      category: release.category,
      title: copy.title,
      summary: copy.summary,
      changes: [copy.change],
    }
  })
}
