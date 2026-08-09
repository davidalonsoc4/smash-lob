"use client"

import type { ReactNode } from "react"
import { TeamPlayers } from "@/components/player/TeamPlayers"
import type { PlayerProfile } from "@/data/fakeData"
import type { MatchSubstitution } from "@/lib/substitutes"
import { getMatchSubstituteLabels } from "@/lib/substitutes"

type MatchTeamsPanelProps = {
  teamA: string[]
  teamB: string[]
  players?: PlayerProfile[]
  substitutions?: MatchSubstitution[]
  highlightedPlayerIds?: string[]
  highlightedPlayerLabel?: string
  mode: "rows" | "versus"
  teamATrailing?: ReactNode
  teamBTrailing?: ReactNode
  linkPlayers?: boolean
}

export function MatchTeamsPanel({
  teamA,
  teamB,
  players = [],
  substitutions = [],
  highlightedPlayerIds = [],
  highlightedPlayerLabel = "MVP de jornada",
  mode,
  teamATrailing = null,
  teamBTrailing = null,
  linkPlayers = false,
}: MatchTeamsPanelProps) {
  const substituteLabels = getMatchSubstituteLabels({ substitutions, players })

  if (mode === "versus") {
    return (
      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)] items-stretch gap-2">
        <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5">
          <TeamPlayers
            playerIds={teamA}
            players={players}
            highlightedPlayerIds={highlightedPlayerIds}
            highlightedPlayerLabel={highlightedPlayerLabel}
            substituteLabels={substituteLabels}
            linkPlayers={linkPlayers}
            stackPlayers
            keepNamesOnOneLine
            className="type-player-name flex min-w-0 flex-col gap-y-1 leading-tight"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 type-caption font-black uppercase text-neutral-600">
            VS
          </span>
        </div>

        <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5 text-right">
          <TeamPlayers
            playerIds={teamB}
            players={players}
            highlightedPlayerIds={highlightedPlayerIds}
            highlightedPlayerLabel={highlightedPlayerLabel}
            substituteLabels={substituteLabels}
            linkPlayers={linkPlayers}
            stackPlayers
            keepNamesOnOneLine
            className="type-player-name flex min-w-0 flex-col items-end gap-y-1 leading-tight [&>span]:justify-end"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
        <TeamPlayers
          playerIds={teamA}
          players={players}
          highlightedPlayerIds={highlightedPlayerIds}
          highlightedPlayerLabel={highlightedPlayerLabel}
          substituteLabels={substituteLabels}
          linkPlayers={linkPlayers}
          stackPlayers
          className="type-player-name flex min-w-0 flex-1 flex-col gap-y-0.5"
        />
        {teamATrailing}
      </div>

      <div className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
        <TeamPlayers
          playerIds={teamB}
          players={players}
          highlightedPlayerIds={highlightedPlayerIds}
          highlightedPlayerLabel={highlightedPlayerLabel}
          substituteLabels={substituteLabels}
          linkPlayers={linkPlayers}
          stackPlayers
          className="type-player-name flex min-w-0 flex-1 flex-col gap-y-0.5"
        />
        {teamBTrailing}
      </div>
    </div>
  )
}
