"use client"

import type { PlayerSeasonScope } from "@/lib/playerHistory"

type PlayerSeasonScopeSelectorProps = {
  title: string
  description: string
  value: string
  scopes: PlayerSeasonScope[]
  onChange: (scopeId: string) => void
}

export function PlayerSeasonScopeSelector({
  title,
  value,
  scopes,
  onChange,
}: PlayerSeasonScopeSelectorProps) {
  if (scopes.length <= 1) {
    return null
  }

  return (
    <div className="-mt-2 flex items-center justify-between gap-3 rounded-2xl bg-neutral-100/70 px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-500">
        {title}
      </p>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[165px] rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-black text-neutral-800 outline-none"
      >
        {scopes.map((scope) => (
          <option key={scope.id} value={scope.id}>
            {scope.label}
          </option>
        ))}
      </select>
    </div>
  )
}
