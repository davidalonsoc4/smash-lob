"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type ThemePreference = "light" | "dark" | "system"

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const STORAGE_KEY = "smash-lob-theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system"
}

function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const resolved = dark ? "dark" : "light"
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.dataset.theme = resolved
  root.style.colorScheme = resolved

  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#0f0f10" : "#0a0a0a")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)

  useEffect(() => {
    applyTheme(preference)

    if (preference !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => applyTheme("system")
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [preference])

  function setPreference(nextPreference: ThemePreference) {
    window.localStorage.setItem(STORAGE_KEY, nextPreference)
    setPreferenceState(nextPreference)
  }

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return value
}
