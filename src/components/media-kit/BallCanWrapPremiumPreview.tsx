"use client"

import { useI18n } from "@/i18n/I18nProvider"

import { useState } from "react"
import Image from "next/image"
import {
  WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS,
  getWelcomePackPlayerNameFontFamily,
  type WelcomePackPlayerNameFont,
} from "@/lib/mediaKitWelcomePack"

type Player = { id: string; displayName: string }
type Props = {
  leagueName: string
  leagueLogoUrl?: string | null
  seasonName: string
  players: Player[]
  accent: string
}

const WIDTH_MM = 240
const FINAL_WIDTH_MM = 230
const HEIGHT_MM = 130
const SIDE_GLUE_MM = 5

function parts(value: string) {
  const [firstName = "", ...surname] = value.trim().split(/\s+/)
  return { firstName, surname: surname.join(" ") }
}

function sortedPlayers(players: Player[]) {
  return [...players].sort((a, b) => {
    const left = parts(a.displayName)
    const right = parts(b.displayName)
    return left.surname.localeCompare(right.surname, "es", { sensitivity: "base" }) || left.firstName.localeCompare(right.firstName, "es", { sensitivity: "base" })
  })
}

function LeagueMark({ leagueName, leagueLogoUrl }: Pick<Props, "leagueName" | "leagueLogoUrl">) {
  if (leagueLogoUrl) {
    return <Image unoptimized src={leagueLogoUrl} alt={leagueName} width={150} height={82} className="h-auto max-h-[72px] w-auto max-w-[138px] object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.42)]" />
  }
  const initials = leagueName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SL"
  return <span className="text-3xl font-black tracking-[.2em] text-white">{initials}</span>
}

function LeagueNameText({ leagueName }: { leagueName: string }) {
  const normalized = leagueName.trim()
  const smashAndLobMatch = normalized.match(/^(SMASH\s*&\s*LOB)\s+(.+)$/i)

  if (!smashAndLobMatch) return <>{normalized}</>

  return (
    <>
      {smashAndLobMatch[1]}
      <br />
      {smashAndLobMatch[2]}
    </>
  )
}

