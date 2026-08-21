"use client"

import { useEffect, useRef, useState } from "react"
import { requestLeagueAccessRefresh } from "@/lib/appRefreshEvents"
import { PreseasonOpeningCalendarButton } from "@/components/season/PreseasonOpeningCalendarButton"
import { formatScheduledSeasonStart, getSeasonCountdown, SCHEDULED_SEASON_TIME_ZONE } from "@/lib/seasonScheduling"
import { getPreseasonAccessPhase, type PreseasonOpening } from "@/lib/preseasonSecrets"
import { getIntlLocale } from "@/i18n/leagueText"
import { useI18n } from "@/i18n/I18nProvider"

type Props = {
  scheduledStartAt: string
  compact?: boolean
  hero?: boolean
  preseasonSecretDaysBefore?: number | null
  opening?: PreseasonOpening | null
  leagueName?: string
  seasonName?: string
}

function CountdownValue({ days, hours, minutes, seconds, hero = false }: { days: number; hours: number; minutes: number; seconds: number; hero?: boolean }) {
  const { tx } = useI18n()
  if (!hero) return <p className="text-xl font-black tabular-nums">{days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</p>
  const units = [[days, tx("DÍAS")], [hours, tx("HORAS")], [minutes, tx("MIN")], [seconds, tx("SEG")]] as const
  return <div className="grid w-full grid-cols-4 gap-1.5 sm:gap-2">{units.map(([value, label]) => <div key={label} className="rounded-2xl bg-white/10 px-1 py-4 text-center"><p className="text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{String(value).padStart(2, "0")}</p><p className="mt-1 type-caption font-black tracking-[0.12em] text-neutral-300">{label}</p></div>)}</div>
}

function formatOpeningDateTime(opening: PreseasonOpening, locale: ReturnType<typeof useI18n>["locale"]) {
  const intlLocale = getIntlLocale(locale)
  const start = new Date(opening.startsAt)
  const end = new Date(opening.endsAt)
  const dateLabel = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SCHEDULED_SEASON_TIME_ZONE,
  }).format(start)
  const timeFormatter = new Intl.DateTimeFormat(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SCHEDULED_SEASON_TIME_ZONE,
  })
  return {
    date: `${dateLabel.charAt(0).toLocaleUpperCase(intlLocale)}${dateLabel.slice(1)}`,
    time: `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`,
  }
}

export function SeasonStartCountdown({
  scheduledStartAt,
  compact = false,
  hero = false,
  preseasonSecretDaysBefore = null,
  opening = null,
  leagueName,
  seasonName,
}: Props) {
  const { tx, locale } = useI18n()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const countdown = getSeasonCountdown(scheduledStartAt, now)
  const preseasonPhase = getPreseasonAccessPhase({
    status: "upcoming",
    scheduledStartAt,
    secretDaysBefore: preseasonSecretDaysBefore,
    now,
  })
  const secretPhase = preseasonPhase === "secrets"
  const formattedStart = formatScheduledSeasonStart(scheduledStartAt, locale)
  const openingLabel = opening ? formatOpeningDateTime(opening, locale) : null
  const previousPreseasonPhase = useRef(preseasonPhase)

  useEffect(() => {
    const previousPhase = previousPreseasonPhase.current
    previousPreseasonPhase.current = preseasonPhase
    if (previousPhase !== "locked" || preseasonPhase !== "secrets" || !preseasonSecretDaysBefore || countdown?.isDue) return
    const key = `smash-lob:scheduled-season-secret-refresh:${scheduledStartAt}:${preseasonSecretDaysBefore}`
    if (window.sessionStorage.getItem(key) === "1") return
    window.sessionStorage.setItem(key, "1")
    const timer = window.setTimeout(() => requestLeagueAccessRefresh(), 250)
    return () => window.clearTimeout(timer)
  }, [countdown?.isDue, preseasonPhase, preseasonSecretDaysBefore, scheduledStartAt])

  useEffect(() => {
    if (!countdown?.isDue) return
    const key = `smash-lob:scheduled-season-refresh:${scheduledStartAt}`
    if (window.sessionStorage.getItem(key) === "1") return
    window.sessionStorage.setItem(key, "1")
    const timer = window.setTimeout(() => requestLeagueAccessRefresh(), 900)
    return () => window.clearTimeout(timer)
  }, [countdown?.isDue, scheduledStartAt])

  if (!countdown) return null
  if (compact) return <div className="rounded-xl bg-neutral-100 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-500">{countdown.isDue ? tx("Preparando inicio") : tx("La temporada comienza en")}</p><p className="mt-1 truncate text-xs font-semibold text-neutral-500">{formattedStart}</p></div>{countdown.isDue ? null : <CountdownValue {...countdown} />}</div></div>

  if (hero && secretPhase && !countdown.isDue) {
    return (
      <section
        data-season-start-countdown="hero"
        data-preseason-phase="secrets"
        className="flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center rounded-[2rem] bg-neutral-950 px-4 py-8 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
      >
        <div className="w-full rounded-[1.75rem] border border-white/20 bg-white/10 p-4 text-center shadow-[0_12px_38px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <span className="inline-flex rounded-full bg-white px-3 py-1 type-caption font-black uppercase tracking-[0.16em] text-neutral-950">
            {tx("¡NOVEDADES!")}
          </span>
          <p className="mt-4 text-2xl font-black text-white">
            {opening ? tx("JORNADA DE APERTURA") : tx("EL ESTRENO YA ESTÁ PREPARADO")}
          </p>

          {opening && openingLabel ? (
            <>
              <div className="mt-4 space-y-1 text-sm font-bold text-neutral-200">
                <p>{openingLabel.date}</p>
                <p>{openingLabel.time}</p>
                <p>{opening.locationLabel}</p>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-neutral-300">
                {tx("Los emparejamientos todavía son sorpresa.")}
              </p>
              {leagueName && seasonName ? <PreseasonOpeningCalendarButton leagueName={leagueName} seasonName={seasonName} opening={opening} /> : null}
            </>
          ) : (
            <p className="mt-4 text-sm font-semibold leading-6 text-neutral-300">
              {tx("La Jornada 1 ya está preparada. Los emparejamientos todavía son sorpresa.")}
            </p>
          )}
        </div>

        <div className="mt-7 w-full">
          <p className="text-center text-sm font-black uppercase tracking-[0.18em] text-neutral-300">
            {tx("DESCUBRIRÁS TODOS LOS EMPAREJAMIENTOS EN")}
          </p>
          <div className="my-6 w-full"><CountdownValue {...countdown} hero /></div>
          <p className="text-center text-base font-bold text-neutral-300">{formattedStart}</p>
        </div>
      </section>
    )
  }

  const countdownTitle = countdown.isDue
    ? tx("PREPARANDO INICIO")
    : tx("LA TEMPORADA COMIENZA EN")

  return <section data-season-start-countdown={hero ? "hero" : "waiting"} data-preseason-phase="locked" className={hero ? "flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center rounded-[2rem] bg-neutral-950 px-4 py-8 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]" : "px-2 py-1 text-center text-neutral-950"}>
    <p className={`${hero ? "text-sm text-neutral-300" : "type-caption text-neutral-500"} font-black uppercase tracking-[0.18em]`}>{countdownTitle}</p>
    {countdown.isDue ? null : <div className={hero ? "my-8 w-full" : "my-2"}><CountdownValue {...countdown} hero={hero} /></div>}
    <p className={`${hero ? "text-base text-neutral-300" : "text-xs text-neutral-500"} font-bold`}>{formattedStart}</p>
  </section>
}
