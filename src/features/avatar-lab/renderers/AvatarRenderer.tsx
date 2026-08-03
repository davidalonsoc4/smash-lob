import type { AvatarRendererProps } from "../types"
import { PixelChibiAvatarRenderer } from "./PixelChibiAvatarRenderer"

export function AvatarRenderer({ world, ...props }: AvatarRendererProps) {
  if (world === "pixel_chibi") {
    return <PixelChibiAvatarRenderer {...props} />
  }

  return (
    <div role="img" aria-label="Mundo Chibi ilustrado todavía no disponible" className={props.className}>
      <div className="flex h-full min-h-56 items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white/70 px-6 text-center text-sm font-bold text-neutral-500">
        Chibi ilustrado estará disponible próximamente.
      </div>
    </div>
  )
}
