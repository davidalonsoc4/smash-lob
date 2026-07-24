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
  type AnnouncementAudienceMode,
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
  const { seasons, playerProfiles } = useSeasonSettings()
  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const leaguePlayers = useMemo(
    () =>
      playerProfiles
        .filter((player) => player.leagueId === activeLeague.id)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "es")),
    [activeLeague.id, playerProfiles],
  )
  const { hasLeagueAdminRole } = useLeagueAccess()
  const canManage = hasLeagueAdminRole(activeLeague.id)
  const [announcements, setAnnouncements] = useState<LeagueAnnouncement[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audienceMode, setAudienceMode] =
    useState<AnnouncementAudienceMode>("league")
  const [seasonId, setSeasonId] = useState("")
  const [targetPlayerIds, setTargetPlayerIds] = useState<string[]>([])
  const [pinned, setPinned] = useState(true)
  const [sendNotification, setSendNotification] = useState(true)
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

  const selectedPlayers = useMemo(
    () => leaguePlayers.filter((player) => targetPlayerIds.includes(player.id)),
    [leaguePlayers, targetPlayerIds],
  )
  const audienceIsValid =
    audienceMode === "league" ||
    (audienceMode === "season" && Boolean(seasonId)) ||
    (audienceMode === "players" && targetPlayerIds.length > 0)
  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    audienceIsValid &&
    (pinned || sendNotification) &&
    !isSaving
  const actionLabel = pinned
    ? sendNotification
      ? "Publicar y notificar"
      : "Publicar"
    : "Notificar"

  function getAudienceLabel(announcement: LeagueAnnouncement) {
    if (announcement.targetPlayerNames.length > 0) {
      return announcement.targetPlayerNames.join(", ")
    }
    if (announcement.seasonId) {
      return (
        leagueSeasons.find((season) => season.id === announcement.seasonId)?.name ??
        "Temporada"
      )
    }
    return "Toda la liga"
  }

  function toggleTargetPlayer(playerId: string) {
    setTargetPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    )
  }

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
        audienceMode,
        seasonId: audienceMode === "season" ? seasonId : null,
        targetPlayerIds: audienceMode === "players" ? targetPlayerIds : [],
        title: title.trim(),
        body: body.trim(),
        pinned,
        sendNotification,
        expiresAt: pinned && expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      setAnnouncements((current) => [...created, ...current])
      setTitle("")
      setBody("")
      setExpiresAt("")
      setTargetPlayerIds([])
      announceLeagueAnnouncementsRefresh()
      setMessage(
        pinned && sendNotification
          ? "Comunicado publicado y notificación enviada."
          : pinned
            ? "Comunicado publicado en la HOME."
            : "Notificación enviada.",
      )
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : ""
      setError(
        code.includes("players_required")
          ? "Selecciona al menos un jugador."
          : code.includes("season_required")
            ? "Selecciona una temporada."
            : "No se ha podido procesar el comunicado.",
      )
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
        <h1 className="mt-0.5 text-xl font-black tracking-tight">Comunicados</h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Publica un aviso en la HOME, envía una notificación o realiza ambas acciones.
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
              rows={4}
              placeholder="Escribe el comunicado..."
              className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-500"
            />
            <span className="mt-1 block text-right text-[10px] font-bold text-neutral-400">
              {body.length}/1500
            </span>
          </label>

          <div>
            <p className="text-xs font-black text-neutral-700">Destinatarios</p>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {([
                ["league", "Toda la liga"],
                ["season", "Temporada"],
                ["players", "Jugadores"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAudienceMode(value)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-black ${
                    audienceMode === value
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {audienceMode === "season" ? (
            <label className="block">
              <span className="text-xs font-black text-neutral-700">Temporada</span>
              <select
                value={seasonId}
                onChange={(event) => setSeasonId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                <option value="">Selecciona una temporada</option>
                {leagueSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {audienceMode === "players" ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black">Selecciona jugadores</p>
                <span className="text-[10px] font-black text-neutral-500">
                  {targetPlayerIds.length} seleccionados
                </span>
              </div>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
                {leaguePlayers.map((player) => (
                  <label
                    key={player.id}
                    className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={targetPlayerIds.includes(player.id)}
                      onChange={() => toggleTargetPlayer(player.id)}
                      className="h-4 w-4"
                    />
                    <span className="truncate text-xs font-bold">{player.displayName}</span>
                  </label>
                ))}
              </div>
              {selectedPlayers.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedPlayers.map((player) => (
                    <span
                      key={player.id}
                      className="rounded-full bg-neutral-200 px-2 py-0.5 text-[9px] font-black text-neutral-700"
                    >
                      {player.displayName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs font-black text-orange-950">Fijar en la HOME</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(event) => setSendNotification(event.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs font-black text-blue-950">Enviar notificación</span>
            </label>
          </div>

          {pinned ? (
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
          ) : null}

          {!pinned && !sendNotification ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-800">
              Marca al menos “Fijar en la HOME” o “Enviar notificación”.
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isSaving ? "Procesando..." : actionLabel}
          </button>

          {message ? (
            <p className="text-center text-xs font-bold text-emerald-700">{message}</p>
          ) : null}
          {error ? (
            <p className="text-center text-xs font-bold text-red-600">{error}</p>
          ) : null}
        </div>
      </AppCard>

      <div>
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Publicados y enviados
        </p>

        {isLoading ? (
          <AppCard><p className="text-sm font-bold text-neutral-500">Cargando...</p></AppCard>
        ) : announcements.length === 0 ? (
          <AppCard><p className="text-sm font-bold text-neutral-500">Todavía no hay comunicados.</p></AppCard>
        ) : (
          <div className="space-y-2">
            {announcements.map((announcement) => (
              <AppCard key={announcement.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-black">{announcement.title}</p>
                      {announcement.pinned ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-black uppercase text-orange-700">
                          HOME
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black uppercase text-blue-700">
                          Solo aviso
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs font-semibold leading-4 text-neutral-600">
                      {announcement.body}
                    </p>
                    <p className="mt-1.5 text-[10px] font-bold text-neutral-500">
                      Para: {getAudienceLabel(announcement)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-neutral-400">
                      {formatDate(announcement.publishedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(announcement)}
                    disabled={deletingId === announcement.id}
                    aria-label={`Eliminar ${announcement.title}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-100 text-xl font-black leading-none text-red-700 transition hover:bg-red-200 disabled:opacity-40"
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
