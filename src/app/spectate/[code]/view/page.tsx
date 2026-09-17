import { PublicSpectatorView } from "@/components/spectator/PublicSpectatorView"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SpectatorPublicLeaguePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <PublicSpectatorView code={decodeURIComponent(code ?? "").trim().toUpperCase()} />
}
