import Link from "next/link"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

type MyRating = { userId: string; rating: { level: number; rating: number; matches: number; wins: number; provisional: boolean } | null }
const levelColor = (level: number) => `hsl(${Math.round(Math.min(100, Math.max(0, level)) * 1.3)} 75% 36%)`

// Global level of the person, from all their matches. Hidden (renders nothing) unless the server says it may be shown.
export function PersonalRatingCard() {
  const { tx } = useI18n()
  const [mine, setMine] = useState<MyRating | null>(null)
  useEffect(() => {
    let active = true
    fetch("/api/rating/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: MyRating | null) => { if (active) setMine(payload) })
      .catch(() => undefined)
    return () => { active = false }
  }, [])
  if (!mine) return null
  const { rating } = mine
  return (
    <Link href={`/player-card/${mine.userId}`} className="block">
      <AppCard className="!p-3">
        <div className="flex items-center gap-3">
          {rating ? <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black" style={{ background: levelColor(rating.level), color: "#ffffff" }}>{Math.round(rating.level)}</span> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-neutral-200 text-sm font-black text-neutral-500">–</span>}
          <div className="min-w-0 flex-1">
            <p className="type-panel-title font-black">{tx("Nivel")}</p>
            <p className="type-caption font-semibold text-neutral-500">
              {rating ? `${rating.matches} ${tx("partidos")} · ${rating.wins} ${tx("ganados")}${rating.provisional ? ` · ${tx("provisional")}` : ""}` : tx("Todavía sin partidos terminados.")}
            </p>
          </div>
        </div>
      </AppCard>
    </Link>
  )
}
