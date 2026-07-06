"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlayerProfile } from "@/data/fakeData";
import { useMatchData } from "@/context/MatchDataProvider";
import { MatchAvailabilitySuggestions } from "@/components/match/MatchAvailabilitySuggestions";
import { useI18n } from "@/i18n/I18nProvider";
import {
  createScheduledLeagueLocationValue,
  findLeagueLocationByScheduleLocation,
  getLeagueLocationCourts,
  getLeagueLocationMapsUrl,
  getLeagueLocationOptionLabel,
  getLeagueLocationScheduleText,
  getScheduleLocationFallbackText,
  getScheduleLocationMapsUrl,
  normalizeLeagueLocations,
  sortLeagueLocationsByOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations";
import { isDateTimeInsideRoundWindow } from "@/lib/rounds";
import {
  dateTimeLocalToUtcIso,
  formatNextFullHourForDateTimeInput,
  formatScheduleForDateTimeInput,
} from "@/lib/matchScheduleTime";

function capitalizeFirstLetter(value: string | null | undefined) {
  const cleanValue = value?.trim();

  if (!cleanValue) {
    return value ?? null;
  }

  return cleanValue.charAt(0).toLocaleUpperCase("es-ES") + cleanValue.slice(1);
}

type MatchScheduleFormProps = {
  matchId: string;
  leagueId: string;
  seasonId: string;
  status: string;
  scheduledAt: string | null;
  dateLabel: string | null;
  location: string | null;
  availableLocations: LeagueLocation[];
  playerIds: string[];
  players: PlayerProfile[];
  roundStartsAt: string | null;
  roundEndsAt: string | null;
  canManage: boolean;
  canClearSchedule?: boolean;
  calendarAction?: ReactNode;
};

const otherLocationValue = "__other__";

export function MatchScheduleForm({
  matchId,
  leagueId,
  seasonId,
  status,
  scheduledAt,
  dateLabel,
  location,
  availableLocations,
  playerIds,
  players,
  roundStartsAt,
  roundEndsAt,
  canManage,
  canClearSchedule = false,
  calendarAction,
}: MatchScheduleFormProps) {
  const { t } = useI18n();
  const { updateMatchSchedule, postponeMatch, clearMatchSchedule } = useMatchData();

  const normalizedAvailableLocations = useMemo(
    () => sortLeagueLocationsByOptionLabel(normalizeLeagueLocations(availableLocations)),
    [availableLocations],
  );
  const hasAvailableLocations = normalizedAvailableLocations.length > 0;

  const isFinished = status === "finished";
  const isPostponed = status === "postponed";
  const hasSchedule =
    !isPostponed && Boolean(scheduledAt || dateLabel || location);

  const scheduledLeagueLocation = findLeagueLocationByScheduleLocation({
    locations: normalizedAvailableLocations,
    scheduleLocation: location,
  });

  const initialLocationValue = scheduledLeagueLocation
    ? scheduledLeagueLocation.id
    : hasSchedule && location
      ? otherLocationValue
      : hasAvailableLocations
        ? ""
        : otherLocationValue;

  const [isEditing, setIsEditing] = useState(
    canManage && !hasSchedule && !isPostponed && !isFinished,
  );
  const [scheduledAtValue, setScheduledAtValue] = useState(
    hasSchedule ? formatScheduleForDateTimeInput(scheduledAt) : "",
  );
  const hasInitializedDefaultSchedule = useRef(false);
  const autoScheduledAtValueRef = useRef<string | null>(null);
  const hasUserChangedScheduledAtRef = useRef(false);
  const [selectedLocation, setSelectedLocation] =
    useState(initialLocationValue);
  const [selectedCourt, setSelectedCourt] = useState(
    scheduledLeagueLocation?.selectedCourt ?? "",
  );
  const [customLocation, setCustomLocation] = useState(
    hasSchedule && location && !scheduledLeagueLocation ? location : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const applyAutomaticScheduledAtValue = useCallback(
    (nextValue: string) => {
      if (hasSchedule || !isEditing || hasUserChangedScheduledAtRef.current) {
        return;
      }

      setScheduledAtValue((currentValue) => {
        const cleanCurrentValue = currentValue.trim();

        if (
          cleanCurrentValue &&
          cleanCurrentValue !== autoScheduledAtValueRef.current
        ) {
          return currentValue;
        }

        autoScheduledAtValueRef.current = nextValue;
        return nextValue;
      });
    },
    [hasSchedule, isEditing],
  );

  useEffect(() => {
    if (hasInitializedDefaultSchedule.current || hasSchedule || !isEditing) {
      return;
    }

    applyAutomaticScheduledAtValue(formatNextFullHourForDateTimeInput());
    hasInitializedDefaultSchedule.current = true;
  }, [applyAutomaticScheduledAtValue, hasSchedule, isEditing]);

  const selectedLeagueLocation = normalizedAvailableLocations.find(
    (availableLocation) => availableLocation.id === selectedLocation,
  );
  const selectedLocationCourts = selectedLeagueLocation
    ? getLeagueLocationCourts(selectedLeagueLocation)
    : [];
  const shouldSelectCourt = selectedLocationCourts.length > 0;

  const finalLocation = useMemo(() => {
    if (selectedLocation === otherLocationValue) {
      return customLocation.trim();
    }

    const leagueLocation = normalizedAvailableLocations.find(
      (availableLocation) => availableLocation.id === selectedLocation,
    );

    if (!leagueLocation) {
      return selectedLocation.trim();
    }

    return createScheduledLeagueLocationValue(leagueLocation, selectedCourt);
  }, [customLocation, normalizedAvailableLocations, selectedCourt, selectedLocation]);

  const canSave =
    canManage &&
    !isSaving &&
    scheduledAtValue.trim().length > 0 &&
    finalLocation.length > 0 &&
    (!shouldSelectCourt || selectedCourt.trim().length > 0);
  const canPostpone = canManage && !isSaving && !isFinished && !isPostponed;
  const canClearCurrentSchedule =
    canClearSchedule && !isSaving && hasSchedule && !isFinished;

  const isOutsideRoundWindow =
    scheduledAtValue.trim().length > 0 &&
    !isDateTimeInsideRoundWindow({
      dateTimeValue: scheduledAtValue,
      startsAt: roundStartsAt,
      endsAt: roundEndsAt,
    });

  const displayedLocationText = scheduledLeagueLocation
    ? getLeagueLocationScheduleText(scheduledLeagueLocation)
    : getScheduleLocationFallbackText(location);
  const directionsUrl = scheduledLeagueLocation
    ? getLeagueLocationMapsUrl(scheduledLeagueLocation)
    : getScheduleLocationMapsUrl(location);

  function handleLocationChange(value: string) {
    setSelectedLocation(value);
    setActionError(null);

    const nextLocation = normalizedAvailableLocations.find(
      (availableLocation) => availableLocation.id === value,
    );
    const nextCourts = nextLocation ? getLeagueLocationCourts(nextLocation) : [];

    setSelectedCourt(nextCourts.length === 1 ? nextCourts[0] : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage || !canSave) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const saved = await updateMatchSchedule(matchId, {
      scheduledAt: dateTimeLocalToUtcIso(scheduledAtValue),
      location: finalLocation,
    });

    setIsSaving(false);

    if (!saved) {
      setActionError(
        "No se ha podido guardar el horario en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error.",
      );
      return;
    }

    setIsEditing(false);
  }

  function handleCancel() {
    if (!canManage || isSaving) {
      return;
    }

    setScheduledAtValue(
      hasSchedule ? formatScheduleForDateTimeInput(scheduledAt) : "",
    );
    setSelectedLocation(initialLocationValue);
    setSelectedCourt(scheduledLeagueLocation?.selectedCourt ?? "");
    setCustomLocation(
      hasSchedule && location && !scheduledLeagueLocation ? location : "",
    );
    setActionError(null);
    autoScheduledAtValueRef.current = null;
    hasUserChangedScheduledAtRef.current = false;
    setIsEditing(false);
  }

  async function handlePostpone() {
    if (!canManage || isSaving) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const saved = await postponeMatch(matchId);

    setIsSaving(false);

    if (!saved) {
      setActionError(
        "No se ha podido aplazar el partido en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error.",
      );
      return;
    }

    setScheduledAtValue("");
    setSelectedLocation(hasAvailableLocations ? "" : otherLocationValue);
    setSelectedCourt("");
    setCustomLocation("");
    autoScheduledAtValueRef.current = null;
    hasUserChangedScheduledAtRef.current = false;
    setIsEditing(false);
  }

  async function handleClearSchedule() {
    if (!canClearCurrentSchedule) {
      return;
    }

    const confirmed = window.confirm(t.matchDetail.clearScheduleConfirm);

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const saved = await clearMatchSchedule(matchId);

    setIsSaving(false);

    if (!saved) {
      setActionError(t.matchDetail.clearScheduleError);
      return;
    }

    setScheduledAtValue("");
    setSelectedLocation(hasAvailableLocations ? "" : otherLocationValue);
    setSelectedCourt("");
    setCustomLocation("");
    autoScheduledAtValueRef.current = null;
    hasUserChangedScheduledAtRef.current = false;
    setIsEditing(false);
  }

  function getTitle() {
    if (isPostponed) {
      return t.matchDetail.postponedTitle;
    }

    if (hasSchedule) {
      return t.matchDetail.schedule;
    }

    return canManage
      ? t.matchDetail.addScheduleTitle
      : t.matchDetail.pendingSchedule;
  }

  function getDescription() {
    if (isPostponed) {
      return t.matchDetail.postponedDescription;
    }

    if (hasSchedule) {
      return t.matchDetail.scheduleDescription;
    }

    return canManage
      ? t.matchDetail.addScheduleDescription
      : t.matchDetail.pendingScheduleDescription;
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-[0_1px_8px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">{getTitle()}</p>

          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-neutral-500">
            {getDescription()}
          </p>
        </div>

        {canManage && !isEditing && !isFinished ? (
          <div className="flex shrink-0 items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 shadow-sm">
            {isPostponed ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
                className="inline-flex h-6 items-center rounded-md bg-neutral-950 px-2 text-[10px] font-black text-white transition active:scale-[0.98] disabled:bg-neutral-300"
              >
                {t.matchDetail.rescheduleButton}
              </button>
            ) : (
              <>
                {hasSchedule ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="inline-flex h-6 items-center rounded-md bg-white px-2 text-[10px] font-black text-neutral-900 shadow-sm transition active:bg-neutral-50 disabled:text-neutral-400"
                  >
                    {t.matchDetail.editScheduleButton}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="inline-flex h-6 items-center rounded-md bg-neutral-950 px-2 text-[10px] font-black text-white transition active:scale-[0.98] disabled:bg-neutral-300"
                  >
                    {t.matchDetail.addScheduleButton}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePostpone}
                  disabled={!canPostpone}
                  className="inline-flex h-6 items-center rounded-md px-2 text-[10px] font-black text-neutral-700 transition active:bg-white disabled:text-neutral-300"
                >
                  {isSaving ? "Guardando..." : t.matchDetail.postponeButton}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="mt-2 rounded-lg bg-neutral-100 px-2.5 py-1.5 text-sm">
          {hasSchedule ? (
            <>
              <p className="font-black text-neutral-950">
                {capitalizeFirstLetter(dateLabel) ?? t.matches.pendingDate}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                {displayedLocationText ?? t.matches.missingSchedule}
              </p>

              {!isFinished && (directionsUrl || calendarAction) ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {directionsUrl ? (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-center text-xs font-black text-neutral-800"
                    >
                      {t.matchDetail.directionsButton}
                    </a>
                  ) : null}

                  {calendarAction ? calendarAction : null}
                </div>
              ) : null}

              {canClearCurrentSchedule ? (
                <button
                  type="button"
                  onClick={handleClearSchedule}
                  disabled={!canClearCurrentSchedule}
                  className="mt-2 w-full rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-xs font-black text-red-700 shadow-sm disabled:text-red-300"
                >
                  {isSaving
                    ? t.matchDetail.clearingSchedule
                    : t.matchDetail.clearScheduleButton}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <p className="font-black text-neutral-950">
                {isPostponed
                  ? t.matches.pendingReschedule
                  : t.matches.pendingDate}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-600">
                {isPostponed
                  ? t.matches.needsReschedule
                  : t.matchDetail.noScheduleDescription}
              </p>
            </>
          )}
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
          {actionError}
        </p>
      ) : null}

      {canManage && isEditing ? (
        <form onSubmit={handleSubmit} className="mt-2.5 space-y-2.5">
          <MatchAvailabilitySuggestions
            leagueId={leagueId}
            seasonId={seasonId}
            playerIds={playerIds}
            players={players}
            roundStartsAt={roundStartsAt}
            roundEndsAt={roundEndsAt}
            onUseSuggestion={(dateTimeLocalValue) => {
              hasUserChangedScheduledAtRef.current = true;
              autoScheduledAtValueRef.current = null;
              setScheduledAtValue(dateTimeLocalValue);
              setActionError(null);

              window.requestAnimationFrame(() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              });
            }}
            onDefaultSuggestionReady={applyAutomaticScheduledAtValue}
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.scheduleDateLabel}
              </span>

              <input
                type="datetime-local"
                value={scheduledAtValue}
                onChange={(event) => {
                  hasUserChangedScheduledAtRef.current = true;
                  autoScheduledAtValueRef.current = null;
                  setScheduledAtValue(event.target.value);
                }}
                disabled={isSaving}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>

            {hasAvailableLocations ? (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                  {t.matchDetail.scheduleLocation}
                </span>

                <select
                  value={selectedLocation}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  disabled={isSaving}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
                >
                  <option value="">
                    {t.matchDetail.scheduleLocationPlaceholder}
                  </option>

                  {normalizedAvailableLocations.map((availableLocation) => (
                    <option
                      key={availableLocation.id}
                      value={availableLocation.id}
                    >
                      {getLeagueLocationOptionLabel(availableLocation)}
                    </option>
                  ))}

                  <option value={otherLocationValue}>
                    {t.matchDetail.otherLocation}
                  </option>
                </select>
              </label>
            ) : null}
          </div>

          {shouldSelectCourt ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.scheduleCourt}
              </span>

              <select
                value={selectedCourt}
                onChange={(event) => setSelectedCourt(event.target.value)}
                disabled={isSaving}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              >
                <option value="">{t.matchDetail.scheduleCourtPlaceholder}</option>
                {selectedLocationCourts.map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {selectedLocation === otherLocationValue ? (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                {t.matchDetail.customLocation}
              </span>

              <input
                value={customLocation}
                onChange={(event) => setCustomLocation(event.target.value)}
                disabled={isSaving}
                placeholder={t.matchDetail.customLocationPlaceholder}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              />
            </label>
          ) : null}

          {isOutsideRoundWindow ? (
            <div className="rounded-lg bg-orange-100 p-2 text-xs text-orange-900">
              <p className="font-black">{t.rounds.outsideWindowTitle}</p>
              <p className="mt-0.5 font-semibold">
                {t.rounds.outsideWindowDescription}
              </p>
            </div>
          ) : null}

          <div className="flex gap-2">
            {(hasSchedule || isPostponed) && !isFinished ? (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-black text-neutral-800 shadow-sm disabled:text-neutral-400"
              >
                {t.matchDetail.cancelScheduleEdit}
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isSaving
                ? "Guardando..."
                : hasSchedule || isPostponed
                  ? t.matchDetail.saveScheduleChanges
                  : t.matchDetail.saveSchedule}
            </button>
          </div>

          {canPostpone ? (
            <button
              type="button"
              onClick={handlePostpone}
              disabled={!canPostpone}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-black text-neutral-700 shadow-sm disabled:text-neutral-300"
            >
              {isSaving ? "Guardando..." : t.matchDetail.postponeButton}
            </button>
          ) : null}

          {canClearCurrentSchedule ? (
            <button
              type="button"
              onClick={handleClearSchedule}
              disabled={!canClearCurrentSchedule}
              className="w-full rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 shadow-sm disabled:text-red-300"
            >
              {isSaving
                ? t.matchDetail.clearingSchedule
                : t.matchDetail.clearScheduleButton}
            </button>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
