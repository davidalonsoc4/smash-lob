type StatCardProps = {
  label: string
  value: string | number
  helper?: string
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">{label}</p>
      <p className="mt-1 truncate text-lg font-black tracking-tight text-stone-950">{value}</p>
      {helper ? (
        <p className="mt-0.5 truncate text-[11px] font-semibold text-stone-500">{helper}</p>
      ) : null}
    </div>
  )
}
