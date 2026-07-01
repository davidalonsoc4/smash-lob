"use client"

import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

type HelpBlockProps = {
  eyebrow?: string
  title: string
  children: React.ReactNode
}

type MiniCardProps = {
  title: string
  description: string
}

function HelpBlock({ eyebrow, title, children }: HelpBlockProps) {
  return (
    <AppCard className="space-y-3">
      {eyebrow ? (
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl font-black tracking-tight text-neutral-950">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
        {children}
      </div>
    </AppCard>
  )
}

function MiniCard({ title, description }: MiniCardProps) {
  return (
    <div className="rounded-2xl bg-neutral-100 px-4 py-3">
      <p className="text-sm font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-neutral-500">
        {description}
      </p>
    </div>
  )
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-3 last:border-b-0">
      <p className="text-sm font-black text-neutral-900">{label}</p>
      <p className="max-w-[62%] text-right text-sm font-semibold text-neutral-500">
        {value}
      </p>
    </div>
  )
}

export default function HelpPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Ayuda y conceptos básicos
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Guía rápida para entender cómo se juega la liga, cómo se puntúa y qué significa cada estado dentro de Smash & Lob.
        </p>
      </header>

      <AppCard className="bg-neutral-950 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
          Resumen rápido
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">
          Ganas puntos ganando sets, no solo partidos.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-neutral-300">
          Cada jugador suma de forma individual. Tu pareja cambia, tus rivales cambian y la clasificación premia la regularidad durante toda la temporada.
        </p>
      </AppCard>

      <HelpBlock eyebrow="Formato" title="Cómo funciona una temporada">
        <div className="grid gap-3">
          <MiniCard
            title="Parejas rotativas"
            description="No hay parejas fijas. La temporada intenta que todos jueguen con todos y contra todos de forma equilibrada."
          />
          <MiniCard
            title="Jornadas"
            description="Cada jornada contiene los partidos que tocan según el calendario de la temporada."
          />
          <MiniCard
            title="Clasificación individual"
            description="Aunque juegues en pareja, los puntos se suman a cada jugador por separado."
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow="Puntuación" title="Cómo se suman los puntos">
        <div className="rounded-2xl bg-white px-4 py-1 shadow-sm ring-1 ring-neutral-100">
          <RuleRow label="Partido 3-0" value="3 puntos para cada jugador de la pareja ganadora" />
          <RuleRow label="Partido 2-1" value="2 puntos para la pareja ganadora y 1 para la perdedora" />
          <RuleRow label="Desempates" value="Primero puntos, después juegos y diferencia de juegos" />
        </div>
        <p>
          El ranking mide sets ganados por jugador. Por eso incluso perdiendo un partido puedes sumar si peleas un set.
        </p>
      </HelpBlock>

      <HelpBlock eyebrow="Regla clave" title="Por qué se juegan siempre 3 sets">
        <p>
          Jugar siempre 3 sets hace que todos los partidos repartan el mismo volumen de puntos y juegos. Así la clasificación es más justa y comparable.
        </p>
        <div className="grid gap-2">
          <MiniCard
            title="Más justo"
            description="Todos los jugadores compiten por la misma cantidad de sets."
          />
          <MiniCard
            title="Más emoción"
            description="Aunque una pareja pierda los dos primeros sets, el tercero todavía cuenta."
          />
          <MiniCard
            title="Menos castigo por un mal set"
            description="La regularidad pesa más que un inicio malo o un bajón puntual."
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow="Partidos" title="Estados de un partido">
        <div className="rounded-2xl bg-white px-4 py-1 shadow-sm ring-1 ring-neutral-100">
          <RuleRow label="Sin fecha" value="El partido existe, pero todavía no está cerrado cuándo se juega" />
          <RuleRow label="Programado" value="Tiene fecha, hora o lugar asignado" />
          <RuleRow label="Aplazado" value="Se ha marcado como pendiente de recolocar" />
          <RuleRow label="Finalizado" value="Ya tiene resultado registrado" />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow="Pádel" title="Star Point y tie-break">
        <div className="grid gap-3">
          <MiniCard
            title="Star Point"
            description="En 40-40 se juega un punto decisivo. Quien gana ese punto, gana el juego. La pareja que resta elige lado."
          />
          <MiniCard
            title="Tie-break"
            description="Con 6-6 se juega tie-break. En la app se apunta el set como 7-6 para la pareja que lo gana."
          />
        </div>
      </HelpBlock>

      <HelpBlock eyebrow="MVP" title="Cómo funcionan los MVP">
        <p>
          El MVP de jornada se calcula automáticamente cuando todos los partidos de esa jornada están terminados. El MVP de temporada sale de los MVPs de jornada acumulados.
        </p>
        <p className="rounded-2xl bg-neutral-100 p-3 text-xs font-bold text-neutral-600">
          Si hay empate real, la app puede mostrar MVP compartido.
        </p>
      </HelpBlock>
    </div>
  )
}
