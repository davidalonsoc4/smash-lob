"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { matchIncidentTypeLabels } from "@/lib/matchIncidents"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

function getTeamLabel(playerIds: string[], players: { id: string; displayName: string }[], fallback: string) {
  return playerIds
    .map((playerId) => players.find((player) => player.id === playerId)?.displayName ?? fallback)
    .join(" / ")
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AdminIncidentsPage() {
  const { tx, locale } = useI18n()
  const { activeLeague, matches, players } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const canManage = hasLeagueAdminRole(activeLeague.id)
  const openIncidents = matches
    .filter((match) => match.incidentStatus === "open")
    .sort((a, b) => {
      const left = a.incidentCreatedAt ? new Date(a.incidentCreatedAt).getTime() : 0
      const right = b.incidentCreatedAt ? new Date(b.incidentCreatedAt).getTime() : 0
      return right - left
    })

  if (!canManage) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/admin" label={tx("Volver")} />
        <AppCard>
          <p className="font-black">{tx("Acceso restringido")}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {tx("Solo creator y administradores pueden revisar el buzón de incidencias.")}{" "}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/admin" label={tx("Volver")} />
        <div className="mt-0.5 flex items-center gap-2">
          <h1 className="type-page-title text-xl font-black tracking-tight">{tx("Buzón de incidencias")}</h1>
          {openIncidents.length > 0 ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 type-caption font-black text-white">
              {openIncidents.length}
            </span>
          ) : null}
        </div>
      </header>

      {openIncidents.length === 0 ? (
        <AppCard className="border-emerald-200 bg-emerald-50">
          <p className="font-black text-emerald-900">{tx("No hay incidencias pendientes")}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-800/70">
            {tx("Cuando un jugador comunique una incidencia aparecerá aquí y recibirás una notificación si la tienes activada.")}{" "}</p>
        </AppCard>
      ) : (
        <div className="space-y-2">
          {openIncidents.map((match) => {
            const teamA = getTeamLabel(match.teamA, players, tx("Jugador"))
            const teamB = getTeamLabel(match.teamB, players, tx("Jugador"))
            return (
              <Link key={match.id} href={`/match/${match.id}`} className="block">
                <AppCard className="border-amber-200 bg-amber-50 p-3 transition active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 type-caption font-black uppercase text-amber-950">
                          {tx("Jornada")}{" "}{match.round}
                        </span>
                        <p className="text-xs font-black text-amber-950">
                          {match.incidentType ? tx(matchIncidentTypeLabels[match.incidentType]) : tx("Incidencia")}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-xs font-black text-neutral-950">
                        {teamA} {tx("vs")}{" "}{teamB}
                      </p>
                      {match.incidentReason ? (
                        <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-neutral-600">
                          {match.incidentReason}
                        </p>
                      ) : null}
                      {formatDate(match.incidentCreatedAt, locale) ? (
                        <p className="mt-1.5 type-caption font-bold text-neutral-400">
                          {formatDate(match.incidentCreatedAt, locale)}
                        </p>
                      ) : null}
                    </div>
                    <ClickableChevron className="shrink-0 border-amber-200 bg-amber-100 text-amber-800" />
                  </div>
                </AppCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
