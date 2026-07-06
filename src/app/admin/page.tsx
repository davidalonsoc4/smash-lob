"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getPublicInviteUrl } from "@/lib/inviteUrls"
import { recordActivityEvent } from "@/lib/activity"


function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function AdminInviteCard({ leagueId }: { leagueId: string }) {
  const { getLeagueInviteCode, regenerateLeagueInviteCode } = useLeagueAccess()
  const { data: session } = useSession()
  const [inviteCode, setInviteCode] = useState(() =>
    getLeagueInviteCode(leagueId)
  )
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inviteUrl = useMemo(
    () => (inviteCode ? getPublicInviteUrl(inviteCode) : ""),
    [inviteCode, leagueId]
  )

  async function copyValue(value: string, label: string) {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopiedLabel(label)
      setError(null)
      window.setTimeout(() => setCopiedLabel(null), 1800)
    } catch {
      setError("No se ha podido copiar. Copia el texto manualmente.")
    }
  }

  async function handleRegenerate() {
    if (isRegenerating) {
      return
    }

    setIsRegenerating(true)
    setCopiedLabel(null)
    setError(null)

    const nextInviteCode = await regenerateLeagueInviteCode(leagueId)

    setIsRegenerating(false)

    if (!nextInviteCode) {
      setError(
        "No se ha podido regenerar la invitación en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setInviteCode(nextInviteCode)

    try {
      await recordActivityEvent({
        leagueId,
        ...getActorFromSession(session),
        type: "league_invite_regenerated",
        title: "Invitación regenerada",
        description: "Se ha generado un nuevo código de invitación para la liga. Los enlaces anteriores dejan de ser válidos.",
        metadata: {
          inviteCode: nextInviteCode,
        },
      })
    } catch {
      // La invitación ya está regenerada; la actividad es auxiliar.
    }

    setCopiedLabel("Código regenerado")
    window.setTimeout(() => setCopiedLabel(null), 1800)
  }

  return (
    <AppCard>
      <p className="font-bold">Invitaciones</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        Comparte el código o el enlace completo para que otro jugador pueda
        entrar en la liga y vincularse a su perfil.
      </p>

      <div className="mt-3 rounded-2xl bg-neutral-100 p-3">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          Código de invitación
        </p>
        <p className="mt-1 break-all text-sm font-black text-neutral-950">
          {inviteCode || "Sin código disponible"}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyValue(inviteCode, "Código copiado")}
            disabled={!inviteCode}
            className="rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 disabled:text-neutral-400"
          >
            Copiar código
          </button>

          <button
            type="button"
            onClick={() => copyValue(inviteUrl, "URL copiada")}
            disabled={!inviteUrl}
            className="rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 disabled:text-neutral-400"
          >
            Copiar URL
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isRegenerating ? "Regenerando..." : "Regenerar invitación"}
      </button>

      {copiedLabel ? (
        <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
          {copiedLabel}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </AppCard>
  )
}

export default function AdminPage() {
  const { t } = useI18n()
  const { hasLeagueAdminRole, updateLeagueStatusColorsEnabled } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const [isUpdatingStatusColors, setIsUpdatingStatusColors] = useState(false)
  const [statusColorsError, setStatusColorsError] = useState<string | null>(null)
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const statusColorsEnabled = activeLeague.statusColorsEnabled !== false

  if (!canAccessAdmin) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-1 text-xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  async function handleStatusColorsToggle() {
    if (isUpdatingStatusColors) {
      return
    }

    setIsUpdatingStatusColors(true)
    setStatusColorsError(null)

    const ok = await updateLeagueStatusColorsEnabled(
      activeLeague.id,
      !statusColorsEnabled,
    )

    setIsUpdatingStatusColors(false)

    if (!ok) {
      setStatusColorsError(
        "No se ha podido guardar el ajuste. Revisa Supabase o inténtalo de nuevo.",
      )
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.adminPanel.title}
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {t.adminPanel.description}
        </p>
      </header>

      <div className="compact-page space-y-3">
        <Link href="/admin/league" className="block">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.leagueTitle}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {t.adminPanel.leagueDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>

        <Link href="/admin/season" className="block">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.seasonTitle}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {t.adminPanel.seasonDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>

        <Link href="/admin/mvp" className="block">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">Administrar MVP</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  Consulta los MVPs automáticos de cada jornada.
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      </div>


      <AppCard>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold">Código de color</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Activa colores suaves en etiquetas de estado, pagos y jornadas para
              que la liga sea más fácil de leer. Si lo desactivas, las etiquetas
              vuelven a una estética gris.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={statusColorsEnabled}
            onClick={handleStatusColorsToggle}
            disabled={isUpdatingStatusColors}
            className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
              statusColorsEnabled ? "bg-neutral-950" : "bg-neutral-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                statusColorsEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {statusColorsError ? (
          <p className="mt-3 text-xs font-semibold text-red-600">
            {statusColorsError}
          </p>
        ) : null}
      </AppCard>

      <AdminInviteCard leagueId={activeLeague.id} />
    </div>
  )
}
