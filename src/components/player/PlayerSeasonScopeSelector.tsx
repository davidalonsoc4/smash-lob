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
    <div className="-mt-1 flex justify-end">
      <label className="inline-flex max-w-full items-center gap-0.5 text-neutral-500">
        <span className="sr-only">{title}</span>
        <select
          aria-label={title}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="max-w-[160px] cursor-pointer appearance-none truncate border-0 bg-transparent py-0.5 pl-1 pr-3 text-right text-[10px] font-bold text-neutral-500 outline-none"
        >
          {scopes.map((scope) => (
            <option key={scope.id} value={scope.id}>
              {scope.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="-ml-2 text-[9px] text-neutral-400">
          ▾
        </span>
      </label>
    </div>
  )
}
