import type { ReactNode } from "react"
import { Skeleton } from "@/components/ui/Skeleton"

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-200 text-neutral-950">
      <div className="mx-auto min-h-screen max-w-md bg-stone-50 px-3 pb-24 pt-[max(20px,calc(var(--app-safe-top)+20px))] shadow-[0_0_32px_rgba(15,23,42,0.06)]">
        {children}
      </div>
    </div>
  )
}

function HeaderSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <header className="pt-2">
      <Skeleton className="h-3 w-32" />
      <Skeleton className={`mt-3 ${compact ? "h-6 w-40" : "h-8 w-52"}`} />
      <Skeleton className="mt-3 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </header>
  )
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <Skeleton rounded="full" className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-3 ${index === rows - 1 ? "w-3/5" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  )
}

export function AppBootSkeleton() {
  return (
    <PageFrame>
      <div role="status" aria-label="Cargando Smash & Lob" aria-busy="true" className="space-y-4">
        <div className="flex items-center justify-between pt-3">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-44" />
          </div>
          <Skeleton rounded="full" className="h-10 w-10" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-2xl bg-white p-3 shadow-sm dark:bg-neutral-900">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="mt-3 h-7 w-14" />
            </div>
          ))}
        </div>
        <CardSkeleton rows={4} />
        <CardSkeleton rows={2} />
      </div>
    </PageFrame>
  )
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Cargando inicio" aria-busy="true" className="space-y-4">
      <HeaderSkeleton />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-2xl bg-white p-3 shadow-sm dark:bg-neutral-900">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <CardSkeleton rows={4} />
      <CardSkeleton rows={3} />
    </div>
  )
}

export function ListPageSkeleton({ label = "Cargando contenido" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true" className="space-y-4">
      <HeaderSkeleton />
      <div className="rounded-3xl bg-white p-3 shadow-sm dark:bg-neutral-900">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12" rounded="2xl" />
          <Skeleton className="h-12" rounded="2xl" />
        </div>
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <CardSkeleton key={index} rows={index === 0 ? 4 : 3} />
      ))}
    </div>
  )
}

export function RankingSkeleton() {
  return (
    <div role="status" aria-label="Cargando clasificación" aria-busy="true" className="space-y-4">
      <HeaderSkeleton />
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-neutral-900">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-0 dark:border-neutral-800">
            <Skeleton className="h-4 w-5" />
            <Skeleton rounded="full" className="h-9 w-9" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div role="status" aria-label="Cargando detalle" aria-busy="true" className="space-y-4">
      <HeaderSkeleton compact />
      <CardSkeleton rows={5} />
      <CardSkeleton rows={3} />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-11" rounded="2xl" />
        <Skeleton className="h-11" rounded="2xl" />
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Cargando ajustes" aria-busy="true" className="space-y-4">
      <HeaderSkeleton compact />
      {Array.from({ length: 4 }, (_, sectionIndex) => (
        <section key={sectionIndex}>
          <Skeleton className="mb-2 h-3 w-28" />
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm dark:bg-neutral-900">
            {Array.from({ length: sectionIndex === 0 ? 4 : 3 }, (_, rowIndex) => (
              <div key={rowIndex} className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 last:border-0 dark:border-neutral-800">
                <Skeleton rounded="full" className="h-9 w-9" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-3/4" />
                </div>
                <Skeleton className="h-5 w-5" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function LeagueTransitionSkeleton({ leagueName }: { leagueName: string }) {
  return (
    <PageFrame>
      <div role="status" aria-label={`Cargando ${leagueName}`} aria-busy="true" className="space-y-5 pt-8">
        <div className="text-center">
          <Skeleton rounded="full" className="mx-auto h-16 w-16" />
          <Skeleton className="mx-auto mt-4 h-6 w-48" />
          <p className="mt-3 text-sm font-semibold text-neutral-500">Preparando {leagueName}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-20" rounded="2xl" />
          ))}
        </div>
        <CardSkeleton rows={4} />
      </div>
    </PageFrame>
  )
}

export function ProfileCardSkeleton() {
  return (
    <div role="status" aria-label="Cargando perfil" aria-busy="true" className="space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton rounded="full" className="h-14 w-14" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" rounded="2xl" />
      <Skeleton className="h-10 w-full" rounded="2xl" />
    </div>
  )
}
