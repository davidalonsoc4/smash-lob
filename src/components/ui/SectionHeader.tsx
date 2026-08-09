type SectionHeaderProps = {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="app-section-header mb-2 flex items-center justify-between gap-3">
      <h2 className="type-panel-title text-neutral-950">{title}</h2>
      {action}
    </div>
  )
}
