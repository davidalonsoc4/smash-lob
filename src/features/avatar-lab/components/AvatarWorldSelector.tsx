"use client"

import { AVATAR_WORLDS } from "../catalog"
import type { AvatarWorldPreference } from "../types"

type Props = { value: AvatarWorldPreference; onChange: (world: AvatarWorldPreference) => void }

export function AvatarWorldSelector({ value, onChange }: Props) {
  return (
    <section aria-labelledby="avatar-world-title" className="space-y-2">
      <div>
        <p id="avatar-world-title" className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
          Mundo visual del espectador
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Esta preferencia solo cambia cómo ves tú los avatares.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AVATAR_WORLDS.map((world) => {
          const selected = value === world.id
          return (
            <button
              key={world.id}
              type="button"
              disabled={!world.available}
              aria-pressed={selected}
              onClick={() => world.available && onChange(world.id)}
              className={`min-h-20 rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : world.available
                    ? "border-neutral-200 bg-white text-neutral-950"
                    : "cursor-not-allowed border-dashed border-neutral-200 bg-neutral-100 text-neutral-400"
              }`}
            >
              <span className="block text-sm font-black">{world.label}</span>
              <span className={`mt-1 block text-[11px] font-semibold leading-4 ${selected ? "text-white/75" : "text-inherit"}`}>
                {world.available ? world.description : "Próximamente"}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
