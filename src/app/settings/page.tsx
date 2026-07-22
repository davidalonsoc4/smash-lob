"use client"

import { ChangeEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { GlobalSettingsSearch } from "@/components/settings/GlobalSettingsSearch"
import { AccountNameSettings } from "@/components/settings/AccountNameSettings"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useTheme } from "@/context/ThemeProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import { resizeImageFileToDataUrl } from "@/lib/clientImages"
import {
  isSafeDataImageUrl,
  isSafeImageUrl,
  normalizeImageUrl,
} from "@/lib/imageUrl"
import { recordActivityEvent } from "@/lib/activity"
import { formatMoney } from "@/lib/courtBooking"
import { buildSettingsSearchEntries } from "@/lib/settingsSearch"


const qaModeEnabled = process.env.NEXT_PUBLIC_QA_MODE === "true"
const settingsVersionLabel = `Beta cerrada · ${APP_VERSION_LABEL}`

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function normalizeAvatarUrl(value: string | null | undefined) {
  const cleanValue = normalizeImageUrl(value)

  return cleanValue && isSafeImageUrl(cleanValue) ? cleanValue : null
}

function isCustomUploadedAvatar(value: string | null | undefined) {
  return isSafeDataImageUrl(value)
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
    <AppCard>
      <div>
        <p className="font-bold">{t.settings.appearanceTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {t.settings.appearanceDescription}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-neutral-100 p-1">
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
    </AppCard>
  )
}

function AccountAvatarSettings() {
  const { t } = useI18n()
  const { currentUser } = useCurrentUser()
  const { data: session } = useSession()
  const googleAvatarUrl = normalizeAvatarUrl(session?.user?.image)
  const { updateLeaguePlayerAvatar } = useLeagueAccess()
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const effectiveAvatarUrl = normalizeAvatarUrl(avatarUrl) ?? googleAvatarUrl
  const isUsingCustomAvatar = isCustomUploadedAvatar(avatarUrl)
  const avatarStatusLabel = isUsingCustomAvatar
    ? t.settings.avatarCustomActive
    : effectiveAvatarUrl
      ? t.settings.avatarGoogleFallback
      : t.settings.avatarInitialsFallback

  async function saveAvatar(nextAvatarUrl: string | null) {
    setIsSaving(true)
    setSaved(false)
    setError(null)

    const updated = await updateLeaguePlayerAvatar(
      currentUser.leagueId,
      currentUser.id,
      nextAvatarUrl
    )

    setIsSaving(false)

    if (!updated) {
      setError(t.settings.avatarSaveError)
      return
    }

    setAvatarUrl(nextAvatarUrl)

    try {
      await recordActivityEvent({
        leagueId: currentUser.leagueId,
        ...getActorFromSession(session),
        type: "player_avatar_updated",
        title: nextAvatarUrl ? "Imagen de perfil actualizada" : "Imagen de perfil eliminada",
        description: nextAvatarUrl
          ? `${currentUser.displayName} ha actualizado su imagen de perfil.`
          : `${currentUser.displayName} ha eliminado su imagen de perfil.`,
        metadata: {
          targetPlayerId: currentUser.id,
          targetPlayerName: currentUser.displayName,
          hasAvatar: Boolean(nextAvatarUrl),
        },
      })
    } catch {
      // La imagen ya está guardada; la actividad es auxiliar.
    }

    setSaved(true)
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const dataUrl = await resizeImageFileToDataUrl({
        file,
        maxSize: 512,
      })

      await saveAvatar(dataUrl)
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : t.settings.avatarProcessError
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center gap-3">
        <PlayerAvatar
          player={{
            ...currentUser,
            avatarUrl: effectiveAvatarUrl,
          }}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-neutral-950">
            {currentUser.displayName}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
            {session?.user?.email ?? t.settings.accountDescription}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-400">
            {avatarStatusLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block rounded-2xl bg-white px-3 py-2.5 text-center text-xs font-black text-neutral-800 shadow-sm">
          {isSaving ? t.common.saving : t.settings.uploadAvatar}
          <input
            type="file"
            accept="image/*"
            disabled={isSaving}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        <button
          type="button"
          onClick={() => saveAvatar(googleAvatarUrl)}
          disabled={isSaving || !isUsingCustomAvatar}
          className="rounded-2xl bg-white px-3 py-2.5 text-xs font-black text-neutral-800 shadow-sm disabled:text-neutral-300"
        >
          {t.settings.removeAvatar}
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      {saved ? (
        <p className="mt-2 text-xs font-semibold text-neutral-600">
          {t.settings.avatarSaved}
        </p>
      ) : null}
    </div>
  )
}


function SpectatorSettingsPage({
  leagueName,
}: {
  leagueName: string
}) {
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
    <div className="space-y-3">
      <header className="pt-1">
        <p className="text-sm font-medium text-neutral-500">
          {leagueName}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          Cuenta de espectador
        </h1>
        <p className="mt-1 text-sm font-semibold text-neutral-500">
          Acceso de solo lectura a la liga.
        </p>
      </header>

      <GlobalSettingsSearch locale={locale} entries={searchEntries} />

      <div id="spectator-account" className="settings-search-target"><AppCard>
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 text-sm font-black text-neutral-700">
              ES
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-black">
              {session?.user?.name ?? "Espectador"}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
              {session?.user?.email}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-neutral-50 px-3 py-2.5 text-xs font-semibold leading-5 text-neutral-600">
          Puedes consultar Home, ranking, partidos, resultados y perfiles. No puedes modificar datos ni acceder a la actividad interna.
        </div>

        <AccountNameSettings />
      </AppCard></div>

      <Link href="/leagues" className="block settings-search-target" id="leagues">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Mis ligas</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Cambia entre ligas donde eres jugador o espectador.
              </p>
            </div>
            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <div id="language" className="settings-search-target"><AppCard>
        <p className="font-bold">Idioma</p>
        <div className="mt-3">
          <LanguageSwitcher />
        </div>
      </AppCard></div>

      <div id="appearance" className="settings-search-target"><AppearanceSettings /></div>

      <Link href="/help" className="block settings-search-target" id="help">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Ayuda</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Consulta cómo funciona Smash & Lob.
              </p>
            </div>
            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 shadow-sm"
      >
        {t.auth.signOut}
      </button>

      <p className="pb-2 pt-3 text-center text-xs font-semibold text-neutral-400">
        {settingsVersionLabel}
      </p>
    </div>
  )
}

