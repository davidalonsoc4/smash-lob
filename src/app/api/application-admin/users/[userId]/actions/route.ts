import { NextResponse } from "next/server"
import { recordApplicationAdminAudit } from "@/lib/serverApplicationAdminAudit"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UserAction =
  | "suspend"
  | "reactivate"
  | "reset_profile"
  | "reset_availability"
  | "revoke_push"
  | "reset_notifications"

type UserActionBody = {
  action?: unknown
  reason?: unknown
}

function normalizeAction(value: unknown): UserAction | null {
  return value === "suspend" ||
    value === "reactivate" ||
    value === "reset_profile" ||
    value === "reset_availability" ||
    value === "revoke_push" ||
    value === "reset_notifications"
    ? value
    : null
}

function normalizeReason(value: unknown) {
  if (typeof value !== "string") return null
  const reason = value.trim().replace(/\s+/g, " ")
  return reason ? reason.slice(0, 240) : null
}

async function requireSuperuser() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) return authResult
  if (!authResult.actor.user.isSuperuser) {
    return { ok: false as const, status: 403, error: "forbidden" }
  }

  return authResult
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const authResult = await requireSuperuser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  if (!validateUuid(userId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 400 })
  }

  const body = await parseJsonBody<UserActionBody>(request)
  const action = normalizeAction(body?.action)

  if (!action) {
    return NextResponse.json({ error: "invalid_user_action" }, { status: 400 })
  }

  const { supabase, user: actor } = authResult.actor
  const { data: targetUser, error: targetError } = await supabase
    .from("app_users")
    .select(
      "id,email,is_superuser,suspended_at,suspension_reason,profile_completed_at,availability_completed_at",
    )
    .eq("id", userId)
    .maybeSingle()

  if (targetError || !targetUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 })
  }

  if (action === "suspend") {
    if (userId === actor.id) {
      return NextResponse.json({ error: "cannot_suspend_self" }, { status: 409 })
    }
    if (targetUser.is_superuser) {
      return NextResponse.json({ error: "protected_superuser" }, { status: 409 })
    }

    const reason = normalizeReason(body?.reason)
    const suspendedAt = new Date().toISOString()
    const { error } = await supabase
      .from("app_users")
      .update({ suspended_at: suspendedAt, suspension_reason: reason })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "user_suspension_failed" }, { status: 500 })
    }

    await recordApplicationAdminAudit({
      supabase,
      actor,
      action: "user_suspended",
      targetUserId: userId,
      targetEmail: targetUser.email,
      metadata: { reason },
    })

    return NextResponse.json({ ok: true, suspendedAt, suspensionReason: reason })
  }

  if (action === "reactivate") {
    const { error } = await supabase
      .from("app_users")
      .update({ suspended_at: null, suspension_reason: null })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "user_reactivation_failed" }, { status: 500 })
    }

    await recordApplicationAdminAudit({
      supabase,
      actor,
      action: "user_reactivated",
      targetUserId: userId,
      targetEmail: targetUser.email,
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "reset_profile") {
    const { error } = await supabase
      .from("app_users")
      .update({ profile_completed_at: null })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "profile_reset_failed" }, { status: 500 })
    }

    await recordApplicationAdminAudit({
      supabase,
      actor,
      action: "profile_onboarding_reset",
      targetUserId: userId,
      targetEmail: targetUser.email,
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "reset_availability") {
    const { error } = await supabase
      .from("app_users")
      .update({
        availability_completed_at: null,
        standard_availability_weekly_slots: {},
      })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: "availability_reset_failed" }, { status: 500 })
    }

    await recordApplicationAdminAudit({
      supabase,
      actor,
      action: "standard_availability_reset",
      targetUserId: userId,
      targetEmail: targetUser.email,
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "revoke_push") {
    const { count, error } = await supabase
      .from("push_subscriptions")
      .delete({ count: "exact" })
      .eq("user_email", targetUser.email)

    if (error) {
      return NextResponse.json({ error: "push_revoke_failed" }, { status: 500 })
    }

    await recordApplicationAdminAudit({
      supabase,
      actor,
      action: "push_devices_revoked",
      targetUserId: userId,
      targetEmail: targetUser.email,
      metadata: { revokedCount: count ?? 0 },
    })

    return NextResponse.json({ ok: true, affectedCount: count ?? 0 })
  }

  const { count, error } = await supabase
    .from("notification_preferences")
    .delete({ count: "exact" })
    .eq("user_email", targetUser.email)

  if (error) {
    return NextResponse.json({ error: "notification_reset_failed" }, { status: 500 })
  }

  await recordApplicationAdminAudit({
    supabase,
    actor,
    action: "notification_preferences_reset",
    targetUserId: userId,
    targetEmail: targetUser.email,
    metadata: { resetCount: count ?? 0 },
  })

  return NextResponse.json({ ok: true, affectedCount: count ?? 0 })
}
