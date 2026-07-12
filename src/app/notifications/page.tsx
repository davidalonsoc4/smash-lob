"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { BackButton } from "@/components/ui/BackButton";
import { ClickableChevron } from "@/components/ui/ClickableChevron";
import { useCurrentUser } from "@/context/CurrentUserProvider";
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData";
import { useI18n } from "@/i18n/I18nProvider";
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity";
import { formatMoney } from "@/lib/courtBooking";
import {
  getNotificationPreferenceKeyForEvent,
  isAlwaysEnabledNotificationEvent,
} from "@/lib/notificationSettings";

type TransferLike = {
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  isPaid: boolean;
};

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toTransfers(value: unknown): TransferLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const transfer = toRecord(item);
      const fromPlayerId = String(transfer.fromPlayerId ?? "");
      const toPlayerId = String(transfer.toPlayerId ?? "");
      const amount = Number(transfer.amount);

      if (!fromPlayerId || !toPlayerId || !Number.isFinite(amount)) {
        return null;
      }

      return {
        fromPlayerId,
        toPlayerId,
        amount,
        isPaid: Boolean(transfer.isPaid),
      };
    })
    .filter((item): item is TransferLike => Boolean(item));
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getNotificationUrl(event: ActivityEvent) {
  if (event.matchId) {
    return `/match/${event.matchId}`;
  }

  if (
    event.type === "season_created" ||
    event.type === "season_started" ||
    event.type === "season_finished" ||
    event.type === "round_in_play"
  ) {
    return "/";
  }

  return "/activity?scope=mine";
}

function isMatchParticipantNotification(event: ActivityEvent) {
  return (
    event.type === "match_scheduled" ||
    event.type === "match_schedule_updated" ||
    event.type === "match_postponed" ||
    event.type === "match_result_saved" ||
    event.type === "match_result_updated" ||
    event.type === "match_result_cleared" ||
    event.type === "match_result_missing_reminder" ||
    event.type === "match_result_confirmation_reminder" ||
    event.type === "match_mvp_vote_reminder"
  );
}

function isLeagueWideNotification(event: ActivityEvent) {
  return (
    event.type === "season_created" ||
    event.type === "season_started" ||
    event.type === "season_finished"
  );
}

function isNotificationForCurrentUser({
  event,
  currentUserId,
  currentUserMatchIds,
  currentUserEmail,
}: {
  event: ActivityEvent;
  currentUserId: string;
  currentUserMatchIds: Set<string>;
  currentUserEmail: string;
}) {
  if (
    !getNotificationPreferenceKeyForEvent(event.type) &&
    !isAlwaysEnabledNotificationEvent(event.type)
  ) {
    return false;
  }

  if (
    currentUserEmail &&
    normalizeEmail(event.actorEmail) === currentUserEmail
  ) {
    return false;
  }

  const metadata = event.metadata;
  const participantIds = toStringArray(metadata.participantIds);

  if (isLeagueWideNotification(event)) {
    return true;
  }

  if (event.type === "round_in_play") {
    return !participantIds.includes(currentUserId);
  }

  if (
    event.type === "match_mvp_vote_reminder" ||
    event.type === "match_result_confirmation_reminder" ||
    event.type === "round_mvp_awarded"
  ) {
    return toStringArray(metadata.targetPlayerIds).includes(currentUserId);
  }

  if (isMatchParticipantNotification(event)) {
    return (
      Boolean(event.matchId && currentUserMatchIds.has(event.matchId)) ||
      participantIds.includes(currentUserId)
    );
  }

  if (event.type === "season_registration_payment_reminder") {
    return toStringArray(metadata.pendingPlayerIds).includes(currentUserId);
  }

  if (
    event.type === "court_booking_updated" ||
    event.type === "court_booking_payment_reminder"
  ) {
    return toTransfers(metadata.transfers).some(
      (transfer) =>
        transfer.fromPlayerId === currentUserId &&
        !transfer.isPaid &&
        transfer.amount > 0,
    );
  }

  if (event.type === "court_booking_payment_paid") {
    const paidTransfer = toRecord(metadata.paidTransfer);
    return String(paidTransfer.toPlayerId ?? "") === currentUserId;
  }

  return false;
}

function getPlayerName(
  playerId: string,
  players: { id: string; displayName: string }[],
) {
  return (
    players.find((player) => player.id === playerId)?.displayName ??
    "otro jugador"
  );
}

