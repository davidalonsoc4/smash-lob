"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"

export function AppErrorView({
  title,
  description,
  incidenceCode,
  onRetry,
}: {
  title: string
  description: string
  incidenceCode?: string
  onRetry?: () => void
}) {
  const { tx } = useI18n()
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
      <AppCard className="w-full max-w-sm">
        <h1 className="text-2xl font-black tracking-tight text-neutral-950">
          {title}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-neutral-600">
          {description}
        </p>
        {incidenceCode ? (
          <p
            className="mt-4 rounded-2xl bg-neutral-100 px-3 py-3 text-xs font-black text-neutral-700"
            aria-live="polite"
          >
            {tx("Código de incidencia:")}{" "}{incidenceCode}
          </p>
        ) : null}
        <div className="mt-4 grid gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white items-center justify-center text-center"
            >
              {tx("Volver a intentarlo")}{" "}</button>
          ) : null}
          <Link
            href="/"
            className="inline-flex rounded-2xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-black text-neutral-800 items-center justify-center"
          >
            {tx("Ir al inicio")}{" "}</Link>
        </div>
      </AppCard>
    </main>
  )
}
