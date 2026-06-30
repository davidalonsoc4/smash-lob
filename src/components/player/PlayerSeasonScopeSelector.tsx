"use client"

import { AppCard } from "@/components/ui/AppCard"
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
  description,
  value,
  scopes,
  onChange,
}: PlayerSeasonScopeSelectorProps) {
  if (scopes.length <= 1) {
    return null
  }

  return (
    <AppCard className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">{title}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {description}
          </p>
        </div>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="max-w-[150px] rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black text-neutral-950 outline-none"
        >
          {scopes.map((scope) => (
            <option key={scope.id} value={scope.id}>
              {scope.label}
            </option>
          ))}
        </select>
      </div>
    </AppCard>
  )
}
