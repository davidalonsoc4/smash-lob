"use client"

import { createContext, useContext } from "react"
import { leagues } from "@/data/fakeData"
import type { LeagueLocation } from "@/lib/leagueLocations"

export type LeagueSettings = {
  leagueId: string
  locations: LeagueLocation[]
}

type LeagueSettingsContextValue = {
  leagueSettings: LeagueSettings[]
  getLeagueSettings: (leagueId: string) => LeagueSettings
  updateLeagueLocations: (leagueId: string, locations: LeagueLocation[]) => void
}

type LeagueSettingsProviderProps = {
  children: React.ReactNode
}

const LeagueSettingsContext =
  createContext<LeagueSettingsContextValue | null>(null)

function createFallbackSettings(leagueId: string): LeagueSettings {
  const league = leagues.find((item) => item.id === leagueId)

  return {
    leagueId,
    locations: league ? [...league.locations] : [],
  }
}

export function LeagueSettingsProvider({
  children,
}: LeagueSettingsProviderProps) {
  return <>{children}</>
}

export function useLeagueSettings() {
  const context = useContext(LeagueSettingsContext)

  if (context) {
    return context
  }

  return {
    leagueSettings: [],
    getLeagueSettings: createFallbackSettings,
    updateLeagueLocations: () => undefined,
  }
}
