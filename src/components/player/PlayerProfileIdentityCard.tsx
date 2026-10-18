import type { ReactNode } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

type PlayerProfileIdentityCardProps = {
  player: { displayName: string; avatarUrl: string | null }
  positionLabel?: string | null
  context: "global" | "league"
  leagueName?: string
  contextDetails?: ReactNode
}

export function PlayerProfileIdentityCard({
  player,
  positionLabel,
  context,
  leagueName,
  contextDetails,
}: PlayerProfileIdentityCardProps) {
  const { tx } = useI18n()
  const contextLabel = context === "global" ? tx("Perfil global") : leagueName ?? tx("Liga")

  return (
    <AppCard data-profile-identity={context} accentStrip className="!p-3">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} size="md" previewable />
        <div className="min-w-0 flex-1">
          <p className="type-caption truncate font-black uppercase tracking-[0.14em] text-neutral-500">
            {contextLabel}
          </p>
          <h1 className="type-player-name-hero break-words">{player.displayName}</h1>
          {contextDetails ? <div className="mt-0.5 min-w-0">{contextDetails}</div> : null}
          {positionLabel ? (
            <p className="mt-1 type-caption font-bold text-neutral-500">
              {tx("Posición preferida")} · {positionLabel}
            </p>
          ) : null}
        </div>
      </div>
    </AppCard>
  )
}
