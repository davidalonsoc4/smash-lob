type SectionHeaderProps = {
  title: React.ReactNode
  titleClassName?: string
  action?: React.ReactNode
  headingTag?: "h2" | "span"
}

export function SectionHeader({ title, titleClassName = "", action, headingTag: Heading = "h2" }: SectionHeaderProps) {
  return (
    <div className="app-section-header flex items-center justify-between gap-3">
      <Heading className={`type-panel-title text-neutral-950 ${titleClassName}`}>{title}</Heading>
      {action}
    </div>
  )
}
