"use client"

import { useEffect, useState } from "react"
import { TutorialVideoCard } from "@/components/help/TutorialVideoCard"
import { DialogCloseButton, FloatingDialog } from "@/components/ui/FloatingDialog"
import type { TutorialSummary } from "@/lib/tutorialVideos"
import { useI18n } from "@/i18n/I18nProvider"

/** The league creator picks an existing tutorial to post in the chat instead of uploading a new video. */
export function LeagueChatTutorialPicker({ open, seasonId, canAnnounce, onClose, onShare }: {
  open: boolean
  seasonId: string
  /** Creators and admins may mark the post as a Novedad, which notifies the whole chat. */
  canAnnounce: boolean
  onClose: () => void
  /** Resolves true when the tutorial was posted. */
  onShare: (tutorialId: string, announcement: boolean) => Promise<boolean>
}) {
  const { tx } = useI18n()
  const [tutorials, setTutorials] = useState<TutorialSummary[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [announce, setAnnounce] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTutorials(null)
    setAnnounce(false)
    setFailed(false)
    void fetch(`/api/league-season-chats/${encodeURIComponent(seasonId)}/tutorial`, { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as { tutorials: TutorialSummary[] }).tutorials : null))
      .catch(() => null)
      .then((list) => { if (cancelled) return; if (list) setTutorials(list); else setFailed(true) })
    return () => { cancelled = true }
  }, [open, seasonId])

  async function choose(tutorial: TutorialSummary) {
    if (busy) return
    setBusy(true)
    setFailed(false)
    const ok = await onShare(tutorial.id, canAnnounce && announce)
    setBusy(false)
    if (ok) onClose()
    else setFailed(true)
  }

  return (
    <FloatingDialog open={open} onClose={onClose} busy={busy} title={tx("Compartir un tutorial")} className="league-chat-edit-dialog">
      {open ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="min-w-0 flex-1 truncate font-bold">{tx("Compartir un tutorial")}</h2>
            <DialogCloseButton onClick={onClose} disabled={busy} />
          </div>
          {canAnnounce ? (
            <label className="league-chat-announcement flex items-start gap-2 rounded-xl border px-3 py-2">
              <input type="checkbox" checked={announce} disabled={busy} onChange={(event) => setAnnounce(event.target.checked)} className="mt-1" />
              <span className="min-w-0 text-xs font-bold leading-snug"><span className="league-chat-announcement-label uppercase tracking-wide">{tx("Novedad")}</span> · {tx("Marcar como novedad. Se avisará a todos los participantes con una notificación.")}</span>
            </label>
          ) : null}
          {tutorials === null && !failed ? <p className="text-sm font-semibold text-neutral-600">{tx("Cargando…")}</p> : null}
          {tutorials?.length === 0 ? <p className="text-sm font-semibold text-neutral-600">{tx("No hay tutoriales disponibles para esta liga.")}</p> : null}
          <div className="grid gap-2">
            {tutorials?.map((tutorial) => <TutorialVideoCard key={tutorial.id} tutorial={{ ...tutorial, seen: false }} onOpen={() => void choose(tutorial)} />)}
          </div>
          {busy ? <p role="status" className="text-xs font-bold text-neutral-700">{tx("Publicando en el chat…")}</p> : null}
          {failed ? <p role="alert" className="text-xs font-bold text-red-700">{tx("No se ha podido compartir el tutorial.")}</p> : null}
        </div>
      ) : null}
    </FloatingDialog>
  )
}
