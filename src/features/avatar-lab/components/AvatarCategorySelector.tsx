"use client"

import { AVATAR_CATEGORIES } from "../catalog"
import type { AvatarCategory } from "../types"

type Props = { value: AvatarCategory; onChange: (category: AvatarCategory) => void }

export function AvatarCategorySelector({ value, onChange }: Props) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max gap-2" role="tablist" aria-label="Categorías del avatar">
        {AVATAR_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={value === category.id}
            onClick={() => onChange(category.id)}
            className={`rounded-full px-4 py-2 text-xs font-black transition ${
              value === category.id
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            {category.shortLabel}
          </button>
        ))}
      </div>
    </div>
  )
}
