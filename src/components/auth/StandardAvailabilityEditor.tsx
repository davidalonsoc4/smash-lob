"use client"

import {
  createEmptyWeeklyAvailability,
  normalizeWeeklyAvailability,
  weekdayIds,
  type AvailabilitySlot,
  type WeekdayId,
  type WeeklyAvailability,
} from "@/lib/playerAvailability"

const defaultSlot: AvailabilitySlot = { start: "19:00", end: "21:00" }

function getInitialSharedSlot(weeklySlots: WeeklyAvailability) {
  for (const weekdayId of weekdayIds) {
    const slot = weeklySlots[weekdayId][0]

    if (slot) {
      return slot
    }
  }

  return defaultSlot
}

export function buildStandardWeeklyAvailability({
  selectedDays,
  slot,
}: {
  selectedDays: WeekdayId[]
  slot: AvailabilitySlot
}) {
  const weeklySlots = createEmptyWeeklyAvailability()

  selectedDays.forEach((weekdayId) => {
    weeklySlots[weekdayId] = [{ start: slot.start, end: slot.end }]
  })

  return weeklySlots
}

export function getStandardAvailabilityEditorInitialState(
  value: WeeklyAvailability,
) {
  const weeklySlots = normalizeWeeklyAvailability(value)

  return {
    selectedDays: weekdayIds.filter(
      (weekdayId) => weeklySlots[weekdayId].length > 0,
    ),
    slot: getInitialSharedSlot(weeklySlots),
  }
}

type StandardAvailabilityEditorProps = {
  selectedDays: WeekdayId[]
  slot: AvailabilitySlot
  dayLabels: Record<WeekdayId, string>
  title: string
  description: string
  startLabel: string
  endLabel: string
  laterNotice: string
  onSelectedDaysChange: (days: WeekdayId[]) => void
  onSlotChange: (slot: AvailabilitySlot) => void
}

export function StandardAvailabilityEditor({
  selectedDays,
  slot,
  dayLabels,
  title,
  description,
  startLabel,
  endLabel,
  laterNotice,
  onSelectedDaysChange,
  onSlotChange,
}: StandardAvailabilityEditorProps) {
  function toggleDay(weekdayId: WeekdayId) {
    onSelectedDaysChange(
      selectedDays.includes(weekdayId)
        ? selectedDays.filter((item) => item !== weekdayId)
        : [...selectedDays, weekdayId],
    )
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-sm font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {description}
      </p>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekdayIds.map((weekdayId) => {
          const active = selectedDays.includes(weekdayId)

          return (
            <button
              key={weekdayId}
              type="button"
              aria-pressed={active}
              onClick={() => toggleDay(weekdayId)}
              className={`h-9 rounded-xl text-[11px] font-black transition active:scale-95 ${
                active
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-500"
              }`}
            >
              {dayLabels[weekdayId]}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {startLabel}
          </span>
          <input
            type="time"
            step={1800}
            value={slot.start}
            onChange={(event) =>
              onSlotChange({ ...slot, start: event.target.value })
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-sm font-bold outline-none focus:border-neutral-500"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
            {endLabel}
          </span>
          <input
            type="time"
            step={1800}
            value={slot.end}
            onChange={(event) =>
              onSlotChange({ ...slot, end: event.target.value })
            }
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-sm font-bold outline-none focus:border-neutral-500"
          />
        </label>
      </div>

      <p className="mt-2 text-[11px] font-semibold leading-4 text-neutral-400">
        {laterNotice}
      </p>
    </div>
  )
}
