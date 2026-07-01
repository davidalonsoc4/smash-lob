"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useI18n } from "@/i18n/I18nProvider"

type NavItem = {
  href: string
  label: string
  isActive: (pathname: string) => boolean
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems: NavItem[] = [
    {
      href: "/",
      label: t.nav.home,
      isActive: (currentPathname) => currentPathname === "/",
    },
    {
      href: "/ranking",
      label: t.nav.ranking,
      isActive: (currentPathname) =>
        currentPathname === "/ranking" ||
        currentPathname.startsWith("/player"),
    },
    {
      href: "/matches",
      label: t.nav.matches,
      isActive: (currentPathname) =>
        currentPathname === "/matches" ||
        currentPathname.startsWith("/match"),
    },
    {
      href: "/activity",
      label: t.nav.activity,
      isActive: (currentPathname) => currentPathname.startsWith("/activity"),
    },
    {
      href: "/profile",
      label: t.nav.profile,
      isActive: (currentPathname) => currentPathname.startsWith("/profile"),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-stone-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid min-h-[60px] w-full grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex items-center justify-center rounded-lg bg-stone-950 px-1 text-center text-[11px] font-black text-white"
                  : "flex items-center justify-center rounded-lg px-1 text-center text-[11px] font-black text-stone-500 transition active:bg-stone-100"
              }
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
