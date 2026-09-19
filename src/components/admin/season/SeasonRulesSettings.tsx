"use client"

import Link from "next/link"
import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { type CalendarVisibilityMode, RoundWindowMode, type SeasonRoundSettings, useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { revealSupabaseSeasonRound, updateSupabaseSeasonRoundSettings } from "@/lib/supabaseSeasons"
import { showActionFeedback } from "@/lib/actionFeedback"
import { type LeagueLocation, createScheduledLeagueLocationValue, findLeagueLocationByScheduleLocation, getLeagueLocationTownNameLabel, sortLeagueLocationsByTownNameLabel } from "@/lib/leagueLocations"
import type { MvpSystem } from "@/lib/mvp"
import type { ResultConfirmationMode } from "@/lib/resultConfirmations"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { getEffectiveRevealedThroughRound } from "@/lib/progressiveCalendar"
import { datetimeLocalToIso, formatNextScheduledStartForInput, toDatetimeLocalValue } from "@/lib/seasonScheduling"

const lastSupabaseErrorStorageKey = "smash-lob-last-supabase-error"
const supabaseUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isSupabaseBackedId=(id:string)=>supabaseUuidPattern.test(id)
const showSavedFeedback=(message:string)=>showActionFeedback({tone:"success",message})
function recordSupabaseError(action:string,error:unknown){try{window.localStorage.setItem(lastSupabaseErrorStorageKey,JSON.stringify({action,message:error instanceof Error?error.message:String(error),at:new Date().toISOString()}))}catch{}}
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


export function RequiresThreeSetsSettingsPanel({
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
export function RoundWindowSettingsPanel({
  activeLeagueId,
  roundSettings,
  locations,
  canEditOpening = false,
}: {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
  locations: LeagueLocation[];
  canEditOpening?: boolean;
}) {
  const { t, tx } = useI18n();
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [selectedMode, setSelectedMode] = useState<RoundWindowMode>(
    roundSettings.roundWindowMode,
  );
  const [seasonStartsAt, setSeasonStartsAt] = useState(
    roundSettings.seasonStartsAt ?? "",
  );
  const [openingRoundEnabled, setOpeningRoundEnabled] = useState(
    roundSettings.openingRoundEnabled === true,
  );
  const [openingRoundAt, setOpeningRoundAt] = useState(
    toDatetimeLocalValue(roundSettings.openingRoundAt),
  );
  const initialOpeningLocation = findLeagueLocationByScheduleLocation({
    locations,
    scheduleLocation: roundSettings.openingRoundLocation,
  });
  const [openingRoundLocationId, setOpeningRoundLocationId] = useState(
    initialOpeningLocation?.id ?? "",
  );
  const sortedOpeningLocations = sortLeagueLocationsByTownNameLabel(locations);
  const selectedOpeningLocation =
    sortedOpeningLocations.find((location) => location.id === openingRoundLocationId) ?? null;
  const openingRoundLocation = selectedOpeningLocation
    ? createScheduledLeagueLocationValue(selectedOpeningLocation, null)
    : null;
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
  const openingRoundIso = datetimeLocalToIso(openingRoundAt);
  const scheduledOpeningRoundIso = roundSettings.scheduledStartAt ?? null;
  const effectiveOpeningRoundIso = scheduledOpeningRoundIso ?? openingRoundIso;
  const isValid =
    (selectedMode === "none" ||
      (seasonStartsAt.length > 0 && normalizedDays !== null)) &&
    (!openingRoundEnabled || Boolean(effectiveOpeningRoundIso && openingRoundLocation));
  const hasChanges =
    selectedMode !== roundSettings.roundWindowMode ||
    (selectedMode === "fixed-days" &&
      (seasonStartsAt !== (roundSettings.seasonStartsAt ?? "") ||
        normalizedDays !== roundSettings.roundWindowDays)) ||
    (selectedMode === "none" &&
      (roundSettings.seasonStartsAt !== null ||
        roundSettings.roundWindowDays !== null)) ||
    (canEditOpening &&
      (openingRoundEnabled !== (roundSettings.openingRoundEnabled === true) ||
        (openingRoundEnabled
          ? effectiveOpeningRoundIso !== (roundSettings.openingRoundAt ?? null) ||
            openingRoundLocation !== (roundSettings.openingRoundLocation ?? null)
          : Boolean(roundSettings.openingRoundAt || roundSettings.openingRoundLocation))));

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
      openingRoundEnabled: canEditOpening
        ? openingRoundEnabled
        : roundSettings.openingRoundEnabled === true,
      openingRoundAt: canEditOpening
        ? openingRoundEnabled
          ? effectiveOpeningRoundIso
          : null
        : roundSettings.openingRoundAt ?? null,
      openingRoundLocation: canEditOpening
        ? openingRoundEnabled
          ? openingRoundLocation
          : null
        : roundSettings.openingRoundLocation ?? null,
      scheduledStartAt: roundSettings.scheduledStartAt ?? null,
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

      <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={openingRoundEnabled}
            disabled={!canEditOpening}
            onChange={(event) => {
              const checked = event.target.checked;
              setOpeningRoundEnabled(checked);
              if (checked && !roundSettings.scheduledStartAt && !openingRoundAt) {
                setOpeningRoundAt(formatNextScheduledStartForInput());
              }
              setError(null);
            }}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-black text-neutral-950">
              {t.adminSeason.openingRoundTitle}
            </span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
              {t.adminSeason.openingRoundDescription}
            </span>
          </span>
        </label>

        {openingRoundEnabled ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {roundSettings.scheduledStartAt ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                  {t.adminSeason.openingRoundDateTime}
                </span>
                <p className="mt-2 text-sm font-black text-neutral-950">
                  {toDatetimeLocalValue(roundSettings.scheduledStartAt).replace("T", " · ")}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
                  {t.adminSeason.openingRoundScheduledStartHelp}
                </p>
              </div>
            ) : (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                  {t.adminSeason.openingRoundDateTime}
                </span>
                <input
                  type="datetime-local"
                  step={3600}
                  value={openingRoundAt}
                  disabled={!canEditOpening}
                  onFocus={() => {
                    if (!openingRoundAt) setOpeningRoundAt(formatNextScheduledStartForInput());
                  }}
                  onChange={(event) => {
                    setOpeningRoundAt(event.target.value);
                    setError(null);
                  }}
                  className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
                />
              </label>
            )}
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
                {t.adminSeason.openingRoundLocation}
              </span>
              <select
                value={openingRoundLocationId}
                disabled={!canEditOpening}
                onChange={(event) => {
                  setOpeningRoundLocationId(event.target.value);
                  setError(null);
                }}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
              >
                <option value="">{t.adminSeason.openingRoundLocationPlaceholder}</option>
                {sortedOpeningLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {getLeagueLocationTownNameLabel(location)}
                  </option>
                ))}
              </select>
            </label>
            <span className="sm:col-span-2 block text-xs font-semibold leading-5 text-neutral-500">
              {t.adminSeason.openingRoundAutoScheduleHelp}
            </span>
          </div>
        ) : null}

        {!canEditOpening ? (
          <p className="mt-2 text-xs font-semibold text-neutral-500">
            {t.adminSeason.openingRoundLocked}
          </p>
        ) : null}
      </div>

      {isFixedDaysMode ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-neutral-500">
              {openingRoundEnabled ? t.adminSeason.regularLeagueStart : t.adminSeason.seasonStartDate}
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

export function ProgressiveCalendarSettingsPanel({
  activeLeagueId,
  activeSeason,
  roundSettings,
  matches,
}: {
  activeLeagueId: string;
  activeSeason: { id: string; totalRounds: number; status?: "upcoming" | "active" | "finished" };
  roundSettings: SeasonRoundSettings;
  matches: ReturnType<typeof useCurrentLeagueData>["matches"];
}) {
  const { t } = useI18n();
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [selectedMode, setSelectedMode] = useState<CalendarVisibilityMode>(
    roundSettings.calendarVisibilityMode === "progressive" ? "progressive" : "full",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seasonStatus = activeSeason.status ?? "active";
  const effectiveRevealed = getEffectiveRevealedThroughRound({
    seasonStatus,
    totalRounds: activeSeason.totalRounds,
    settings: { ...roundSettings, calendarVisibilityMode: selectedMode },
    matches: matches.filter((match) => match.seasonId === activeSeason.id),
  });
  const nextRound = Math.min(activeSeason.totalRounds, effectiveRevealed + 1);
  const canRevealNext =
    selectedMode === "progressive" && effectiveRevealed < activeSeason.totalRounds;
  const hasModeChanges = selectedMode !== (roundSettings.calendarVisibilityMode ?? "full");

  async function saveMode() {
    if (isSaving || !hasModeChanges) return;
    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      calendarVisibilityMode: selectedMode,
      revealedThroughRound:
        selectedMode === "progressive" ? roundSettings.revealedThroughRound ?? 0 : 0,
    };
    setIsSaving(true);
    setError(null);
    try {
      if (isSupabaseBackedId(activeSeason.id)) {
        await updateSupabaseSeasonRoundSettings(nextSettings);
      }
      updateSeasonRoundSettings(nextSettings);
      showSavedFeedback(
        selectedMode === "progressive"
          ? t.adminSeason.calendarVisibilityProgressiveEnabled
          : t.adminSeason.calendarVisibilityFullEnabled,
      );
    } catch (caughtError) {
      recordSupabaseError("update-progressive-calendar", caughtError);
      setError(t.adminSeason.calendarVisibilitySaveError);
    } finally {
      setIsSaving(false);
    }
  }

  async function revealNext() {
    if (isSaving || !canRevealNext) return;
    const confirmed = window.confirm(
      `Se revelarán los emparejamientos de la Jornada ${nextRound}. Esta acción no se puede deshacer. ¿Continuar?`,
    );
    if (!confirmed) return;
    setIsSaving(true);
    setError(null);
    try {
      let revealedThroughRound = nextRound;
      if (isSupabaseBackedId(activeSeason.id)) {
        const payload = await revealSupabaseSeasonRound({
          leagueId: activeLeagueId,
          seasonId: activeSeason.id,
          round: nextRound,
        });
        revealedThroughRound = payload.revealedThroughRound ?? nextRound;
      }
      updateSeasonRoundSettings({
        ...roundSettings,
        leagueId: activeLeagueId,
        calendarVisibilityMode: "progressive",
        revealedThroughRound: Math.max(
          roundSettings.revealedThroughRound ?? 0,
          revealedThroughRound,
        ),
      });
      showSavedFeedback(`Jornada ${nextRound} revelada a los jugadores.`);
    } catch (caughtError) {
      recordSupabaseError("reveal-progressive-round", caughtError);
      setError("No se ha podido revelar la siguiente jornada.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppCard>
      <p className="font-bold">{t.adminSeason.calendarVisibilityTitle}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {t.adminSeason.calendarVisibilityDescription}
      </p>

      <div className="mt-3 space-y-2">
        {([
          ["full", t.adminSeason.calendarVisibilityFullTitle, t.adminSeason.calendarVisibilityFullDescription],
          ["progressive", t.adminSeason.calendarVisibilityProgressiveTitle, t.adminSeason.calendarVisibilityProgressiveDescription],
        ] as const).map(([mode, title, description]) => (
          <label
            key={mode}
            className={`flex items-start gap-3 rounded-2xl border p-3 ${
              selectedMode === mode ? "border-neutral-950 bg-neutral-100" : "border-neutral-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="calendarVisibilityMode"
              checked={selectedMode === mode}
              onChange={() => {
                setSelectedMode(mode);
                setError(null);
              }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-black text-neutral-950">{title}</span>
              <span
                className={`mt-1 block text-xs font-semibold leading-5 ${
                  selectedMode === mode ? "text-neutral-700" : "text-neutral-500"
                }`}
              >
                {description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={saveMode}
        disabled={isSaving || !hasModeChanges}
        className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {isSaving ? t.adminSeason.calendarVisibilitySaving : t.adminSeason.calendarVisibilitySave}
      </button>

      {selectedMode === "progressive" ? (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">{t.adminSeason.calendarVisibilityVisibleNow}</p>
              <p className="mt-1 text-sm font-black text-neutral-950">
                {effectiveRevealed > 0
                  ? t.adminSeason.calendarVisibilityThroughRound.replace("{round}", String(effectiveRevealed))
                  : t.adminSeason.calendarVisibilityNoneRevealed}
              </p>
            </div>
            <span className="rounded-full bg-neutral-200 px-2.5 py-1 text-xs font-black text-neutral-700">
              {effectiveRevealed}/{activeSeason.totalRounds}
            </span>
          </div>
          {canRevealNext ? (
            <button
              type="button"
              onClick={revealNext}
              disabled={isSaving || hasModeChanges}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-neutral-950 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950 disabled:border-neutral-200 disabled:text-neutral-400"
            >
              {t.adminSeason.calendarVisibilityRevealRound.replace("{round}", String(nextRound))}
            </button>
          ) : (
            <p className="mt-2 text-xs font-semibold text-neutral-500">
              {t.adminSeason.calendarVisibilityAllRevealed}
            </p>
          )}
          {hasModeChanges ? (
            <p className="mt-2 text-xs font-semibold text-neutral-500">
              {t.adminSeason.calendarVisibilitySaveFirst}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{error}</p> : null}
    </AppCard>
  );
}

export function ResultConfirmationSettingsPanel({
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

export function MvpSystemSettingsPanel({
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

export function RegistrationFeeSettingsPanel({ activeLeagueId, roundSettings, canToggleEnabled }: { activeLeagueId: string; roundSettings: SeasonRoundSettings; canToggleEnabled: boolean }) {
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
