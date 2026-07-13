"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Locale } from "@/i18n/translations"
import {
  getSettingsSearchCopy,
  type SettingsSearchEntry,
} from "@/lib/settingsSearch"

const recentStorageKey = "smash-lob-recent-settings-search"

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function isOneEditAway(left: string, right: string) {
  if (Math.abs(left.length - right.length) > 1) return false

  let leftIndex = 0
  let rightIndex = 0
  let edits = 0

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1
      rightIndex += 1
      continue
    }

    edits += 1
    if (edits > 1) return false

    if (left.length > right.length) leftIndex += 1
    else if (right.length > left.length) rightIndex += 1
    else {
      leftIndex += 1
      rightIndex += 1
    }
  }

  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1
}

function scoreEntry(entry: SettingsSearchEntry, rawQuery: string) {
  const query = normalizeText(rawQuery)
  if (!query) return 0

  const title = normalizeText(entry.title)
  const description = normalizeText(entry.description)
  const section = normalizeText(entry.section)
  const keywords = normalizeText(entry.keywords.join(" "))
  const completeText = `${title} ${description} ${section} ${keywords}`
  const queryTokens = query.split(" ").filter(Boolean)
  const candidateTokens = completeText.split(" ").filter(Boolean)

  const allTokensMatch = queryTokens.every((queryToken) =>
    candidateTokens.some(
      (candidateToken) =>
        candidateToken.includes(queryToken) ||
        queryToken.includes(candidateToken) ||
        (queryToken.length >= 4 && isOneEditAway(queryToken, candidateToken)),
    ),
  )

  if (!allTokensMatch) return -1
  if (title === query) return 120
  if (title.startsWith(query)) return 100
  if (title.includes(query)) return 90
  if (keywords.includes(query)) return 75
  if (description.includes(query)) return 60
  return 40
}

function readRecentIds() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentStorageKey) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
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
  const [query, setQuery] = useState("")
  const [recentIds, setRecentIds] = useState<string[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setRecentIds(readRecentIds()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const matchingEntries = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
        .filter(({ score }) => score >= 0)
        .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
        .slice(0, 10)
        .map(({ entry }) => entry),
    [entries, query],
  )

  const emptyStateEntries = useMemo(() => {
    const byId = new Map(entries.map((entry) => [entry.id, entry]))
    const recent = recentIds.map((id) => byId.get(id)).filter((entry): entry is SettingsSearchEntry => Boolean(entry))
    if (recent.length > 0) return recent.slice(0, 5)
    return entries.filter((entry) => entry.suggested).slice(0, 6)
  }, [entries, recentIds])

  function openEntry(entry: SettingsSearchEntry) {
    const nextRecentIds = [entry.id, ...recentIds.filter((id) => id !== entry.id)].slice(0, 6)
    setRecentIds(nextRecentIds)
    window.localStorage.setItem(recentStorageKey, JSON.stringify(nextRecentIds))
    router.push(entry.href)
  }

  const displayedEntries = query.trim() ? matchingEntries : emptyStateEntries
  const listTitle = query.trim()
    ? copy.results
    : recentIds.some((id) => entries.some((entry) => entry.id === id))
      ? copy.recent
      : copy.suggested

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.045)]">
      <div>
        <p className="font-black text-neutral-950">{copy.title}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">{copy.description}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-3">
        <span className="shrink-0 text-neutral-400"><SearchIcon /></span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={copy.clear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-black text-neutral-600"
          >
            ×
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-neutral-400">{listTitle}</p>

      {displayedEntries.length > 0 ? (
        <div className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200">
          {displayedEntries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => openEntry(entry)}
              className="flex w-full items-center gap-3 bg-white px-3 py-2.5 text-left transition active:bg-neutral-100"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black text-neutral-950">{entry.title}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
                    {entry.section}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold leading-4 text-neutral-500">{entry.description}</p>
              </div>
              <span className="shrink-0 text-lg font-black text-neutral-400" aria-label={copy.open}>›</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-2xl bg-neutral-50 px-3 py-4 text-center">
          <p className="text-sm font-black text-neutral-800">{copy.noResultsTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">{copy.noResultsDescription}</p>
        </div>
      )}
    </section>
  )
}
