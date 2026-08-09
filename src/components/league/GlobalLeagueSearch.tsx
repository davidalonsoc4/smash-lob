"use client"

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
}

export function GlobalLeagueSearch() {
  const { t } = useI18n()
  const { activeLeagueId, changeActiveLeague } = useActiveLeague()
  const {
    getMembershipForLeague,
    isLeagueSpectator,
    userLeagues,
  } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const searchableLeagues = useMemo(
    () =>
      userLeagues.map((league) => {
        const membership = getMembershipForLeague(league.id)
        const role = isLeagueSpectator(league.id)
          ? "spectator"
          : membership?.role ?? "player"
        const roleLabel =
          role === "creator"
            ? t.settings.leagueSearchCreator
            : role === "admin"
              ? t.settings.leagueSearchAdmin
              : role === "spectator"
                ? t.settings.leagueSearchSpectator
                : t.settings.leagueSearchPlayer
        const season =
          seasons.find((candidate) => candidate.id === league.activeSeasonId) ??
          seasons.find(
            (candidate) =>
              candidate.leagueId === league.id && candidate.status === "active",
          ) ??
          seasons.find((candidate) => candidate.leagueId === league.id)
        const seasonLabel = season?.name ?? t.settings.leagueSearchNoSeason
        const searchText = normalizeSearchValue(
          [league.name, league.description, seasonLabel, roleLabel].join(" "),
        )

        return { league, roleLabel, seasonLabel, searchText }
      }),
    [
      getMembershipForLeague,
      isLeagueSpectator,
      seasons,
      t.settings.leagueSearchAdmin,
      t.settings.leagueSearchCreator,
      t.settings.leagueSearchNoSeason,
      t.settings.leagueSearchPlayer,
      t.settings.leagueSearchSpectator,
      userLeagues,
    ],
  )

  const filteredLeagues = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query)
    if (!normalizedQuery) return searchableLeagues
    return searchableLeagues.filter((item) =>
      item.searchText.includes(normalizedQuery),
    )
  }, [query, searchableLeagues])

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        setIsOpen(false)
        setQuery("")
        setActiveIndex(-1)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  function closeSearch() {
    setIsOpen(false)
    setQuery("")
    setActiveIndex(-1)
  }

  function openLeague(leagueId: string) {
    closeSearch()
    changeActiveLeague(leagueId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      closeSearch()
      return
    }

    if (filteredLeagues.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) =>
        current < filteredLeagues.length - 1 ? current + 1 : 0,
      )
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) =>
        current > 0 ? current - 1 : filteredLeagues.length - 1,
      )
      return
    }

    if (event.key === "Enter") {
      const selected = filteredLeagues[activeIndex] ?? filteredLeagues[0]
      if (selected) {
        event.preventDefault()
        openLeague(selected.league.id)
      }
    }
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={t.settings.leagueSearchClose}
          onClick={closeSearch}
          className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/15 backdrop-blur-[1px]"
          style={{ top: "calc(-64px - env(safe-area-inset-top, 0px))" }}
        />
      ) : null}

      <div
        className="fixed z-40"
        style={{
          right: "max(14px, calc((100vw - 448px) / 2 + 14px))",
          bottom: "calc(84px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {isOpen ? (
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t.settings.leagueSearchTitle}
            className="fixed z-40 flex w-[min(360px,calc(100vw-28px))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
            style={{
              top: "max(64px, calc(env(safe-area-inset-top, 0px) + 58px))",
              right: "max(14px, calc((100vw - 448px) / 2 + 14px))",
              maxHeight:
                "min(560px, calc(100svh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 150px))",
            }}
          >
            <div className="border-b border-neutral-100 px-3 pb-2.5 pt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-neutral-950">
                    {t.settings.leagueSearchTitle}
                  </p>
                  <p className="type-caption font-semibold text-neutral-400">
                    {userLeagues.length} {t.settings.leagueSearchAvailable}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label={t.settings.leagueSearchClose}
                  className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-sm font-black text-neutral-500"
                >
                  ×
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 focus-within:border-neutral-400 focus-within:bg-white">
                <span className="shrink-0 text-neutral-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  role="combobox"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveIndex(-1)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t.settings.leagueSearchPlaceholder}
                  aria-label={t.settings.leagueSearchTitle}
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-expanded="true"
                  aria-activedescendant={
                    activeIndex >= 0 && filteredLeagues[activeIndex]
                      ? `${listboxId}-${filteredLeagues[activeIndex].league.id}`
                      : undefined
                  }
                  className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("")
                      setActiveIndex(-1)
                      inputRef.current?.focus()
                    }}
                    aria-label={t.settings.leagueSearchClear}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-black text-neutral-600"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            <div
              id={listboxId}
              role="listbox"
              className="min-h-0 overflow-y-auto overscroll-contain p-2"
            >
              {filteredLeagues.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5">
                    <p className="type-caption font-black uppercase tracking-[0.12em] text-neutral-500">
                      {query.trim()
                        ? `${t.settings.leagueSearchResults} · ${filteredLeagues.length}`
                        : t.settings.leagueSearchAll}
                    </p>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {filteredLeagues.map((item, index) => {
                      const isActiveResult = index === activeIndex
                      const isCurrent = item.league.id === activeLeagueId

                      return (
                        <button
                          id={`${listboxId}-${item.league.id}`}
                          key={item.league.id}
                          type="button"
                          role="option"
                          aria-selected={isActiveResult}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => openLeague(item.league.id)}
                          className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                            isActiveResult
                              ? "bg-neutral-100"
                              : "bg-white active:bg-neutral-100"
                          }`}
                        >
                          <LeagueLogo league={item.league} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <p className="truncate text-sm font-black text-neutral-950">
                                {item.league.name}
                              </p>
                              {isCurrent ? (
                                <span className="shrink-0 rounded-full bg-neutral-950 px-1.5 py-0.5 type-caption font-black uppercase tracking-[0.1em] text-white">
                                  {t.settings.leagueSearchCurrent}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 truncate type-caption font-semibold text-neutral-500">
                              {item.seasonLabel} · {item.roleLabel}
                            </p>
                          </div>
                          <ClickableChevron className="shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-neutral-50 px-3 py-4 text-center">
                  <p className="text-xs font-black text-neutral-800">
                    {t.settings.leagueSearchNoResultsTitle}
                  </p>
                  <p className="mt-1 type-caption font-semibold text-neutral-500">
                    {t.settings.leagueSearchNoResultsDescription}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={t.settings.leagueSearchTitle}
          title={t.settings.leagueSearchTitle}
          onClick={() => setIsOpen((current) => !current)}
          className={`grid h-10 w-10 place-items-center rounded-full border shadow-lg backdrop-blur transition active:scale-95 ${
            isOpen
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "app-floating-control border-neutral-200 bg-white/95 text-neutral-600 active:bg-neutral-100"
          }`}
        >
          <SearchIcon />
        </button>
      </div>
    </>
  )
}
