import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import { emptySeasonRegistrationFee } from "@/lib/seasonRegistration"

export function createFallbackSettings(seasonId: string): SeasonRoundSettings {
  return {
    leagueId: "",
    seasonId,
    roundWindowMode: "none",
    seasonStartsAt: null,
    scheduledStartAt: null,
    preseasonSecretDaysBefore: null,
    roundWindowDays: null,
    requiresThreeSets: true,
    mvpSystem: "automatic",
    resultConfirmationMode: "optional",
    manualActiveRound: null,
    manualCompletedRounds: [],
    registrationFee: emptySeasonRegistrationFee,
    rosterMode: "fixed",
    playerCapacity: null,
    registrationOpen: false,
    rosterCompletedAt: null,
    scheduleMode: "single",
    calendarMode: "balanced",
    allowPlayerIncidents: true,
    allowPlayerSubstitutions: true,
    availabilityRecommendationsEnabled: false,
    organizationBallsAssigned: false,
    ballsAssignmentPriority: [],
    ballsAssignmentMode: "priority",
    ballsAssignmentCustodianIds: [],
  };
}
