"use client"

import { useMemo, useState } from "react"
import {
  PersonalMatchParticipantSelector,
  type EditablePersonalMatchParticipant,
} from "@/components/personal/PersonalMatchParticipantSelector"
import { AppCard } from "@/components/ui/AppCard"
import {
  sortPersonalMatchParticipants,
  type PersonalMatchItem,
  type PersonalMatchPerson,
} from "@/lib/personalMatches"

function participantLabel(team: number, slot: number, isCurrentUser: boolean) {
  if (isCurrentUser) return "Tú"
  if (team === 1) return slot === 1 ? "Pareja A · J1" : "Tu pareja"
  return slot === 1 ? "Rival 1" : "Rival 2"
}

function editableParticipants(match: PersonalMatchItem): EditablePersonalMatchParticipant[] {
  return sortPersonalMatchParticipants(match.participants).map((participant) => ({
    team: participant.team,
    slot: participant.slot,
    personKey:
      participant.personKey && !participant.personKey.startsWith("external:")
        ? participant.personKey
        : null,
    displayName: participant.displayName,
    label: participantLabel(participant.team, participant.slot, participant.isCurrentUser),
  }))
}

export function PersonalMatchParticipantsPanel({
  match,
  onUpdated,
}: {
  match: PersonalMatchItem
  onUpdated: (match: PersonalMatchItem) => void
}) {
  const [editing, setEditing] = useState(false)
  const [people, setPeople] = useState<PersonalMatchPerson[]>([])
  const [participants, setParticipants] = useState<EditablePersonalMatchParticipant[]>(() =>
    editableParticipants(match),
  )
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usedKeys = useMemo(
    () =>
      new Set(
        participants.flatMap((participant) =>
          participant.personKey ? [participant.personKey] : [],
        ),
      ),
    [participants],
  )
  const participantsComplete = participants.every(
    (participant) =>
      Boolean(participant.personKey) || participant.displayName.trim().length >= 2,
  )

  function resetFromMatch() {
    setParticipants(editableParticipants(match))
    setError(null)
  }

  async function openEditor() {
    resetFromMatch()
    setEditing(true)
    if (people.length > 0 || loadingPeople) return

    setLoadingPeople(true)
    try {
      const response = await fetch("/api/personal-matches/people", { cache: "no-store" })
      const payload = (await response.json()) as { people?: PersonalMatchPerson[] }
      if (!response.ok) throw new Error("personal_match_people_lookup_failed")
      setPeople(payload.people ?? [])
    } catch {
      setError("No se han podido cargar los jugadores disponibles.")
    } finally {
      setLoadingPeople(false)
    }
  }

  async function saveParticipants() {
    if (!match.canManage || match.status !== "scheduled" || saving || !participantsComplete) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "participants",
          participants: participants.map(({ team, slot, personKey, displayName }) => ({
            team,
            slot,
            personKey,
            displayName,
          })),
        }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem; error?: string }
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "personal_match_participants_update_failed")
      }

      onUpdated(payload.item)
      setParticipants(editableParticipants(payload.item))
      setEditing(false)
    } catch {
      setError("No se han podido guardar la pareja y los rivales.")
    } finally {
      setSaving(false)
    }
  }

  if (!match.canManage || match.status !== "scheduled") return null

  return (
    <AppCard accentStrip className="overflow-hidden !p-0">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="min-w-0">
          <p className="type-panel-title text-neutral-950">Jugadores del amistoso</p>
          <p className="mt-0.5 type-caption font-semibold text-neutral-500">
            Cambia tu pareja o los contrincantes antes de registrar el resultado.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => void openEditor()}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-2.5 py-1 type-caption font-black text-neutral-700"
          >
            Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-2.5 px-3 pb-3">
          {participants.map((participant, index) => {
            const original = sortPersonalMatchParticipants(match.participants)[index]
            return (
              <PersonalMatchParticipantSelector
                key={`${participant.team}-${participant.slot}`}
                participant={participant}
                people={people}
                usedKeys={usedKeys}
                locked={Boolean(original?.isCurrentUser)}
                onChange={(next) =>
                  setParticipants((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? next : item)),
                  )
                }
              />
            )
          })}

          {loadingPeople ? (
            <p className="type-caption font-semibold text-neutral-400">
              Cargando jugadores compartidos...
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetFromMatch()
                setEditing(false)
              }}
              disabled={saving}
              className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs font-black text-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void saveParticipants()}
              disabled={saving || loadingPeople || !participantsComplete}
              className="flex-1 rounded-lg bg-neutral-950 px-2.5 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {saving ? "Guardando..." : "Guardar jugadores"}
            </button>
          </div>
        </div>
      ) : null}
    </AppCard>
  )
}
