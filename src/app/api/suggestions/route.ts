import { NextResponse } from "next/server"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const categories = new Set(["improvement", "feature", "usability", "other"])

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : ""
}

function normalizeSourcePath(value: unknown) {
  const path = cleanText(value, 200)
  return path.startsWith("/") ? path : null
}

function mapSuggestion(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    category: String(item.category),
    title: String(item.title),
    details: String(item.details),
    status: String(item.status),
    createdAt: String(item.created_at),
  }
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data, error } = await authResult.actor.supabase
    .from("application_suggestions")
    .select("id,category,title,details,status,created_at")
    .eq("submitted_by_user_id", authResult.actor.user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: "suggestions_lookup_failed" }, { status: 500 })
  }

  return NextResponse.json({ items: (data ?? []).map(mapSuggestion) })
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<{
    category?: unknown
    title?: unknown
    details?: unknown
    sourcePath?: unknown
  }>(request)

  if (!body) {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 })
  }

  const category = cleanText(body.category, 24)
  const title = cleanText(body.title, 120)
  const details = cleanText(body.details, 2000)

  if (!categories.has(category)) {
    return NextResponse.json({ error: "invalid_suggestion_category" }, { status: 400 })
  }

  if (title.length < 5) {
    return NextResponse.json({ error: "suggestion_title_too_short" }, { status: 400 })
  }

  if (details.length < 10) {
    return NextResponse.json({ error: "suggestion_details_too_short" }, { status: 400 })
  }

  const { data: latestSuggestion, error: latestSuggestionError } =
    await authResult.actor.supabase
      .from("application_suggestions")
      .select("created_at")
      .eq("submitted_by_user_id", authResult.actor.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (latestSuggestionError) {
    return NextResponse.json({ error: "suggestion_rate_lookup_failed" }, { status: 500 })
  }

  if (latestSuggestion?.created_at) {
    const elapsed = Date.now() - new Date(latestSuggestion.created_at).getTime()
    if (Number.isFinite(elapsed) && elapsed < 20_000) {
      return NextResponse.json({ error: "suggestion_rate_limited" }, { status: 429 })
    }
  }

  const { data, error } = await authResult.actor.supabase
    .from("application_suggestions")
    .insert({
      submitted_by_user_id: authResult.actor.user.id,
      submitted_by_email: authResult.actor.user.email,
      submitted_by_name: authResult.actor.user.displayName,
      category,
      title,
      details,
      app_version: APP_VERSION_LABEL,
      source_path: normalizeSourcePath(body.sourcePath),
    })
    .select("id,category,title,details,status,created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: "suggestion_create_failed" }, { status: 500 })
  }

  return NextResponse.json({ item: mapSuggestion(data) }, { status: 201 })
}
