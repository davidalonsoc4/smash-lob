import type { Metadata } from "next"
import { ChangelogPageContent } from "@/components/changelog/ChangelogPageContent"
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
  let canViewDetailed = false

  if (authResult.ok) {
    if (authResult.actor.user.isSuperuser) {
      canViewDetailed = true
    } else {
      const { data: adminMemberships } = await authResult.actor.supabase
        .from("league_memberships")
        .select("league_id")
        .eq("user_id", authResult.actor.user.id)
        .in("role", ["creator", "admin"])
        .limit(1)

      canViewDetailed = Boolean(adminMemberships?.length)
    }
  }

  return (
    <ChangelogPageContent
      publicReleases={buildPublicChangelog(CHANGELOG_RELEASES)}
      detailedReleases={canViewDetailed ? CHANGELOG_RELEASES : null}
    />
  )
}
