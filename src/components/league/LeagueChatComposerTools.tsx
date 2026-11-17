"use client"

import { useState, type ChangeEvent, type RefObject } from "react"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import { LeagueChatMessageMenu } from "@/components/league/LeagueChatMessageMenu"
import { LeagueChatTutorialPicker } from "@/components/league/LeagueChatTutorialPicker"
import { LEAGUE_CHAT_MEDIA_ACCEPT } from "@/lib/leagueChatMedia"
import { useI18n } from "@/i18n/I18nProvider"

export const LEAGUE_CHAT_POLL_MAX_OPTIONS = 6
export const LEAGUE_CHAT_POLL_MIN_OPTIONS = 2

/**
 * The "+" next to the message bar: one button that opens what the person may send besides text
 * (photo or video, announcement, poll), instead of one button for each.
 */
export function LeagueChatComposerTools({ seasonId, canPublishMedia, canAnnounce, disabled, fileInputRef, onPickFile, onAnnounce, onCreatePoll, onShareTutorial }: {
  seasonId: string
  canPublishMedia: boolean
  canAnnounce: boolean
  disabled: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onPickFile: (event: ChangeEvent<HTMLInputElement>) => void
  onAnnounce: () => void
  /** Resolves true when the poll was published. */
  onCreatePoll: (question: string, options: string[]) => Promise<boolean>
  /** Posts an existing tutorial video instead of uploading a new one. Resolves true when it was posted. */
  onShareTutorial: (tutorialId: string, announcement: boolean) => Promise<boolean>
}) {
  const { tx } = useI18n()
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const [pollOpen, setPollOpen] = useState(false)
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const filled = options.map((option) => option.trim()).filter(Boolean)
  const distinct = new Set(filled.map((option) => option.toLowerCase())).size === filled.length
  const valid = question.trim().length > 0 && filled.length >= LEAGUE_CHAT_POLL_MIN_OPTIONS && distinct

  function closePoll() {
    if (busy) return
    setPollOpen(false)
    setFailed(false)
  }
  async function submitPoll() {
    if (!valid || busy) return
    setBusy(true)
    setFailed(false)
    const ok = await onCreatePoll(question.trim(), filled)
    setBusy(false)
    if (ok) {
      setPollOpen(false)
      setQuestion("")
      setOptions(["", ""])
    } else setFailed(true)
  }

  const items = [
    ...(canPublishMedia ? [
      { key: "media", icon: "image" as const, label: tx("Foto o vídeo"), onSelect: () => { setAnchor(null); fileInputRef.current?.click() } },
      { key: "tutorial", icon: "tutorial" as const, label: tx("Tutorial"), onSelect: () => { setAnchor(null); setTutorialOpen(true) } },
    ] : []),
    ...(canAnnounce ? [
      { key: "announce", icon: "megaphone" as const, label: tx("Novedad"), onSelect: () => { setAnchor(null); onAnnounce() } },
      { key: "poll", icon: "poll" as const, label: tx("Encuesta"), onSelect: () => { setAnchor(null); setPollOpen(true) } },
    ] : []),
  ]

  return (
    <>
      <input ref={fileInputRef} type="file" accept={LEAGUE_CHAT_MEDIA_ACCEPT} onChange={onPickFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => setAnchor(event.currentTarget.getBoundingClientRect())}
        aria-label={tx("Añadir")}
        aria-haspopup="menu"
        title={tx("Añadir")}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition active:scale-95 disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      {anchor ? <LeagueChatMessageMenu anchor={anchor} mine={false} items={items} label={tx("Añadir")} onClose={() => setAnchor(null)} /> : null}
      <LeagueChatTutorialPicker open={tutorialOpen} seasonId={seasonId} canAnnounce={canAnnounce} onClose={() => setTutorialOpen(false)} onShare={onShareTutorial} />
      <FloatingDialog open={pollOpen} onClose={closePoll} busy={busy} title={tx("Nueva encuesta")} className="league-chat-edit-dialog">
        {pollOpen ? (
          <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void submitPoll() }}>
            <div className="flex items-center gap-2">
              <h2 className="min-w-0 flex-1 truncate font-bold">{tx("Nueva encuesta")}</h2>
              <button type="submit" disabled={!valid || busy}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-center text-sm font-bold text-white disabled:opacity-40">
                {tx("Publicar encuesta")}
              </button>
              <DialogCloseButton onClick={closePoll} disabled={busy} />
            </div>
            <label className="block text-xs font-semibold text-neutral-600">
              {tx("Pregunta")}
              <textarea value={question} maxLength={300} rows={2} data-dialog-autofocus disabled={busy}
                onChange={(event) => setQuestion(event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-400 p-2 text-base text-neutral-950" />
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input value={option} maxLength={80} disabled={busy} aria-label={`${tx("Opción")} ${index + 1}`} placeholder={`${tx("Opción")} ${index + 1}`}
                    onChange={(event) => setOptions((current) => current.map((item, position) => position === index ? event.target.value : item))}
                    className="min-w-0 flex-1 rounded-lg border border-neutral-400 px-2.5 py-1.5 text-base text-neutral-950" />
                  {options.length > LEAGUE_CHAT_POLL_MIN_OPTIONS ? (
                    <button type="button" disabled={busy} aria-label={`${tx("Quitar opción")} ${index + 1}`} onClick={() => setOptions((current) => current.filter((_, position) => position !== index))}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                  ) : null}
                </div>
              ))}
              {options.length < LEAGUE_CHAT_POLL_MAX_OPTIONS ? (
                <button type="button" disabled={busy} onClick={() => setOptions((current) => [...current, ""])} className="text-sm font-bold underline-offset-4 hover:underline">
                  + {tx("Añadir opción")}
                </button>
              ) : null}
            </div>
            {!distinct ? <p role="alert" className="text-xs font-bold text-red-700">{tx("Las opciones no pueden repetirse.")}</p> : null}
            {failed ? <p role="alert" className="text-xs font-bold text-red-700">{tx("No se ha podido publicar la encuesta.")}</p> : null}
          </form>
        ) : null}
      </FloatingDialog>
    </>
  )
}
