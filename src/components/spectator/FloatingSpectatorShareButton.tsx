"use client"

import { useState } from "react"
import { createOrGetSpectatorInvite } from "@/lib/spectatorInvites"
import { useI18n } from "@/i18n/I18nProvider"

type FloatingSpectatorShareButtonProps = {
  leagueId: string
  leagueName: string
  seasonName: string
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
}: FloatingSpectatorShareButtonProps) {
  const { tx } = useI18n()
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
      const title = tx(`Ver ${leagueName}`)
      const text = tx(`Sigue ${leagueName} · ${seasonName} en Smash & Lob como espectador.`)

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
    <div className="relative z-50 shrink-0">
      <button
        type="button"
        data-tour="floating-share-spectators"
        onClick={handleShare}
        disabled={isWorking}
        aria-label={tx("Compartir enlace de espectador")}
        title={copied ? tx("Enlace copiado") : tx("Compartir con espectadores")}
        className="app-floating-control flex h-[34px] w-[34px] items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100 disabled:cursor-wait disabled:opacity-60"
      >
        <ShareIcon />
      </button>

      {copied ? (
        <div className="absolute right-0 mt-2 w-max max-w-[220px] rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white shadow-sm">
          {tx("Enlace de espectador copiado")}{" "}</div>
      ) : null}

      {error ? (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm">
          {tx(error)}
        </div>
      ) : null}
    </div>
  )
}
