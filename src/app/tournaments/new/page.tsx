import { RapidTournamentCreateForm } from "@/components/tournament/RapidTournamentPage"
export default async function NewTournamentPage({ searchParams }: { searchParams: Promise<{ sourceLeagueId?: string; sourceSeasonId?: string; sourceLeagueName?: string; duplicateOf?: string }> }) {
  const params = await searchParams
  if (params.duplicateOf) return <RapidTournamentCreateForm key={params.duplicateOf} duplicateOf={params.duplicateOf} />
  const initialSource = params.sourceLeagueId && params.sourceSeasonId ? { leagueId: params.sourceLeagueId, seasonId: params.sourceSeasonId, leagueName: params.sourceLeagueName?.slice(0, 80) } : null
  return <RapidTournamentCreateForm key={initialSource?.seasonId ?? "independent"} initialSource={initialSource} />
}
