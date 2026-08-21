"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LeagueLocationsEditor } from "@/components/league/LeagueLocationsEditor";
import { PlayerAvatar } from "@/components/player/PlayerAvatar";
import { SeasonRosterWaitingRoom } from "@/components/season/SeasonRosterWaitingRoom";
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown";
import { ScheduledStartSettingsPanel } from "@/components/season/ScheduledStartSettingsPanel";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useMatchData } from "@/context/MatchDataProvider";
import {
  RoundWindowMode,
  SeasonRoundSettings,
  useSeasonSettings,
} from "@/context/SeasonSettingsProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import {
  deleteSupabaseRoundMatches,
  deleteSupabaseSeason,
  finishSupabaseActiveSeason,
  startSupabaseExistingSeason,
  startSupabaseSeason,
  replaceSupabaseUpcomingSeasonBalancedCalendar,
  duplicateSupabaseSeason,
  updateSupabaseSeasonRoundOrder,
  updateSupabaseSeasonRoundSettings,
} from "@/lib/supabaseSeasons";
import {
  auditSeasonCalendar,
  generateBalancedCalendar,
  generateManualCalendar,
  getSeasonScheduleRoundCount,
  inferSeasonScheduleMode,
  getNewPlayerIndexFromToken,
  getNewPlayerToken,
  resolveManualCalendarDraft,
  type ManualCalendarMatchDraft,
  type SeasonScheduleMode,
} from "@/lib/calendar";
import { getEmptyCourtBooking } from "@/lib/courtBooking";
import type { MvpSystem } from "@/lib/mvp";
import type { LeagueLocation } from "@/lib/leagueLocations";
import type { ResultConfirmationMode } from "@/lib/resultConfirmations";
import type { RosterMode } from "@/data/fakeData";
import { recordActivityEvent } from "@/lib/activity";
import { showActionFeedback } from "@/lib/actionFeedback";
import { getPublicInviteUrl } from "@/lib/inviteUrls";
import { isSeasonRegistrationSettled } from "@/lib/seasonRegistration";
import { buildSeasonRounds } from "@/lib/rounds";
import { datetimeLocalToIso, formatNextScheduledStartForInput, isScheduledSeasonPending } from "@/lib/seasonScheduling";

const allowedPlayerCounts = [8, 12, 16];

function showSavedFeedback(message: string) {
  showActionFeedback({ tone: "success", message });
}
const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error";
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CalendarMode = "balanced" | "manual";

type SeasonPlayerSummary = {
  id: string;
  displayName: string;
  avatarInitials?: string | null;
  avatarUrl?: string | null;
};

type SeasonAppDirectoryPerson = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

type ManualCalendarTeamKey = "teamA" | "teamB";

type ManualCalendarRoundDraft = {
  round: number;
  matches: {
    teamA: string[];
    teamB: string[];
  }[];
};

type SeasonNavigationLink = {
  href: string;
  label: string;
  danger?: boolean;
  primary?: boolean;
};

type SeasonNavigationGroup = {
  title: string;
  links: SeasonNavigationLink[];
};

function SeasonSectionIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-1 pt-1">
      <p className="type-caption font-black uppercase tracking-[0.2em] text-neutral-600">
        {title}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {description}
      </p>
    </div>
  );
}

