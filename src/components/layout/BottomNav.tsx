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
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white/95 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur"
      style={{
        minHeight: "72px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="grid w-full grid-cols-5 gap-1.5 bg-transparent px-2.5"
        style={{
          minHeight: "72px",
          paddingTop: "7px",
          paddingBottom: "7px",
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
                  ? "flex items-center justify-center rounded-xl bg-neutral-950 px-1 text-center text-[11px] font-black text-white shadow-sm"
                  : "flex items-center justify-center rounded-xl bg-transparent px-1 text-center text-[11px] font-black text-neutral-500 transition active:bg-neutral-100"
              }
              style={{
                minHeight: "48px",
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
