"use client"

import { useState } from "react"
import { createOrGetSpectatorInvite } from "@/lib/spectatorInvites"

type FloatingSpectatorShareButtonProps = {
  leagueId: string
  leagueName: string
  seasonName: string
  rightOffsetPx: number
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  )
}

export function FloatingSpectatorShareButton({
  leagueId,
  leagueName,
  seasonName,
  rightOffsetPx,
}: FloatingSpectatorShareButtonProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function handleShare() {
    if (isWorking) return

    setIsWorking(true)
    setCopied(false)
    setError(null)

    try {
      const invite = await createOrGetSpectatorInvite(leagueId)
      const title = `Ver ${leagueName}`
      const text = `Sigue ${leagueName} · ${seasonName} en Smash & Lob como espectador.`

      if (navigator.share) {
        try {
          await navigator.share({ title, text, url: invite.url })
          return
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === "AbortError"
          ) {
            return
          }
        }
      }

      await copyUrl(invite.url)
    } catch {
      setError("No se ha podido generar el enlace de espectador.")
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div
      className="z-50"
      style={{
        position: "fixed",
        top: "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))",
        right: `max(${rightOffsetPx}px, calc((100vw - 448px) / 2 + ${rightOffsetPx}px))`,
      }}
    >
      <button
        type="button"
        data-tour="floating-share-spectators"
        onClick={handleShare}
        disabled={isWorking}
        aria-label="Compartir enlace de espectador"
        title={copied ? "Enlace copiado" : "Compartir con espectadores"}
        className="app-floating-control flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100 disabled:cursor-wait disabled:opacity-60"
      >
        <ShareIcon />
      </button>

      {copied ? (
        <div className="absolute right-0 mt-2 w-max max-w-[220px] rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white shadow-sm">
          Enlace de espectador copiado
        </div>
      ) : null}

      {error ? (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}
    </div>
  )
}
