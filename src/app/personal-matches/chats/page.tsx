"use client"

import Link from "next/link"
import { useI18n } from "@/i18n/I18nProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { StatusDot } from "@/components/ui/StatusDot"
import { getMatchDisplayStatus } from "@/lib/matchLifecycle"
import {
  CHAT_UNREAD_LOCAL_REFRESH_EVENT,
  subscribeChatRealtime,
} from "@/lib/chatRealtimeClient"

type PersonalChatOverviewItem = {
  id: string
  origin: "friendly" | "league"
  leagueName?: string
  round?: number
  status: string
  scheduledAt: string | null
  resultRecordedAt: string | null
  locationName: string | null
  readOnly: boolean
  expired: boolean
  partner: string
  rivals: string[]
  unread: number
  lastMessage: {
    sender: string
    body: string
    createdAt: string
  } | null
  realtimeTopic: string | null
}
function formatChatDate(value: string | null) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
function firstName(value: string) {
  const [name, surname] = value.trim().split(/\s+/)
  return name ? `${name}${surname ? ` ${Array.from(surname)[0].toLocaleUpperCase("es-ES")}.` : ""}` : ""
}
function participantLabel(chat: PersonalChatOverviewItem) {
  const rivals = chat.rivals.filter(Boolean).map(firstName)
  const rivalLabel =
    rivals.length > 1
      ? `${rivals.slice(0, -1).join(", ")} y ${rivals.at(-1)}`
      : rivals[0] ?? "Rivales"
  return `con ${firstName(chat.partner) || "Pareja"} vs ${rivalLabel}`
}
function chatBadge(chat: PersonalChatOverviewItem) {
  if (chat.expired) return "Historial eliminado"
  if (chat.readOnly) return "Solo lectura"
  if (chat.status === "finished") return "Abierto 24 h"
  const status = getMatchDisplayStatus(chat)
  return status === "result_pending" ? "Pendiente de resultado" : status === "in_progress" ? "En juego" : "Programado"
}
function errorMessage(error: string | null) {
  if (error === "personal_match_chat_schema_missing") {
    return "El chat de amistosos todavía no está activado en esta base de datos. Falta aplicar la migración del chat."
  }
  return "No se han podido cargar tus chats de amistosos."
}
export default function PersonalMatchChatsPage() {
  const { tx } = useI18n()
  const { userLeagues } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const [chats, setChats] = useState<PersonalChatOverviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadedAt, setLoadedAt] = useState(0)

  const leagueSeasons = useMemo(() => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return userLeagues.flatMap((league) => seasons.filter((season) => season.leagueId === league.id && uuid.test(league.id) && uuid.test(season.id)).map((season) => ({ leagueId: league.id, leagueName: league.name, seasonId: season.id })))
  }, [seasons, userLeagues])
  const load = useCallback(async () => {
    const response = await fetch("/api/personal-matches/chats", { cache: "no-store" }).catch(() => null)
    const payload = response ? await response.json().catch(() => null) : null

    const friendlyError = !response?.ok ? payload && typeof payload.error === "string" ? payload.error : "personal_match_chats_lookup_failed" : null
    const friendlyChats: PersonalChatOverviewItem[] = response?.ok && Array.isArray(payload?.chats) ? payload.chats.map((chat: PersonalChatOverviewItem) => ({ ...chat, origin: "friendly" })) : []
    const leagueResponses = await Promise.all(leagueSeasons.map(async (scope) => {
      const params = new URLSearchParams({ leagueId: scope.leagueId, seasonId: scope.seasonId }), leagueResponse = await fetch(`/api/chats?${params.toString()}`, { cache: "no-store" }).catch(() => null)
      if (!leagueResponse?.ok) return [] as PersonalChatOverviewItem[]
      const leaguePayload = await leagueResponse.json().catch(() => null)
      return Array.isArray(leaguePayload?.chats) ? leaguePayload.chats.map((chat: PersonalChatOverviewItem) => ({ ...chat, origin: "league" as const, leagueName: scope.leagueName, locationName: null, expired: false, resultRecordedAt: null, realtimeTopic: typeof leaguePayload.realtimeTopic === "string" ? leaguePayload.realtimeTopic : null })) : []
    }))

    setChats([...friendlyChats, ...leagueResponses.flat()])
    setError(friendlyError)
    setLoadedAt(Date.now())
    setLoading(false)
  }, [leagueSeasons])
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load()
    }
    const handleLocalRefresh = () => void load()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalRefresh)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener(CHAT_UNREAD_LOCAL_REFRESH_EVENT, handleLocalRefresh)
    }
  }, [load])
  const realtimeTopics = useMemo(
    () => [...new Set(chats.map((chat) => chat.realtimeTopic).filter((topic): topic is string => Boolean(topic)))],
    [chats],
  )
  const realtimeKey = realtimeTopics.join("|")
  const groupedChats = useMemo(() => {
    const now = loadedAt
    const upcomingBoundary = now + 7 * 24 * 60 * 60 * 1000
    const groups = { active: [] as PersonalChatOverviewItem[], upcoming: [] as PersonalChatOverviewItem[], finished: [] as PersonalChatOverviewItem[] }
    for (const chat of chats) {
      if (chat.status === "finished" || chat.readOnly) {
        groups.finished.push(chat)
        continue
      }
      const scheduled = chat.scheduledAt ? Date.parse(chat.scheduledAt) : Number.NaN
      if (chat.lastMessage || !Number.isFinite(scheduled) || scheduled <= upcomingBoundary) groups.active.push(chat)
      else groups.upcoming.push(chat)
    }
    const sortByRecent = (left: PersonalChatOverviewItem, right: PersonalChatOverviewItem) => {
      const timestamp = (item: PersonalChatOverviewItem) => Date.parse(item.lastMessage?.createdAt ?? item.resultRecordedAt ?? item.scheduledAt ?? "") || 0
      return timestamp(right) - timestamp(left)
    }
    groups.active.sort(sortByRecent)
    groups.upcoming.sort((left, right) => (Date.parse(left.scheduledAt ?? "") || 0) - (Date.parse(right.scheduledAt ?? "") || 0))
    groups.finished.sort(sortByRecent)
    return groups
  }, [chats, loadedAt])
  useEffect(() => {
    if (!realtimeKey) return
    const unsubscribes = realtimeKey
      .split("|")
      .filter(Boolean)
      .map((topic) =>
        subscribeChatRealtime(topic, () => {
          if (document.visibilityState === "visible") void load()
        }),
      )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [load, realtimeKey])

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label="Volver" />
        <h1 className="type-page-title font-black tracking-tight">Chats</h1>
      </header>

      {loading ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            Cargando conversaciones…
          </p>
        </AppCard>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {errorMessage(error)}
        </p>
      ) : null}

      {!loading && !error && chats.length === 0 ? (
        <AppCard>
          <p className="text-sm font-black">{tx("Todavía no tienes chats.")}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Las conversaciones de tus ligas y amistosos aparecerán aquí.")}</p>
        </AppCard>
      ) : null}

      {chats.length > 0 ? (
        <div className="space-y-3" data-personal-match-chats-list>
          {([ ["active", tx("Activos")], ["upcoming", tx("Próximos")], ["finished", tx("Chats finalizados")] ] as const).map(([groupKey, groupLabel]) => {
            const sectionChats = groupedChats[groupKey]
            if (!sectionChats.length) return null
            return <section key={groupKey} aria-label={groupLabel} className="space-y-1.5">
              <h2 className="px-1 type-caption font-black uppercase tracking-[0.14em] text-neutral-500">{groupLabel}<span className="ml-1.5 text-neutral-400">{sectionChats.length}</span></h2>
              <div className="overflow-hidden rounded-xl">
          {sectionChats.map((chat, index) => {
            const radius =
              sectionChats.length === 1
                ? "!rounded-xl"
                : index === 0
                  ? "!rounded-t-xl !rounded-b-none"
                  : index === sectionChats.length - 1
                    ? "!rounded-b-xl !rounded-t-none"
                    : "!rounded-none"
            const eventDate =
              chat.lastMessage?.createdAt ??
              chat.resultRecordedAt ??
              chat.scheduledAt

            return (
              <Link
                key={`${chat.origin}:${chat.id}`}
                href={chat.origin === "friendly" ? `/personal-matches/${encodeURIComponent(chat.id)}/chat` : `/match/${encodeURIComponent(chat.id)}/chat`}
                className={`block ${index ? "-mt-px" : ""}`}
              >
                <AppCard
                  className={`app-card-explicit-accent !overflow-hidden !p-0 !shadow-none transition active:scale-[0.99] ${radius} ${chat.unread ? "chat-list-card-unread" : ""}`}
                >
                  <div className="relative min-w-0 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="type-panel-title min-w-0 flex-1 truncate font-black">
                        {chat.origin === "friendly" ? tx("Amistoso") : `${tx("Jornada")} ${chat.round ?? ""}`}
                      </p>
                      {chat.leagueName ? <span className="max-w-[42%] truncate rounded-full bg-neutral-100 px-2 py-0.5 type-caption font-bold text-neutral-600">{chat.leagueName}</span> : null}
                      {chat.unread > 0 ? (
                        <span
                          aria-label={tx(`${chat.unread} mensaje${chat.unread === 1 ? "" : "s"} sin leer`)}
                          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-1.5 type-caption font-black text-white shadow-sm"
                        >
                          {chat.unread > 99 ? "99+" : chat.unread}
                        </span>
                      ) : null}
                      <StatusDot kind={chat.expired || chat.readOnly ? "chat" : "match-participant"} status={chat.expired || chat.readOnly ? "readonly" : getMatchDisplayStatus(chat)} label={tx(chatBadge(chat))} />
                    </div>

                    <p className="mt-2 break-words type-small font-semibold text-neutral-600" title={[chat.partner, ...chat.rivals].join(" · ")}>
                      {participantLabel(chat)}
                    </p>

                    {chat.locationName ? (
                      <p className="mt-0.5 truncate type-caption font-semibold text-neutral-400">
                        {chat.locationName}
                      </p>
                    ) : null}

                    <div className="mt-2 flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-2">
                      <div className="min-w-0 flex-1">
                        {chat.lastMessage ? (
                          <p
                            className={`truncate type-caption ${chat.unread ? "font-black text-neutral-800" : "font-semibold text-neutral-500"}`}
                          >
                            <span className="font-black">{chat.lastMessage.sender}</span>: {chat.lastMessage.body}
                          </p>
                        ) : (
                          <p className="type-caption font-semibold text-neutral-400">
                            {chat.expired
                              ? tx("Los mensajes ya se han eliminado")
                              : tx("Sin mensajes todavía")}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 type-caption font-semibold text-neutral-400">
                        {formatChatDate(eventDate)}
                      </p>
                    </div>
                  </div>
                </AppCard>
              </Link>
            )
          })}
              </div>
            </section>
          })}
        </div>
      ) : null}
    </div>
  )
}
