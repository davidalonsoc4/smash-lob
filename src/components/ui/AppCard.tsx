type AppCardProps = {
  children: React.ReactNode
  className?: string
}

export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <section
      className={`rounded-xl border border-stone-200 bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </section>
  )
}
