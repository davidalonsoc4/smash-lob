import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createSupabaseServiceClient } from "@/lib/supabaseServer"

export const runtime = "nodejs"

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

export async function POST(request: Request) {
  const session = await auth()
  const email = normalizeEmail(session?.user?.email)
  const body = (await request.json().catch(() => null)) as {
    endpoint?: string
  } | null
  const endpoint = body?.endpoint?.trim() ?? ""

  if (!email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!endpoint) {
    return NextResponse.json({ ok: true })
  }

  const supabase = createSupabaseServiceClient()

  if (!supabase) {
    return NextResponse.json({ error: "missing_service_role" }, { status: 501 })
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("endpoint", endpoint)
    .eq("user_email", email)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
