"use client"

import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { showActionFeedback } from "@/lib/actionFeedback"
import type { RankingPlayer } from "@/lib/ranking"
import {
  createSeasonCalendarImage,
  createSeasonRankingImage,
  downloadSeasonExportImage,
  type SeasonCalendarImageMode,
} from "@/lib/seasonExportImages"
import {
  createSeasonSummaryImage,
  downloadSeasonSummaryImage,
  type SeasonSummaryImageData,
} from "@/lib/seasonSummaryImage"

type ExportKind =
  | "calendar-current"
  | "calendar-fixtures"
  | "ranking"
  | "summary"
type ExportAction = "share" | "download"
type BusyAction = `${ExportKind}-${ExportAction}` | null

type SummaryExport = {
  visible: boolean
  canExport: boolean
  blockedReason?: string
  data: SeasonSummaryImageData
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function ImageTypeIcon({ kind }: { kind: ExportKind }) {
  if (kind === "ranking") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        <path d="M3 20.5h18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    )
  }

  if (kind === "summary") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M12 3.75 14.45 8.7l5.47.8-3.96 3.86.94 5.44L12 16.23 7.1 18.8l.94-5.44L4.08 9.5l5.47-.8L12 3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17M7.5 14h3M13.5 14h3M7.5 17.5h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ImageOptionIcon({ type }: { type: "logo" | "profiles" }) {
  if (type === "profiles") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m7.5 16 3.25-3.25 2.25 2.25 2.5-2.5L19 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15.75" cy="8.25" r="1.25" fill="currentColor" />
    </svg>
  )
}

