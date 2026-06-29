"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  defaultLocale,
  getTranslations,
  Locale,
  TranslationDictionary,
} from "./translations"

type I18nContextValue = {
  locale: Locale
  t: TranslationDictionary
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

type I18nProviderProps = {
  children: React.ReactNode
}

const availableLocales: Locale[] = ["es", "en", "eu"]

function isValidLocale(value: string | null): value is Locale {
  return value === "es" || value === "en" || value === "eu"
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("smash-lob-locale")

    if (isValidLocale(savedLocale) && savedLocale !== defaultLocale) {
      window.setTimeout(() => {
        setLocaleState(savedLocale)
      }, 0)
    }
  }, [])

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale)
    window.localStorage.setItem("smash-lob-locale", nextLocale)
  }

  function toggleLocale() {
    const currentIndex = availableLocales.indexOf(locale)
    const nextIndex = (currentIndex + 1) % availableLocales.length

    setLocale(availableLocales[nextIndex])
  }

  const value = {
    locale,
    t: getTranslations(locale),
    setLocale,
    toggleLocale,
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider")
  }

  return context
}