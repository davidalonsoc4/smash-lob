import { TournamentInviteFlow } from "@/components/tournament/RapidTournamentPage"

export default async function TournamentInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <TournamentInviteFlow code={decodeURIComponent(code)} />
}
