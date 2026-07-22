import { Suspense } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { LeagueNotificationRedirect } from "@/components/notifications/LeagueNotificationRedirect"

export const dynamic = "force-dynamic"

export default function OpenLeaguePage() {
  return (
    <div className="w-full">
      <Suspense
        fallback={
          <AppCard>
            <p className="font-black">Abriendo liga</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              Comprobando el acceso y cargando la liga correcta…
            </p>
          </AppCard>
        }
      >
        <LeagueNotificationRedirect />
      </Suspense>
    </div>
  )
}
