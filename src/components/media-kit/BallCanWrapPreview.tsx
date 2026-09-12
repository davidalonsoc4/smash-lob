"use client"

import Image from "next/image"

type BallCanWrapPlayer = {
  id: string
  displayName: string
}

type BallCanWrapPreviewProps = {
  leagueName: string
  leagueLogoUrl?: string | null
  seasonName: string
  players: BallCanWrapPlayer[]
  accent: string
}

const WIDTH_MM = 240
const HEIGHT_MM = 130

function splitDisplayName(value: string) {
  const [firstName = "", ...surnameParts] = value.trim().split(/\s+/)
  return { firstName, surname: surnameParts.join(" ") }
}

function sortPlayersByFirstName(players: BallCanWrapPlayer[]) {
  return [...players].sort((a, b) => {
    const left = splitDisplayName(a.displayName)
    const right = splitDisplayName(b.displayName)
    return (
      left.firstName.localeCompare(right.firstName, "es", { sensitivity: "base" }) ||
      left.surname.localeCompare(right.surname, "es", { sensitivity: "base" })
    )
  })
}

function LeagueMark({ leagueName, leagueLogoUrl }: { leagueName: string; leagueLogoUrl?: string | null }) {
  if (leagueLogoUrl) {
    return (
      <Image
        unoptimized
        src={leagueLogoUrl}
        alt={leagueName}
        width={150}
        height={82}
        className="h-auto max-h-[72px] w-auto max-w-[138px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.42)]"
      />
    )
  }

  const initials = leagueName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "SL"

  return <span className="text-3xl font-black tracking-[.2em] text-white">{initials}</span>
}

export function BallCanWrapPreview({ leagueName, leagueLogoUrl, seasonName, players, accent }: BallCanWrapPreviewProps) {
  const roster = sortPlayersByFirstName(players)
  const midpoint = Math.ceil(roster.length / 2)
  const columns = [roster.slice(0, midpoint), roster.slice(midpoint)]

  const premiumBackground = [
    `radial-gradient(circle at 26% 10%, ${accent}45 0%, transparent 28%)`,
    `radial-gradient(circle at 78% 86%, ${accent}28 0%, transparent 32%)`,
    "radial-gradient(circle at 72% 18%, rgba(255,255,255,.13) 0%, transparent 22%)",
    "linear-gradient(130deg, rgba(255,255,255,.055) 0%, transparent 25%, rgba(255,255,255,.018) 56%, transparent 100%)",
    "linear-gradient(165deg, #1a1a1a 0%, #090909 48%, #020202 100%)",
  ].join(", ")

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="mb-3 flex items-center justify-between gap-3 text-[0.625rem] font-black uppercase tracking-[.12em] text-neutral-500">
        <span>Vista previa · faja completa</span>
        <span>{WIDTH_MM} × {HEIGHT_MM} mm · definitivo</span>
      </div>

      <div className="rounded-[22px] border border-neutral-200 bg-[#f4f1ea] p-3 shadow-[0_24px_58px_rgba(0,0,0,.18)]">
        <div
          className="relative mx-auto w-full overflow-hidden rounded-[14px] border border-black/40 text-white shadow-[0_18px_34px_rgba(0,0,0,.32)]"
          style={{ aspectRatio: `${WIDTH_MM} / ${HEIGHT_MM}`, backgroundImage: premiumBackground }}
        >
          <div className="absolute inset-[5px] rounded-[10px] border border-white/10" />
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
          <div className="absolute -left-12 top-[-36px] h-40 w-40 rounded-full border border-white/6" />
          <div className="absolute right-[-52px] bottom-[-70px] h-44 w-44 rounded-full border border-white/6" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_30%,rgba(255,255,255,.025)_62%,transparent)] mix-blend-screen" />

          <div className="relative z-10 grid h-full grid-cols-[19%_30%_36%_15%]">
            <section className="relative flex min-w-0 items-center justify-center border-r border-white/10 bg-black/[.16] px-2">
              <div className="absolute inset-y-5 right-0 w-px" style={{ backgroundColor: `${accent}88` }} />
              <div className="flex -rotate-90 flex-col items-center whitespace-nowrap text-center">
                <p className="text-[1.55rem] font-black leading-none tracking-[-.04em] text-white">HEAD</p>
                <p className="mt-1 text-[0.48rem] font-black uppercase tracking-[.16em]" style={{ color: accent }}>Padel Pro S+</p>
              </div>
            </section>

            <section className="flex min-w-0 flex-col items-center justify-center border-r border-white/10 px-3 text-center">
              <p className="mb-2 text-[0.42rem] font-black uppercase tracking-[.2em]" style={{ color: accent }}>Welcome Pack</p>
              <div className="flex min-h-[76px] w-full items-center justify-center">
                <LeagueMark leagueName={leagueName} leagueLogoUrl={leagueLogoUrl} />
              </div>
              <p className="mt-1 line-clamp-2 max-w-[118px] text-[0.58rem] font-black uppercase leading-[1.05] tracking-[.055em] text-white">
                {leagueName}
              </p>
              <div className="mt-2 grid grid-cols-[26px_4px_26px] items-center gap-1.5">
                <span className="h-px bg-white/18" />
                <span className="h-[3px] w-[3px] rotate-45 rounded-[1px]" style={{ backgroundColor: accent }} />
                <span className="h-px bg-white/18" />
              </div>
              <p className="mt-1.5 text-[0.42rem] font-black uppercase tracking-[.14em] text-white/64">{seasonName}</p>
            </section>

            <section className="flex min-w-0 flex-col justify-center border-r border-white/10 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.68rem] font-black uppercase tracking-[.06em] text-white">Jugadores</p>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[0.38rem] font-black text-white/62">{roster.length}</span>
              </div>

              <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-x-3">
                {columns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex min-w-0 flex-col justify-center gap-1.5">
                    {column.map((player) => (
                      <p
                        key={player.id}
                        className="truncate text-[0.63rem] leading-none text-white/92"
                        style={{ fontFamily: '"Great Vibes", "Segoe Script", cursive' }}
                      >
                        {player.displayName}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="flex min-w-0 flex-col items-center justify-center px-2 text-center">
              <p className="text-[0.38rem] font-black uppercase tracking-[.19em] text-white/42">Creado con</p>
              <Image src="/icon-192.png" alt="" width={38} height={38} className="mt-2 h-9 w-9 rounded-[10px] object-cover shadow-[0_8px_20px_rgba(0,0,0,.42)]" />
              <p className="mt-2 text-[0.48rem] font-black uppercase leading-tight tracking-[.08em] text-white">Smash &amp; Lob</p>
              <div className="mt-3 h-px w-8" style={{ backgroundColor: `${accent}99` }} />
            </section>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[0.625rem] font-semibold leading-4 text-neutral-600 ring-1 ring-neutral-200">
        <strong className="text-neutral-900">Faja adhesiva:</strong> 240 × 130 mm a tamaño real. Diseño pensado para cubrir la etiqueta original del bote HEAD Padel Pro S+ manteniendo la marca del producto, la identidad de liga, el listado de jugadores y la firma de Smash &amp; Lob.
      </div>
    </div>
  )
}
