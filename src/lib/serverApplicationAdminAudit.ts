import "server-only"

import type { AuthenticatedAppUser } from "@/lib/serverAuth"

type ServiceClient = AuthenticatedAppUser["supabase"]

type RecordApplicationAdminAuditInput = {
  supabase: ServiceClient
  actor: AuthenticatedAppUser["user"]
  action: string
  targetUserId?: string | null
  targetEmail?: string | null
  leagueId?: string | null
  metadata?: Record<string, unknown>
}

export async function recordApplicationAdminAudit({
  supabase,
  actor,
  action,
  targetUserId = null,
  targetEmail = null,
  leagueId = null,
  metadata = {},
}: RecordApplicationAdminAuditInput) {
  const { error } = await supabase.from("application_admin_audit_log").insert({
    actor_user_id: actor.id,
    actor_email: actor.email,
    target_user_id: targetUserId,
    target_email: targetEmail,
    league_id: leagueId,
    action,
    metadata,
  })

  if (error) {
    console.error("application-admin-audit-write-failed")
    return false
  }

  return true
}
