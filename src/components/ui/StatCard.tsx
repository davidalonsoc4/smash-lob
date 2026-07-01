type StatCardProps = {
  label: string
  value: string | number
  helper?: string
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
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
