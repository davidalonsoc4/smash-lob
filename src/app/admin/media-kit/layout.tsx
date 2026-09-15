import type { ReactNode } from "react"
import { MediaKitWorkspaceShell } from "@/components/media-kit/MediaKitWorkspaceShell"
import "./welcome-pack-overgrip.css"
import "./welcome-pack-ball-wrap-refine.css"

export default function MediaKitLayout({ children }: { children: ReactNode }) {
  return <MediaKitWorkspaceShell>{children}</MediaKitWorkspaceShell>
}
