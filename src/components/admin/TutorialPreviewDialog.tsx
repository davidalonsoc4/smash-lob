"use client"

import { useEffect, useState } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { fetchTutorialVideoUrl } from "@/lib/tutorialVideosClient"
import type { TutorialAdminItem } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

/** Plays a tutorial from the management screen, drafts included. It does not count as a view. */
export function TutorialPreviewDialog({ tutorial, onClose }: { tutorial: TutorialAdminItem | null; onClose: () => void }) {
  const { tx } = useI18n()
  const [loaded, setLoaded] = useState<{ id: string; url: string | null } | null>(null)
  const id = tutorial?.id ?? null

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchTutorialVideoUrl(id).then((url) => { if (!cancelled) setLoaded({ id, url }) })
    return () => { cancelled = true }
  }, [id])

  const result = loaded && loaded.id === id ? loaded : null
  return (
    <FloatingDialog open={Boolean(tutorial)} onClose={onClose} title={tutorial?.title ?? tx("Vídeos tutoriales")} variant="content">
      {tutorial ? (
        <div className="space-y-3 p-3" data-tutorial-preview>
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-bold">{tutorial.title}</h2>
            <DialogCloseButton onClick={onClose} />
          </div>
          {result?.url ? (
            <video
              src={result.url}
              poster={tutorial.posterUrl ?? undefined}
              controls
              playsInline
              autoPlay
              preload="metadata"
              className="max-h-[70vh] w-full rounded-xl bg-black"
              style={tutorial.width && tutorial.height ? { aspectRatio: `${tutorial.width} / ${tutorial.height}` } : undefined}
            />
          ) : result ? (
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
