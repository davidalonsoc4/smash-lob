"use client"

import { useCallback, useEffect, useState } from "react"
import { TutorialForm } from "@/components/admin/TutorialForm"
import { TutorialPreviewDialog } from "@/components/admin/TutorialPreviewDialog"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { EmptyState } from "@/components/ui/EmptyState"
import { FloatingDialog } from "@/components/ui/FloatingDialog"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { deleteTutorial, fetchAdminTutorials, reorderTutorials, type TutorialLeagueOption } from "@/lib/tutorialVideosClient"
import { formatTutorialDuration, type TutorialAdminItem } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

const EMPTY_DRAFT = { title: "", description: "", audience: "draft" as const, leagueIds: [] as string[], publishAt: null as string | null }

export default function AdminTutorialsPage() {
  const { tx, locale } = useI18n()
  const { isSuperuser, isAppAdmin } = useLeagueAccess()
  const canManage = isSuperuser || isAppAdmin
  const [items, setItems] = useState<TutorialAdminItem[] | null>(null)
  const [leagues, setLeagues] = useState<TutorialLeagueOption[]>([])
  const [error, setError] = useState(false)
  const [form, setForm] = useState<{ editing: TutorialAdminItem | null } | null>(null)
  const [preview, setPreview] = useState<TutorialAdminItem | null>(null)

  const load = useCallback(async () => {
    const data = await fetchAdminTutorials()
    if (!data) { setError(true); return }
    setError(false)
    setItems(data.tutorials)
    setLeagues(data.leagues)
  }, [])
  useEffect(() => {
    if (!canManage) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [canManage, load])

  async function move(index: number, direction: -1 | 1) {
    if (!items) return
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    if (!(await reorderTutorials(next.map((item) => item.id)))) void load()
  }
  async function remove(item: TutorialAdminItem) {
    if (!window.confirm(tx("¿Eliminar este tutorial y su vídeo? No se puede deshacer."))) return
    if (await deleteTutorial(item.id)) void load()
    else setError(true)
  }
  const audienceLabel = (item: TutorialAdminItem) =>
    item.audience === "public" ? tx("Público") : item.audience === "leagues" ? `${tx("Ligas")}: ${item.leagueIds.map((id) => leagues.find((league) => league.id === id)?.name ?? "—").join(", ")}` : tx("Borrador")

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/admin" label={tx("Volver")} />
        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">{tx("Tutoriales")}</h1>
      </header>
      {!canManage ? (
        <EmptyState title={tx("Sin acceso")} description={tx("Solo el administrador de la aplicación gestiona los tutoriales.")} />
      ) : (
        <>
          <button type="button" onClick={() => setForm({ editing: null })} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-center text-sm font-black text-white">
            + {tx("Añadir vídeo")}
          </button>
          {error ? <p role="alert" className="text-sm font-bold text-red-700">{tx("No se ha podido completar la operación.")}</p> : null}
          {items?.length === 0 ? <EmptyState title={tx("Aún no hay tutoriales")} description={tx("Sube el primer vídeo para empezar.")} /> : null}
          {items?.map((item, index) => (
            <AppCard key={item.id} className="space-y-2 !p-3">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => setPreview(item)} aria-label={`${tx("Ver")}: ${item.title}`} className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {item.posterUrl ? <img src={item.posterUrl} alt="" className="h-full w-full object-cover" /> : null}
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center"><span className="chat-media-overlay flex h-8 w-8 items-center justify-center rounded-full"><svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4"><path d="M8 5v14l11-7z" /></svg></span></span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-neutral-950">{item.title}</p>
                  <p className="text-xs font-semibold text-neutral-600">{audienceLabel(item)}</p>
                  {item.publishAt ? <p data-tutorial-scheduled className="text-xs font-black text-neutral-950">{tx("Programado para")} {new Date(item.publishAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</p> : null}
                  {item.announceFailures.length ? <p data-tutorial-announce-pending className="mt-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-950">{tx("Aviso sin enviar en el chat de:")} {item.announceFailures.map((failure) => leagues.find((league) => league.id === failure.leagueId)?.name ?? "—").join(", ")}. {tx("Sin temporada en curso o sin comenzar. Edita y guarda para reintentarlo.")}</p> : null}
                  <p className="text-xs font-semibold text-neutral-600">{[formatTutorialDuration(item.durationMs), `${item.viewCount} ${tx(item.viewCount === 1 ? "visto" : "vistos")}`].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setPreview(item)} data-tutorial-view className="inline-flex min-h-9 items-center justify-center rounded-full text-center bg-neutral-950 px-4 text-sm font-bold text-white">{tx("Ver")}</button>
                <button type="button" disabled={index === 0} onClick={() => void move(index, -1)} aria-label={tx("Subir")} className="inline-flex min-h-9 items-center justify-center rounded-full text-center bg-neutral-100 px-3 text-sm font-bold disabled:opacity-40">↑</button>
                <button type="button" disabled={index === items.length - 1} onClick={() => void move(index, 1)} aria-label={tx("Bajar")} className="inline-flex min-h-9 items-center justify-center rounded-full text-center bg-neutral-100 px-3 text-sm font-bold disabled:opacity-40">↓</button>
                <button type="button" onClick={() => setForm({ editing: item })} className="inline-flex min-h-9 items-center justify-center rounded-full text-center bg-neutral-100 px-3 text-sm font-bold">{tx("Editar")}</button>
                <button type="button" onClick={() => void remove(item)} className="inline-flex min-h-9 items-center justify-center rounded-full text-center bg-neutral-100 px-3 text-sm font-bold text-red-700 app-danger-action">{tx("Eliminar")}</button>
              </div>
            </AppCard>
          ))}
          <TutorialPreviewDialog tutorial={preview} onClose={() => setPreview(null)} />
          <FloatingDialog open={Boolean(form)} onClose={() => setForm(null)} title={form?.editing ? tx("Editar tutorial") : tx("Nuevo tutorial")} className="league-chat-edit-dialog tutorial-form-dialog">
            {form ? (
              <TutorialForm
                editingId={form.editing?.id ?? null}
                initial={form.editing ? { title: form.editing.title, description: form.editing.description, audience: form.editing.audience, leagueIds: form.editing.leagueIds, publishAt: form.editing.publishAt } : EMPTY_DRAFT}
                leagues={leagues}
                announcedLeagueIds={form.editing?.announcedLeagueIds ?? []}
                onDone={() => { setForm(null); void load() }}
                onCancel={() => setForm(null)}
              />
            ) : null}
          </FloatingDialog>
        </>
      )}
    </div>
  )
}
