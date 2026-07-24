import { NextResponse } from "next/server"
import { recordApplicationAdminAudit } from "@/lib/serverApplicationAdminAudit"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const statuses = new Set(["new", "reviewing", "planned", "declined", "completed"])

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : ""
}

function mapSuggestion(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    submittedByEmail: String(item.submitted_by_email),
    submittedByName:
      typeof item.submitted_by_name === "string" ? item.submitted_by_name : null,
    category: String(item.category),
    title: String(item.title),
    details: String(item.details),
    appVersion: String(item.app_version),
    sourcePath: typeof item.source_path === "string" ? item.source_path : null,
    status: String(item.status),
    adminNote: typeof item.admin_note === "string" ? item.admin_note : "",
    reviewedAt: typeof item.reviewed_at === "string" ? item.reviewed_at : null,
    createdAt: String(item.created_at),
    updatedAt: String(item.updated_at),
  }
}

async function requireSuperuser() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) return authResult
  if (!authResult.actor.user.isSuperuser) {
    return { ok: false as const, status: 403, error: "forbidden" }
  }

  return authResult
}

export async function GET() {
  const authResult = await requireSuperuser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data, error } = await authResult.actor.supabase
    .from("application_suggestions")
    .select(
      "id,submitted_by_email,submitted_by_name,category,title,details,app_version,source_path,status,admin_note,reviewed_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: "application_suggestions_lookup_failed" }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(mapSuggestion) })
}

export async function PATCH(request: Request) {
  const authResult = await requireSuperuser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<{
    id?: unknown
    status?: unknown
    adminNote?: unknown
  }>(request)

  if (!body) {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 })
  }

  const id = validateUuid(body.id)
  const status = cleanText(body.status, 24)
  const adminNote = cleanText(body.adminNote, 1000)

  if (!id || !statuses.has(status)) {
    return NextResponse.json({ error: "invalid_suggestion_update" }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { data, error } = await authResult.actor.supabase
    .from("application_suggestions")
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_by_user_id: authResult.actor.user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select(
      "id,submitted_by_email,submitted_by_name,category,title,details,app_version,source_path,status,admin_note,reviewed_at,created_at,updated_at",
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "application_suggestion_update_failed" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "suggestion_not_found" }, { status: 404 })
  }

  await recordApplicationAdminAudit({
    supabase: authResult.actor.supabase,
    actor: authResult.actor.user,
    action: "application_suggestion_reviewed",
    targetEmail:
      typeof data.submitted_by_email === "string"
        ? data.submitted_by_email
        : null,
    metadata: {
      suggestionId: data.id,
      suggestionTitle: data.title,
      status: data.status,
    },
  })

  return NextResponse.json({ item: mapSuggestion(data) })
}
