"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getPublicInviteUrl } from "@/lib/inviteUrls"

const qaModeEnabled = process.env.NEXT_PUBLIC_QA_MODE === "true"

function AdminGroup({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          {title}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </p>
      </div>
      <AppCard className="overflow-hidden !p-0">
        <div className="divide-y divide-neutral-100">{children}</div>
      </AppCard>
    </section>
  )
}

function AdminLinkRow({
  href,
  title,
  description,
  badge,
  tone = "default",
}: {
  href: string
  title: string
  description: string
  badge?: ReactNode
  tone?: "default" | "warning" | "qa"
}) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50"
      : tone === "qa"
        ? "bg-amber-50"
        : "bg-white"

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-3 transition active:bg-neutral-50 ${toneClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black text-neutral-950">{title}</p>
          {badge}
        </div>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          {description}
        </p>
      </div>
      <ClickableChevron className="shrink-0" />
    </Link>
  )
}

function AdminInviteCard({ leagueId }: { leagueId: string }) {
  const { getLeagueInviteCode, regenerateLeagueInviteCode } = useLeagueAccess()
  const [inviteCode, setInviteCode] = useState(() =>
    getLeagueInviteCode(leagueId),
  )
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inviteUrl = useMemo(
    () => (inviteCode ? getPublicInviteUrl(inviteCode) : ""),
    [inviteCode],
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
        "No se ha podido regenerar la invitación en la base de datos. Revisa Supabase o smash-lob-last-supabase-error.",
      )
      return
    }

    setInviteCode(nextInviteCode)
    setCopiedLabel("Código regenerado")
    window.setTimeout(() => setCopiedLabel(null), 1800)
  }

  return (
    <div id="invitations" className="settings-search-target px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-neutral-950">Invitaciones</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Comparte el código o el enlace para que otro jugador entre y reclame su perfil.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
          Acceso
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-neutral-100 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-500">
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
            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-400"
          >
            Copiar código
          </button>
          <button
            type="button"
            onClick={() => copyValue(inviteUrl, "URL copiada")}
            disabled={!inviteUrl}
            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-400"
          >
            Copiar enlace
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isRegenerating}
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-300"
      >
        {isRegenerating ? "Regenerando..." : "Regenerar invitación"}
      </button>

      {copiedLabel ? (
        <p className="mt-2 text-center text-xs font-semibold text-neutral-600">
          {copiedLabel}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default function AdminPage() {
  const { t } = useI18n()
  const { hasLeagueAdminRole, updateLeagueStatusColorsEnabled } =
    useLeagueAccess()
  const { activeLeague, matches } = useCurrentLeagueData()
  const [isUpdatingStatusColors, setIsUpdatingStatusColors] = useState(false)
  const [statusColorsError, setStatusColorsError] = useState<string | null>(null)
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const statusColorsEnabled = activeLeague.statusColorsEnabled !== false
  const openIncidentCount = matches.filter(
    (match) => match.incidentStatus === "open",
  ).length

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
    <div className="compact-page space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Administración de liga
        </h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Las herramientas están agrupadas por finalidad para separar configuración, competición y trabajo diario.
        </p>
      </header>

      <AdminGroup
        title="General y apariencia"
        description="Identidad, lugares habituales y presentación visual de la liga."
      >
        <AdminLinkRow
          href="/admin/league"
          title="Configuración general"
          description="Edita nombre, descripción, logo, lugares y estadísticas históricas."
        />
        <div id="status-colors" className="settings-search-target px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-neutral-950">Código de color</p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
                Usa colores suaves en etiquetas de estado, pagos y jornadas.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={statusColorsEnabled}
              aria-label="Código de color"
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
            <p className="mt-2 text-xs font-semibold text-red-600">
              {statusColorsError}
            </p>
          ) : null}
        </div>
      </AdminGroup>

      <AdminGroup
        title="Personas y accesos"
        description="Plantilla, cuentas vinculadas, espectadores, suplentes e invitaciones."
      >
        <AdminLinkRow
          href="/admin/users"
          title="Jugadores, usuarios y espectadores"
          description="Gestiona nombres visibles, vinculaciones, permisos y accesos de lectura."
        />
        <AdminLinkRow
          href="/admin/substitutes"
          title="Suplentes y reemplazos"
          description="Gestiona la bolsa de suplentes, sustituciones puntuales y bajas permanentes."
        />
        <AdminInviteCard leagueId={activeLeague.id} />
      </AdminGroup>

      <AdminGroup
        title="Competición"
        description="Temporada, reglas, calendario, jornadas y reconocimientos."
      >
        <AdminLinkRow
          href="/admin/season"
          title="Administrar temporada"
          description="Gestiona estado, calendario, reglas, inscripción, plantilla y ciclo de vida."
        />
        <AdminLinkRow
          href="/admin/mvp"
          title="Administrar MVP"
          description="Consulta los MVP de jornadas cerradas y el resultado de la temporada."
        />
      </AdminGroup>

      <AdminGroup
        title="Operaciones"
        description="Trabajo diario, incidencias y comunicación con los jugadores."
      >
        <AdminLinkRow
          href="/admin/incidents"
          title="Buzón de incidencias"
          description="Revisa y resuelve las incidencias pendientes de los partidos."
          tone={openIncidentCount > 0 ? "warning" : "default"}
          badge={
            openIncidentCount > 0 ? (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white">
                {openIncidentCount}
              </span>
            ) : null
          }
        />
        <AdminLinkRow
          href="/admin/announcements"
          title="Comunicados"
          description="Publica avisos en HOME y envía notificaciones a la liga."
        />
      </AdminGroup>

      <AdminGroup
        title="Datos y control"
        description="Auditoría, configuración de avisos y exportaciones."
      >
        <AdminLinkRow
          href="/activity?scope=admin"
          title="Historial y auditoría"
          description="Revisa la actividad administrativa y configura los avisos generales de la liga."
        />
        <AdminLinkRow
          href="/admin/exports"
          title="Exportar datos"
          description="Descarga clasificación y resultados de cualquier temporada en CSV."
        />
      </AdminGroup>

      {qaModeEnabled ? (
        <AdminGroup
          title="Herramientas internas"
          description="Utilidades exclusivas para pruebas en entornos controlados."
        >
          <AdminLinkRow
            href="/admin/qa"
            title={t.adminPanel.qaTitle}
            description={t.adminPanel.qaDescription}
            tone="qa"
            badge={
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-black uppercase text-amber-950">
                QA
              </span>
            }
          />
        </AdminGroup>
      ) : null}
    </div>
  )
}
