"use client"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import {
  SettingsSectionIcon,
  type SettingsSectionIconName,
} from "@/components/settings/SettingsSectionIcon"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { type Palette, type ThemeMode, useTheme } from "@/context/ThemeProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import { isAvatarLabEnabled } from "@/lib/avatarLabAccess"
import { formatMoney } from "@/lib/courtBooking"
import { fetchPaymentLedger, getPaymentLedgerPendingSummary } from "@/lib/paymentLedger"
const settingsVersionLabel = `Smash & Lob · ${APP_VERSION_LABEL}`
type SettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
}
function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="space-y-2">
      <div className="px-1">
        <p className="settings-section-label type-caption font-black uppercase tracking-[0.2em] text-neutral-600">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>
      <AppCard accentStrip className="overflow-hidden !p-0">
        <div className="divide-y divide-neutral-100">{children}</div>
      </AppCard>
    </section>
  )
}
type SettingsLinkRowProps = {
  href: string
  title: string
  description: string
  id?: string
  leading?: ReactNode
  icon?: SettingsSectionIconName
  badge?: ReactNode
  tone?: "default" | "warning" | "danger"
  tour?: string
}
function SettingsLinkRow({
  href,
  title,
  description,
  id,
  leading,
  icon,
  badge,
  tone = "default",
  tour,
}: SettingsLinkRowProps) {
  const toneClass =
    tone === "danger"
      ? "bg-red-50 text-red-950"
      : tone === "warning"
        ? "bg-amber-50 text-amber-950"
        : "bg-white text-neutral-950"
  const descriptionClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-neutral-500"
  return (
    <Link
      href={href}
      id={id}
      data-tour={tour}
      className={`settings-row settings-row-${tone} settings-search-target flex items-center gap-3 px-3 py-3 transition active:bg-neutral-50 ${toneClass}`}
    >
      {leading || icon ? (
        <div className="shrink-0">{leading ?? <SettingsSectionIcon name={icon!} />}</div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black">{title}</p>
          {badge}
        </div>
        <p className={`mt-0.5 text-xs font-semibold leading-5 ${descriptionClass}`}>
          {description}
        </p>
      </div>
      <ClickableChevron className="shrink-0" />
    </Link>
  )
}
function SettingsStaticRow({
  id,
  title,
  description,
  leading,
  children,
}: {
  id?: string
  title: string
  description: string
  leading?: ReactNode
  children: ReactNode
}) {
  return (
    <div id={id} className="settings-row settings-row-default settings-search-target px-3 py-3">
      <div className="flex items-center gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-neutral-950">{title}</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            {description}
          </p>
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    </div>
  )
}
const paletteSwatches: Record<Exclude<Palette, "league">, string[]> = {
  classic: ["#111827", "#6b7280", "#d1d5db"],
  indigo: ["#5b5ce2", "#7c4dff", "#e94b9b"],
  midnight: ["#365f9d", "#5a78b5", "#87b5df"],
  sage: ["#55765f", "#7f9b83", "#a6b99d"],
  burgundy: ["#8b3f57", "#a85c70", "#d2a2ad"],
  graphite: ["#4f6379", "#71879b", "#a7c5d8"],
}
function AppearanceSummaryPreview({
  themeMode,
  colorful,
  palette,
}: {
  themeMode: ThemeMode
  colorful: boolean
  palette: Exclude<Palette, "league">
}) {
  const baseClass =
    themeMode === "light"
      ? "bg-white ring-neutral-200"
      : themeMode === "dark"
        ? "bg-neutral-900 ring-neutral-700"
        : "bg-gradient-to-r from-white from-50% to-neutral-900 to-50% ring-neutral-300"
  return (
    <span
      aria-hidden="true"
      className={`relative block h-10 w-10 overflow-hidden rounded-xl ring-1 ${baseClass}`}
    >
      {colorful ? (
        <>
          <span
            className="absolute inset-x-1.5 top-1.5 h-2 rounded-full"
            style={{ background: `linear-gradient(90deg, ${paletteSwatches[palette].join(", ")})` }}
          />
          <span className="absolute bottom-1.5 left-1.5 h-4 w-5 rounded-md bg-white/90" />
          <span
            className="absolute bottom-1.5 right-1.5 h-4 w-2 rounded-full"
            style={{ backgroundColor: paletteSwatches[palette][1] }}
          />
        </>
      ) : (
        <>
          <span className="absolute inset-x-1.5 top-1.5 h-2 rounded-full bg-neutral-200" />
          <span className="absolute bottom-1.5 left-1.5 h-4 w-5 rounded-md bg-neutral-200" />
          <span className="absolute bottom-1.5 right-1.5 h-4 w-2 rounded-full bg-neutral-300" />
        </>
      )}
    </span>
  )
}
function AppearanceSettingsLink() {
  const { t } = useI18n()
  const { themeMode, visualStyle, palette } = useTheme()
  const themeLabels: Record<ThemeMode, string> = {
    light: t.settings.appearanceLight,
    dark: t.settings.appearanceDark,
    system: t.settings.appearanceSystem,
  }
  const paletteLabels: Record<Exclude<Palette, "league">, string> = {
    classic: t.settings.visualStylePlain,
    indigo: t.settings.colorfulPaletteIndigo,
    midnight: t.settings.colorfulPaletteMidnight,
    sage: t.settings.colorfulPaletteSage,
    burgundy: t.settings.colorfulPaletteBurgundy,
    graphite: t.settings.colorfulPaletteGraphite,
  }
  const colorful = visualStyle === "classic" && palette !== "classic"
  const description = colorful
    ? `${themeLabels[themeMode]} · ${t.settings.visualStylePlain} · ${paletteLabels[palette === "league" ? "classic" : palette]}`
    : visualStyle === "competition"
      ? `${t.settings.appearanceDark} · ${t.settings.visualStyleColorful}`
    : `${themeLabels[themeMode]} · ${t.settings.visualStylePlain}`
  return (
    <SettingsLinkRow
      href="/settings/appearance"
      id="appearance"
      tour="settings-appearance"
      title={t.settings.appearanceTitle}
      description={description}
      leading={
        <AppearanceSummaryPreview
          themeMode={themeMode}
          colorful={colorful}
          palette={palette === "league" ? "classic" : palette}
        />
      }
    />
  )
}
function SessionSection() {
  const { tx } = useI18n()

  const { t } = useI18n()
  return (
    <SettingsSection title={tx("Sesión")}>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full px-3 py-3 text-left text-sm font-black text-red-700 transition active:bg-red-50"
      >
        {t.auth.signOut}
      </button>
    </SettingsSection>
  )
}

function AccountDataSection() {
  const { tx } = useI18n()
  const [busy, setBusy] = useState<"export" | "delete" | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function exportData() {
    setBusy("export")
    setMessage(null)
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" })
      if (!response.ok) throw new Error("export_failed")
      const payload = await response.json()
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `smash-and-lob-datos-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage(tx("Tus datos se han descargado en formato JSON."))
    } catch {
      setMessage(tx("No se han podido exportar tus datos."))
    } finally {
      setBusy(null)
    }
  }

  async function deleteAccount() {
    const confirmation = window.prompt(tx("Para confirmar, escribe ELIMINAR MI CUENTA."))
    if (confirmation !== "ELIMINAR MI CUENTA") return
    setBusy("delete")
    setMessage(null)
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      })
      if (!response.ok) throw new Error("delete_failed")
      setMessage(tx("Tu cuenta se ha anonimizado. Cierra sesión para terminar."))
    } catch {
      setMessage(tx("No se ha podido completar la eliminación de la cuenta."))
    } finally {
      setBusy(null)
    }
  }

  return (
    <SettingsSection title={tx("Mis datos") } description={tx("Descarga tus datos o solicita la anonimización de tu cuenta.")}>
      <div className="settings-row settings-row-default settings-search-target px-3 py-3" id="account-data">
        <p className="text-sm font-black text-neutral-950">{tx("Datos y privacidad")}</p>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">{tx("La exportación incluye únicamente la información asociada a tu cuenta.")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportData()} disabled={busy !== null} className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center text-xs font-black text-white disabled:opacity-50">{busy === "export" ? tx("Preparando...") : tx("Descargar mis datos")}</button>
          <button type="button" onClick={() => void deleteAccount()} disabled={busy !== null} className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-black text-red-700 disabled:opacity-50">{busy === "delete" ? tx("Procesando...") : tx("Eliminar mi cuenta")}</button>
        </div>
        {message ? <p className="mt-2 text-xs font-bold text-neutral-600">{message}</p> : null}
      </div>
    </SettingsSection>
  )
}
function SpectatorSettingsPage() {
  const { tx } = useI18n()

  const { t } = useI18n()
  const { data: session } = useSession()
  return (
    <div className="compact-page space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/" label={t.common.back} returnToParam="returnTo" />
        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">{tx("Ajustes")}</h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {tx("Cuenta de espectador · acceso de solo lectura.")}{" "}</p>
      </header>
      <AppCard className="border-blue-100 bg-blue-50">
        <p className="text-sm font-black text-blue-950">{tx("Modo espectador")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">
          {tx("Puedes consultar Home, ranking, partidos, resultados y perfiles. Las opciones de juego y administración permanecen ocultas.")}{" "}</p>
      </AppCard>
      <SettingsSection
        title={tx("Personal")}
        description={tx("Tu cuenta, idioma y aspecto de la aplicación.")}
      >
        <SettingsLinkRow
          href="/settings/profile"
          id="spectator-account"
          tour="settings-profile"
          title={t.settings.myProfileTitle}
          description={t.settings.myProfileDescription}
          leading={
            session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-xs font-black text-neutral-700">
                {tx("ES")}{" "}</div>
            )
          }
        />
        <SettingsStaticRow
          id="language"
          title={t.settings.language}
          description={t.settings.languageDescription}
          leading={<SettingsSectionIcon name="language" />}
        >
          <LanguageSwitcher />
        </SettingsStaticRow>
        <AppearanceSettingsLink />
      </SettingsSection>
      <SettingsSection
        title={tx("Mis ligas")}
        description={tx("Accede a las competiciones que sigues o en las que participas.")}
      >
        <SettingsLinkRow
          href="/leagues"
          id="leagues"
          tour="settings-context-switcher"
          title={tx("Mis ligas")}
          description={tx("Cambia entre ligas donde eres jugador o espectador.")}
          icon="leagues"
        />
      </SettingsSection>
      {isAvatarLabEnabled() ? (
        <SettingsSection
          title={tx("Laboratorio")}
          description={tx("Funciones experimentales disponibles solo en PRE.")}
        >
          <SettingsLinkRow
            href="/experimental/avatar-lab"
            id="avatar-lab"
            title={tx("Laboratorio de avatares")}
            description={tx("Prueba DiceBear Big Smile y Notion Avatar sin cambiar tu perfil.")}
            icon="avatar"
            badge={
              <span className="rounded-full bg-amber-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.1em] text-amber-800">
                PRE
              </span>
            }
          />
        </SettingsSection>
      ) : null}
      <SettingsSection
        title={tx("Ayuda e información")}
        description={tx("Documentación, novedades y versión instalada.")}
      >
        <SettingsLinkRow
          href="/settings/suggestions"
          id="suggestions"
          tour="settings-suggestions"
          title={tx("Buzón de sugerencias")}
          description={tx("Propón mejoras y nuevas funciones para Smash & Lob.")}
          icon="suggestions"
        />
        <SettingsLinkRow
          href="/help"
          id="help"
          title={t.settings.helpTitle}
          description={t.settings.helpDescription}
          icon="help"
        />
        <SettingsLinkRow
          href="/changelog"
          id="changelog"
          title={tx("Registro de cambios")}
          description={tx("Consulta las novedades publicadas en cada versión.")}
          icon="changelog"
        />
        <SettingsLinkRow
          href="/about"
          id="about-app"
          title={tx("Sobre Smash & Lob")}
          description={tx("Consulta la descripción pública y las funciones principales de la aplicación.")}
          icon="about"
        />
      </SettingsSection>
      <AccountDataSection />
      <SessionSection />
      <p
        data-visual-stable-version
        className="pb-1 text-center type-caption font-black uppercase tracking-[0.24em] text-neutral-600"
      >
        {settingsVersionLabel}
      </p>
    </div>
  )
}
export default function SettingsPage() {
  const { activeLeague } = useCurrentLeagueData()
  const { isLeagueSpectator, isSuperuser } = useLeagueAccess()
  if (!isSuperuser && isLeagueSpectator(activeLeague.id)) {
    return <SpectatorSettingsPage />
  }
  return <PlayerSettingsPage />
}
function PlayerSettingsPage() {
  const { tx } = useI18n()
  const { t } = useI18n()
  const { currentUser } = useCurrentUser()
  const { activeLeague, roundSettings } = useCurrentLeagueData()
  const {
    canAccessLeagueAdminTools,
    canCreateLeagues,
    getLeagueExperienceMode,
    getMembershipForLeague,
    hasLeagueAdminRole,
    isSuperuser,
    setLeagueExperienceMode,
    unlinkLeaguePlayerAccount,
    userLeagues,
  } = useLeagueAccess()
  const router = useRouter()
  const activeMembership = getMembershipForLeague(activeLeague.id)
  const hasAdminRole = hasLeagueAdminRole(activeLeague.id)
  const experienceMode = getLeagueExperienceMode(activeLeague.id)
  const canAccessAdmin = canAccessLeagueAdminTools(activeLeague.id)
  // Creating a new league is an account capability. It must remain available
  // while the active league is displayed in player experience mode.
  const canCreateLeaguesInCurrentView = canCreateLeagues
  const canSelfUnlink = Boolean(activeMembership && activeMembership.role !== "creator")
  const hasLeagues = userLeagues.length > 0
  const [isUnlinkingLeague, setIsUnlinkingLeague] = useState(false)
  const [unlinkLeagueError, setUnlinkLeagueError] = useState<string | null>(null)
  const [isSavingExperienceMode, setIsSavingExperienceMode] = useState(false)
  const [experienceModeError, setExperienceModeError] = useState<string | null>(null)
  const [paymentLedgerItems, setPaymentLedgerItems] = useState<Awaited<ReturnType<typeof fetchPaymentLedger>>["items"]>([])
  const [paymentLedgerLoaded, setPaymentLedgerLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchPaymentLedger()
      .then((payload) => {
        if (!cancelled) setPaymentLedgerItems(payload.items)
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setPaymentLedgerLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const pendingPaymentSummary = useMemo(
    () => getPaymentLedgerPendingSummary(paymentLedgerItems),
    [paymentLedgerItems],
  )
  const owedByMeAmount = pendingPaymentSummary.owedByMe
  const owedToMeAmount = pendingPaymentSummary.owedToMe
  const pendingPaymentCount =
    pendingPaymentSummary.owedByMeCount + pendingPaymentSummary.owedToMeCount
  const hasPendingPayments = paymentLedgerLoaded && pendingPaymentCount > 0

  async function handleExperienceModeChange(
    mode: "admin" | "player" | "player_experience",
  ) {
    if (isSavingExperienceMode || mode === experienceMode) return
    setIsSavingExperienceMode(true)
    setExperienceModeError(null)
    const ok = await setLeagueExperienceMode(activeLeague.id, mode)
    setIsSavingExperienceMode(false)
    if (!ok) {
      setExperienceModeError(tx("No se ha podido cambiar el modo de experiencia."))
    }
  }

  async function handleUnlinkCurrentLeague() {
    if (!canSelfUnlink || isUnlinkingLeague) {
      return
    }
    const confirmed = window.confirm(
      tx(`Vas a desvincularte de ${activeLeague.name}. Tu jugador quedará libre para poder reclamarlo de nuevo con una invitación. ¿Continuar?`),
    )
    if (!confirmed) {
      return
    }
    setIsUnlinkingLeague(true)
    setUnlinkLeagueError(null)
    const ok = await unlinkLeaguePlayerAccount(activeLeague.id, currentUser.id)
    setIsUnlinkingLeague(false)
    if (!ok) {
      setUnlinkLeagueError(
        "No se ha podido desvincular tu cuenta de esta liga. Revisa smash-lob-last-supabase-error.",
      )
      return
    }
    window.localStorage.removeItem("smash-lob-active-league")
    router.replace("/leagues")
  }
  return (
    <div className="compact-page space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/" label={t.common.back} returnToParam="returnTo" />
        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">
          {t.settings.title}
        </h1>
      </header>
      <SettingsSection
        title={tx("Personal")}
        description={tx("Tu perfil, preferencias y forma de participar en la liga.")}
      >
        <SettingsLinkRow
          href="/settings/profile"
          id="account"
          tour="settings-profile"
          title={t.settings.myProfileTitle}
          description={t.settings.myProfileDescription}
          leading={<PlayerAvatar player={currentUser} size="md" />}
        />
        <SettingsStaticRow
          id="language"
          title={t.settings.language}
          description={t.settings.languageDescription}
          leading={<SettingsSectionIcon name="language" />}
        >
          <LanguageSwitcher />
        </SettingsStaticRow>
        <AppearanceSettingsLink />
        <SettingsLinkRow
          href="/settings/notifications"
          id="notifications"
          tour="settings-notifications"
          title={tx("Notificaciones")}
          description={tx("Activa push y elige qué avisos quieres recibir en este dispositivo.")}
          icon="notifications"
        />
        {roundSettings.availabilityRecommendationsEnabled ? (
          <SettingsLinkRow
            href="/availability"
            id="availability"
            title={tx("Mi disponibilidad")}
            description={tx("Define cuándo puedes jugar para las recomendaciones de esta temporada.")}
            icon="availability"
          />
        ) : null}
      </SettingsSection>
      <SettingsSection
        title={tx("Mis ligas")}
        description={tx("Cambia de competición, entra en otra liga o crea una nueva.")}
      >
        {hasLeagues ? (
          <SettingsLinkRow
            href="/leagues"
            id="leagues"
            tour="settings-context-switcher"
            title={tx("Mis ligas")}
            description={tx(`Liga activa: ${activeLeague.name}. Consulta y cambia de competición.`)}
            icon="leagues"
          />
        ) : null}
        <SettingsLinkRow
          href="/invite"
          id="join-league"
          title={t.settings.joinNewExistingLeague}
          description={tx("Usa un código o enlace de invitación para acceder a otra liga.")}
          icon="join"
        />
        {canCreateLeaguesInCurrentView ? (
          <SettingsLinkRow
            href="/league/new"
            id="create-league"
            title={t.settings.createNewLeague}
            description={tx("Configura una competición nueva desde cero.")}
            icon="create"
          />
        ) : null}
        {canSelfUnlink ? (
          <div id="unlink" className="settings-search-target bg-red-50 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-red-950">
                  {tx("Desvincularme de esta liga")}{" "}</p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-red-700">
                  {tx("Libera tu jugador en")}{" "}{activeLeague.name} {tx("sin borrar partidos, resultados ni temporadas.")}{" "}</p>
              </div>
              <button
                type="button"
                onClick={handleUnlinkCurrentLeague}
                disabled={isUnlinkingLeague}
                className="inline-flex shrink-0 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:bg-red-200 items-center justify-center text-center"
              >
                {isUnlinkingLeague ? "Saliendo..." : "Desvincular"}
              </button>
            </div>
            {unlinkLeagueError ? (
              <p className="mt-2 text-xs font-bold text-red-700">
                {tx(unlinkLeagueError)}
              </p>
            ) : null}
          </div>
        ) : null}
      </SettingsSection>
      <SettingsSection
        title={tx("Actividad personal")}
        description={tx("Movimientos económicos e historial de la liga.")}
      >
        <SettingsLinkRow
          href="/payments"
          id="payments"
          title={tx("Mis pagos")}
          description={
            hasPendingPayments
              ? `Debes ${formatMoney(owedByMeAmount)} · Te deben ${formatMoney(owedToMeAmount)}`
              : tx("Consulta tus pagos, reservas e historial de movimientos.")
          }
          tone={hasPendingPayments ? "warning" : "default"}
          icon="payments"
          badge={
            hasPendingPayments ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 type-caption font-black uppercase tracking-[0.12em] text-white">
                {pendingPaymentCount} {tx("pendiente")}{pendingPaymentCount === 1 ? "" : "s"}
              </span>
            ) : null
          }
        />
        <SettingsLinkRow
          href="/activity?scope=all"
          id="activity"
          title={tx("Actividad de la liga")}
          description={tx("Consulta el historial de cambios y acciones desde que te vinculaste.")}
          icon="activity"
        />
      </SettingsSection>
      {hasAdminRole || isSuperuser ? (
        <SettingsSection
          title={tx("Administración")}
          description={tx("Herramientas que dependen de tus permisos actuales.")}
        >
          {hasAdminRole ? (
            <div
              id="admin-view"
              className="settings-row settings-row-default settings-search-target px-3 py-3"
            >
              <p className="text-sm font-black text-neutral-950">
                {tx("Modo de experiencia")}
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                {tx("Elige cómo quieres vivir esta liga sin cambiar tus permisos reales de administrador.")}
              </p>
              <div
                className="mt-3 grid gap-2"
                role="radiogroup"
                aria-label={tx("Modo de experiencia")}
              >
                {[
                  {
                    mode: "admin" as const,
                    title: tx("ADMINISTRADOR"),
                    description: tx("Vista completa con información y controles de administración."),
                  },
                  {
                    mode: "player" as const,
                    title: tx("JUGADOR"),
                    description: tx("Vive la liga como cualquier jugador. Solo este ajuste seguirá permitiéndote volver a modo admin."),
                  },
                  {
                    mode: "player_experience" as const,
                    title: tx("EXPERIENCIA JUGADOR"),
                    description: tx("Las pantallas de competición se comportan como jugador, pero Administración sigue disponible."),
                  },
                ].map((option) => {
                  const selected = experienceMode === option.mode
                  return (
                    <button
                      key={option.mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={isSavingExperienceMode}
                      onClick={() => void handleExperienceModeChange(option.mode)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60 ${
                        selected
                          ? "border-neutral-950 bg-neutral-50"
                          : "border-neutral-200 bg-white active:bg-neutral-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black tracking-wide text-neutral-950">
                          {option.title}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
                          {option.description}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-neutral-950" : "border-neutral-300"
                        }`}
                      >
                        {selected ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-neutral-950" />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
              {experienceModeError ? (
                <p className="mt-2 text-xs font-bold text-red-600">{experienceModeError}</p>
              ) : null}
            </div>
          ) : null}
          {canAccessAdmin ? (
            <SettingsLinkRow
              href="/admin"
              id="admin"
              title={t.settings.adminPanelTitle}
              description={tx("Gestiona la liga por áreas: general, personas, competición, operaciones y datos.")}
              icon="admin"
            />
          ) : null}
          {isSuperuser && canAccessAdmin ? (
            <SettingsLinkRow
              href="/application-admin"
              id="application-admin"
              title={tx("Gestión de la app")}
              description={tx("Administra usuarios, ubicaciones y otras herramientas globales de Smash & Lob.")}
              tone="danger"
              icon="applicationAdmin"
            />
          ) : null}
        </SettingsSection>
      ) : null}
      {isAvatarLabEnabled() ? (
        <SettingsSection
          title={tx("Laboratorio")}
          description={tx("Funciones experimentales disponibles solo en PRE.")}
        >
          <SettingsLinkRow
            href="/experimental/avatar-lab"
            id="avatar-lab"
            title={tx("Laboratorio de avatares")}
            description={tx("Prueba DiceBear Big Smile y Notion Avatar sin cambiar tu perfil.")}
            icon="avatar"
            badge={
              <span className="rounded-full bg-amber-100 px-2 py-0.5 type-caption font-black uppercase tracking-[0.1em] text-amber-800">
                PRE
              </span>
            }
          />
        </SettingsSection>
      ) : null}
      <SettingsSection
        title={tx("Ayuda e información")}
        description={tx("Documentación, novedades y versión instalada.")}
      >
        <SettingsLinkRow
          href="/settings/suggestions"
          id="suggestions"
          tour="settings-suggestions"
          title={tx("Buzón de sugerencias")}
          description={tx("Propón mejoras y nuevas funciones para Smash & Lob.")}
          icon="suggestions"
        />
        <SettingsLinkRow
          href="/help"
          id="help"
          title={t.settings.helpTitle}
          description={t.settings.helpDescription}
          icon="help"
        />
        <SettingsLinkRow
          href="/changelog"
          id="changelog"
          title={tx("Registro de cambios")}
          description={tx("Consulta las novedades publicadas en cada versión.")}
          icon="changelog"
        />
        <SettingsLinkRow
          href="/about"
          id="about-app"
          title={tx("Sobre Smash & Lob")}
          description={tx("Consulta la descripción pública y las funciones principales de la aplicación.")}
          icon="about"
        />
      </SettingsSection>
      <AccountDataSection />
      <SessionSection />
      <p
        data-visual-stable-version
        className="pb-1 text-center type-caption font-black uppercase tracking-[0.24em] text-neutral-600"
      >
        {settingsVersionLabel}
      </p>
    </div>
  )
}
