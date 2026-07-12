"use client";

import { useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import {
  getMatchResultConfirmationState,
  type ResultConfirmationMode,
} from "@/lib/resultConfirmations";
import type {
  MatchResultConfirmation,
  MatchResultConfirmationStatus,
} from "@/lib/supabaseMatchConfirmations";

type MatchResultConfirmationCardProps = {
  matchId: string;
  participantIds: string[];
  currentUserId: string;
  reporterPlayerId: string | null;
  resultRecordedAt: string | null;
  resultLocked: boolean;
  mode: ResultConfirmationMode;
  confirmations: MatchResultConfirmation[];
  onSetStatus: (input: {
    matchId: string;
    playerId: string;
    status: MatchResultConfirmationStatus;
  }) => Promise<boolean>;
};

export function MatchResultConfirmationCard({
  matchId,
  participantIds,
  currentUserId,
  reporterPlayerId,
  resultRecordedAt,
  resultLocked,
  mode,
  confirmations,
  onSetStatus,
}: MatchResultConfirmationCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentConfirmation = confirmations.find(
    (item) => item.matchId === matchId && item.playerId === currentUserId,
  );
  const validation = getMatchResultConfirmationState({
    matchId,
    participantIds,
    reporterPlayerId,
    resultRecordedAt,
    resultLocked,
    confirmations,
    mode,
  });
  const isParticipant = participantIds.includes(currentUserId);
  const isReporter = reporterPlayerId === currentUserId;
  const canRespond =
    isParticipant && !isReporter && validation.state === "pending";

  if (mode === "none") {
    return null;
  }

  const status =
    validation.state === "locked"
      ? { label: "Definitivo", className: "bg-neutral-950 text-white" }
      : validation.state === "disputed"
        ? { label: "En revisión", className: "bg-red-100 text-red-700" }
        : validation.state === "validated"
          ? { label: "Validado", className: "bg-emerald-100 text-emerald-700" }
          : validation.state === "auto_validated"
            ? {
                label: "Validado 24 h",
                className: "bg-emerald-100 text-emerald-700",
              }
            : mode === "required"
              ? { label: "Pendiente", className: "bg-amber-100 text-amber-800" }
              : {
                  label: "Opcional",
                  className: "bg-neutral-100 text-neutral-600",
                };

  const detail =
    validation.state === "disputed"
      ? isReporter
        ? "Corrige el resultado."
        : currentConfirmation?.status === "disputed"
          ? "Puedes corregirlo."
          : "Pendiente de corrección."
      : isReporter && validation.state === "pending"
        ? "Informado por ti."
        : mode === "required" && validation.state === "pending"
          ? "Validación del resto · auto 24 h."
          : null;

  async function saveStatus(nextStatus: MatchResultConfirmationStatus) {
    if (!canRespond || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);
    const saved = await onSetStatus({
      matchId,
      playerId: currentUserId,
      status: nextStatus,
    });
    setIsSaving(false);

    if (!saved) {
      setError("No se ha podido guardar tu respuesta.");
    }
  }

  return (
    <AppCard className="p-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-black">Confirmar resultado</p>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          {detail ? (
            <p className="mt-0.5 truncate text-[10px] font-semibold text-neutral-500">
              {detail}
            </p>
          ) : null}
        </div>

        {canRespond ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => saveStatus("confirmed")}
              disabled={isSaving}
              className={`rounded-lg px-2 py-1.5 text-[10px] font-black disabled:opacity-50 ${
                currentConfirmation?.status === "confirmed"
                  ? "bg-neutral-950 text-white"
                  : "bg-neutral-100 text-neutral-800"
              }`}
            >
              Correcto
            </button>

            <button
              type="button"
              onClick={() => saveStatus("disputed")}
              disabled={isSaving}
              className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-black text-red-700 disabled:opacity-50"
            >
              Incorrecto
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-1 text-[10px] font-semibold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  );
}
