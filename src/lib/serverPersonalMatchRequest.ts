import "server-only"

import type { PersonalMatchParticipantDraft } from "@/lib/personalMatches"
import { normalizeBoundedText } from "@/lib/serverRequest"

export function normalizePersonalMatchParticipantDrafts(
  value: unknown,
): PersonalMatchParticipantDraft[] | null {
  if (!Array.isArray(value) || value.length !== 4) return null

  const participants = value.map((item) => {
    if (!item || typeof item !== "object") return null
    const candidate = item as Record<string, unknown>
    const team = Number(candidate.team)
    const slot = Number(candidate.slot)
    const personKey =
      typeof candidate.personKey === "string" && candidate.personKey.trim()
        ? candidate.personKey.trim().slice(0, 80)
        : null
    const displayName = normalizeBoundedText(candidate.displayName, 60)

    if ((team !== 1 && team !== 2) || (slot !== 1 && slot !== 2)) return null
    if (!personKey && displayName.length < 2) return null

    return {
      team: team as 1 | 2,
      slot: slot as 1 | 2,
      personKey,
      displayName,
    }
  })

  if (
    !participants.every(
      (participant): participant is PersonalMatchParticipantDraft => Boolean(participant),
    )
  ) {
    return null
  }

  const slots = new Set(
    participants.map((participant) => `${participant.team}:${participant.slot}`),
  )
  return slots.size === 4 ? participants : null
}
