import type { Metadata } from "next"
import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import {
  CHANGELOG_RELEASES,
  type ChangelogCategory,
} from "@/lib/changelog"

export const metadata: Metadata = {
  title: "Registro de cambios",
  description: "Historial público de versiones y novedades de Smash & Lob.",
}

const categoryCopy: Record<
  ChangelogCategory,
  { label: string; className: string }
> = {
  new: {
    label: "Novedad",
    className: "bg-neutral-950 text-white",
  },
  improvement: {
    label: "Mejora",
    className: "bg-neutral-200 text-neutral-700",
  },
  fix: {
    label: "Corrección",
    className: "border border-neutral-300 bg-white text-neutral-600",
  },
  foundation: {
    label: "Base",
    className: "bg-neutral-100 text-neutral-500",
  },
}

export default function ChangelogPage() {
  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="text-sm font-medium text-neutral-500">Smash & Lob</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Registro de cambios
        </h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Novedades, mejoras y correcciones documentadas desde la primera
          versión de la que conservamos un registro fiable.
        </p>
      </header>

      <AppCard className="overflow-hidden bg-neutral-950 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Versión actual
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight">
              Beta cerrada · {APP_VERSION_LABEL}
            </p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-950">
            Actual
          </span>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-neutral-300">
          Las revisiones menores aparecen agrupadas cuando comparten una misma
          línea de trabajo o no existe un detalle público completo de cada
          parche.
        </p>
      </AppCard>

      <div className="space-y-2">
        {CHANGELOG_RELEASES.map((release, index) => {
          const category = categoryCopy[release.category]

          return (
            <details
              key={release.version}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.045)]"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-neutral-950">
                      {release.version}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${category.className}`}
                    >
                      {category.label}
                    </span>
                    {index === 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                        Actual
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-base font-black tracking-tight text-neutral-950">
                    {release.title}
                  </p>
                  {release.date ? (
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                      {release.date}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                    {release.summary}
                  </p>
                </div>

                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-lg font-black text-neutral-500 transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-neutral-100 px-3 pb-3 pt-3">
                <ul className="space-y-2">
                  {release.changes.map((change) => (
                    <li
                      key={change}
                      className="flex gap-2 text-xs font-semibold leading-5 text-neutral-600"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400"
                      />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )
        })}
      </div>

      <AppCard className="bg-neutral-100 shadow-none">
        <p className="text-sm font-black text-neutral-950">
          Sobre este historial
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Este registro resume cambios visibles para los usuarios. No incluye
          credenciales, datos personales, configuraciones de infraestructura ni
          detalles internos de seguridad.
        </p>
        <Link
          href="/help"
          className="mt-3 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-neutral-700 shadow-sm"
        >
          Consultar la ayuda
        </Link>
      </AppCard>
    </div>
  )
}
