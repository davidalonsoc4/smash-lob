"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type PersonalNavIconName = "matches" | "profile" | "leagues"

function PersonalNavIcon({ icon }: { icon: PersonalNavIconName }) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
  }


  if (icon === "profile") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.25" />
        <path d="M5.5 20c.8-4 3.1-6 6.5-6s5.7 2 6.5 6" />
      </svg>
    )
  }


  if (icon === "leagues") {
    return (
      <svg {...commonProps}>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 12 8 4 8-4" />
        <path d="m4 17 8 4 8-4" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 12h3" />
      <path d="M8 16h6" />
    </svg>
  )
}

export function PersonalMatchesNav() {
  const pathname = usePathname()
  const isProfile = pathname === "/personal-matches/profile"
  const isMatchesActive =
    pathname === "/personal-matches" ||
    (pathname.startsWith("/personal-matches/") && !isProfile)

  const items = [
    {
      href: "/leagues",
      label: "Mis ligas",
      icon: "leagues" as const,
      active: false,
    },
    {
      href: "/personal-matches",
      label: "Mis partidos",
      icon: "matches" as const,
      active: isMatchesActive,
    },
    {
      href: "/personal-matches/profile",
      label: "Mi perfil",
      icon: "profile" as const,
      active: isProfile,
    },
  ]

  return (
    <nav
      aria-label="Navegación de Mis partidos"
      className="personal-matches-bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white/95 shadow-[0_-5px_16px_rgba(0,0,0,0.05)] backdrop-blur"
      style={{
        minHeight: "62px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="grid min-h-[62px] grid-cols-3 gap-1 px-3 py-1.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={
              item.active
                ? "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-neutral-950 px-1 type-caption font-black text-white shadow-sm"
                : "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 type-caption font-black text-neutral-500 transition active:bg-neutral-100"
            }
          >
            <PersonalNavIcon icon={item.icon} />
            <span className="leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
