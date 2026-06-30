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
      label: "Actividad",
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
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      style={{
        minHeight: "96px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="grid w-full grid-cols-5 gap-2 bg-white px-3"
        style={{
          minHeight: "96px",
          paddingTop: "12px",
          paddingBottom: "12px",
        }}
      >
        {navItems.map((item) => {
          const isActive = item.isActive(pathname)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex items-center justify-center rounded-3xl bg-neutral-950 px-1 text-center text-xs font-black text-white shadow-sm"
                  : "flex items-center justify-center rounded-3xl bg-white px-1 text-center text-xs font-black text-neutral-500 transition active:bg-neutral-100"
              }
              style={{
                minHeight: "72px",
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
