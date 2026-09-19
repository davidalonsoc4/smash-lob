import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  const body = await parseJsonBody<{ confirmation?: unknown }>(request)
  if (body?.confirmation !== "ELIMINAR MI CUENTA") {
    return NextResponse.json({ error: "confirmation_required" }, { status: 400 })
  }

  const { supabase, user } = authResult.actor
  await Promise.all([
    supabase.from("push_subscriptions").delete().eq("user_id", user.id),
    supabase.from("notification_preferences").delete().eq("user_id", user.id),
    supabase.from("notification_reads").delete().eq("user_id", user.id),
  ])
  const anonymizedEmail = `deleted-${user.id}@invalid.smashandlob.local`
  const { error } = await supabase.from("app_users").update({
    email: anonymizedEmail,
    display_name: "Usuario eliminado",
    first_name: "Usuario",
    last_name: "eliminado",
    avatar_url: null,
    profile_completed_at: null,
    availability_completed_at: null,
    standard_availability_weekly_slots: {},
    can_create_leagues: false,
  }).eq("id", user.id)
  if (error) return NextResponse.json({ error: "account_delete_failed" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
