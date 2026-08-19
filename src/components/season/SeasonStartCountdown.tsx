"use client"

import { useEffect, useState } from "react"
import { formatScheduledSeasonStart, getSeasonCountdown } from "@/lib/seasonScheduling"
import { useI18n } from "@/i18n/I18nProvider"

type Props = { scheduledStartAt: string; compact?: boolean; hero?: boolean }

function CountdownValue({ days, hours, minutes, seconds, hero = false }: { days: number; hours: number; minutes: number; seconds: number; hero?: boolean }) {
  const { tx } = useI18n()
  if (!hero) return <p className="text-xl font-black tabular-nums">{days > 0 ? `${days}d ` : ""}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</p>
  const units = [[days, tx("DÍAS")], [hours, tx("HORAS")], [minutes, tx("MIN")], [seconds, tx("SEG")]] as const
  return <div className="grid w-full grid-cols-4 gap-1.5 sm:gap-2">{units.map(([value, label]) => <div key={label} className="rounded-2xl bg-white/10 px-1 py-4 text-center"><p className="text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{String(value).padStart(2, "0")}</p><p className="mt-1 type-caption font-black tracking-[0.12em] text-neutral-300">{label}</p></div>)}</div>
}

export function SeasonStartCountdown({ scheduledStartAt, compact = false, hero = false }: Props) {
  const { tx, locale } = useI18n()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  const countdown = getSeasonCountdown(scheduledStartAt, now)
  const formattedStart = formatScheduledSeasonStart(scheduledStartAt, locale)

  useEffect(() => {
    if (!countdown?.isDue) return
    const key = `smash-lob:scheduled-season-refresh:${scheduledStartAt}`
    if (window.sessionStorage.getItem(key) === "1") return
    window.sessionStorage.setItem(key, "1")
    const timer = window.setTimeout(() => window.location.reload(), 1200)
    return () => window.clearTimeout(timer)
  }, [countdown?.isDue, scheduledStartAt])

  if (!countdown) return null
  if (compact) return <div className="rounded-xl bg-neutral-100 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-500">{countdown.isDue ? tx("Preparando inicio") : tx("La temporada comienza en")}</p><p className="mt-1 truncate text-xs font-semibold text-neutral-500">{formattedStart}</p></div>{countdown.isDue ? <span className="rounded-full bg-amber-100 px-2.5 py-1 type-caption font-black text-amber-900">{tx("Activación automática")}</span> : <CountdownValue {...countdown} />}</div></div>

  return <section data-season-start-countdown={hero ? "hero" : "waiting"} className={hero ? "flex min-h-[calc(100dvh-13rem)] flex-col items-center justify-center rounded-[2rem] bg-neutral-950 px-4 py-8 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]" : "px-2 py-1 text-center text-neutral-950"}>
    <p className={`${hero ? "text-sm text-neutral-300" : "type-caption text-neutral-500"} font-black uppercase tracking-[0.18em]`}>{countdown.isDue ? tx("PREPARANDO INICIO") : tx("LA TEMPORADA COMIENZA EN")}</p>
    {countdown.isDue ? <p className={`${hero ? "my-10 text-4xl" : "my-3 text-xl"} font-black`}>{tx("Activación automática")}</p> : <div className={hero ? "my-8 w-full" : "my-2"}><CountdownValue {...countdown} hero={hero} /></div>}
    <p className={`${hero ? "text-base text-neutral-300" : "text-xs text-neutral-500"} font-bold`}>{formattedStart}</p>
  </section>
}