export function BallCanWrapPremiumPreview({ leagueName, leagueLogoUrl, seasonName, players, accent }: Props) {
  const { tx } = useI18n()
  const [playerListFont, setPlayerListFont] = useState<WelcomePackPlayerNameFont>("great-vibes")
  const roster = sortedPlayers(players)
  const oneColumn = roster.length <= 8
  const midpoint = Math.ceil(roster.length / 2)
  const columns = oneColumn ? [roster] : [roster.slice(0, midpoint), roster.slice(midpoint)]
  const sideGluePercent = (SIDE_GLUE_MM / WIDTH_MM) * 100
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
        <span>{tx("Vista previa · faja completa")}</span>
        <span>{FINAL_WIDTH_MM} × {HEIGHT_MM} {tx("mm · definitivo")}</span>
      </div>

      <div className="rounded-[22px] border border-neutral-200 bg-[#f4f1ea] p-3 shadow-[0_24px_58px_rgba(0,0,0,.18)]">
        <div
          ref={(node) => {
            if (!node) return
            const outer = node.closest('[data-sl-ball-wrap-design="true"]')
            if (outer && outer !== node) outer.removeAttribute("data-sl-ball-wrap-design")
            node.dataset.slBallWrapDesign = "true"
          }}
          className="relative mx-auto w-full overflow-hidden rounded-[14px] border border-black/40 text-white shadow-[0_18px_34px_rgba(0,0,0,.32)]"
          style={{ aspectRatio: `${WIDTH_MM} / ${HEIGHT_MM}`, backgroundImage: premiumBackground }}
        >
          <div className="absolute inset-[5px] rounded-[10px] border border-white/10" />
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: accent }} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.07),transparent_30%,rgba(255,255,255,.025)_62%,transparent)] mix-blend-screen" />

          <div className="absolute inset-y-0 left-0 z-[1] border-r border-dashed border-white/18 bg-[#0b0b0b]" style={{ width: `${sideGluePercent}%` }} />
          <div className="absolute inset-y-0 right-0 z-[1] border-l border-dashed border-white/18 bg-[#0b0b0b]" style={{ width: `${sideGluePercent}%` }} />

          <div className="absolute inset-y-0 z-[2]" style={{ left: `${sideGluePercent}%`, right: `${sideGluePercent}%` }}>
            <div className="absolute -left-10 top-[-22px] h-32 w-32 rounded-full border border-white/6" />
            <div className="absolute right-[-46px] bottom-[-56px] h-40 w-40 rounded-full border border-white/6" />

            <div className="relative z-10 grid h-full grid-cols-[22%_30%_48%] px-3">
              <section className="relative flex min-w-0 items-center justify-center border-r border-white/10 px-2">
                <div className="absolute inset-y-5 right-0 w-px" style={{ backgroundColor: `${accent}88` }} />
                <div data-sl-ball-brand="true" className="flex -rotate-90 flex-col items-center whitespace-nowrap text-center">
                  <p data-sl-ball-brand-head="true" className="text-[3.4rem] font-black leading-none tracking-[-.05em] text-white" style={{ transform: "scale(1.45)" }}>HEAD</p>
                  <p data-sl-ball-brand-model="true" className="mt-1 text-[0.66rem] font-black uppercase tracking-[.12em]" style={{ color: accent, WebkitTextFillColor: accent }}>
                    <span data-sl-ball-model-name="true" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>Padel Pro</span>{" "}
                    <span data-sl-ball-model-plus="true">S+</span>
                  </p>
                </div>
              </section>

              <section className="flex min-w-0 flex-col items-center justify-center border-r border-white/10 px-5 text-center">
                <p className="mb-2 text-[0.42rem] font-black uppercase tracking-[.2em]" style={{ color: accent }}>Welcome Pack</p>
                <div className="flex min-h-[76px] w-full items-center justify-center"><LeagueMark leagueName={leagueName} leagueLogoUrl={leagueLogoUrl} /></div>
                <p className="mt-1 line-clamp-2 max-w-[118px] whitespace-normal text-[0.58rem] font-black uppercase leading-[1.05] tracking-[.055em] text-white"><LeagueNameText leagueName={leagueName} /></p>
                <div className="mt-2 grid grid-cols-[26px_4px_26px] items-center gap-1.5">
                  <span className="h-px bg-white/18" />
                  <span className="h-[3px] w-[3px] rotate-45 rounded-[1px]" style={{ backgroundColor: accent }} />
                  <span className="h-px bg-white/18" />
                </div>
                <p className="mt-1.5 text-[0.42rem] font-black uppercase tracking-[.14em] text-white/64">{seasonName}</p>
              </section>

              <section className="flex min-w-0 flex-col justify-center px-5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.42rem] font-black uppercase tracking-[.2em]" style={{ color: accent }}>{tx("Jugadores")}</p>
                  <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[0.38rem] font-black text-white/62">{roster.length}</span>
                </div>
                <div className={`mt-3 grid min-h-0 flex-1 ${oneColumn ? "grid-cols-1" : "grid-cols-2 gap-x-4"}`}>
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} className="flex min-w-0 flex-col justify-center gap-1.5">
                      {column.map((player) => (
                        <p key={player.id} className="truncate text-[0.63rem] leading-none text-white/92" style={{ fontFamily: getWelcomePackPlayerNameFontFamily(playerListFont) }}>{player.displayName}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <label className="text-xs font-black text-neutral-700">
          {tx("Tipografía del listado de jugadores")} <select
            value={playerListFont}
            onChange={(event) => setPlayerListFont(event.target.value as WelcomePackPlayerNameFont)}
            className="mt-1 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-950"
          >
            {WELCOME_PACK_PLAYER_NAME_FONT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {tx(option.label)}{option.id === "great-vibes" ? ` · ${tx("Actual")}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-[0.625rem] font-semibold leading-4 text-neutral-600 ring-1 ring-neutral-200">
        <strong className="text-neutral-900">{tx("Faja adhesiva:")}</strong> {tx("230 × 130 mm a tamaño real. El diseño mantiene exactamente sus tamaños originales y el PDF recorta 5 mm por cada lateral.")} </div>
    </div>
  )
}
