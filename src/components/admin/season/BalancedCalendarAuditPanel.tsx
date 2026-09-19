"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useSeasonSettings, type SeasonRoundSettings } from "@/context/SeasonSettingsProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { auditSeasonCalendar, generateBalancedCalendar, getSeasonCalendarAuditChecks, getSeasonMaxBalancedLegCount, getSeasonMaxRoundCount, inferSeasonScheduleMode, isOptimizedCustomSeasonCalendar, type SeasonCalendarAuditCheckKey, type SeasonScheduleMode } from "@/lib/calendar"
import { showActionFeedback } from "@/lib/actionFeedback"
import { replaceSupabaseUpcomingSeasonBalancedCalendar } from "@/lib/supabaseSeasons"
import { getEmptyCourtBooking } from "@/lib/courtBooking"
import { getSeasonBaseRoundCount, isSeasonPlayerCountInRange } from "@/lib/seasonPlayerCount"

const supabaseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isSupabaseBackedId = (id: string) => supabaseUuidPattern.test(id)
const recordSupabaseError = (action: string, error: unknown) => { try { window.localStorage.setItem("smash-lob-last-supabase-error", JSON.stringify({ action, message: error instanceof Error ? error.message : String(error), at: new Date().toISOString() })) } catch { /* diagnostic only */ } }
const showSavedFeedback = (message: string) => showActionFeedback({ tone: "success", message })

