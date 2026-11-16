import { PublicPersonalMatchView } from "@/components/spectator/PublicPersonalMatchView"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PublicPersonalMatchPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <PublicPersonalMatchView code={decodeURIComponent(code ?? "").trim().toUpperCase()} />
}
