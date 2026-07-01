type SectionHeaderProps = {
  title: string
  action?: React.ReactNode
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
      {action}
    </div>
  )
}