import type { Metadata } from "next"
import { ChangelogContent } from "@/components/changelog/ChangelogContent"
import { BackButton } from "@/components/ui/BackButton"
import { CHANGELOG_RELEASES } from "@/lib/changelog"
import { buildPublicChangelog } from "@/lib/publicChangelog"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"

export const metadata: Metadata = {
  title: "Registro de cambios",
  description: "Historial público de versiones y novedades de Smash & Lob.",
}

export const dynamic = "force-dynamic"

export default async function ChangelogPage() {
  const authResult = await requireAuthenticatedAppUser()
  const detailed = authResult.ok && authResult.actor.user.isSuperuser
  const releases = detailed
    ? CHANGELOG_RELEASES
    : buildPublicChangelog(CHANGELOG_RELEASES)

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-neutral-500">Smash & Lob</p>
          {detailed ? (
            <span className="rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black uppercase tracking-[0.14em] text-white">
              Detalle superadmin
            </span>
          ) : (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.14em] text-neutral-600">
              Información pública
            </span>
          )}
        </div>
        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">
          Registro de cambios
        </h1>
      </header>

      <ChangelogContent releases={releases} detailed={detailed} />
    </div>
  )
}