function ImageOptionToggle({
  checked,
  disabled,
  title,
  description,
  type,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  title: string
  description: string
  type: "logo" | "profiles"
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
        checked
          ? "border-neutral-300 bg-white shadow-sm"
          : "border-neutral-200 bg-neutral-100/70"
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-neutral-950 text-white" : "bg-white text-neutral-500"}`}>
        <ImageOptionIcon type={type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-neutral-900">{title}</span>
        <span className="mt-0.5 block type-caption font-semibold leading-4 text-neutral-500">
          {description}
        </span>
      </span>
      <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-neutral-950" : "bg-neutral-300"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} />
      </span>
    </button>
  )
}

function ExportCard({
  kind,
  title,
  description,
  disabled,
  disabledReason,
  busyAction,
  downloadOnly = false,
  downloadLabel = "Guardar imagen",
  onShare,
  onDownload,
}: {
  kind: ExportKind
  title: string
  description: string
  disabled: boolean
  disabledReason?: string
  busyAction: BusyAction
  downloadOnly?: boolean
  downloadLabel?: string
  onShare?: () => void
  onDownload: () => void
}) {
  const sharing = busyAction === `${kind}-share`
  const downloading = busyAction === `${kind}-download`
  const busy = busyAction !== null

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-neutral-100 bg-neutral-50 px-3 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-950 text-white">
          <ImageTypeIcon kind={kind} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">{title}</p>
          <p className="mt-1 type-caption font-semibold leading-4 text-neutral-500">
            {description}
          </p>
          {disabledReason ? (
            <p className="mt-1.5 type-caption font-bold leading-4 text-amber-700">
              {disabledReason}
            </p>
          ) : null}
        </div>
      </div>
      <div className={`grid gap-2 p-3 ${downloadOnly ? "grid-cols-1" : "grid-cols-2"}`}>
        {!downloadOnly ? (
          <button
            type="button"
            onClick={onShare}
            disabled={disabled || busy}
            className="inline-flex rounded-xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45 items-center justify-center text-center"
          >
            {sharing ? "Preparando…" : "Compartir"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDownload}
          disabled={disabled || busy}
          className={`rounded-xl px-3 py-2.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-45 ${
            downloadOnly
              ? "bg-neutral-950 text-white"
              : "border border-neutral-200 bg-white text-neutral-900"
          }`}
        >
          {downloading ? "Generando…" : downloadLabel}
        </button>
      </div>
    </div>
  )
}

export function SeasonShareExportsCard({
  leagueName,
  seasonName,
  leagueLogoUrl,
  matches,
  players,
  ranking,
  summaryExport,
  seasonFinished,
}: {
  leagueName: string
  seasonName: string
  leagueLogoUrl?: string | null
  matches: MatchData[]
  players: PlayerProfile[]
  ranking: RankingPlayer[]
  summaryExport: SummaryExport
  seasonFinished: boolean
}) {
  const [includeLeagueLogo, setIncludeLeagueLogo] = useState(true)
  const [includePlayerImages, setIncludePlayerImages] = useState(true)
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const hasLeagueLogo = Boolean(leagueLogoUrl)
  const hasPlayerImages = players.some((player) => Boolean(player.avatarUrl))

  function getFilename(kind: ExportKind) {
    const suffix =
      kind === "calendar-current"
        ? seasonFinished
          ? "calendario"
          : "calendario-actual"
        : kind === "calendar-fixtures"
          ? "calendario-enfrentamientos"
          : kind === "summary"
            ? "resumen-temporada"
            : "clasificacion"

    return `${sanitizeFilename(leagueName)}-${sanitizeFilename(seasonName)}-${suffix}.png`
  }

  async function createImage(kind: ExportKind) {
    const branding = {
      leagueName,
      seasonName,
      leagueLogoUrl,
      includeLeagueLogo: hasLeagueLogo && includeLeagueLogo,
      includePlayerImages,
    }

    if (kind === "summary") {
      return createSeasonSummaryImage(summaryExport.data, {
        includeLeagueLogo: branding.includeLeagueLogo,
        includeHeroImages: includePlayerImages,
      })
    }

    if (kind === "ranking") {
      return createSeasonRankingImage({ ...branding, ranking })
    }

    const mode: SeasonCalendarImageMode =
      kind === "calendar-fixtures" ? "fixtures" : "current"

    return createSeasonCalendarImage({
      ...branding,
      mode,
      label: seasonFinished && mode === "current" ? "Calendario" : undefined,
      matches,
      players,
    })
  }

  async function runAction(kind: ExportKind, action: ExportAction) {
    if (busyAction) return

    if (kind === "summary" && !summaryExport.canExport) {
      showActionFeedback({
        tone: "info",
        message:
          summaryExport.blockedReason ??
          "Revisa los datos pendientes antes de descargar el resumen.",
      })
      return
    }

    setBusyAction(`${kind}-${action}`)

    try {
      const blob = await createImage(kind)
      const filename = getFilename(kind)

      if (action === "share") {
        const file = new File([blob], filename, { type: "image/png" })

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `${leagueName} · ${seasonName}`,
            text:
              kind === "ranking"
                ? "Clasificación de Smash & Lob"
                : kind === "calendar-fixtures"
                  ? "Calendario de enfrentamientos de Smash & Lob"
                  : kind === "summary"
                    ? "Resumen final de temporada de Smash & Lob"
                    : seasonFinished
                      ? "Calendario de Smash & Lob"
                      : "Calendario actual de Smash & Lob",
            files: [file],
          })
        } else {
          downloadSeasonExportImage(blob, filename)
          showActionFeedback({
            tone: "info",
            message: "Tu dispositivo no permite compartir esta imagen; se ha descargado.",
          })
        }
      } else if (kind === "summary") {
        downloadSeasonSummaryImage(blob, filename)
        showActionFeedback({ tone: "success", message: "Resumen de temporada descargado." })
      } else {
        downloadSeasonExportImage(blob, filename)
        showActionFeedback({ tone: "success", message: "Imagen guardada correctamente." })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setBusyAction(null)
        return
      }

      showActionFeedback({
        tone: "error",
        message: "No se ha podido generar o compartir la imagen.",
      })
    }

    setBusyAction(null)
  }

  return (
    <AppCard className="space-y-4 border-neutral-200 bg-white shadow-sm">
      <div>
        <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">
          Imágenes de la temporada
        </p>
        <p className="mt-1 type-panel-title text-neutral-950">Compartir temporada</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {seasonFinished
            ? "El calendario, la clasificación y el resumen final están disponibles para compartir o guardar."
            : "El calendario actual, los enfrentamientos y la clasificación están disponibles durante toda la temporada. Cuando termine, aparecerá también la descarga del resumen final."}
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <p className="text-xs font-black text-neutral-900">Apariencia de las imágenes</p>
        <div className="mt-3 grid gap-2">
          <ImageOptionToggle
            checked={hasLeagueLogo && includeLeagueLogo}
            disabled={!hasLeagueLogo || busyAction !== null}
            title="Logo de la liga"
            description={
              hasLeagueLogo
                ? "Se mostrará en la cabecera respetando su transparencia."
                : "Esta liga no tiene un logo guardado."
            }
            type="logo"
            onChange={() => setIncludeLeagueLogo((current) => !current)}
          />
          <ImageOptionToggle
            checked={includePlayerImages}
            disabled={busyAction !== null}
            title="Imágenes de perfil"
            description={
              hasPlayerImages
                ? "Usa los avatares disponibles y un icono genérico cuando falten."
                : "Se mostrarán iconos genéricos porque no hay fotos disponibles."
            }
            type="profiles"
            onChange={() => setIncludePlayerImages((current) => !current)}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <ExportCard
          kind="calendar-current"
          title={seasonFinished ? "Calendario" : "Calendario actual"}
          description={
            seasonFinished
              ? "Muestra los enfrentamientos, fechas, ubicaciones, resultados y sets de la temporada."
              : "Muestra los enfrentamientos, la situación actual de cada partido y los resultados y sets registrados."
          }
          disabled={matches.length === 0}
          busyAction={busyAction}
          onShare={() => void runAction("calendar-current", "share")}
          onDownload={() => void runAction("calendar-current", "download")}
        />
        {!seasonFinished ? (
          <ExportCard
            kind="calendar-fixtures"
            title="Calendario de enfrentamientos"
            description="Muestra únicamente las parejas de cada jornada y el VS, sin estados, fechas, ubicaciones ni resultados."
            disabled={matches.length === 0}
            busyAction={busyAction}
            onShare={() => void runAction("calendar-fixtures", "share")}
            onDownload={() => void runAction("calendar-fixtures", "download")}
          />
        ) : null}
        <ExportCard
          kind="ranking"
          title="Clasificación"
          description="Muestra el podio y la tabla completa con la clasificación actual de la temporada."
          disabled={ranking.length === 0}
          busyAction={busyAction}
          onShare={() => void runAction("ranking", "share")}
          onDownload={() => void runAction("ranking", "download")}
        />
        {summaryExport.visible ? (
          <ExportCard
            kind="summary"
            title="Resumen de temporada"
            description="Genera la imagen final con campeón, MVP, podio y momentos destacados, sin mostrar una vista previa en la app."
            disabled={!summaryExport.canExport}
            disabledReason={
              summaryExport.canExport ? undefined : summaryExport.blockedReason
            }
            busyAction={busyAction}
            downloadLabel="Descargar Resumen de Temporada"
            onShare={() => void runAction("summary", "share")}
            onDownload={() => void runAction("summary", "download")}
          />
        ) : null}
      </div>
    </AppCard>
  )
}
