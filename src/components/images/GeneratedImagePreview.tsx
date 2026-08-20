"use client"

import Image from "next/image"
import { useI18n } from "@/i18n/I18nProvider"

export function GeneratedImagePreview({
  previewUrl,
  loading,
  error,
  title,
  meta = "PNG · 1080 px",
}: {
  previewUrl: string | null
  loading: boolean
  error: boolean
  title: string
  meta?: string
}) {
  const { tx } = useI18n()

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-[0_18px_45px_rgba(0,0,0,.2)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="type-caption font-black uppercase tracking-[.18em] text-neutral-400">
            {tx("Vista previa")}
          </p>
          <p className="mt-0.5 truncate text-xs font-black text-white">{title}</p>
        </div>
        <span className="shrink-0 type-caption font-bold text-neutral-400">{meta}</span>
      </div>

      <div
        className="relative h-[min(68vh,620px)] min-h-[360px] bg-[radial-gradient(circle_at_50%_28%,#2a2a2a,#050505_68%)] sm:min-h-[440px]"
        aria-busy={loading}
      >
        {previewUrl ? (
          <Image
            unoptimized
            fill
            src={previewUrl}
            alt={`${tx("Vista previa")} · ${title}`}
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-contain p-2"
          />
        ) : null}

        {loading ? (
          <div className="absolute inset-0 grid place-items-center bg-neutral-950/35 px-6 text-center type-caption font-black uppercase tracking-[.18em] text-neutral-400">
            {tx("Preparando…")}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="absolute inset-0 grid place-items-center px-8 text-center text-xs font-bold leading-5 text-red-200">
            {tx("No se ha podido construir la vista previa.")}
          </div>
        ) : null}
      </div>
    </div>
  )
}
