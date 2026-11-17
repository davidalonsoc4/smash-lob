"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useI18n } from "@/i18n/I18nProvider"

export type LeagueChatMediaMessage = {
  body: string
  media_kind?: "image" | "video" | null
  media_url?: string | null
}

/** Body of a chat bubble with a photo or video: tappable preview plus the caption. */
export function LeagueChatMediaBody({ message }: { message: LeagueChatMediaMessage }) {
  const { tx } = useI18n()
  const [open, setOpen] = useState(false)
  const { media_kind: kind, media_url: url } = message
  if (!kind || !url) return <>{message.body}</>
  const label = tx(kind === "video" ? "Reproducir vídeo" : "Ampliar foto")
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
        data-league-chat-media={kind}
        className="relative mb-1 block w-44 max-w-full overflow-hidden rounded-xl bg-neutral-900 active:scale-[0.98]"
      >
        {kind === "video" ? (
          <>
            {/* #t=0.1 makes mobile browsers paint a still frame as the thumbnail. */}
            <video src={`${url}#t=0.1`} preload="metadata" muted playsInline tabIndex={-1} className="pointer-events-none aspect-[9/16] w-full object-cover" />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" loading="lazy" className="max-h-72 w-full object-cover" />
        )}
      </button>
      <span className="block">{message.body}</span>
      {open ? <LeagueChatMediaViewer kind={kind} url={url} caption={message.body} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

/** Full-screen viewer inside the app: no redirect, closes with the button, Escape or the backdrop. */
function LeagueChatMediaViewer({ kind, url, caption, onClose }: { kind: "image" | "video"; url: string; caption: string; onClose: () => void }) {
  const { tx } = useI18n()
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow }
  }, [onClose])
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={caption} className="fixed inset-0 z-[200] flex items-center justify-center bg-black" onClick={onClose}>
      <div className="flex h-full w-full max-w-md items-center justify-center" onClick={(event) => event.stopPropagation()}>
        {kind === "video"
          ? <video src={url} controls autoPlay playsInline controlsList="nodownload" className="max-h-full max-w-full" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={url} alt={caption} className="max-h-full max-w-full object-contain" />}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={tx("Cerrar")}
        className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white"
        style={{ top: "max(12px, env(safe-area-inset-top, 0px))" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-5 w-5"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
    </div>,
    document.body,
  )
}
