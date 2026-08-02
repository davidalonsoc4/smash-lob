import type { Metadata } from "next"
import { BackButton } from "@/components/ui/BackButton"
import {
  CHANGELOG_RELEASES,
  type ChangelogCategory,
  type ChangelogRelease,
} from "@/lib/changelog"

export const metadata: Metadata = {
  title: "Registro de cambios",
  description: "Historial público de versiones y novedades de Smash & Lob.",
}

const categoryCopy: Record<
  ChangelogCategory,
  { label: string; className: string }
> = {
  new: {
    label: "Novedad",
    className: "bg-neutral-950 text-white",
  },
  improvement: {
    label: "Mejora",
    className: "bg-neutral-200 text-neutral-700",
  },
  fix: {
    label: "Corrección",
    className: "border border-neutral-300 bg-white text-neutral-600",
  },
  foundation: {
    label: "Base",
    className: "bg-neutral-100 text-neutral-500",
  },
}

type ChangelogBlock = {
  version: string
  releases: ChangelogRelease[]
  firstDate?: string
  latestDate?: string
  changeCount: number
}

function getVersionBlock(version: string) {
  const match = version.match(/^v?(\d+)\.(\d+)/)
  return match ? `v${match[1]}.${match[2]}` : version
}

function groupReleasesByVersionBlock(releases: ChangelogRelease[]) {
  const grouped = new Map<string, ChangelogRelease[]>()

  releases.forEach((release) => {
    const version = getVersionBlock(release.version)
    const currentReleases = grouped.get(version) ?? []
    currentReleases.push(release)
    grouped.set(version, currentReleases)
  })

  return Array.from(grouped.entries()).map<ChangelogBlock>(([version, blockReleases]) => ({
    version,
    releases: blockReleases,
    firstDate: blockReleases.at(-1)?.date,
    latestDate: blockReleases[0]?.date,
    changeCount: blockReleases.reduce(
      (total, release) => total + release.changes.length,
      0,
    ),
  }))
}

function getDateRange(block: ChangelogBlock) {
  if (!block.latestDate) {
    return null
  }

  if (!block.firstDate || block.firstDate === block.latestDate) {
    return block.latestDate
  }

  return `${block.firstDate} – ${block.latestDate}`
}

export default function ChangelogPage() {
  const blocks = groupReleasesByVersionBlock(CHANGELOG_RELEASES)

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="text-sm font-medium text-neutral-500">Smash & Lob</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Registro de cambios
        </h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Las actualizaciones se agrupan por cada serie principal para consultar
          el histórico sin un panel distinto por cada pequeño ajuste.
        </p>
      </header>

      <div className="space-y-2">
        {blocks.map((block, blockIndex) => {
          const dateRange = getDateRange(block)

          return (
            <details
              key={block.version}
              open={blockIndex === 0}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.045)]"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-neutral-950">
                      {block.version}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-neutral-600">
                      {block.releases.length} versiones
                    </span>
                    {blockIndex === 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                        Actual
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-base font-black tracking-tight text-neutral-950">
                    Serie {block.version}
                  </p>
                  {dateRange ? (
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                      {dateRange}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                    {block.changeCount} cambios documentados en un único bloque.
                    Abre la serie para consultar cada versión y su detalle.
                  </p>
                </div>

                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black text-neutral-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="space-y-3 border-t border-neutral-100 px-3 pb-3 pt-3">
                {block.releases.map((release, releaseIndex) => {
                  const category = categoryCopy[release.category]

                  return (
                    <section
                      key={release.version}
                      className={
                        releaseIndex === 0
                          ? ""
                          : "border-t border-neutral-100 pt-3"
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-neutral-950">
                          {release.version}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${category.className}`}
                        >
                          {category.label}
                        </span>
                        {release.date ? (
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                            {release.date}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm font-black tracking-tight text-neutral-950">
                        {release.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                        {release.summary}
                      </p>

                      <ul className="mt-2 space-y-2">
                        {release.changes.map((change) => (
                          <li
                            key={change}
                            className="flex gap-2 text-xs font-semibold leading-5 text-neutral-600"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400"
                            />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )
                })}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}
