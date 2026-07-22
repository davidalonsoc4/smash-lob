import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabaseServer";
import {
  getNotificationPreferenceKeyForEvent,
  isAlwaysEnabledNotificationEvent,
  normalizeNotificationPreferences,
} from "@/lib/notificationSettings";
import type { ActivityEventType } from "@/lib/activity";
import { buildLeagueNavigationUrl } from "@/lib/leagueNavigation";
import {
  getActivityDeliveryMode,
  normalizeLeagueActivitySettings,
} from "@/lib/activitySettings";

export type PushDispatchResult = {
  ok: boolean;
  sent: number;
  reason?: string;
  error?: string;
};

type ActivityEventRow = {
  id: string;
  league_id: string;
  season_id: string | null;
  match_id: string | null;
  actor_email: string | null;
  actor_display_name: string | null;
  type: ActivityEventType;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

type PushSubscriptionRow = {
  id: string;
  user_email: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type NotificationPreferenceRow = {
  user_email: string;
  settings: unknown;
};

type LeagueMembershipRow = {
  user_id: string | null;
  player_id: string | null;
};

type MatchParticipantRow = {
  team_a: string[] | null;
  team_b: string[] | null;
};

type AppUserRow = {
  id: string;
  email: string | null;
};

type PlayerRow = {
  id: string;
  display_name: string | null;
};

type NotificationRecipient = {
  email: string;
  playerId: string | null;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function toNumber(value: unknown) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toTransfers(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const transfer = toRecord(item);
      const fromPlayerId = String(transfer.fromPlayerId ?? "");
      const toPlayerId = String(transfer.toPlayerId ?? "");

      if (!fromPlayerId || !toPlayerId) {
        return null;
      }

      return {
        fromPlayerId,
        toPlayerId,
        amount: toNumber(transfer.amount),
        isPaid: Boolean(transfer.isPaid),
      };
    })
    .filter(
      (
        item,
      ): item is {
        fromPlayerId: string;
        toPlayerId: string;
        amount: number;
        isPaid: boolean;
      } => Boolean(item),
    );
}

function isMatchParticipantNotification(eventType: ActivityEventType) {
  return (
    eventType === "match_scheduled" ||
    eventType === "match_schedule_updated" ||
    eventType === "match_postponed" ||
    eventType === "match_result_saved" ||
    eventType === "match_result_updated" ||
    eventType === "match_result_cleared" ||
    eventType === "match_result_missing_reminder" ||
    eventType === "match_result_confirmation_reminder" ||
    eventType === "match_mvp_vote_reminder" ||
    eventType === "match_mvp_awarded" ||
    eventType === "match_upcoming_reminder"
  );
}

function getTargetPlayerIdsFromMetadata(event: ActivityEventRow) {
  const metadata = toRecord(event.metadata);

  const explicitTargetPlayerIds = toStringArray(metadata.targetPlayerIds);

  if (explicitTargetPlayerIds.length > 0) {
    return explicitTargetPlayerIds;
  }

  if (isMatchParticipantNotification(event.type)) {
    return toStringArray(metadata.participantIds);
  }

  if (
    event.type === "court_booking_updated" ||
    event.type === "court_booking_payment_reminder"
  ) {
    return Array.from(
      new Set(
        toTransfers(metadata.transfers)
          .filter((transfer) => !transfer.isPaid)
          .map((transfer) => transfer.fromPlayerId),
      ),
    );
  }

  if (event.type === "court_booking_payment_paid") {
    const paidTransfer = toRecord(metadata.paidTransfer);
    const toPlayerId = String(paidTransfer.toPlayerId ?? "");

    return toPlayerId ? [toPlayerId] : [];
  }

  if (event.type === "season_registration_payment_reminder") {
    return toStringArray(metadata.pendingPlayerIds);
  }

  return [];
}

async function fetchMatchParticipantIds({
  supabase,
  event,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  event: ActivityEventRow;
}) {
  if (!event.match_id || !isMatchParticipantNotification(event.type)) {
    return [];
  }

  const { data, error } = await supabase
    .from("matches")
    .select("team_a,team_b")
    .eq("id", event.match_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  const match = data as MatchParticipantRow;

  return [...toStringArray(match.team_a), ...toStringArray(match.team_b)];
}

async function getTargetPlayerIds({
  supabase,
  event,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  event: ActivityEventRow;
}) {
  const metadataTargetPlayerIds = getTargetPlayerIdsFromMetadata(event);

  if (
    event.type === "match_mvp_vote_reminder" ||
    event.type === "match_mvp_awarded" ||
    event.type === "match_result_confirmation_reminder" ||
    event.type === "round_mvp_awarded"
  ) {
    return metadataTargetPlayerIds;
  }

  if (!isMatchParticipantNotification(event.type)) {
    return metadataTargetPlayerIds;
  }

  const matchParticipantIds = await fetchMatchParticipantIds({
    supabase,
    event,
  });

  return Array.from(
    new Set(
      [...metadataTargetPlayerIds, ...matchParticipantIds].filter(Boolean),
    ),
  );
}

function getExcludedPlayerIds(event: ActivityEventRow) {
  const metadata = toRecord(event.metadata);

  if (event.type === "round_in_play") {
    return new Set(toStringArray(metadata.participantIds));
  }

  return new Set<string>();
}

function isLeagueWideEvent(eventType: ActivityEventType) {
  return (
    eventType === "season_created" ||
    eventType === "season_started" ||
    eventType === "season_finished" ||
    eventType === "round_in_play"
  );
}

function getNotificationUrl(event: ActivityEventRow) {
  let targetPath = "/activity?scope=mine";

  if (event.match_id) {
    targetPath = `/match/${event.match_id}`;
  } else if (
    event.type === "season_created" ||
    event.type === "season_started" ||
    event.type === "season_finished" ||
    event.type === "season_player_joined" ||
    event.type === "season_player_left" ||
    event.type === "round_in_play" ||
    event.type === "round_mvp_awarded" ||
    event.type === "season_registration_payment_reminder"
  ) {
    targetPath = "/";
  }

  return buildLeagueNavigationUrl({
    leagueId: event.league_id,
    targetPath,
  });
}

function getPlayerName(playerId: string, playerNamesById: Map<string, string>) {
  return playerNamesById.get(playerId) ?? "otro jugador";
}

function getPendingTransferText({
  event,
  recipient,
  playerNamesById,
}: {
  event: ActivityEventRow;
  recipient: NotificationRecipient | null;
  playerNamesById: Map<string, string>;
}) {
  if (!recipient?.playerId) {
    return null;
  }

  const metadata = toRecord(event.metadata);
  const pendingTransfers = toTransfers(metadata.transfers).filter(
    (transfer) =>
      transfer.fromPlayerId === recipient.playerId &&
      !transfer.isPaid &&
      transfer.amount > 0,
  );

  if (pendingTransfers.length === 0) {
    return null;
  }

  return pendingTransfers
    .map(
      (transfer) =>
        `${formatMoney(transfer.amount)} a ${getPlayerName(transfer.toPlayerId, playerNamesById)}`,
    )
    .join(" y ");
}

function getResultTextFromMetadata(event: ActivityEventRow) {
  const metadata = toRecord(event.metadata);
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
  const resultText = `${pointsA}-${pointsB}`;
  const setsText = sets.length > 0 ? ` · ${sets.join(", ")}` : "";

  return [roundText, `${resultText}${setsText}`]
    .filter((item): item is string => Boolean(item))
    .join(": ");
}

function getNotificationTitle(
  event: ActivityEventRow,
  recipient: NotificationRecipient | null,
) {
  if (event.type === "season_player_joined") {
    const metadata = toRecord(event.metadata);
    const registeredCount = toNumber(metadata.registeredCount);
    const playerCapacity = toNumber(metadata.playerCapacity);

    return registeredCount > 0 && playerCapacity > 0
      ? `${event.actor_display_name ?? "Un jugador"} se ha unido · ${registeredCount}/${playerCapacity}.`
      : `${event.actor_display_name ?? "Un jugador"} se ha unido a la temporada.`;
  }

  if (event.type === "season_player_left") {
    const metadata = toRecord(event.metadata);
    const registeredCount = toNumber(metadata.registeredCount);
    const playerCapacity = toNumber(metadata.playerCapacity);

    return registeredCount >= 0 && playerCapacity > 0
      ? `La plantilla vuelve a tener ${registeredCount}/${playerCapacity} jugadores.`
      : "Se ha liberado una plaza de la temporada.";
  }

  if (event.type === "season_finished") {
    return "TEMPORADA FINALIZADA";
  }

  if (
    event.type === "court_booking_updated" ||
    event.type === "court_booking_payment_reminder"
  ) {
    return "Tienes pagos pendientes";
  }

  if (event.type === "court_booking_payment_paid") {
    return "Pago de pista recibido";
  }

  if (event.type === "season_registration_payment_reminder") {
    return "Recordatorio de inscripción";
  }

  if (event.type === "round_in_play") {
    return "Jornada en juego";
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

  if (event.type === "match_mvp_awarded") {
    const winnerPlayerIds = toStringArray(toRecord(event.metadata).playerIds);
    return recipient?.playerId && winnerPlayerIds.includes(recipient.playerId)
      ? "¡MVP del partido!"
      : "MVP del partido";
  }

  if (event.type === "round_mvp_awarded") {
    const winnerPlayerIds = toStringArray(toRecord(event.metadata).playerIds);
    return recipient?.playerId && winnerPlayerIds.includes(recipient.playerId)
      ? "¡MVP de la jornada!"
      : "MVP de la jornada";
  }

  if (event.type === "match_upcoming_reminder") {
    return "Próximo partido";
  }

  if (event.type === "match_result_saved") {
    return "Resultado registrado";
  }

  if (event.type === "match_result_updated") {
    const metadata = toRecord(event.metadata);

    if (metadata.resultLockOnly === true) {
      return metadata.resultLocked === true
        ? "Resultado definitivo"
        : "Resultado desbloqueado";
    }

    return "Resultado modificado";
  }

  if (event.type === "match_result_disputed") {
    return "Resultado incorrecto";
  }

  if (event.type === "match_result_cleared") {
    return "Resultado eliminado";
  }

  return event.title || "Smash & Lob";
}

function getNotificationBody(
  event: ActivityEventRow,
  recipient: NotificationRecipient | null,
  playerNamesById: Map<string, string>,
) {
  if (event.type === "season_created") {
    const metadata = toRecord(event.metadata);
    const playerCount = toNumber(metadata.playerCount);
    const totalRounds = toNumber(metadata.totalRounds);

    if (playerCount > 0 && totalRounds > 0) {
      return `${playerCount} jugadores · ${totalRounds} jornadas.`;
    }
  }

  if (event.type === "season_finished") {
    const metadata = toRecord(event.metadata);
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
    const pendingText = getPendingTransferText({
      event,
      recipient,
      playerNamesById,
    });

    if (pendingText) {
      return `Debes ${pendingText} por la reserva de pista.`;
    }
  }

  if (event.type === "court_booking_payment_paid") {
    const metadata = toRecord(event.metadata);
    const paidTransfer = toRecord(metadata.paidTransfer);
    const fromPlayerId = String(paidTransfer.fromPlayerId ?? "");
    const amount = toNumber(paidTransfer.amount);

    if (fromPlayerId && amount > 0) {
      return `${getPlayerName(fromPlayerId, playerNamesById)} ha pagado ${formatMoney(amount)} de la reserva de pista.`;
    }
  }

  if (event.type === "season_registration_payment_reminder") {
    const metadata = toRecord(event.metadata);
    const amount = toNumber(metadata.amount);
    const organizerName =
      typeof metadata.organizerName === "string" &&
      metadata.organizerName.trim()
        ? metadata.organizerName.trim()
        : "el organizador";

    return amount > 0
      ? `Recuerda saldar tu inscripción de ${formatMoney(amount)} con ${organizerName}.`
      : `Recuerda saldar tu inscripción con ${organizerName}.`;
  }

  if (event.type === "round_in_play") {
    const round = toRecord(event.metadata).round;
    return typeof round === "number"
      ? `La Jornada ${round} ya está en juego.`
      : "Hay una jornada en juego ahora mismo.";
  }

  if (event.type === "match_result_missing_reminder") {
    const round = toRecord(event.metadata).round;

    return typeof round === "number"
      ? `No olvides registrar el resultado de tu partido de la Jornada ${round}.`
      : "No olvides registrar el resultado de tu partido.";
  }

  if (event.type === "match_result_confirmation_reminder") {
    const round = toRecord(event.metadata).round;

    return typeof round === "number"
      ? `Revisa y confirma el resultado de tu partido de la Jornada ${round}.`
      : "Revisa y confirma el resultado de tu último partido.";
  }

  if (event.type === "match_mvp_vote_reminder") {
    const round = toRecord(event.metadata).round;

    return typeof round === "number"
      ? `Vota al MVP de tu partido de la Jornada ${round}.`
      : "Vota al MVP de tu último partido.";
  }

  if (event.type === "match_mvp_awarded") {
    const metadata = toRecord(event.metadata);
    const winnerPlayerIds = toStringArray(metadata.playerIds);
    const winnerNames = toStringArray(metadata.playerNames);
    const round = metadata.round;
    const winnerText = winnerNames.join(" / ");
    const isWinner = Boolean(
      recipient?.playerId && winnerPlayerIds.includes(recipient.playerId),
    );

    if (isWinner) {
      return winnerNames.length > 1
        ? `Enhorabuena, eres MVP compartido del partido de la Jornada ${round}.`
        : `Enhorabuena, eres el MVP del partido de la Jornada ${round}.`;
    }

    if (winnerText) {
      return `${winnerText} ${winnerNames.length > 1 ? "son" : "es"} el MVP del partido de la Jornada ${round}.`;
    }

    return event.description?.trim() || "Ya se ha decidido el MVP del partido.";
  }

  if (event.type === "round_mvp_awarded") {
    const metadata = toRecord(event.metadata);
    const winnerPlayerIds = toStringArray(metadata.playerIds);
    const winnerNames = toStringArray(metadata.playerNames);
    const round = metadata.round;
    const winnerText = winnerNames.join(" / ");
    const isWinner = Boolean(
      recipient?.playerId && winnerPlayerIds.includes(recipient.playerId),
    );

    if (isWinner) {
      return winnerNames.length > 1
        ? `Enhorabuena, eres MVP compartido de la Jornada ${round}.`
        : `Enhorabuena, eres el MVP de la Jornada ${round}.`;
    }

    if (winnerText && typeof round === "number") {
      return `${winnerText} ${winnerNames.length > 1 ? "son" : "es"} el MVP de la Jornada ${round}.`;
    }

    return (
      event.description?.trim() || "Ya se ha decidido el MVP de la jornada."
    );
  }
  if (event.type === "match_upcoming_reminder") {
    const metadata = toRecord(event.metadata);
    const location =
      typeof metadata.locationText === "string" && metadata.locationText.trim()
        ? metadata.locationText.trim()
        : null;

    return location
      ? `Prepárate para tu partido en ${location}.`
      : "Prepárate para tu partido.";
  }

  if (
    event.type === "match_result_saved" ||
    event.type === "match_result_updated"
  ) {
    const metadata = toRecord(event.metadata);

    if (
      event.type === "match_result_updated" &&
      metadata.resultLockOnly === true
    ) {
      return metadata.resultLocked === true
        ? "La administración ha fijado el resultado como definitivo."
        : "La administración ha desbloqueado el resultado para permitir correcciones.";
    }

    const resultText = getResultTextFromMetadata(event);

    if (resultText) {
      const confirmationMode = metadata.resultConfirmationMode;
      const confirmationText =
        confirmationMode === "none" ? "" : " Entra para confirmarlo.";

      return event.type === "match_result_updated"
        ? `Nuevo resultado: ${resultText}.${confirmationText}`
        : `Resultado: ${resultText}.${confirmationText}`;
    }
  }

  if (event.type === "match_result_disputed") {
    return "Un jugador ha marcado el resultado como incorrecto. Entra para revisarlo o corregirlo.";
  }

  const actor = event.actor_display_name || event.actor_email || "Smash & Lob";
  const description = event.description?.trim();

  if (description) {
    return description.length > 150
      ? `${description.slice(0, 147)}...`
      : description;
  }

  return `${actor} ha actualizado tu liga.`;
}

async function getRecipients({
  supabase,
  event,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  event: ActivityEventRow;
}) {
  let membershipsQuery = supabase
    .from("league_memberships")
    .select("user_id,player_id")
    .eq("league_id", event.league_id);

  const targetPlayerIds = await getTargetPlayerIds({ supabase, event });

  if (!isLeagueWideEvent(event.type)) {
    if (targetPlayerIds.length === 0) {
      return [];
    }

    membershipsQuery = membershipsQuery.in("player_id", targetPlayerIds);
  }

  const { data: memberships, error: membershipsError } = await membershipsQuery;

  if (membershipsError) {
    throw membershipsError;
  }

  const userIds = Array.from(
    new Set(
      ((memberships ?? []) as LeagueMembershipRow[])
        .map((membership) => membership.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );

  if (userIds.length === 0) {
    return [];
  }

  const { data: users, error: usersError } = await supabase
    .from("app_users")
    .select("id,email")
    .in("id", userIds);

  if (usersError) {
    throw usersError;
  }

  const actorEmail = normalizeEmail(event.actor_email);
  const excludedPlayerIds = getExcludedPlayerIds(event);

  const emailByUserId = new Map(
    ((users ?? []) as AppUserRow[]).map((user) => [
      user.id,
      normalizeEmail(user.email),
    ]),
  );

  return Array.from(
    new Map(
      ((memberships ?? []) as LeagueMembershipRow[])
        .map((membership) => {
          const userId = membership.user_id;
          const email = userId ? (emailByUserId.get(userId) ?? "") : "";
          const playerId = membership.player_id;

          if (!email || email === actorEmail) {
            return null;
          }

          if (playerId && excludedPlayerIds.has(playerId)) {
            return null;
          }

          return [
            email,
            {
              email,
              playerId,
            } satisfies NotificationRecipient,
          ] as const;
        })
        .filter((item): item is readonly [string, NotificationRecipient] =>
          Boolean(item),
        ),
    ).values(),
  );
}

async function filterByPreferences({
  supabase,
  leagueId,
  eventType,
  recipients,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  leagueId: string;
  eventType: ActivityEventType;
  recipients: NotificationRecipient[];
}) {
  if (recipients.length === 0) {
    return [];
  }

  if (isAlwaysEnabledNotificationEvent(eventType)) {
    return recipients;
  }

  const preferenceKey = getNotificationPreferenceKeyForEvent(eventType);

  if (!preferenceKey) {
    return [];
  }

  const recipientEmails = recipients.map((recipient) => recipient.email);

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("user_email,settings")
    .eq("league_id", leagueId)
    .in("user_email", recipientEmails);

  if (error) {
    throw error;
  }

  const settingsByEmail = new Map(
    ((data ?? []) as NotificationPreferenceRow[]).map((row) => [
      normalizeEmail(row.user_email),
      normalizeNotificationPreferences(row.settings),
    ]),
  );

  return recipients.filter((recipient) => {
    const preferences =
      settingsByEmail.get(recipient.email) ??
      normalizeNotificationPreferences(null);
    return preferences[preferenceKey];
  });
}

async function fetchPlayerNamesById({
  supabase,
  playerIds,
}: {
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
  playerIds: string[];
}) {
  const cleanPlayerIds = Array.from(new Set(playerIds.filter(Boolean)));

  if (cleanPlayerIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("players")
    .select("id,display_name")
    .in("id", cleanPlayerIds);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as PlayerRow[]).map((player) => [
      player.id,
      player.display_name || player.id,
    ]),
  );
}

function getRelevantPlayerIds(
  event: ActivityEventRow,
  recipients: NotificationRecipient[],
) {
  const metadata = toRecord(event.metadata);
  const playerIds = new Set<string>();

  recipients.forEach((recipient) => {
    if (recipient.playerId) {
      playerIds.add(recipient.playerId);
    }
  });

  toStringArray(metadata.participantIds).forEach((playerId) =>
    playerIds.add(playerId),
  );
  toStringArray(metadata.pendingPlayerIds).forEach((playerId) =>
    playerIds.add(playerId),
  );

  toTransfers(metadata.transfers).forEach((transfer) => {
    playerIds.add(transfer.fromPlayerId);
    playerIds.add(transfer.toPlayerId);
  });

  const paidTransfer = toRecord(metadata.paidTransfer);
  const fromPlayerId = String(paidTransfer.fromPlayerId ?? "");
  const toPlayerId = String(paidTransfer.toPlayerId ?? "");

  if (fromPlayerId) playerIds.add(fromPlayerId);
  if (toPlayerId) playerIds.add(toPlayerId);

  return Array.from(playerIds);
}

export async function dispatchPushForActivityEvent(
  eventId: string,
): Promise<PushDispatchResult> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, sent: 0, reason: "missing_service_role" };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    return { ok: false, sent: 0, reason: "missing_vapid" };
  }

  const { data: eventData, error: eventError } = await supabase
    .from("activity_events")
    .select(
      "id,league_id,season_id,match_id,actor_email,actor_display_name,type,title,description,metadata",
    )
    .eq("id", eventId)
    .single();

  if (eventError) {
    return { ok: false, sent: 0, error: eventError.message };
  }

  const event = eventData as ActivityEventRow;

  if (!isAlwaysEnabledNotificationEvent(event.type)) {
    const { data: leagueData, error: leagueError } = await supabase
      .from("leagues")
      .select("activity_settings")
      .eq("id", event.league_id)
      .maybeSingle();

    if (leagueError) {
      return { ok: false, sent: 0, error: leagueError.message };
    }

    const leagueSettings = normalizeLeagueActivitySettings(
      leagueData?.activity_settings,
    );

    if (getActivityDeliveryMode(leagueSettings, event.type) !== "notify") {
      return { ok: true, sent: 0, reason: "disabled_by_league" };
    }
  }

  const recipients = await getRecipients({ supabase, event });
  const allowedRecipients = await filterByPreferences({
    supabase,
    leagueId: event.league_id,
    eventType: event.type,
    recipients,
  });

  if (allowedRecipients.length === 0) {
    return { ok: true, sent: 0 };
  }

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_email,endpoint,p256dh,auth")
    .eq("league_id", event.league_id)
    .eq("enabled", true)
    .in(
      "user_email",
      allowedRecipients.map((recipient) => recipient.email),
    );

  if (subscriptionsError) {
    return { ok: false, sent: 0, error: subscriptionsError.message };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { ok: true, sent: 0 };
  }

  const webPush = await import("web-push");

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const recipientByEmail = new Map(
    allowedRecipients.map((recipient) => [recipient.email, recipient]),
  );
  const playerNamesById = await fetchPlayerNamesById({
    supabase,
    playerIds: getRelevantPlayerIds(event, allowedRecipients),
  });
  let sent = 0;

  await Promise.all(
    (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
      const recipient =
        recipientByEmail.get(normalizeEmail(subscription.user_email)) ?? null;
      const payload = JSON.stringify({
        title: getNotificationTitle(event, recipient),
        body: getNotificationBody(event, recipient, playerNamesById),
        url: getNotificationUrl(event),
        tag: `smash-lob-${event.id}`,
      });

      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .update({ enabled: false, updated_at: new Date().toISOString() })
            .eq("id", subscription.id);
        }
      }
    }),
  );

  return { ok: true, sent };
}
