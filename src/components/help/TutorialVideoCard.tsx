"use client"

import { useEffect, useRef, useState } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { fetchTutorialVideoUrl, markTutorialSeen } from "@/lib/tutorialVideosClient"
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
    <button type="button" onClick={onOpen} className="flex w-full min-w-0 max-w-full items-stretch gap-3 overflow-hidden rounded-2xl bg-neutral-100 p-2 text-left transition active:scale-[0.99]">
      <span className="relative block h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-black">
        {tutorial.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tutorial.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="chat-media-overlay flex h-9 w-9 items-center justify-center rounded-full">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        {duration ? <span className="chat-media-overlay absolute bottom-1 right-1 rounded px-1 text-xs font-bold">{duration}</span> : null}
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

/** Plays one tutorial video in a dialog and marks it as seen when it starts. Shared by Help and each screen's help button. */
export function TutorialPlayerDialog({ tutorial, onClose, onSeen }: { tutorial: TutorialSummary | null; onClose: () => void; onSeen?: (id: string) => void }) {
  const { tx } = useI18n()
  const [loaded, setLoaded] = useState<{ id: string; url: string | null } | null>(null)
  const marked = useRef<string | null>(null)
  const id = tutorial?.id ?? null

  useEffect(() => {
    if (!id) return
    let cancelled = false
    marked.current = null
    void fetchTutorialVideoUrl(id).then((url) => { if (!cancelled) setLoaded({ id, url }) })
    return () => { cancelled = true }
  }, [id])

  function seen() {
    if (!tutorial || marked.current === tutorial.id) return
    marked.current = tutorial.id
    onSeen?.(tutorial.id)
    void markTutorialSeen(tutorial.id)
  }

  const current = loaded && loaded.id === id ? loaded : null
  const videoUrl = current?.url ?? null
  const failed = Boolean(current) && !videoUrl

  return (
    <FloatingDialog open={Boolean(tutorial)} onClose={onClose} title={tutorial?.title ?? tx("Vídeos tutoriales")} variant="content">
      {tutorial ? (
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-bold">{tutorial.title}</h2>
            <DialogCloseButton onClick={onClose} />
          </div>
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={tutorial.posterUrl ?? undefined}
              controls
              playsInline
              autoPlay
              preload="metadata"
              onPlay={seen}
              className="max-h-[70vh] w-full rounded-xl bg-black"
              style={tutorial.width && tutorial.height ? { aspectRatio: `${tutorial.width} / ${tutorial.height}` } : undefined}
            />
          ) : failed ? (
            <p role="alert" className="text-sm font-bold text-red-700">{tx("No se ha podido cargar el vídeo.")}</p>
          ) : (
            <p className="text-sm font-semibold text-neutral-600">{tx("Cargando el vídeo…")}</p>
          )}
          {tutorial.description ? <p className="text-sm font-semibold leading-6 text-neutral-700">{tutorial.description}</p> : null}
        </div>
      ) : null}
    </FloatingDialog>
  )
}
