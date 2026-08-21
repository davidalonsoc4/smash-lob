import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import type {
  PersonalProfileHeadToHead,
  PersonalProfileRelation,
  PersonalProfileStats,
} from "@/lib/personalProfileStats"

export type PersonalProfileSection = "summary" | "relations" | "head-to-head"

type PersonalProfileStatisticsProps = {
  stats: PersonalProfileStats
  section: PersonalProfileSection
  onSectionChange: (section: PersonalProfileSection) => void
  comparisonPeople: Array<{ key: string; name: string; avatarUrl: string | null }>
  comparisonKey: string
  onComparisonChange: (key: string) => void
  onRelationSelect: (key: string) => void
  onOpenPlayerProfile: (playerId: string, leagueId: string | null) => void
  headToHead: PersonalProfileHeadToHead | null
}

function signed(value: number) {
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? "+" : ""}${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}`
}

function percentage(value: number) {
  return `${Math.round(value)}%`
}

function decimal(value: number) {
  return (Math.round(value * 10) / 10).toFixed(1)
}

function countText(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`
}

function StatTile({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <p className="type-caption font-black uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-black tracking-tight text-neutral-950">{value}</p>
      {detail ? <p className="mt-0.5 type-caption font-semibold text-neutral-500">{detail}</p> : null}
    </div>
  )
}

function FormDots({ form }: { form: Array<"win" | "loss"> }) {
  if (form.length === 0) return <span className="text-xs font-semibold text-neutral-400">Sin datos</span>

  return (
    <div className="flex items-center gap-1.5" aria-label="Forma reciente">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full type-caption font-black ${
            result === "win"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-rose-100 text-rose-800"
          }`}
        >
          {result === "win" ? "V" : "D"}
        </span>
      ))}
    </div>
  )
}

function RelationHighlight({
  label,
  relation,
  detail,
  onSelect,
}: {
  label: string
  relation: PersonalProfileRelation | null
  detail: (relation: PersonalProfileRelation) => string
  onSelect: (key: string) => void
}) {
  if (!relation) {
    return (
      <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
        <p className="type-caption font-black uppercase tracking-wide text-neutral-500">{label}</p>
        <p className="mt-1 text-sm font-black text-neutral-400">—</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(relation.key)}
      className="w-full rounded-xl bg-neutral-50 px-3 py-2.5 text-left transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      aria-label={`${label}: ${relation.name}. Abrir cara a cara`}
    >
      <p className="type-caption font-black uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-1 flex min-w-0 items-center gap-2">
        <PlayerAvatar
          player={{ displayName: relation.name, avatarUrl: relation.avatarUrl }}
          size="sm"
        />
        <p className="min-w-0 flex-1 truncate type-player-name text-neutral-950">{relation.name}</p>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-neutral-400"><path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <p className="mt-1 type-caption font-semibold text-neutral-500">{detail(relation)}</p>
    </button>
  )
}

function RelationTable({
  title,
  subtitle,
  rows,
  onSelect,
}: {
  title: string
  subtitle: string
  rows: PersonalProfileRelation[]
  onSelect: (key: string) => void
}) {
  return (
    <AppCard className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-neutral-500">{subtitle}</p>
          <p className="mt-0.5 type-panel-title">{title}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-1 type-caption font-black text-neutral-600">
          {rows.length}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          {rows.map((row, index) => (
            <button
              key={row.key}
              type="button"
              onClick={() => onSelect(row.key)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-neutral-100 px-3 py-2.5 text-left transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              aria-label={`Abrir cara a cara con ${row.name}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="w-4 shrink-0 text-center type-caption font-black text-neutral-400">
                  {index + 1}
                </span>
                <PlayerAvatar
                  player={{ displayName: row.name, avatarUrl: row.avatarUrl }}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="type-player-name truncate">{row.name}</p>
                  <p className="type-caption font-semibold text-neutral-500">
                    {countText(row.matches, "partido", "partidos")} · {row.wins}V/{row.losses}D
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-black">{percentage(row.winRate)}</p>
                  <p className="type-caption font-semibold text-neutral-500">
                    {signed(row.gamesDiff)} juegos
                  </p>
                </div>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-neutral-400"><path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs font-semibold text-neutral-500">Sin datos suficientes.</p>
      )}
    </AppCard>
  )
}

