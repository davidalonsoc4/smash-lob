"use client"

import { useCallback, useRef, useState } from "react"
import type { League } from "@/data/fakeData"
import { ImageLightbox } from "@/components/images/ImageLightbox"
import { useI18n } from "@/i18n/I18nProvider"
import { isSafeImageUrl, normalizeImageUrl } from "@/lib/imageUrl"

type LeagueLogoProps = {
  league?: Pick<League, "name" | "logoUrl"> | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  previewable?: boolean
}

const sizeClasses = {
  sm: "h-8 w-8 type-caption",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
}

function getLeagueInitials(name?: string | null) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SL"
  )
}

export function LeagueLogo({
  league,
  size = "md",
  className = "",
  previewable = false,
}: LeagueLogoProps) {
  const { t } = useI18n()
  const previewTriggerRef = useRef<HTMLDivElement>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const imageUrl = isSafeImageUrl(league?.logoUrl)
    ? normalizeImageUrl(league?.logoUrl)
    : null
  const canPreview = Boolean(previewable && imageUrl)
  const leagueName = league?.name?.trim() || "Smash & Lob"
  const openLabel = t.imageViewer.openLeagueLogo.replace("{name}", leagueName)
  const imageAlt = t.imageViewer.leagueLogoAlt.replace("{name}", leagueName)
  const closePreview = useCallback(() => {
    setIsPreviewOpen(false)
    window.requestAnimationFrame(() => previewTriggerRef.current?.focus())
  }, [])

  if (imageUrl) {
    return (
      <>
        <div
          ref={previewTriggerRef}
          className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-transparent ${
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-contain drop-shadow-sm"
          />
        </div>

        {isPreviewOpen ? (
          <ImageLightbox
            src={imageUrl}
            alt={imageAlt}
            onClose={closePreview}
          />
        ) : null}
      </>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-950 font-black text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <span>{getLeagueInitials(league?.name)}</span>
    </div>
  )
}
