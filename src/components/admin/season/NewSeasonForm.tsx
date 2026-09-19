"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LeagueLocationsEditor } from "@/components/league/LeagueLocationsEditor"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { SeasonPlayerCountSelector } from "@/components/season/SeasonPlayerCountSelector"
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown"
import { BallCustodianChoice } from "@/components/admin/season/OrganizationBallsSettingsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { RoundWindowMode, useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { startSupabaseSeason } from "@/lib/supabaseSeasons"
import { generateBalancedCalendar, generateManualCalendar, getNewPlayerIndexFromToken, getNewPlayerToken, getSeasonMaxBalancedLegCount, getSeasonMaxRoundCount, getSeasonScheduleRoundCount, isValidSeasonScheduleTarget, resolveManualCalendarDraft, type ManualCalendarMatchDraft, type SeasonScheduleMode } from "@/lib/calendar"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import type { MvpSystem } from "@/lib/mvp"
import { type LeagueLocation, createScheduledLeagueLocationValue, getLeagueLocationTownNameLabel, sortLeagueLocationsByTownNameLabel } from "@/lib/leagueLocations"
import type { ResultConfirmationMode } from "@/lib/resultConfirmations"
import type { RosterMode } from "@/data/fakeData"
import { recordActivityEvent } from "@/lib/activity"
import { showActionFeedback } from "@/lib/actionFeedback"
import { getPublicInviteUrl } from "@/lib/inviteUrls"
import { calculateBallCustodianAssignment } from "@/lib/ballCustodianAssignment"
import { buildBallsAssignmentPriorityEntries, moveBallsAssignmentPriority } from "@/lib/organizationBallsAssignment"
import { datetimeLocalToIso, formatNextScheduledStartForInput } from "@/lib/seasonScheduling"
import { getDefaultSeasonPlayerCount, getSeasonBaseRoundCount, getSeasonMatchesPerRound, isSeasonPlayerCountInRange } from "@/lib/seasonPlayerCount"

type SeasonPlayerSummary = { id: string; displayName: string; avatarInitials?: string | null; avatarUrl?: string | null }
type SeasonAppDirectoryPerson = { userId: string; displayName: string; avatarUrl: string | null }
type ManualCalendarTeamKey = "teamA" | "teamB"
type ManualCalendarRoundDraft = { round: number; matches: { teamA: string[]; teamB: string[] }[] }
type CalendarMode = "balanced" | "manual"
type SeasonDurationMode = "complete" | "custom"
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const showSavedFeedback=(message:string)=>showActionFeedback({tone:"success",message})
function getMatchesPerRound(playerCount: number) { return getSeasonMatchesPerRound(playerCount); }

function getManualCalendarDraftRoundCount({
  playerCount,
  scheduleMode,
  targetRoundCount,
}: {
  playerCount: number;
  scheduleMode: SeasonScheduleMode;
  targetRoundCount?: number;
}) {
  return scheduleMode === "double"
    ? getSeasonBaseRoundCount(playerCount)
    : getSeasonScheduleRoundCount({ playerCount, mode: scheduleMode, targetRoundCount });
}

function createEmptyManualCalendar({
  playerCount,
  scheduleMode,
  targetRoundCount,
}: {
  playerCount: number;
  scheduleMode: SeasonScheduleMode;
  targetRoundCount?: number;
}): ManualCalendarRoundDraft[] {
  return Array.from(
    { length: getManualCalendarDraftRoundCount({ playerCount, scheduleMode, targetRoundCount }) },
    (_, roundIndex) => ({
      round: roundIndex + 1,
      matches: Array.from({ length: getMatchesPerRound(playerCount) }, () => ({
        teamA: ["", ""],
        teamB: ["", ""],
      })),
    }),
  );
}

function getDraftPlayerValues({
  selectedPlayerIds,
  playerCount,
}: {
  selectedPlayerIds: string[];
  playerCount: number;
}) {
  const selectedValues = selectedPlayerIds.slice(0, playerCount);
  const missingSlots = Math.max(playerCount - selectedValues.length, 0);

  return [
    ...selectedValues,
    ...Array.from({ length: missingSlots }, (_, index) =>
      getNewPlayerToken(index),
    ),
  ];
}

function createBalancedManualCalendar(
  playerValues: string[],
  scheduleMode: SeasonScheduleMode = "single",
  targetRoundCount?: number,
): ManualCalendarRoundDraft[] {
  const generationMode = scheduleMode === "double" ? "single" : scheduleMode;
  const generationTarget = scheduleMode === "double"
    ? getSeasonBaseRoundCount(playerValues.length)
    : targetRoundCount;
  const balancedMatches = generateBalancedCalendar({
    leagueId: "manual-draft",
    seasonId: "manual-draft-season",
    playerIds: playerValues,
    scheduleMode: generationMode,
    targetRoundCount: generationTarget,
  });

  if (balancedMatches.length === 0) {
    return createEmptyManualCalendar({
      playerCount: playerValues.length,
      scheduleMode,
      targetRoundCount,
    });
  }

  return Array.from(
    {
      length: getManualCalendarDraftRoundCount({
        playerCount: playerValues.length,
        scheduleMode,
        targetRoundCount,
      }),
    },
    (_, roundIndex) => {
      const round = roundIndex + 1;
      const roundMatches = balancedMatches.filter(
        (match) => match.round === round,
      );

      return {
        round,
        matches: roundMatches.map((match) => ({
          teamA: match.teamA,
          teamB: match.teamB,
        })),
      };
    },
  );
}

function normalizeManualCalendarRoundOrder(
  manualCalendar: ManualCalendarRoundDraft[],
): ManualCalendarRoundDraft[] {
  return manualCalendar.map((round, index) => ({
    ...round,
    round: index + 1,
  }));
}

function moveManualCalendarRound({
  manualCalendar,
  roundIndex,
  direction,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  roundIndex: number;
  direction: -1 | 1;
}) {
  const nextIndex = roundIndex + direction;

  if (nextIndex < 0 || nextIndex >= manualCalendar.length) {
    return manualCalendar;
  }

  const nextCalendar = [...manualCalendar];
  const currentRound = nextCalendar[roundIndex];
  nextCalendar[roundIndex] = nextCalendar[nextIndex];
  nextCalendar[nextIndex] = currentRound;

  return normalizeManualCalendarRoundOrder(nextCalendar);
}

function getManualCalendarMatches(
  manualCalendar: ManualCalendarRoundDraft[],
): ManualCalendarMatchDraft[] {
  return manualCalendar.flatMap((round) =>
    round.matches.map((match) => ({
      round: round.round,
      teamA: match.teamA,
      teamB: match.teamB,
    })),
  );
}

function isManualCalendarComplete({
  manualCalendar,
  validPlayerValues,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  validPlayerValues: Set<string>;
}) {
  return manualCalendar.every((round) => {
    const roundPlayerIds = round.matches.flatMap((match) => [
      ...match.teamA,
      ...match.teamB,
    ]);

    return (
      roundPlayerIds.length > 0 &&
      roundPlayerIds.every(
        (playerId) => playerId.length > 0 && validPlayerValues.has(playerId),
      ) &&
      new Set(roundPlayerIds).size === roundPlayerIds.length
    );
  });
}

function updateManualCalendarSlot({
  manualCalendar,
  roundIndex,
  matchIndex,
  teamKey,
  playerIndex,
  value,
}: {
  manualCalendar: ManualCalendarRoundDraft[];
  roundIndex: number;
  matchIndex: number;
  teamKey: ManualCalendarTeamKey;
  playerIndex: number;
  value: string;
}) {
  return manualCalendar.map((round, currentRoundIndex) => {
    if (currentRoundIndex !== roundIndex) {
      return round;
    }

    return {
      ...round,
      matches: round.matches.map((match, currentMatchIndex) => {
        if (currentMatchIndex !== matchIndex) {
          return match;
        }

        return {
          ...match,
          [teamKey]: match[teamKey].map((playerId, currentPlayerIndex) =>
            currentPlayerIndex === playerIndex ? value : playerId,
          ),
        };
      }),
    };
  });
}

function isSupabaseBackedId(id: string) {
  return supabaseUuidPattern.test(id);
}

function recordSupabaseError(action: string, error: unknown) {
  const details =
    typeof error === "object" && error !== null
      ? error
      : { message: String(error) };

  window.localStorage.setItem(
    lastSupabaseErrorStorageKey,
    JSON.stringify({
      action,
      ...details,
      createdAt: new Date().toISOString(),
    }),
  );
}

function resizePlayerNames(currentNames: string[], nextCount: number) {
  return Array.from(
    { length: nextCount },
    (_, index) => currentNames[index] ?? "",
  );
}

function getNextPlayerCount(currentCount: number) {
  return getDefaultSeasonPlayerCount(currentCount);
}

function getDefaultNewSeasonName({ seasonCount }: { seasonCount: number }) {
  return `Temporada ${seasonCount + 1}`;
}

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  };
}

function InviteLinkCard({
  inviteCode,
  leagueName,
}: {
  inviteCode: string;
  leagueName: string;
}) {
  const { tx } = useI18n()

  const { t } = useI18n();
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inviteUrl = getPublicInviteUrl(inviteCode);

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
      setError(null);
      window.setTimeout(() => setCopiedLabel(null), 1800);
    } catch {
      setError(t.adminSeason.inviteCopyError);
    }
  }

  if (!inviteCode) {
    return null;
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.inviteTitle}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {t.adminSeason.inviteDescription.replace("{leagueName}", leagueName)}
      </p>

      <div className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase text-neutral-500">
          {tx("Código de invitación")}{" "}</p>
        <p className="mt-1 break-all text-sm font-black text-neutral-950">
          {inviteCode}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleCopy(inviteCode, tx("Código copiado"))}
            className="inline-flex rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 items-center justify-center text-center"
          >
            {tx("Copiar código")}{" "}</button>

          <button
            type="button"
            onClick={() => handleCopy(inviteUrl, tx("URL copiada"))}
            className="inline-flex rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 items-center justify-center text-center"
          >
            {tx("Copiar URL")}{" "}</button>
        </div>
      </div>

      {copiedLabel ? (
        <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
          {copiedLabel}
        </p>
      ) : null}


      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}


