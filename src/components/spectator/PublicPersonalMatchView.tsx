"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useI18n } from "@/i18n/I18nProvider"
import type { PublicPersonalMatchPayload } from "@/lib/publicPersonalMatch"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function PublicPersonalMatchView({ code }: { code: string }) {
  const { tx } = useI18n()
  const router = useRouter()
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")
  const [payload, setPayload] = useState<PublicPersonalMatchPayload | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/public-personal-match/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) return null
        if (!response.ok) throw new Error("public_personal_match_unavailable")
        return (await response.json()) as PublicPersonalMatchPayload
      })
      .then((nextPayload) => {
        if (cancelled) return
        if (!nextPayload) {
          setState("missing")
          return
        }
        // Players of the match get the real, editable match with their own permissions.
        if (nextPayload.viewer === "participant" && nextPayload.matchId) {
          router.replace(`/personal-matches/${encodeURIComponent(nextPayload.matchId)}`)
          return
        }
        setPayload(nextPayload)
        setState("ready")
      })
      .catch(() => {
        if (!cancelled) setState("error")
      })

    return () => {
      cancelled = true
    }
  }, [code, router])

  const match = payload?.match
  const setsWon = match
    ? match.sets.reduce(
        (total, set) => ({
          a: total.a + (set.a > set.b ? 1 : 0),
          b: total.b + (set.b > set.a ? 1 : 0),
        }),
        { a: 0, b: 0 },
      )
    : null

  return (
    <main className="min-h-screen bg-neutral-100 px-3 pb-10 pt-6 text-neutral-950 sm:px-5 sm:pt-10">
      <div className="mx-auto max-w-md space-y-4">
        {state === "loading" ? (
          <AppCard><p className="font-black">{tx("Cargando partido...")}</p></AppCard>
        ) : null}
        {state === "missing" ? (
          <AppCard>
            <h1 className="text-xl font-black">{tx("Enlace no válido")}</h1>
            <p className="mt-2 text-sm text-neutral-500">{tx("Este enlace de partido no existe o ha sido desactivado.")}</p>
          </AppCard>
        ) : null}
        {state === "error" ? (
          <AppCard>
            <h1 className="text-xl font-black">{tx("No se ha podido cargar el partido")}</h1>
            <p className="mt-2 text-sm text-neutral-500">{tx("Comprueba tu conexión e inténtalo de nuevo.")}</p>
          </AppCard>
        ) : null}
        {state === "ready" && match && setsWon ? (
          <>
            <AppCard className="overflow-hidden bg-neutral-950 text-white">
              <p className="type-caption font-black uppercase tracking-[0.16em] text-white/60">{tx("Vista de espectador")}</p>
              <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-white">{tx("Partido amistoso")}</h1>
              <p className="mt-1 type-caption font-bold text-white/70">
                {match.status === "finished" ? tx("Finalizado") : tx("Programado")}
              </p>
              <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 type-caption font-bold text-white/75">
                {tx("Solo lectura · no se muestran datos personales ni actividad interna")}
              </p>
            </AppCard>

            <AppCard>
              <div className="min-w-0 space-y-2">
                {match.teams.map((team, index) => (
                  <div key={index} className="flex items-stretch justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="min-w-0 flex-1 text-sm font-bold leading-5 text-neutral-900">{team.join(" / ")}</p>
                    {match.status === "finished" && match.sets.length ? (
                      <p className="min-w-6 self-center text-right text-lg font-black tabular-nums text-neutral-950">
                        {index === 0 ? setsWon.a : setsWon.b}
                      </p>
                    ) : null}
                  </div>
                ))}
                {match.status === "finished" && match.sets.length ? (
                  <div className="flex flex-wrap gap-1.5 text-xs font-bold text-neutral-600">
                    {match.sets.map((set, index) => (
                      <span key={index} className="rounded-md bg-neutral-100 px-1.5 py-0.5">{set.a}-{set.b}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              {match.scheduledAt || match.location ? (
                <p className="mt-3 border-t border-neutral-100 pt-2 type-caption font-semibold text-neutral-500">
                  {[match.scheduledAt ? formatDate(match.scheduledAt) : null, match.location].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </AppCard>

            <Link href="/" className="block px-2 text-center type-caption font-bold text-neutral-500 underline underline-offset-2">
              {tx("Descubre Smash & Lob")}
            </Link>
          </>
        ) : null}
      </div>
    </main>
  )
}
