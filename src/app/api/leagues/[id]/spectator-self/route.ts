import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  const { id: leagueId } = await params
  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (userError || !user) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase
    .from("league_spectators")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
