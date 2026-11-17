"use client"

import { formatTutorialDuration, type TutorialSummary } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

/** One tutorial as a tappable card: thumbnail, title, duration and a short description. */
export function TutorialVideoCard({ tutorial, onOpen, badge }: {
  tutorial: TutorialSummary
  onOpen: () => void
  /** Optional small label (for example "Nuevo"). */
  badge?: string
}) {
  const { tx } = useI18n()
  const duration = formatTutorialDuration(tutorial.durationMs)
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-stretch gap-3 rounded-2xl bg-neutral-100 p-2 text-left transition active:scale-[0.99]">
      <span className="relative block h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-neutral-950">
        {tutorial.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tutorial.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        {duration ? <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 text-xs font-bold text-white">{duration}</span> : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-black text-neutral-950">{tutorial.title}</span>
          {badge ? <span className="shrink-0 rounded-full bg-neutral-950 px-2 py-0.5 text-xs font-black text-white">{badge}</span> : null}
        </span>
        {tutorial.description ? <span className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-neutral-600">{tutorial.description}</span> : null}
        {tutorial.seen ? <span className="mt-0.5 text-xs font-semibold text-neutral-600">{tx("Visto")}</span> : null}
      </span>
    </button>
  )
}
