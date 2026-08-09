"use client"

import { MatchResultForm } from "@/components/match/MatchResultForm"
import type { PersonalMatchItem } from "@/lib/personalMatches"

export function PersonalMatchResultForm({
  match,
  mode,
  onSaved,
  onCancel,
}: {
  match: PersonalMatchItem
  mode: "create" | "edit"
  onSaved: (match: PersonalMatchItem) => void
  onCancel?: () => void
}) {
  async function persistResult(sets: { a: number; b: number }[]) {
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "result", sets }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem }
      if (!response.ok || !payload.item) return false
      onSaved(payload.item)
      return true
    } catch {
      return false
    }
  }

  return (
    <MatchResultForm
      matchId={match.id}
      initialSets={match.sets}
      mode={mode}
      requiresThreeSets={false}
      reportedByPlayerId={null}
      onCancel={onCancel}
      persistResult={persistResult}
      saveErrorMessage="No se ha podido guardar el resultado del amistoso."
    />
  )
}
