import type { ReactNode } from "react"

type StatCardProps = {
  label: string
  value: string | number
  helper?: string
  icon?: ReactNode
}

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <div className="flex items-center gap-1.5 text-neutral-500">
        {icon ? <span className="shrink-0" aria-hidden="true">{icon}</span> : null}
        <p className="text-xs font-semibold">{label}</p>
      </div>
      <p className="mt-1 truncate text-xl font-black tracking-tight text-neutral-950">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 truncate text-[11px] font-medium text-neutral-500">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
