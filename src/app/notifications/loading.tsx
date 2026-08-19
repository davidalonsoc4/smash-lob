"use client"

import { ListPageSkeleton } from "@/components/loading/PageSkeletons"
import { useI18n } from "@/i18n/I18nProvider"

export default function Loading() {
  const { tx } = useI18n()

  return <ListPageSkeleton label={tx("Cargando notificaciones")} />
}
