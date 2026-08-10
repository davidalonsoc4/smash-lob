import { PlayerProfileScreen } from "@/components/player/PlayerProfileScreen"

type PlayerPageProps = {
  params: Promise<{ id: string }>
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params

  return <PlayerProfileScreen playerIdOrSlug={id} mode="public" />
}