function getResultText(event: ActivityEvent) {
  const metadata = event.metadata;
  const pointsA = Number(metadata.pointsA);
  const pointsB = Number(metadata.pointsB);

  if (!Number.isFinite(pointsA) || !Number.isFinite(pointsB)) {
    return null;
  }

  const sets = Array.isArray(metadata.sets)
    ? metadata.sets
        .map((item) => {
          const set = toRecord(item);
          const a = Number(set.a);
          const b = Number(set.b);

          if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return null;
          }

          return `${a}-${b}`;
        })
        .filter((item): item is string => Boolean(item))
    : [];
  const round = metadata.round;
  const roundText =
    typeof round === "number" || typeof round === "string"
      ? `Jornada ${round}`
      : null;
  const setText = sets.length > 0 ? ` · ${sets.join(", ")}` : "";

  return [roundText, `${pointsA}-${pointsB}${setText}`]
    .filter((item): item is string => Boolean(item))
    .join(": ");
}

function getNotificationTitle(event: ActivityEvent) {
  if (event.type === "season_finished") {
    return "TEMPORADA FINALIZADA";
  }

  if (event.type === "court_booking_updated") {
    return "Tienes pagos pendientes";
  }

  if (event.type === "court_booking_payment_reminder") {
    return "Recordatorio de pago";
  }

  if (event.type === "court_booking_payment_paid") {
    return "Pago de pista recibido";
  }

  if (event.type === "season_registration_payment_reminder") {
    return "Recordatorio de inscripción";
  }

  if (event.type === "match_result_missing_reminder") {
    return "Falta el resultado";
  }

  if (event.type === "match_result_confirmation_reminder") {
    return "Confirma el resultado";
  }

  if (event.type === "match_mvp_vote_reminder") {
    return "Falta tu voto MVP";
  }

  if (event.type === "round_mvp_awarded") {
    return "MVP de la jornada";
  }

  if (event.type === "round_in_play") {
    return "Jornada en juego";
  }

  return event.title || "Smash & Lob";
}

function getNotificationBody({
  event,
  currentUserId,
  players,
}: {
  event: ActivityEvent;
  currentUserId: string;
  players: { id: string; displayName: string }[];
}) {
  const metadata = event.metadata;

  if (event.type === "season_created") {
    const playerCount = Number(metadata.playerCount);
    const totalRounds = Number(metadata.totalRounds);

    if (Number.isFinite(playerCount) && Number.isFinite(totalRounds)) {
      return `${playerCount} jugadores · ${totalRounds} jornadas.`;
    }
  }

  if (event.type === "season_finished") {
    const winnerName =
      typeof metadata.winnerName === "string" && metadata.winnerName.trim()
        ? metadata.winnerName.trim()
        : null;

    return winnerName
      ? `Enhorabuena a ${winnerName}, ganador de la temporada.`
      : "La temporada ha finalizado.";
  }

  if (
    event.type === "court_booking_updated" ||
    event.type === "court_booking_payment_reminder"
  ) {
    const pendingText = toTransfers(metadata.transfers)
      .filter(
        (transfer) =>
          transfer.fromPlayerId === currentUserId &&
          !transfer.isPaid &&
          transfer.amount > 0,
      )
      .map(
        (transfer) =>
          `${formatMoney(transfer.amount)} a ${getPlayerName(transfer.toPlayerId, players)}`,
      )
      .join(" y ");

    if (pendingText) {
      return `Debes ${pendingText} por la reserva de pista.`;
    }
  }

  if (event.type === "court_booking_payment_paid") {
    const paidTransfer = toRecord(metadata.paidTransfer);
    const fromPlayerId = String(paidTransfer.fromPlayerId ?? "");
    const amount = Number(paidTransfer.amount);

    if (fromPlayerId && Number.isFinite(amount) && amount > 0) {
      return `${getPlayerName(fromPlayerId, players)} ha pagado ${formatMoney(amount)} de la reserva de pista.`;
    }
  }

  if (event.type === "season_registration_payment_reminder") {
    const amount = Number(metadata.amount);
    const organizerName =
      typeof metadata.organizerName === "string" &&
      metadata.organizerName.trim()
        ? metadata.organizerName.trim()
        : "el organizador";

    return Number.isFinite(amount) && amount > 0
      ? `Recuerda saldar tu inscripción de ${formatMoney(amount)} con ${organizerName}.`
      : `Recuerda saldar tu inscripción con ${organizerName}.`;
  }

  if (
    event.type === "match_result_saved" ||
    event.type === "match_result_updated"
  ) {
    const resultText = getResultText(event);

    if (resultText) {
      const confirmationText =
        metadata.resultConfirmationMode === "none"
          ? ""
          : " Entra para confirmarlo.";

      return event.type === "match_result_updated"
        ? `Nuevo resultado: ${resultText}.${confirmationText}`
        : `Resultado: ${resultText}.${confirmationText}`;
    }
  }

  if (event.type === "match_result_missing_reminder") {
    const round = metadata.round;

    return typeof round === "number" || typeof round === "string"
      ? `No olvides registrar el resultado de tu partido de la Jornada ${round}.`
      : "No olvides registrar el resultado de tu partido.";
  }

  if (event.type === "match_result_confirmation_reminder") {
    const round = metadata.round;

    return typeof round === "number" || typeof round === "string"
      ? `Revisa y confirma el resultado de tu partido de la Jornada ${round}.`
      : "Revisa y confirma el resultado de tu último partido.";
  }

  if (event.type === "match_mvp_vote_reminder") {
    const round = metadata.round;

    return typeof round === "number" || typeof round === "string"
      ? `Vota al MVP de tu partido de la Jornada ${round}.`
      : "Vota al MVP de tu último partido.";
  }

  if (event.type === "round_mvp_awarded") {
    const playerNames = toStringArray(metadata.playerNames);
    const round = metadata.round;
    const winnerText = playerNames.join(" / ");

    if (
      winnerText &&
      (typeof round === "number" || typeof round === "string")
    ) {
      return `${winnerText} ${playerNames.length > 1 ? "son" : "es"} el MVP de la Jornada ${round}.`;
    }

    return event.description || "Ya se ha decidido el MVP de la jornada.";
  }

  if (event.type === "round_in_play") {
    const round = metadata.round;

    return typeof round === "number" || typeof round === "string"
      ? `La Jornada ${round} ya está en juego.`
      : "Hay una jornada en juego ahora mismo.";
  }

  return event.description || "Nueva actividad en tu liga.";
}

