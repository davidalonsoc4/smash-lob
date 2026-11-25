import Link from "next/link"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import { ratingBand, ratingBarPosition } from "@/lib/rating"

type MyRating = { userId: string; rating: { level: number; rating: number; matches: number; wins: number; provisional: boolean } | null }

let inflight: Promise<MyRating | null> | null = null
// One request shared by the chip and the card; it is asked again every time the profile opens.
function useMyRating() {
  const [mine, setMine] = useState<MyRating | null>(null)
  useEffect(() => {
    let active = true
    inflight ??= fetch("/api/rating/me", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<MyRating>) : null))
      .catch(() => null)
      .finally(() => { setTimeout(() => { inflight = null }, 1500) })
    void inflight.then((payload) => { if (active) setMine(payload) })
    return () => { active = false }
  }, [])
  return mine
}

// Elo on the right of the name. The number is absolute and only means something next to other players' numbers.
export function PersonalRatingChip() {
  const rating = useMyRating()?.rating
  if (!rating) return null
  return <span className="inline-flex items-baseline gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-black text-neutral-900">{Math.round(rating.rating)}<span className="type-caption font-bold text-neutral-500">Elo</span></span>
}

export function PersonalRatingCard() {
  const { tx } = useI18n()
  const mine = useMyRating()
  if (!mine) return null
  const { rating } = mine
  return (
    <Link href={`/personal-matches/player/${mine.userId}`} className="block">
      <AppCard className="!p-3">
        {rating ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="type-panel-title font-black">{tx("Nivel")}</p>
              <span className="type-caption font-bold text-neutral-500">{tx(ratingBand(rating.rating))}{rating.provisional ? ` · ${tx("provisional")}` : ""}</span>
            </div>
            <p className="mt-1 text-4xl font-black leading-none text-neutral-950">{Math.round(rating.rating)} <span className="text-base font-bold text-neutral-500">Elo</span></p>
            <div className="relative mt-4 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#E24B4A,#EF9F27,#97C459,#1D9E75)" }}>
              <span className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-neutral-950" style={{ left: `${ratingBarPosition(rating.rating)}%` }} />
            </div>
            <p className="mt-2 type-caption font-semibold text-neutral-500">{rating.matches} {tx("partidos")} · {rating.wins} {tx("ganados")}</p>
          </>
        ) : (
          <>
            <p className="type-panel-title font-black">{tx("Nivel")}</p>
            <p className="type-caption font-semibold text-neutral-500">{tx("Todavía sin partidos terminados.")}</p>
          </>
        )}
      </AppCard>
    </Link>
  )
}
