"use client"

import { useEffect, useState } from "react"
import { FloatingSpectatorShareButton } from "@/components/spectator/FloatingSpectatorShareButton"

export function TournamentShareButton({ tournamentId, inline = false }: { tournamentId: string; inline?: boolean }) {
  const [loaded, setContext] = useState<{ id: string; name: string; canInvite: boolean } | null>(null)
  const context = loaded?.id === tournamentId ? loaded : null
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (!controller.signal.aborted && data?.tournament) setContext({ id: tournamentId, name: data.tournament.name, canInvite: data.access?.role === "creator" && data.tournament.status !== "finished" && Array.isArray(data.players) && data.players.some((player: { userId?: string | null; hasAccount?: boolean }) => !player.userId && !player.hasAccount) }) })
      .catch(() => {})
    return () => controller.abort()
  }, [tournamentId])
  async function generate() {
    const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/invite`, { method: "POST" })
    const data = await response.json().catch(() => null)
    return response.ok && typeof data?.url === "string" ? data.url : null
  }
  return <FloatingSpectatorShareButton leagueId={tournamentId} leagueName={context?.name ?? "Smash & Lob"} tournamentId={tournamentId} tournamentName={context?.name} inline={inline} canShareLeague={Boolean(context?.canInvite)} onGeneratePlayerInvite={context?.canInvite ? generate : undefined} />
}
