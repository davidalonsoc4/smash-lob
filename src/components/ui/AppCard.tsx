type AppCardProps = {
  children: React.ReactNode
  className?: string
}

export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <section
      className={`rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_1px_10px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </section>
  )
}
