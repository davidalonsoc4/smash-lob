"use client"
import { validateLeaguePairs, areLeagueMatchesPaired, type LeaguePair } from "@/lib/fixedPairLeague"
import { getSeasonBaseRoundCount as baseRounds } from "@/lib/seasonPlayerCount"
import { getSeasonScheduleRoundCount as scheduleRounds, getSeasonMaxBalancedLegCount as maxLegs, getSeasonMaxRoundCount as maxRounds, isValidSeasonScheduleTarget as validTarget } from "@/lib/calendar"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_LEAGUE_ACCENT } from "@/lib/visualStyle"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { getIntlLocale } from "@/i18n/leagueText"
import { LeagueCreationForm } from "@/components/league/LeagueCreationForm"
import { SeasonCreationSummary, type SeasonCreationSummaryGroup } from "./SeasonCreationSummary"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { PersonalMatchLocationPicker } from "@/components/personal/PersonalMatchLocationPicker"
import { SeasonPairFields } from "@/components/season/SeasonPairFields"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { SeasonPlayerCountSelector } from "@/components/season/SeasonPlayerCountSelector"
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown"
import { BallCustodianChoice } from "@/components/admin/season/OrganizationBallsSettingsPanel"
import { AppCard } from "@/components/ui/AppCard"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import type { League } from "@/data/fakeData"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { RoundWindowMode, useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { startSupabaseSeason } from "@/lib/supabaseSeasons"
import { generateBalancedCalendar, generateManualCalendar, getNewPlayerIndexFromToken, getNewPlayerToken, getSeasonScheduleRoundCount, resolveManualCalendarDraft, type ManualCalendarMatchDraft, type SeasonScheduleMode } from "@/lib/calendar"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import type { MvpSystem } from "@/lib/mvp"
import { type LeagueLocation, createScheduledLeagueLocationValue, getLeagueLocationTownNameLabel, sortLeagueLocationsByTownNameLabel, normalizeLeagueLocations } from "@/lib/leagueLocations"
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
  onExit, draftLeague, onEditLeague, onPrepareLeague, onCreated,
}: {
  activeLeagueId: string;
  activeLeagueName: string;
  activeSeasonId: string;
  currentPlayers: SeasonPlayerSummary[];
  initialLocations: LeagueLocation[];
  onExit?: () => void;
  draftLeague?: League;
  onEditLeague?: (fromSummary: boolean) => void;
  onPrepareLeague?: (locations: LeagueLocation[]) => Promise<string>;
  onCreated?: (leagueId: string) => void;
}) {
  const { tx, locale } = useI18n()
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const { profile } = useAccountProfile();
  const ownName = profile?.displayName?.trim() || [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || session?.user?.name?.trim() || "";
  const { hydrateSeasonSnapshot, playerProfiles, seasons, startNewSeason } =
    useSeasonSettings();
  const { createSeasonMatches, hydrateMatches } = useMatchData();
  const {
    deleteLeague,
    getLeagueInviteCode,
    isSuperuser,
    leagues: accessibleLeagues,
    linkCurrentUserToLeaguePlayer,
    userId,
  } = useLeagueAccess();
  const modality = (draftLeague ?? accessibleLeagues.find(league => league.id === activeLeagueId))?.modality ?? "individual";
  const isPairLeague = modality === "fixed_pairs";
  const getSeasonBaseRoundCount = (count: number) => baseRounds(count, modality);
  const getSeasonMaxBalancedLegCount = (count: number) => maxLegs(count, modality);
  const getSeasonMaxRoundCount = (count: number) => maxRounds(count, modality);
  const getSeasonScheduleRoundCount = (input: Parameters<typeof scheduleRounds>[0]) => scheduleRounds({ ...input, modality });
  const isValidSeasonScheduleTarget = (input: Parameters<typeof validTarget>[0]) => validTarget({ ...input, modality });
  const [pairOrder, setPairOrder] = useState<string[]>([]);
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
  const defaultPlayerCount = isPairLeague ? Math.min(32, Math.max(4, Math.ceil((currentPlayers.length || 8) / 2) * 2)) : getNextPlayerCount(currentPlayers.length);
  const [newSeasonName, setNewSeasonName] = useState(
    getDefaultNewSeasonName({ seasonCount: leagueSeasonCount }),
  );
  const leagueLocations = initialLocations;
  const [globalLocations, setGlobalLocations] = useState<LeagueLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/locations", { cache: "no-store" }).then(async response => {
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.locations)) throw new Error("global_locations_lookup_failed");
      if (!cancelled) setGlobalLocations(normalizeLeagueLocations(body.locations));
    }).catch(() => { if (!cancelled) setLocationsError(true); }).finally(() => { if (!cancelled) setLocationsLoading(false); });
    return () => { cancelled = true; };
  }, []);
  const openingLocations = sortLeagueLocationsByTownNameLabel(normalizeLeagueLocations([...globalLocations, ...leagueLocations]));
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
  const [mvpSystem, setMvpSystem] = useState<MvpSystem>("automatic_advanced");
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

  const [creationStep, setCreationStep] = useState<"basic" | "advanced" | "summary" | "league">("basic");
  const [summaryBackStep, setSummaryBackStep] = useState<"basic" | "advanced">("basic");
  const creationHeading = useRef<HTMLDivElement>(null);
  const creationSubmitLock = useRef(false);
  const preparedCalendarMode = useRef<CalendarMode>("balanced");
  function goToCreationStep(step: typeof creationStep, section?: string) {
    if (step === "league" && onEditLeague) { onEditLeague(creationStep === "summary"); return; }
    setError(null);
    setCreationStep(step);
    requestAnimationFrame(() => {
      creationHeading.current?.scrollIntoView({ block: "start" }); creationHeading.current?.focus({ preventScroll: true });
      if (step === "advanced" && section) {
        const index = ["Calendario y duración", "Inicio y visibilidad", "Reglas de juego", "Organización y pagos"].indexOf(section);
        const detail = document.querySelectorAll<HTMLDetailsElement>("[data-season-creation-advanced] > details")[index];
        if (detail) { detail.open = true; detail.scrollIntoView({ block: "start" }); detail.querySelector("summary")?.focus({ preventScroll: true }); }
      }
    });
  }
  const inviteCode = getLeagueInviteCode(activeLeagueId);
  const canLinkSelfPlayer = Boolean(isFirstLeagueSeason && userId && !isSuperuser);

  useEffect(() => {
    if (!draftLeague && !isSupabaseBackedId(activeLeagueId)) return;

    let cancelled = false;
    void fetch(`/api/leagues/${draftLeague ? "new" : activeLeagueId}/player-directory`, { cache: "no-store" })
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
  }, [activeLeagueId, draftLeague]);

  const parsedRoundWindowDays = Number(roundWindowDays);
  const parsedRegistrationFeeAmount = Number(registrationFeeAmount);
  const scheduledStartIso = datetimeLocalToIso(scheduledStartAt);
  const openingRoundIso = datetimeLocalToIso(openingRoundAt);
  const effectiveOpeningRoundIso = scheduledStartIso ?? openingRoundIso;
  const selectedOpeningRoundLocation =
    openingLocations.find((location) => location.id === openingRoundLocationId) ?? null;
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
  const ownSlot = selfPlayerValue ? getNewPlayerIndexFromToken(selfPlayerValue) : null;
  if (canLinkSelfPlayer && ownSlot !== null && ownSlot < newPlayerSlotCount && newPlayerNames[ownSlot] === undefined) visibleNewPlayerNames[ownSlot] = ownName;
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
    .slice(0, 5);
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
  const currentPairValues = [...pairOrder.filter(id => manualPlayerOptions.some(option => option.value === id)), ...manualPlayerOptions.map(option => option.value).filter(id => !pairOrder.includes(id))];
  const fixedPairs: LeaguePair[] = Array.from({ length: playerCount / 2 }, (_, index) => [currentPairValues[index * 2], currentPairValues[index * 2 + 1]]);
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
    isSeasonPlayerCountInRange(playerCount, modality) &&
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
    (!isPairLeague || rosterMode === "self_registration" || (validateLeaguePairs(fixedPairs, manualPlayerOptions.map(option => option.value)) && (calendarMode !== "manual" || areLeagueMatchesPaired(manualCalendarMatches, fixedPairs)))) &&
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

  const leagueIdentity = draftLeague ?? accessibleLeagues.find(league => league.id === activeLeagueId);
  const formatCreationDate = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(value)) : "—";
  const yesNo = (value: boolean) => tx(value ? "Sí" : "No");
  const hasValidPairs = !isPairLeague || rosterMode === "self_registration" || validateLeaguePairs(fixedPairs, manualPlayerOptions.map(option => option.value));
  const validationIssues = [
    !newSeasonName.trim() && ["basic", "Escribe el nombre de la temporada."],
    !hasValidPlayers && ["basic", "Completa todas las plazas de jugadores."],
    !hasValidPairs && ["basic", "Revisa las parejas de la temporada."],
    (!hasValidDuration || !isManualCalendarReady || (isPairLeague && rosterMode === "fixed" && calendarMode === "manual" && !areLeagueMatchesPaired(manualCalendarMatches, fixedPairs))) && ["advanced", "Revisa la duración y los cruces del calendario."],
    !hasValidRegistrationFee && ["advanced", "Introduce una cuota válida o desactívala."],
    !hasValidScheduledStart && ["advanced", "Revisa la fecha de inicio programado."],
    !hasValidOpeningRound && ["advanced", "Completa los datos de la jornada inaugural."],
    organizationBallsAssigned && ballsAssignmentMode === "selected" && (!effectiveBallsAssignmentCustodianRefs.length || (canValidateCustodianCoverage && selectedCustodianCoverage.unassignedMatchIds.length > 0)) && ["advanced", "Revisa los custodios y la cobertura de bolas."],
    roundWindowMode !== "none" && (!seasonStartsAt || !Number.isFinite(parsedRoundWindowDays) || parsedRoundWindowDays < 1) && ["advanced", "Completa la fecha y el plazo de las jornadas."],
  ].filter((issue): issue is string[] => Array.isArray(issue));
  const completedPlayerCount = selectedPlayerIds.length + selectedAppUsers.length + cleanNewPlayerNames.filter(Boolean).length;
  const customized = calendarMode !== "balanced" || effectiveScheduleMode !== "single" || durationMode !== "complete" || calendarVisibilityMode !== "full" || roundWindowMode !== "none" || Boolean(scheduledStartAt) || openingRoundEnabled || !requiresThreeSets || mvpSystem !== "automatic_advanced" || resultConfirmationMode !== "none" || availabilityRecommendationsEnabled || organizationBallsAssigned || hasRegistrationFee;
  const summaryGroups: SeasonCreationSummaryGroup[] = [
    { title: "Liga", target: isFirstLeagueSeason ? "league" : "basic", accent: leagueIdentity?.accentColor ?? DEFAULT_LEAGUE_ACCENT, featured: <div className="mb-3 flex min-w-0 items-center gap-3"><LeagueLogo league={leagueIdentity} size="lg" previewable={false} /><div className="min-w-0 flex-1"><p className="break-words text-lg font-black">{leagueIdentity?.name ?? activeLeagueName}</p><p className="mt-1 text-xs text-neutral-500">{tx(isPairLeague ? "Por parejas fijas" : "Individual de Smash & Lob")}</p><span className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-500"><span role="img" aria-label={leagueIdentity?.accentColor ?? DEFAULT_LEAGUE_ACCENT} className="h-3 w-3 rounded-full" style={{ backgroundColor: leagueIdentity?.accentColor ?? DEFAULT_LEAGUE_ACCENT }} />{tx("Color de liga")}</span></div></div>, rows: [["Descripción", leagueIdentity?.description || "—"], ["Recomendaciones de la liga", leagueIdentity?.recommendations || "—"]] },
    { title: "Participantes", target: "basic", inlineMetrics: true, rows: [["Temporada", newSeasonName], ["Jugadores", playerCount], ["Inscripción", rosterMode === "fixed" ? t.adminSeason.rosterModeFixedTitle : t.adminSeason.rosterModeSelfTitle], ...(isPairLeague ? [["Parejas", playerCount / 2] as [string, number]] : [])] },
    { title: "Calendario y duración", target: "advanced", rows: [["Calendario", calendarMode === "manual" ? t.adminSeason.manualCalendar : tx("Equilibrado")], ["Duración", durationMode === "custom" ? t.adminSeason.durationCustomTitle : effectiveScheduleMode === "single" ? t.adminSeason.singleRoundCalendar : effectiveScheduleMode === "double" ? t.adminSeason.doubleRoundCalendar : `${t.adminSeason.extendedCalendar} ×${longMultiplier}`], ["Jornadas totales", totalSeasonRounds], ["Partidos por jornada", getSeasonMatchesPerRound(playerCount, modality)], ["Descansos por jornada", playerCount - 4 * getSeasonMatchesPerRound(playerCount, modality)]] },
    { title: "Inicio y visibilidad", target: "advanced", rows: [["Inicio", scheduledStartAt ? `${formatCreationDate(scheduledStartIso)} (${tx("Hora de Madrid")})` : tx("Manual")], ["Calendario visible", calendarVisibilityMode === "full" ? t.adminSeason.calendarVisibilityFullTitle : t.adminSeason.calendarVisibilityProgressiveTitle], ["Plazo por jornada", roundWindowMode === "none" ? tx("Sin plazo fijo") : `${roundWindowDays} ${tx("días")}`], ...(roundWindowMode !== "none" ? [["Fecha de comienzo", seasonStartsAt] as [string, string]] : []), ["Jornada inaugural", openingRoundEnabled ? `${formatCreationDate(effectiveOpeningRoundIso)} · ${selectedOpeningRoundLocation ? getLeagueLocationTownNameLabel(selectedOpeningRoundLocation) : "—"}` : tx("No")], ["Fase secretos", secretPhaseEnabled && scheduledStartAt ? `${secretDaysBefore} ${tx("días antes")}` : tx("No")]] },
    { title: "Reglas de juego", target: "advanced", rows: [["Resultado", tx(requiresThreeSets ? "Tres sets completos" : "Al mejor de tres sets")], ["Sistema MVP", tx(mvpSystem === "automatic" ? "Automático" : mvpSystem === "none" ? "Desactivado" : mvpSystem === "automatic_advanced" ? "Automático avanzado" : "Votación")], ["Confirmación de resultados", tx(resultConfirmationMode === "none" ? "Sin confirmación" : resultConfirmationMode === "required" ? "Obligatoria" : "Opcional")], ["Disponibilidad y recomendaciones", yesNo(availabilityRecommendationsEnabled)]] },
    { title: "Organización y pagos", target: "advanced", rows: [["Bolas asignadas por la organización", yesNo(organizationBallsAssigned)], ...(organizationBallsAssigned ? [["Modo de reparto", tx(ballsAssignmentMode === "selected" ? "Custodios seleccionados" : "Por prioridad")], ["Custodios", (ballsAssignmentMode === "selected" ? effectiveBallsAssignmentCustodianRefs : effectiveBallsAssignmentPriority).map(ref => ballsAssignmentPriorityEntries.find(entry => entry.ref === ref)?.name ?? ref).join(" · ")]] as Array<[string, string]> : []), ["Cuota de inscripción por jugador", hasRegistrationFee ? `${registrationFeeAmount} €` : tx("Sin cuota")], ...(hasRegistrationFee ? [["Concepto de la cuota", registrationFeePurpose] as [string, string]] : [])] },
  ];
  const summaryParticipants = rosterMode === "self_registration" ? [] : isPairLeague ? fixedPairs.map(pair => pair.map(id => manualPlayerOptions.find(option => option.value === id)?.label ?? "")) : manualPlayerOptions.map(option => [option.label]);

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
    if (isPairLeague) {
      const values = getDraftPlayerValues({ selectedPlayerIds: selectedIds, playerCount: count });
      const order = [...currentPairValues.filter(id => values.includes(id)), ...values.filter(id => !currentPairValues.includes(id))];
      const pairs: LeaguePair[] = Array.from({ length: count / 2 }, (_, i) => [order[i * 2], order[i * 2 + 1]]);
      const generated = generateBalancedCalendar({ leagueId: "draft", seasonId: "draft", playerIds: values, fixedPairs: pairs, scheduleMode: mode === "double" ? "single" : mode, targetRoundCount: mode === "double" ? getSeasonBaseRoundCount(count) : targetRounds });
      setManualCalendar(Array.from({ length: mode === "double" ? getSeasonBaseRoundCount(count) : targetRounds }, (_, i) => ({ round: i + 1, matches: generated.filter(match => match.round === i + 1).map(match => ({ teamA: match.teamA, teamB: match.teamB })) })));
      return;
    }
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

    if (draftLeague) { onExit?.(); return; }
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
      fixedPairs: isPairLeague && rosterMode === "fixed" ? fixedPairs : undefined,
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

    let mutationLeagueId = activeLeagueId;
    if (onPrepareLeague) {
      try { mutationLeagueId = await onPrepareLeague(leagueLocations); settings.leagueId = mutationLeagueId; }
      catch (cause) { setError(cause instanceof Error ? cause.message : tx("No se han podido guardar los datos de la liga.")); setIsSaving(false); return; }
    }
    if (isSupabaseBackedId(mutationLeagueId)) {
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
          fixedPairs: isPairLeague ? fixedPairs.map(pair => pair.map(id => { const i = getNewPlayerIndexFromToken(id); return i === null ? id : result.newPlayerIds[i]; }) as LeaguePair) : undefined,
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
          fixedPairs: isPairLeague ? fixedPairs.map(pair => pair.map(id => { const i = getNewPlayerIndexFromToken(id); return i === null ? id : result.newPlayerIds[i]; }) as LeaguePair) : undefined,
          playerIds: result.playerIds,
          scheduleMode: effectiveScheduleMode,
          targetRoundCount: totalSeasonRounds,
        });
      }
    }

    try {
      await recordActivityEvent({
        leagueId: mutationLeagueId,
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
    onCreated?.(mutationLeagueId);
    router.replace("/");
  }

  function renderManualPlayer(index: number) {
    const playerName = visibleNewPlayerNames[index];
    if (playerName === undefined) return null;
    return (
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
    );
  }

  if (creationStep === "league" && leagueIdentity) return <LeagueCreationForm initialLeague={leagueIdentity} onComplete={() => goToCreationStep("basic")} onBack={() => goToCreationStep("basic")} />;
  const CreationTitle = "h1";
  return (
    <form onSubmit={event => { event.preventDefault(); if (creationStep !== "summary") { if (validationIssues.some(([step]) => step === "basic")) return; setSummaryBackStep(creationStep === "advanced" ? "advanced" : "basic"); goToCreationStep("summary"); return; } if (creationSubmitLock.current) return; creationSubmitLock.current = true; void handleStartSeason(event).finally(() => { creationSubmitLock.current = false; }); }} noValidate className="compact-page space-y-3" data-season-creation-step={creationStep}>
      <fieldset disabled={isSaving} className="min-w-0 space-y-3 border-0 p-0">
      {draftLeague ? <button type="button" onClick={onExit} className="app-top-back-control flex min-h-11 items-center gap-2"><span aria-hidden="true">←</span>{tx("Competiciones")}</button> : null}
      <div ref={creationHeading} tabIndex={-1} className="app-page-header league-season-header outline-none"><div className="league-creation-progress text-neutral-500">{tx("Liga · Temporada")}</div><CreationTitle className="league-creation-title type-page-title mt-1 text-xl font-black">{tx(creationStep === "summary" ? "Revisar y confirmar" : creationStep === "advanced" ? "Ajustes avanzados" : "Configurar temporada")}</CreationTitle></div>
      <div hidden={creationStep !== "basic"} className="space-y-3" data-season-creation-basic>
      <AppCard>
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

          <label className="block"><span className="text-sm font-bold">{t.adminSeason.rosterModeTitle}</span>
            <select aria-label={t.adminSeason.rosterModeTitle} value={rosterMode} onChange={event => { const next = event.target.value as RosterMode; setRosterMode(next); if (next === "self_registration") { preparedCalendarMode.current = calendarMode; setCalendarMode("balanced"); } else setCalendarMode(preparedCalendarMode.current); setCreationFeedback(null); }} className="league-creation-input mt-2">
              <option value="fixed">{t.adminSeason.rosterModeFixedTitle}</option><option value="self_registration">{t.adminSeason.rosterModeSelfTitle}</option>
            </select><span className="mt-2 block text-xs leading-5 text-neutral-500">{rosterMode === "fixed" ? t.adminSeason.rosterModeFixedDescription : t.adminSeason.rosterModeSelfDescription}</span>
          </label>
          <SeasonPlayerCountSelector
            modality={modality}
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

        <div className="mt-3 flex items-center justify-between rounded-xl bg-neutral-100 px-3 py-2"><span className="text-xs font-semibold text-neutral-500">{tx("Plazas completadas")}</span><span className="text-sm font-bold">{completedPlayerCount}/{playerCount}{isPairLeague ? <span className="ml-2 font-normal text-neutral-500">· {playerCount / 2} {tx("Parejas")}</span> : null}</span></div>
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
                  ) : appPlayerQuery.trim() && filteredAppDirectory.length > 0 ? (
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

        {!isPairLeague && newPlayerSlotCount > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {visibleNewPlayerNames.map((_, index) => renderManualPlayer(index))}
          </div>
        ) : null}
        {isPairLeague ? <div className="mt-4" data-season-pairs>
          <p className="mb-2 text-sm font-bold">{tx("Parejas de la temporada")}</p>
          <p className="mb-3 text-xs text-neutral-500">{tx("Elige los dos jugadores de cada pareja. Se mantendrán juntos durante toda la temporada.")}</p>
          <SeasonPairFields pairs={fixedPairs} options={manualPlayerOptions} onChange={pairs => { setPairOrder(pairs.flat()); setCreationFeedback(null); }} renderPlayerDetails={id => { const index = getNewPlayerIndexFromToken(id); return index === null || index >= visibleNewPlayerNames.length ? null : renderManualPlayer(index); }} />
        </div> : null}
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

</div>
<div hidden={creationStep !== "advanced"} className="space-y-3" data-season-creation-advanced>
<details className="league-creation-details"><summary><span className="league-creation-block-title"><span className="league-creation-range">1–2</span>{tx("Calendario y duración")}</span><span className="text-xs font-normal text-neutral-500">{`${totalSeasonRounds} ${t.adminSeason.roundsShortLabel}`}</span></summary><div className="space-y-3 p-3 pt-0">      <AppCard data-season-calendar-type>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="league-creation-number">
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
              ["balanced", t.adminSeason.balancedCalendar, isPairLeague ? tx("Cada pareja se enfrenta a las demás una vez por vuelta, sin cambiar de compañero.") : t.adminSeason.balancedCalendarDescription],
              ["manual", t.adminSeason.manualCalendar, t.adminSeason.manualCalendarDescription],
            ] as const).map(([mode, title, description]) => {
              const isSelected = calendarMode === mode;
              return (
                <button
                  key={mode}
                  aria-pressed={isSelected}
                  type="button"
                  onClick={() => {
                    setCalendarMode(mode);
                    if (isPairLeague && mode === "manual") refreshManualCalendarFromPlayers({ selectedIds: selectedPlayerIds, count: playerCount });
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
                        {tx("Seleccionado")}
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
              <span aria-hidden="true" className="league-creation-number">
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

        <label className="mt-4 block"><span className="text-xs font-bold text-neutral-500">{tx("Tipo de duración")}</span>
          <select aria-label={tx("Tipo de duración")} value={durationMode} className="league-creation-input mt-1" onChange={event => {
            const mode = event.target.value as SeasonDurationMode;
            setDurationMode(mode);
            refreshManualCalendarFromPlayers({ selectedIds: selectedPlayerIds, count: playerCount, mode: mode === "custom" ? "extended" : scheduleMode, targetRounds: mode === "custom" ? Math.min(Math.max(customRoundCount, 1), maxSeasonRounds) : getSeasonScheduleRoundCount({ playerCount, mode: scheduleMode, longMultiplier }) });
            setCreationFeedback(null);
          }}><option value="complete">{t.adminSeason.durationCompleteTitle}</option><option value="custom">{t.adminSeason.durationCustomTitle}</option></select>
          <span className="mt-2 block text-xs leading-5 text-neutral-500">{durationMode === "complete" ? t.adminSeason.durationCompleteDescription : t.adminSeason.durationCustomDescription}</span>
        </label>
        {durationMode === "complete" ? (
            <div className="season-duration-nested mt-3 space-y-3 rounded-xl border border-neutral-200 p-3" data-season-complete-duration>
              <p className="text-xs font-semibold text-neutral-500">{tx("Dentro de Equilibrada completa")}</p>
              <label className="block"><span className="text-sm font-bold">{tx("Vueltas completas")}</span>
                <select aria-label={tx("Vueltas completas")} value={scheduleMode} className="league-creation-input mt-1" onChange={event => {
                  const mode = event.target.value as SeasonScheduleMode; setScheduleMode(mode);
                  refreshManualCalendarFromPlayers({ selectedIds: selectedPlayerIds, count: playerCount, mode, targetRounds: getSeasonScheduleRoundCount({ playerCount, mode, longMultiplier }) });
                  setCreationFeedback(null);
                }}><option value="single">{t.adminSeason.singleRoundCalendar}</option><option value="double">{t.adminSeason.doubleRoundCalendar}</option><option value="extended">{t.adminSeason.extendedCalendar}</option></select>
                <span className="mt-2 block text-xs leading-5 text-neutral-500">{scheduleMode === "single" ? isPairLeague ? tx("Una jornada contra cada pareja rival.") : t.adminSeason.singleRoundCalendarDescription : scheduleMode === "double" ? isPairLeague ? tx("Dos partidos contra cada pareja rival, con ida y vuelta.") : t.adminSeason.doubleRoundCalendarDescription : isPairLeague ? tx("Repite vueltas completas conservando las mismas parejas.") : t.adminSeason.extendedCalendarDescription}</span>
              </label>
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

      {isPairLeague && rosterMode === "fixed" && calendarMode === "manual" && !areLeagueMatchesPaired(manualCalendarMatches, fixedPairs) ? <p role="status" className="text-sm font-semibold text-amber-700">{tx("Los cruces manuales deben respetar las parejas elegidas. Ajusta los jugadores o restaura el calendario automático.")}</p> : null}
      {rosterMode === "fixed" && calendarMode === "manual" ? (
        <AppCard data-season-manual-calendar>
          <div className="space-y-4">
            <div className="rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700">
              <p className="font-black">
                {totalSeasonRounds} {tx("jornadas ·")}{" "}
                {getSeasonMatchesPerRound(playerCount, modality)}{" "}
                {getSeasonMatchesPerRound(playerCount, modality) === 1 ? tx("partido") : "partidos"}{" "}
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

</div></details>
<details className="league-creation-details"><summary><span className="league-creation-block-title"><span className="league-creation-range">3</span>{tx("Inicio y visibilidad")}</span><span className="text-xs font-normal text-neutral-500">{scheduledStartAt ? tx("Inicio programado") : tx("Inicio manual")}</span></summary><div className="space-y-3 p-3 pt-0">      <AppCard data-season-calendar-visibility>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="league-creation-number">
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



      <AppCard>
        <p className="font-bold">{tx("Inicio programado")}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          {tx("Opcional. Si eliges fecha y hora, la temporada permanecerá en preparación hasta ese momento. Los jugadores podrán unirse, vincularse y completar su perfil, pero no operar partidos ni resultados.")}{" "}</p>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-neutral-700">{tx("Fecha y hora de activación")}</span>
          <input
            type="datetime-local" step={3600} value={scheduledStartAt}
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
              <div><PersonalMatchLocationPicker locations={openingLocations} loading={locationsLoading} selectedLocationId={openingRoundLocationId} manualLocationName="" onSelectedLocationIdChange={value => { setOpeningRoundLocationId(value); setCreationFeedback(null); }} onManualLocationNameChange={() => {}} disabled={isSaving} allowManualLocation={false} label={t.adminSeason.openingRoundLocation} />
              {locationsError ? <p role="alert" className="mt-2 text-xs text-red-600">{tx("No se ha podido cargar el catálogo de ubicaciones. Recarga para volver a intentarlo.")}</p> : null}</div>
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

</div></details>
<details className="league-creation-details"><summary><span className="league-creation-block-title"><span className="league-creation-range">4–7</span>{tx("Reglas de juego")}</span><span className="text-xs font-normal text-neutral-500">{tx(requiresThreeSets ? "Tres sets completos" : "Al mejor de tres sets")}</span></summary><div className="space-y-3 p-3 pt-0">      <AppCard>
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">4</span><p className="text-sm font-black">{t.adminSeason.resultRulesTitle}</p></div>
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
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">5</span><p className="text-sm font-black">{tx("Disponibilidad y recomendaciones")}</p></div>
        <p className="mt-1 text-xs font-semibold text-neutral-500">{tx("Opcional. Si no lo activas, los jugadores se coordinan desde el chat.")}</p>
        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
          <input type="checkbox" checked={availabilityRecommendationsEnabled} onChange={(event) => setAvailabilityRecommendationsEnabled(event.target.checked)} className="mt-1" />
          <span className="text-sm font-semibold">{tx("Usa los horarios habituales de los jugadores para sugerir fechas al programar partidos.")}</span>
        </label>
      </AppCard>

      <AppCard>
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">6</span><p className="text-sm font-black">{tx("Sistema MVP")}</p></div>
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
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">7</span><p className="text-sm font-black">{tx("Confirmación de resultados")}</p></div>
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

</div></details>
<details className="league-creation-details"><summary><span className="league-creation-block-title"><span className="league-creation-range">8–9</span>{tx("Organización y pagos")}</span><span className="text-xs font-normal text-neutral-500">{hasRegistrationFee ? `${registrationFeeAmount} €` : tx("Sin cuota")}</span></summary><div className="space-y-3 p-3 pt-0">      <AppCard>
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">8</span><p className="text-sm font-black">{tx("Bolas asignadas por la organización")}</p></div>
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
        <div className="league-creation-block-title"><span aria-hidden="true" className="league-creation-number">9</span><p className="text-sm font-black">{tx("Inscripción")}</p></div>
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

</div></details>
</div>
{creationStep === "summary" ? <SeasonCreationSummary groups={summaryGroups} participants={summaryParticipants} onEdit={goToCreationStep} /> : null}
      {creationStep === "basic" ? <AppCard><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">{tx(customized ? "Ajustes personalizados" : "Configuración básica")}</h3><button type="button" onClick={() => goToCreationStep("advanced")} className="league-creation-secondary league-creation-advanced">{tx("Personalizar ajustes avanzados")}</button></div><p className="mt-2 text-xs leading-5 text-neutral-500">{totalSeasonRounds} {t.adminSeason.roundsShortLabel} · {tx(calendarMode === "balanced" ? "Calendario automático" : "Calendario manual")} · {tx(calendarVisibilityMode === "full" ? "Calendario completo visible" : "Publicación progresiva")} · {tx(scheduledStartAt ? "Inicio programado" : "Inicio manual")}</p><p className="mt-1 text-xs leading-5 text-neutral-500">{tx(requiresThreeSets ? "Tres sets completos" : "Al mejor de tres sets")} · {tx(mvpSystem === "automatic_advanced" ? "MVP automático avanzado" : mvpSystem === "automatic" ? "MVP automático" : "MVP personalizado")} · {tx(hasRegistrationFee ? "Con cuota" : "Sin cuota")}</p></AppCard> : null}
      {validationIssues.filter(([step]) => creationStep !== "basic" || step === "basic").length ? <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="mb-1 font-bold">{tx("Antes de continuar")}</p>{validationIssues.filter(([step]) => creationStep !== "basic" || step === "basic").map(([step, message]) => <button type="button" className="block py-1 text-left underline underline-offset-2" key={message} onClick={() => { goToCreationStep(step as typeof creationStep); if(step === "advanced") requestAnimationFrame(() => document.querySelectorAll<HTMLDetailsElement>("[data-season-creation-advanced] > details").forEach(detail => detail.open = true)); }}>{tx(message)}</button>)}</div> : null}
      {creationStep === "summary" ? <p className="text-sm text-neutral-500">{scheduledStartAt ? tx("La temporada quedará preparada hasta el inicio programado.") : tx("La temporada quedará preparada. Podrás iniciarla cuando quieras.")}</p> : null}
      </fieldset>
      <div className="league-creation-footer"><button type="button" disabled={isSaving} onClick={() => creationStep === "summary" ? goToCreationStep(summaryBackStep) : creationStep === "advanced" ? goToCreationStep("basic") : isFirstLeagueSeason ? goToCreationStep("league") : onExit ? onExit() : router.back()} className="league-creation-secondary">{tx("Atrás")}</button>
      <button type="submit" disabled={isSaving || (creationStep === "summary" ? !canStartSeason : validationIssues.some(([step]) => step === "basic"))} className="league-creation-primary">{isSaving ? tx("Guardando...") : tx(creationStep === "summary" ? draftLeague ? "Crear liga y primera temporada" : "Confirmar y crear temporada" : "Siguiente paso")}</button></div>

      {isFirstLeagueSeason ? <div className="border-t border-neutral-200 pt-2">
              <button
                type="button"
                onClick={handleCancelLeagueCreation}
                disabled={isSaving}
                className="flex mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 disabled:text-red-300 items-center justify-center text-center"
              >
                {tx("Cancelar creación de la liga")}{" "}</button>
      </div> : null}

      {error ? (
        <p role="alert" className="text-center text-sm font-semibold text-red-600">
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

