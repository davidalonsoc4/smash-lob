import { useEffect, useRef, type ReactNode } from "react"
import { useTheme } from "@/context/ThemeProvider"

/** Keep forms mounted so collapsing a section preserves unsaved edits. */
export function SeasonAdminSection({ id, title, children, className = "", ...props }: {
  id: string
  title: string
  children: ReactNode
  className?: string
  "data-tour"?: string
}) {
  const { visualStyle } = useTheme()
  const disclosure = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function revealLinkedSection() {
      if (window.location.hash !== `#${id}` || !disclosure.current) return
      disclosure.current.open = true
      disclosure.current.scrollIntoView({ block: "start" })
    }
    revealLinkedSection()
    window.addEventListener("hashchange", revealLinkedSection)
    return () => window.removeEventListener("hashchange", revealLinkedSection)
  }, [id, visualStyle])

  if (visualStyle !== "competition") {
    return <div id={id} className={className} {...props}>{children}</div>
  }

  return (
    <details ref={disclosure} id={id} className={`season-admin-section ${className}`} {...props}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-black">{title}</summary>
      <div className="season-admin-section-content px-2 pb-2">{children}</div>
    </details>
  )
}
