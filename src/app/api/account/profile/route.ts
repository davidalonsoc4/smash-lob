import { NextResponse } from "next/server"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { parseJsonBody } from "@/lib/serverRequest"
import { normalizeProfileName } from "@/lib/accountProfile"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type ProfileBody = {
  firstName?: unknown
  lastName?: unknown
}

function mapProfile(user: {
  firstName: string | null
  lastName: string | null
  displayName: string | null
  profileCompletedAt: string | null
  isSuperuser: boolean
}) {
  const firstName = user.firstName ?? ""
  const lastName = user.lastName ?? ""

  return {
    firstName,
    lastName,
    displayName: user.displayName ?? [firstName, lastName].filter(Boolean).join(" "),
    profileCompletedAt: user.profileCompletedAt,
    isComplete: Boolean(user.profileCompletedAt && firstName && lastName),
    isSuperuser: user.isSuperuser,
  }
}

export async function GET() {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  return NextResponse.json({ profile: mapProfile(authResult.actor.user) })
}

export async function PUT(request: Request) {
  const authResult = await requireAuthenticatedAppUser()

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await parseJsonBody<ProfileBody>(request)
  const firstName = normalizeProfileName(body?.firstName, 40)
  const lastName = normalizeProfileName(body?.lastName, 60)

  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json({ error: "invalid_profile_name" }, { status: 400 })
  }

  const { data, error } = await authResult.actor.supabase.rpc(
    "server_update_user_profile",
    {
      p_user_id: authResult.actor.user.id,
      p_first_name: firstName,
      p_last_name: lastName,
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
  }

  return NextResponse.json({
    profile: {
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: row.display_name,
      profileCompletedAt: row.profile_completed_at,
      isComplete: true,
      isSuperuser: authResult.actor.user.isSuperuser,
    },
  })
}
