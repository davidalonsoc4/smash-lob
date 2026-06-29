"use client"

import { useParams } from "next/navigation"
import { InviteFlow } from "@/components/invite/InviteFlow"

export default function InvitePage() {
  const params = useParams<{ code: string }>()

  return <InviteFlow code={decodeURIComponent(params.code)} />
}
