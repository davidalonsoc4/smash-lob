"use client"

import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

export function LeagueOpenLoadingCard() {
  const { tx } = useI18n()

  return (
    <AppCard>
      <p className="font-black">{tx("Abriendo liga")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Comprobando el acceso y cargando la liga correcta…")}
      </p>
    </AppCard>
  )
}
