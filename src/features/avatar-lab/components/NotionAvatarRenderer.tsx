/* eslint-disable @next/next/no-img-element */
"use client"

import { useMemo } from "react"
import { buildNotionAvatarPreviewUrl } from "../notionAvatarUrl"
import type { NotionAvatarRecipe } from "../notionAvatarModel"

export function NotionAvatarRenderer({
  recipe,
  revision = 0,
  className = "h-full w-full object-contain",
  onLoad,
  onError,
}: {
  recipe: NotionAvatarRecipe
  revision?: number
  className?: string
  onLoad?: () => void
  onError?: () => void
}) {
  const src = useMemo(
    () => buildNotionAvatarPreviewUrl(recipe, revision),
    [recipe, revision],
  )

  return (
    <img
      key={src}
      src={src}
      alt="Avatar estilo Notion"
      className={className}
      onLoad={onLoad}
      onError={onError}
    />
  )
}
