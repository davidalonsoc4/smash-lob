"use client";

import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useLeagueAccess } from "@/context/LeagueAccessProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import {
  countWeeklyAvailabilitySlots,
  createEmptyPlayerAvailability,
  findStoredPlayerAvailability,
  getBrowserTimezone,
  isSupabaseBackedAvailabilityId,
  normalizeWeeklyAvailability,
  upsertStoredPlayerAvailability,
  weekdayIds,
  weekdayLabels,
  type AvailabilitySlot,
  type PlayerAvailability,
  type WeekdayId,
  type WeeklyAvailability,
} from "@/lib/playerAvailability";
import {
  fetchSupabasePlayerAvailability,
  upsertSupabasePlayerAvailability,
} from "@/lib/supabasePlayerAvailability";

const defaultSlot: AvailabilitySlot = { start: "19:00", end: "21:00" };
const weekendSlot: AvailabilitySlot = { start: "10:00", end: "12:00" };
const weekday4Ids: WeekdayId[] = ["monday", "tuesday", "wednesday", "thursday"];
const weekday5Ids: WeekdayId[] = [...weekday4Ids, "friday"];
const weekendIds: WeekdayId[] = ["saturday", "sunday"];

type WeekdayQuickMode = "weekday4" | "weekday5" | "none" | "custom";
type EditorMode = "quick" | "custom";

function cloneSlot(slot: AvailabilitySlot) {
  return { start: slot.start, end: slot.end };
}

function areSlotsEqual(first?: AvailabilitySlot, second?: AvailabilitySlot) {
  return Boolean(first && second && first.start === second.start && first.end === second.end);
}

function getSingleSharedSlot(weeklySlots: WeeklyAvailability, days: WeekdayId[]) {
  const firstSlots = weeklySlots[days[0]];

  if (firstSlots.length !== 1) {
    return null;
  }

  const firstSlot = firstSlots[0];
  const hasSameSlot = days.every(
    (day) => weeklySlots[day].length === 1 && areSlotsEqual(weeklySlots[day][0], firstSlot),
  );

  return hasSameSlot ? firstSlot : null;
}

function areDaysEmpty(weeklySlots: WeeklyAvailability, days: WeekdayId[]) {
  return days.every((day) => weeklySlots[day].length === 0);
}

function getWeekdayQuickMode(weeklySlots: WeeklyAvailability): WeekdayQuickMode {
  if (getSingleSharedSlot(weeklySlots, weekday5Ids)) {
    return "weekday5";
  }

  if (getSingleSharedSlot(weeklySlots, weekday4Ids) && weeklySlots.friday.length === 0) {
    return "weekday4";
  }

  if (areDaysEmpty(weeklySlots, weekday5Ids)) {
    return "none";
  }

  return "custom";
}

