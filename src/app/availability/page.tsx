"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
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
const emptyWeeklyAvailability: WeeklyAvailability = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
};

type AvailabilityTemplateId = "weekday4" | "weekday5" | "weekend" | "empty";

type AvailabilityTemplate = {
  id: AvailabilityTemplateId;
  label: string;
  description: string;
  weeklySlots: WeeklyAvailability;
};

function buildWeeklyAvailabilityFromDays({
  enabledWeekdays,
  slot,
}: {
  enabledWeekdays: WeekdayId[];
  slot: AvailabilitySlot;
}) {
  return Object.fromEntries(
    weekdayIds.map((weekdayId) => [
      weekdayId,
      enabledWeekdays.includes(weekdayId) ? [{ ...slot }] : [],
    ]),
  ) as WeeklyAvailability;
}

const availabilityTemplates: AvailabilityTemplate[] = [
  {
    id: "weekday4",
    label: "L-J",
    description: "19:00-21:00",
    weeklySlots: buildWeeklyAvailabilityFromDays({
      enabledWeekdays: ["monday", "tuesday", "wednesday", "thursday"],
      slot: defaultSlot,
    }),
  },
  {
    id: "weekday5",
    label: "L-V",
    description: "19:00-21:00",
    weeklySlots: buildWeeklyAvailabilityFromDays({
      enabledWeekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      slot: defaultSlot,
    }),
  },
  {
    id: "weekend",
    label: "Finde",
    description: "10:00-12:00",
    weeklySlots: buildWeeklyAvailabilityFromDays({
      enabledWeekdays: ["saturday", "sunday"],
      slot: weekendSlot,
    }),
  },
  {
    id: "empty",
    label: "Limpiar",
    description: "Sin disponibilidad",
    weeklySlots: emptyWeeklyAvailability,
  },
];

function areSlotsEqual(firstSlots: AvailabilitySlot[], secondSlots: AvailabilitySlot[]) {
  return (
    firstSlots.length === secondSlots.length &&
    firstSlots.every(
      (slot, index) =>
        slot.start === secondSlots[index]?.start &&
        slot.end === secondSlots[index]?.end,
    )
  );
}

function getMatchingTemplateId(weeklySlots: WeeklyAvailability) {
  return availabilityTemplates.find((template) =>
    weekdayIds.every((weekdayId) =>
      areSlotsEqual(weeklySlots[weekdayId], template.weeklySlots[weekdayId]),
    ),
  )?.id ?? null;
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

function DayAvailabilityEditor({
  weekdayId,
  slots,
  onChange,
}: {
  weekdayId: WeekdayId;
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}) {
  const isAvailable = slots.length > 0;

  function setAvailable(enabled: boolean) {
    onChange(enabled ? [defaultSlot] : []);
  }

  function updateSlot(index: number, field: keyof AvailabilitySlot, value: string) {
    onChange(
      slots.map((slot, slotIndex) =>
        slotIndex === index
          ? {
              ...slot,
              [field]: value,
            }
          : slot,
      ),
    );
  }

  function removeSlot(index: number) {
    onChange(slots.filter((_, slotIndex) => slotIndex !== index));
  }

  return (
    <AppCard className="p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-neutral-950">
            {weekdayLabels[weekdayId]}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
            {isAvailable ? `${slots.length} franja${slots.length === 1 ? "" : "s"}` : "Sin disponibilidad"}
          </p>
        </div>

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

      {isAvailable ? (
        <div className="mt-2 space-y-2">
          {slots.map((slot, index) => (
            <div key={`${weekdayId}-${index}`} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              <input
                type="time"
                value={slot.start}
                step={1800}
                onChange={(event) => updateSlot(index, "start", event.target.value)}
                className="min-w-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-500"
              />
              <span className="text-xs font-black text-neutral-400">-</span>
              <input
                type="time"
                value={slot.end}
                step={1800}
                onChange={(event) => updateSlot(index, "end", event.target.value)}
                className="min-w-0 rounded-xl border border-neutral-200 bg-white px-2 py-2 text-sm font-bold text-neutral-950 outline-none focus:border-neutral-500"
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
    </AppCard>
  );
}

export default function AvailabilityPage() {
  const { data: session } = useSession();
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
  const activeTemplateId = getMatchingTemplateId(weeklySlots);
  const hasInvalidSlots = weekdayIds.some((weekdayId) =>
    weeklySlots[weekdayId].some((slot) => !isValidSlot(slot)),
  );

  function updateWeekdaySlots(weekdayId: WeekdayId, slots: AvailabilitySlot[]) {
    setMessage(null);
    setError(null);
    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      weeklySlots: {
        ...currentAvailability.weeklySlots,
        [weekdayId]: slots,
      } as WeeklyAvailability,
    }));
  }

  function applyWeeklyTemplate(nextWeeklySlots: WeeklyAvailability) {
    setMessage(null);
    setError(null);
    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      weeklySlots: nextWeeklySlots,
    }));
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
          userEmail: userId,
          displayName: session?.user?.name,
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
        <BackButton fallbackHref="/profile" label="Volver" />

        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} · {activeSeason.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Mi disponibilidad
        </h1>

        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Define tus horarios habituales de juego. La app los usará después para recomendar horarios cuando se crucen los 4 jugadores de un partido.
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
                : "Aún no has configurado disponibilidad"}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-neutral-400">
              {formatUpdatedAt(availability.updatedAt)}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">
            2h partido
          </span>
        </div>
      </AppCard>

      <AppCard className="p-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">Rellenar rapido</p>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
              Elige una plantilla y ajusta debajo solo los dias que cambien.
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {activeTemplateId ? "Plantilla" : "Personalizado"}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {availabilityTemplates.map((template) => {
            const isActiveTemplate = activeTemplateId === template.id;
            const isEmptyTemplate = template.id === "empty";

            return (
              <button
                key={template.id}
                type="button"
                aria-pressed={isActiveTemplate}
                onClick={() => applyWeeklyTemplate(template.weeklySlots)}
                className={`rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
                  isActiveTemplate
                    ? "bg-neutral-950 text-white shadow-sm"
                    : isEmptyTemplate
                      ? "bg-red-50 text-red-700"
                      : "bg-neutral-100 text-neutral-800"
                }`}
              >
                <span className="block text-xs font-black">
                  {template.label}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] font-semibold ${
                    isActiveTemplate ? "text-white/70" : "text-current opacity-60"
                  }`}
                >
                  {template.description}
                </span>
              </button>
            );
          })}
        </div>
      </AppCard>

      {isLoading ? (
        <p className="rounded-2xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-500">
          Cargando disponibilidad guardada...
        </p>
      ) : null}

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
          Excepciones por día
        </p>
        {weekdayIds.map((weekdayId) => (
          <DayAvailabilityEditor
            key={weekdayId}
            weekdayId={weekdayId}
            slots={weeklySlots[weekdayId]}
            onChange={(slots) => updateWeekdaySlots(weekdayId, slots)}
          />
        ))}
      </div>

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

      <Link
        href="/profile"
        className="block w-full rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black text-neutral-700"
      >
        Volver al perfil
      </Link>
    </div>
  );
}
