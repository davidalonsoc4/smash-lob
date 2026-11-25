import { notFound } from "next/navigation"
import { PlayerProfileIdentityCard } from "@/components/player/PlayerProfileIdentityCard"
import { PlayerRatingDetail } from "@/components/player/PlayerRatingDetail"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { getPlayerSideAndHandLabel } from "@/lib/accountProfile"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadPlayerCard, type PlayerCardRecord } from "@/lib/serverPlayerCard"
import { validateUuid } from "@/lib/serverRequest"

export const dynamic = "force-dynamic"

function Record({ title, record }: { title: string; record: PlayerCardRecord }) {
  return (
    <AppCard className="!p-3 text-center">
      <p className="type-caption font-black uppercase tracking-wide text-neutral-500">{title}</p>
      {record.matches > 0 ? (
        <>
          <p className="mt-1 text-2xl font-black text-neutral-950">{record.wins} - {record.matches - record.wins}</p>
          <p className="type-caption font-semibold text-neutral-500">{record.matches} {record.matches === 1 ? "partido" : "partidos"}</p>
        </>
      ) : <p className="mt-2 type-caption font-semibold text-neutral-500">Sin partidos todavía</p>}
    </AppCard>
  )
}

// Global card of a person (not tied to any league), reached from the names in a friendly match.
export default async function PlayerCardPage({ params }: { params: Promise<{ userId: string }> }) {
  const userId = validateUuid((await params).userId)
  if (!userId) notFound()
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) notFound()
  const card = await loadPlayerCard(authResult.actor, userId)
  if (!card || card === "forbidden") notFound()

  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label="Volver" />
        <PlayerProfileIdentityCard player={{ displayName: card.displayName, avatarUrl: card.avatarUrl }} positionLabel={getPlayerSideAndHandLabel(card.preferredSide, card.dominantHand)} context="global" />
      </header>
      {card.rating ? <PlayerRatingDetail rating={card.rating} labels={card.labels} /> : null}
      {!card.isSelf ? (
        <div className="grid grid-cols-2 gap-2">
          <Record title="Contigo de pareja" record={card.together} />
          <Record title="Contra ti" record={card.against} />
        </div>
      ) : null}
    </div>
  )
}
