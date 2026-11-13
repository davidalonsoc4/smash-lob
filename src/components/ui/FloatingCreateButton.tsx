import Link from "next/link"

const className = "app-floating-outline fixed z-40 m-0! flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-white transition active:scale-95"
const style = { bottom: "calc(97px + env(safe-area-inset-bottom, 0px))", right: "max(16px, calc((100vw - 28rem) / 2 + 16px))" }

export function FloatingCreateButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  const icon = <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"><path d="M12 4v16M4 12h16" /></svg>
  return href
    ? <Link href={href} aria-label={label} title={label} className={className} style={style}>{icon}</Link>
    : <button type="button" onClick={onClick} aria-label={label} title={label} aria-haspopup="dialog" className={className} style={style}>{icon}</button>
}
