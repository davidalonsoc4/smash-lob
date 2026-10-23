import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { FitText } from "@/components/ui/FitText"
import styles from "./Tournament.module.css"

const items = [
  { path: "", label: "Inicio", shortLabel: "Inicio", icon: "home" },
  { path: "/calendar", label: "Calendario", shortLabel: "Rondas", icon: "calendar" },
  { path: "/standings", label: "Clasificación", shortLabel: "Ranking", icon: "ranking" },
  { path: "/players", label: "Mis partidos", shortLabel: "Jugador", icon: "players" },
  { path: "/live", label: "Seguimiento", shortLabel: "En vivo", icon: "live" },
] as const

function Icon({ name }: { name: (typeof items)[number]["icon"] }) {
  const props = { "aria-hidden": true, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "app-bottom-nav-icon" }
  if (name === "calendar") return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7" /></svg>
  if (name === "ranking") return <svg {...props}><path d="M5 20V11M12 20V4M19 20v-7" /></svg>
  if (name === "players") return <svg {...props}><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-3.7 2.5-5.5 6-5.5s5.5 1.8 6 5.5M17 5.5a3 3 0 0 1 0 5.8M17 15c2.4.5 3.7 2.2 4 5" /></svg>
  if (name === "live") return <svg {...props}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></svg>
  return <svg {...props}><path d="M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" /></svg>
}

export function TournamentNav({ tournamentId }: { tournamentId: string }) {
  const { tx } = useI18n()
  const pathname = usePathname()
  const root = `/tournaments/${tournamentId}`
  useEffect(() => {
    document.documentElement.dataset.bottomNavVisible = "true"
    return () => { delete document.documentElement.dataset.bottomNavVisible }
  }, [])

  return <nav aria-label={tx("Navegación del torneo")} data-bottom-nav-visible="true" className={`${styles.theme} ${styles.bottomNav} personal-matches-bottom-nav fixed bottom-0 left-1/2 z-50 -translate-x-1/2 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] backdrop-blur`}>
    <div className={`app-bottom-nav-grid ${styles.navGrid}`}>
      {items.map((item) => {
        const href = `${root}${item.path}`
        const active = pathname === href
        return <Link key={item.path} href={href} aria-label={tx(item.label)} title={tx(item.label)} aria-current={active ? "page" : undefined} className={`${styles.navItem} ${active ? "app-bottom-nav-active" : "app-bottom-nav-item"} font-black`}>
          <Icon name={item.icon} /><FitText noWrap className={styles.navLabel}>{tx(item.shortLabel)}</FitText>
        </Link>
      })}
    </div>
  </nav>
}