function SummarySection({ stats }: { stats: PersonalProfileStats }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Partidos" value={stats.matchesPlayed} detail={`${stats.wins}V · ${stats.losses}D`} />
        <StatTile label="Victorias" value={percentage(stats.winRate)} detail="porcentaje global" />
        <StatTile label="Dif. juegos" value={signed(stats.gamesDiff)} detail={`${stats.gamesFor}-${stats.gamesAgainst}`} />
        <StatTile label="Racha actual" value={stats.currentWinStreak > 0 ? `${stats.currentWinStreak}V` : stats.currentLossStreak > 0 ? `${stats.currentLossStreak}D` : "—"} detail="resultado consecutivo" />
      </div>

      <AppCard className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Estadísticas de juego</p>
            <p className="mt-0.5 type-panel-title">Rendimiento global</p>
          </div>
          <div className="rounded-xl bg-neutral-950 px-3 py-2 text-right text-white">
            <p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-300">Forma</p>
            <div className="mt-1"><FormDots form={stats.currentForm} /></div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Sets" value={`${stats.setsFor}-${stats.setsAgainst}`} detail={`${percentage(stats.setWinRate)} ganados`} />
          <StatTile label="Dif. sets" value={signed(stats.setsDiff)} detail={`${decimal(stats.averageSetsFor)} a favor / partido`} />
          <StatTile label="Juegos" value={`${stats.gamesFor}-${stats.gamesAgainst}`} detail={`${percentage(stats.gamesWinRate)} a favor`} />
          <StatTile label="Media juegos" value={signed(stats.averageGamesDiff)} detail={`${decimal(stats.averageGamesFor)}-${decimal(stats.averageGamesAgainst)} / partido`} />
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="text-xs font-semibold text-neutral-500">Por origen</p>
        <p className="mt-0.5 type-panel-title">Liga y amistosos</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="type-caption font-black uppercase tracking-wide text-neutral-500">Liga</p>
            <p className="mt-1 text-lg font-black">{stats.leagueMatches}</p>
            <p className="type-caption font-semibold text-neutral-500">{stats.leagueWins}V/{stats.leagueLosses}D · {percentage(stats.leagueWinRate)}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="type-caption font-black uppercase tracking-wide text-neutral-500">Amistosos</p>
            <p className="mt-1 text-lg font-black">{stats.friendlyMatches}</p>
            <p className="type-caption font-semibold text-neutral-500">{stats.friendlyWins}V/{stats.friendlyLosses}D · {percentage(stats.friendlyWinRate)}</p>
          </div>
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="text-xs font-semibold text-neutral-500">Partidos especiales</p>
        <p className="mt-0.5 type-panel-title">Cómo llegan tus resultados</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatTile label="Victorias 2-0" value={stats.straightSetWins} />
          <StatTile label="Derrotas 0-2" value={stats.straightSetLosses} />
          <StatTile label="Partidos al 3º" value={stats.decidingSetMatches} detail={`${stats.decidingSetWins}V/${stats.decidingSetLosses}D · ${percentage(stats.decidingSetWinRate)}`} />
          <StatTile label="Remontadas" value={stats.comebackWins} detail="tras perder el primer set" />
          <StatTile label="Se escaparon" value={stats.firstSetLeadLosses} detail="tras ganar el primer set" />
          <StatTile label="Rivales distintos" value={stats.uniqueRivals} detail={`${stats.uniqueTeammates} compañeros`} />
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="text-xs font-semibold text-neutral-500">Rachas y récords</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Mejor racha" value={`${stats.bestWinStreak}V`} />
          <StatTile label="Peor racha" value={`${stats.bestLossStreak}D`} />
          <StatTile label="Mejor margen" value={stats.bestGameDiff === null ? "—" : signed(stats.bestGameDiff)} detail="juegos" />
          <StatTile label="Peor margen" value={stats.toughestGameDiff === null ? "—" : signed(stats.toughestGameDiff)} detail="juegos" />
        </div>
      </AppCard>
    </div>
  )
}

