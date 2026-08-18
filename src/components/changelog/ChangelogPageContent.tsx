"use client"

import type { ChangelogRelease } from "@/lib/changelog"
import { ChangelogContent } from "@/components/changelog/ChangelogContent"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"

export function ChangelogPageContent({
  publicReleases,
  detailedReleases,
}: {
  publicReleases: ChangelogRelease[]
  detailedReleases: ChangelogRelease[] | null
}) {
  const { isAdminViewEnabled } = useLeagueAccess()
  const detailed = Boolean(detailedReleases && isAdminViewEnabled)
  const releases = detailed ? detailedReleases ?? publicReleases : publicReleases

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label="Volver" />
        <h1 className="type-page-title font-black tracking-tight">
          Registro de cambios
        </h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-neutral-500">Smash & Lob</p>
          {detailed ? (
            <span className="rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black uppercase tracking-[0.14em] text-white">
              Detalle administrador
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.14em] text-neutral-600">
              Información pública
            </span>
          )}
        </div>
      </header>

      <ChangelogContent releases={releases} detailed={detailed} />
    </div>
  )
}
