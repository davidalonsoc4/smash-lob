"use client"

import { useState } from "react"
import { getPublicInviteUrl } from "@/lib/inviteUrls"

type FloatingInviteShareButtonProps = {
  inviteCode: string
  leagueName: string
  unclaimedCount: number
  offsetForSettingsButton: boolean
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
        width: "14px",
        height: "14px",
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
  inviteCode,
  leagueName,
  unclaimedCount,
  offsetForSettingsButton,
}: FloatingInviteShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inviteUrl = getPublicInviteUrl(inviteCode)
  const title = `Invitación a ${leagueName}`
  const text = `Únete a ${leagueName} en Smash & Lob. Quedan ${unclaimedCount} jugador${
    unclaimedCount === 1 ? "" : "es"
  } sin vincular.`

  async function copyInviteUrl() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setError(null)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text,
          url: inviteUrl,
        })
        setError(null)
        return
      }

      await copyInviteUrl()
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return
      }

      try {
        await copyInviteUrl()
      } catch {
        setError("No se ha podido compartir ni copiar el enlace.")
      }
    }
  }

  return (
    <div
      className="z-50"
      style={{
        position: "fixed",
        top: "22px",
        right: offsetForSettingsButton
          ? "max(60px, calc((100vw - 448px) / 2 + 60px))"
          : "max(22px, calc((100vw - 448px) / 2 + 22px))",
      }}
    >
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartir invitación"
        title={copied ? "Enlace copiado" : "Compartir invitación"}
        className="flex items-center justify-center rounded-full bg-neutral-950 text-white shadow-sm transition active:scale-[0.96] active:bg-neutral-800"
        style={{
          width: "30px",
          height: "30px",
        }}
      >
        <ShareIcon />
      </button>

      {copied ? (
        <div className="absolute right-0 mt-2 w-max max-w-[220px] rounded-2xl bg-neutral-950 px-3 py-2 text-xs font-black text-white shadow-sm">
          Enlace copiado
        </div>
      ) : null}

      {error ? (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}
    </div>
  )
}