function RelationsSection({ stats, onSelect }: { stats: PersonalProfileStats; onSelect: (key: string) => void }) {
  return (
    <div className="space-y-3">
      <AppCard className="p-3">
        <p className="text-xs font-semibold text-neutral-500">Destacados</p>
        <p className="mt-0.5 type-panel-title">Parejas y rivales</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <RelationHighlight label="Con quien más juegas" relation={stats.mostFrequentTeammate} onSelect={onSelect} detail={(row) => `${countText(row.matches, "partido", "partidos")} · ${percentage(row.winRate)} victorias`} />
          <RelationHighlight label="Mejor pareja" relation={stats.bestTeammate} onSelect={onSelect} detail={(row) => `${row.wins}V/${row.losses}D · ${signed(row.gamesDiff)} juegos`} />
          <RelationHighlight label="Peor pareja" relation={stats.worstTeammate} onSelect={onSelect} detail={(row) => `${row.wins}V/${row.losses}D · ${signed(row.gamesDiff)} juegos`} />
          <RelationHighlight label="A quien más te enfrentas" relation={stats.mostFrequentRival} onSelect={onSelect} detail={(row) => `${countText(row.matches, "duelo", "duelos")} · ${percentage(row.winRate)} victorias`} />
          <RelationHighlight label="Rival más vencido" relation={stats.mostBeatenRival} onSelect={onSelect} detail={(row) => `${countText(row.wins, "victoria", "victorias")} en ${countText(row.matches, "duelo", "duelos")}`} />
          <RelationHighlight label="Némesis" relation={stats.nemesis} onSelect={onSelect} detail={(row) => `${countText(row.losses, "derrota", "derrotas")} en ${countText(row.matches, "duelo", "duelos")}`} />
          <RelationHighlight label="Mejor balance contra" relation={stats.bestRivalRecord} onSelect={onSelect} detail={(row) => `${percentage(row.winRate)} · ${signed(row.gamesDiff)} juegos`} />
          <RelationHighlight label="Rival más duro" relation={stats.toughestRival} onSelect={onSelect} detail={(row) => `${percentage(row.winRate)} · ${signed(row.gamesDiff)} juegos`} />
        </div>
      </AppCard>

      <RelationTable title="Todos tus compañeros" subtitle="Ordenados por partidos juntos" rows={stats.teammateRelations} onSelect={onSelect} />
      <RelationTable title="Todos tus rivales" subtitle="Ordenados por enfrentamientos" rows={stats.rivalRelations} onSelect={onSelect} />
    </div>
  )
}

