"use client"

import { useState, type ChangeEvent } from "react"
import { inspectMp4, moveMoovToFront } from "@/lib/mp4"
import { extractVideoPoster } from "@/lib/videoPoster"
import { TUTORIAL_FILE_ACCEPT, getTutorialFileRule, type TutorialAudience } from "@/lib/tutorialVideos"
import { createTutorial, updateTutorial, uploadTutorialFile, type TutorialDraft, type TutorialLeagueOption } from "@/lib/tutorialVideosClient"
import { useI18n } from "@/i18n/I18nProvider"

type Picked = { file: File; poster: Blob | null; width: number | null; height: number | null; durationMs: number | null }

/** Create (with a video) or edit (text, audience and leagues) a tutorial. */
export function TutorialForm({ editingId, initial, leagues, onDone, onCancel }: {
  editingId: string | null
  initial: TutorialDraft
  leagues: TutorialLeagueOption[]
  onDone: () => void
  onCancel: () => void
}) {
  const { tx } = useI18n()
  const [draft, setDraft] = useState<TutorialDraft>(initial)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [customPoster, setCustomPoster] = useState<File | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const valid = draft.title.trim().length > 0 && (editingId !== null || picked !== null) && (draft.audience !== "leagues" || draft.leagueIds.length > 0)

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getTutorialFileRule(file.type)
    if (!rule || rule.kind !== "video" || file.size > rule.maxBytes) {
      setError(tx("Solo se admiten vídeos MP4 de hasta 50 MB."))
      return
    }
    setError(null)
    let prepared = file
    const info = await inspectMp4(file).catch(() => null)
    if (info && !info.faststart && !info.fragmented) {
      const moved = await moveMoovToFront(file).catch(() => null)
      if (moved) prepared = new File([moved], file.name, { type: "video/mp4" })
    }
    const poster = await extractVideoPoster(prepared)
    setPicked({ file: prepared, poster: poster?.blob ?? null, width: poster?.width ?? null, height: poster?.height ?? null, durationMs: poster?.durationMs ?? null })
    if (!draft.title.trim()) setDraft((current) => ({ ...current, title: file.name.replace(/\.mp4$/i, "").replace(/[_-]+/g, " ").trim() }))
  }

  function pickPoster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const rule = getTutorialFileRule(file.type)
    if (!rule || rule.kind !== "poster" || file.size > rule.maxBytes) {
      setError(tx("La miniatura debe ser una imagen JPG, PNG o WebP de hasta 5 MB."))
      return
    }
    setError(null)
    setCustomPoster(file)
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const fields = { ...draft, title: draft.title.trim(), description: draft.description.trim() }
    if (editingId) {
      const newPosterPath = customPoster ? await uploadTutorialFile(customPoster, customPoster.type) : null
      if (customPoster && !newPosterPath) { setBusy(false); setError(tx("No se ha podido subir la miniatura.")); return }
      const saved = await updateTutorial(editingId, { ...fields, ...(newPosterPath ? { posterPath: newPosterPath } : {}) })
      setBusy(false)
      if (saved) onDone()
      else setError(tx("No se ha podido guardar."))
      return
    }
    if (!picked) return
    const videoPath = await uploadTutorialFile(picked.file, "video/mp4", setProgress)
    if (!videoPath) { setBusy(false); setProgress(null); setError(tx("No se ha podido subir el vídeo. Revisa la conexión.")); return }
    // A thumbnail chosen by hand wins over the frame taken automatically from the video.
    const posterPath = customPoster
      ? await uploadTutorialFile(customPoster, customPoster.type)
      : picked.poster ? await uploadTutorialFile(picked.poster, "image/jpeg") : null
    const created = await createTutorial({ ...fields, videoPath, posterPath, width: picked.width, height: picked.height, durationMs: picked.durationMs })
    setBusy(false)
    setProgress(null)
    if (created) onDone()
    else setError(tx("No se ha podido guardar el tutorial."))
  }

  const audiences: { value: TutorialAudience; label: string; hint: string }[] = [
    { value: "draft", label: tx("Borrador"), hint: tx("Solo lo ves tú. No lo ve nadie más.") },
    { value: "public", label: tx("Público"), hint: tx("Lo ve cualquier persona con sesión en la app.") },
    { value: "leagues", label: tx("Solo ligas elegidas"), hint: tx("Solo lo ven los miembros de las ligas que marques.") },
  ]
  const toggleLeague = (id: string) => setDraft((current) => ({ ...current, leagueIds: current.leagueIds.includes(id) ? current.leagueIds.filter((item) => item !== id) : [...current.leagueIds, id] }))

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate font-bold">{editingId ? tx("Editar tutorial") : tx("Nuevo tutorial")}</h2>
        <button type="submit" disabled={!valid || busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white disabled:opacity-40">
          {busy ? tx("Guardando…") : tx("Guardar")}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold">{tx("Cancelar")}</button>
      </div>
      {!editingId ? (
        <label className="block text-xs font-semibold text-neutral-600">
          {tx("Vídeo (MP4, hasta 50 MB)")}
          <input type="file" accept={TUTORIAL_FILE_ACCEPT} disabled={busy} onChange={pick} className="mt-1 block w-full text-sm" />
          {picked ? <span className="mt-1 block text-xs font-bold text-neutral-700">{picked.file.name} · {(picked.file.size / 1048576).toFixed(1)} MB</span> : null}
        </label>
      ) : null}
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Miniatura (opcional)")}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={pickPoster} className="mt-1 block w-full text-sm" />
        <span className="mt-1 block text-xs font-semibold text-neutral-600">
          {customPoster ? `${customPoster.name} · ${(customPoster.size / 1048576).toFixed(1)} MB` : editingId ? tx("Si no eliges una, se mantiene la actual.") : tx("Si no eliges una, se usa un fotograma del vídeo.")}
        </span>
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Título")}
        <input value={draft.title} maxLength={120} disabled={busy} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950" />
      </label>
      <label className="block text-xs font-semibold text-neutral-600">
        {tx("Descripción")}
        <textarea value={draft.description} rows={2} maxLength={500} disabled={busy} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1 w-full rounded-lg border border-neutral-400 p-2 text-base text-neutral-950" />
      </label>
      <fieldset className="space-y-1.5" disabled={busy}>
        <legend className="text-xs font-semibold text-neutral-600">{tx("¿Quién lo ve?")}</legend>
        {audiences.map((option) => (
          <label key={option.value} className="flex items-start gap-2 rounded-xl bg-neutral-100 p-2">
            <input type="radio" name="tutorial-audience" checked={draft.audience === option.value} onChange={() => setDraft({ ...draft, audience: option.value })} className="mt-1" />
            <span><span className="block text-sm font-black text-neutral-950">{option.label}</span><span className="block text-xs font-semibold text-neutral-600">{option.hint}</span></span>
          </label>
        ))}
      </fieldset>
      {draft.audience === "leagues" ? (
        <fieldset className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-neutral-300 p-2" disabled={busy}>
          <legend className="px-1 text-xs font-semibold text-neutral-600">{tx("Ligas")}</legend>
          {leagues.map((league) => (
            <label key={league.id} className="flex items-center gap-2 py-1 text-sm font-semibold text-neutral-950">
              <input type="checkbox" checked={draft.leagueIds.includes(league.id)} onChange={() => toggleLeague(league.id)} />
              <span className="min-w-0 truncate">{league.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {progress !== null ? <div role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-neutral-200"><div className="h-full bg-neutral-950" style={{ width: `${Math.round(progress * 100)}%` }} /></div> : null}
      {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
    </form>
  )
}
