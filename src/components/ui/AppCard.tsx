import { isValidElement, type ComponentProps, type ComponentPropsWithoutRef, type ReactElement } from "react"
import { OvergripBandPreview as PrintableOvergripBandPreview } from "@/components/media-kit/OvergripBandPreview"

type AppCardProps = ComponentPropsWithoutRef<"section"> & {
  accentStrip?: boolean
}

type PrintableOvergripProps = ComponentProps<typeof PrintableOvergripBandPreview>

export function AppCard({
  children,
  className = "",
  accentStrip = false,
  ...sectionProps
}: AppCardProps) {
  const isLegacyOvergripPreview =
    isValidElement(children) &&
    typeof children.type === "function" &&
    children.type.name === "OvergripBandPreview"

  const renderedChildren = isLegacyOvergripPreview
    ? <PrintableOvergripBandPreview {...(children as ReactElement<PrintableOvergripProps>).props} />
    : children

  return (
    <section
      {...sectionProps}
      className={`app-card ${accentStrip ? "app-card-explicit-accent" : ""} rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)] ${className}`}
    >
      {accentStrip ? (
        <span aria-hidden="true" className="app-card-accent-strip" />
      ) : null}
      {renderedChildren}
    </section>
  )
}
