"use client"

import { useParams, useSearchParams } from "next/navigation"
import { InviteFlow } from "@/components/invite/InviteFlow"

export default function InvitePage() {
  const params = useParams<{ code: string }>()
  const searchParams = useSearchParams()
  const leagueIdHint = searchParams.get("leagueId")

  return (
    <InviteFlow
      code={decodeURIComponent(params.code)}
      leagueIdHint={leagueIdHint}
    />
  )
}
