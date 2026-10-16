import { RapidTournamentPage } from "@/components/tournament/RapidTournamentPage"

export default async function TournamentLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RapidTournamentPage tournamentId={id} view="live" />
}
