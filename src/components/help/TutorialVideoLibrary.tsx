"use client"

import { useEffect, useMemo, useState } from "react"
import { TutorialPlayerDialog, TutorialVideoCard } from "@/components/help/TutorialVideoCard"
import { fetchTutorials } from "@/lib/tutorialVideosClient"
import type { TutorialGroup, TutorialSummary } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

const PREVIEW_COUNT = 4
const groupOf = (tutorial: TutorialSummary): TutorialGroup => tutorial.group ?? "generic"

/** Video tutorials inside Help. Shows only what this person may see; nothing at all when there are none. */
export function TutorialVideoLibrary({ onLoaded }: { onLoaded?: (count: number) => void } = {}) {
  const { tx } = useI18n()
  const [tutorials, setTutorials] = useState<TutorialSummary[] | null>(null)
  const [current, setCurrent] = useState<TutorialSummary | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [chosenTab, setChosenTab] = useState<TutorialGroup | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchTutorials().then((list) => {
      if (cancelled) return
      // Social media material is for the managers and has its own tab; the others only get what is theirs to see.
      setTutorials(list ?? [])
      onLoaded?.((list ?? []).filter((item) => groupOf(item) !== "social").length)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function markSeen(id: string) {
    setTutorials((list) => list?.map((item) => (item.id === id ? { ...item, seen: true } : item)) ?? list)
  }

  const byGroup = useMemo(() => {
    const groups: Record<TutorialGroup, TutorialSummary[]> = { generic: [], leagues: [], social: [] }
    for (const tutorial of tutorials ?? []) groups[groupOf(tutorial)].push(tutorial)
    return groups
  }, [tutorials])

  /** League videos grouped by league: a video shared by several leagues shows under each of them. */
  const leagueSections = useMemo(() => {
    const sections = new Map<string, { id: string; name: string; items: TutorialSummary[] }>()
    for (const tutorial of byGroup.leagues) {
      for (const league of tutorial.leagues ?? []) {
        const section = sections.get(league.id) ?? { id: league.id, name: league.name, items: [] }
        section.items.push(tutorial)
        sections.set(league.id, section)
      }
    }
    return [...sections.values()].sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [byGroup.leagues])

  if (!tutorials?.length) return null

  const tabs = ([
    { id: "generic" as const, label: tx("Genéricos") },
    { id: "leagues" as const, label: tx("Ligas") },
    { id: "social" as const, label: tx("Redes") },
  ]).filter((tab) => byGroup[tab.id].length > 0)
  const active = tabs.find((tab) => tab.id === chosenTab)?.id ?? tabs[0].id
  const visible = byGroup[active]
  const pending = visible.filter((item) => !item.seen).length

  const card = (tutorial: TutorialSummary, key = tutorial.id) => (
    <TutorialVideoCard key={key} tutorial={tutorial} onOpen={() => setCurrent(tutorial)} badge={tutorial.draft ? tx("Borrador") : tutorial.seen ? undefined : tx("Nuevo")} />
  )

  return (
    <section id="videos-tutoriales" className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-400">{tx("Vídeos")}</p>
      <h2 className="mt-1 type-panel-title text-neutral-950">{tx("Vídeos tutoriales")}</h2>
      {tabs.length > 1 ? (
        <div role="tablist" aria-label={tx("Tipos de vídeo")} className="mt-2 flex gap-1 rounded-2xl bg-neutral-100 p-1">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" id={`video-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls="video-tab-panel"
              onClick={() => { setChosenTab(tab.id); setShowAll(false) }}
              className={`flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-center text-xs font-black transition ${active === tab.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div role={tabs.length > 1 ? "tabpanel" : undefined} id="video-tab-panel" aria-labelledby={tabs.length > 1 ? `video-tab-${active}` : undefined}>
        {active === "social" ? (
          <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">{tx("Material para redes sociales. Solo lo ves tú.")}</p>
        ) : active === "leagues" ? (
          <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
            {pending ? tx("Vídeos de tus ligas. Te faltan por ver:") + ` ${pending}` : tx("Vídeos de tus ligas. Los has visto todos.")}
          </p>
        ) : (
          <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
            {pending ? tx("Aprende a usar la app en pocos minutos. Te faltan por ver:") + ` ${pending}` : tx("Los has visto todos. Puedes repetir el que quieras.")}
          </p>
        )}
        {active === "leagues" ? (
          leagueSections.length === 1 ? (
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
              <p className="px-1 text-xs font-black text-neutral-950">{leagueSections[0].name}</p>
              {leagueSections[0].items.map((tutorial) => card(tutorial))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {leagueSections.map((section, index) => (
                <details key={section.id} open={index === 0} data-league-videos className="group rounded-2xl border border-neutral-200 p-2">
                  <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-1 text-sm font-black text-neutral-950 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 truncate">{section.name}</span>
                    <span className="shrink-0 text-xs font-bold text-neutral-500">{section.items.length}</span>
                    <span aria-hidden="true" className="shrink-0 text-neutral-400 transition group-open:rotate-90">›</span>
                  </summary>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-2">{section.items.map((tutorial) => card(tutorial, `${section.id}-${tutorial.id}`))}</div>
                </details>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-2">
              {(showAll ? visible : visible.slice(0, PREVIEW_COUNT)).map((tutorial) => card(tutorial))}
            </div>
            {visible.length > PREVIEW_COUNT ? (
              <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-2 flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-center text-xs font-black text-neutral-700">
                {showAll ? tx("Ver menos") : `${tx("Ver todos los vídeos")} (${visible.length})`}
              </button>
            ) : null}
          </>
        )}
      </div>
      <TutorialPlayerDialog tutorial={current} onClose={() => setCurrent(null)} onSeen={markSeen} />
    </section>
  )
}
