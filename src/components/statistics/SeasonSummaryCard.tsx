"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  createSeasonSummaryImage,
  downloadSeasonSummaryImage,
  type SeasonSummaryHeroKind,
  type SeasonSummaryImageData,
  type SeasonSummaryImageOptions,
} from "@/lib/seasonSummaryImage"

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function formatGamesDiff(value: number) {
  if (value > 0) return `+${value}`
  return `${value}`
}

function ImageOptionIcon({ type }: { type: "logo" | "profiles" }) {
  if (type === "profiles") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m7.5 16 3.25-3.25 2.25 2.25 2.5-2.5L19 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15.75" cy="8.25" r="1.25" fill="currentColor" />
    </svg>
  )
}

function HeroRoleIcon({ kind }: { kind: SeasonSummaryHeroKind }) {
  if (kind === "champion") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-8 w-8">
        <g transform="translate(0 -1)">
          <path
            d="m8 16 8 9 8-14 8 14 8-9-4 20H12L8 16Zm7 25h18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    )
  }

  if (kind === "mvp") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-8 w-8">
        <path
          d="m24 7 5.1 10.4 11.5 1.7-8.3 8.1 2 11.4L24 33.2l-10.3 5.4 2-11.4-8.3-8.1 11.5-1.7L24 7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-8 w-8">
      <g transform="translate(1 -1)">
        <path
          d="m5 13 6.5 7.5L18 9l6.5 11.5L31 13l-3.5 17h-19L5 13Zm6 22h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="m33.5 24 2 4.2 4.7.7-3.4 3.3.8 4.6-4.1-2.1-4.1 2.1.8-4.6-3.4-3.3 4.7-.7 2-4.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          checked ? "bg-neutral-950 text-white" : "bg-white text-neutral-500"
        }`}
      >
        <ImageOptionIcon type={type} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-neutral-900">{title}</span>
        <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-neutral-500">
          {description}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-neutral-950" : "bg-neutral-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  )
}

export function SeasonSummaryCard({
  data,
  canExport,
  exportBlockedReason,
}: {
  data: SeasonSummaryImageData
  canExport: boolean
  exportBlockedReason?: string
}) {
  const [busyAction, setBusyAction] = useState<"share" | "download" | null>(null)
  const [includeLeagueLogo, setIncludeLeagueLogo] = useState(true)
  const [includeHeroImages, setIncludeHeroImages] = useState(true)

  const hasLeagueLogo = Boolean(data.leagueLogoUrl)
  const hasHeroImages = useMemo(
    () => data.heroes.some((hero) => Boolean(hero.imageUrl)),
    [data.heroes],
  )

  const imageOptions: SeasonSummaryImageOptions = {
    includeLeagueLogo: hasLeagueLogo && includeLeagueLogo,
    includeHeroImages: hasHeroImages && includeHeroImages,
  }

  function reportBlockedExport() {
    showActionFeedback({
      tone: "info",
      message:
        exportBlockedReason ??
        "Revisa los datos pendientes antes de guardar el resumen.",
    })
  }

  async function createImage() {
    if (!canExport) {
      reportBlockedExport()
      return null
    }

    try {
      return await createSeasonSummaryImage(data, imageOptions)
    } catch {
      showActionFeedback({
        tone: "error",
        message: "No se pudo generar el resumen de temporada.",
      })
      return null
    }
  }

  async function handleDownload() {
    if (!canExport) {
      reportBlockedExport()
      return
    }

    setBusyAction("download")
    const blob = await createImage()
    if (blob) {
      downloadSeasonSummaryImage(
        blob,
        `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}.png`,
      )
      showActionFeedback({ tone: "success", message: "Resumen guardado como imagen." })
    }
    setBusyAction(null)
  }

  async function handleShare() {
    if (!canExport) {
      reportBlockedExport()
      return
    }

    setBusyAction("share")
    const blob = await createImage()
    if (!blob) {
      setBusyAction(null)
      return
    }

    const filename = `${sanitizeFilename(data.leagueName)}-${sanitizeFilename(data.seasonName)}.png`
    const file = new File([blob], filename, { type: "image/png" })

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${data.leagueName} · ${data.seasonName}`,
          text: "Resumen final de temporada de Smash & Lob",
          files: [file],
        })
      } else {
        downloadSeasonSummaryImage(blob, filename)
        showActionFeedback({
          tone: "info",
          message:
            "Tu dispositivo no permite compartir archivos desde aquí; se ha descargado la imagen.",
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setBusyAction(null)
        return
      }
      showActionFeedback({ tone: "error", message: "No se pudo compartir el resumen." })
    }
    setBusyAction(null)
  }

  return (
    <AppCard className="overflow-hidden p-0">
      <div className="bg-neutral-100 p-3">
        <div className="overflow-hidden rounded-[1.75rem] bg-neutral-950 p-4 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-192.png" alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black tracking-tight">Smash & Lob</p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Resumen final de temporada
                </p>
              </div>
            </div>

            {hasLeagueLogo && includeLeagueLogo ? (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.leagueLogoUrl ?? ""}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-5 min-w-0">
            <p className="break-words text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
              {data.leagueName}
            </p>
            <p className="mt-1 break-words text-2xl font-black leading-7 text-white">
              {data.seasonName}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-3">
          {data.heroes.map((hero) => (
            <div
              key={`${hero.label}-${hero.value}`}
              className="grid grid-cols-[0.375rem_minmax(0,1fr)] gap-x-4 overflow-hidden rounded-[1.35rem] border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="my-0.5 w-1.5 self-stretch rounded-full bg-neutral-950"
              />
              <div className="grid min-w-0 gap-3">
                <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4">
                  <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1.35rem] border border-neutral-200 bg-neutral-100 text-neutral-950">
                    <div className="flex h-10 w-10 items-center justify-center">
                      <HeroRoleIcon kind={hero.kind} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-center text-[9px] font-black uppercase tracking-[0.16em] text-neutral-400">
                      {hero.label}
                    </p>
                    <div className="mt-1.5 flex min-w-0 items-center justify-center gap-2.5">
                      {includeHeroImages && hero.imageUrl ? (
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={hero.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                      <p className="min-w-0 break-words text-center text-xl font-black leading-6 text-neutral-950">
                        {hero.value}
                      </p>
                    </div>
                  </div>
                </div>

                {hero.stats.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {hero.stats.slice(0, 3).map((stat) => (
                      <div
                        key={stat.label}
                        className="flex min-h-[4.25rem] min-w-0 flex-col justify-center rounded-[1.1rem] bg-neutral-100 px-2 py-2.5 text-center"
                      >
                        <p className="text-[8px] font-black uppercase tracking-wide text-neutral-400">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-base font-black leading-none text-neutral-950">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded bg-neutral-950" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-700">
              Podio final
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {data.podium.map((row, index) => (
              <div
                key={`${row.position}-${row.name}`}
                className={`flex min-h-14 items-center gap-3 px-3 py-2.5 ${
                  index !== data.podium.length - 1 ? "border-b border-neutral-100" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                    row.position === 1
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 bg-neutral-100 text-neutral-950"
                  }`}
                >
                  {row.position}º
                </div>
                <p className="min-w-0 flex-1 break-words text-sm font-black leading-4 text-neutral-950">
                  {row.name}
                </p>
                <div className="grid w-24 shrink-0 grid-cols-2 border-l border-neutral-100 pl-2 text-center">
                  <div>
                    <p className="text-[8px] font-black uppercase text-neutral-400">Puntos</p>
                    <p className="text-xs font-black text-neutral-950">{row.points}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase text-neutral-400">DG</p>
                    <p className="text-xs font-black text-neutral-950">
                      {formatGamesDiff(row.gamesDiff)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded bg-neutral-950" />
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-700">
              Lo más destacado
            </p>
            <span aria-hidden="true" className="h-px flex-1 bg-neutral-200" />
          </div>
          <div className="mt-2 grid gap-2">
            {data.highlights.map((highlight) => (
              <div
                key={highlight.label}
                className="grid grid-cols-[0.375rem_minmax(0,1fr)] gap-x-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white px-4 py-4"
              >
                <span
                  aria-hidden="true"
                  className="my-0.5 min-h-[5.25rem] w-1.5 rounded-full bg-neutral-300"
                />
                <div className="flex min-h-[5.25rem] min-w-0 flex-col justify-center pr-1">
                  <p className="text-[9px] font-black uppercase tracking-wide text-neutral-400">
                    {highlight.label}
                  </p>
                  <p className="mt-1.5 break-words text-sm font-black leading-[1.2rem] text-neutral-950">
                    {highlight.headline}
                  </p>
                  <p className="mt-1.5 break-words text-[11px] font-semibold leading-4 text-neutral-500">
                    {highlight.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-2.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold text-neutral-400">Creado con</p>
            <p className="text-xs font-black text-neutral-950">Smash & Lob</p>
          </div>
          <p className="ml-auto text-right text-[8px] font-black uppercase tracking-wide text-neutral-400">
            Ligas privadas de pádel
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="text-xs font-black text-neutral-900">Personaliza la imagen</p>
            <p className="mt-0.5 text-[11px] font-semibold leading-4 text-neutral-500">
              Elige qué elementos visuales se incluyen al compartir o guardar.
            </p>
          </div>
          <div className="mt-3 grid gap-2">
            <ImageOptionToggle
              checked={hasLeagueLogo && includeLeagueLogo}
              disabled={!hasLeagueLogo || busyAction !== null}
              title="Logo de la liga"
              description={
                hasLeagueLogo
                  ? "Se mostrará respetando su fondo transparente."
                  : "Esta liga no tiene un logo guardado."
              }
              type="logo"
              onChange={() => setIncludeLeagueLogo((current) => !current)}
            />
            <ImageOptionToggle
              checked={hasHeroImages && includeHeroImages}
              disabled={!hasHeroImages || busyAction !== null}
              title="Fotos de campeón / MVP"
              description={
                hasHeroImages
                  ? "Añade los avatares disponibles a los paneles principales."
                  : "No hay imágenes de perfil disponibles para mostrar."
              }
              type="profiles"
              onChange={() => setIncludeHeroImages((current) => !current)}
            />
          </div>
        </div>

        {!canExport ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-black text-amber-900">
              Imagen bloqueada hasta completar los datos
            </p>
            <p className="mt-0.5 text-[11px] font-semibold leading-4 text-amber-800">
              {exportBlockedReason ?? "Revisa los partidos pendientes o no válidos de la temporada."}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            disabled={busyAction !== null || !canExport}
            className="rounded-xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "share" ? "Preparando…" : "Compartir"}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={busyAction !== null || !canExport}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busyAction === "download" ? "Generando…" : "Guardar imagen"}
          </button>
        </div>
      </div>
    </AppCard>
  )
}
