"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PlayerProfile } from "@/data/fakeData";
import { useMatchData } from "@/context/MatchDataProvider";
import { MatchAvailabilitySuggestions } from "@/components/match/MatchAvailabilitySuggestions";
import { AppCard } from "@/components/ui/AppCard";
import { useI18n } from "@/i18n/I18nProvider";
import {
  createLeagueLocation,
  createScheduledLeagueLocationValue,
  findLeagueLocationByScheduleLocation,
  getLeagueLocationIdentityKey,
  getLeagueLocationCourts,
  getLeagueLocationMapsUrl,
  getLeagueLocationScheduleText,
  getLeagueLocationSubtitle,
  getLeagueLocationTownNameLabel,
  getScheduleLocationFallbackText,
  getScheduleLocationMapsUrl,
  normalizeLeagueLocations,
  normalizeMapsUrl,
  sortLeagueLocationsByTownNameLabel,
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
  coordinationAction?: ReactNode;
  availabilityRecommendationsEnabled?: boolean;
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
  coordinationAction,
  availabilityRecommendationsEnabled = false,
}: MatchScheduleFormProps) {
  const { t } = useI18n();
  const { updateMatchSchedule, postponeMatch, clearMatchSchedule } = useMatchData();
  const [addedLeagueLocations, setAddedLeagueLocations] = useState<LeagueLocation[]>([]);
  const [globalLocations, setGlobalLocations] = useState<LeagueLocation[]>([]);
  const [loadingGlobalLocations, setLoadingGlobalLocations] = useState(true);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const locationSearchInputRef = useRef<HTMLInputElement>(null);
  const [isAddingLeagueLocation, setIsAddingLeagueLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationTown, setNewLocationTown] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [newLocationCourtCount, setNewLocationCourtCount] = useState("");
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const recommendedLocations = useMemo(
    () =>
      sortLeagueLocationsByTownNameLabel(
        normalizeLeagueLocations(availableLocations),
      ),
    [availableLocations],
  );
  const recommendedIdentityKeys = useMemo(
    () =>
      new Set(
        recommendedLocations.map((recommendedLocation) =>
          getLeagueLocationIdentityKey(recommendedLocation),
        ),
      ),
    [recommendedLocations],
  );
  const normalizedAvailableLocations = useMemo(
    () =>
      sortLeagueLocationsByTownNameLabel(
        normalizeLeagueLocations([
          ...globalLocations,
          ...availableLocations,
          ...addedLeagueLocations,
        ]),
      ),
    [addedLeagueLocations, availableLocations, globalLocations],
  );
  const hasAvailableLocations = normalizedAvailableLocations.length > 0;
  const filteredAvailableLocations = useMemo(() => {
    const query = locationSearch.trim().toLocaleLowerCase("es-ES");
    if (!query) return normalizedAvailableLocations;
    return normalizedAvailableLocations.filter((availableLocation) =>
      [
        getLeagueLocationTownNameLabel(availableLocation),
        getLeagueLocationSubtitle(availableLocation),
        availableLocation.address,
        availableLocation.town,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase("es-ES").includes(query)),
    );
  }, [locationSearch, normalizedAvailableLocations]);
  const recommendedFilteredLocations = useMemo(
    () =>
      filteredAvailableLocations.filter((availableLocation) =>
        recommendedIdentityKeys.has(getLeagueLocationIdentityKey(availableLocation)),
      ),
    [filteredAvailableLocations, recommendedIdentityKeys],
  );
  const otherFilteredLocations = useMemo(
    () =>
      filteredAvailableLocations.filter(
        (availableLocation) =>
          !recommendedIdentityKeys.has(getLeagueLocationIdentityKey(availableLocation)),
      ),
    [filteredAvailableLocations, recommendedIdentityKeys],
  );

  const isFinished = status === "finished";
  const isPostponed = status === "postponed";
  const hasSchedule =
    !isPostponed && Boolean(scheduledAt || dateLabel || location);
  const isUnscheduled =
    (status === "scheduling" || (isFinished && canManage)) && !hasSchedule;

  const scheduledLeagueLocation = findLeagueLocationByScheduleLocation({
    locations: normalizedAvailableLocations,
    scheduleLocation: location,
  });

  const initialLocationValue = scheduledLeagueLocation
    ? scheduledLeagueLocation.id
    : hasSchedule && location
      ? otherLocationValue
      : "";

  const [isPanelOpen, setIsPanelOpen] = useState(
    isUnscheduled || (isPostponed && canManage),
  );
  const [isEditing, setIsEditing] = useState(isUnscheduled && canManage);
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
    hasSchedule && location && !scheduledLeagueLocation
      ? (getScheduleLocationFallbackText(location) ?? "")
      : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/locations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { locations?: LeagueLocation[] };
        if (!response.ok) throw new Error("global_locations_lookup_failed");
        return sortLeagueLocationsByTownNameLabel(
          normalizeLeagueLocations(payload.locations ?? []),
        );
      })
      .then((locations) => {
        if (cancelled) return;
        setGlobalLocations(locations);
        const scheduledGlobalLocation = findLeagueLocationByScheduleLocation({
          locations,
          scheduleLocation: location,
        });
        if (scheduledGlobalLocation) {
          setSelectedLocation((current) => current || scheduledGlobalLocation.id);
          setSelectedCourt(
            (current) => current || scheduledGlobalLocation.selectedCourt || "",
          );
        }
      })
      .catch(() => {
        if (!cancelled) setGlobalLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGlobalLocations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  useEffect(() => {
    if (!isLocationPickerOpen) return;
    const frame = window.requestAnimationFrame(() => locationSearchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isLocationPickerOpen]);

  const applyAutomaticScheduledAtValue = useCallback(
    (nextValue: string) => {
      if (
        isFinished ||
        hasSchedule ||
        !isEditing ||
        hasUserChangedScheduledAtRef.current
      ) {
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
    [hasSchedule, isEditing, isFinished],
  );

  useEffect(() => {
    if (
      hasInitializedDefaultSchedule.current ||
      isFinished ||
      hasSchedule ||
      !isEditing
    ) {
      return;
    }

    applyAutomaticScheduledAtValue(formatNextFullHourForDateTimeInput());
    hasInitializedDefaultSchedule.current = true;
  }, [applyAutomaticScheduledAtValue, hasSchedule, isEditing, isFinished]);

  const selectedLeagueLocation = normalizedAvailableLocations.find(
    (availableLocation) => availableLocation.id === selectedLocation,
  );
  const selectedLocationLabel = selectedLeagueLocation
    ? getLeagueLocationTownNameLabel(selectedLeagueLocation)
    : selectedLocation === otherLocationValue
      ? customLocation.trim() || "Otra ubicación"
      : "Seleccionar ubicación";
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

  const cleanNewLocationAddress = newLocationAddress.trim();
  const newLocationMapsUrl = normalizeMapsUrl(cleanNewLocationAddress);
  const newLocationDraft = useMemo(
    () =>
      createLeagueLocation({
        name: newLocationName,
        town: newLocationTown,
        address: newLocationMapsUrl ? null : cleanNewLocationAddress,
        courtCount: newLocationCourtCount
          ? Number.parseInt(newLocationCourtCount, 10)
          : null,
        selectedCourt: null,
        googlePlaceId: null,
        googlePlaceName: null,
        googleMapsUrl: newLocationMapsUrl,
        latitude: null,
        longitude: null,
      }),
    [
      cleanNewLocationAddress,
      newLocationCourtCount,
      newLocationMapsUrl,
      newLocationName,
      newLocationTown,
    ],
  );

  const canSave =
    canManage &&
    !isSaving &&
    scheduledAtValue.trim().length > 0 &&
    finalLocation.length > 0 &&
    (!shouldSelectCourt || selectedCourt.trim().length > 0);
  const canPostpone =
    canManage && !isSaving && !isFinished && !isPostponed && hasSchedule;
  const canClearCurrentSchedule =
    canClearSchedule && !isSaving && hasSchedule && !isFinished;
  const canExpandScheduleActions =
    canManage && hasSchedule && !isPostponed;

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
  const customLocationCheckUrl =
    !hasAvailableLocations && selectedLocation === otherLocationValue
      ? getScheduleLocationMapsUrl(customLocation)
      : null;

  function closeLocationPicker() {
    setIsLocationPickerOpen(false);
    setLocationSearch("");
    setIsAddingLeagueLocation(false);
  }

  function handleLocationChange(value: string) {
    setSelectedLocation(value);
    setActionError(null);
    closeLocationPicker();

    const nextLocation = normalizedAvailableLocations.find(
      (availableLocation) => availableLocation.id === value,
    );
    const nextCourts = nextLocation ? getLeagueLocationCourts(nextLocation) : [];

    setSelectedCourt(nextCourts.length === 1 ? nextCourts[0] : "");
  }

  async function handleCreateLeagueLocation() {
    if (!newLocationDraft || isSavingLocation || isSaving) {
      return;
    }

    const duplicated = normalizedAvailableLocations.some(
      (availableLocation) =>
        getLeagueLocationIdentityKey(availableLocation) ===
        getLeagueLocationIdentityKey(newLocationDraft),
    );

    if (duplicated) {
      setActionError("Esa ubicación ya existe en la app. Búscala y selecciónala.");
      return;
    }

    setIsSavingLocation(true);
    setActionError(null);

    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: newLocationDraft }),
      });
      const payload = (await response.json().catch(() => null)) as {
        location?: LeagueLocation;
        error?: string;
      } | null;

      if (!response.ok || !payload?.location) {
        throw new Error(payload?.error ?? "global_location_save_failed");
      }

      const savedLocation = { ...payload.location, selectedCourt: null };

      setAddedLeagueLocations((current) =>
        normalizeLeagueLocations([...current, savedLocation]),
      );
      setSelectedLocation(savedLocation.id);
      const courts = getLeagueLocationCourts(savedLocation);
      setSelectedCourt(courts.length === 1 ? courts[0] : "");
      setLocationSearch("");
      setNewLocationName("");
      setNewLocationTown("");
      setNewLocationAddress("");
      setNewLocationCourtCount("");
      setIsAddingLeagueLocation(false);
      setIsLocationPickerOpen(false);
    } catch {
      setActionError(
        "No se ha podido guardar la nueva ubicación. Revisa los datos e inténtalo de nuevo.",
      );
    } finally {
      setIsSavingLocation(false);
    }
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
    setIsPanelOpen(false);
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
      hasSchedule && location && !scheduledLeagueLocation
        ? (getScheduleLocationFallbackText(location) ?? "")
        : "",
    );
    setActionError(null);
    autoScheduledAtValueRef.current = null;
    hasUserChangedScheduledAtRef.current = false;
    setIsEditing(false);

    if (!hasSchedule && !isPostponed) {
      setIsPanelOpen(true);
    }
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
    setSelectedLocation("");
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
    setSelectedLocation("");
    setSelectedCourt("");
    setCustomLocation("");
    autoScheduledAtValueRef.current = null;
    hasUserChangedScheduledAtRef.current = false;
    setIsEditing(canManage);
    setIsPanelOpen(true);
  }

  function togglePanel() {
    if (!canExpandScheduleActions || isSaving) {
      return;
    }

    if (isPanelOpen) {
      if (isEditing) {
        handleCancel();
      }
      setIsPanelOpen(false);
      return;
    }

    setIsPanelOpen(true);
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

  function renderLocationOption(availableLocation: LeagueLocation) {
    const selected = selectedLocation === availableLocation.id;
    return (
      <button
        key={availableLocation.id}
        type="button"
        onClick={() => handleLocationChange(availableLocation.id)}
        disabled={isSaving || isSavingLocation}
        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
          selected
            ? "border-neutral-950 bg-neutral-950 text-white"
            : "border-neutral-200 bg-white text-neutral-900 active:bg-neutral-50"
        }`}
      >
        <span className="block truncate text-xs font-black">
          {getLeagueLocationTownNameLabel(availableLocation)}
        </span>
        <span
          className={`mt-0.5 block truncate type-caption font-semibold ${
            selected ? "text-neutral-300" : "text-neutral-500"
          }`}
        >
          {getLeagueLocationSubtitle(availableLocation)}
        </span>
      </button>
    );
  }


  return (
    <AppCard accentStrip className="app-schedule-card overflow-hidden !p-0">
      {canExpandScheduleActions ? (
        <button
          type="button"
          onClick={togglePanel}
          disabled={isSaving}
          aria-expanded={isPanelOpen}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition active:bg-neutral-50 disabled:text-neutral-400"
        >
          <p className="truncate type-panel-title text-neutral-950">
            {getTitle()}
          </p>

          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className={`h-4 w-4 transition-transform ${isPanelOpen ? "rotate-180" : ""}`}
            >
              <path
                d="m6 8 4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      ) : (
        <div className="flex w-full items-center px-3 py-2.5">
          <p className="truncate type-panel-title text-neutral-950">
            {getTitle()}
          </p>
        </div>
      )}

      {hasSchedule ? (
        <div className="px-3 pb-3 pt-1">
          <div className="rounded-lg bg-neutral-100 px-2.5 py-2 text-sm">
            <p className="font-black text-neutral-950">
              {capitalizeFirstLetter(dateLabel) ?? t.matches.pendingDate}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-600">
              {displayedLocationText ?? t.matches.missingSchedule}
            </p>

            {!isFinished && (directionsUrl || calendarAction) ? (
              <div className="mt-2 flex gap-2">
                {directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 rounded-lg border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white transition active:scale-[0.99] items-center justify-center"
                  >
                    {t.matchDetail.directionsButton}
                  </a>
                ) : null}

                {calendarAction ? calendarAction : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isPanelOpen ? (
        <div
          className={`px-3 pb-3 ${hasSchedule ? "pt-0" : "pt-1"}`}
        >
          {canManage && !isEditing ? (
            <div className="flex flex-wrap justify-end gap-1.5">
              {isPostponed ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isSaving}
                  className="inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full bg-neutral-950 px-2.5 type-caption font-black text-white transition active:scale-[0.98] disabled:bg-neutral-300 text-center"
                >
                  {t.matchDetail.rescheduleButton}
                </button>
              ) : hasSchedule ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    disabled={isSaving}
                    className="inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-neutral-200 bg-white px-2.5 type-caption font-black text-neutral-800 shadow-sm transition active:bg-neutral-50 disabled:text-neutral-400 text-center"
                  >
                    {t.matchDetail.editScheduleButton}
                  </button>
                  {!isFinished ? (
                    <button
                      type="button"
                      onClick={handlePostpone}
                      disabled={!canPostpone}
                      className="inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-2.5 type-caption font-black text-orange-800 transition active:bg-orange-100 disabled:border-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-300 text-center"
                    >
                      {isSaving
                        ? t.matchDetail.saving
                        : t.matchDetail.postponeButton}
                    </button>
                  ) : null}
                  {canClearCurrentSchedule ? (
                    <button
                      type="button"
                      onClick={handleClearSchedule}
                      disabled={!canClearCurrentSchedule}
                      className="inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-red-100 bg-red-50 px-2.5 type-caption font-black text-red-700 transition active:bg-red-100 disabled:text-red-300 text-center"
                    >
                      {isSaving
                        ? t.matchDetail.clearingSchedule
                        : t.matchDetail.clearScheduleButton}
                    </button>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isSaving}
                  className="inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full bg-neutral-950 px-2.5 type-caption font-black text-white transition active:scale-[0.98] disabled:bg-neutral-300 text-center"
                >
                  {t.matchDetail.addScheduleButton}
                </button>
              )}
            </div>
          ) : null}

          {!hasSchedule && !isEditing ? (
            <div className="rounded-lg bg-neutral-100 px-2.5 py-2 text-sm">
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
              {coordinationAction ? <div className="mt-2">{coordinationAction}</div> : null}
            </div>
          ) : null}

          {actionError ? (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
              {actionError}
            </p>
          ) : null}

          {canManage && isEditing ? (
            <form onSubmit={handleSubmit} className="mt-1.5 space-y-2.5">
              {!isFinished && availabilityRecommendationsEnabled ? (
                <MatchAvailabilitySuggestions
                  matchId={matchId}
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
              ) : null}

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

                <div className="min-w-0">
                  <span className="text-xs font-black uppercase tracking-wide text-neutral-600">{t.matchDetail.scheduleLocation}</span>
                  <button type="button" aria-haspopup="dialog" aria-expanded={isLocationPickerOpen} onClick={() => setIsLocationPickerOpen(true)} disabled={isSaving || isSavingLocation} className="mt-1 flex w-full min-w-0 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-sm font-semibold text-neutral-900 shadow-sm transition active:bg-neutral-50 disabled:bg-neutral-100">
                    <span className={`min-w-0 flex-1 truncate ${selectedLocation ? "text-neutral-900" : "text-neutral-400"}`}>{selectedLocationLabel}</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  </button>
                  {isLocationPickerOpen && typeof document !== "undefined" ? createPortal(<>
                    <button type="button" aria-label="Cerrar buscador de ubicaciones" onClick={closeLocationPicker} className="fixed inset-0 z-[100] bg-neutral-950/45 backdrop-blur-[1px]" />
                    <section role="dialog" aria-modal="true" aria-label="Buscar ubicación" className="fixed left-1/2 z-[110] flex w-[min(360px,calc(100vw-28px))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl" style={{ top: "max(14px, calc(env(safe-area-inset-top, 0px) + 10px))", maxHeight: "min(440px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 28px))" }}>
                      <div className="shrink-0 border-b border-neutral-100 px-3 pb-2.5 pt-3">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black text-neutral-950">Seleccionar ubicación</p><p className="type-caption font-semibold text-neutral-400">{normalizedAvailableLocations.length} disponibles</p></div><button type="button" onClick={closeLocationPicker} aria-label="Cerrar" className="grid h-7 w-7 place-items-center rounded-full bg-neutral-100 text-sm font-black text-neutral-500">×</button></div>
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 focus-within:border-neutral-400 focus-within:bg-white">
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                          <input ref={locationSearchInputRef} type="search" value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") closeLocationPicker(); if (event.key === "Enter") event.preventDefault() }} disabled={isSaving || isSavingLocation} placeholder={loadingGlobalLocations ? "Cargando ubicaciones..." : "Buscar por localidad o nombre..."} className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2.5 text-sm font-semibold outline-none" />
                          {locationSearch ? <button type="button" onClick={() => setLocationSearch("")} aria-label="Borrar búsqueda" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-center text-xs font-black text-neutral-600">×</button> : null}
                        </div>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                        {isAddingLeagueLocation ? <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5"><p className="text-sm font-black text-neutral-900">Nueva ubicación</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">Se guardará en el catálogo global de Smash & Lob.</p>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} placeholder="Nombre del club" disabled={isSavingLocation} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400" />
                            <input value={newLocationTown} onChange={(event) => setNewLocationTown(event.target.value)} placeholder="Localidad" disabled={isSavingLocation} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400" />
                            <input value={newLocationAddress} onChange={(event) => setNewLocationAddress(event.target.value)} placeholder="Dirección o enlace de Google Maps" disabled={isSavingLocation} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400 sm:col-span-2" />
                            <input value={newLocationCourtCount} onChange={(event) => setNewLocationCourtCount(event.target.value.replace(/[^0-9]/g, "").slice(0, 2))} inputMode="numeric" placeholder="Número de pistas (opcional)" disabled={isSavingLocation} className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold outline-none focus:border-neutral-400" />
                            <button type="button" onClick={handleCreateLeagueLocation} disabled={!newLocationDraft || isSavingLocation} className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-3 py-2 text-center text-sm font-black text-white disabled:bg-neutral-300">{isSavingLocation ? "Guardando..." : "Guardar y seleccionar"}</button>
                          </div>
                        </div> : <>
                          {recommendedLocations.length > 0 && recommendedFilteredLocations.length > 0 ? <div className="mb-2 overflow-hidden rounded-xl border border-neutral-200"><p className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5 type-caption font-black uppercase tracking-wide text-neutral-500">Recomendadas por la liga</p><div className="space-y-1 p-1">{recommendedFilteredLocations.map(renderLocationOption)}</div></div> : null}
                          {!loadingGlobalLocations && recommendedLocations.length > 0 && otherFilteredLocations.length > 0 ? <div className="mb-2 overflow-hidden rounded-xl border border-neutral-200"><p className="border-b border-neutral-100 bg-neutral-50 px-2.5 py-1.5 type-caption font-black uppercase tracking-wide text-neutral-500">Todas las ubicaciones</p><div className="space-y-1 p-1">{otherFilteredLocations.map(renderLocationOption)}</div></div> : null}
                          {!loadingGlobalLocations && recommendedLocations.length === 0 ? <div className="space-y-1">{filteredAvailableLocations.map(renderLocationOption)}</div> : null}
                          {loadingGlobalLocations ? <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">Cargando el catálogo global...</p> : null}
                          {!loadingGlobalLocations && filteredAvailableLocations.length === 0 ? <p className="px-2 py-4 text-center type-caption font-semibold text-neutral-500">No hay ubicaciones que coincidan con la búsqueda.</p> : null}
                        </>}
                      </div>
                      <div className="shrink-0 border-t border-neutral-100 bg-white p-2">
                        <button type="button" onClick={() => setIsAddingLeagueLocation((current) => !current)} disabled={isSaving || isSavingLocation} className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center text-sm font-black text-neutral-800 disabled:text-neutral-400">{isAddingLeagueLocation ? "Cancelar nueva ubicación" : "+ Añadir nueva ubicación"}</button>
                      </div>
                    </section>
                  </>, document.body) : null}
                </div>
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
                    <option value="">
                      {t.matchDetail.scheduleCourtPlaceholder}
                    </option>
                    {selectedLocationCourts.map((court) => (
                      <option key={court} value={court}>
                        {court}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {selectedLocation === otherLocationValue ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-neutral-600">
                      {t.matchDetail.customLocation}
                    </span>

                    <input
                      value={customLocation}
                      onChange={(event) => {
                        setCustomLocation(event.target.value);
                        setActionError(null);
                      }}
                      disabled={isSaving}
                      placeholder={t.matchDetail.customLocationPlaceholder}
                      className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
                    />
                  </label>

                  {!hasAvailableLocations ? (
                    <a
                      href={customLocationCheckUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!customLocationCheckUrl}
                      className={`block w-full rounded-lg border px-2.5 py-1.5 text-center text-xs font-black shadow-sm ${
                        customLocationCheckUrl
                          ? "border-neutral-200 bg-neutral-50 text-neutral-800"
                          : "pointer-events-none border-neutral-200 bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      {t.matchDetail.checkAddressButton}
                    </a>
                  ) : null}
                </div>
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
                {!isFinished && (hasSchedule || isPostponed) ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="inline-flex flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-black text-neutral-800 shadow-sm disabled:text-neutral-400 items-center justify-center text-center"
                  >
                    {t.matchDetail.cancelScheduleEdit}
                  </button>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSave}
                  className="inline-flex flex-1 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
                >
                  {isSaving
                    ? t.matchDetail.saving
                    : hasSchedule || isPostponed
                      ? t.matchDetail.saveScheduleChanges
                      : t.matchDetail.saveSchedule}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </AppCard>
  );
}
