"use client"

import { useMemo, useState } from "react"
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
  const [query, setQuery] = useState("")

  const matchingEntries = useMemo(
    () =>
      entries
        .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
        .filter(({ score }) => score >= 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.entry.title.localeCompare(right.entry.title),
        )
        .slice(0, 10)
        .map(({ entry }) => entry),
    [entries, query],
  )

  function openEntry(entry: SettingsSearchEntry) {
    let recentIds: string[] = []

    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(recentStorageKey) ?? "[]",
      )
      recentIds = Array.isArray(parsed)
        ? parsed.filter(
            (value): value is string => typeof value === "string",
          )
        : []
    } catch {
      recentIds = []
    }

    const nextRecentIds = [
      entry.id,
      ...recentIds.filter((id) => id !== entry.id),
    ].slice(0, 6)

    window.localStorage.setItem(
      recentStorageKey,
      JSON.stringify(nextRecentIds),
    )
    router.push(entry.href)
  }

  const hasQuery = Boolean(query.trim())

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-2 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5">
        <span className="shrink-0 text-neutral-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.title}
          className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm font-semibold outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={copy.clear}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-black text-neutral-600"
          >
            ×
          </button>
        ) : null}
      </div>

      {hasQuery ? (
        matchingEntries.length > 0 ? (
          <div className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200">
            {matchingEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => openEntry(entry)}
                className="flex w-full items-center gap-2 bg-white px-2.5 py-2 text-left transition active:bg-neutral-100"
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
                <span
                  className="shrink-0 text-base font-black text-neutral-400"
                  aria-label={copy.open}
                >
                  ›
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-xl bg-neutral-50 px-3 py-3 text-center">
            <p className="text-xs font-black text-neutral-800">
              {copy.noResultsTitle}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
              {copy.noResultsDescription}
            </p>
          </div>
        )
      ) : null}
    </section>
  )
}
