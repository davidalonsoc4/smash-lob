type StatCardProps = {
  label: string
  value: string | number
  helper?: string
}

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-bold text-neutral-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs text-neutral-500">{helper}</p>
      ) : null}
    </div>
  )
}