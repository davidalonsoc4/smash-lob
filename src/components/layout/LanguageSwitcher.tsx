"use client"

import { useEffect, useRef, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { Locale } from "@/i18n/translations"

const languages: {
  locale: Locale
  label: string
  shortLabel: string
  flag: string
}[] = [
  {
    locale: "es",
    label: "Español",
    shortLabel: "ES",
    flag: "🇪🇸",
  },
  {
    locale: "en",
    label: "English",
    shortLabel: "EN",
    flag: "🇬🇧",
  },
  {
    locale: "eu",
    label: "Euskera",
    shortLabel: "EU",
    flag: "🇪🇺",
  },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentLanguage =
    languages.find((language) => language.locale === locale) ?? languages[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  function handleSelect(nextLocale: Locale) {
    setLocale(nextLocale)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.label}</span>
        <span className="text-xs text-neutral-500">▼</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
          <div role="listbox" className="p-1">
            {languages.map((language) => {
              const isSelected = language.locale === locale

              return (
                <button
                  key={language.locale}
                  type="button"
                  onClick={() => handleSelect(language.locale)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm ${
                    isSelected
                      ? "bg-neutral-100 font-black text-neutral-950"
                      : "font-semibold text-neutral-700 hover:bg-neutral-50"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.label}</span>
                  </span>

                  <span className="text-xs text-neutral-500">
                    {language.shortLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}