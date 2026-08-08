"use client"

import { useEffect, useMemo, useState } from "react"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import { AppCard } from "@/components/ui/AppCard"
import {
  createLeagueLocation,
  getLeagueLocationCompactText,
  getLeagueLocationOptionLabel,
  getScheduleLocationMapsUrl,
  sortLeagueLocationsByOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"
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
  const [globalLocations, setGlobalLocations] = useState<LeagueLocation[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [manualLocationName, setManualLocationName] = useState(match.locationName ?? "")
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/locations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { locations?: LeagueLocation[] }
        if (!response.ok) throw new Error("global_locations_lookup_failed")
        return sortLeagueLocationsByOptionLabel(payload.locations ?? [])
      })
      .then((locations) => {
        if (!cancelled) setGlobalLocations(locations)
      })
      .catch(() => {
        if (!cancelled) setGlobalLocations([])
      })
      .finally(() => {
        if (!cancelled) setLoadingLocations(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedGlobalLocation = useMemo(
    () => globalLocations.find((location) => location.id === selectedLocationId) ?? null,
    [globalLocations, selectedLocationId],
  )
  const resolvedLocationName = selectedGlobalLocation
    ? getLeagueLocationCompactText(selectedGlobalLocation)
    : manualLocationName.trim()
  const directionsUrl = getScheduleLocationMapsUrl(match.locationName)

  function syncEditorFromMatch() {
    setScheduledAt(formatScheduleForDateTimeInput(match.scheduledAt))
    const matchedLocation = globalLocations.find(
      (location) => getLeagueLocationCompactText(location) === match.locationName,
    )
    setSelectedLocationId(matchedLocation?.id ?? "")
    setManualLocationName(matchedLocation ? "" : match.locationName ?? "")
  }

  function openEditor() {
    syncEditorFromMatch()
    setError(null)
    setEditing(true)
  }

  async function saveSchedule() {
    if (!match.canManage || saving || !scheduledAt.trim()) return
    setSaving(true)
    setError(null)
    try {
      let locationName = resolvedLocationName

      if (!selectedGlobalLocation && manualLocationName.trim()) {
        const draftLocation = createLeagueLocation({
          name: manualLocationName.trim(),
          town: null,
          address: null,
          courtCount: null,
          selectedCourt: null,
          googlePlaceId: null,
          googlePlaceName: null,
          googleMapsUrl: null,
          latitude: null,
          longitude: null,
        })

        if (draftLocation) {
          const locationResponse = await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: draftLocation }),
          })
          if (!locationResponse.ok) throw new Error("global_location_save_failed")
          const locationPayload = (await locationResponse.json()) as {
            location?: LeagueLocation
          }
          if (locationPayload.location) {
            locationName = getLeagueLocationCompactText(locationPayload.location)
          }
        }
      }

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

  function resetEditor() {
    syncEditorFromMatch()
    setEditing(false)
    setError(null)
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
            onClick={openEditor}
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
              <select
                value={selectedLocationId}
                onChange={(event) => {
                  setSelectedLocationId(event.target.value)
                  if (event.target.value) setManualLocationName("")
                }}
                disabled={saving || loadingLocations}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              >
                <option value="">
                  {loadingLocations ? "Cargando ubicaciones..." : "Sin ubicación / introducir nueva"}
                </option>
                {globalLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {getLeagueLocationOptionLabel(location)}
                  </option>
                ))}
              </select>
              {!selectedLocationId ? (
                <input
                  value={manualLocationName}
                  onChange={(event) => setManualLocationName(event.target.value.slice(0, 120))}
                  disabled={saving}
                  placeholder="Nueva ubicación (se guardará en la app)"
                  className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400"
                />
              ) : null}
            </label>
            {error ? (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetEditor}
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
