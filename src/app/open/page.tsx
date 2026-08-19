import { Suspense } from "react"
import { LeagueNotificationRedirect } from "@/components/notifications/LeagueNotificationRedirect"
import { LeagueOpenLoadingCard } from "@/components/notifications/LeagueOpenLoadingCard"

export const dynamic = "force-dynamic"

export default function OpenLeaguePage() {
  return (
    <div className="w-full">
      <Suspense
        fallback={<LeagueOpenLoadingCard />}
      >
        <LeagueNotificationRedirect />
      </Suspense>
    </div>
  )
}
