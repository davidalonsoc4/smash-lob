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

type SummaryItemProps = {
  label: string
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

function SummaryItem({ label, title, description }: SummaryItemProps) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-neutral-100">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-neutral-950">{title}</p>
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

        <h1 className="mt-1 sl-page-title">
          Ayuda y conceptos básicos
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Guía rápida para entender el formato de la liga, la puntuación, los estados de los partidos y los MVPs.
        </p>
      </header>

      <AppCard className="space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400">
            Resumen rápido
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-neutral-950">
            Lo importante de un vistazo
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-neutral-500">
            Smash & Lob está pensada para una liga individual aunque los partidos se jueguen por parejas. La clasificación premia la regularidad durante toda la temporada.
          </p>
        </div>

        <div className="grid gap-3">
          <SummaryItem
            label="1"
            title="Cada jugador suma sus propios puntos"
            description="No hay parejas fijas. Lo que consigas en cada partido se añade a tu clasificación individual."
          />
          <SummaryItem
            label="2"
            title="Los sets son la base del ranking"
            description="Un 3-0 reparte 3 puntos a la pareja ganadora. Un 2-1 reparte 2 puntos a la ganadora y 1 a la perdedora."
          />
          <SummaryItem
            label="3"
            title="Los juegos ayudan a desempatar"
            description="Si dos jugadores empatan a puntos, cuentan los juegos ganados, perdidos y la diferencia de juegos."
          />
        </div>
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
            description="No es punto de oro directo en cada 40-40. En los dos primeros 40-40 se juega con el sistema clásico de ventajas. Si el juego llega a un tercer 40-40, se juega un punto decisivo: quien gana ese punto, gana el juego."
          />
          <MiniCard
            title="Cuándo se juega el tie-break"
            description="Si el set llega a 6-6, se juega un tie-break para decidir quién gana ese set. En la app se apunta como 7-6 para la pareja ganadora."
          />
          <MiniCard
            title="Desde dónde se saca"
            description="Empieza sacando el jugador al que le toque por el orden normal de saque. Ese primer punto se saca desde el lado derecho. Después, el siguiente jugador saca dos puntos: primero desde el lado izquierdo y luego desde el derecho."
          />
          <MiniCard
            title="Cómo rota el saque"
            description="Tras el primer punto, cada jugador saca dos puntos seguidos, manteniendo el orden normal de saque entre las cuatro personas. En cada turno de dos puntos se alterna izquierda y derecha."
          />
          <MiniCard
            title="Cambios de lado"
            description="Las parejas cambian de lado cada 6 puntos jugados: por ejemplo 3-3, 6-0, 6-6, 9-3. También se cambia de lado al terminar el tie-break si corresponde por el orden del partido."
          />
          <MiniCard
            title="Cómo se gana"
            description="Gana la primera pareja que llega a 7 puntos con al menos 2 de diferencia. Si queda 6-6, se sigue jugando hasta que alguien gane por dos: 8-6, 9-7, 10-8, etc."
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