const mvpSystemOptions: {
  value: MvpSystem;
  title: string;
  description: string;
}[] = [
  {
    value: "none",
    title: "Sin sistema MVP",
    description: "No se elegirán MVP de partido, jornada ni temporada.",
  },
  {
    value: "automatic",
    title: "MVP automático",
    description:
      "El sistema actual elige como MVP a la pareja ganadora con mejor diferencia de juegos de la jornada.",
  },
  {
    value: "automatic_advanced",
    title: "MVP automático avanzado",
    description:
      "Elige primero la pareja más dominante de la jornada y después compara a sus integrantes con un índice individual ajustado por compañero y rivales usando resultados, sets y juegos. Si quedan prácticamente igualados, comparte el MVP.",
  },
  {
    value: "voting",
    title: "MVP por votación",
    description:
      "Tras cada resultado, los jugadores votan a otra persona del partido. Con 3 votos se decide el MVP del partido; la jornada la gana quien acumule más votos.",
  },
];

function MvpSystemOptions({
  value,
  onChange,
}: {
  value: MvpSystem;
  onChange: (value: MvpSystem) => void;
}) {
  const { tx } = useI18n()
  return (
    <div className="mt-3 grid gap-2">
      {mvpSystemOptions.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border px-3 py-3 text-left ${
              selected
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-900"
            }`}
          >
            <span className="block text-sm font-black">{tx(option.title)}</span>
            <span
              className={`mt-1 block text-xs font-semibold leading-5 ${
                selected ? "text-neutral-300" : "text-neutral-500"
              }`}
            >
              {tx(option.description)}
            </span>
          </button>
        );
      })}
    </div>
  );
}


const resultConfirmationOptions: {
  value: ResultConfirmationMode;
  title: string;
  description: string;
}[] = [
  {
    value: "none",
    title: "Sin confirmaciones",
    description:
      "No se mostrará el apartado de confirmación de resultados.",
  },
  {
    value: "optional",
    title: "Confirmación adicional",
    description:
      "Los jugadores pueden confirmar o impugnar el resultado, pero este cuenta desde que se registra.",
  },
  {
    value: "required",
    title: "Confirmación obligatoria",
    description:
      "El jugador que informa el resultado queda validado implícitamente. El resultado suma cuando lo confirma el resto o, si nadie lo impugna, al cumplirse 24 horas.",
  },
];

function ResultConfirmationOptions({
  value,
  onChange,
}: {
  value: ResultConfirmationMode;
  onChange: (value: ResultConfirmationMode) => void;
}) {
  const { tx } = useI18n()
  return (
    <div className="mt-3 grid gap-2">
      {resultConfirmationOptions.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-2xl border px-3 py-3 text-left ${
              selected
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-900"
            }`}
          >
            <span className="block text-sm font-black">{tx(option.title)}</span>
            <span
              className={`mt-1 block text-xs font-semibold leading-5 ${
                selected ? "text-neutral-300" : "text-neutral-500"
              }`}
            >
              {tx(option.description)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function NewSeasonForm({
  activeLeagueId,
  activeLeagueName,
  activeSeasonId,
  currentPlayers,
  initialLocations,
}: {
  activeLeagueId: string;
  activeLeagueName: string;
  activeSeasonId: string;
  currentPlayers: SeasonPlayerSummary[];
  initialLocations: LeagueLocation[];
}) {
  const { tx } = useI18n()
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, playerProfiles, seasons, startNewSeason } =
    useSeasonSettings();
  const { createSeasonMatches, hydrateMatches } = useMatchData();
  const {
    deleteLeague,
    getLeagueInviteCode,
    isSuperuser,
    leagues: accessibleLeagues,
    linkCurrentUserToLeaguePlayer,
    updateLeagueLocations,
    userId,
  } = useLeagueAccess();
  const leaguePlayers = playerProfiles.filter(
    (player) => player.leagueId === activeLeagueId,
  );
  const leagueCreatorUserId = accessibleLeagues.find(
    (league) => league.id === activeLeagueId,
  )?.createdByUserId;
  const registrationRecipientPlayerId = leagueCreatorUserId
    ? leaguePlayers.find((player) => player.userId === leagueCreatorUserId)?.id ?? null
    : null;
  const leagueSeasonCount = seasons.filter(
    (season) => season.leagueId === activeLeagueId,
  ).length;
  const isFirstLeagueSeason = leagueSeasonCount === 0;
  const defaultPlayerCount = getNextPlayerCount(currentPlayers.length);
  const [newSeasonName, setNewSeasonName] = useState(
    getDefaultNewSeasonName({ seasonCount: leagueSeasonCount }),
  );
  const [leagueLocations, setLeagueLocations] =
    useState<LeagueLocation[]>(initialLocations);
  const [playerCount, setPlayerCount] = useState(defaultPlayerCount);
  const [rosterMode, setRosterMode] = useState<RosterMode>("fixed");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(
    currentPlayers.map((player) => player.id).slice(0, defaultPlayerCount),
  );
  const [organizationBallsAssigned, setOrganizationBallsAssigned] = useState(false);
  const [ballsAssignmentMode, setBallsAssignmentMode] = useState<"priority" | "selected">("priority");
  const [ballsAssignmentPriority, setBallsAssignmentPriority] = useState<string[]>(
    currentPlayers.map((player) => player.id).slice(0, defaultPlayerCount),
  );
  const [ballsAssignmentCustodianRefs, setBallsAssignmentCustodianRefs] = useState<string[]>(
    currentPlayers.map((player) => player.id).slice(0, defaultPlayerCount),
  );
  const [newPlayerNames, setNewPlayerNames] = useState<string[]>([]);
  const [appDirectory, setAppDirectory] = useState<SeasonAppDirectoryPerson[]>([]);
  const [appDirectoryLeagueId, setAppDirectoryLeagueId] = useState<string | null>(null);
  const [selectedAppUsers, setSelectedAppUsers] = useState<SeasonAppDirectoryPerson[]>([]);
  const [appPlayerQuery, setAppPlayerQuery] = useState("");
  const [selfPlayerValue, setSelfPlayerValue] = useState<string | null>(() =>
    leagueSeasonCount === 0 && userId && !isSuperuser
      ? getNewPlayerToken(0)
      : null,
  );
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("balanced");
  const [durationMode, setDurationMode] = useState<SeasonDurationMode>("complete");
  const [scheduleMode, setScheduleMode] = useState<SeasonScheduleMode>("single");
  const [longMultiplier, setLongMultiplier] = useState(2);
  const [customRoundCount, setCustomRoundCount] = useState(
    getSeasonBaseRoundCount(defaultPlayerCount),
  );
  const [manualCalendar, setManualCalendar] = useState<
    ManualCalendarRoundDraft[]
  >(() =>
    createBalancedManualCalendar(
      getDraftPlayerValues({
        selectedPlayerIds: currentPlayers
          .map((player) => player.id)
          .slice(0, defaultPlayerCount),
        playerCount: defaultPlayerCount,
      }),
      scheduleMode,
    ),
  );
  const [roundWindowMode, setRoundWindowMode] =
    useState<RoundWindowMode>("none");
  const [seasonStartsAt, setSeasonStartsAt] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledStartIsFuture, setScheduledStartIsFuture] = useState(true);
  const [calendarVisibilityMode, setCalendarVisibilityMode] = useState<"full" | "progressive">("full");
  const [openingRoundEnabled, setOpeningRoundEnabled] = useState(false);
  const [openingRoundAt, setOpeningRoundAt] = useState("");
  const [openingRoundLocationId, setOpeningRoundLocationId] = useState("");
  const [secretPhaseEnabled, setSecretPhaseEnabled] = useState(false);
  const [secretDaysBefore, setSecretDaysBefore] = useState("7");
  const [roundWindowDays, setRoundWindowDays] = useState("15");
  const [requiresThreeSets, setRequiresThreeSets] = useState(true);
  const [mvpSystem, setMvpSystem] = useState<MvpSystem>("automatic");
  const [resultConfirmationMode, setResultConfirmationMode] =
    useState<ResultConfirmationMode>("none");
  const [availabilityRecommendationsEnabled, setAvailabilityRecommendationsEnabled] = useState(false);
  const [hasRegistrationFee, setHasRegistrationFee] = useState(false);
  const [registrationFeeAmount, setRegistrationFeeAmount] = useState("10");
  const [registrationFeePurpose, setRegistrationFeePurpose] = useState(
    "Premios, bolas y gastos comunes de organización.",
  );
  const [creationFeedback, setCreationFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inviteCode = getLeagueInviteCode(activeLeagueId);
  const canLinkSelfPlayer = Boolean(isFirstLeagueSeason && userId && !isSuperuser);

  useEffect(() => {
    if (!isSupabaseBackedId(activeLeagueId)) return;

    let cancelled = false;
    void fetch(`/api/leagues/${activeLeagueId}/player-directory`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { people?: SeasonAppDirectoryPerson[] }
          | null;
        if (!response.ok || !Array.isArray(payload?.people)) {
          throw new Error("player_directory_lookup_failed");
        }
        if (!cancelled) {
          setAppDirectory(payload.people);
          setAppDirectoryLeagueId(activeLeagueId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAppDirectory([]);
          setAppDirectoryLeagueId(activeLeagueId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeLeagueId]);

  const parsedRoundWindowDays = Number(roundWindowDays);
  const parsedRegistrationFeeAmount = Number(registrationFeeAmount);
  const scheduledStartIso = datetimeLocalToIso(scheduledStartAt);
  const openingRoundIso = datetimeLocalToIso(openingRoundAt);
  const effectiveOpeningRoundIso = scheduledStartIso ?? openingRoundIso;
  const selectedOpeningRoundLocation =
    leagueLocations.find((location) => location.id === openingRoundLocationId) ?? null;
  const openingRoundLocation = selectedOpeningRoundLocation
    ? createScheduledLeagueLocationValue(selectedOpeningRoundLocation, null)
    : null;
  const hasValidOpeningRound =
    !openingRoundEnabled || Boolean(effectiveOpeningRoundIso && openingRoundLocation);
  const parsedSecretDaysBefore = Number(secretDaysBefore);
  const hasValidSecretPhase =
    !secretPhaseEnabled ||
    (Number.isInteger(parsedSecretDaysBefore) && parsedSecretDaysBefore >= 1 && parsedSecretDaysBefore <= 90);
  const preseasonSecretDaysBefore =
    scheduledStartIso && secretPhaseEnabled && hasValidSecretPhase
      ? parsedSecretDaysBefore
      : null;
  const hasValidScheduledStart =
    !scheduledStartAt || Boolean(scheduledStartIso && scheduledStartIsFuture && hasValidSecretPhase);
  const isFixedDaysMode = roundWindowMode === "fixed-days";
  const baseSeasonRounds = getSeasonBaseRoundCount(playerCount);
  const maxLongMultiplier = getSeasonMaxBalancedLegCount(playerCount);
  const maxSeasonRounds = getSeasonMaxRoundCount(playerCount);
  const effectiveScheduleMode: SeasonScheduleMode =
    durationMode === "custom" ? "extended" : scheduleMode;
  const totalSeasonRounds =
    durationMode === "custom"
      ? customRoundCount
      : getSeasonScheduleRoundCount({
          playerCount,
          mode: scheduleMode,
          longMultiplier,
        });
  const completeLegMultiplier =
    totalSeasonRounds > 0 && totalSeasonRounds % baseSeasonRounds === 0
      ? totalSeasonRounds / baseSeasonRounds
      : null;
  const hasValidDuration = isValidSeasonScheduleTarget({
    playerCount,
    mode: effectiveScheduleMode,
    targetRoundCount: totalSeasonRounds,
  });
  const selectedPlayerIdSet = useMemo(
    () => new Set(selectedPlayerIds),
    [selectedPlayerIds],
  );
  const continuingPlayers = leaguePlayers.filter((player) =>
    selectedPlayerIdSet.has(player.id),
  );
  const removedPlayers = currentPlayers.filter(
    (player) => !selectedPlayerIdSet.has(player.id),
  );
  const fixedOccupiedPlayerCount = selectedPlayerIds.length + selectedAppUsers.length;
  const newPlayerSlotCount = Math.max(playerCount - fixedOccupiedPlayerCount, 0);
  const visibleNewPlayerNames = resizePlayerNames(newPlayerNames, newPlayerSlotCount);
  const cleanNewPlayerNames = visibleNewPlayerNames.map((playerName) =>
    playerName.trim(),
  );
  const appPlayerTokenOffset = visibleNewPlayerNames.length;
  const selectedAppUserIds = selectedAppUsers.map((person) => person.userId);
  const selectedAppUserIdSet = new Set(selectedAppUserIds);
  const ballsAssignmentPriorityEntries = buildBallsAssignmentPriorityEntries({
    players: selectedPlayerIds.map((id) => ({ id, name: leaguePlayers.find((player) => player.id === id)?.displayName ?? currentPlayers.find((player) => player.id === id)?.displayName ?? id })),
    newPlayerNames: rosterMode === "fixed" ? visibleNewPlayerNames : [],
    newPlayerLabels: visibleNewPlayerNames.map((_, index) => tx(`Jugador ${selectedPlayerIds.length + index + 1}`)),
    appPlayers: rosterMode === "fixed" ? selectedAppUsers.map((person) => ({ userId: person.userId, name: person.displayName })) : [],
    selfPlayerName: rosterMode === "self_registration" && canLinkSelfPlayer && selfPlayerValue === getNewPlayerToken(0) ? session?.user?.name?.trim() || tx("Tú") : null,
  });
  const selectedBallsPriorityRefs = new Set(
    ballsAssignmentPriorityEntries.map((entry) => entry.ref),
  );
  const effectiveBallsAssignmentPriority = [
    ...ballsAssignmentPriority.filter((ref) => selectedBallsPriorityRefs.has(ref)),
    ...ballsAssignmentPriorityEntries
      .map((entry) => entry.ref)
      .filter((ref) => !ballsAssignmentPriority.includes(ref)),
  ];
  const effectiveBallsAssignmentCustodianRefs = ballsAssignmentCustodianRefs.filter((ref) => selectedBallsPriorityRefs.has(ref));
  const normalizedAppPlayerQuery = appPlayerQuery.trim().toLocaleLowerCase("es");
  const isAppDirectoryLoading =
    isSupabaseBackedId(activeLeagueId) && appDirectoryLeagueId !== activeLeagueId;
  const activeAppDirectory = appDirectoryLeagueId === activeLeagueId ? appDirectory : [];
  const filteredAppDirectory = activeAppDirectory
    .filter((person) => !selectedAppUserIdSet.has(person.userId))
    .filter(
      (person) =>
        !normalizedAppPlayerQuery ||
        person.displayName.toLocaleLowerCase("es").includes(normalizedAppPlayerQuery),
    )
    .slice(0, 8);
  const maxSelectableAppUsers = Math.max(
    playerCount - selectedPlayerIds.length - (canLinkSelfPlayer ? 1 : 0),
    0,
  );
  const manualPlayerOptions = [
    ...selectedPlayerIds.map((playerId) => {
      const player = leaguePlayers.find((item) => item.id === playerId);

      return {
        value: playerId,
        label: player?.displayName ?? playerId,
      };
    }),
    ...visibleNewPlayerNames.map((playerName, index) => ({
      value: getNewPlayerToken(index),
      label:
        playerName.trim() ||
        (isFirstLeagueSeason
          ? tx(`Jugador ${selectedPlayerIds.length + index + 1}`)
          : `Sustituto ${index + 1}`),
    })),
    ...selectedAppUsers.map((person, index) => ({
      value: getNewPlayerToken(appPlayerTokenOffset + index),
      label: person.displayName,
    })),
  ];
  const validManualPlayerValues = new Set(
    manualPlayerOptions.map((option) => option.value),
  );
  const selectedSelfPlayerValue =
    selfPlayerValue && validManualPlayerValues.has(selfPlayerValue)
      ? selfPlayerValue
      : null;
  const manualCalendarMatches = getManualCalendarMatches(manualCalendar);
  const getCustodianRosterValue = (ref: string) => {
    if (selectedPlayerIds.includes(ref)) return ref;
    if (ref === "self:creator") return selfPlayerValue ?? getNewPlayerToken(0);
    if (ref.startsWith("new:")) return getNewPlayerToken(Number(ref.slice(4)));
    if (ref.startsWith("app:")) {
      const appIndex = selectedAppUsers.findIndex((person) => person.userId === ref.slice(4));
      return appIndex >= 0 ? getNewPlayerToken(appPlayerTokenOffset + appIndex) : null;
    }
    return null;
  };
  const selectedCustodianRosterIds = effectiveBallsAssignmentCustodianRefs
    .map(getCustodianRosterValue)
    .filter((playerId): playerId is string => Boolean(playerId));
  const selectedCustodianCoverage = calculateBallCustodianAssignment({
    matches: manualCalendarMatches
      .filter((match) => !(openingRoundEnabled && effectiveOpeningRoundIso && match.round === 1))
      .map((match, index) => ({ ...match, id: `preview-${match.round}-${index}` })),
    seasonPlayerIds: manualPlayerOptions.map((option) => option.value),
    eligiblePlayerIds: selectedCustodianRosterIds,
  });
  const canValidateCustodianCoverage = rosterMode === "fixed" && manualCalendarMatches.length > 0;
  const isManualCalendarReady =
    rosterMode === "self_registration" ||
    calendarMode !== "manual" ||
    isManualCalendarComplete({
      manualCalendar,
      validPlayerValues: validManualPlayerValues,
    });
  const hasValidPlayers =
    isSeasonPlayerCountInRange(playerCount) &&
    (rosterMode === "self_registration"
      ? selectedPlayerIds.length <= playerCount
      : selectedPlayerIds.length <= playerCount &&
        selectedPlayerIds.length + selectedAppUsers.length + cleanNewPlayerNames.length === playerCount &&
        cleanNewPlayerNames.every(Boolean));
  const hasValidRegistrationFee =
    !hasRegistrationFee ||
    (Number.isFinite(parsedRegistrationFeeAmount) &&
      parsedRegistrationFeeAmount > 0);
  const canStartSeason =
    !isSaving &&
    newSeasonName.trim().length > 0 &&
    hasValidPlayers &&
    hasValidDuration &&
    isManualCalendarReady &&
    hasValidRegistrationFee &&
    hasValidScheduledStart &&
    hasValidOpeningRound &&
    (!organizationBallsAssigned || ballsAssignmentMode !== "selected" || (
      effectiveBallsAssignmentCustodianRefs.length > 0 &&
      (!canValidateCustodianCoverage || selectedCustodianCoverage.unassignedMatchIds.length === 0)
    )) &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1));

  function refreshManualCalendarFromPlayers({
    selectedIds,
    count,
    mode = effectiveScheduleMode,
    targetRounds = totalSeasonRounds,
  }: {
    selectedIds: string[];
    count: number;
    mode?: SeasonScheduleMode;
    targetRounds?: number;
  }) {
    setManualCalendar(
      createBalancedManualCalendar(
        getDraftPlayerValues({
          selectedPlayerIds: selectedIds,
          playerCount: count,
        }),
        mode,
        targetRounds,
      ),
    );
  }

  function handlePlayerCountChange(nextCount: number) {
    setPlayerCount(nextCount);
    const nextBaseRounds = getSeasonBaseRoundCount(nextCount);
    const nextMaxMultiplier = getSeasonMaxBalancedLegCount(nextCount);
    setLongMultiplier((current) => Math.min(Math.max(current, 2), nextMaxMultiplier));
    setCustomRoundCount((current) =>
      Math.min(Math.max(current || nextBaseRounds, 1), getSeasonMaxRoundCount(nextCount)),
    );

    if (rosterMode === "self_registration") {
      const nextSelectedPlayerIds = selectedPlayerIds.slice(0, nextCount);
      setSelectedPlayerIds(nextSelectedPlayerIds);
      setSelectedAppUsers([]);
      setNewPlayerNames([]);
      setSelfPlayerValue(null);
      setCreationFeedback(null);
      return;
    }

    const nextSelectedPlayerIds = selectedPlayerIds.slice(0, nextCount);
    const nextMaxAppUsers = Math.max(
      nextCount - nextSelectedPlayerIds.length - (canLinkSelfPlayer ? 1 : 0),
      0,
    );
    const nextSelectedAppUsers = selectedAppUsers.slice(0, nextMaxAppUsers);

    setSelectedPlayerIds(nextSelectedPlayerIds);
    setSelectedAppUsers(nextSelectedAppUsers);
    setNewPlayerNames((currentNames) =>
      resizePlayerNames(
        currentNames,
        Math.max(nextCount - nextSelectedPlayerIds.length - nextSelectedAppUsers.length, 0),
      ),
    );
    const nextLongMultiplier = Math.min(Math.max(longMultiplier, 2), nextMaxMultiplier);
    const nextTargetRounds =
      durationMode === "custom"
        ? Math.min(Math.max(customRoundCount || nextBaseRounds, 1), getSeasonMaxRoundCount(nextCount))
        : getSeasonScheduleRoundCount({
            playerCount: nextCount,
            mode: scheduleMode,
            longMultiplier: nextLongMultiplier,
          });
    refreshManualCalendarFromPlayers({
      selectedIds: nextSelectedPlayerIds,
      count: nextCount,
      mode: durationMode === "custom" ? "extended" : scheduleMode,
      targetRounds: nextTargetRounds,
    });
    if (isFirstLeagueSeason && userId && !isSuperuser) {
      setSelfPlayerValue(
        getDraftPlayerValues({
          selectedPlayerIds: nextSelectedPlayerIds,
          playerCount: nextCount,
        })[0] ?? null,
      );
    } else if (selfPlayerValue) {
      const nextValidValues = new Set(
        getDraftPlayerValues({
          selectedPlayerIds: nextSelectedPlayerIds,
          playerCount: nextCount,
        }),
      );

      if (!nextValidValues.has(selfPlayerValue)) {
        setSelfPlayerValue(null);
      }
    }
    setCreationFeedback(null);
  }

  function toggleExistingPlayer(playerId: string) {
    const nextSelectedPlayerIds = selectedPlayerIds.includes(playerId)
      ? selectedPlayerIds.filter(
          (currentPlayerId) => currentPlayerId !== playerId,
        )
      : selectedPlayerIds.length + (rosterMode === "fixed" ? selectedAppUsers.length : 0) >= playerCount
        ? selectedPlayerIds
        : [...selectedPlayerIds, playerId];

    setSelectedPlayerIds(nextSelectedPlayerIds);
    refreshManualCalendarFromPlayers({
      selectedIds: nextSelectedPlayerIds,
      count: playerCount,
    });
    if (isFirstLeagueSeason && userId && !isSuperuser) {
      setSelfPlayerValue(
        getDraftPlayerValues({
          selectedPlayerIds: nextSelectedPlayerIds,
          playerCount,
        })[0] ?? null,
      );
    } else if (
      selfPlayerValue === playerId &&
      !nextSelectedPlayerIds.includes(playerId)
    ) {
      setSelfPlayerValue(null);
    }
    setCreationFeedback(null);
  }

  function addAppUser(person: SeasonAppDirectoryPerson) {
    if (
      selectedAppUsers.some((item) => item.userId === person.userId) ||
      selectedAppUsers.length >= maxSelectableAppUsers
    ) {
      return;
    }

    const nextSelectedAppUsers = [...selectedAppUsers, person];
    setSelectedAppUsers(nextSelectedAppUsers);
    setNewPlayerNames((currentNames) =>
      resizePlayerNames(
        currentNames,
        Math.max(playerCount - selectedPlayerIds.length - nextSelectedAppUsers.length, 0),
      ),
    );
    setAppPlayerQuery("");
    setCreationFeedback(null);
  }

  function removeAppUser(userIdToRemove: string) {
    const nextSelectedAppUsers = selectedAppUsers.filter(
      (person) => person.userId !== userIdToRemove,
    );
    setSelectedAppUsers(nextSelectedAppUsers);
    setNewPlayerNames((currentNames) =>
      resizePlayerNames(
        currentNames,
        Math.max(playerCount - selectedPlayerIds.length - nextSelectedAppUsers.length, 0),
      ),
    );
    setCreationFeedback(null);
  }

  async function handleCancelLeagueCreation() {
    if (!isFirstLeagueSeason || isSaving) {
      return;
    }

    const confirmed = window.confirm(
      tx(`¿Cancelar la creación de ${activeLeagueName}? Se eliminará la liga completa porque todavía no tiene ninguna temporada.`),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const deleted = await deleteLeague(activeLeagueId);

    if (!deleted) {
      setError("No se ha podido cancelar la creación de la liga.");
      setIsSaving(false);
      return;
    }

    window.location.replace("/leagues");
  }

  async function handleStartSeason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canStartSeason) {
      return;
    }

    const manualMatches =
      calendarMode === "manual" ? manualCalendarMatches : undefined;
    const settings = {
      leagueId: activeLeagueId,
      name: newSeasonName.trim(),
      playerIds: selectedPlayerIds,
      appUserIds: rosterMode === "fixed" ? selectedAppUserIds : [],
      newPlayerNames: rosterMode === "self_registration" ? [] : cleanNewPlayerNames,
      roundWindowMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      scheduledStartAt: scheduledStartIso,
      preseasonSecretDaysBefore,
      calendarVisibilityMode,
      revealedThroughRound: 0,
      openingRoundEnabled,
      openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundIso : null,
      openingRoundLocation: openingRoundEnabled ? openingRoundLocation : null,
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
      mvpSystem,
      resultConfirmationMode,
      availabilityRecommendationsEnabled,
      organizationBallsAssigned,
      ballsAssignmentPriority: effectiveBallsAssignmentPriority,
      ballsAssignmentMode,
      ballsAssignmentCustodianIds: effectiveBallsAssignmentCustodianRefs,
      manualMatches,
      scheduleMode: effectiveScheduleMode,
      targetRoundCount: totalSeasonRounds,
      registrationFeeEnabled: hasRegistrationFee,
      registrationFeeAmount: hasRegistrationFee
        ? parsedRegistrationFeeAmount
        : 0,
      registrationFeePurpose: hasRegistrationFee ? registrationFeePurpose : "",
      selfPlayerValue: selectedSelfPlayerValue,
      registrationRecipientPlayerId,
      currentUserEmail: userId,
      currentUserDisplayName: session?.user?.name ?? null,
      currentUserAvatarUrl: session?.user?.image ?? null,
      rosterMode,
      playerCapacity: playerCount,
      calendarMode: rosterMode === "self_registration" ? "balanced" : calendarMode,
    };

    setIsSaving(true);
    setCreationFeedback(null);
    setError(null);

    if (isFirstLeagueSeason) {
      const locationsUpdated = await updateLeagueLocations(
        activeLeagueId,
        leagueLocations,
      );

      if (!locationsUpdated) {
        setError("No se han podido guardar las ubicaciones de la liga.");
        setIsSaving(false);
        return;
      }
    }

    if (isSupabaseBackedId(activeLeagueId)) {
      try {
        const result = await startSupabaseSeason({
          ...settings,
          activeSeasonId:
            activeSeasonId && isSupabaseBackedId(activeSeasonId)
              ? activeSeasonId
              : null,
        });

        hydrateSeasonSnapshot(result.seasonSnapshot);
        hydrateMatches(result.matches);

        if (result.linkedMembership) {
          linkCurrentUserToLeaguePlayer(
            result.linkedMembership.leagueId,
            result.linkedMembership.playerId,
          );
        }
      } catch (supabaseError) {
        recordSupabaseError("start-new-season", supabaseError);
        const createErrorCode = supabaseError instanceof Error ? supabaseError.message : "";
        setError(
          createErrorCode.includes("balls_assignment_custodians_do_not_cover_schedule")
            ? tx("Los custodios elegidos no pueden cubrir todos los partidos. Selecciona más jugadores.")
            : createErrorCode.includes("balls_assignment_custodian_required")
              ? tx("Selecciona al menos un custodio.")
              : "No se ha podido crear la nueva temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    } else {
      const result = startNewSeason(settings);
      const selectedNewPlayerIndex = selectedSelfPlayerValue
        ? getNewPlayerIndexFromToken(selectedSelfPlayerValue)
        : null;
      const selectedSelfPlayerId = selectedSelfPlayerValue
        ? selectedNewPlayerIndex === null
          ? selectedSelfPlayerValue
          : (result.newPlayerIds[selectedNewPlayerIndex] ?? null)
        : null;

      if (selectedSelfPlayerId) {
        linkCurrentUserToLeaguePlayer(activeLeagueId, selectedSelfPlayerId);
      }

      if (calendarMode === "manual" && manualMatches) {
        const resolvedManualMatches = resolveManualCalendarDraft({
          matches: manualMatches,
          newPlayerIds: result.newPlayerIds,
        });
        const localManualMatches = generateManualCalendar({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          matches: resolvedManualMatches,
          scheduleMode: effectiveScheduleMode,
          targetRoundCount: totalSeasonRounds,
        }).map((match) => ({
          ...match,
          rankingCounts: true,
          incidentType: null,
          incidentStatus: null,
          incidentReason: null,
          incidentNotes: null,
          incidentCreatedAt: null,
          incidentResolvedAt: null,
          resolutionType: null,
          substitutions: [],
          courtBooking: getEmptyCourtBooking(),
        }));

        hydrateMatches(localManualMatches);
      } else {
        createSeasonMatches({
          leagueId: activeLeagueId,
          seasonId: result.season.id,
          playerIds: result.playerIds,
          scheduleMode: effectiveScheduleMode,
          targetRoundCount: totalSeasonRounds,
        });
      }
    }

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: undefined,
        ...getActorFromSession(session),
        type: "season_created",
        title: "Nueva temporada creada",
        description: tx(`${playerCount} jugadores · ${totalSeasonRounds} jornadas.`),
        metadata: {
          playerCount,
          existingPlayerIds: selectedPlayerIds,
          appUserIds: rosterMode === "fixed" ? selectedAppUserIds : [],
          newPlayerNames:
            rosterMode === "self_registration" ? [] : cleanNewPlayerNames,
          rosterMode,
          playerCapacity: playerCount,
          calendarMode,
          calendarVisibilityMode,
          openingRoundEnabled,
          openingRoundAt: openingRoundEnabled ? effectiveOpeningRoundIso : null,
          scheduleMode: effectiveScheduleMode,
          durationMode,
          longMultiplier: durationMode === "complete" && scheduleMode === "extended" ? longMultiplier : null,
          totalRounds: totalSeasonRounds,
          mvpSystem,
          resultConfirmationMode,
          registrationFeeEnabled: hasRegistrationFee,
          registrationFeeAmount: hasRegistrationFee
            ? parsedRegistrationFeeAmount
            : 0,
          registrationFeePurpose: hasRegistrationFee ? registrationFeePurpose : "",
        },
      });
    } catch {
      // La temporada ya está creada; la actividad es auxiliar.
    }

    setNewSeasonName("");
    setRegistrationFeePurpose("Premios, bolas y gastos comunes de organización.");
    const successMessage =
      "Temporada creada. Puedes comenzarla cuando esté todo preparado.";
    setCreationFeedback(successMessage);
    showSavedFeedback(successMessage);
    setIsSaving(false);
    router.replace("/");
  }

  return (
    <form onSubmit={handleStartSeason} className="compact-page space-y-3">
      <AppCard>
        <p className="font-bold">{t.adminSeason.newSeasonTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {isFirstLeagueSeason
            ? tx("Configura la Temporada 1 con sus jugadores, calendario y reglas antes de abrir invitaciones.")
            : t.adminSeason.newSeasonDescription}
        </p>

        {!isFirstLeagueSeason ? (
          <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p className="font-black">{tx("No hay temporada activa.")}</p>
            <p className="mt-1">
              {tx("Confirma quién continúa, quita bajas, añade sustitutos y se generarán las jornadas de la nueva temporada, pero quedará en estado próximamente hasta que pulses Comenzar temporada.")}{" "}</p>
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.adminSeason.newSeasonName}
            </span>

            <input
              value={newSeasonName}
              onChange={(event) => {
                setNewSeasonName(event.target.value);
                setCreationFeedback(null);
              }}
              placeholder={t.adminSeason.newSeasonNamePlaceholder}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          {isFirstLeagueSeason ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-sm font-black text-neutral-900">
                {tx("Ubicaciones de la liga")}{" "}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                {tx("Busca clubes ya guardados o añade uno nuevo. Estas ubicaciones estarán disponibles al programar los partidos.")}{" "}</p>

              <div className="mt-3">
                <LeagueLocationsEditor
                  locations={leagueLocations}
                  onChange={(nextLocations) => {
                    setLeagueLocations(nextLocations);
                    setError(null);
                  }}
                  disabled={isSaving}
                  copy={{
                    emptyLocations: t.adminLeague.emptyLocations,
                    addLocationTitle: t.adminLeague.addLocationTitle,
                    locationName: t.adminLeague.locationName,
                    locationPlaceholder: t.adminLeague.locationPlaceholder,
                    town: t.adminLeague.town,
                    townPlaceholder: t.adminLeague.townPlaceholder,
                    googleLocation: t.adminLeague.googleLocation,
                    googleLocationPlaceholder: t.adminLeague.googleLocationPlaceholder,
                    courts: t.adminLeague.courts,
                    courtsPlaceholder: t.adminLeague.courtsPlaceholder,
                    duplicatedLocation: t.adminLeague.duplicatedLocation,
                    addLocation: t.adminLeague.addLocation,
                    editLocation: t.adminLeague.editLocation,
                    saveLocation: t.adminLeague.saveLocation,
                    cancelLocationEdit: t.adminLeague.cancelLocationEdit,
                    removeLocation: t.adminLeague.removeLocation,
                    openMaps: t.adminLeague.openMaps,
                    searchMaps: t.adminLeague.searchMaps,
                    googleApiMissing: t.adminLeague.googleApiMissing,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleCancelLeagueCreation}
                disabled={isSaving}
                className="flex mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 disabled:text-red-300 items-center justify-center text-center"
              >
                {tx("Cancelar creación de la liga")}{" "}</button>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {t.adminSeason.rosterModeTitle}
            </p>
            <div className="mt-2 grid gap-2">
              {(["fixed", "self_registration"] as RosterMode[]).map((mode) => {
                const selected = rosterMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setRosterMode(mode);
                      if (mode === "self_registration") {
                        setCalendarMode("balanced");
                        const nextIds = isFirstLeagueSeason
                          ? []
                          : currentPlayers
                              .map((player) => player.id)
                              .slice(0, playerCount);
                        setSelectedPlayerIds(nextIds);
                        setSelectedAppUsers([]);
                        setNewPlayerNames([]);
                        setSelfPlayerValue(null);
                      } else {
                        const nextIds = currentPlayers
                          .map((player) => player.id)
                          .slice(0, playerCount);
                        setSelectedPlayerIds(nextIds);
                        setSelectedAppUsers([]);
                        setNewPlayerNames(
                          resizePlayerNames([], Math.max(playerCount - nextIds.length, 0)),
                        );
                        refreshManualCalendarFromPlayers({
                          selectedIds: nextIds,
                          count: playerCount,
                        });
                      }
                      setCreationFeedback(null);
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left ${
                      selected
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-200 bg-white text-neutral-900"
                    }`}
                  >
                    <span className="block text-sm font-black">
                      {mode === "fixed"
                        ? t.adminSeason.rosterModeFixedTitle
                        : t.adminSeason.rosterModeSelfTitle}
                    </span>
                    <span
                      className={`mt-1 block text-xs font-semibold leading-5 ${
                        selected ? "text-neutral-300" : "text-neutral-500"
                      }`}
                    >
                      {mode === "fixed"
                        ? t.adminSeason.rosterModeFixedDescription
                        : t.adminSeason.rosterModeSelfDescription}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <SeasonPlayerCountSelector
            playerCount={playerCount}
            onChange={handlePlayerCountChange}
          />
        </div>
      </AppCard>

      {rosterMode === "fixed" ? (
      <AppCard>
        <p className="font-bold">{t.adminSeason.seasonPlayersTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {isFirstLeagueSeason
            ? tx("Añade los jugadores que formarán parte de esta primera temporada.")
            : t.adminSeason.seasonPlayersDescription}
        </p>

        {canLinkSelfPlayer ? (
          <div className="mt-3 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900">
            {tx("El primer jugador de la lista serás tú. Tu cuenta, perfil y foto se vincularán automáticamente a ese jugador al crear la temporada.")}{" "}</div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
            <p className="text-xs font-semibold text-neutral-500">
              {tx("Seleccionados")}
            </p>
            <p className="text-lg font-black">
              {selectedPlayerIds.length}/{playerCount}
            </p>
          </div>
          <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
            <p className="text-xs font-semibold text-neutral-500">
              {isFirstLeagueSeason ? tx("Jugadores") : "Sustitutos"}
            </p>
            <p className="text-lg font-black">{newPlayerSlotCount}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {leaguePlayers.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const wasInPreviousSeason = currentPlayers.some(
              (currentPlayer) => currentPlayer.id === player.id,
            );
            const isDisabled =
              !isSelected &&
              selectedPlayerIds.length + selectedAppUsers.length >= playerCount;

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => toggleExistingPlayer(player.id)}
                disabled={isDisabled}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-black disabled:opacity-40 ${
                  isSelected
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className={isSelected ? "bg-white text-neutral-900" : ""}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{player.displayName}</span>
                  <span
                    className={`mt-0.5 block text-xs ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}
                  >
                    {isFirstLeagueSeason
                      ? tx("Jugador")
                      : isSelected
                        ? tx("Continúa")
                        : wasInPreviousSeason
                          ? tx("Baja esta temporada")
                          : tx("Jugador de la liga")}
                  </span>
                </span>
                {canLinkSelfPlayer && selectedSelfPlayerValue === player.id ? (
                  <span className="shrink-0 rounded-full bg-amber-300 px-3 py-1 type-caption font-black text-neutral-950">
                    {tx("Tú")}{" "}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {!isFirstLeagueSeason && continuingPlayers.length > 0 ? (
          <p className="mt-3 truncate whitespace-nowrap text-xs font-semibold text-neutral-500">
            {tx("Continúan:")}{" "}
            {continuingPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {!isFirstLeagueSeason && removedPlayers.length > 0 ? (
          <p className="mt-2 truncate whitespace-nowrap text-xs font-semibold text-amber-700">
            {tx("No entran en la nueva temporada:")}{" "}
            {removedPlayers.map((player) => player.displayName).join(", ")}
          </p>
        ) : null}

        {isSupabaseBackedId(activeLeagueId) && maxSelectableAppUsers > 0 ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-sm font-black text-neutral-900">
              {tx("Seleccionar jugador de Smash & Lob")}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              {tx("Busca usuarios ya registrados en la aplicación. Se vinculará su perfil directamente a esta liga sin que tengan que reclamar el jugador después.")}
            </p>

            {selectedAppUsers.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selectedAppUsers.map((person) => (
                  <div
                    key={person.userId}
                    className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-neutral-200"
                  >
                    <PlayerAvatar player={person} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-neutral-900">
                      {person.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAppUser(person.userId)}
                      className="rounded-full px-2 py-1 text-xs font-black text-red-600 hover:bg-red-50"
                    >
                      {tx("Quitar")}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {selectedAppUsers.length < maxSelectableAppUsers ? (
              <>
                <input
                  value={appPlayerQuery}
                  onChange={(event) => setAppPlayerQuery(event.target.value)}
                  placeholder={tx("Buscar jugador por nombre")}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-400"
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {isAppDirectoryLoading ? (
                    <p className="text-xs font-semibold text-neutral-500">
                      {tx("Cargando jugadores…")}
                    </p>
                  ) : filteredAppDirectory.length > 0 ? (
                    filteredAppDirectory.map((person) => (
                      <button
                        key={person.userId}
                        type="button"
                        onClick={() => addAppUser(person)}
                        className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-left ring-1 ring-neutral-200 hover:ring-neutral-400"
                      >
                        <PlayerAvatar player={person} size="sm" />
                        <span className="min-w-0 flex-1 truncate text-xs font-black text-neutral-900">
                          {person.displayName}
                        </span>
                        <span className="text-xs font-black text-neutral-500">+</span>
                      </button>
                    ))
                  ) : appPlayerQuery.trim() ? (
                    <p className="text-xs font-semibold text-neutral-500">
                      {tx("No hay usuarios registrados que coincidan con la búsqueda.")}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}

        {newPlayerSlotCount > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleNewPlayerNames.map((playerName, index) => (
              <label key={index} className="block">
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-neutral-500">
                  <span>
                    {t.adminSeason.newPlayerName} {index + 1}
                  </span>
                  {canLinkSelfPlayer &&
                  selectedSelfPlayerValue === getNewPlayerToken(index) ? (
                    <span className="rounded-full bg-amber-300 px-2.5 py-0.5 type-caption font-black text-neutral-950">
                      {tx("Tú")}{" "}</span>
                  ) : null}
                </span>
                <input
                  value={playerName}
                  placeholder={
                    isFirstLeagueSeason
                      ? selectedSelfPlayerValue === getNewPlayerToken(index)
                        ? tx("Tu nombre")
                        : tx(`Jugador ${selectedPlayerIds.length + index + 1}`)
                      : `Sustituto ${index + 1}`
                  }
                  onChange={(event) => {
                    const nextNames = [...visibleNewPlayerNames];
                    nextNames[index] = event.target.value;
                    setNewPlayerNames(nextNames);
                    setCreationFeedback(null);
                  }}
                  className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                />
              </label>
            ))}
          </div>
        ) : null}
      </AppCard>
      ) : (
        <AppCard className="border-emerald-200 bg-emerald-50">
          <p className="font-bold text-emerald-950">
            {t.adminSeason.selfRegistrationWaitingTitle}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
            {isFirstLeagueSeason
              ? t.adminSeason.selfRegistrationWaitingDescription.replace(
                  "{count}",
                  String(playerCount),
                )
              : tx("Los jugadores de la temporada anterior están seleccionados por defecto. Puedes quitar cualquiera antes de crear la nueva temporada; los seleccionados quedarán inscritos automáticamente y las plazas restantes quedarán abiertas al autoregistro.")}
          </p>

          {!isFirstLeagueSeason ? (
            <>
              <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2.5 text-center text-sm font-black text-emerald-950">
                {selectedPlayerIds.length}/{playerCount} · {Math.max(playerCount - selectedPlayerIds.length, 0)} {tx("plazas disponibles")}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {currentPlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => toggleExistingPlayer(player.id)}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-black ${
                        isSelected
                          ? "bg-emerald-900 text-white"
                          : "bg-white/80 text-emerald-950 ring-1 ring-emerald-200"
                      }`}
                    >
                      <PlayerAvatar
                        player={player}
                        size="sm"
                        className={isSelected ? "bg-white text-neutral-900" : ""}
                      />
                      <span className="min-w-0 flex-1 truncate">{player.displayName}</span>
                      <span className="text-xs font-black">
                        {isSelected ? tx("Inscrito") : tx("No continúa")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-2xl bg-white/80 px-3 py-2.5 text-xs font-semibold text-emerald-900">
              {t.adminSeason.selfRegistrationCreatorNotice}
            </div>
          )}
        </AppCard>
      )}

      <AppCard data-season-calendar-type>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
            1
          </span>
          <p className="font-bold">{t.adminSeason.calendarModeLabel}</p>
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
          {t.adminSeason.calendarDescription}
        </p>

        {rosterMode === "fixed" ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {([
              ["balanced", t.adminSeason.balancedCalendar, t.adminSeason.balancedCalendarDescription],
              ["manual", t.adminSeason.manualCalendar, t.adminSeason.manualCalendarDescription],
            ] as const).map(([mode, title, description]) => {
              const isSelected = calendarMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setCalendarMode(mode);
                    setCreationFeedback(null);
                  }}
                  className={`rounded-2xl border p-3 text-left transition ${
                    isSelected
                      ? "border-neutral-950 bg-neutral-50 shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black text-neutral-950">{title}</span>
                    {isSelected ? (
                      <span className="rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black uppercase tracking-wide text-white">
                        {t.common.active}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-black text-emerald-950">
              {t.adminSeason.balancedCalendar}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
              {t.adminSeason.selfRegistrationCalendarDescription}
            </p>
          </div>
        )}
      </AppCard>

      <AppCard data-season-duration>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
                2
              </span>
              <p className="text-sm font-black">
                {t.adminSeason.seasonLengthTitle}
              </p>
            </div>
            <p className="mt-2 text-xs font-semibold text-neutral-500">
              {t.adminSeason.seasonLengthDescription}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
            {totalSeasonRounds} {t.adminSeason.roundsShortLabel}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {([
              ["complete", t.adminSeason.durationCompleteTitle, t.adminSeason.durationCompleteDescription],
              ["custom", t.adminSeason.durationCustomTitle, t.adminSeason.durationCustomDescription],
            ] as const).map(([mode, title, description]) => {
              const isSelected = durationMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setDurationMode(mode);
                    const nextMode: SeasonScheduleMode = mode === "custom" ? "extended" : scheduleMode;
                    const nextTarget = mode === "custom"
                      ? Math.min(Math.max(customRoundCount, 1), maxSeasonRounds)
                      : getSeasonScheduleRoundCount({ playerCount, mode: scheduleMode, longMultiplier });
                    refreshManualCalendarFromPlayers({
                      selectedIds: selectedPlayerIds,
                      count: playerCount,
                      mode: nextMode,
                      targetRounds: nextTarget,
                    });
                    setCreationFeedback(null);
                  }}
                  className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "border-neutral-950 bg-neutral-50 shadow-sm"
                      : "border-neutral-200 bg-white text-neutral-600"
                  }`}
                >
                  <span className="text-sm font-black">{title}</span>
                  {mode === "complete" ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 type-caption font-black uppercase tracking-wide text-emerald-800">
                      {t.adminSeason.durationRecommended}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                    {description}
                  </span>
                </button>
              );
            })}
        </div>

        {durationMode === "complete" ? (
            <div className="mt-3 grid gap-2">
              {(["single", "double", "extended"] as SeasonScheduleMode[]).map(
                (mode) => {
                  const isSelected = scheduleMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setScheduleMode(mode);
                        const nextTarget = getSeasonScheduleRoundCount({
                          playerCount,
                          mode,
                          longMultiplier,
                        });
                        refreshManualCalendarFromPlayers({
                          selectedIds: selectedPlayerIds,
                          count: playerCount,
                          mode,
                          targetRounds: nextTarget,
                        });
                        setCreationFeedback(null);
                      }}
                      className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "border-neutral-950 bg-neutral-50 shadow-sm"
                          : "border-neutral-200 bg-white text-neutral-600"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black">
                          {mode === "single"
                            ? t.adminSeason.singleRoundCalendar
                            : mode === "double"
                              ? t.adminSeason.doubleRoundCalendar
                              : t.adminSeason.extendedCalendar}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full bg-neutral-950 px-2 py-0.5 type-caption font-black uppercase tracking-wide text-white">
                            {t.common.active}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-neutral-500">
                        {mode === "single"
                          ? t.adminSeason.singleRoundCalendarDescription
                          : mode === "double"
                            ? t.adminSeason.doubleRoundCalendarDescription
                            : t.adminSeason.extendedCalendarDescription}
                      </span>
                    </button>
                  );
                },
              )}

              {scheduleMode === "extended" ? (
                <label className="rounded-2xl border border-neutral-200 bg-white p-3">
                  <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                    {t.adminSeason.longMultiplierLabel}
                  </span>
                  <select
                    value={longMultiplier}
                    onChange={(event) => {
                      const nextMultiplier = Number(event.target.value);
                      setLongMultiplier(nextMultiplier);
                      refreshManualCalendarFromPlayers({
                        selectedIds: selectedPlayerIds,
                        count: playerCount,
                        mode: "extended",
                        targetRounds: baseSeasonRounds * nextMultiplier,
                      });
                      setCreationFeedback(null);
                    }}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none"
                  >
                    {Array.from({ length: Math.max(maxLongMultiplier - 1, 0) }, (_, index) => index + 2).map((multiplier) => (
                      <option key={multiplier} value={multiplier}>
                        ×{multiplier} · {baseSeasonRounds * multiplier} {t.adminSeason.roundsShortLabel}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
                    {t.adminSeason.longMultiplierHelp
                      .replace("{max}", String(maxLongMultiplier))
                      .replace("{rounds}", String(maxSeasonRounds))}
                  </p>
                </label>
              ) : null}
            </div>
          ) : (
            <label className="mt-3 block rounded-2xl border border-neutral-200 bg-white p-3">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.adminSeason.customRoundCountLabel}
              </span>
              <input
                type="number"
                min={1}
                max={maxSeasonRounds}
                step={1}
                value={customRoundCount}
                onChange={(event) => {
                  const rawValue = Number(event.target.value);
                  const nextRounds = Number.isInteger(rawValue)
                    ? Math.min(Math.max(rawValue, 1), maxSeasonRounds)
                    : 1;
                  setCustomRoundCount(nextRounds);
                  refreshManualCalendarFromPlayers({
                    selectedIds: selectedPlayerIds,
                    count: playerCount,
                    mode: "extended",
                    targetRounds: nextRounds,
                  });
                  setCreationFeedback(null);
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none"
              />
              <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
                {t.adminSeason.customRoundCountHelp
                  .replace("{max}", String(maxSeasonRounds))}
              </p>
              <p className={`mt-2 rounded-xl px-3 py-2 text-xs font-black ${
                completeLegMultiplier
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}>
                {completeLegMultiplier
                  ? t.adminSeason.perfectDurationBadge
                      .replace("{count}", String(completeLegMultiplier))
                  : t.adminSeason.optimizedDurationBadge
                      .replace("{rounds}", String(totalSeasonRounds))}
              </p>
            </label>
        )}
      </AppCard>

      <AppCard data-season-calendar-visibility>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
            3
          </span>
          <p className="font-bold">{t.adminSeason.calendarVisibilityTitle}</p>
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
          {t.adminSeason.calendarVisibilityDescription}
        </p>
        <div className="mt-3 space-y-2">
          {([
            ["full", t.adminSeason.calendarVisibilityFullTitle, t.adminSeason.newCalendarVisibilityFullDescription],
            ["progressive", t.adminSeason.calendarVisibilityProgressiveTitle, t.adminSeason.newCalendarVisibilityProgressiveDescription],
          ] as const).map(([mode, title, description]) => (
            <label
              key={mode}
              className={`flex items-start gap-3 rounded-2xl border p-3 ${
                calendarVisibilityMode === mode
                  ? "border-neutral-950 bg-neutral-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="newCalendarVisibility"
                checked={calendarVisibilityMode === mode}
                onChange={() => {
                  setCalendarVisibilityMode(mode);
                  setCreationFeedback(null);
                }}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-black text-neutral-950">{title}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </AppCard>

      {rosterMode === "fixed" && calendarMode === "manual" ? (
        <AppCard data-season-manual-calendar>
          <div className="space-y-4">
            <div className="rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700">
              <p className="font-black">
                {totalSeasonRounds} {tx("jornadas ·")}{" "}
                {getMatchesPerRound(playerCount)}{" "}
                {getMatchesPerRound(playerCount) === 1 ? tx("partido") : "partidos"}{" "}
                {tx("por jornada")}{" "}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {effectiveScheduleMode === "double"
                  ? t.adminSeason.manualCalendarDoubleHelp
                  : effectiveScheduleMode === "extended"
                    ? t.adminSeason.manualCalendarLongHelp
                    : t.adminSeason.manualCalendarSingleHelp}
              </p>
              <button
                type="button"
                onClick={() => {
                  refreshManualCalendarFromPlayers({
                    selectedIds: selectedPlayerIds,
                    count: playerCount,
                    mode: effectiveScheduleMode,
                    targetRounds: totalSeasonRounds,
                  });
                  setCreationFeedback(null);
                }}
                className="flex mt-3 w-full rounded-2xl bg-white px-3 py-2.5 text-xs font-black text-neutral-800 shadow-sm items-center justify-center text-center"
              >
                {tx("Restaurar calendario automático")}{" "}</button>
            </div>

            {manualCalendar.map((round, roundIndex) => (
              <div
                key={round.round}
                className="rounded-2xl border border-neutral-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{tx("Jornada")}{" "}{round.round}</p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualCalendar((currentCalendar) =>
                          moveManualCalendarRound({
                            manualCalendar: currentCalendar,
                            roundIndex,
                            direction: -1,
                          }),
                        )
                      }
                      disabled={roundIndex === 0}
                      className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700 disabled:opacity-30 items-center justify-center text-center"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setManualCalendar((currentCalendar) =>
                          moveManualCalendarRound({
                            manualCalendar: currentCalendar,
                            roundIndex,
                            direction: 1,
                          }),
                        )
                      }
                      disabled={roundIndex === manualCalendar.length - 1}
                      className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700 disabled:opacity-30 items-center justify-center text-center"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-4">
                  {round.matches.map((manualMatch, matchIndex) => {
                    const selectedRoundPlayerIds = [
                      ...manualMatch.teamA,
                      ...manualMatch.teamB,
                    ].filter(Boolean);
                    const hasDuplicatePlayers =
                      new Set(selectedRoundPlayerIds).size !==
                      selectedRoundPlayerIds.length;

                    return (
                      <div
                        key={`${round.round}-${matchIndex}`}
                        className="rounded-2xl bg-neutral-100 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-black">
                            {tx("Partido")}{" "}{matchIndex + 1}
                          </p>
                          {hasDuplicatePlayers ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 type-caption font-black text-amber-800">
                              {tx("Revisa duplicados")}
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {(["teamA", "teamB"] as ManualCalendarTeamKey[]).map(
                            (teamKey) => (
                              <div
                                key={teamKey}
                                className="rounded-2xl bg-white p-3"
                              >
                                <p className="type-caption font-black uppercase tracking-wide text-neutral-500">
                                  {teamKey === "teamA"
                                    ? "Pareja A"
                                    : "Pareja B"}
                                </p>

                                <div className="mt-2 space-y-2">
                                  {manualMatch[teamKey].map(
                                    (playerId, playerIndex) => (
                                      <select
                                        key={`${teamKey}-${playerIndex}`}
                                        value={playerId}
                                        onChange={(event) => {
                                          setManualCalendar((currentCalendar) =>
                                            updateManualCalendarSlot({
                                              manualCalendar: currentCalendar,
                                              roundIndex,
                                              matchIndex,
                                              teamKey,
                                              playerIndex,
                                              value: event.target.value,
                                            }),
                                          );
                                          setCreationFeedback(null);
                                        }}
                                        className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm font-bold text-neutral-950 outline-none"
                                      >
                                        <option value="">
                                          {tx("Jugador")}{" "}{playerIndex + 1}
                                        </option>
                                        {manualPlayerOptions.map((option) => (
                                          <option
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    ),
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {!isManualCalendarReady ? (
              <p className="rounded-2xl bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
                {tx("Completa todos los desplegables sin repetir jugador dentro de la misma jornada para poder crear la temporada.")}{" "}</p>
            ) : null}
          </div>
        </AppCard>
      ) : null}

      <AppCard>
        <p className="font-bold">{t.adminSeason.resultRulesTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {t.adminSeason.resultRulesDescription}
        </p>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
          <input
            type="checkbox"
            checked={requiresThreeSets}
            onChange={(event) => {
              setRequiresThreeSets(event.target.checked);
              setCreationFeedback(null);
            }}
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black">
              {t.adminSeason.requireThreeSetsTitle}
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              {t.adminSeason.requireThreeSetsDescription}
            </span>
          </span>
        </label>
      </AppCard>

      <AppCard>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={availabilityRecommendationsEnabled}
            onChange={(event) => setAvailabilityRecommendationsEnabled(event.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-black">{tx("Disponibilidad y recomendaciones")}</span>
            <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
              {tx("Opcional. Usa los horarios habituales de los jugadores para sugerir fechas al programar partidos. Por defecto se coordina desde el chat.")}{" "}</span>
          </span>
        </label>
      </AppCard>

      <AppCard>
        <p className="font-bold">{tx("Sistema MVP")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("Decide si habrá MVP de jornada y cómo se seleccionará.")}{" "}</p>

        <MvpSystemOptions
          value={mvpSystem}
          onChange={(nextSystem) => {
            setMvpSystem(nextSystem);
            setCreationFeedback(null);
          }}
        />
      </AppCard>



      <AppCard>
        <p className="font-bold">{tx("Confirmación de resultados")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("Decide si los resultados necesitan validación de los jugadores.")}{" "}</p>

        <ResultConfirmationOptions
          value={resultConfirmationMode}
          onChange={(nextMode) => {
            setResultConfirmationMode(nextMode);
            setCreationFeedback(null);
          }}
        />
      </AppCard>

      <AppCard>
        <p className="font-bold">{tx("Bolas asignadas por la organización")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("La organización entrega un bote por partido. Se desactiva la compra de bolas y la app asigna el encargado con el menor número de custodios posible.")}
        </p>
        <label className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
          <input
            type="checkbox"
            checked={organizationBallsAssigned}
            onChange={(event) => {
              setOrganizationBallsAssigned(event.target.checked);
              setCreationFeedback(null);
            }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-black">{tx("Activar reparto de botes")}</span>
            <span className="mt-1 block text-xs text-neutral-500">{tx("Elige cómo se decidirá quién puede custodiar los botes.")}</span>
          </span>
        </label>
        {organizationBallsAssigned ? (
          <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Modo de reparto")}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
                <input type="radio" name="creation-balls-mode" checked={ballsAssignmentMode === "priority"} onChange={() => setBallsAssignmentMode("priority")} className="mt-0.5" />
                <span><span className="block font-black">{tx("Seleccionar orden de prioridad")}</span><span className="mt-1 block text-xs text-neutral-500">{tx("La app resuelve empates siguiendo este orden.")}</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm">
                <input type="radio" name="creation-balls-mode" checked={ballsAssignmentMode === "selected"} onChange={() => {
                  setBallsAssignmentMode("selected");
                  if (effectiveBallsAssignmentCustodianRefs.length === 0) setBallsAssignmentCustodianRefs(ballsAssignmentPriorityEntries.map((item) => item.ref));
                }} className="mt-0.5" />
                <span><span className="block font-black">{tx("Seleccionar custodios")}</span><span className="mt-1 block text-xs text-neutral-500">{tx("Solo las personas elegidas podrán llevar botes.")}</span></span>
              </label>
            </div>
            {ballsAssignmentMode === "priority" ? <>
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Prioridad de custodios")}</p>
              <div className="mt-2 space-y-1.5">
                {effectiveBallsAssignmentPriority.map((priorityRef, index) => {
                  const player = ballsAssignmentPriorityEntries.find((item) => item.ref === priorityRef);
                  if (!player) return null;
                  return (
                    <div key={priorityRef} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-sm font-bold">
                      <span className="w-5 text-xs text-neutral-400">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{player.name}</span>
                      <button type="button" disabled={index === 0} onClick={() => setBallsAssignmentPriority(moveBallsAssignmentPriority(effectiveBallsAssignmentPriority, index, -1))} className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-2 py-1 text-xs disabled:opacity-30" aria-label={tx("Subir prioridad")}>↑</button>
                      <button type="button" disabled={index === effectiveBallsAssignmentPriority.length - 1} onClick={() => setBallsAssignmentPriority(moveBallsAssignmentPriority(effectiveBallsAssignmentPriority, index, 1))} className="inline-flex items-center justify-center rounded-lg bg-neutral-100 px-2 py-1 text-xs disabled:opacity-30" aria-label={tx("Bajar prioridad")}>↓</button>
                    </div>
                  );
                })}
              </div>
            </> : <div className="mt-3 space-y-1.5">
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Jugadores que pueden ser custodios")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ballsAssignmentPriorityEntries.map((player) => {
                  const isSelected = effectiveBallsAssignmentCustodianRefs.includes(player.ref);
                  const profile = leaguePlayers.find((item) => item.id === player.ref) ?? currentPlayers.find((item) => item.id === player.ref);
                  const appUserId = player.ref.startsWith("app:") ? player.ref.slice(4) : null;
                  const avatarUrl = profile?.avatarUrl ?? (appUserId ? activeAppDirectory.find((person) => person.userId === appUserId)?.avatarUrl : null);
                  return (
                    <BallCustodianChoice
                      key={player.ref}
                      name={player.name}
                      avatarUrl={avatarUrl}
                      selected={isSelected}
                      onClick={() => setBallsAssignmentCustodianRefs((current) => current.includes(player.ref) ? current.filter((ref) => ref !== player.ref) : [...current, player.ref])}
                    />
                  );
                })}
              </div>
              {effectiveBallsAssignmentCustodianRefs.length === 0 ? <p className="text-xs font-semibold text-red-600">{tx("Selecciona al menos un custodio.")}</p> : null}
              {canValidateCustodianCoverage && selectedCustodianCoverage.unassignedMatchIds.length > 0 ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">{tx("Los custodios elegidos no pueden cubrir todos los partidos. Selecciona más jugadores.")}</p> : null}
              {rosterMode === "self_registration" ? <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-600">{tx("La cobertura se comprobará cuando se genere el calendario.")}</p> : null}
            </div>}
            {openingRoundEnabled && effectiveOpeningRoundIso && registrationRecipientPlayerId ? (
              <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-neutral-600">
                {tx("Todos los partidos de la Jornada de Apertura se asignarán al organizador.")}
              </p>
            ) : null}
          </div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{tx("Inscripción")}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {tx("Define si esta temporada tiene cuota de inscripción y cuánto debe pagar cada jugador.")}{" "}</p>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
          <input
            type="checkbox"
            checked={hasRegistrationFee}
            onChange={(event) => {
              setHasRegistrationFee(event.target.checked);
              setCreationFeedback(null);
            }}
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black">
              {tx("Activar inscripción de temporada")}{" "}</span>
            <span className="mt-1 block text-xs text-neutral-500">
              {tx("En HOME aparecerá un panel para consultar y gestionar los pagos.")}{" "}</span>
          </span>
        </label>

        {hasRegistrationFee ? (
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-neutral-700">
              {tx("Precio por jugador")}{" "}</span>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
              <input
                type="number"
                min={0}
                step="0.5"
                value={registrationFeeAmount}
                onChange={(event) => {
                  setRegistrationFeeAmount(event.target.value);
                  setCreationFeedback(null);
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-black text-neutral-950 outline-none"
              />
              <span className="text-sm font-black text-neutral-500">€</span>
            </div>
            {!hasValidRegistrationFee ? (
              <span className="mt-2 block text-xs font-semibold text-red-600">
                {tx("Introduce un importe mayor que 0.")}{" "}</span>
            ) : null}
          </label>
        ) : null}

        {hasRegistrationFee ? (
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-neutral-700">
              {tx("Destino de la inscripción")}{" "}</span>
            <textarea
              value={registrationFeePurpose}
              onChange={(event) => {
                setRegistrationFeePurpose(event.target.value);
                setCreationFeedback(null);
              }}
              rows={3}
              placeholder={tx("Ejemplo: premios, bolas, bote final o gastos comunes de organización.")}
              className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold leading-5 text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
            <span className="mt-2 block text-xs font-semibold leading-5 text-neutral-500">
              {tx("Esta explicación se mostrará a los jugadores junto al estado de sus pagos.")}{" "}</span>
          </label>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{tx("Inicio programado")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("Opcional. Si eliges fecha y hora, la temporada permanecerá en preparación hasta ese momento. Los jugadores podrán unirse, vincularse y completar su perfil, pero no operar partidos ni resultados.")}{" "}</p>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-700">{tx("Fecha y hora de activación")}</span>
          <input
            type="datetime-local" step={3600} value={scheduledStartAt}
            onFocus={() => { if (!scheduledStartAt) { setScheduledStartAt(formatNextScheduledStartForInput()); setScheduledStartIsFuture(true); } }}
            onChange={(event) => {
              const value = event.target.value;
              const iso = datetimeLocalToIso(value);
              setScheduledStartAt(value);
              setScheduledStartIsFuture(!value || Boolean(iso && new Date(iso).getTime() > Date.now()));
              if (openingRoundEnabled && value) {
                setOpeningRoundAt(value);
              } else if (!value && openingRoundEnabled && !openingRoundAt) {
                setOpeningRoundAt(formatNextScheduledStartForInput());
              }
              setCreationFeedback(null);
            }}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
          />
        </label>
        {scheduledStartAt && (!scheduledStartIso || !scheduledStartIsFuture) ? (
          <p className="mt-2 text-xs font-semibold text-red-600">{tx("La fecha programada debe ser futura y válida en horario de Madrid.")}</p>
        ) : null}
        {scheduledStartAt ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={secretPhaseEnabled}
                onChange={(event) => { setSecretPhaseEnabled(event.target.checked); setCreationFeedback(null); }}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-black">{tx("Activar Fase secretos")}</span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                  {tx("Antes del inicio, los jugadores podrán ver una apertura segura de la Jornada 1 sin conocer los emparejamientos.")}
                </span>
              </span>
            </label>
            {secretPhaseEnabled ? (
              <label className="mt-3 block">
                <span className="text-sm font-semibold text-neutral-700">{tx("Comenzar Fase secretos")}</span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    step={1}
                    value={secretDaysBefore}
                    onChange={(event) => { setSecretDaysBefore(event.target.value); setCreationFeedback(null); }}
                    className="w-24 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none focus:border-neutral-400"
                  />
                  <span className="text-sm font-semibold text-neutral-600">{tx("días antes del inicio")}</span>
                </div>
                {!hasValidSecretPhase ? <span className="mt-2 block text-xs font-semibold text-red-600">{tx("Introduce entre 1 y 90 días.")}</span> : null}
              </label>
            ) : null}
          </div>
        ) : null}
        {scheduledStartIso && hasValidScheduledStart ? (
          <div className="mt-3"><SeasonStartCountdown scheduledStartAt={scheduledStartIso} compact /></div>
        ) : null}
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {t.adminSeason.newRoundWindowDescription}
        </p>

        <div className="mt-4 space-y-3">
          {(["none", "fixed-days"] as RoundWindowMode[]).map((mode) => (
            <label
              key={mode}
              className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-3"
            >
              <input
                type="radio"
                name="newRoundWindowMode"
                value={mode}
                checked={roundWindowMode === mode}
                onChange={() => {
                  setRoundWindowMode(mode);
                  setCreationFeedback(null);
                }}
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-black">
                  {mode === "none"
                    ? t.adminSeason.noWindowTitle
                    : t.adminSeason.fixedDaysTitle}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {mode === "none"
                    ? t.adminSeason.noWindowDescription
                    : t.adminSeason.fixedDaysDescription}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={openingRoundEnabled}
              onChange={(event) => {
                const checked = event.target.checked;
                setOpeningRoundEnabled(checked);
                if (!checked) {
                  setOpeningRoundAt("");
                  setOpeningRoundLocationId("");
                } else if (scheduledStartAt) {
                  setOpeningRoundAt(scheduledStartAt);
                } else if (!openingRoundAt) {
                  setOpeningRoundAt(formatNextScheduledStartForInput());
                }
                setCreationFeedback(null);
              }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-black text-neutral-950">{t.adminSeason.openingRoundTitle}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                {t.adminSeason.openingRoundCreateDescription}
              </span>
            </span>
          </label>
          {openingRoundEnabled ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {scheduledStartAt ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                  <span className="text-sm font-semibold text-neutral-700">{t.adminSeason.openingRoundDateTime}</span>
                  <p className="mt-2 text-sm font-black text-neutral-950">{scheduledStartAt.replace("T", " · ")}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                    {t.adminSeason.openingRoundScheduledStartHelp}
                  </p>
                </div>
              ) : (
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-700">{t.adminSeason.openingRoundDateTime}</span>
                  <input
                    type="datetime-local"
                    step={3600}
                    value={openingRoundAt}
                    onFocus={() => {
                      if (!openingRoundAt) setOpeningRoundAt(formatNextScheduledStartForInput());
                    }}
                    onChange={(event) => {
                      setOpeningRoundAt(event.target.value);
                      setCreationFeedback(null);
                    }}
                    className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-sm font-semibold text-neutral-700">{t.adminSeason.openingRoundLocation}</span>
                <select
                  value={openingRoundLocationId}
                  onChange={(event) => {
                    setOpeningRoundLocationId(event.target.value);
                    setCreationFeedback(null);
                  }}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                >
                  <option value="">{t.adminSeason.openingRoundLocationPlaceholder}</option>
                  {sortLeagueLocationsByTownNameLabel(leagueLocations).map((location) => (
                    <option key={location.id} value={location.id}>
                      {getLeagueLocationTownNameLabel(location)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="sm:col-span-2 block text-xs font-semibold leading-5 text-neutral-500">
                {t.adminSeason.openingRoundCreateAutoHelp}
              </span>
              {!scheduledStartAt && openingRoundAt && !openingRoundIso ? (
                <span className="sm:col-span-2 block text-xs font-semibold text-red-600">{t.adminSeason.openingRoundInvalid}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {isFixedDaysMode ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {openingRoundEnabled ? t.adminSeason.regularLeagueStart : t.adminSeason.seasonStartDate}
              </span>

              <input
                type="date"
                value={seasonStartsAt}
                onChange={(event) => {
                  setSeasonStartsAt(event.target.value);
                  setCreationFeedback(null);
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.daysPerRound}
              </span>

              <input
                type="number"
                min={1}
                value={roundWindowDays}
                onChange={(event) => {
                  setRoundWindowDays(event.target.value);
                  setCreationFeedback(null);
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        ) : null}
      </AppCard>

      <button
        type="submit"
        disabled={!canStartSeason}
        className="flex w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
      >
        {isSaving ? "Guardando..." : tx("Crear temporada")}
      </button>

      {error ? (
        <p className="text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}

      {creationFeedback && inviteCode ? (
        <InviteLinkCard
          inviteCode={inviteCode}
          leagueName={activeLeagueName}
        />
      ) : null}
    </form>
  );
}

