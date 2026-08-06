import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"
import {
  isValidAccountAvatarUrl,
  normalizeStoredImageUrl,
} from "@/lib/serverImageValidation"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"
import {
  normalizeAccountStandardAvailability,
  normalizeProfileName,
} from "@/lib/accountProfile"
import {
  countWeeklyAvailabilitySlots,
  normalizeWeeklyAvailability,
} from "@/lib/playerAvailability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ProfileBody = {
  firstName?: unknown
  lastName?: unknown
  timezone?: unknown
  weeklySlots?: unknown
  avatarUrl?: unknown
}

function normalizeTimezone(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const timezone = value.trim()

  return timezone && timezone.length <= 100 ? timezone : null
}

function mapProfile(user: {
  firstName: string | null
  lastName: string | null
  displayName: string | null
  profileCompletedAt: string | null
  availabilityCompletedAt: string | null
  standardAvailabilityTimezone: string
  standardAvailabilityWeeklySlots: unknown
  avatarUrl: string | null
  isSuperuser: boolean
}) {
  const firstName = user.firstName ?? ""
  const lastName = user.lastName ?? ""
  const standardAvailabilityWeeklySlots =
    normalizeAccountStandardAvailability(user.standardAvailabilityWeeklySlots)

  return {
    firstName,
    lastName,
    displayName:
      user.displayName ?? [firstName, lastName].filter(Boolean).join(" "),
    avatarUrl: normalizeStoredImageUrl(user.avatarUrl) ?? null,
    profileCompletedAt: user.profileCompletedAt,
    availabilityCompletedAt: user.availabilityCompletedAt,
    standardAvailabilityTimezone:
      user.standardAvailabilityTimezone || "Europe/Madrid",
    standardAvailabilityWeeklySlots,
    isComplete: Boolean(
      user.profileCompletedAt &&
        user.availabilityCompletedAt &&
        firstName &&
        lastName,
    ),
    isSuperuser: user.isSuperuser,
  }
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  return NextResponse.json({ profile: mapProfile(authResult.actor.user) })
}

export async function PUT(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  const body = await parseJsonBody<ProfileBody>(request)
  const firstName = normalizeProfileName(body?.firstName, 40)
  const lastName = normalizeProfileName(body?.lastName, 60)

  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "invalid_profile_name" }, { status: 400 })
  }

  const hasAvailabilityPayload = typeof body?.weeklySlots !== "undefined"
  const weeklySlots = hasAvailabilityPayload
    ? normalizeWeeklyAvailability(body?.weeklySlots)
    : authResult.actor.user.standardAvailabilityWeeklySlots
  const timezone = hasAvailabilityPayload
    ? normalizeTimezone(body?.timezone)
    : authResult.actor.user.standardAvailabilityTimezone

  if (
    !timezone ||
    (!authResult.actor.user.availabilityCompletedAt &&
      countWeeklyAvailabilitySlots(weeklySlots) === 0)
  ) {
    return NextResponse.json(
      { error: "invalid_standard_availability" },
      { status: 400 },
    )
  }

  const { data, error } = await authResult.actor.supabase.rpc(
    "server_update_user_profile",
    {
      p_user_id: authResult.actor.user.id,
      p_first_name: firstName,
      p_last_name: lastName,
      p_timezone: timezone,
      p_weekly_slots: weeklySlots,
    },
  )

  if (error || !Array.isArray(data) || !data[0]) {
    return NextResponse.json({ error: "profile_update_failed" }, { status: 500 })
  }

  const row = data[0] as {
    first_name: string
    last_name: string
    display_name: string
    profile_completed_at: string
    availability_completed_at: string
    standard_availability_timezone: string
    standard_availability_weekly_slots: unknown
  }

  return NextResponse.json({
    profile: {
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: row.display_name,
      profileCompletedAt: row.profile_completed_at,
      availabilityCompletedAt: row.availability_completed_at,
      standardAvailabilityTimezone:
        row.standard_availability_timezone || "Europe/Madrid",
      standardAvailabilityWeeklySlots: normalizeAccountStandardAvailability(
        row.standard_availability_weekly_slots,
      ),
      isComplete: true,
      avatarUrl: authResult.actor.user.avatarUrl,
      isSuperuser: authResult.actor.user.isSuperuser,
    },
  })
}

export async function PATCH(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "account_avatar_update",
    limit: 10,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status },
    )
  }

  const body = await parseJsonBody<ProfileBody>(request)
  const rawAvatarUrl = body?.avatarUrl

  if (rawAvatarUrl !== null && typeof rawAvatarUrl !== "string") {
    return NextResponse.json({ error: "invalid_avatar_url" }, { status: 400 })
  }

  if (!isValidAccountAvatarUrl(rawAvatarUrl)) {
    return NextResponse.json({ error: "invalid_avatar_url" }, { status: 400 })
  }

  const avatarUrl = normalizeStoredImageUrl(rawAvatarUrl)
  const { data: updatedUser, error } = await authResult.actor.supabase
    .from("app_users")
    .update({ avatar_url: avatarUrl })
    .eq("id", authResult.actor.user.id)
    .select("avatar_url")
    .single()

  if (error || !updatedUser) {
    return NextResponse.json(
      { error: "profile_avatar_update_failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    profile: mapProfile({
      ...authResult.actor.user,
      avatarUrl: normalizeStoredImageUrl(updatedUser.avatar_url) ?? null,
    }),
  })
}
