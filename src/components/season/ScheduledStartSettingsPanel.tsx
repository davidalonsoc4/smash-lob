"use client";

import { useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { SeasonStartCountdown } from "@/components/season/SeasonStartCountdown";
import { type SeasonRoundSettings, useSeasonSettings } from "@/context/SeasonSettingsProvider";
import { showActionFeedback } from "@/lib/actionFeedback";
import { datetimeLocalToIso, formatNextScheduledStartForInput, normalizeScheduledStartAt, toDatetimeLocalValue } from "@/lib/seasonScheduling";
import { updateSupabaseSeasonRoundSettings } from "@/lib/supabaseSeasons";
import { useI18n } from "@/i18n/I18nProvider"

type Props = {
  activeLeagueId: string;
  roundSettings: SeasonRoundSettings;
};

export function ScheduledStartSettingsPanel({ activeLeagueId, roundSettings }: Props) {
  const { tx } = useI18n()
  const { updateSeasonRoundSettings } = useSeasonSettings();
  const [enabled, setEnabled] = useState(Boolean(roundSettings.scheduledStartAt));
  const [scheduledStartAt, setScheduledStartAt] = useState(toDatetimeLocalValue(roundSettings.scheduledStartAt));
  const [scheduledStartIsFuture, setScheduledStartIsFuture] = useState(true);
  const [secretPhaseEnabled, setSecretPhaseEnabled] = useState(Boolean(roundSettings.preseasonSecretDaysBefore));
  const [secretDaysBefore, setSecretDaysBefore] = useState(String(roundSettings.preseasonSecretDaysBefore ?? 7));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scheduledStartIso = enabled ? datetimeLocalToIso(scheduledStartAt) : null;
  const originalScheduledStartIso = normalizeScheduledStartAt(roundSettings.scheduledStartAt);
  const originalSecretDaysBefore = roundSettings.preseasonSecretDaysBefore ?? null;
  const parsedSecretDaysBefore = Number(secretDaysBefore);
  const secretDaysAreValid = !secretPhaseEnabled || (Number.isInteger(parsedSecretDaysBefore) && parsedSecretDaysBefore >= 1 && parsedSecretDaysBefore <= 90);
  const nextSecretDaysBefore = enabled && secretPhaseEnabled && secretDaysAreValid ? parsedSecretDaysBefore : null;
  const isValid = !enabled || Boolean(scheduledStartIso && scheduledStartIsFuture && secretDaysAreValid);
  const hasChanges = scheduledStartIso !== originalScheduledStartIso || nextSecretDaysBefore !== originalSecretDaysBefore;

  async function save() {
    if (isSaving || !isValid || !hasChanges) return;
    const nextSettings: SeasonRoundSettings = {
      ...roundSettings,
      leagueId: activeLeagueId,
      scheduledStartAt: scheduledStartIso,
      preseasonSecretDaysBefore: scheduledStartIso ? nextSecretDaysBefore : null,
    };

    setIsSaving(true);
    setError(null);
    try {
      await updateSupabaseSeasonRoundSettings(nextSettings);
      updateSeasonRoundSettings(nextSettings);
      showActionFeedback({
        tone: "success",
        message: scheduledStartIso ? "Inicio programado actualizado." : "Inicio programado desactivado.",
      });
    } catch {
      setError("No se ha podido actualizar el inicio de la temporada.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppCard>
      <p className="font-bold">{tx("Inicio de temporada")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {tx("Mientras la temporada no haya empezado puedes alternar entre inicio manual e inicio programado, o cambiar su fecha y hora.")}{" "}</p>
      <label className="mt-3 flex items-start gap-3 rounded-2xl border border-neutral-200 p-3">
        <input type="checkbox" checked={enabled} onChange={(event) => { const checked = event.target.checked; setEnabled(checked); if (checked && !scheduledStartAt) { setScheduledStartAt(formatNextScheduledStartForInput()); setScheduledStartIsFuture(true); } setError(null); }} className="mt-1" />
        <span>
          <span className="block text-sm font-black">{tx("Programar inicio")}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
            {tx("Desactívalo para volver a un inicio manual mediante “Comenzar temporada”.")}{" "}</span>
        </span>
      </label>
      {enabled ? (
        <label className="mt-3 block">
          <span className="text-sm font-semibold text-neutral-700">{tx("Fecha y hora de activación")}</span>
          <input
            type="datetime-local"
            step={3600}
            value={scheduledStartAt}
            onChange={(event) => {
              const value = event.target.value;
              const iso = datetimeLocalToIso(value);
              setScheduledStartAt(value);
              setScheduledStartIsFuture(Boolean(iso && new Date(iso).getTime() > Date.now()));
              setError(null);
            }}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
          />
        </label>
      ) : null}
      {enabled ? (
        <div id="fase-secreta" className="settings-search-target mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={secretPhaseEnabled}
              onChange={(event) => { setSecretPhaseEnabled(event.target.checked); setError(null); }}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-black">{tx("Activar Fase secretos")}</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-neutral-500">
                {tx("Los jugadores seguirán sin acceso al calendario, pero verán una apertura segura de la Jornada 1 si todos sus partidos comparten fecha y ubicación.")}
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
                  onChange={(event) => { setSecretDaysBefore(event.target.value); setError(null); }}
                  className="w-24 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-black text-neutral-950 outline-none focus:border-neutral-400"
                />
                <span className="text-sm font-semibold text-neutral-600">{tx("días antes del inicio")}</span>
              </div>
              {!secretDaysAreValid ? <span className="mt-2 block text-xs font-semibold text-red-600">{tx("Introduce entre 1 y 90 días.")}</span> : null}
            </label>
          ) : null}
        </div>
      ) : null}
      {enabled && !scheduledStartIsFuture ? <p className="mt-2 text-xs font-semibold text-red-600">{tx("La fecha programada debe ser futura y válida en horario de Madrid.")}</p> : null}
      {scheduledStartIso && isValid ? <div className="mt-3"><SeasonStartCountdown scheduledStartAt={scheduledStartIso} compact /></div> : null}
      <button
        type="button"
        onClick={save}
        disabled={!hasChanges || !isValid || isSaving}
        className="flex mt-3 w-full items-center justify-center rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white disabled:bg-neutral-300"
      >
        {isSaving ? "Guardando..." : tx("Guardar inicio")}
      </button>
      {error ? <p className="mt-2 text-center text-xs font-bold text-red-600">{tx(error)}</p> : null}
    </AppCard>
  );
}
