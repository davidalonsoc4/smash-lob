import type { ComponentPropsWithoutRef } from "react"

type AppCardProps = ComponentPropsWithoutRef<"section"> & {
  accentStrip?: boolean
}

export function AppCard({
  children,
  className = "",
  accentStrip = false,
  ...sectionProps
}: AppCardProps) {
  return (
    <section
      {...sectionProps}
      className={`app-card ${accentStrip ? "app-card-explicit-accent" : ""} rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)] ${className}`}
    >
      {accentStrip ? (
        <span aria-hidden="true" className="app-card-accent-strip" />
      ) : null}
      {children}
    </section>
  )
}
