"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/i18n/I18nProvider"

const items = [
  { href: "/admin/media-kit", label: "Contenido digital", exact: true },
  { href: "/admin/media-kit/welcome-pack", label: "Welcome Pack", exact: false },
] as const

export function MediaKitSectionNav() {
  const pathname = usePathname()
  const { tx } = useI18n()

  return (
    <nav
      aria-label={tx("Secciones de Media Kit")}
      className="grid grid-cols-2 gap-1 rounded-2xl border border-neutral-200 bg-neutral-100 p-1 shadow-sm"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-10 items-center justify-center rounded-xl px-3 text-center text-xs font-black transition ${
              active
                ? "bg-neutral-950 text-white shadow-sm"
                : "text-neutral-600 hover:bg-white hover:text-neutral-950"
            }`}
          >
            {tx(item.label)}
          </Link>
        )
      })}
    </nav>
  )
}
