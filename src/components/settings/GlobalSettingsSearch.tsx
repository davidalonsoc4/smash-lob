"use client"

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useRouter } from "next/navigation"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import type { Locale } from "@/i18n/translations"
import {
  getSettingsSearchCopy,
  searchSettingsEntries,
  type SettingsSearchEntry,
} from "@/lib/settingsSearch"

const recentStorageKey = "smash-lob-recent-settings-search"
const maximumRecentEntries = 8
const maximumIdleEntriesPerGroup = 5

function readRecentIds() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(recentStorageKey) ?? "[]",
    )

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : []
  } catch {
    return []
  }
}

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

export function GlobalSettingsSearch({
  locale,
  entries,
}: {
  locale: Locale
  entries: SettingsSearchEntry[]
}) {
  const router = useRouter()
  const copy = getSettingsSearchCopy(locale)
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecentIds(),
  )
  const [activeIndex, setActiveIndex] = useState(-1)

  const matchingEntries = useMemo(
    () => searchSettingsEntries(entries, query, locale),
    [entries, locale, query],
  )

  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  )

  const recentEntries = useMemo(
    () =>
      recentIds
        .map((id) => entriesById.get(id))
        .filter((entry): entry is SettingsSearchEntry => Boolean(entry))
        .slice(0, maximumIdleEntriesPerGroup),
    [entriesById, recentIds],
  )

  const recentEntryIds = useMemo(
    () => new Set(recentEntries.map((entry) => entry.id)),
    [recentEntries],
  )

  const suggestedEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.suggested && !recentEntryIds.has(entry.id))
        .slice(0, maximumIdleEntriesPerGroup),
    [entries, recentEntryIds],
  )

  const hasQuery = Boolean(query.trim())
  const idleEntries = useMemo(
    () => [...recentEntries, ...suggestedEntries],
    [recentEntries, suggestedEntries],
  )
  const navigableEntries = hasQuery ? matchingEntries : idleEntries

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  useEffect(() => {
    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      const target = event.target
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsOpen(true)
        return
      }

      if (!isTyping && event.key === "/") {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener("keydown", handleGlobalShortcut)
    return () => window.removeEventListener("keydown", handleGlobalShortcut)
  }, [])

  function closeSearch() {
    setIsOpen(false)
    setQuery("")
    setActiveIndex(-1)
  }

  function rememberEntry(entry: SettingsSearchEntry) {
    const nextRecentIds = [
      entry.id,
      ...recentIds.filter((id) => id !== entry.id),
    ].slice(0, maximumRecentEntries)

    setRecentIds(nextRecentIds)

    try {
      window.localStorage.setItem(recentStorageKey, JSON.stringify(nextRecentIds))
    } catch {
      // Searching and navigation still work if storage is unavailable.
    }
  }

  function navigateToEntry(entry: SettingsSearchEntry) {
    const destination = new URL(entry.href, window.location.origin)
    const currentPath = `${window.location.pathname}${window.location.search}`
    const destinationPath = `${destination.pathname}${destination.search}`

    if (destination.hash && currentPath === destinationPath) {
      const destinationWithHash = `${destinationPath}${destination.hash}`
      const scrollToTarget = () => {
        const targetId = decodeURIComponent(destination.hash.slice(1))
        const target = document.getElementById(targetId)
        target?.scrollIntoView({ behavior: "smooth", block: "center" })
        target?.classList.add("settings-search-highlight")
        window.setTimeout(
          () => target?.classList.remove("settings-search-highlight"),
          1600,
        )
      }

      window.history.pushState(window.history.state, "", destinationWithHash)
      window.requestAnimationFrame(scrollToTarget)
      return
    }

    router.push(entry.href)
  }

  function openEntry(entry: SettingsSearchEntry) {
    rememberEntry(entry)
    closeSearch()
    navigateToEntry(entry)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      closeSearch()
      return
    }

    if (navigableEntries.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((currentIndex) =>
        currentIndex < navigableEntries.length - 1 ? currentIndex + 1 : 0,
      )
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((currentIndex) =>
        currentIndex > 0 ? currentIndex - 1 : navigableEntries.length - 1,
      )
      return
    }

    if (event.key === "Enter") {
      const selectedEntry = navigableEntries[activeIndex] ?? navigableEntries[0]
      if (selectedEntry) {
        event.preventDefault()
        openEntry(selectedEntry)
      }
    }
  }

  function renderEntry(entry: SettingsSearchEntry) {
    const entryIndex = navigableEntries.findIndex(
      (candidate) => candidate.id === entry.id,
    )
    const isActive = entryIndex === activeIndex

    return (
      <button
        id={`${listboxId}-${entry.id}`}
        key={entry.id}
        type="button"
        role="option"
        aria-selected={isActive}
        onMouseEnter={() => setActiveIndex(entryIndex)}
        onClick={() => openEntry(entry)}
        className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition ${
          isActive ? "bg-neutral-100" : "bg-white active:bg-neutral-100"
        }`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-black text-neutral-950">
              {entry.title}
            </p>
            <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] text-neutral-500">
              {entry.section}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold leading-4 text-neutral-500">
            {entry.description}
          </p>
        </div>
        <ClickableChevron className="shrink-0" />
      </button>
    )
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Cerrar búsqueda"
          onClick={closeSearch}
          className="fixed bottom-0 left-0 right-0 z-30 bg-neutral-950/15 backdrop-blur-[1px]"
          style={{
            top: "calc(-64px - env(safe-area-inset-top, 0px))",
          }}
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
            aria-label={copy.title}
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
                  <p className="text-sm font-black text-neutral-950">{copy.title}</p>
                  <p className="text-[10px] font-semibold text-neutral-400">
                    {entries.length} opciones disponibles
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Cerrar"
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
                  placeholder={copy.placeholder}
                  aria-label={copy.title}
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-expanded="true"
                  aria-activedescendant={
                    activeIndex >= 0 && navigableEntries[activeIndex]
                      ? `${listboxId}-${navigableEntries[activeIndex].id}`
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
                    aria-label={copy.clear}
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
              {hasQuery ? (
                matchingEntries.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-neutral-200">
                    <div className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
                        {copy.results} · {matchingEntries.length}
                      </p>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {matchingEntries.map(renderEntry)}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-neutral-50 px-3 py-4 text-center">
                    <p className="text-xs font-black text-neutral-800">
                      {copy.noResultsTitle}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-neutral-500">
                      {copy.noResultsDescription}
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {recentEntries.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <div className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
                          {copy.recent}
                        </p>
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {recentEntries.map(renderEntry)}
                      </div>
                    </div>
                  ) : null}

                  {suggestedEntries.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-neutral-200">
                      <div className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-500">
                          {copy.suggested}
                        </p>
                      </div>
                      <div className="divide-y divide-neutral-100">
                        {suggestedEntries.map(renderEntry)}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={copy.title}
          title={copy.title}
          onClick={() => setIsOpen((current) => !current)}
          className={`grid h-10 w-10 place-items-center rounded-full border shadow-lg backdrop-blur transition active:scale-95 ${
            isOpen
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-200 bg-white/95 text-neutral-600 active:bg-neutral-100"
          }`}
        >
          <SearchIcon />
        </button>
      </div>
    </>
  )
}
