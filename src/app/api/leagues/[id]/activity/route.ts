import { NextResponse } from "next/server"
import { getServerLeagueViewer } from "@/lib/serverLeagueAccess"
import { fetchServerActivityEvents } from "@/lib/serverActivity"
import { validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseLimit(value: string | null) {
  if (!value) {
    return 50
  }

  const limit = Number(value)

  if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
    return null
  }

  return limit
}

function parseOptionalCreatedAtFrom(value: string | null) {
  if (!value) {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : null
}

function parseClampFlag(value: string | null) {
  return value === "1" || value === "true"
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params

  if (!validateUuid(leagueId)) {
    return NextResponse.json({ error: "invalid_league_id" }, { status: 400 })
  }

  const access = await getServerLeagueViewer(leagueId, {
    requireAccess: true,
  })

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const url = new URL(request.url)
  const limit = parseLimit(url.searchParams.get("limit"))

  if (limit === null) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    return NextResponse.json({
      items: await fetchServerActivityEvents({
        viewer: access.actor,
        leagueId,
        limit,
        createdAtFrom: parseOptionalCreatedAtFrom(
          url.searchParams.get("createdAtFrom")
        ),
        clampToViewerJoinDate: parseClampFlag(
          url.searchParams.get("clampToViewerJoinDate")
        ),
      }),
    })
  } catch {
    return NextResponse.json(
      { error: "activity_lookup_failed" },
      { status: 500 }
    )
  }
}
