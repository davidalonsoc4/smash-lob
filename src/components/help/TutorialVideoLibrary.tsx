"use client"

import { useEffect, useRef, useState } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { TutorialVideoCard } from "@/components/help/TutorialVideoCard"
import { fetchTutorialVideoUrl, fetchTutorials, markTutorialSeen } from "@/lib/tutorialVideosClient"
import type { TutorialSummary } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

/** Video tutorials inside Help. Shows only what this person may see; nothing at all when there are none. */
export function TutorialVideoLibrary() {
  const { tx } = useI18n()
  const [tutorials, setTutorials] = useState<TutorialSummary[] | null>(null)
  const [current, setCurrent] = useState<TutorialSummary | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const marked = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchTutorials().then((list) => { if (!cancelled) setTutorials(list ?? []) })
    return () => { cancelled = true }
  }, [])

  async function open(tutorial: TutorialSummary) {
    setCurrent(tutorial)
    setVideoUrl(null)
    setFailed(false)
    marked.current = null
    const url = await fetchTutorialVideoUrl(tutorial.id)
    if (url) setVideoUrl(url)
    else setFailed(true)
  }
  function close() {
    setCurrent(null)
    setVideoUrl(null)
  }
  function seen() {
    if (!current || marked.current === current.id) return
    marked.current = current.id
    const id = current.id
    setTutorials((list) => list?.map((item) => (item.id === id ? { ...item, seen: true } : item)) ?? list)
    void markTutorialSeen(id)
  }

  if (!tutorials?.length) return null
  const pending = tutorials.filter((item) => !item.seen).length
  return (
    <section id="videos-tutoriales" className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">{tx("Vídeos")}</p>
      <h2 className="mt-1 type-panel-title text-neutral-950">{tx("Vídeos tutoriales")}</h2>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {pending ? tx("Aprende a usar la app en pocos minutos. Te faltan por ver:") + ` ${pending}` : tx("Los has visto todos. Puedes repetir el que quieras.")}
      </p>
      <div className="mt-3 grid gap-2">
        {tutorials.map((tutorial) => (
          <TutorialVideoCard key={tutorial.id} tutorial={tutorial} onOpen={() => void open(tutorial)} badge={tutorial.seen ? undefined : tx("Nuevo")} />
        ))}
      </div>
      <FloatingDialog open={Boolean(current)} onClose={close} title={current?.title ?? tx("Vídeos tutoriales")} variant="content">
        {current ? (
          <div className="space-y-3 p-3">
            <div className="flex items-center gap-2">
              <h2 className="min-w-0 flex-1 truncate font-bold">{current.title}</h2>
              <DialogCloseButton onClick={close} />
            </div>
            {videoUrl ? (
              <video
                src={videoUrl}
                poster={current.posterUrl ?? undefined}
                controls
                playsInline
                autoPlay
                preload="metadata"
                onPlay={seen}
                className="max-h-[70vh] w-full rounded-xl bg-black"
                style={current.width && current.height ? { aspectRatio: `${current.width} / ${current.height}` } : undefined}
              />
            ) : failed ? (
              <p role="alert" className="text-sm font-bold text-red-700">{tx("No se ha podido cargar el vídeo.")}</p>
            ) : (
              <p className="text-sm font-semibold text-neutral-600">{tx("Cargando el vídeo…")}</p>
            )}
            {current.description ? <p className="text-sm font-semibold leading-6 text-neutral-700">{current.description}</p> : null}
          </div>
        ) : null}
      </FloatingDialog>
    </section>
  )
}
