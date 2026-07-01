type SectionHeaderProps = {
  title: string
  action?: React.ReactNode
  description?: string
}

export function SectionHeader({ title, action, description }: SectionHeaderProps) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-black tracking-tight text-stone-950">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs font-semibold leading-snug text-stone-500">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
