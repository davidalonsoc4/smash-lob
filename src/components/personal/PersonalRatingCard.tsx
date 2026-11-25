import Link from "next/link"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

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
        <div className="flex items-center gap-3">
          {rating ? <p className="shrink-0 text-3xl font-black leading-none text-neutral-950">{Math.round(rating.rating)}<span className="ml-1 text-sm font-bold text-neutral-500">Elo</span></p> : null}
          <div className="min-w-0 flex-1">
            <p className="type-caption font-black text-neutral-800">{tx("Nivel")}{rating?.provisional ? ` · ${tx("provisional")}` : ""}</p>
            <p className="type-caption font-semibold leading-4 text-neutral-500">
              {rating ? `${rating.matches} ${tx("partidos")} · ${rating.wins} ${tx("ganados")}` : tx("Todavía sin partidos terminados.")}
            </p>
          </div>
        </div>
      </AppCard>
    </Link>
  )
}
