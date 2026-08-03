"use client"

import type { ReactNode } from "react"

type Option<T extends string> = {
  value: T
  label: string
  disabled?: boolean
  disabledReason?: string
}

export function ControlGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-neutral-200 bg-white p-3">
      <legend className="px-1 text-xs font-black uppercase tracking-[0.13em] text-neutral-500">{title}</legend>
      {description ? <p className="mb-2 text-[11px] font-semibold leading-4 text-neutral-500">{description}</p> : null}
      {children}
    </fieldset>
  )
}

export function SegmentedOptions<T extends string>({
  value,
  options,
  onChange,
  columns = 2,
}: {
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
  columns?: 2 | 3
}) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          title={option.disabledReason}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 rounded-xl border px-2 py-2 text-xs font-black leading-4 ${
            value === option.value
              ? "border-neutral-950 bg-neutral-950 text-white"
              : option.disabled
                ? "cursor-not-allowed border-dashed border-neutral-200 bg-neutral-100 text-neutral-400"
                : "border-neutral-200 bg-white text-neutral-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function ColorOptions<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: readonly { value: T; label: string; color: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-black ${
            value === option.value
              ? "border-neutral-950 bg-neutral-100 text-neutral-950"
              : "border-neutral-200 bg-white text-neutral-600"
          }`}
        >
          <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-md border border-black/15 shadow-inner" style={{ backgroundColor: option.color }} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ToggleOptions({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
  return (
    <SegmentedOptions
      value={enabled ? "yes" : "no"}
      options={[
        { value: "no", label: "No" },
        { value: "yes", label: "Sí" },
      ]}
      onChange={(value) => onChange(value === "yes")}
    />
  )
}
