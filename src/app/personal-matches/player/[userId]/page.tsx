import { notFound } from "next/navigation"
import { PersonalProfileView } from "@/components/personal/PersonalProfileView"
import { EloChip, PlayerProfileIdentityCard } from "@/components/player/PlayerProfileIdentityCard"
import { PlayerRatingEvents } from "@/components/player/PlayerRatingDetail"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { summarizeRating } from "@/lib/rating"
import { getPlayerSideAndHandLabel } from "@/lib/accountProfile"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadVisibleFinishedMatchesOfUser } from "@/lib/serverPersonalMatches"
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
  // Only matches the viewer can already see (shared friendlies and leagues they belong to or follow).
  const items = await loadVisibleFinishedMatchesOfUser(authResult.actor, userId).catch(() => null)

  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label="Volver" />
        <PlayerProfileIdentityCard player={{ displayName: card.displayName, avatarUrl: card.avatarUrl }} positionLabel={getPlayerSideAndHandLabel(card.preferredSide, card.dominantHand)} context="global" trailing={card.rating ? (
          <EloChip
            elo={summarizeRating(card.rating)}
            differenceToViewer={card.isSelf || card.viewerRating === null ? null : card.rating.rating - card.viewerRating}
          >
            {card.ratingDetail ? <PlayerRatingEvents rating={card.rating} labels={card.labels} /> : null}
          </EloChip>
        ) : undefined} />
      </header>
      <PersonalProfileView
        items={items ?? []}
        loaded
        failed={items === null}
        topSlot={
          <>
            {!card.isSelf ? (
              <div className="grid grid-cols-2 gap-2">
                <Record title="Contigo de pareja" record={card.together} />
                <Record title="Contra ti" record={card.against} />
              </div>
            ) : null}
          </>
        }
        leagueFilterCount={new Set((items ?? []).filter((match) => match.origin === "league").map((match) => match.leagueId)).size}
        failedText="No se han podido cargar las estadísticas de este jugador."
        emptyDescription="Aquí solo aparecen los partidos que tú también puedes ver (amistosos compartidos y tus ligas)."
      />
    </div>
  )
}
