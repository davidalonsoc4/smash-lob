"use client"

import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

type PlayerStatsPanelProps = {
  playerId: string
  players: PlayerStatsPlayer[]
  matches: PlayerStatsMatch[]
}

type PlayerStatsPlayer = {
  id: string
  displayName: string
}

type PlayerStatsMatch = {
  id: string
  round: number
  status: string
  teamA: string[]
  teamB: string[]
  pointsA: number | null
  pointsB: number | null
  sets: { a: number; b: number }[]
}

type PlayerRelationStats = {
  playerId: string
  matches: number
  wins: number
}

function getTeamSetPoints(match: PlayerStatsMatch, team: "A" | "B") {
  if (team === "A" && match.pointsA !== null) {
    return match.pointsA
  }

  if (team === "B" && match.pointsB !== null) {
    return match.pointsB
  }

  return match.sets.filter((set) => (team === "A" ? set.a > set.b : set.b > set.a)).length
}

function getTeamGames(match: PlayerStatsMatch, team: "A" | "B") {
  return match.sets.reduce((total, set) => total + (team === "A" ? set.a : set.b), 0)
}

function getBestRelation(relationStats: Map<string, PlayerRelationStats>) {
  return Array.from(relationStats.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (b.matches !== a.matches) return b.matches - a.matches
    return a.playerId.localeCompare(b.playerId)
  })[0]
}

function getMostFrequentRelation(relationStats: Map<string, PlayerRelationStats>) {
  return Array.from(relationStats.values()).sort((a, b) => {
    if (b.matches !== a.matches) return b.matches - a.matches
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.playerId.localeCompare(b.playerId)
  })[0]
}

function upsertRelation(
  relationStats: Map<string, PlayerRelationStats>,
  playerId: string,
  won: boolean
) {
  const current = relationStats.get(playerId) ?? {
    playerId,
    matches: 0,
    wins: 0,
  }

  current.matches += 1

  if (won) {
    current.wins += 1
  }

  relationStats.set(playerId, current)
}

function formatPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return "0%"
  }

  return `${Math.round(value)}%`
}

function getDisplayName(playerId: string, players: PlayerStatsPlayer[]) {
  return players.find((player) => player.id === playerId)?.displayName ?? playerId
}

export function PlayerStatsPanel({ playerId, players, matches }: PlayerStatsPanelProps) {
  const { t } = useI18n()
  const finishedMatches = matches.filter(
    (match) =>
      match.status === "finished" &&
      (match.teamA.includes(playerId) || match.teamB.includes(playerId))
  )

  const partnerStats = new Map<string, PlayerRelationStats>()
  const rivalStats = new Map<string, PlayerRelationStats>()
  let setsFor = 0
  let setsAgainst = 0
  let gamesFor = 0
  let gamesAgainst = 0
  let wins = 0
  let losses = 0
  let bestMatch: { round: number; diff: number } | null = null
  let toughestMatch: { round: number; diff: number } | null = null

  for (const match of finishedMatches) {
    const isTeamA = match.teamA.includes(playerId)
    const ownTeam = isTeamA ? match.teamA : match.teamB
    const opponentTeam = isTeamA ? match.teamB : match.teamA
    const ownSets = getTeamSetPoints(match, isTeamA ? "A" : "B")
    const opponentSets = getTeamSetPoints(match, isTeamA ? "B" : "A")
    const ownGames = getTeamGames(match, isTeamA ? "A" : "B")
    const opponentGames = getTeamGames(match, isTeamA ? "B" : "A")
    const won = ownSets > opponentSets
    const gamesDiff = ownGames - opponentGames

    setsFor += ownSets
    setsAgainst += opponentSets
    gamesFor += ownGames
    gamesAgainst += opponentGames

    if (won) {
      wins += 1
    } else {
      losses += 1
    }

    ownTeam
      .filter((teammateId) => teammateId !== playerId)
      .forEach((teammateId) => upsertRelation(partnerStats, teammateId, won))

    opponentTeam.forEach((opponentId) => upsertRelation(rivalStats, opponentId, won))

    if (!bestMatch || gamesDiff > bestMatch.diff) {
      bestMatch = { round: match.round, diff: gamesDiff }
    }

    if (!toughestMatch || gamesDiff < toughestMatch.diff) {
      toughestMatch = { round: match.round, diff: gamesDiff }
    }
  }

  const matchesPlayed = finishedMatches.length
  const winRate = matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0
  const gamesDiff = gamesFor - gamesAgainst
  const bestPartner = getBestRelation(partnerStats)
  const mostFrequentRival = getMostFrequentRelation(rivalStats)
  const emptyValue = "—"

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-500">
            {t.playerStats.title}
          </p>
          <p className="mt-1 text-xl font-black">{t.playerStats.subtitle}</p>
        </div>

        <div className="rounded-2xl bg-neutral-950 px-3 py-2 text-right text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-300">
            {t.playerStats.winRate}
          </p>
          <p className="text-lg font-black">{formatPercentage(winRate)}</p>
          <p className="text-[11px] font-semibold text-neutral-300">
            {wins}-{losses} {t.playerStats.record}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-neutral-100 p-3">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.setsBalance}
          </p>
          <p className="mt-1 text-lg font-black">
            {setsFor}-{setsAgainst}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-100 p-3">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.gamesBalance}
          </p>
          <p className="mt-1 text-lg font-black">
            {gamesFor}-{gamesAgainst}
          </p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {gamesDiff > 0 ? "+" : ""}{gamesDiff} {t.ranking.diff}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {t.playerStats.bestPartner}
            </p>
            <p className="mt-1 font-black">
              {bestPartner ? getDisplayName(bestPartner.playerId, players) : emptyValue}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-neutral-500">
            {bestPartner
              ? `${bestPartner.wins}/${bestPartner.matches} ${t.profile.wins.toLowerCase()}`
              : emptyValue}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {t.playerStats.frequentRival}
            </p>
            <p className="mt-1 font-black">
              {mostFrequentRival
                ? getDisplayName(mostFrequentRival.playerId, players)
                : emptyValue}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-neutral-500">
            {mostFrequentRival
              ? `${mostFrequentRival.matches} ${t.profile.matchesPlayed.toLowerCase()}`
              : emptyValue}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.bestRound}
          </p>
          <p className="mt-1 font-black">
            {bestMatch ? `${t.playerStats.roundShort}${bestMatch.round}` : emptyValue}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {bestMatch ? `${bestMatch.diff > 0 ? "+" : ""}${bestMatch.diff}` : emptyValue}
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-3">
          <p className="text-xs font-semibold text-neutral-500">
            {t.playerStats.toughestRound}
          </p>
          <p className="mt-1 font-black">
            {toughestMatch ? `${t.playerStats.roundShort}${toughestMatch.round}` : emptyValue}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {toughestMatch
              ? `${toughestMatch.diff > 0 ? "+" : ""}${toughestMatch.diff}`
              : emptyValue}
          </p>
        </div>
      </div>
    </AppCard>
  )
}