function SeasonNavigation({
  isActiveSeason,
  isUpcomingSeason,
  hasCreatedLeagueSeason,
  canAuditCalendar,
  canReopenFinishedSeason,
  registrationEnabled,
}: {
  isActiveSeason: boolean;
  isUpcomingSeason: boolean;
  hasCreatedLeagueSeason: boolean;
  canAuditCalendar: boolean;
  canReopenFinishedSeason: boolean;
  registrationEnabled: boolean;
}) {
  const { tx } = useI18n()
  let groups: SeasonNavigationGroup[];

  if (isActiveSeason) {
    groups = [
      {
        title: "Calendario",
        links: [
          { href: "#jornadas", label: "Jornadas" },
          { href: "#margen-jornadas", label: "Margen" },
          ...(canAuditCalendar
            ? [{ href: "#equilibrio-calendario", label: "Equilibrio" }]
            : []),
        ],
      },
      {
        title: "Reglas",
        links: [
          { href: "#mvp", label: "MVP" },
          { href: "#confirmaciones", label: "Confirmación" },
          { href: "#regla-tres-sets", label: "Tres sets" },
          { href: "#acciones-partido", label: "Acciones" },
        ],
      },
      {
        title: "Personas",
        links: [
          ...(registrationEnabled
            ? [{ href: "#inscripcion", label: "Inscripción" }]
            : []),
          { href: "#jugadores", label: tx("Jugadores") },
        ],
      },
      {
        title: "Estado",
        links: [
          { href: "#cierre", label: "Finalizar" },
          { href: "#zona-sensible", label: "Zona sensible", danger: true },
        ],
      },
    ];
  } else if (isUpcomingSeason) {
    groups = [
      {
        title: "Preparación",
        links: [
          { href: "#inicio-temporada", label: "Comenzar", primary: true },
          { href: "#jugadores", label: tx("Jugadores") },
          ...(registrationEnabled
            ? [{ href: "#inscripcion", label: "Inscripción" }]
            : []),
        ],
      },
      {
        title: "Calendario",
        links: [
          { href: "#jornadas", label: "Jornadas" },
          { href: "#margen-jornadas", label: "Margen" },
          ...(canAuditCalendar
            ? [{ href: "#equilibrio-calendario", label: "Equilibrio" }]
            : []),
        ],
      },
      {
        title: "Reglas",
        links: [
          { href: "#mvp", label: "MVP" },
          { href: "#confirmaciones", label: "Confirmación" },
          { href: "#regla-tres-sets", label: "Tres sets" },
          { href: "#acciones-partido", label: "Acciones" },
        ],
      },
      {
        title: "Control",
        links: [
          { href: "#zona-sensible", label: "Zona sensible", danger: true },
        ],
      },
    ];
  } else if (hasCreatedLeagueSeason) {
    groups = [
      {
        title: tx("Temporada finalizada"),
        links: [
          { href: "#resumen-configuracion", label: "Configuración" },
          { href: "#invitacion", label: "Invitación" },
          { href: "#jugadores", label: tx("Jugadores") },
          ...(canReopenFinishedSeason
            ? [{ href: "#reabrir", label: "Reabrir" }]
            : []),
        ],
      },
      {
        title: "Siguiente ciclo",
        links: [
          { href: "#nueva-temporada", label: "Nueva temporada", primary: true },
        ],
      },
    ];
  } else {
    groups = [
      {
        title: "Primera temporada",
        links: [
          { href: "#nueva-temporada", label: tx("Crear temporada"), primary: true },
        ],
      },
    ];
  }

  return (
    <AppCard className="p-3">
      <p className="text-sm font-black text-neutral-950">
        {tx("Navegación de temporada")}{" "}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Accede directamente al bloque que necesitas sin recorrer toda la pantalla.")}{" "}</p>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div key={tx(group.title)}>
            <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-600">
              {tx(group.title)}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {group.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-center text-xs font-black ${
                    link.danger
                      ? "bg-red-50 text-red-700"
                      : link.primary
                        ? "bg-neutral-950 text-white"
                        : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {tx(link.label)}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function getSuggestedSeasonName(name: string) {
  const match = name.match(/^(.*?)(\d+)\s*$/);
  if (!match) return `${name} 2`;
  return `${match[1].trim()} ${Number(match[2]) + 1}`;
}

function getTotalRoundCount(playerCount: number) {
  return Math.max(playerCount - 1, 1);
}

function getMatchesPerRound(playerCount: number) {
  return Math.max(playerCount / 4, 1);
}

function getManualCalendarDraftRoundCount({
  playerCount,
  scheduleMode,
}: {
  playerCount: number;
  scheduleMode: SeasonScheduleMode;
}) {
  return scheduleMode === "extended"
    ? getSeasonScheduleRoundCount({ playerCount, mode: scheduleMode })
    : getTotalRoundCount(playerCount);
}

function createEmptyManualCalendar({
  playerCount,
  scheduleMode,
}: {
  playerCount: number;
  scheduleMode: SeasonScheduleMode;
}): ManualCalendarRoundDraft[] {
  return Array.from(
    { length: getManualCalendarDraftRoundCount({ playerCount, scheduleMode }) },
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
): ManualCalendarRoundDraft[] {
  const balancedMatches = generateBalancedCalendar({
    leagueId: "manual-draft",
    seasonId: "manual-draft-season",
    playerIds: playerValues,
    scheduleMode: scheduleMode === "extended" ? "extended" : "single",
  });

  if (balancedMatches.length === 0) {
    return createEmptyManualCalendar({ playerCount: playerValues.length, scheduleMode });
  }

  return Array.from(
    {
      length: getManualCalendarDraftRoundCount({
        playerCount: playerValues.length,
        scheduleMode,
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

function moveRoundOrderItem({
  roundOrder,
  index,
  direction,
}: {
  roundOrder: number[];
  index: number;
  direction: -1 | 1;
}) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= roundOrder.length) {
    return roundOrder;
  }

  const nextRoundOrder = [...roundOrder];
  const currentRound = nextRoundOrder[index];
  nextRoundOrder[index] = nextRoundOrder[nextIndex];
  nextRoundOrder[nextIndex] = currentRound;

  return nextRoundOrder;
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
  return (
    allowedPlayerCounts.find((count) => count >= Math.max(currentCount, 8)) ??
    allowedPlayerCounts[allowedPlayerCounts.length - 1]
  );
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

function getFinishedSeasonScheduleLabel({
  totalRounds,
  playerCount,
  matches,
}: {
  totalRounds: number;
  playerCount: number;
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
}) {
  const baseRoundCount = Math.max(playerCount - 1, 1);

  if (totalRounds === baseRoundCount) {
    return "Vuelta única";
  }

  if (totalRounds !== baseRoundCount * 2) {
    return `${totalRounds} jornadas`;
  }

  function getTeamKey(playerIds: string[]) {
    return [...playerIds].sort().join(":");
  }

  function getRoundSignature(round: number) {
    return matches
      .filter((match) => match.round === round)
      .map((match) =>
        [getTeamKey(match.teamA), getTeamKey(match.teamB)].sort().join("|")
      )
      .sort()
      .join(";");
  }

  const signatureCounts = new Map<string, number>();

  for (let round = 1; round <= totalRounds; round += 1) {
    const signature = getRoundSignature(round);

    if (signature) {
      signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
    }
  }

  const repeatsFirstLeg =
    signatureCounts.size === baseRoundCount &&
    Array.from(signatureCounts.values()).every((count) => count === 2);

  return repeatsFirstLeg ? "Doble vuelta" : "Temporada larga";
}

function SeasonConfigurationSummary({
  activeSeason,
  roundSettings,
  matches,
  playerCount,
}: {
  activeSeason: {
    name: string;
    status: "upcoming" | "active" | "finished";
    totalRounds: number;
  };
  roundSettings: SeasonRoundSettings;
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
  playerCount: number;
}) {
  const { tx } = useI18n()
  const calendarValue = getFinishedSeasonScheduleLabel({
    totalRounds: activeSeason.totalRounds,
    playerCount,
    matches,
  });
  const confirmationValue =
    resultConfirmationOptions.find(
      (option) => option.value === roundSettings.resultConfirmationMode,
    )?.title ?? "Sin confirmaciones";
  const mvpValue =
    mvpSystemOptions.find((option) => option.value === roundSettings.mvpSystem)
      ?.title ?? "Sin sistema MVP";
  const statusValue =
    activeSeason.status === "active"
      ? "En juego"
      : activeSeason.status === "upcoming"
        ? tx("Próxima")
        : tx("Finalizada");
  const rosterValue =
    roundSettings.rosterMode === "self_registration"
      ? tx(`${playerCount}/${roundSettings.playerCapacity ?? "—"} · Autoinscripción`)
      : tx(`${playerCount} jugadores · Plantilla fija`);
  const roundWindowValue =
    roundSettings.roundWindowMode === "fixed-days"
      ? tx(`${roundSettings.roundWindowDays ?? "—"} días por jornada`)
      : "Sin margen fijo";
  const registrationValue = roundSettings.registrationFee.enabled
    ? tx(`${roundSettings.registrationFee.amount} € por jugador`)
    : "Sin cuota";
  const items = [
    ["Estado", statusValue],
    ["Plantilla", rosterValue],
    ["Calendario", tx(`${calendarValue} · ${activeSeason.totalRounds} jornadas`)],
    [
      "Resultado",
      roundSettings.requiresThreeSets
        ? "3 sets completos siempre"
        : "Sets según resultado",
    ],
    ["Confirmación", confirmationValue],
    ["MVP", mvpValue],
    ["Margen", roundWindowValue],
    [
      "Horarios",
      roundSettings.availabilityRecommendationsEnabled
        ? "Disponibilidad y recomendaciones"
        : "Coordinación por chat",
    ],
    ["Inscripción", registrationValue],
  ];

  return (
    <AppCard className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{tx("Resumen de configuración")}</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
            {activeSeason.name}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 type-caption font-black text-neutral-600">
          {tx(statusValue)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.slice(1).map(([title, value]) => (
          <div key={title} className="min-w-0 rounded-xl bg-neutral-100 px-2.5 py-2">
            <p className="type-caption font-black uppercase tracking-[0.12em] text-neutral-600">
              {tx(title)}
            </p>
            <p className="mt-0.5 type-caption font-black leading-4 text-neutral-800">
              {tx(value)}
            </p>
          </div>
        ))}
      </div>
    </AppCard>
  );
}
function RequiresThreeSetsSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [requiresThreeSets, setRequiresThreeSets] = useState(
    roundSettings.requiresThreeSets,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChanges = requiresThreeSets !== roundSettings.requiresThreeSets;

  async function save() {
    if (isSaving || !hasChanges) return;

    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      requiresThreeSets,
    };

    setIsSaving(true);
    setError(null);

    try {
      await updateSupabaseSeasonRoundSettings(nextSettings);
      updateSeasonRoundSettings(nextSettings);
      showSavedFeedback("Regla de resultados actualizada.");
    } catch (caughtError) {
      recordSupabaseError("update-three-set-rule", caughtError);
      setError("No se ha podido guardar la regla de los tres sets.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Regla de los tres sets")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Decide si todos los partidos deben completar los tres sets, aunque una pareja gane los dos primeros.")}{" "}</p>

      <label className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
        <input
          type="checkbox"
          checked={requiresThreeSets}
          onChange={(event) => {
            setRequiresThreeSets(event.target.checked);
            setError(null);
          }}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-black">{tx("Jugar 3 sets completos siempre")}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
            {tx("Desactívalo para permitir cerrar el partido cuando una pareja ya haya ganado los sets necesarios.")}{" "}</span>
        </span>
      </label>

      <button
        type="button"
        onClick={save}
        disabled={!hasChanges || isSaving}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
      >
        {isSaving ? "Guardando..." : tx("Guardar regla")}
      </button>
      {error ? <p className="mt-2 text-center text-xs font-bold text-red-600">{tx(error)}</p> : null}
    </AppCard>
  );
}
function RoundWindowSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { t, tx } = useI18n();
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [selectedMode, setSelectedMode] = useState<RoundWindowMode>(
    roundSettings.roundWindowMode,
  );
  const [seasonStartsAt, setSeasonStartsAt] = useState(
    roundSettings.seasonStartsAt ?? "",
  );
  const [roundWindowDays, setRoundWindowDays] = useState(
    roundSettings.roundWindowDays
      ? String(roundSettings.roundWindowDays)
      : "15",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsedRoundWindowDays = Number(roundWindowDays);
  const isFixedDaysMode = selectedMode === "fixed-days";
  const normalizedDays =
    Number.isInteger(parsedRoundWindowDays) && parsedRoundWindowDays >= 1
      ? parsedRoundWindowDays
      : null;
  const isValid =
    selectedMode === "none" ||
    (seasonStartsAt.length > 0 && normalizedDays !== null);
  const hasChanges =
    selectedMode !== roundSettings.roundWindowMode ||
    (selectedMode === "fixed-days" &&
      (seasonStartsAt !== (roundSettings.seasonStartsAt ?? "") ||
        normalizedDays !== roundSettings.roundWindowDays)) ||
    (selectedMode === "none" &&
      (roundSettings.seasonStartsAt !== null ||
        roundSettings.roundWindowDays !== null));

  async function save() {
    if (isSaving || !isValid || !hasChanges) {
      return;
    }

    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      roundWindowMode: selectedMode,
      seasonStartsAt: isFixedDaysMode ? seasonStartsAt : null,
      roundWindowDays: isFixedDaysMode ? normalizedDays : null,
    };

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(roundSettings.seasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-season-round-window", supabaseError);
        setError(t.adminSeason.roundWindowSaveError);
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback(t.adminSeason.roundWindowSaved);
    setIsSaving(false);
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.roundWindowTitle}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {t.adminSeason.roundWindowEditDescription}
      </p>

      <div className="mt-3 space-y-2">
        {(["none", "fixed-days"] as RoundWindowMode[]).map((mode) => (
          <label
            key={mode}
            className={`flex items-start gap-3 rounded-2xl border p-3 transition ${
              selectedMode === mode
                ? "border-neutral-950 bg-neutral-100"
                : "border-neutral-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="seasonRoundWindowMode"
              value={mode}
              checked={selectedMode === mode}
              onChange={() => {
                setSelectedMode(mode);
                setError(null);
              }}
              className="mt-1"
            />

            <span className="min-w-0">
              <span className="block text-sm font-black text-neutral-950">
                {mode === "none"
                  ? t.adminSeason.noWindowTitle
                  : t.adminSeason.fixedDaysTitle}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-600">
                {mode === "none"
                  ? t.adminSeason.noWindowDescription
                  : t.adminSeason.fixedDaysDescription}
              </span>
            </span>
          </label>
        ))}
      </div>

      {isFixedDaysMode ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
              {t.adminSeason.seasonStartDate}
            </span>
            <input
              type="date"
              value={seasonStartsAt}
              onChange={(event) => {
                setSeasonStartsAt(event.target.value);
                setError(null);
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
              {t.adminSeason.daysPerRound}
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={roundWindowDays}
              onChange={(event) => {
                setRoundWindowDays(event.target.value);
                setError(null);
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>
        </div>
      ) : null}

      <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2.5 text-xs font-semibold leading-5 text-neutral-600">
        {t.adminSeason.roundWindowRecalculationNotice}
      </p>

      {!isValid ? (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {t.adminSeason.roundWindowInvalid}
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={isSaving || !isValid || !hasChanges}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500 items-center justify-center text-center"
      >
        {isSaving
          ? t.adminSeason.roundWindowSaving
          : t.adminSeason.roundWindowSave}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function ResultConfirmationSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [selectedMode, setSelectedMode] = useState<ResultConfirmationMode>(
    roundSettings.resultConfirmationMode,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (isSaving) {
      return;
    }

    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      resultConfirmationMode: selectedMode,
    };

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(roundSettings.seasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-season-result-confirmations", supabaseError);
        setError(tx("No se ha podido guardar la configuración de confirmaciones en Supabase."));
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback(tx("Confirmaciones de resultado actualizadas."));
    setIsSaving(false);
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Confirmación de resultados")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Decide si los jugadores deben validar los resultados registrados.")}{" "}</p>

      <ResultConfirmationOptions
        value={selectedMode}
        onChange={(value) => {
          setSelectedMode(value);
        }}
      />

      <button
        type="button"
        onClick={save}
        disabled={
          isSaving || selectedMode === roundSettings.resultConfirmationMode
        }
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500 items-center justify-center text-center"
      >
        {isSaving ? tx("Guardando...") : tx("Guardar confirmaciones")}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function MvpSystemSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [selectedSystem, setSelectedSystem] = useState<MvpSystem>(
    roundSettings.mvpSystem,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (isSaving) {
      return;
    }

    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      mvpSystem: selectedSystem,
    };

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(roundSettings.seasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-season-mvp-system", supabaseError);
        setError(tx("No se ha podido guardar el sistema MVP en Supabase. Revisa smash-lob-last-supabase-error."));
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback(tx("Sistema MVP actualizado."));
    setIsSaving(false);
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Sistema MVP")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Puedes cambiarlo antes o durante la temporada. Los votos solo se usan cuando está seleccionado el modo por votación.")}{" "}</p>

      <MvpSystemOptions
        value={selectedSystem}
        onChange={(value) => {
          setSelectedSystem(value);
        }}
      />

      <button
        type="button"
        onClick={save}
        disabled={isSaving || selectedSystem === roundSettings.mvpSystem}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500 items-center justify-center text-center"
      >
        {isSaving ? tx("Guardando...") : tx("Guardar sistema MVP")}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function RegistrationFeeSettingsPanel({ activeLeagueId, roundSettings, canToggleEnabled }: { activeLeagueId: string; roundSettings: SeasonRoundSettings; canToggleEnabled: boolean }) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [enabled, setEnabled] = useState(roundSettings.registrationFee.enabled);
  const [amount, setAmount] = useState(roundSettings.registrationFee.amount > 0 ? String(roundSettings.registrationFee.amount) : "10");
  const [purpose, setPurpose] = useState(roundSettings.registrationFee.purpose);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsedAmount = Number(amount);
  const normalizedAmount = Number.isFinite(parsedAmount) ? Math.round(parsedAmount * 100) / 100 : 0;
  const hasValidAmount = !enabled || normalizedAmount > 0;
  const nextAmount = enabled ? normalizedAmount : roundSettings.registrationFee.amount;
  const nextPurpose = enabled ? purpose.trim() : roundSettings.registrationFee.purpose;
  const hasChanges = (canToggleEnabled && enabled !== roundSettings.registrationFee.enabled) || (enabled && (nextAmount !== roundSettings.registrationFee.amount || nextPurpose !== roundSettings.registrationFee.purpose));

  async function save() {
    if (isSaving || !hasChanges || !hasValidAmount) return;
    const nextSettings: SeasonRoundSettings = {
      ...roundSettings, leagueId: activeLeagueId,
      registrationFee: { ...roundSettings.registrationFee, enabled: canToggleEnabled ? enabled : roundSettings.registrationFee.enabled, amount: nextAmount, purpose: nextPurpose },
    };
    setIsSaving(true); setError(null);
    try {
      if (isSupabaseBackedId(roundSettings.seasonId)) await updateSupabaseSeasonRoundSettings(nextSettings);
      updateSeasonRoundSettings(nextSettings);
      showSavedFeedback(canToggleEnabled ? tx("Inscripción de temporada actualizada.") : tx("Importe de inscripción actualizado."));
    } catch { setError(tx("No se ha podido guardar la inscripción de temporada.")); }
    finally { setIsSaving(false); }
  }

  return <AppCard>
    <p className="font-bold">{tx("Inscripción de temporada")}</p>
    <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">{canToggleEnabled ? tx("Activa o desactiva la inscripción mientras la temporada no haya comenzado.") : tx("La inscripción queda fijada al comenzar la temporada; solo puedes ajustar sus datos.")}</p>
    {canToggleEnabled ? <label className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
      <input type="checkbox" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); setError(null); }} className="mt-1" />
      <span><span className="block text-sm font-black text-neutral-950">{tx("Cobrar inscripción esta temporada")}</span><span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">{tx("Puedes cambiar esta decisión hasta que la temporada empiece.")}</span></span>
    </label> : null}
    {enabled ? <div className="mt-3 space-y-3">
      <label className="block"><span className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Precio por jugador")}</span><div className="mt-2 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
        <input type="number" min={0.5} step="0.5" value={amount} onChange={(event) => { setAmount(event.target.value); setError(null); }} className="min-w-0 flex-1 bg-transparent text-sm font-black text-neutral-950 outline-none" /><span className="text-sm font-black text-neutral-500">€</span>
      </div></label>
      <label className="block"><span className="text-xs font-black uppercase tracking-wide text-neutral-500">{tx("Concepto")}</span><input type="text" value={purpose} onChange={(event) => { setPurpose(event.target.value); setError(null); }} placeholder={tx("Inscripción Temporada 1")} className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-950 outline-none" /></label>
    </div> : <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2.5 text-xs font-semibold leading-5 text-neutral-600">{tx("Esta temporada no cobrará inscripción.")}</p>}
    {enabled && !hasValidAmount ? <p className="mt-2 text-xs font-semibold text-red-600">{tx("Introduce un importe mayor que 0.")}</p> : null}
    {roundSettings.registrationFee.enabled ? <Link href="/admin/season/finances" data-tour="season-admin-finances" className="mt-3 flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950">{tx("Economía de temporada")}</Link> : null}
    <button type="button" onClick={save} disabled={isSaving || !hasChanges || !hasValidAmount} className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500">{isSaving ? tx("Guardando...") : tx("Guardar inscripción")}</button>
    {error ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{tx(error)}</p> : null}
  </AppCard>;
}

function BalancedCalendarAuditPanel({
  activeLeagueId,
  activeSeason,
  playerIds,
  matches,
}: {
  activeLeagueId: string;
  activeSeason: {
    id: string;
    totalRounds: number;
    status?: "upcoming" | "active" | "finished";
  };
  playerIds: string[];
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
}) {
  const { t, tx } = useI18n();
  const { replaceSeasonMatches } = useMatchData();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seasonMatches = useMemo(
    () => matches.filter((match) => match.seasonId === activeSeason.id),
    [activeSeason.id, matches],
  );
  const scheduleMode = useMemo(
    () =>
      inferSeasonScheduleMode({
        matches: seasonMatches,
        playerCount: playerIds.length,
        totalRounds: activeSeason.totalRounds,
      }),
    [activeSeason.totalRounds, playerIds.length, seasonMatches],
  );
  const audit = useMemo(
    () =>
      scheduleMode
        ? auditSeasonCalendar({
            matches: seasonMatches,
            playerIds,
            mode: scheduleMode,
          })
        : null,
    [playerIds, scheduleMode, seasonMatches],
  );
  const canAudit =
    Boolean(scheduleMode) &&
    [8, 12, 16].includes(playerIds.length) &&
    seasonMatches.length > 0;
  const canRepair = activeSeason.status === "upcoming";

  if (!canAudit || !audit || !scheduleMode) {
    return null;
  }

  const calendarAudit = audit;
  const modeLabel =
    scheduleMode === "single"
      ? t.adminSeason.singleRoundCalendar
      : scheduleMode === "double"
        ? t.adminSeason.doubleRoundCalendar
        : t.adminSeason.extendedCalendar;
  const checkRows = [
    {
      label: t.adminSeason.calendarAuditMatchStructure,
      ok: calendarAudit.invalidMatchCount === 0,
      detail:
        calendarAudit.invalidMatchCount === 0
          ? t.adminSeason.calendarAuditAllCorrect
          : `${calendarAudit.invalidMatchCount} ${t.adminSeason.calendarAuditIncorrectMatches}`,
    },
    {
      label: t.adminSeason.calendarAuditRoundStructure,
      ok:
        calendarAudit.invalidRoundMatchCount === 0 &&
        calendarAudit.invalidRoundAppearanceCount === 0,
      detail:
        calendarAudit.invalidRoundMatchCount === 0 &&
        calendarAudit.invalidRoundAppearanceCount === 0
          ? t.adminSeason.calendarAuditAllCorrect
          : t.adminSeason.calendarAuditRoundStructureError
              .replace(
                "{rounds}",
                String(calendarAudit.invalidRoundMatchCount),
              )
              .replace(
                "{appearances}",
                String(calendarAudit.invalidRoundAppearanceCount),
              ),
    },
    {
      label: t.adminSeason.calendarAuditPartners,
      ok: calendarAudit.invalidTeammatePairCount === 0,
      detail:
        calendarAudit.invalidTeammatePairCount === 0
          ? t.adminSeason.calendarAuditExpectedTimes.replace(
              "{count}",
              String(calendarAudit.expectedTeammateCount),
            )
          : `${calendarAudit.invalidTeammatePairCount} ${t.adminSeason.calendarAuditIncorrect}`,
    },
    {
      label: t.adminSeason.calendarAuditOpponents,
      ok: calendarAudit.invalidOpponentPairCount === 0,
      detail:
        calendarAudit.invalidOpponentPairCount === 0
          ? t.adminSeason.calendarAuditExpectedTimes.replace(
              "{count}",
              String(calendarAudit.expectedOpponentCount),
            )
          : `${calendarAudit.invalidOpponentPairCount} ${t.adminSeason.calendarAuditIncorrect}`,
    },
    {
      label: t.adminSeason.calendarAuditFirstLeg,
      ok: calendarAudit.firstLegBalanced,
      detail: calendarAudit.firstLegBalanced
        ? t.adminSeason.calendarAuditBalancedLeg
        : t.adminSeason.calendarAuditUnbalancedLeg,
    },
    ...(scheduleMode === "single"
      ? []
      : [
          {
            label: t.adminSeason.calendarAuditSecondLeg,
            ok: calendarAudit.secondLegBalanced === true,
            detail:
              calendarAudit.secondLegBalanced === true
                ? t.adminSeason.calendarAuditBalancedLeg
                : t.adminSeason.calendarAuditUnbalancedLeg,
          },
          {
            label:
              scheduleMode === "double"
                ? t.adminSeason.calendarAuditExactSecondLeg
                : t.adminSeason.calendarAuditRemixedSecondLeg,
            ok: calendarAudit.modeStructureCorrect,
            detail:
              scheduleMode === "double"
                ? t.adminSeason.calendarAuditRepeatedRounds
                    .replace(
                      "{count}",
                      String(calendarAudit.repeatedRoundCount),
                    )
                    .replace(
                      "{total}",
                      String(calendarAudit.baseRoundCount),
                    )
                : t.adminSeason.calendarAuditRepeatedMatches.replace(
                    "{count}",
                    String(calendarAudit.repeatedMatchCount),
                  ),
          },
        ]),
  ];

  async function repairCalendar() {
    if (isSaving || calendarAudit.isPerfectlyBalanced || !canRepair) {
      return;
    }

    const confirmed = window.confirm(t.adminSeason.repairCalendarConfirm);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const repairedMatches = isSupabaseBackedId(activeSeason.id)
        ? await replaceSupabaseUpcomingSeasonBalancedCalendar({
            leagueId: activeLeagueId,
            seasonId: activeSeason.id,
            playerIds,
            scheduleMode: scheduleMode ?? "single",
          })
        : generateBalancedCalendar({
            leagueId: activeLeagueId,
            seasonId: activeSeason.id,
            playerIds,
            scheduleMode: scheduleMode ?? "single",
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

      replaceSeasonMatches(activeSeason.id, repairedMatches);
      showSavedFeedback(t.adminSeason.repairCalendarSuccess);
    } catch (repairError) {
      recordSupabaseError("repair-balanced-calendar", repairError);
      setError(
        repairError instanceof Error
          ? repairError.message
          : t.adminSeason.repairCalendarError,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold">{t.adminSeason.calendarAuditTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            {t.adminSeason.calendarAuditDescription}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 type-caption font-black ${
            calendarAudit.isPerfectlyBalanced
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {calendarAudit.isPerfectlyBalanced
            ? t.adminSeason.calendarAuditOk
            : t.adminSeason.calendarAuditNeedsRepair}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
          <p className="type-caption font-black uppercase tracking-wide text-neutral-600">
            {t.adminSeason.calendarAuditMode}
          </p>
          <p className="mt-1 text-sm font-black text-neutral-950">
            {modeLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
          <p className="type-caption font-black uppercase tracking-wide text-neutral-600">
            {t.adminSeason.calendarAuditPlayers}
          </p>
          <p className="mt-1 text-sm font-black text-neutral-950">
            {calendarAudit.playerCount}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
          <p className="type-caption font-black uppercase tracking-wide text-neutral-600">
            {t.adminSeason.calendarAuditRounds}
          </p>
          <p className="mt-1 text-sm font-black text-neutral-950">
            {calendarAudit.roundCount}/{calendarAudit.expectedRoundCount}
          </p>
        </div>
        <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
          <p className="type-caption font-black uppercase tracking-wide text-neutral-600">
            {t.adminSeason.calendarAuditMatches}
          </p>
          <p className="mt-1 text-sm font-black text-neutral-950">
            {calendarAudit.matchCount}/{calendarAudit.expectedMatchCount}
          </p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white px-3">
        {checkRows.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs font-black text-neutral-900">
                {check.label}
              </p>
              <p className="mt-0.5 type-caption font-semibold leading-4 text-neutral-500">
                {check.detail}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 type-caption font-black ${
                check.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {check.ok
                ? t.adminSeason.calendarAuditOk
                : t.adminSeason.calendarAuditNeedsRepair}
            </span>
          </div>
        ))}
      </div>

      {!calendarAudit.isPerfectlyBalanced && canRepair ? (
        <>
          <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-5 text-amber-900">
            {t.adminSeason.calendarAuditRepairHelp}
          </p>
          <button
            type="button"
            onClick={repairCalendar}
            disabled={isSaving}
            className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
          >
            {isSaving
              ? t.adminSeason.repairingCalendar
              : t.adminSeason.repairCalendar}
          </button>
        </>
      ) : null}
      {error ? (
        <p className="mt-3 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function RoundManagementPanel({
  activeLeagueId,
  activeSeason,
  roundSettings,
  matches,
}: {
  activeLeagueId: string;
  activeSeason: {
    id: string;
    leagueId: string;
    totalRounds: number;
    status?: "upcoming" | "active" | "finished";
  };
  roundSettings: SeasonRoundSettings;
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
}) {
  const { tx } = useI18n()
  const { reorderSeasonRounds } = useMatchData();
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const isUpcomingSeason = activeSeason.status === "upcoming";
  const rounds = buildSeasonRounds({
    season: activeSeason,
    settings: roundSettings,
    matches,
  });
  const activeRound = rounds.find((round) => round.status === "active");
  const firstOverdueRound = rounds.find(
    (round) => round.status === "overdue",
  );
  const firstUpcomingRound = rounds.find(
    (round) => round.status === "upcoming",
  );
  const defaultSelectedRound =
    activeRound?.round ??
    roundSettings.manualActiveRound ??
    firstOverdueRound?.round ??
    firstUpcomingRound?.round ??
    1;
  const [selectedRound, setSelectedRound] = useState(defaultSelectedRound);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRoundOrder, setIsSavingRoundOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultRoundOrder = useMemo(
    () =>
      Array.from(
        { length: activeSeason.totalRounds },
        (_, index) => index + 1,
      ),
    [activeSeason.totalRounds],
  );
  const [roundOrder, setRoundOrder] = useState(defaultRoundOrder);
  const hasRoundOrderChanges = roundOrder.some(
    (round, index) => round !== index + 1,
  );

  async function persistRoundSettings(nextSettings: SeasonRoundSettings) {
    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeason.id)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-round-management", supabaseError);
        setError(
          "No se ha podido guardar la gestión de jornadas en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback(tx("Gestión de jornadas actualizada."));
    setIsSaving(false);
  }

  function getBaseSettings() {
    return {
      ...roundSettings,
      leagueId: activeLeagueId,
      seasonId: activeSeason.id,
      manualCompletedRounds: roundSettings.manualCompletedRounds ?? [],
    };
  }

  function activateRound(round: number) {
    const nextCompletedRounds = (
      roundSettings.manualCompletedRounds ?? []
    ).filter((completedRound) => completedRound !== round);

    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: round,
      manualCompletedRounds: nextCompletedRounds,
    });
  }

  function finishRound(round: number) {
    const nextCompletedRounds = Array.from(
      new Set([...(roundSettings.manualCompletedRounds ?? []), round]),
    ).sort((firstRound, secondRound) => firstRound - secondRound);
    const nextOpenRound = Array.from(
      { length: activeSeason.totalRounds },
      (_, index) => index + 1,
    ).find((candidateRound) => !nextCompletedRounds.includes(candidateRound));

    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: nextOpenRound ?? null,
      manualCompletedRounds: nextCompletedRounds,
    });
  }

  function reopenRound(round: number) {
    return persistRoundSettings({
      ...getBaseSettings(),
      manualActiveRound: round,
      manualCompletedRounds: (roundSettings.manualCompletedRounds ?? []).filter(
        (completedRound) => completedRound !== round,
      ),
    });
  }

  async function handleSaveRoundOrder() {
    if (isSavingRoundOrder || !hasRoundOrderChanges) {
      return;
    }

    setIsSavingRoundOrder(true);
    setError(null);

    const nextRoundByCurrentRound = new Map(
      roundOrder.map((round, index) => [round, index + 1]),
    );
    const reorderedSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      seasonId: activeSeason.id,
      manualActiveRound:
        typeof roundSettings.manualActiveRound === "number"
          ? (nextRoundByCurrentRound.get(roundSettings.manualActiveRound) ?? null)
          : null,
      manualCompletedRounds: (roundSettings.manualCompletedRounds ?? [])
        .map((round) => nextRoundByCurrentRound.get(round))
        .filter((round): round is number => typeof round === "number")
        .sort((firstRound, secondRound) => firstRound - secondRound),
    };

    if (isSupabaseBackedId(activeSeason.id)) {
      try {
        await updateSupabaseSeasonRoundOrder({
          leagueId: activeLeagueId,
          seasonId: activeSeason.id,
          roundOrder,
        });
        await updateSupabaseSeasonRoundSettings(reorderedSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-round-order", supabaseError);
        setError(
          "No se ha podido guardar el orden de jornadas en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSavingRoundOrder(false);
        return;
      }
    }

    reorderSeasonRounds({
      seasonId: activeSeason.id,
      roundOrder,
    });
    updateSeasonRoundSettings(reorderedSettings);
    setSelectedRound((currentRound) =>
      nextRoundByCurrentRound.get(currentRound) ?? currentRound,
    );
    setRoundOrder(defaultRoundOrder);
    showSavedFeedback(tx("Gestión y orden de jornadas actualizados."));
    setIsSavingRoundOrder(false);
  }

  const canEditRoundOrder = activeSeason.totalRounds > 1;
  const previousRound = Math.max((activeRound?.round ?? selectedRound) - 1, 1);
  const nextRound = Math.min(
    (activeRound?.round ?? selectedRound) + 1,
    activeSeason.totalRounds,
  );

  return (
    <AppCard>
      <p className="font-bold">{tx("Gestión y orden de jornadas")}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {isUpcomingSeason
          ? tx("Reordena el calendario y deja preparada la jornada inicial antes de comenzar la temporada.")
          : tx("Control manual para activar, finalizar, reabrir o mover la jornada activa cuando haga falta.")}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {rounds.map((round) => {
          const isInitialRound =
            isUpcomingSeason &&
            roundSettings.manualActiveRound === round.round;

          return (
            <button
              key={round.id}
              type="button"
              onClick={() => setSelectedRound(round.round)}
              className={`rounded-2xl px-2 py-3 text-xs font-black ring-1 transition ${
                selectedRound === round.round
                  ? "bg-neutral-950 text-white ring-neutral-950"
                  : isInitialRound || round.status === "active"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                    : round.status === "completed"
                      ? "bg-neutral-950 text-white ring-neutral-950"
                      : round.status === "overdue"
                        ? "bg-amber-50 text-amber-800 ring-amber-200/80"
                        : "bg-sky-50 text-sky-800 ring-sky-200/80"
              }`}
            >
              <span className="block">{tx("J")}{round.round}</span>
              <span className="mt-1 block type-caption uppercase tracking-wide opacity-70">
                {isInitialRound
                  ? "Inicial"
                  : round.status === "active"
                    ? "Activa"
                    : round.status === "completed"
                      ? tx("Finalizada")
                      : round.status === "overdue"
                        ? tx("Fuera de plazo")
                        : tx("Próxima")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl bg-neutral-100 p-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5">
          <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
            {tx("Jornada seleccionada")}{" "}</span>
          <span className="text-sm font-black text-neutral-950">
            {tx("Jornada")}{" "}{selectedRound}
          </span>
        </div>

        {isUpcomingSeason ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => activateRound(selectedRound)}
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-neutral-950 px-3 py-3 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
              >
                {tx("Empezar por esta")}{" "}</button>
              <button
                type="button"
                onClick={() =>
                  persistRoundSettings({
                    ...getBaseSettings(),
                    manualActiveRound: null,
                  })
                }
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-white px-3 py-3 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {tx("Orden automático")}{" "}</button>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-neutral-500">
              {tx("Finalizar y reabrir jornadas estará disponible cuando comience la temporada.")}{" "}</p>
          </>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => activateRound(selectedRound)}
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-neutral-950 px-3 py-3 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
              >
                {tx("Activar")}
              </button>
              <button
                type="button"
                onClick={() => finishRound(selectedRound)}
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-neutral-950 px-3 py-3 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
              >
                {tx("Finalizar")}
              </button>
              <button
                type="button"
                onClick={() => reopenRound(selectedRound)}
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-white px-3 py-3 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {tx("Reabrir")}
              </button>
              <button
                type="button"
                onClick={() =>
                  persistRoundSettings({
                    ...getBaseSettings(),
                    manualActiveRound: null,
                  })
                }
                disabled={isSaving}
                className="inline-flex rounded-2xl bg-white px-3 py-3 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {tx("Modo automático")}{" "}</button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => activateRound(previousRound)}
                disabled={isSaving || previousRound === activeRound?.round}
                className="inline-flex rounded-2xl bg-white px-3 py-3 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {tx("Jornada anterior")}{" "}</button>
              <button
                type="button"
                onClick={() => activateRound(nextRound)}
                disabled={isSaving || nextRound === activeRound?.round}
                className="inline-flex rounded-2xl bg-white px-3 py-3 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {tx("Siguiente jornada")}{" "}</button>
            </div>
          </>
        )}
      </div>

      {canEditRoundOrder ? (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-950">
                {tx("Orden de jornadas")}{" "}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {tx("Reordena el calendario sin salir de esta gestión. Al guardar, los partidos se renumeran con el nuevo orden.")}{" "}</p>
            </div>
            {hasRoundOrderChanges ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 type-caption font-black uppercase tracking-wide text-amber-800">
                {tx("Cambios")}
              </span>
            ) : null}
          </div>

          <div className="mt-3 space-y-2">
            {roundOrder.map((round, index) => (
              <div
                key={`${round}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-neutral-950">
                    {tx("Posición")}{" "}{index + 1}
                  </p>
                  <p className="text-xs font-semibold text-neutral-600">
                    {tx("Jornada")}{" "}{round}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRoundOrder((currentOrder) =>
                        moveRoundOrderItem({
                          roundOrder: currentOrder,
                          index,
                          direction: -1,
                        }),
                      )
                    }
                    disabled={isSavingRoundOrder || index === 0}
                    className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-neutral-700 disabled:opacity-30 items-center justify-center text-center"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRoundOrder((currentOrder) =>
                        moveRoundOrderItem({
                          roundOrder: currentOrder,
                          index,
                          direction: 1,
                        }),
                      )
                    }
                    disabled={
                      isSavingRoundOrder || index === roundOrder.length - 1
                    }
                    className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-neutral-700 disabled:opacity-30 items-center justify-center text-center"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRoundOrder(defaultRoundOrder);
                setError(null);
              }}
              disabled={isSavingRoundOrder || !hasRoundOrderChanges}
              className="inline-flex rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
            >
              {tx("Restaurar")}
            </button>
            <button
              type="button"
              onClick={handleSaveRoundOrder}
              disabled={isSavingRoundOrder || !hasRoundOrderChanges}
              className="inline-flex rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
            >
              {isSavingRoundOrder ? "Guardando..." : tx("Guardar orden")}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function SeasonPlayerNamesPanel({
  activeLeagueId,
  players,
  readOnly = false,
}: {
  activeLeagueId: string;
  players: SeasonPlayerSummary[];
  readOnly?: boolean;
}) {
  const { tx } = useI18n()
  const { t } = useI18n();
  const { isPlayerClaimed, updateLeaguePlayerName } = useLeagueAccess();
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(players.map((player) => [player.id, player.displayName])),
  );
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(player: SeasonPlayerSummary) {
    if (savingPlayerId) {
      return;
    }

    const nextName = (draftNames[player.id] ?? "").trim();

    if (!nextName || nextName === player.displayName) {
      return;
    }

    setSavingPlayerId(player.id);
    setError(null);

    const updated = await updateLeaguePlayerName(
      activeLeagueId,
      player.id,
      nextName,
    );

    setSavingPlayerId(null);

    if (!updated) {
      setError(
        "No se ha podido cambiar el nombre del jugador. Revisa Supabase o smash-lob-last-supabase-error.",
      );
      return;
    }

    showSavedFeedback(`${player.displayName} actualizado a ${nextName}.`);
  }

  if (players.length === 0) {
    return null;
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Jugadores de temporada")}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {readOnly
          ? tx("Consulta quién está conectado o pendiente. La temporada finalizada está en solo lectura.")
          : tx("Revisa quién está conectado o pendiente y corrige nombres sin recrear la temporada ni tocar el calendario ya generado.")}
      </p>

      <div className="mt-3 space-y-2">
        {players.map((player) => {
          const draftName = draftNames[player.id] ?? player.displayName;
          const hasChanges = draftName.trim() !== player.displayName;
          const isSavingPlayer = savingPlayerId === player.id;
          const isClaimed = isPlayerClaimed(activeLeagueId, player.id);

          return (
            <div key={player.id} className="rounded-2xl bg-neutral-100 p-3">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  player={player}
                  size="sm"
                  className="bg-white text-neutral-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 type-caption font-black ${
                        isClaimed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isClaimed
                        ? t.adminSeason.playerLinked
                        : t.adminSeason.playerPending}
                    </span>
                  </div>
                  {readOnly ? (
                    <p className="truncate text-sm font-black text-neutral-950">{player.displayName}</p>
                  ) : (
                    <input
                      aria-label={tx(`Nombre de ${player.displayName}`)}
                      value={draftName}
                      onChange={(event) => {
                        setDraftNames((currentNames) => ({ ...currentNames, [player.id]: event.target.value }));
                        setError(null);
                      }}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none focus:border-neutral-400"
                    />
                  )}
                </div>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => handleSave(player)}
                    disabled={Boolean(savingPlayerId) || !hasChanges || !draftName.trim()}
                    className="inline-flex shrink-0 rounded-2xl bg-neutral-950 px-3 py-2.5 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
                  >
                    {isSavingPlayer ? "..." : tx("Guardar")}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function FinishSeasonPanel({
  activeLeagueId,
  activeSeasonId,
  winnerName,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
  winnerName?: string | null;
}) {
  const { tx } = useI18n()
  const { t } = useI18n();
  const router = useRouter();
  const { data: session } = useSession();
  const { finishActiveSeason, hydrateSeasonSnapshot } = useSeasonSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinishSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(t.adminSeason.finishConfirmMessage);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const seasonSnapshot = await finishSupabaseActiveSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(seasonSnapshot);
      } catch (supabaseError) {
        recordSupabaseError("finish-active-season", supabaseError);
        setError(
          "No se ha podido finalizar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    finishActiveSeason(activeLeagueId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_finished",
        title: tx("Temporada finalizada"),
        description: winnerName
          ? tx(`Enhorabuena a ${winnerName}, ganador de la temporada.`)
          : "La temporada ha finalizado.",
        metadata: {
          winnerName: winnerName ?? null,
        },
      });
    } catch {
      // El cierre no debe fallar si el registro de actividad no entra.
    }

    showSavedFeedback(t.adminSeason.seasonFinished);
    setIsSaving(false);
    router.push("/");
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.finishTitle}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {t.adminSeason.finishDescription}
      </p>

      <button
        type="button"
        onClick={handleFinishSeason}
        disabled={isSaving}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
      >
        {isSaving ? "Guardando..." : t.adminSeason.finishSeason}
      </button>


      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}
function StartSeasonPanel({
  activeLeagueId,
  activeSeasonId,
  canStartBecauseRegistrationSettled,
  canStartBecauseRosterComplete,
  scheduledStartAt,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
  canStartBecauseRegistrationSettled: boolean;
  canStartBecauseRosterComplete: boolean;
  scheduledStartAt: string | null | undefined;
}) {
  const { tx } = useI18n()
  const router = useRouter();
  const { t } = useI18n();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings();
  const { replaceSeasonMatches } = useMatchData();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isScheduledPending = isScheduledSeasonPending("upcoming", scheduledStartAt);

  async function handleStartSeason() {
    if (isSaving) {
      return;
    }

    if (isScheduledPending) {
      setError("La temporada tiene un inicio programado y se activará automáticamente al llegar la fecha.");
      return;
    }

    if (!canStartBecauseRosterComplete) {
      setError(t.roster.startIncompleteError);
      return;
    }

    if (!canStartBecauseRegistrationSettled) {
      setError(
        "No se puede comenzar la temporada hasta que todas las inscripciones estén saldadas.",
      );
      return;
    }

    const confirmed = window.confirm(
      tx("¿Comenzar la temporada? A partir de ese momento se podrán programar partidos y registrar resultados."),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const result = await startSupabaseExistingSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(result.snapshot);
        if (result.matches.length > 0) {
          replaceSeasonMatches(activeSeasonId, result.matches);
        }
      } catch (supabaseError) {
        recordSupabaseError("start-existing-season", supabaseError);
        setError(
          "No se ha podido comenzar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    startSeason(activeLeagueId, activeSeasonId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_started",
        title: "Temporada comenzada",
        description: "La temporada ha pasado de próximamente a activa.",
      });
    } catch {
      // La temporada ya ha comenzado; la actividad es auxiliar.
    }

    setIsSaving(false);
    router.push("/");
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Comenzar temporada")}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {tx("La temporada está creada, pero todavía no está activa. Al comenzar se desbloquean la programación de partidos y el registro de resultados.")}{" "}</p>

      {scheduledStartAt ? (
        <div className="mt-3">
          <SeasonStartCountdown scheduledStartAt={scheduledStartAt} compact />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleStartSeason}
        disabled={isSaving || isScheduledPending || !canStartBecauseRegistrationSettled || !canStartBecauseRosterComplete}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
      >
        {isSaving ? "Guardando..." : tx("Comenzar temporada")}
      </button>

      {isScheduledPending ? (
        <p className="mt-3 rounded-2xl bg-sky-50 px-3 py-2 text-xs font-semibold leading-5 text-sky-900">
          {tx("Inicio programado. Los jugadores pueden unirse y completar sus datos, pero los controles competitivos permanecen bloqueados hasta la activación automática.")}{" "}</p>
      ) : !canStartBecauseRosterComplete ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
          {t.roster.startIncompleteHint}
        </p>
      ) : !canStartBecauseRegistrationSettled ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
          {tx("Hay inscripciones pendientes. La temporada no podrá comenzar hasta que se marquen como pagadas.")}{" "}</p>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function ReopenSeasonPanel({
  activeLeagueId,
  activeSeasonId,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
}) {
  const { tx } = useI18n()
  const router = useRouter();
  const { data: session } = useSession();
  const { hydrateSeasonSnapshot, startSeason } = useSeasonSettings();
  const { replaceSeasonMatches } = useMatchData();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReopenSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      tx("¿Reabrir esta temporada? Volverá a estar activa para poder corregir partidos o resultados."),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const result = await startSupabaseExistingSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(result.snapshot);
        if (result.matches.length > 0) {
          replaceSeasonMatches(activeSeasonId, result.matches);
        }
      } catch (supabaseError) {
        recordSupabaseError("reopen-finished-season", supabaseError);
        setError(
          "No se ha podido reabrir la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    startSeason(activeLeagueId, activeSeasonId);

    try {
      await recordActivityEvent({
        leagueId: activeLeagueId,
        seasonId: activeSeasonId,
        ...getActorFromSession(session),
        type: "season_started",
        title: "Temporada reabierta",
        description:
          "La temporada se ha reabierto manualmente para corregir partidos o resultados.",
      });
    } catch {
      // La reapertura no debe fallar si el registro de actividad no entra.
    }

    setIsSaving(false);
    router.push("/admin/season");
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Reabrir temporada pasada")}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {tx("Úsalo solo si la temporada se cerró por error o necesitas corregir algún resultado. La temporada volverá a estar activa.")}{" "}</p>

      <button
        type="button"
        onClick={handleReopenSeason}
        disabled={isSaving}
        className="flex mt-3 w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-950 ring-1 ring-neutral-200 disabled:text-neutral-300 items-center justify-center text-center"
      >
        {isSaving ? tx("Guardando...") : tx("Reabrir temporada pasada")}
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function SeasonDangerZone({
  activeLeagueId,
  activeSeasonId,
  totalRounds,
}: {
  activeLeagueId: string;
  activeSeasonId: string;
  totalRounds: number;
}) {
  const { tx } = useI18n()
  const router = useRouter();
  const { deleteSeason, hydrateSeasonSnapshot } = useSeasonSettings();
  const { deleteRoundMatches, deleteSeasonMatches } = useMatchData();
  const { userLeagues } = useLeagueAccess();
  const [selectedRound, setSelectedRound] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDeleteRound() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      tx(`¿Eliminar la Jornada ${selectedRound}? Se borrarán sus partidos y resultados.`),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        await deleteSupabaseRoundMatches({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
          round: selectedRound,
        });
      } catch (supabaseError) {
        recordSupabaseError("delete-round-matches", supabaseError);
        setError(
          "No se ha podido eliminar la jornada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    deleteRoundMatches(activeSeasonId, selectedRound);
    showSavedFeedback(tx(`Jornada ${selectedRound} eliminada.`));
    setIsSaving(false);
  }

  async function handleDeleteSeason() {
    if (isSaving) {
      return;
    }

    const confirmed = window.confirm(
      tx("¿Eliminar la temporada completa? Se borrarán sus jornadas, partidos y resultados."),
    );

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(activeSeasonId)) {
      try {
        const snapshot = await deleteSupabaseSeason({
          leagueId: activeLeagueId,
          seasonId: activeSeasonId,
        });

        hydrateSeasonSnapshot(snapshot);
      } catch (supabaseError) {
        recordSupabaseError("delete-season", supabaseError);
        setError(
          "No se ha podido eliminar la temporada en Supabase. Revisa smash-lob-last-supabase-error.",
        );
        setIsSaving(false);
        return;
      }
    }

    deleteSeason(activeLeagueId, activeSeasonId);
    deleteSeasonMatches(activeSeasonId);
    setIsSaving(false);
    router.push(userLeagues.length > 0 ? "/leagues" : "/");
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Zona de eliminación")}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">
        {tx("Permite borrar jornadas o temporadas completas si el calendario se creó mal. Es una acción destructiva.")}{" "}</p>

      <div className="mt-3 rounded-2xl bg-neutral-100 p-3">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
            {tx("Jornada a eliminar")}{" "}</span>
          <select
            value={selectedRound}
            onChange={(event) => setSelectedRound(Number(event.target.value))}
            disabled={isSaving}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none"
          >
            {Array.from({ length: totalRounds }, (_, index) => index + 1).map(
              (round) => (
                <option key={round} value={round}>
                  {tx("Jornada")}{" "}{round}
                </option>
              ),
            )}
          </select>
        </label>

        <button
          type="button"
          onClick={handleDeleteRound}
          disabled={isSaving}
          className="flex mt-3 w-full rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-black text-red-700 disabled:text-red-300 items-center justify-center text-center"
        >
          {tx("Eliminar jornada")}{" "}</button>
      </div>

      <button
        type="button"
        onClick={handleDeleteSeason}
        disabled={isSaving}
        className="flex mt-3 w-full rounded-2xl bg-red-600 px-3 py-2.5 text-sm font-black text-white disabled:bg-red-200 items-center justify-center text-center"
      >
        {tx("Eliminar temporada completa")}{" "}</button>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

function NewSeasonForm({
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
  const [scheduleMode, setScheduleMode] = useState<SeasonScheduleMode>("single");
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
  const totalSeasonRounds = getSeasonScheduleRoundCount({
    playerCount,
    mode: scheduleMode,
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
  const isManualCalendarReady =
    rosterMode === "self_registration" ||
    calendarMode !== "manual" ||
    isManualCalendarComplete({
      manualCalendar,
      validPlayerValues: validManualPlayerValues,
    });
  const hasValidPlayers =
    allowedPlayerCounts.includes(playerCount) &&
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
    isManualCalendarReady &&
    hasValidRegistrationFee &&
    hasValidScheduledStart &&
    (roundWindowMode === "none" ||
      (seasonStartsAt.length > 0 &&
        Number.isFinite(parsedRoundWindowDays) &&
        parsedRoundWindowDays >= 1));

  function refreshManualCalendarFromPlayers({
    selectedIds,
    count,
    mode = scheduleMode,
  }: {
    selectedIds: string[];
    count: number;
    mode?: SeasonScheduleMode;
  }) {
    setManualCalendar(
      createBalancedManualCalendar(
        getDraftPlayerValues({
          selectedPlayerIds: selectedIds,
          playerCount: count,
        }),
        mode,
      ),
    );
  }

  function handlePlayerCountChange(nextCount: number) {
    setPlayerCount(nextCount);

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
    refreshManualCalendarFromPlayers({
      selectedIds: nextSelectedPlayerIds,
      count: nextCount,
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
      roundWindowDays: isFixedDaysMode ? parsedRoundWindowDays : null,
      requiresThreeSets,
      mvpSystem,
      resultConfirmationMode,
      availabilityRecommendationsEnabled,
      manualMatches,
      scheduleMode,
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
        setError(
          "No se ha podido crear la nueva temporada en Supabase. Revisa smash-lob-last-supabase-error.",
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
          scheduleMode,
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
          scheduleMode,
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
          scheduleMode,
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

          <div>
            <p className="text-sm font-semibold text-neutral-700">
              {t.adminSeason.playerCount}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {allowedPlayerCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`rounded-2xl px-3 py-2.5 text-sm font-black ${
                    playerCount === count
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
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

      <AppCard>
        <p className="font-bold">{t.adminSeason.calendarTitle}</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {t.adminSeason.calendarDescription}
        </p>

        <div className="mt-4 rounded-2xl bg-neutral-100 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black">
                {t.adminSeason.seasonLengthTitle}
              </p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {t.adminSeason.seasonLengthDescription}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-neutral-700">
              {totalSeasonRounds} {t.adminSeason.roundsShortLabel}
            </span>
          </div>

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
                      refreshManualCalendarFromPlayers({
                        selectedIds: selectedPlayerIds,
                        count: playerCount,
                        mode,
                      });
                      setCreationFeedback(null);
                    }}
                    className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                      isSelected
                        ? "border-neutral-950 bg-white shadow-sm"
                        : "border-transparent bg-white/60 text-neutral-600"
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
          </div>
        </div>

        {rosterMode === "fixed" ? (
        <label className="mt-4 block rounded-2xl bg-neutral-100 p-3">
          <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
            {t.adminSeason.calendarModeLabel}
          </span>
          <select
            value={calendarMode}
            onChange={(event) => {
              setCalendarMode(event.target.value as CalendarMode);
              setCreationFeedback(null);
            }}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none focus:border-neutral-400"
          >
            <option value="balanced">{t.adminSeason.balancedCalendar}</option>
            <option value="manual">{t.adminSeason.manualCalendar}</option>
          </select>
          <p className="mt-2 text-xs font-semibold text-neutral-500">
            {calendarMode === "balanced"
              ? t.adminSeason.balancedCalendarDescription
              : t.adminSeason.manualCalendarDescription}
          </p>
        </label>
        ) : (
          <div className="mt-4 rounded-2xl bg-neutral-100 p-3">
            <p className="text-sm font-black">{t.adminSeason.balancedCalendar}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {t.adminSeason.selfRegistrationCalendarDescription}
            </p>
          </div>
        )}

        {rosterMode === "fixed" && calendarMode === "manual" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm text-neutral-700">
              <p className="font-black">
                {totalSeasonRounds} {tx("jornadas ·")}{" "}
                {getMatchesPerRound(playerCount)}{" "}
                {getMatchesPerRound(playerCount) === 1 ? tx("partido") : "partidos"}{" "}
                {tx("por jornada")}{" "}</p>
              <p className="mt-1 text-xs font-semibold text-neutral-500">
                {scheduleMode === "double"
                  ? t.adminSeason.manualCalendarDoubleHelp
                  : scheduleMode === "extended"
                    ? t.adminSeason.manualCalendarLongHelp
                    : t.adminSeason.manualCalendarSingleHelp}
              </p>
              <button
                type="button"
                onClick={() => {
                  refreshManualCalendarFromPlayers({
                    selectedIds: selectedPlayerIds,
                    count: playerCount,
                    mode: scheduleMode,
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
        ) : null}
      </AppCard>

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

        {isFixedDaysMode ? (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.adminSeason.seasonStartDate}
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


function AvailabilityRecommendationsSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [enabled, setEnabled] = useState(roundSettings.availabilityRecommendationsEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextEnabled: boolean) {
    if (isSaving || nextEnabled === roundSettings.availabilityRecommendationsEnabled) return;
    setEnabled(nextEnabled);
    setIsSaving(true);
    setError(null);
    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      availabilityRecommendationsEnabled: nextEnabled,
    };
    if (isSupabaseBackedId(roundSettings.seasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-season-availability-recommendations", supabaseError);
        setEnabled(roundSettings.availabilityRecommendationsEnabled);
        setError("No se ha podido guardar esta opción de temporada.");
        setIsSaving(false);
        return;
      }
    }
    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback(nextEnabled ? "Disponibilidad y recomendaciones activadas." : "Disponibilidad y recomendaciones desactivadas.");
    setIsSaving(false);
  }

  return (
    <AppCard>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isSaving}
          onChange={(event) => void save(event.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-black">{tx("Disponibilidad y recomendaciones")}</span>
          <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
            {tx("Si está activado, los jugadores pueden guardar sus horarios y la app propone franjas comunes al programar partidos. Si está desactivado, la coordinación se hace desde el chat.")}{" "}</span>
        </span>
      </label>
      {error ? <p className="mt-2 text-xs font-bold text-red-600">{tx(error)}</p> : null}
    </AppCard>
  );
}


function PlayerMatchActionsSettingsPanel({
  activeLeagueId,
  roundSettings,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
}) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [allowIncidents, setAllowIncidents] = useState(
    roundSettings.allowPlayerIncidents,
  );
  const [allowSubstitutions, setAllowSubstitutions] = useState(
    roundSettings.allowPlayerSubstitutions,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    allowIncidents !== roundSettings.allowPlayerIncidents ||
    allowSubstitutions !== roundSettings.allowPlayerSubstitutions;

  async function save() {
    if (isSaving || !hasChanges) return;

    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      allowPlayerIncidents: allowIncidents,
      allowPlayerSubstitutions: allowSubstitutions,
    };

    setIsSaving(true);
    setError(null);

    if (isSupabaseBackedId(roundSettings.seasonId)) {
      try {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      } catch (supabaseError) {
        recordSupabaseError("update-season-player-match-actions", supabaseError);
        setError("No se han podido guardar los permisos de acciones de partido.");
        setIsSaving(false);
        return;
      }
    }

    updateSeasonRoundSettings(nextSettings);
    showSavedFeedback("Permisos de los jugadores actualizados.");
    setIsSaving(false);
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Acciones de partido para jugadores")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Creator y administradores siempre conservarán estas opciones. Los cambios solo afectan a los jugadores normales de esta temporada.")}{" "}</p>

      <div className="mt-3 space-y-2">
        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 px-3 py-3">
          <input
            type="checkbox"
            checked={allowIncidents}
            onChange={(event) => {
              setAllowIncidents(event.target.checked);
            }}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-black">{tx("Permitir comunicar incidencias")}</span>
            <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
              {tx("Los participantes podrán abrir una incidencia desde Más acciones.")}{" "}</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 px-3 py-3">
          <input
            type="checkbox"
            checked={allowSubstitutions}
            onChange={(event) => {
              setAllowSubstitutions(event.target.checked);
            }}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-black">{tx("Permitir gestionar suplentes")}</span>
            <span className="mt-0.5 block text-xs font-semibold leading-5 text-neutral-500">
              {tx("Los participantes podrán asignar o retirar suplentes de sus partidos.")}{" "}</span>
          </span>
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isSaving || !hasChanges}
        className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500 items-center justify-center text-center"
      >
        {isSaving ? "Guardando..." : tx("Guardar permisos")}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}

export default function AdminSeasonPage() {
  const { tx } = useI18n()
  const { t } = useI18n();
  const { getLeagueInviteCode, hasLeagueAdminRole, isSuperuser } = useLeagueAccess();
  const { hydrateSeasonSnapshot, seasons } = useSeasonSettings();
  const { replaceSeasonMatches } = useMatchData();
  const {
    activeLeague,
    activeSeason,
    roundSettings,
    rankingPlayers: players,
    matches,
  } = useCurrentLeagueData();
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id);
  const isActiveSeason = activeSeason.status === "active";
  const isUpcomingSeason = activeSeason.status === "upcoming";
  const hasCreatedLeagueSeason = seasons.some(
    (season) => season.leagueId === activeLeague.id && season.totalRounds > 0,
  );
  const canReopenFinishedSeason =
    isSuperuser &&
    hasCreatedLeagueSeason &&
    activeSeason.status === "finished" &&
    activeSeason.totalRounds > 0 &&
    matches.length > 0;
  const [isNewSeasonFormOpen, setIsNewSeasonFormOpen] = useState(
    !hasCreatedLeagueSeason,
  );
  const [isDuplicatingSeason, setIsDuplicatingSeason] = useState(false);
  const [duplicateSeasonError, setDuplicateSeasonError] = useState<string | null>(null);
  const inviteCode = getLeagueInviteCode(activeLeague.id);
  const registrationRecipientPlayerId = activeLeague.createdByUserId
    ? players.find((player) => player.userId === activeLeague.createdByUserId)?.id ?? null
    : null;

  if (!canAccessAdmin) {
    return (
      <div className="compact-page space-y-3">
        <header className="app-page-header">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="type-page-title mt-1 text-xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    );
  }

  const isRegistrationSettled = isSeasonRegistrationSettled({
    registrationFee: roundSettings.registrationFee,
    playerIds: players.map((player) => player.id),
    settledPlayerIds: registrationRecipientPlayerId
      ? [registrationRecipientPlayerId]
      : [],
  });
  const canAuditCalendar =
    [
      Math.max(players.length - 1, 1),
      Math.max(players.length - 1, 1) * 2,
    ].includes(activeSeason.totalRounds) &&
    [8, 12, 16].includes(players.length);


  async function handleDuplicateLastSeason() {
    if (isDuplicatingSeason || activeSeason.status !== "finished") return;

    const confirmed = window.confirm(
      tx(`¿Duplicar “${activeSeason.name}” como “${getSuggestedSeasonName(activeSeason.name)}”? Se conservarán jugadores y configuración, pero calendario, resultados, pagos y progreso empezarán de cero.`),
    );
    if (!confirmed) return;

    setIsDuplicatingSeason(true);
    setDuplicateSeasonError(null);

    try {
      const result = await duplicateSupabaseSeason({
        leagueId: activeLeague.id,
        seasonId: activeSeason.id,
        name: getSuggestedSeasonName(activeSeason.name),
      });
      hydrateSeasonSnapshot(result.snapshot);
      const createdSeasonId = result.snapshot.activeSeasonIds[activeLeague.id];
      if (createdSeasonId) {
        replaceSeasonMatches(createdSeasonId, result.matches);
      }
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : "";
      setDuplicateSeasonError(
        code.includes("upcoming_season_already_exists")
          ? "Ya existe una temporada próxima. Iníciala o elimínala antes de duplicar otra."
          : code.includes("season_must_be_finished")
            ? "Solo se puede duplicar una temporada terminada."
            : code.includes("season_player_count_invalid")
              ? "La última temporada no tiene un número válido de jugadores activos."
              : code.includes("season_duplicate_player_profiles_failed")
                ? "No se han podido recuperar todos los jugadores de la última temporada."
                : code.includes("season_duplicate_player_memberships_failed")
                  ? "No se han podido recuperar las vinculaciones de los jugadores."
                  : tx(`No se ha podido duplicar la temporada${code ? ` (${code})` : ""}.`),
      );
    } finally {
      setIsDuplicatingSeason(false);
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header data-tour="season-admin-header" className="app-page-header">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">
          {isActiveSeason
            ? t.adminSeason.title
            : isUpcomingSeason
              ? tx("Temporada próximamente")
              : hasCreatedLeagueSeason
                ? tx("Temporada finalizada")
                : t.adminSeason.newSeasonTitle}
        </h1>
      </header>

      <div data-tour="season-admin-navigation">
        <SeasonNavigation
        isActiveSeason={isActiveSeason}
        isUpcomingSeason={isUpcomingSeason}
        hasCreatedLeagueSeason={hasCreatedLeagueSeason}
        canAuditCalendar={canAuditCalendar}
        canReopenFinishedSeason={canReopenFinishedSeason}
        registrationEnabled={roundSettings.registrationFee.enabled}
        />
      </div>


      {hasCreatedLeagueSeason ? (
        <div id="resumen-configuracion" className="settings-search-target">
          <SeasonConfigurationSummary
            activeSeason={activeSeason}
            roundSettings={roundSettings}
            matches={matches}
            playerCount={players.length}
          />
        </div>
      ) : null}

      {isActiveSeason ? (
        <>
          <SeasonSectionIntro
            title={tx("Calendario y jornadas")}
            description={tx("Ordena la competición, ajusta los plazos y comprueba el equilibrio del calendario.")}
          />
          <div id="jornadas" data-tour="season-admin-calendar" className="settings-search-target">
            <RoundManagementPanel
              activeLeagueId={activeLeague.id}
              activeSeason={activeSeason}
              roundSettings={roundSettings}
              matches={matches}
            />
          </div>

          <div id="margen-jornadas" className="settings-search-target">
            <RoundWindowSettingsPanel
              key={activeSeason.id}
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          {canAuditCalendar ? (
            <div id="equilibrio-calendario" className="settings-search-target">
              <BalancedCalendarAuditPanel
                activeLeagueId={activeLeague.id}
                activeSeason={activeSeason}
                playerIds={players.map((player) => player.id)}
                matches={matches}
              />
            </div>
          ) : null}

          <SeasonSectionIntro
            title={tx("Reglas de competición")}
            description={tx("Define MVP, confirmaciones, formato de sets y acciones permitidas a los jugadores.")}
          />
          <div id="mvp" className="settings-search-target">
            <MvpSystemSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="confirmaciones" className="settings-search-target">
            <ResultConfirmationSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="regla-tres-sets" className="settings-search-target">
            <RequiresThreeSetsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="disponibilidad-recomendaciones" className="settings-search-target">
            <AvailabilityRecommendationsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="acciones-partido" className="settings-search-target">
            <PlayerMatchActionsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Personas e inscripción")}
            description={tx("Gestiona la cuota de inscripción y los nombres de la plantilla activa.")}
          />
          <div id="inscripcion" data-tour="season-admin-people" className="settings-search-target">
            <RegistrationFeeSettingsPanel
              key={activeSeason.id}
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
              canToggleEnabled={false}
            />
          </div>

          <div id="jugadores" data-tour="season-admin-people" className="settings-search-target">
            <SeasonPlayerNamesPanel
              activeLeagueId={activeLeague.id}
              players={players}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Ciclo de vida")}
            description={tx("Finaliza la temporada o accede a las acciones irreversibles.")}
          />
          <div id="cierre" className="settings-search-target">
            <FinishSeasonPanel
              activeLeagueId={activeLeague.id}
              activeSeasonId={activeSeason.id}
              winnerName={players[0]?.displayName ?? null}
            />
          </div>

          <div id="zona-sensible" className="settings-search-target">
            <SeasonDangerZone
              activeLeagueId={activeLeague.id}
              activeSeasonId={activeSeason.id}
              totalRounds={activeSeason.totalRounds}
            />
          </div>
        </>
      ) : isUpcomingSeason ? (
        <>
          <SeasonSectionIntro
            title={tx("Preparación")}
            description={tx("Completa la plantilla y comprueba los requisitos antes de comenzar.")}
          />
          {roundSettings.rosterMode === "self_registration" ? (
            <div id="plantilla-temporada" className="settings-search-target">
              <SeasonRosterWaitingRoom
                leagueId={activeLeague.id}
                seasonId={activeSeason.id}
              />
            </div>
          ) : null}

          <div id="inicio-programado" className="settings-search-target"><ScheduledStartSettingsPanel activeLeagueId={activeLeague.id} roundSettings={roundSettings} /></div>

          <div id="inicio-temporada" className="settings-search-target">
            <StartSeasonPanel
              activeLeagueId={activeLeague.id}
              activeSeasonId={activeSeason.id}
              canStartBecauseRegistrationSettled={isRegistrationSettled}
              scheduledStartAt={roundSettings.scheduledStartAt}
              canStartBecauseRosterComplete={
                roundSettings.rosterMode !== "self_registration" ||
                (Boolean(roundSettings.playerCapacity) &&
                  players.length === roundSettings.playerCapacity)
              }
            />
          </div>

          <SeasonSectionIntro
            title={tx("Calendario y jornadas")}
            description={tx("Revisa el equilibrio, el orden y las fechas antes de publicar la temporada.")}
          />
          {canAuditCalendar ? (
            <div id="equilibrio-calendario" className="settings-search-target">
              <BalancedCalendarAuditPanel
                activeLeagueId={activeLeague.id}
                activeSeason={activeSeason}
                playerIds={players.map((player) => player.id)}
                matches={matches}
              />
            </div>
          ) : null}

          <div id="jornadas" data-tour="season-admin-calendar" className="settings-search-target">
            <RoundManagementPanel
              activeLeagueId={activeLeague.id}
              activeSeason={activeSeason}
              roundSettings={roundSettings}
              matches={matches}
            />
          </div>

          <div id="margen-jornadas" className="settings-search-target">
            <RoundWindowSettingsPanel
              key={activeSeason.id}
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Reglas de competición")}
            description={tx("Configura MVP, confirmaciones, formato de sets y acciones de los jugadores.")}
          />
          <div id="mvp" className="settings-search-target">
            <MvpSystemSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="confirmaciones" className="settings-search-target">
            <ResultConfirmationSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="regla-tres-sets" className="settings-search-target">
            <RequiresThreeSetsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="disponibilidad-recomendaciones" className="settings-search-target">
            <AvailabilityRecommendationsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <div id="acciones-partido" className="settings-search-target">
            <PlayerMatchActionsSettingsPanel
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Personas e inscripción")}
            description={tx("Revisa la cuota, las plazas y los nombres antes de iniciar la competición.")}
          />
          <div id="inscripcion" data-tour="season-admin-people" className="settings-search-target">
            <RegistrationFeeSettingsPanel
              key={activeSeason.id}
              activeLeagueId={activeLeague.id}
              roundSettings={roundSettings}
              canToggleEnabled
            />
          </div>

          <div id="jugadores" data-tour="season-admin-people" className="settings-search-target">
            <SeasonPlayerNamesPanel
              activeLeagueId={activeLeague.id}
              players={players}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Zona sensible")}
            description={tx("Acciones que pueden eliminar la temporada o su calendario.")}
          />
          <div id="zona-sensible" className="settings-search-target">
            <SeasonDangerZone
              activeLeagueId={activeLeague.id}
              activeSeasonId={activeSeason.id}
              totalRounds={activeSeason.totalRounds}
            />
          </div>
        </>
      ) : hasCreatedLeagueSeason ? (
        <>
          <SeasonSectionIntro
            title={tx("Accesos y plantilla")}
            description={tx("Consulta la invitación y los jugadores de la temporada finalizada.")}
          />
          <div id="invitacion" className="settings-search-target">
            <InviteLinkCard
              inviteCode={inviteCode}
              leagueName={activeLeague.name}
            />
          </div>

          <div id="jugadores" data-tour="season-admin-people" className="settings-search-target">
            <SeasonPlayerNamesPanel
              activeLeagueId={activeLeague.id}
              players={players}
              readOnly={!isSuperuser}
            />
          </div>

          <SeasonSectionIntro
            title={tx("Siguiente ciclo")}
            description={isSuperuser ? tx("Reabre la temporada si procede o prepara la siguiente edición.") : tx("La temporada finalizada permanece en solo lectura. Prepara la siguiente edición cuando corresponda.")}
          />
          {canReopenFinishedSeason ? (
            <div id="reabrir" className="settings-search-target">
              <ReopenSeasonPanel
                activeLeagueId={activeLeague.id}
                activeSeasonId={activeSeason.id}
              />
            </div>
          ) : null}

          <div id="nueva-temporada" className="settings-search-target space-y-3">
            <AppCard>
              <p className="font-bold">{tx("Preparar la siguiente temporada")}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                {tx("La configuración de la temporada finalizada se conserva arriba. Abre este formulario solo cuando vayas a crear la siguiente.")}{" "}</p>
              <button
                type="button"
                onClick={() => setIsNewSeasonFormOpen((current) => !current)}
                className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white items-center justify-center text-center"
              >
                {isNewSeasonFormOpen
                  ? tx("Ocultar nueva temporada")
                  : tx("Configurar nueva temporada")}
              </button>
              <button
                type="button"
                onClick={handleDuplicateLastSeason}
                disabled={isDuplicatingSeason}
                className="flex mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
              >
                {isDuplicatingSeason
                  ? "Duplicando..."
                  : tx("Duplicar última temporada")}
              </button>
              {duplicateSeasonError ? (
                <p className="mt-2 text-center text-xs font-bold text-red-600">
                  {tx(duplicateSeasonError)}
                </p>
              ) : null}
            </AppCard>

            {isNewSeasonFormOpen ? (
              <NewSeasonForm
                key={`${activeSeason.id}-new`}
                activeLeagueId={activeLeague.id}
                activeLeagueName={activeLeague.name}
                activeSeasonId={activeSeason.id}
                currentPlayers={players}
                initialLocations={activeLeague.locations}
              />
            ) : null}
          </div>
        </>
      ) : (
        <>
          <SeasonSectionIntro
            title={tx("Nueva temporada")}
            description={tx("Configura desde cero la primera edición de la liga.")}
          />
          <div id="nueva-temporada" className="settings-search-target">
            <NewSeasonForm
            key={`${activeSeason.id}-new`}
            activeLeagueId={activeLeague.id}
            activeLeagueName={activeLeague.name}
            activeSeasonId={activeSeason.id}
              currentPlayers={players}
              initialLocations={activeLeague.locations}
            />
          </div>
        </>
      )}
    </div>
  );
}
