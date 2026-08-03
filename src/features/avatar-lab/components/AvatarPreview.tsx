"use client"

import { AvatarRenderer } from "../renderers/AvatarRenderer"
import type { AvatarRecipe, AvatarWorldPreference } from "../types"

export function AvatarPreview({ recipe, world }: { recipe: AvatarRecipe; world: AvatarWorldPreference }) {
  return (
    <section aria-label="Vista previa del avatar" className="relative overflow-hidden rounded-[28px] border border-[#ded6ca] bg-[#faf7f0] shadow-sm">
      <div className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-neutral-700 shadow-sm">
        Vista previa
      </div>
      <div className="mx-auto aspect-[4/5] w-full max-w-[360px] p-3 pt-8 sm:p-5 sm:pt-9">
        <AvatarRenderer
          world={world}
          recipe={recipe}
          showReferenceGrid
          className="h-full w-full drop-shadow-[0_5px_0_rgba(58,36,24,0.10)]"
        />
      </div>
    </section>
  )
}
