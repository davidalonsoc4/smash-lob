"use client"

import { useCallback, useRef, useState } from "react"
import { ImageLightbox } from "@/components/images/ImageLightbox"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

type PlayerAvatarProps = {
  player?: Pick<PlayerProfile, "displayName" | "avatarUrl"> & {
    avatarInitials?: string | null
  } | null
  size?: "sm" | "md" | "lg"
  className?: string
  previewable?: boolean
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-14 w-14",
}

const iconSizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
}

function hasImage(player?: PlayerAvatarProps["player"]) {
  return isSafeImageUrl(player?.avatarUrl)
}

function GenericUserIcon({ size }: { size: NonNullable<PlayerAvatarProps["size"]> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${iconSizeClasses[size]} text-neutral-500`}
      aria-hidden="true"
    >
      <path
        d="M12 12.25c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"
        fill="currentColor"
      />
      <path
        d="M5.25 19.5c.78-3.06 3.5-5.25 6.75-5.25s5.97 2.19 6.75 5.25c.16.62-.35 1.25-1.02 1.25H6.27c-.67 0-1.18-.63-1.02-1.25Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function PlayerAvatar({
  player,
  size = "md",
  className = "",
  previewable = false,
}: PlayerAvatarProps) {
  const { t } = useI18n()
  const previewTriggerRef = useRef<HTMLDivElement>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const imageUrl = hasImage(player)
    ? normalizeImageUrl(player?.avatarUrl)
    : null
  const canPreview = Boolean(previewable && imageUrl)
  const displayName = player?.displayName?.trim() || "Jugador"
  const openLabel = t.imageViewer.openPlayerImage.replace("{name}", displayName)
  const imageAlt = t.imageViewer.playerImageAlt.replace("{name}", displayName)
  const closePreview = useCallback(() => {
    setIsPreviewOpen(false)
    window.requestAnimationFrame(() => previewTriggerRef.current?.focus())
  }, [])

  return (
    <>
      <div
        ref={previewTriggerRef}
        className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200 ${
          canPreview
            ? "cursor-zoom-in outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-neutral-950"
            : ""
        } ${className}`}
        aria-hidden={canPreview ? undefined : true}
        role={canPreview ? "button" : undefined}
        tabIndex={canPreview ? 0 : undefined}
        aria-label={canPreview ? openLabel : undefined}
        title={canPreview ? openLabel : undefined}
        onClick={
          canPreview
            ? (event) => {
                event.preventDefault()
                event.stopPropagation()
                setIsPreviewOpen(true)
              }
            : undefined
        }
        onKeyDown={
          canPreview
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsPreviewOpen(true)
                }
              }
            : undefined
        }
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <GenericUserIcon size={size} />
        )}
      </div>

      {isPreviewOpen && imageUrl ? (
        <ImageLightbox
          src={imageUrl}
          alt={imageAlt}
          onClose={closePreview}
        />
      ) : null}
    </>
  )
}