function buildInitialAvailability({
  leagueId,
  seasonId,
  playerId,
  userId,
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
  userId: string | null;
}) {
  return (
    findStoredPlayerAvailability({ leagueId, seasonId, playerId }) ??
    createEmptyPlayerAvailability({
      leagueId,
      seasonId,
      playerId,
      userId,
      timezone: getBrowserTimezone(),
    })
  );
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) {
    return "Sin guardar todavía";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Guardado recientemente";
  }

  return `Última actualización: ${date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
  })}, ${date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function isValidSlot(slot: AvailabilitySlot) {
  return slot.start < slot.end;
}

function TimeRangeInputs({
  slot,
  onChange,
}: {
  slot: AvailabilitySlot;
  onChange: (slot: AvailabilitySlot) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <input
        type="time"
        value={slot.start}
        step={1800}
        onChange={(event) => onChange({ ...slot, start: event.target.value })}
        className="min-w-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-500"
      />
      <span className="text-xs font-black text-neutral-400">-</span>
      <input
        type="time"
        value={slot.end}
        step={1800}
        onChange={(event) => onChange({ ...slot, end: event.target.value })}
        className="min-w-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-500"
      />
    </div>
  );
}

function formatSlotsSummary(slots: AvailabilitySlot[]) {
  if (slots.length === 0) {
    return "Sin disponibilidad";
  }

  if (slots.length === 1) {
    return `${slots[0].start}–${slots[0].end}`;
  }

  return `${slots.length} franjas`;
}

function DayAvailabilityEditor({
  weekdayId,
  slots,
  isExpanded,
  onToggleExpanded,
  onChange,
}: {
  weekdayId: WeekdayId;
  slots: AvailabilitySlot[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onChange: (slots: AvailabilitySlot[]) => void;
}) {
  const isAvailable = slots.length > 0;

  function setAvailable(enabled: boolean) {
    onChange(enabled ? [defaultSlot] : []);

    if (enabled !== isExpanded) {
      onToggleExpanded();
    }
  }

  function updateSlot(index: number, slot: AvailabilitySlot) {
    onChange(
      slots.map((currentSlot, slotIndex) =>
        slotIndex === index ? slot : currentSlot,
      ),
    );
  }

  function removeSlot(index: number) {
    const nextSlots = slots.filter((_, slotIndex) => slotIndex !== index);
    onChange(nextSlots);

    if (nextSlots.length === 0 && isExpanded) {
      onToggleExpanded();
    }
  }

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          disabled={!isAvailable}
          aria-expanded={isAvailable ? isExpanded : false}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-neutral-950">
              {weekdayLabels[weekdayId]}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-500">
              {formatSlotsSummary(slots)}
            </p>
          </div>
          {isAvailable ? (
            <ClickableChevron
              className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          ) : null}
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={isAvailable}
          onClick={() => setAvailable(!isAvailable)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            isAvailable ? "bg-neutral-950" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
              isAvailable ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {isAvailable && isExpanded ? (
        <div className="mt-2 space-y-2 border-t border-neutral-100 pt-2">
          {slots.map((slot, index) => (
            <div
              key={`${weekdayId}-${index}`}
              className="grid grid-cols-[1fr_auto] items-center gap-2"
            >
              <TimeRangeInputs
                slot={slot}
                onChange={(nextSlot) => updateSlot(index, nextSlot)}
              />
              <button
                type="button"
                onClick={() => removeSlot(index)}
                className="rounded-xl bg-neutral-100 px-2.5 py-2 text-xs font-black text-neutral-600"
                aria-label="Quitar franja"
              >
                ×
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onChange([...slots, defaultSlot])}
            className="w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700"
          >
            Añadir otra franja
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AvailabilityPage() {
  const { userId } = useLeagueAccess();
  const { currentUser } = useCurrentUser();
  const { activeLeague, activeSeason } = useCurrentLeagueData();
  const [availability, setAvailability] = useState<PlayerAvailability>(() =>
    buildInitialAvailability({
      leagueId: activeLeague.id,
      seasonId: activeSeason.id,
      playerId: currentUser.id,
      userId,
    }),
  );
  const [editorMode, setEditorMode] = useState<EditorMode>("quick");
  const [expandedCustomDay, setExpandedCustomDay] = useState<WeekdayId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPersistentAvailability =
    isSupabaseBackedAvailabilityId(activeLeague.id) &&
    isSupabaseBackedAvailabilityId(activeSeason.id) &&
    isSupabaseBackedAvailabilityId(currentUser.id);

  useEffect(() => {
    const initialAvailability = buildInitialAvailability({
      leagueId: activeLeague.id,
      seasonId: activeSeason.id,
      playerId: currentUser.id,
      userId,
    });

    let isCancelled = false;
    const resetTimeout = window.setTimeout(() => {
      if (!isCancelled) {
        setAvailability(initialAvailability);
        setMessage(null);
        setError(null);
      }
    }, 0);

    if (!isPersistentAvailability) {
      return () => {
        isCancelled = true;
        window.clearTimeout(resetTimeout);
      };
    }

    async function hydrateAvailability() {
      setIsLoading(true);

      try {
        const remoteAvailability = await fetchSupabasePlayerAvailability({
          leagueId: activeLeague.id,
          seasonId: activeSeason.id,
          playerId: currentUser.id,
        });

        if (isCancelled) {
          return;
        }

        if (remoteAvailability) {
          setAvailability(remoteAvailability);
          upsertStoredPlayerAvailability(remoteAvailability);
        }
      } catch {
        if (!isCancelled) {
          setError("No se ha podido cargar la disponibilidad guardada. Puedes editarla y volver a guardar.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrateAvailability();

    return () => {
      isCancelled = true;
      window.clearTimeout(resetTimeout);
    };
  }, [activeLeague.id, activeSeason.id, currentUser.id, isPersistentAvailability, userId]);

  const weeklySlots = useMemo(
    () => normalizeWeeklyAvailability(availability.weeklySlots),
    [availability.weeklySlots],
  );
  const slotCount = countWeeklyAvailabilitySlots(weeklySlots);
  const weekdayMode = getWeekdayQuickMode(weeklySlots);
  const weekdaySlot =
    getSingleSharedSlot(weeklySlots, weekdayMode === "weekday5" ? weekday5Ids : weekday4Ids) ??
    defaultSlot;
  const sharedWeekendSlot = getSingleSharedSlot(weeklySlots, weekendIds);
  const isWeekendEnabled = Boolean(sharedWeekendSlot);
  const weekendInputSlot = sharedWeekendSlot ?? weekendSlot;
  const hasWeekendCustomShape =
    !sharedWeekendSlot && !areDaysEmpty(weeklySlots, weekendIds);
  const shouldShowCustomEditor =
    editorMode === "custom" || weekdayMode === "custom" || hasWeekendCustomShape;
  const hasInvalidSlots = weekdayIds.some((weekdayId) =>
    weeklySlots[weekdayId].some((slot) => !isValidSlot(slot)),
  );

  function updateWeeklySlots(nextWeeklySlots: WeeklyAvailability) {
    setMessage(null);
    setError(null);
    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      weeklySlots: nextWeeklySlots,
    }));
  }

  function setWeekdayMode(nextMode: Exclude<WeekdayQuickMode, "custom">) {
    const nextSlots = normalizeWeeklyAvailability(weeklySlots);
    const daysToEnable = nextMode === "weekday4" ? weekday4Ids : nextMode === "weekday5" ? weekday5Ids : [];
    const slot = cloneSlot(weekdaySlot);

    weekday5Ids.forEach((weekdayId) => {
      nextSlots[weekdayId] = daysToEnable.includes(weekdayId) ? [slot] : [];
    });

    setEditorMode("quick");
    updateWeeklySlots(nextSlots);
  }

  function updateSharedWeekdaySlot(nextSlot: AvailabilitySlot) {
    if (weekdayMode === "custom") {
      return;
    }

    const nextSlots = normalizeWeeklyAvailability(weeklySlots);
    const daysToUpdate = weekdayMode === "weekday5" ? weekday5Ids : weekdayMode === "weekday4" ? weekday4Ids : [];

    daysToUpdate.forEach((weekdayId) => {
      nextSlots[weekdayId] = [cloneSlot(nextSlot)];
    });

    updateWeeklySlots(nextSlots);
  }

  function setWeekendEnabled(enabled: boolean) {
    const nextSlots = normalizeWeeklyAvailability(weeklySlots);

    weekendIds.forEach((weekdayId) => {
      nextSlots[weekdayId] = enabled ? [cloneSlot(weekendInputSlot)] : [];
    });

    setEditorMode("quick");
    updateWeeklySlots(nextSlots);
  }

  function updateSharedWeekendSlot(nextSlot: AvailabilitySlot) {
    const nextSlots = normalizeWeeklyAvailability(weeklySlots);

    weekendIds.forEach((weekdayId) => {
      nextSlots[weekdayId] = [cloneSlot(nextSlot)];
    });

    updateWeeklySlots(nextSlots);
  }

  function updateWeekdaySlots(weekdayId: WeekdayId, slots: AvailabilitySlot[]) {
    setEditorMode("custom");
    updateWeeklySlots({
      ...weeklySlots,
      [weekdayId]: slots,
    } as WeeklyAvailability);
  }

  async function saveAvailability() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    const nextAvailability: PlayerAvailability = {
      ...availability,
      leagueId: activeLeague.id,
      seasonId: activeSeason.id,
      playerId: currentUser.id,
      userId,
      timezone: getBrowserTimezone(),
      weeklySlots,
    };

    try {
      if (isPersistentAvailability && userId) {
        const savedAvailability = await upsertSupabasePlayerAvailability({
          availability: nextAvailability,
        });

        setAvailability(savedAvailability);
        upsertStoredPlayerAvailability(savedAvailability);
      } else {
        upsertStoredPlayerAvailability(nextAvailability);
        setAvailability({
          ...nextAvailability,
          updatedAt: new Date().toISOString(),
        });
      }

      setMessage("Disponibilidad guardada.");
    } catch {
      setError("No se ha podido guardar. Revisa la conexión y vuelve a intentarlo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Mi disponibilidad
        </h1>

        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Define tus horarios habituales. En modo rápido una sola franja se aplica al bloque de días elegido.
        </p>
      </header>

      <AppCard className="p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              Horario semanal habitual
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              {slotCount > 0
                ? `${slotCount} franja${slotCount === 1 ? "" : "s"} configurada${slotCount === 1 ? "" : "s"}`
                : "Sin franjas: disponibilidad total"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
              {formatUpdatedAt(availability.updatedAt)}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1 text-xs font-black">
            <button
              type="button"
              onClick={() => setEditorMode("quick")}
              className={`rounded-xl px-3 py-1.5 ${
                !shouldShowCustomEditor ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
            >
              Rápido
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("custom")}
              className={`rounded-xl px-3 py-1.5 ${
                shouldShowCustomEditor ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
            >
              Por días
            </button>
          </div>
        </div>
      </AppCard>

      {!shouldShowCustomEditor ? (
        <>
          <AppCard className="p-2.5">
            <p className="text-sm font-black text-neutral-950">Laborables</p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Elige L-J o L-V. Solo uno puede estar activo.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { id: "weekday4", label: "L-J" },
                { id: "weekday5", label: "L-V" },
                { id: "none", label: "Ninguno" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setWeekdayMode(option.id as Exclude<WeekdayQuickMode, "custom">)}
                  className={`rounded-2xl px-3 py-2.5 text-xs font-black transition active:scale-[0.99] ${
                    weekdayMode === option.id
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {weekdayMode !== "none" ? (
              <div className="mt-3">
                <TimeRangeInputs
                  slot={weekdaySlot}
                  onChange={updateSharedWeekdaySlot}
                />
              </div>
            ) : null}
          </AppCard>

          <AppCard className="p-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-neutral-950">
                  Sábado y domingo
                </p>
                <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                  Una franja común para todo el fin de semana.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isWeekendEnabled}
                onClick={() => setWeekendEnabled(!isWeekendEnabled)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  isWeekendEnabled ? "bg-neutral-950" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    isWeekendEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {isWeekendEnabled ? (
              <div className="mt-3">
                <TimeRangeInputs
                  slot={weekendInputSlot}
                  onChange={updateSharedWeekendSlot}
                />
              </div>
            ) : null}
          </AppCard>
        </>
      ) : (
        <section className="space-y-2">
          <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Horario por días
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
              Activa únicamente los días disponibles y despliega cada uno para editar sus franjas.
            </p>
          </div>
          <AppCard className="overflow-hidden !p-0">
            <div className="divide-y divide-neutral-100">
              {weekdayIds.map((weekdayId) => (
                <DayAvailabilityEditor
                  key={weekdayId}
                  weekdayId={weekdayId}
                  slots={weeklySlots[weekdayId]}
                  isExpanded={expandedCustomDay === weekdayId}
                  onToggleExpanded={() =>
                    setExpandedCustomDay((current) =>
                      current === weekdayId ? null : weekdayId,
                    )
                  }
                  onChange={(slots) => updateWeekdaySlots(weekdayId, slots)}
                />
              ))}
            </div>
          </AppCard>
        </section>
      )}

      {isLoading ? (
        <p className="rounded-2xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500">
          Cargando disponibilidad guardada...
        </p>
      ) : null}

      {hasInvalidSlots ? (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
          Revisa las franjas: la hora de fin debe ser posterior a la hora de inicio.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={saveAvailability}
        disabled={isSaving || hasInvalidSlots}
        className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : "Guardar disponibilidad"}
      </button>

    </div>
  );
}
