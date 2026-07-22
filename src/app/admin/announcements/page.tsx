"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  announceLeagueAnnouncementsRefresh,
  createLeagueAnnouncement,
  deleteLeagueAnnouncement,
  fetchLeagueAnnouncements,
  type LeagueAnnouncement,
} from "@/lib/announcements"

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
}

export default function AdminAnnouncementsPage() {
  const { activeLeague } = useCurrentLeagueData()
  const { seasons } = useSeasonSettings()
  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const { hasLeagueAdminRole } = useLeagueAccess()
  const canManage = hasLeagueAdminRole(activeLeague.id)
  const [announcements, setAnnouncements] = useState<LeagueAnnouncement[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [seasonId, setSeasonId] = useState("")
  const [pinned, setPinned] = useState(true)
  const [expiresAt, setExpiresAt] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchLeagueAnnouncements(activeLeague.id)
      .then((items) => {
        if (!cancelled) setAnnouncements(items)
      })
      .catch(() => {
        if (!cancelled) setError("No se han podido cargar los comunicados.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeLeague.id])

  const canSubmit = useMemo(
    () => title.trim().length > 0 && body.trim().length > 0 && !isSaving,
    [body, isSaving, title],
  )

  if (!canManage) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/admin" label="Volver" />
        <AppCard>
          <p className="font-black">Acceso restringido</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">
            Solo la organización puede publicar comunicados.
          </p>
        </AppCard>
      </div>
    )
  }

  async function handleCreate() {
    if (!canSubmit) return
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const created = await createLeagueAnnouncement({
        leagueId: activeLeague.id,
        seasonId: seasonId || null,
        title: title.trim(),
        body: body.trim(),
        pinned,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      setAnnouncements((current) => [...created, ...current])
      setTitle("")
      setBody("")
      setExpiresAt("")
      announceLeagueAnnouncementsRefresh()
      setMessage("Comunicado publicado y notificación enviada.")
    } catch {
      setError("No se ha podido publicar el comunicado.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(announcement: LeagueAnnouncement) {
    if (!window.confirm(`¿Eliminar el comunicado “${announcement.title}”?`)) {
      return
    }

    setDeletingId(announcement.id)
    setError(null)

    try {
      await deleteLeagueAnnouncement({
        leagueId: activeLeague.id,
        announcementId: announcement.id,
      })
      setAnnouncements((current) =>
        current.filter((item) => item.id !== announcement.id),
      )
      announceLeagueAnnouncementsRefresh()
    } catch {
      setError("No se ha podido eliminar el comunicado.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Comunicados
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Publica avisos en la HOME y envía una notificación a los miembros de la liga.
        </p>
      </header>

      <AppCard>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-black text-neutral-700">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 100))}
              placeholder="Cambio de pista, fecha límite, cena final..."
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black text-neutral-700">Mensaje</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value.slice(0, 1500))}
              rows={5}
              placeholder="Escribe el comunicado..."
              className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-500"
            />
            <span className="mt-1 block text-right text-[10px] font-bold text-neutral-400">
              {body.length}/1500
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black text-neutral-700">Temporada</span>
              <select
                value={seasonId}
                onChange={(event) => setSeasonId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                <option value="">Toda la liga</option>
                {leagueSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black text-neutral-700">
                Ocultar automáticamente (opcional)
              </span>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-bold">Fijar arriba en la HOME</span>
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isSaving ? "Publicando..." : "Publicar y notificar"}
          </button>

          {message ? (
            <p className="text-center text-xs font-bold text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="text-center text-xs font-bold text-red-600">{error}</p>
          ) : null}
        </div>
      </AppCard>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Publicados
        </p>

        {isLoading ? (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">Cargando...</p>
          </AppCard>
        ) : announcements.length === 0 ? (
          <AppCard>
            <p className="text-sm font-bold text-neutral-500">
              Todavía no hay comunicados.
            </p>
          </AppCard>
        ) : (
          <div className="space-y-2">
            {announcements.map((announcement) => (
              <AppCard key={announcement.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-black">{announcement.title}</p>
                      {announcement.pinned ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase text-neutral-600">
                          Fijado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-5 text-neutral-600">
                      {announcement.body}
                    </p>
                    <p className="mt-2 text-[10px] font-bold text-neutral-400">
                      {formatDate(announcement.publishedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(announcement)}
                    disabled={deletingId === announcement.id}
                    aria-label={`Eliminar ${announcement.title}`}
                    className="shrink-0 rounded-lg px-2 py-1 text-lg font-black text-neutral-400 hover:text-red-600 disabled:opacity-40"
                  >
                    ×
                  </button>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
