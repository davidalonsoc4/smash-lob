import type { ReactNode } from "react"
import { MediaKitWorkspaceShell } from "@/components/media-kit/MediaKitWorkspaceShell"

export default function MediaKitLayout({ children }: { children: ReactNode }) {
  return <MediaKitWorkspaceShell>{children}</MediaKitWorkspaceShell>
}
