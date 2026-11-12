import Link from "next/link"

const className = "app-floating-outline fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-white transition active:scale-95"
const style = { bottom: "calc(78px + env(safe-area-inset-bottom, 0px))", right: "max(16px, calc((100vw - 28rem) / 2 + 16px))" }

export function FloatingCreateButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  const icon = <span aria-hidden="true" className="text-3xl font-light leading-none">+</span>
  return href
    ? <Link href={href} aria-label={label} title={label} className={className} style={style}>{icon}</Link>
    : <button type="button" onClick={onClick} aria-label={label} title={label} aria-haspopup="dialog" className={className} style={style}>{icon}</button>
}