export default function SettingsPage() {
  const { activeLeague } = useCurrentLeagueData()
  const { isLeagueSpectator } = useLeagueAccess()

  if (isLeagueSpectator(activeLeague.id)) {
    return (
      <SpectatorSettingsPage leagueName={activeLeague.name} />
    )
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
            transfer.toPlayerId === currentUser.id
        )
        .map((transfer) => ({ match, transfer }))
    )
    .sort((left, right) => right.match.round - left.match.round)
  const pendingOwedByMe = paymentMovements.filter(
    ({ transfer }) => transfer.fromPlayerId === currentUser.id && !transfer.isPaid
  )
  const pendingOwedToMe = paymentMovements.filter(
    ({ transfer }) => transfer.toPlayerId === currentUser.id && !transfer.isPaid
  )
  const owedByMeAmount = pendingOwedByMe.reduce(
    (sum, { transfer }) => sum + transfer.amount,
    0
  )
  const owedToMeAmount = pendingOwedToMe.reduce(
    (sum, { transfer }) => sum + transfer.amount,
    0
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
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/profile" label={t.common.back} />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.settings.title}
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {t.settings.description}
        </p>
      </header>

      <GlobalSettingsSearch locale={locale} entries={searchEntries} />

      <p className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
        Preferencias
      </p>

      <div id="language" className="settings-search-target"><AppCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.settings.language}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.settings.languageDescription}
            </p>
          </div>

          <LanguageSwitcher />
        </div>
      </AppCard></div>

      <div id="appearance" className="settings-search-target"><AppearanceSettings /></div>

      <Link href="/settings/notifications" className="block settings-search-target" id="notifications">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Notificaciones</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Activa push y elige qué avisos quieres recibir en este dispositivo.
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <Link href="/payments" className="block settings-search-target" id="payments">
        <AppCard
          className={`transition active:scale-[0.99] ${
            hasPendingPayments ? "border-amber-200 bg-amber-50" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">Mis pagos</p>
                {hasPendingPayments ? (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    {pendingPaymentCount} pendiente{pendingPaymentCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {hasPendingPayments
                  ? `Debes ${formatMoney(owedByMeAmount)} · Te deben ${formatMoney(owedToMeAmount)}`
                  : "Consulta tus pagos, reservas e historial de movimientos."}
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <Link href="/availability" className="block settings-search-target" id="availability">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Mi disponibilidad</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Define cuándo puedes jugar para futuras recomendaciones de horarios.
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <Link href="/help" className="block settings-search-target" id="help">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">{t.settings.helpTitle}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {t.settings.helpDescription}
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      <p className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
        Liga
      </p>

      <Link href="/activity?scope=all" className="block settings-search-target" id="activity">
        <AppCard className="transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold">Actividad de la liga</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Consulta el historial de cambios y acciones desde que te vinculaste.
              </p>
            </div>

            <span className="text-xl">&gt;</span>
          </div>
        </AppCard>
      </Link>

      {hasAdminRole ? (
        <div id="admin-view" className="settings-search-target"><AppCard>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">Vista admin</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                Desactívala para ocultar accesos y acciones de administrador y ver la liga como un jugador normal.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAdminViewEnabled}
              onClick={() => setAdminViewEnabled(!isAdminViewEnabled)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                isAdminViewEnabled ? "bg-neutral-950" : "bg-neutral-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  isAdminViewEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </AppCard></div>
      ) : null}

      {hasLeagues ? (
        <Link href="/leagues" className="block settings-search-target" id="leagues">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Mis ligas</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  Liga activa: {activeLeague.name}. Cambia de liga desde una
                  pantalla propia con resumen de cada competición.
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      ) : null}

      {canAccessAdmin ? (
        <Link href="/admin" className="block settings-search-target" id="admin">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.settings.adminPanelTitle}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {t.settings.adminPanelDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      ) : null}

      <p className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
        Cuenta
      </p>

      <div id="account" className="settings-search-target"><AppCard>
        <div className="min-w-0">
          <p className="font-bold">{t.settings.accountTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.settings.accountDescription}
          </p>
        </div>

        <AccountNameSettings />
        <AccountAvatarSettings />

        <div className="mt-3 grid gap-2">
          <Link
            href="/invite"
            className="block w-full rounded-2xl bg-neutral-100 px-3 py-2.5 text-center text-sm font-black text-neutral-800"
          >
            {t.settings.joinNewExistingLeague}
          </Link>

          {canCreateLeaguesInCurrentView ? (
            <Link
              href="/league/new"
              className="block w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
            >
              {t.settings.createNewLeague}
            </Link>
          ) : null}
        </div>
      </AppCard></div>


      <p className="pt-1 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
        Zona sensible
      </p>

      {canSelfUnlink ? (
        <div id="unlink" className="settings-search-target"><AppCard className="border-red-100 bg-red-50">
          <p className="font-bold text-red-950">Desvincularme de esta liga</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-red-700">
            Saldrás de {activeLeague.name} y tu jugador quedará libre para poder
            reclamarlo de nuevo con una invitación. No se borran partidos, resultados
            ni temporadas.
          </p>
          <button
            type="button"
            onClick={handleUnlinkCurrentLeague}
            disabled={isUnlinkingLeague}
            className="mt-3 w-full rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-black text-white disabled:bg-red-200"
          >
            {isUnlinkingLeague ? "Desvinculando..." : "Desvincularme de esta liga"}
          </button>
          {unlinkLeagueError ? (
            <p className="mt-2 text-xs font-bold text-red-700">{unlinkLeagueError}</p>
          ) : null}
        </AppCard></div>
      ) : null}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full rounded-2xl border border-red-100 bg-white px-3 py-2.5 text-sm font-black text-red-700 shadow-sm"
      >
        {t.auth.signOut}
      </button>

      <p className="pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-300">
        {settingsVersionLabel}
      </p>
    </div>
  )
}
