"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { GlobalSettingsSearch } from "@/components/settings/GlobalSettingsSearch"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useTheme } from "@/context/ThemeProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import { formatMoney } from "@/lib/courtBooking"
import { buildSettingsSearchEntries } from "@/lib/settingsSearch"

const qaModeEnabled = process.env.NEXT_PUBLIC_QA_MODE === "true"
const settingsVersionLabel = `Beta cerrada · ${APP_VERSION_LABEL}`

type SettingsSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="space-y-2">
      <div className="px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {description}
          </p>
        ) : null}
      </div>
      <AppCard className="overflow-hidden !p-0">
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
  badge?: ReactNode
  tone?: "default" | "warning" | "danger"
}

function SettingsLinkRow({
  href,
  title,
  description,
  id,
  leading,
  badge,
  tone = "default",
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
      className={`settings-search-target flex items-center gap-3 px-3 py-3 transition active:bg-neutral-50 ${toneClass}`}
    >
      {leading ? <div className="shrink-0">{leading}</div> : null}
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
  children,
}: {
  id?: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div id={id} className="settings-search-target px-3 py-3">
      <div className="flex items-center justify-between gap-3">
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

function SettingsToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 rounded-full transition ${
        checked ? "bg-neutral-950" : "bg-neutral-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  )
}

function AppearanceSettings() {
  const { t } = useI18n()
  const { preference, setPreference } = useTheme()
  const options = [
    { value: "light" as const, label: t.settings.appearanceLight },
    { value: "dark" as const, label: t.settings.appearanceDark },
    { value: "system" as const, label: t.settings.appearanceSystem },
  ]

  return (
    <div id="appearance" className="settings-search-target px-3 py-3">
      <p className="text-sm font-black text-neutral-950">
        {t.settings.appearanceTitle}
      </p>
      <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
        {t.settings.appearanceDescription}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-neutral-100 p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            className={`rounded-xl px-2 py-2 text-xs font-black transition ${
              preference === option.value
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SessionSection() {
  const { t } = useI18n()

  return (
    <SettingsSection title="Sesión">
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

function SpectatorSettingsPage({ leagueName }: { leagueName: string }) {
  const { t, locale } = useI18n()
  const { data: session } = useSession()
  const searchEntries = buildSettingsSearchEntries(locale, {
    isSpectator: true,
    canAccessAdmin: false,
    hasAdminRole: false,
    canCreateLeague: false,
    canSelfUnlink: false,
    qaEnabled: false,
  })

  return (
    <div className="compact-page space-y-4">
      <header className="pt-1">
        <BackButton fallbackHref="/profile" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">{leagueName}</p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">Ajustes</h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Cuenta de espectador · acceso de solo lectura.
        </p>
      </header>

      <GlobalSettingsSearch locale={locale} entries={searchEntries} />

      <AppCard className="border-blue-100 bg-blue-50">
        <p className="text-sm font-black text-blue-950">Modo espectador</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-blue-700">
          Puedes consultar Home, ranking, partidos, resultados y perfiles. Las opciones de juego y administración permanecen ocultas.
        </p>
      </AppCard>

      <SettingsSection
        title="Personal"
        description="Tu cuenta, idioma y aspecto de la aplicación."
      >
        <SettingsLinkRow
          href="/settings/profile"
          id="spectator-account"
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
                ES
              </div>
            )
          }
        />
        <SettingsStaticRow
          id="language"
          title={t.settings.language}
          description={t.settings.languageDescription}
        >
          <LanguageSwitcher />
        </SettingsStaticRow>
        <AppearanceSettings />
      </SettingsSection>

      <SettingsSection
        title="Mis ligas"
        description="Accede a las competiciones que sigues o en las que participas."
      >
        <SettingsLinkRow
          href="/leagues"
          id="leagues"
          title="Mis ligas"
          description="Cambia entre ligas donde eres jugador o espectador."
        />
      </SettingsSection>

      <SettingsSection
        title="Ayuda e información"
        description="Documentación, novedades y versión instalada."
      >
        <SettingsLinkRow
          href="/help"
          id="help"
          title={t.settings.helpTitle}
          description={t.settings.helpDescription}
        />
        <SettingsLinkRow
          href="/changelog"
          id="changelog"
          title="Registro de cambios"
          description="Consulta las novedades publicadas en cada versión."
        />
      </SettingsSection>

      <SessionSection />

      <p className="pb-1 text-center text-[10px] font-black uppercase tracking-[0.24em] text-neutral-400">
        {settingsVersionLabel}
      </p>
    </div>
  )
}

export default function SettingsPage() {
  const { activeLeague } = useCurrentLeagueData()
  const { isLeagueSpectator, isSuperuser } = useLeagueAccess()

  if (!isSuperuser && isLeagueSpectator(activeLeague.id)) {
    return <SpectatorSettingsPage leagueName={activeLeague.name} />
  }

  return <PlayerSettingsPage />
}

function PlayerSettingsPage() {
  const { t, locale } = useI18n()
  const { currentUser } = useCurrentUser()
  const { activeLeague, matches } = useCurrentLeagueData()
  const {
    canCreateLeagues,
    getMembershipForLeague,
    hasLeagueAdminRole,
    isLeagueAdmin,
    isSuperuser,
    isAdminViewEnabled,
    setAdminViewEnabled,
    unlinkLeaguePlayerAccount,
    userLeagues,
  } = useLeagueAccess()
  const router = useRouter()
  const activeMembership = getMembershipForLeague(activeLeague.id)
  const hasAdminRole = hasLeagueAdminRole(activeLeague.id)
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const canCreateLeaguesInCurrentView = canCreateLeagues && isAdminViewEnabled
  const canSelfUnlink = Boolean(activeMembership && activeMembership.role !== "creator")
  const hasLeagues = userLeagues.length > 0
  const [isUnlinkingLeague, setIsUnlinkingLeague] = useState(false)
  const [unlinkLeagueError, setUnlinkLeagueError] = useState<string | null>(null)
  const paymentMovements = matches
    .flatMap((match) =>
      match.courtBooking.transfers
        .filter(
          (transfer) =>
            transfer.fromPlayerId === currentUser.id ||
            transfer.toPlayerId === currentUser.id,
        )
        .map((transfer) => ({ match, transfer })),
    )
    .sort((left, right) => right.match.round - left.match.round)
  const pendingOwedByMe = paymentMovements.filter(
    ({ transfer }) => transfer.fromPlayerId === currentUser.id && !transfer.isPaid,
  )
  const pendingOwedToMe = paymentMovements.filter(
    ({ transfer }) => transfer.toPlayerId === currentUser.id && !transfer.isPaid,
  )
  const owedByMeAmount = pendingOwedByMe.reduce(
    (sum, { transfer }) => sum + transfer.amount,
    0,
  )
  const owedToMeAmount = pendingOwedToMe.reduce(
    (sum, { transfer }) => sum + transfer.amount,
    0,
  )
  const pendingPaymentCount = pendingOwedByMe.length + pendingOwedToMe.length
  const hasPendingPayments = pendingPaymentCount > 0
  const searchEntries = buildSettingsSearchEntries(locale, {
    isSpectator: false,
    canAccessAdmin,
    hasAdminRole,
    canCreateLeague: canCreateLeaguesInCurrentView,
    canSelfUnlink,
    qaEnabled: qaModeEnabled,
  })

  async function handleUnlinkCurrentLeague() {
    if (!canSelfUnlink || isUnlinkingLeague) {
      return
    }

    const confirmed = window.confirm(
      `Vas a desvincularte de ${activeLeague.name}. Tu jugador quedará libre para poder reclamarlo de nuevo con una invitación. ¿Continuar?`,
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
      <header className="pt-1">
        <BackButton fallbackHref="/profile" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.settings.title}
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Todo lo relacionado con tu cuenta, tus ligas y la aplicación.
        </p>
      </header>

      <GlobalSettingsSearch locale={locale} entries={searchEntries} />

      <SettingsSection
        title="Personal"
        description="Tu perfil, preferencias y forma de participar en la liga."
      >
        <SettingsLinkRow
          href="/settings/profile"
          id="account"
          title={t.settings.myProfileTitle}
          description={t.settings.myProfileDescription}
          leading={<PlayerAvatar player={currentUser} size="md" />}
        />
        <SettingsStaticRow
          id="language"
          title={t.settings.language}
          description={t.settings.languageDescription}
        >
          <LanguageSwitcher />
        </SettingsStaticRow>
        <AppearanceSettings />
        <SettingsLinkRow
          href="/settings/notifications"
          id="notifications"
          title="Notificaciones"
          description="Activa push y elige qué avisos quieres recibir en este dispositivo."
        />
        <SettingsLinkRow
          href="/availability"
          id="availability"
          title="Mi disponibilidad"
          description="Define cuándo puedes jugar para futuras recomendaciones de horarios."
        />
      </SettingsSection>

      <SettingsSection
        title="Mis ligas"
        description="Cambia de competición, entra en otra liga o crea una nueva."
      >
        {hasLeagues ? (
          <SettingsLinkRow
            href="/leagues"
            id="leagues"
            title="Mis ligas"
            description={`Liga activa: ${activeLeague.name}. Consulta y cambia de competición.`}
          />
        ) : null}
        <SettingsLinkRow
          href="/invite"
          id="join-league"
          title={t.settings.joinNewExistingLeague}
          description="Usa un código o enlace de invitación para acceder a otra liga."
        />
        {canCreateLeaguesInCurrentView ? (
          <SettingsLinkRow
            href="/league/new"
            id="create-league"
            title={t.settings.createNewLeague}
            description="Configura una competición nueva desde cero."
          />
        ) : null}
        {canSelfUnlink ? (
          <div id="unlink" className="settings-search-target bg-red-50 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-red-950">
                  Desvincularme de esta liga
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-red-700">
                  Libera tu jugador en {activeLeague.name} sin borrar partidos, resultados ni temporadas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleUnlinkCurrentLeague}
                disabled={isUnlinkingLeague}
                className="shrink-0 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white disabled:bg-red-200"
              >
                {isUnlinkingLeague ? "Saliendo..." : "Desvincular"}
              </button>
            </div>
            {unlinkLeagueError ? (
              <p className="mt-2 text-xs font-bold text-red-700">
                {unlinkLeagueError}
              </p>
            ) : null}
          </div>
        ) : null}
      </SettingsSection>

      <SettingsSection
        title="Actividad personal"
        description="Movimientos económicos e historial de la liga."
      >
        <SettingsLinkRow
          href="/payments"
          id="payments"
          title="Mis pagos"
          description={
            hasPendingPayments
              ? `Debes ${formatMoney(owedByMeAmount)} · Te deben ${formatMoney(owedToMeAmount)}`
              : "Consulta tus pagos, reservas e historial de movimientos."
          }
          tone={hasPendingPayments ? "warning" : "default"}
          badge={
            hasPendingPayments ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                {pendingPaymentCount} pendiente{pendingPaymentCount === 1 ? "" : "s"}
              </span>
            ) : null
          }
        />
        <SettingsLinkRow
          href="/activity?scope=all"
          id="activity"
          title="Actividad de la liga"
          description="Consulta el historial de cambios y acciones desde que te vinculaste."
        />
      </SettingsSection>

      {hasAdminRole || isSuperuser ? (
        <SettingsSection
          title="Administración"
          description="Herramientas que dependen de tus permisos actuales."
        >
          {hasAdminRole ? (
            <SettingsStaticRow
              id="admin-view"
              title="Vista admin"
              description="Oculta temporalmente accesos y acciones de administración para ver la liga como jugador."
            >
              <SettingsToggle
                checked={isAdminViewEnabled}
                onChange={() => setAdminViewEnabled(!isAdminViewEnabled)}
                label="Vista admin"
              />
            </SettingsStaticRow>
          ) : null}
          {canAccessAdmin ? (
            <SettingsLinkRow
              href="/admin"
              id="admin"
              title={t.settings.adminPanelTitle}
              description="Gestiona la liga por áreas: general, personas, competición, operaciones y datos."
            />
          ) : null}
          {isSuperuser ? (
            <SettingsLinkRow
              href="/application-admin"
              id="application-admin"
              title="Administración de la aplicación"
              description="Gestiona cuentas globales, permisos, suspensiones y auditoría."
              tone="danger"
            />
          ) : null}
        </SettingsSection>
      ) : null}

      <SettingsSection
        title="Ayuda e información"
        description="Documentación, novedades y versión instalada."
      >
        <SettingsLinkRow
          href="/help"
          id="help"
          title={t.settings.helpTitle}
          description={t.settings.helpDescription}
        />
        <SettingsLinkRow
          href="/changelog"
          id="changelog"
          title="Registro de cambios"
          description="Consulta las novedades publicadas en cada versión."
        />
      </SettingsSection>

      <SessionSection />

      <p className="pb-1 text-center text-[10px] font-black uppercase tracking-[0.24em] text-neutral-400">
        {settingsVersionLabel}
      </p>
    </div>
  )
}