function NotificationCard({
  event,
  currentUserId,
  players,
}: {
  event: ActivityEvent;
  currentUserId: string;
  players: { id: string; displayName: string }[];
}) {
  const href = getNotificationUrl(event);

  return (
    <Link href={href} className="block">
      <AppCard className="p-3 transition active:scale-[0.99]">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-black text-neutral-950">
            {getNotificationTitle(event)}
          </p>
          <p className="shrink-0 text-[11px] font-semibold text-neutral-400">
            {formatNotificationDate(event.createdAt)}
          </p>
        </div>

        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
          {getNotificationBody({ event, currentUserId, players })}
        </p>
      </AppCard>
    </Link>
  );
}

export default function NotificationsPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const { currentUserId } = useCurrentUser();
  const { activeLeague, activeSeason, matches, players } =
    useCurrentLeagueData();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const currentUserEmail = normalizeEmail(session?.user?.email);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      setIsLoading(true);
      setError(null);

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 180,
        });

        if (isMounted) {
          setEvents(activityEvents);
        }
      } catch {
        if (isMounted) {
          setError("No se han podido cargar las notificaciones.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [activeLeague.id, refreshKey]);

  const currentUserMatchIds = useMemo(
    () =>
      new Set(
        matches
          .filter(
            (match) =>
              match.teamA.includes(currentUserId) ||
              match.teamB.includes(currentUserId),
          )
          .map((match) => match.id),
      ),
    [currentUserId, matches],
  );

  const notifications = useMemo(
    () =>
      events.filter((event) =>
        isNotificationForCurrentUser({
          event,
          currentUserId,
          currentUserMatchIds,
          currentUserEmail,
        }),
      ),
    [currentUserEmail, currentUserId, currentUserMatchIds, events],
  );

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/" label={t.common.back} />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>
            {activeLeague.name} · {activeSeason.name}
          </span>
        </p>

        <div className="mt-0.5 flex items-center justify-between gap-3">
          <h1 className="text-xl font-black tracking-tight">Notificaciones</h1>
          <button
            type="button"
            onClick={() => setRefreshKey((current) => current + 1)}
            className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-black text-neutral-700"
          >
            Actualizar
          </button>
        </div>

        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          Avisos recibidos o dirigidos a ti en esta liga.
        </p>
      </header>

      <Link href="/settings/notifications" className="block">
        <AppCard className="p-2.5 transition active:scale-[0.99]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-950">
                Ajustes de notificaciones
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                Activa push y elige qué tipos de aviso quieres recibir.
              </p>
            </div>
            <ClickableChevron className="shrink-0" />
          </div>
        </AppCard>
      </Link>

      {isLoading ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            Cargando notificaciones...
          </p>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="font-bold text-red-700">No se han podido cargar</p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
        </AppCard>
      ) : null}

      {!isLoading && !error && notifications.length === 0 ? (
        <AppCard>
          <p className="font-bold">Sin notificaciones</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
            Cuando haya avisos para ti aparecerán aquí.
          </p>
        </AppCard>
      ) : null}

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((event) => (
            <NotificationCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              players={players}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
