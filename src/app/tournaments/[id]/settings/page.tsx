import { RapidTournamentSettings } from "@/components/tournament/RapidTournamentSettings"

export default async function TournamentSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RapidTournamentSettings tournamentId={id} />
}
