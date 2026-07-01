type StatCardProps = {
  label: string
  value: string | number
  helper?: string
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_10px_rgba(15,23,42,0.05)]">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-xl font-black tracking-tight text-neutral-950">{value}</p>
      {helper ? (
        <p className="mt-1 truncate text-[11px] font-semibold text-neutral-500">{helper}</p>
      ) : null}
    </div>
  )
}
