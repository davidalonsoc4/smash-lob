"use client"

import { useEffect, useState } from "react"
import { TutorialPlayerDialog, TutorialVideoCard } from "@/components/help/TutorialVideoCard"
import { fetchTutorials } from "@/lib/tutorialVideosClient"
import type { TutorialSummary } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

const PREVIEW_COUNT = 4

/** Video tutorials inside Help. Shows only what this person may see; nothing at all when there are none. */
export function TutorialVideoLibrary({ onLoaded }: { onLoaded?: (count: number) => void } = {}) {
  const { tx } = useI18n()
  const [tutorials, setTutorials] = useState<TutorialSummary[] | null>(null)
  const [current, setCurrent] = useState<TutorialSummary | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchTutorials().then((list) => { if (!cancelled) { setTutorials(list ?? []); onLoaded?.(list?.length ?? 0) } })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function markSeen(id: string) {
    setTutorials((list) => list?.map((item) => (item.id === id ? { ...item, seen: true } : item)) ?? list)
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
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
        {(showAll ? tutorials : tutorials.slice(0, PREVIEW_COUNT)).map((tutorial) => (
          <TutorialVideoCard key={tutorial.id} tutorial={tutorial} onOpen={() => setCurrent(tutorial)} badge={tutorial.seen ? undefined : tx("Nuevo")} />
        ))}
      </div>
      {tutorials.length > PREVIEW_COUNT ? (
        <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-2 flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-xs font-black text-neutral-700">
          {showAll ? tx("Ver menos") : `${tx("Ver todos los vídeos")} (${tutorials.length})`}
        </button>
      ) : null}
      <TutorialPlayerDialog tutorial={current} onClose={() => setCurrent(null)} onSeen={markSeen} />
    </section>
  )
}
