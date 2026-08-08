"use client"

import { useState } from "react"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import { AppCard } from "@/components/ui/AppCard"
import { getScheduleLocationMapsUrl } from "@/lib/leagueLocations"
import { formatScheduleForDateTimeInput } from "@/lib/matchScheduleTime"
import {
  formatPersonalMatchDateTime,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export function PersonalMatchSchedulePanel({
  match,
  onUpdated,
}: {
  match: PersonalMatchItem
  onUpdated: (match: PersonalMatchItem) => void
}) {
  const [editing, setEditing] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(
    formatScheduleForDateTimeInput(match.scheduledAt),
  )
  const [locationName, setLocationName] = useState(match.locationName ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const directionsUrl = getScheduleLocationMapsUrl(match.locationName)

  async function saveSchedule() {
    if (!match.canManage || saving || !scheduledAt.trim()) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/personal-matches/${encodeURIComponent(match.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          scheduledAt: new Date(scheduledAt).toISOString(),
          locationName,
        }),
      })
      const payload = (await response.json()) as { item?: PersonalMatchItem; error?: string }
      if (!response.ok || !payload.item) {
        throw new Error(payload.error ?? "personal_match_update_failed")
      }
      onUpdated(payload.item)
      setEditing(false)
    } catch {
      setError("No se han podido guardar la fecha y la ubicación.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppCard accentStrip className="overflow-hidden !p-0">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <p className="text-sm font-black text-neutral-950">
          {match.status === "scheduled" ? "Horario del partido" : "Fecha y ubicación"}
        </p>
        {match.canManage && !editing ? (
          <button
            type="button"
            onClick={() => {
              setScheduledAt(formatScheduleForDateTimeInput(match.scheduledAt))
              setLocationName(match.locationName ?? "")
              setError(null)
              setEditing(true)
            }}
            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[9px] font-black text-neutral-700"
          >
            Editar
          </button>
        ) : null}
      </div>

      <div className="px-3 pb-3">
        {!editing ? (
          <div className="rounded-lg bg-neutral-100 px-2.5 py-2">
            <p className="text-sm font-black text-neutral-950">
              {formatPersonalMatchDateTime(match.scheduledAt)}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-600">
              {match.locationName || "Ubicación no indicada"}
            </p>

            {match.scheduledAt && (directionsUrl || match.status === "scheduled") ? (
              <div className="mt-2 flex gap-2">
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 rounded-lg border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white"
                  >
                    Cómo llegar
                  </a>
                ) : null}
                <PersonalAddToCalendarButton
                  match={match}
                  className="min-w-0 flex-1 rounded-lg border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2.5">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                Fecha y hora
              </span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                Pista o club
              </span>
              <input
                value={locationName}
                onChange={(event) => setLocationName(event.target.value.slice(0, 120))}
                disabled={saving}
                placeholder="Ej. Padel Indoor"
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
              />
            </label>
            {error ? (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setScheduledAt(formatScheduleForDateTimeInput(match.scheduledAt))
                  setLocationName(match.locationName ?? "")
                  setEditing(false)
                  setError(null)
                }}
                disabled={saving}
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs font-black text-neutral-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveSchedule()}
                disabled={saving || !scheduledAt.trim()}
                className="flex-1 rounded-lg bg-neutral-950 px-2.5 py-2 text-xs font-black text-white disabled:bg-neutral-300"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppCard>
  )
}