function HeadToHeadSection({
  people,
  comparisonKey,
  onComparisonChange,
  onOpenPlayerProfile,
  headToHead,
}: {
  people: PersonalProfileStatisticsProps["comparisonPeople"]
  comparisonKey: string
  onComparisonChange: (key: string) => void
  onOpenPlayerProfile: (playerId: string, leagueId: string | null) => void
  headToHead: PersonalProfileHeadToHead | null
}) {
  if (people.length === 0) {
    return (
      <AppCard className="p-3">
        <p className="text-sm font-bold">Todavía no hay jugadores para comparar.</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">Necesitas al menos un partido terminado con otra persona.</p>
      </AppCard>
    )
  }

  const rivalry = headToHead?.rivalry ?? null
  const teammate = headToHead?.teammate ?? null

  return (
    <div className="space-y-3">
      <AppCard className="p-3">
        <p className="text-xs font-semibold text-neutral-500">Comparación global</p>
        <p className="mt-0.5 type-panel-title">Cara a cara</p>
        <label className="mt-3 block">
          <span className="type-caption font-black uppercase tracking-wide text-neutral-500">Comparar con</span>
          <select
            value={comparisonKey}
            onChange={(event) => onComparisonChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-neutral-400"
          >
            {people.map((person) => <option key={person.key} value={person.key}>{person.name}</option>)}
          </select>
        </label>
      </AppCard>

      {headToHead ? (
        <>
          <AppCard className="p-3">
            {headToHead.person.profilePlayerId ? (
              <button
                type="button"
                onClick={() => onOpenPlayerProfile(headToHead.person.profilePlayerId!, headToHead.person.profileLeagueId)}
                className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                aria-label={`Abrir estadísticas de ${headToHead.person.name}`}
              >
                <PlayerAvatar player={{ displayName: headToHead.person.name, avatarUrl: headToHead.person.avatarUrl }} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="type-player-name-prominent truncate underline-offset-2 hover:underline">{headToHead.person.name}</p>
                  <p className="text-xs font-semibold text-neutral-500">{countText(headToHead.sharedMatches, "partido compartido", "partidos compartidos")} · {countText(headToHead.rivalMatches, "como rival", "como rivales")} · {headToHead.teammateMatches} como pareja</p>
                </div>
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-neutral-400"><path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <PlayerAvatar player={{ displayName: headToHead.person.name, avatarUrl: headToHead.person.avatarUrl }} size="lg" />
                <div className="min-w-0">
                  <p className="type-player-name-prominent truncate">{headToHead.person.name}</p>
                  <p className="text-xs font-semibold text-neutral-500">{countText(headToHead.sharedMatches, "partido compartido", "partidos compartidos")} · {countText(headToHead.rivalMatches, "como rival", "como rivales")} · {headToHead.teammateMatches} como pareja</p>
                </div>
              </div>
            )}
          </AppCard>

          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">Como rivales</p>
            <p className="mt-0.5 type-panel-title">Enfrentamientos directos</p>
            {rivalry ? (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="type-caption font-black uppercase text-neutral-500">Tus victorias</p>
                    <p className="mt-1 text-2xl font-black">{rivalry.wins}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-100 p-2.5">
                    <p className="type-caption font-black uppercase text-neutral-500">Duelos</p>
                    <p className="mt-1 text-2xl font-black">{rivalry.matches}</p>
                  </div>
                  <div className="rounded-xl bg-neutral-50 p-2.5">
                    <p className="type-caption font-black uppercase text-neutral-500">Sus victorias</p>
                    <p className="mt-1 text-2xl font-black">{rivalry.losses}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <StatTile label="Sets" value={`${rivalry.setsFor}-${rivalry.setsAgainst}`} detail={signed(rivalry.setsDiff)} />
                  <StatTile label="Juegos" value={`${rivalry.gamesFor}-${rivalry.gamesAgainst}`} detail={signed(rivalry.gamesDiff)} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-100 px-3 py-2">
                  <div>
                    <p className="type-caption font-black uppercase tracking-wide text-neutral-500">Últimos duelos</p>
                    <p className="mt-0.5 text-xs font-semibold text-neutral-500">{percentage(rivalry.winRate)} de victorias</p>
                  </div>
                  <FormDots form={headToHead.recentRivalry} />
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs font-semibold text-neutral-500">Habéis compartido partidos, pero todavía no os habéis enfrentado como rivales.</p>
            )}
          </AppCard>

          <AppCard className="p-3">
            <p className="text-xs font-semibold text-neutral-500">Como compañeros</p>
            <p className="mt-0.5 type-panel-title">Rendimiento de la pareja</p>
            {teammate ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Partidos" value={teammate.matches} detail={`${teammate.wins}V/${teammate.losses}D`} />
                <StatTile label="Victorias" value={percentage(teammate.winRate)} />
                <StatTile label="Dif. sets" value={signed(teammate.setsDiff)} detail={`${teammate.setsFor}-${teammate.setsAgainst}`} />
                <StatTile label="Dif. juegos" value={signed(teammate.gamesDiff)} detail={`${decimal(teammate.averageGamesDiff)} / partido`} />
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-neutral-500">Todavía no habéis jugado juntos como pareja.</p>
            )}
          </AppCard>
        </>
      ) : null}
    </div>
  )
}

export function PersonalProfileStatistics({
  stats,
  section,
  onSectionChange,
  comparisonPeople,
  comparisonKey,
  onComparisonChange,
  onRelationSelect,
  onOpenPlayerProfile,
  headToHead,
}: PersonalProfileStatisticsProps) {
  return (
    <>
      <div data-personal-profile-sections className="grid grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
        {[
          ["summary", "Resumen"],
          ["relations", "Parejas / rivales"],
          ["head-to-head", "Cara a cara"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onSectionChange(value as PersonalProfileSection)}
            className={`rounded-lg px-1.5 py-1.5 type-caption font-black transition ${
              section === value ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {section === "summary" ? <SummarySection stats={stats} /> : null}
        {section === "relations" ? <RelationsSection stats={stats} onSelect={onRelationSelect} /> : null}
        {section === "head-to-head" ? (
          <HeadToHeadSection people={comparisonPeople} comparisonKey={comparisonKey} onComparisonChange={onComparisonChange} onOpenPlayerProfile={onOpenPlayerProfile} headToHead={headToHead} />
        ) : null}
      </div>
    </>
  )
}
