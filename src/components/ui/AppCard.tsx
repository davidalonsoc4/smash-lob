type AppCardProps = {
  children: React.ReactNode
  className?: string
}

export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </section>
  )
}