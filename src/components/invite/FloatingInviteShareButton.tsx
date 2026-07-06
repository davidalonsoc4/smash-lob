"use client"

import { useEffect, useState } from "react"
import { getPublicInviteUrl } from "@/lib/inviteUrls"

type FloatingInviteShareButtonProps = {
  initialInviteCode: string
  leagueId: string
  leagueName: string
  unclaimedCount: number
  rightOffsetPx: number
  onGenerateInviteCode: () => Promise<string | null>
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
      style={{
        width: "13px",
        height: "13px",
        display: "block",
      }}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  )
}

export function FloatingInviteShareButton({
  initialInviteCode,
  leagueId,
  leagueName,
  unclaimedCount,
  rightOffsetPx,
  onGenerateInviteCode,
}: FloatingInviteShareButtonProps) {
  const [currentInviteCode, setCurrentInviteCode] = useState(initialInviteCode)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const title = `Invitación a ${leagueName}`
  const text = `Únete a ${leagueName} en Smash & Lob. Quedan ${unclaimedCount} jugador${
    unclaimedCount === 1 ? "" : "es"
  } sin vincular.`

  useEffect(() => {
    setCurrentInviteCode(initialInviteCode)
  }, [initialInviteCode])

  async function copyInviteUrl(inviteUrl: string) {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setError(null)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function getFreshInviteUrl() {
    const nextInviteCode = await onGenerateInviteCode()

    if (!nextInviteCode) {
      throw new Error("invite-code-generation-failed")
    }

    setCurrentInviteCode(nextInviteCode)

    return getPublicInviteUrl(nextInviteCode, { leagueId })
  }

  async function handleShare() {
    if (isGenerating) {
      return
    }

    setIsGenerating(true)
    setCopied(false)
    setError(null)

    let generatedInviteUrl: string | null = null

    try {
      generatedInviteUrl = await getFreshInviteUrl()

      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: generatedInviteUrl,
        })
        setError(null)
        return
      }

      await copyInviteUrl(generatedInviteUrl)
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return
      }

      try {
        const fallbackInviteUrl =
          generatedInviteUrl ??
          (currentInviteCode
            ? getPublicInviteUrl(currentInviteCode, { leagueId })
            : await getFreshInviteUrl())
        await copyInviteUrl(fallbackInviteUrl)
      } catch {
        setError("No se ha podido generar ni compartir la invitación.")
      }
    } finally {
      setIsGenerating(false)
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
        onClick={handleShare}
        disabled={isGenerating}
        aria-label="Compartir invitación"
        title={
          isGenerating
            ? "Generando invitación"
            : copied
              ? "Enlace copiado"
              : "Compartir invitación"
        }
        className="flex items-center justify-center rounded-full bg-neutral-950 text-white shadow-sm transition active:scale-[0.96] active:bg-neutral-800 disabled:cursor-wait disabled:opacity-70"
        style={{
          width: "28px",
          height: "28px",
        }}
      >
        <ShareIcon />
      </button>

      {copied ? (
        <div className="absolute right-0 mt-2 w-max max-w-[220px] rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white shadow-sm">
          Enlace copiado
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