export function BalancedCalendarAuditPanel({
  activeLeagueId,
  activeSeason,
  playerIds,
  matches,
  roundSettings,
}: {
  activeLeagueId: string;
  activeSeason: {
    id: string;
    totalRounds: number;
    status?: "upcoming" | "active" | "finished";
  };
  playerIds: string[];
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
  roundSettings: SeasonRoundSettings;
}) {
  const { t, tx } = useI18n();
  const { replaceSeasonMatches } = useMatchData();
  const { updateSeasonCalendarDefinition } = useSeasonSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandMultiplier, setExpandMultiplier] = useState(2);
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
            expectedRoundCount: activeSeason.totalRounds,
          })
        : null,
    [activeSeason.totalRounds, playerIds, scheduleMode, seasonMatches],
  );
  const canAudit =
    Boolean(scheduleMode) &&
    isSeasonPlayerCountInRange(playerIds.length) &&
    seasonMatches.length > 0;
  const hasRecordedResults = seasonMatches.some((match) =>
    match.pointsA !== null || match.pointsB !== null || match.sets.length > 0 ||
    Boolean(match.resultRecordedAt) || Boolean(match.resultReportedByPlayerId),
  );
  const canRepair = activeSeason.status === "upcoming";
  const canReroll = !hasRecordedResults;
  const baseRoundCount = getSeasonBaseRoundCount(playerIds.length);
  const maxLongMultiplier = getSeasonMaxBalancedLegCount(playerIds.length);
  const maxRoundCount = getSeasonMaxRoundCount(playerIds.length);
  const availableLongMultipliers = Array.from(
    { length: Math.max(maxLongMultiplier - 1, 0) },
    (_, index) => index + 2,
  ).filter((multiplier) => baseRoundCount * multiplier > activeSeason.totalRounds);
  const selectedExpandMultiplier = availableLongMultipliers.includes(expandMultiplier)
    ? expandMultiplier
    : (availableLongMultipliers[0] ?? null);
  const canExpandDouble =
    canReroll && activeSeason.totalRounds < baseRoundCount * 2;
  const canExpandLong = canReroll && selectedExpandMultiplier !== null;

  if (!canAudit || !audit || !scheduleMode) {
    return null;
  }

  const calendarAudit = audit;
  const isCustomDuration =
    scheduleMode === "extended" && activeSeason.totalRounds % baseRoundCount !== 0;
  const modeLabel =
    scheduleMode === "single"
      ? t.adminSeason.singleRoundCalendar
      : scheduleMode === "double"
        ? t.adminSeason.doubleRoundCalendar
        : isCustomDuration
          ? t.adminSeason.durationCustomTitle
          : t.adminSeason.extendedCalendar;
  const auditLabels: Record<SeasonCalendarAuditCheckKey, string> = {
    matchStructure: t.adminSeason.calendarAuditMatchStructure,
    roundStructure: t.adminSeason.calendarAuditRoundStructure,
    roundMatchCount: t.adminSeason.calendarAuditMatchesPerRound,
    roundAppearanceCount: t.adminSeason.calendarAuditMaxOneAppearance,
    byeRoundCount: t.adminSeason.calendarAuditByesPerRound,
    byePlayerCount: t.adminSeason.calendarAuditByesPerPlayer,
    consecutiveByes: t.adminSeason.calendarAuditNoConsecutiveByes,
    quartets: t.adminSeason.calendarAuditQuartets,
    partners: t.adminSeason.calendarAuditPartners,
    opponents: t.adminSeason.calendarAuditOpponents,
    firstLeg: t.adminSeason.calendarAuditFirstLeg,
    secondLeg: t.adminSeason.calendarAuditSecondLeg,
    durationBalance: t.adminSeason.calendarAuditDurationBalance,
    modeStructure:
      scheduleMode === "double"
        ? t.adminSeason.calendarAuditExactSecondLeg
        : t.adminSeason.calendarAuditExtendedStructure,
  }
  const auditDetails: Record<SeasonCalendarAuditCheckKey, string> = {
    matchStructure: calendarAudit.invalidMatchCount === 0
      ? t.adminSeason.calendarAuditAllCorrect
      : `${calendarAudit.invalidMatchCount} ${t.adminSeason.calendarAuditIncorrectMatches}`,
    roundStructure:
      calendarAudit.invalidRoundMatchCount === 0 && calendarAudit.invalidRoundAppearanceCount === 0
        ? t.adminSeason.calendarAuditAllCorrect
        : t.adminSeason.calendarAuditRoundStructureError
            .replace("{rounds}", String(calendarAudit.invalidRoundMatchCount))
            .replace("{appearances}", String(calendarAudit.invalidRoundAppearanceCount)),
    roundMatchCount: calendarAudit.invalidRoundMatchCount === 0
      ? t.adminSeason.calendarAuditMatchesPerRoundOk.replace("{count}", String(calendarAudit.expectedMatchesPerRound))
      : t.adminSeason.calendarAuditMatchesPerRoundError.replace("{count}", String(calendarAudit.invalidRoundMatchCount)),
    roundAppearanceCount: calendarAudit.invalidRoundAppearanceCount === 0
      ? t.adminSeason.calendarAuditMaxOneAppearanceOk
      : t.adminSeason.calendarAuditSingleAppearanceError.replace("{count}", String(calendarAudit.invalidRoundAppearanceCount)),
    byeRoundCount: calendarAudit.invalidByeRoundCount === 0
      ? t.adminSeason.calendarAuditByesPerRoundOk.replace("{count}", String(calendarAudit.expectedByesPerRound))
      : t.adminSeason.calendarAuditByesPerRoundError.replace("{count}", String(calendarAudit.invalidByeRoundCount)),
    byePlayerCount: scheduleMode === "extended"
      ? t.adminSeason.calendarAuditByesPerPlayerRange
          .replace("{min}", String(calendarAudit.byeCountMin))
          .replace("{max}", String(calendarAudit.byeCountMax))
      : calendarAudit.invalidByePlayerCount === 0
        ? t.adminSeason.calendarAuditByesPerPlayerOk.replace("{count}", String(calendarAudit.expectedByesPerPlayer))
        : t.adminSeason.calendarAuditByesPerPlayerError.replace("{count}", String(calendarAudit.invalidByePlayerCount)),
    consecutiveByes: calendarAudit.consecutiveByeCount === 0
      ? t.adminSeason.calendarAuditNoConsecutiveByesOk
      : t.adminSeason.calendarAuditNoConsecutiveByesError.replace("{count}", String(calendarAudit.consecutiveByeCount)),
    quartets: calendarAudit.repeatedQuartetCount === 0
      ? t.adminSeason.calendarAuditQuartetsOk
      : t.adminSeason.calendarAuditQuartetsError.replace("{count}", String(calendarAudit.repeatedQuartetCount)),
    partners: calendarAudit.invalidTeammatePairCount === 0
      ? scheduleMode === "extended"
        ? t.adminSeason.calendarAuditMaxPartnerFrequency.replace("{count}", String(calendarAudit.expectedTeammateCount))
        : calendarAudit.hasByes
          ? t.adminSeason.calendarAuditFlexiblePartners
          : t.adminSeason.calendarAuditExpectedTimes.replace("{count}", String(calendarAudit.expectedTeammateCount))
      : `${calendarAudit.invalidTeammatePairCount} ${t.adminSeason.calendarAuditIncorrect}`,
    opponents: calendarAudit.invalidOpponentPairCount === 0
      ? scheduleMode === "extended"
        ? t.adminSeason.calendarAuditMaxOpponentFrequency.replace("{count}", String(calendarAudit.expectedOpponentCount))
        : calendarAudit.hasByes
          ? t.adminSeason.calendarAuditFlexibleOpponents.replace("{count}", String(calendarAudit.expectedOpponentCount))
          : t.adminSeason.calendarAuditExpectedTimes.replace("{count}", String(calendarAudit.expectedOpponentCount))
      : `${calendarAudit.invalidOpponentPairCount} ${t.adminSeason.calendarAuditIncorrect}`,
    firstLeg: calendarAudit.firstLegBalanced ? t.adminSeason.calendarAuditBalancedLeg : t.adminSeason.calendarAuditUnbalancedLeg,
    secondLeg: calendarAudit.secondLegBalanced === true ? t.adminSeason.calendarAuditBalancedLeg : t.adminSeason.calendarAuditUnbalancedLeg,
    durationBalance: calendarAudit.partialRoundCount === 0
      ? t.adminSeason.calendarAuditDurationPerfect
          .replace("{count}", String(calendarAudit.completeLegCount))
      : t.adminSeason.calendarAuditDurationOptimized
          .replace("{complete}", String(calendarAudit.completeLegCount))
          .replace("{partial}", String(calendarAudit.partialRoundCount))
          .replace("{min}", String(calendarAudit.playerMatchCountMin))
          .replace("{max}", String(calendarAudit.playerMatchCountMax)),
    modeStructure: scheduleMode === "double"
      ? t.adminSeason.calendarAuditRepeatedRounds.replace("{count}", String(calendarAudit.repeatedRoundCount)).replace("{total}", String(calendarAudit.baseRoundCount))
      : t.adminSeason.calendarAuditRepeatedMatches.replace("{count}", String(calendarAudit.repeatedMatchCount)),
  }
  const optimizedCustomCalendar = isOptimizedCustomSeasonCalendar(calendarAudit);
  const auditIsAcceptable = calendarAudit.isBalanced || optimizedCustomCalendar;
  const checkRows = getSeasonCalendarAuditChecks(calendarAudit).map((check) => ({
    ...check,
    label: auditLabels[check.key],
    detail: auditDetails[check.key],
  }));

  function shuffledPlayerIds() {
    const shuffled = [...playerIds]
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomValues = new Uint32Array(1)
      globalThis.crypto?.getRandomValues?.(randomValues)
      const randomValue = randomValues[0] ?? Math.floor(Math.random() * 0xffffffff)
      const swapIndex = randomValue % (index + 1)
      ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
    }
    return shuffled
  }

  const currentScheduleMode: SeasonScheduleMode = scheduleMode;

  async function replaceCalendar(
    reroll: boolean,
    options?: { scheduleMode: SeasonScheduleMode; targetRoundCount: number; expansion?: boolean },
  ) {
    const targetMode: SeasonScheduleMode = options?.scheduleMode ?? currentScheduleMode;
    const targetRoundCount = options?.targetRoundCount ?? activeSeason.totalRounds;
    const isExpansion = options?.expansion === true;

    if (
      isSaving ||
      (reroll ? !canReroll : !canRepair) ||
      (!reroll && calendarAudit.isBalanced) ||
      (isExpansion && targetRoundCount <= activeSeason.totalRounds)
    ) return;

    const confirmed = window.confirm(
      isExpansion
        ? t.adminSeason.expandSeasonConfirm
            .replace("{rounds}", String(targetRoundCount))
        : reroll
          ? t.adminSeason.rerollConfirm
          : t.adminSeason.repairCalendarConfirm,
    );
    if (!confirmed) return;

    setIsSaving(true);
    setError(null);

    try {
      const sourcePlayerIds = reroll && !isExpansion ? shuffledPlayerIds() : playerIds;
      let repairedMatches;
      let resolvedRoundCount = targetRoundCount;
      let resolvedScheduleMode = targetMode;

      if (isSupabaseBackedId(activeSeason.id)) {
        const result = await replaceSupabaseUpcomingSeasonBalancedCalendar({
          leagueId: activeLeagueId,
          seasonId: activeSeason.id,
          playerIds,
          scheduleMode: targetMode,
          targetRoundCount,
          reroll,
        });
        repairedMatches = result.matches;
        resolvedRoundCount = result.totalRounds;
        resolvedScheduleMode = result.scheduleMode;
      } else {
        repairedMatches = generateBalancedCalendar({
          leagueId: activeLeagueId,
          seasonId: activeSeason.id,
          playerIds: sourcePlayerIds,
          scheduleMode: targetMode,
          targetRoundCount,
        }).map((match) => ({
          ...match,
          status:
            roundSettings.openingRoundEnabled &&
            roundSettings.openingRoundAt &&
            match.round === 1
              ? "scheduled" as const
              : match.status,
          scheduledAt:
            roundSettings.openingRoundEnabled &&
            roundSettings.openingRoundAt &&
            match.round === 1
              ? roundSettings.openingRoundAt
              : match.scheduledAt,
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
      }

      replaceSeasonMatches(activeSeason.id, repairedMatches);
      if (resolvedRoundCount !== activeSeason.totalRounds || resolvedScheduleMode !== currentScheduleMode) {
        updateSeasonCalendarDefinition({
          seasonId: activeSeason.id,
          totalRounds: resolvedRoundCount,
          scheduleMode: resolvedScheduleMode,
        });
      }
      showSavedFeedback(
        isExpansion
          ? t.adminSeason.expandSeasonSuccess.replace("{rounds}", String(resolvedRoundCount))
          : reroll
            ? t.adminSeason.rerollSuccess
            : t.adminSeason.repairCalendarSuccess,
      );
    } catch (repairError) {
      recordSupabaseError(
        isExpansion ? "expand-balanced-calendar" : reroll ? "reroll-balanced-calendar" : "repair-balanced-calendar",
        repairError,
      );
      setError(
        repairError instanceof Error &&
          repairError.message === "season_calendar_reroll_has_results"
          ? t.adminSeason.rerollBlockedByResults
          : repairError instanceof Error
            ? repairError.message
            : t.adminSeason.repairCalendarError,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function repairCalendar() {
    await replaceCalendar(false, {
      scheduleMode: currentScheduleMode,
      targetRoundCount: activeSeason.totalRounds,
    });
  }

  async function rerollCalendar() {
    await replaceCalendar(true, {
      scheduleMode: currentScheduleMode,
      targetRoundCount: activeSeason.totalRounds,
    });
  }

  async function expandToDoubleRound() {
    await replaceCalendar(true, {
      scheduleMode: "double",
      targetRoundCount: baseRoundCount * 2,
      expansion: true,
    });
  }

  async function expandToLongSeason() {
    if (!selectedExpandMultiplier) return;
    await replaceCalendar(true, {
      scheduleMode: "extended",
      targetRoundCount: baseRoundCount * selectedExpandMultiplier,
      expansion: true,
    });
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
            calendarAudit.isBalanced
              ? "bg-emerald-100 text-emerald-800"
              : optimizedCustomCalendar
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {calendarAudit.isBalanced
            ? t.adminSeason.calendarAuditOk
            : optimizedCustomCalendar
              ? t.adminSeason.calendarAuditOptimized
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
                  : optimizedCustomCalendar
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {check.ok
                ? t.adminSeason.calendarAuditOk
                : optimizedCustomCalendar
                  ? t.adminSeason.calendarAuditOptimized
                  : t.adminSeason.calendarAuditNeedsRepair}
            </span>
          </div>
        ))}
      </div>

      {!auditIsAcceptable && canRepair ? (
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
      <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          {t.adminSeason.rerollEyebrow}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
          {hasRecordedResults
            ? t.adminSeason.rerollBlockedByResults
            : t.adminSeason.rerollDescription}
        </p>
        <button
          type="button"
          onClick={rerollCalendar}
          disabled={isSaving || !canReroll}
          className="mt-3 flex w-full items-center justify-center rounded-2xl border border-neutral-950 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950 disabled:border-neutral-200 disabled:text-neutral-400"
        >
          {isSaving ? t.adminSeason.rerollGenerating : t.adminSeason.rerollButton}
        </button>
      </div>
      <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          {t.adminSeason.expandSeasonEyebrow}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
          {hasRecordedResults
            ? t.adminSeason.expandSeasonBlockedByResults
            : activeSeason.totalRounds >= maxRoundCount
              ? t.adminSeason.expandSeasonAtMaximum
                  .replace("{rounds}", String(maxRoundCount))
              : t.adminSeason.expandSeasonDescription
                  .replace("{max}", String(maxLongMultiplier))
                  .replace("{rounds}", String(maxRoundCount))}
        </p>

        {canExpandDouble ? (
          <button
            type="button"
            onClick={expandToDoubleRound}
            disabled={isSaving}
            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-neutral-950 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950 disabled:border-neutral-200 disabled:text-neutral-400"
          >
            {t.adminSeason.expandDoubleButton
              .replace("{rounds}", String(baseRoundCount * 2))}
          </button>
        ) : null}

        {canExpandLong ? (
          <div className="mt-3 rounded-2xl bg-white p-3">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.adminSeason.expandLongLabel}
              </span>
              <select
                value={selectedExpandMultiplier ?? ""}
                onChange={(event) => setExpandMultiplier(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none"
              >
                {availableLongMultipliers.map((multiplier) => (
                  <option key={multiplier} value={multiplier}>
                    ×{multiplier} · {baseRoundCount * multiplier} {t.adminSeason.roundsShortLabel}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={expandToLongSeason}
              disabled={isSaving}
              className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-300"
            >
              {isSaving
                ? t.adminSeason.rerollGenerating
                : t.adminSeason.expandLongButton}
            </button>
          </div>
        ) : null}
      </div>
      {error ? (
        <p className="mt-3 text-center text-xs font-semibold text-red-600">
          {tx(error)}
        </p>
      ) : null}
    </AppCard>
  );
}
