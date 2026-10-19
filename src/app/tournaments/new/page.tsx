import { RapidTournamentCreateForm } from "@/components/tournament/RapidTournamentPage"
export default async function NewTournamentPage({ searchParams }: { searchParams: Promise<{ sourceLeagueId?: string; sourceSeasonId?: string; sourceLeagueName?: string }> }) {
  const params = await searchParams
  const initialSource = params.sourceLeagueId && params.sourceSeasonId ? { leagueId: params.sourceLeagueId, seasonId: params.sourceSeasonId, leagueName: params.sourceLeagueName?.slice(0, 80) } : null
  return <RapidTournamentCreateForm initialSource={initialSource} />
}
