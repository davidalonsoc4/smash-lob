"use client"

import type { ComponentProps, CSSProperties } from "react"
import { BallCanWrapPremiumPreview } from "@/components/media-kit/BallCanWrapPremiumPreview"

type BallCanWrapPreviewProps = ComponentProps<typeof BallCanWrapPremiumPreview>

export function BallCanWrapPreview(props: BallCanWrapPreviewProps) {
  return (
    <div style={{ "--ball-wrap-accent": props.accent } as CSSProperties}>
      <BallCanWrapPremiumPreview {...props} />
    </div>
  )
}
