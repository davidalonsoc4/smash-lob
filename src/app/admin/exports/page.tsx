"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { exportRankingCsv, exportResultsCsv } from "@/lib/csvExport"
import { getMatchResultConfirmationState } from "@/lib/resultConfirmations"
import {
  exportSeasonCalendarImage,
  exportSeasonRankingImage,
} from "@/lib/seasonExportImages"
import { calculateSeasonStatistics } from "@/lib/seasonStatistics"

type VisualExport = "calendar" | "ranking" | null

function ImageIcon({ kind }: { kind: "calendar" | "ranking" }) {
  if (kind === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.5v4M16 3.5v4M3.5 10h17M7.5 14h3M13.5 14h3M7.5 17.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3 20.5h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function ExportFeatureCard({
  eyebrow,
  title,
  description,
  kind,
  primaryLabel,
  secondaryLabel,
  disabled,
  busy,
  onPrimary,
  onSecondary,
}: {
  eyebrow: string
  title: string
  description: string
  kind: "calendar" | "ranking"
  primaryLabel: string
  secondaryLabel: string
  disabled: boolean
  busy: boolean
  onPrimary: () => void
  onSecondary: () => void
}) {
  return (
    <AppCard className="overflow-hidden p-0">
      <div className="bg-neutral-950 px-4 py-4 text-white">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10">
            <ImageIcon kind={kind} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight">{title}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-300">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled || busy}
          className="rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {busy ? "Generando imagen..." : primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          disabled={disabled || busy}
          className="rounded-xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:text-neutral-300"
        >
          {secondaryLabel}
        </button>
      </div>
    </AppCard>
  )
}

export default function AdminExportsPage() {
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { matches, resultConfirmations } = useMatchData()
  const {
    seasons,
    playerProfiles,
    seasonPlayers,
    getSeasonRoundSettings,
  } = useSeasonSettings()
  const countedMatches = useMemo(
    () =>
      matches.map((match) => ({
        ...match,
        resultCounts:
          match.rankingCounts !== false &&
          getMatchResultConfirmationState({
            matchId: match.id,
            participantIds: [...match.teamA, ...match.teamB],
            reporterPlayerId: match.resultReportedByPlayerId,
            resultRecordedAt: match.resultRecordedAt,
            resultLocked: match.resultLocked,
            confirmations: resultConfirmations,
            mode: getSeasonRoundSettings(match.seasonId).resultConfirmationMode,
          }).countsForRanking,
      })),
    [getSeasonRoundSettings, matches, resultConfirmations],
  )
  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const leaguePlayers = useMemo(
    () => playerProfiles.filter((player) => player.leagueId === activeLeague.id),
    [activeLeague.id, playerProfiles],
  )
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const [visualExport, setVisualExport] = useState<VisualExport>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const selectedSeason =
    leagueSeasons.find((season) => season.id === seasonId) ?? activeSeason
  const selectedMatches = useMemo(
    () =>
      countedMatches
        .filter((match) => match.seasonId === selectedSeason.id)
        .sort((left, right) => left.round - right.round),
    [countedMatches, selectedSeason.id],
  )
  const ranking = useMemo(
    () =>
      calculateSeasonStatistics({
        seasonId: selectedSeason.id,
        playerProfiles: leaguePlayers,
        seasonPlayers,
        matches: countedMatches,
      }).ranking,
    [countedMatches, leaguePlayers, seasonPlayers, selectedSeason.id],
  )
  const canManage = hasLeagueAdminRole(activeLeague.id)

  async function runVisualExport(
    kind: Exclude<VisualExport, null>,
    task: () => Promise<void>,
  ) {
    if (visualExport) {
      return
    }

    setVisualExport(kind)
    setExportError(null)

    try {
      await task()
    } catch {
      setExportError(
        "No se ha podido generar la imagen. Reinténtalo desde el navegador o la PWA.",
      )
    } finally {
      setVisualExport(null)
    }
  }

  if (!canManage) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/admin" label="Volver" />
        <AppCard>
          <p className="font-black">Acceso restringido</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Exportar temporada
        </h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Genera imágenes listas para compartir del calendario y la clasificación,
          o conserva los CSV detallados para trabajar con los datos.
        </p>
      </header>

      <AppCard>
        <label className="block">
          <span className="text-xs font-black text-neutral-700">Temporada</span>
          <select
            value={selectedSeason.id}
            onChange={(event) => {
              setSeasonId(event.target.value)
              setExportError(null)
            }}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
          >
            {leagueSeasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </label>
      </AppCard>

      <ExportFeatureCard
        eyebrow="Imagen para compartir"
        title="Calendario visual"
        description="Jornadas agrupadas, parejas, fecha, lugar, estado y marcador en una composición vertical preparada para WhatsApp."
        kind="calendar"
        primaryLabel="Descargar calendario PNG"
        secondaryLabel="Resultados CSV"
        disabled={selectedMatches.length === 0}
        busy={visualExport === "calendar"}
        onPrimary={() =>
          void runVisualExport("calendar", () =>
            exportSeasonCalendarImage({
              leagueName: activeLeague.name,
              seasonName: selectedSeason.name,
              leagueLogoUrl: activeLeague.logoUrl,
              matches: selectedMatches,
              players: leaguePlayers,
            }),
          )
        }
        onSecondary={() =>
          exportResultsCsv({
            leagueName: activeLeague.name,
            seasonName: selectedSeason.name,
            matches: selectedMatches,
            players: leaguePlayers,
          })
        }
      />

      <ExportFeatureCard
        eyebrow="Imagen para compartir"
        title="Clasificación visual"
        description="Podio destacado y tabla completa con puntos, partidos, victorias y diferencia de juegos."
        kind="ranking"
        primaryLabel="Descargar clasificación PNG"
        secondaryLabel="Clasificación CSV"
        disabled={ranking.length === 0}
        busy={visualExport === "ranking"}
        onPrimary={() =>
          void runVisualExport("ranking", () =>
            exportSeasonRankingImage({
              leagueName: activeLeague.name,
              seasonName: selectedSeason.name,
              leagueLogoUrl: activeLeague.logoUrl,
              ranking,
            }),
          )
        }
        onSecondary={() =>
          exportRankingCsv({
            leagueName: activeLeague.name,
            seasonName: selectedSeason.name,
            ranking,
          })
        }
      />

      {exportError ? (
        <AppCard className="border-red-200 bg-red-50">
          <p className="text-xs font-bold leading-5 text-red-700">{exportError}</p>
        </AppCard>
      ) : null}

      <AppCard className="bg-neutral-50">
        <p className="text-xs font-bold leading-5 text-neutral-600">
          Las imágenes y los archivos se generan en tu dispositivo. No se envían
          datos a ningún servicio externo.
        </p>
      </AppCard>
    </div>
  )
}
