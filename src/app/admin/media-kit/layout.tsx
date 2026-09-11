import type { ReactNode } from "react"
import { MediaKitSectionNav } from "@/components/media-kit/MediaKitSectionNav"

export default function MediaKitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3">
      <MediaKitSectionNav />
      {children}
    </div>
  )
}
