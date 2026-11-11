"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { es } from "./locales/es"
import { decodeJsxEntities } from "./localeFormatting"
import type { Locale, TranslationDictionary } from "./translations"

type LocaleContent = {
  locale: Locale
  t: TranslationDictionary
  tx: (source: string) => string
}

type I18nContextValue = LocaleContent & {
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)
const availableLocales: Locale[] = ["es", "en", "eu"]
const localeStorageKey = "smash-lob-locale"
const spanish: LocaleContent = { locale: "es", t: es, tx: decodeJsxEntities }

async function loadLocale(locale: Exclude<Locale, "es">): Promise<LocaleContent> {
  const localized = locale === "en" ? (await import("./locales/enText")).enText : (await import("./locales/euText")).euText
  return { locale, ...localized }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState(spanish)
  const requestedLocale = useRef(0)

  const loadRequestedLocale = useCallback((locale: Exclude<Locale, "es">) => {
    const request = ++requestedLocale.current
    void loadLocale(locale).then(
      (localized) => {
        if (request !== requestedLocale.current) return
        setContent(localized)
        window.localStorage.setItem(localeStorageKey, locale)
      },
      () => { /* Keep the current language if the download fails. */ },
    )
  }, [])

  function setLocale(locale: Locale) {
    if (locale === "es") {
      requestedLocale.current += 1
      setContent(spanish)
      window.localStorage.setItem(localeStorageKey, locale)
    } else {
      loadRequestedLocale(locale)
    }
  }

  useEffect(() => {
    const savedLocale = window.localStorage.getItem(localeStorageKey)
    if (savedLocale === "en" || savedLocale === "eu") loadRequestedLocale(savedLocale)
    return () => { requestedLocale.current += 1 }
  }, [loadRequestedLocale])

  useEffect(() => {
    document.documentElement.lang = content.locale
  }, [content.locale])

  function toggleLocale() {
    const nextIndex = (availableLocales.indexOf(content.locale) + 1) % availableLocales.length
    setLocale(availableLocales[nextIndex])
  }

  return (
    <I18nContext.Provider value={{ ...content, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used inside I18nProvider")
  return context
}
