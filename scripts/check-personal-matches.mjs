import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  baseMigration,
  extensionMigration,
  listRoute,
  detailRoute,
  peopleRoute,
  serverHelper,
  leaguesPage,
  personalPage,
  newPage,
  detailPage,
  card,
  schedulePanel,
  appShell,
  leagueGate,
  settingsPage,
  tours,
  matchEventMeta,
  personalNav,
  personalMatchesLib,
  personalProfilePage,
  personalProfileStats,
  detailPairingPanel,
  personalProfileView,
  matchDetailView,
  participantsPanel,
  participantSelector,
  requestHelper,
  bookingMigration,
  bookingRoute,
  bookingTransferRoute,
  bookingPanel,
  locationPicker,
  personalChatsPage,
  personalChatsRoute,
  personalChatPage,
  sharedMatchChat,
  dashboardMigration,
  sharedBookingPanel,
  paymentLedger,
  paymentLedgerRoute,
  paymentsPage,
] = await Promise.all([
  read("supabase/migrations/20260808110500_add_personal_matches.sql"),
  read("supabase/migrations/20260808124000_extend_personal_matches_schedule.sql"),
  read("src/app/api/personal-matches/route.ts"),
  read("src/app/api/personal-matches/[id]/route.ts"),
  read("src/app/api/personal-matches/people/route.ts"),
  read("src/lib/serverPersonalMatches.ts"),
  read("src/app/leagues/page.tsx"),
  read("src/app/personal-matches/page.tsx"),
  read("src/app/personal-matches/new/page.tsx"),
  read("src/app/personal-matches/[id]/page.tsx"),
  read("src/components/personal/PersonalMatchCard.tsx"),
  read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
  read("src/components/layout/AppShell.tsx"),
  read("src/components/auth/LeagueEntryGate.tsx"),
  read("src/app/settings/page.tsx"),
  read("src/features/onboarding/tours.ts"),
  read("src/components/matches/MatchEventMeta.tsx"),
  read("src/components/personal/PersonalMatchesNav.tsx"),
  read("src/lib/personalMatches.ts"),
  read("src/app/personal-matches/profile/page.tsx"),
  read("src/lib/personalProfileStats.ts"),
  read("src/components/match/MatchDetailPairingPanel.tsx"),
  read("src/components/personal/PersonalProfileStatistics.tsx"),
  read("src/components/match/MatchDetailView.tsx"),
  read("src/components/personal/PersonalMatchParticipantsPanel.tsx"),
  read("src/components/personal/PersonalMatchParticipantSelector.tsx"),
  read("src/lib/serverPersonalMatchRequest.ts"),
  read("supabase/migrations/20260818133000_add_personal_match_bookings.sql"),
  read("src/app/api/personal-matches/[id]/court-booking/route.ts"),
  read("src/app/api/personal-matches/[id]/court-booking/transfers/[transferId]/route.ts"),
  read("src/components/personal/PersonalMatchCourtBookingPanel.tsx"),
  read("src/components/personal/PersonalMatchLocationPicker.tsx"),
  read("src/app/personal-matches/chats/page.tsx"),
  read("src/app/api/personal-matches/chats/route.ts"),
  read("src/app/personal-matches/[id]/chat/page.tsx"),
  read("src/components/match/chat/MatchChatShared.tsx"),
  read("supabase/migrations/20260819173000_personal_locations_and_match_dashboard.sql"),
  read("src/components/match/CourtBookingPanel.tsx"),
  read("src/lib/paymentLedger.ts"),
  read("src/app/api/payments/ledger/route.ts"),
  read("src/app/payments/page.tsx"),
])

for (const table of ["personal_matches", "personal_match_participants"]) {
  assert(baseMigration.includes(`public.${table}`), `Falta la tabla ${table}`)
}
assert(baseMigration.includes("server_create_personal_match"), "Falta la creación transaccional del amistoso")
assert(baseMigration.includes("enable row level security"), "Las tablas personales deben tener RLS")
assert(baseMigration.includes("from public, anon, authenticated"), "Las tablas personales no deben ser accesibles desde navegador")
assert(baseMigration.includes("to service_role"), "service_role debe poder operar con partidos personales")

for (const snippet of [
  "status text not null default 'finished'",
  "server_list_user_match_history",
  "server_next_user_matches",
  "from public.matches m",
  "from public.personal_matches pm",
  "five-argument RPC as a compatibility wrapper",
]) {
  assert(extensionMigration.includes(snippet), `Falta extensión personal: ${snippet}`)
}
assert(extensionMigration.includes("from public, anon, authenticated"), "Los nuevos RPC deben seguir cerrados al navegador")
assert(extensionMigration.includes("to service_role"), "Los nuevos RPC deben ser service-role only")

for (const route of [listRoute, detailRoute, peopleRoute]) {
  assert(route.includes("requireAuthenticatedAppUser"), "Todas las APIs personales deben requerir autenticación")
}
assert(listRoute.includes("enforceRequestRateLimit"), "La creación de amistosos debe tener rate limit")
assert(detailRoute.includes("enforceRequestRateLimit"), "La edición y borrado de amistosos deben tener rate limit")
assert(detailRoute.includes("export async function PATCH"), "El amistoso debe admitir programación y resultado posterior")
assert(listRoute.includes("personal_match_requires_current_user"), "El creador debe formar parte del partido")
assert(listRoute.includes("p_status: status"), "La creación debe persistir el estado programado/finalizado")

assert(leaguesPage.includes('href="/personal-matches"'), "Mis ligas debe enlazar a Mis partidos")
assert(leaguesPage.includes("partidos de liga") && leaguesPage.includes("amistosos"), "Mis ligas debe explicar el historial agregado")
assert(personalPage.includes("const pageSize = 10"), "El historial debe paginar diez partidos cada vez")
assert(personalPage.includes("Cargar 10 más"), "Debe existir carga incremental de diez partidos")
assert(personalPage.includes("dashboard.upcoming.length > 0"), "Próximos partidos debe ocultarse por completo cuando no hay amistosos futuros")
assert(personalPage.includes("Próximos partidos"), "Falta el bloque de próximos amistosos")
assert(personalPage.includes("dashboard.upcoming.map"), "Próximos partidos debe mostrar todos los amistosos futuros")
assert(!personalPage.includes("upcomingScope"), "Próximos no debe volver a mezclar Liga y Amistoso")
const nextMatchesFunction = dashboardMigration.slice(
  dashboardMigration.indexOf("create or replace function public.server_next_user_matches"),
)
assert(nextMatchesFunction.includes("'friendly'::text as source"), "Próximos debe consultar amistosos")
assert(!nextMatchesFunction.includes("'league'::text as source"), "Los partidos de Liga nunca deben aparecer en Próximos")
assert(dashboardMigration.includes("pm.status = 'scheduled' and pm.played_at < now()"), "Un amistoso scheduled pasado debe entrar en el historial")
assert(serverHelper.includes("loadScheduledFriendlyIndex"), "El servidor debe completar amistosos programados sin depender del orden de despliegue de la migración")
assert(serverHelper.includes('return loadScheduledFriendlyIndex(actor, "future")'), "Próximos debe cargar directamente todos los amistosos futuros")
assert(serverHelper.includes('loadScheduledFriendlyIndex(actor, "past")'), "El historial debe completar amistosos scheduled cuya fecha ya pasó")
assert(serverHelper.includes("server_list_user_match_history"), "La paginación debe resolverse en base de datos")
assert(serverHelper.includes("safeLimit + 1"), "La API debe detectar si existen más páginas")
assert(serverHelper.includes('origin: "league"') && serverHelper.includes('origin: "friendly"'), "El servidor debe normalizar liga y amistoso sin duplicarlos")

assert(card.includes("getPersonalMatchSetWins"), "Las tarjetas deben mostrar los sets ganados junto a cada pareja")
assert(card.includes("SetGameScore"), "Mis partidos debe reutilizar el marcador por set del Calendario")
assert(card.includes("getPersonalMatchOutcome"), "Las tarjetas deben mostrar Victoria/Derrota para el usuario")
assert(card.includes('aria-label="Juegos por set de la pareja A"') && card.includes('aria-label="Juegos por set de la pareja B"'), "Cada pareja debe mostrar sus juegos por set")
assert(card.includes('rounded-xl bg-neutral-50 px-3 py-2'), "Cada pareja debe conservar el panel visual del Calendario")
assert(card.includes("getPersonalMatchTeamPlayers"), "Los nombres deben renderizarse por participante")
assert(card.includes("ClickableChevron") && card.includes("showPersonalMatchChevron = false"), "El chevron de partido debe conservarse en código pero quedar oculto")
assert(card.includes("getPersonalMatchOriginLabel(match)"), "Liga/Amistoso debe permanecer en la cabecera")
assert(card.includes("MatchEventMeta"), "Fecha, hora y ubicación deben usar el bloque compartido")
assert(card.includes("locationText={match.locationName}"), "La ubicación debe mostrarse debajo de las parejas")
assert(card.includes("locationFallback={null}") && card.includes("hideMissingRows"), "El historial debe ocultar por separado fecha y ubicación ausentes")
assert(card.includes("getPersonalMatchOriginBadgeStyle(match)"), "Cada liga debe aplicar su color estable propio")
assert(matchEventMeta.includes('weekday: "long"') && matchEventMeta.includes('hour: "2-digit"'), "El bloque compartido debe mostrar día, fecha y hora")

assert(newPage.includes("<PersonalMatchParticipantSelector"), "El alta debe reutilizar el selector compartido de participantes")
assert(participantSelector.includes("Otro jugador..."), "Debe ser posible registrar jugadores externos")
assert(participantSelector.includes("sourceLeagueNames"), "Debe reutilizar jugadores conocidos de ligas compartidas")
assert(newPage.includes("Crear encuentro") && newPage.includes("Resultado · opcional"), "El alta debe usar un único flujo con resultado opcional")
assert(newPage.includes("includeResult") && newPage.includes('status: includeResult ? "finished" : "scheduled"'), "El resultado opcional debe decidir si el encuentro se guarda programado o finalizado")
assert(!newPage.includes(">\n          Programar\n") && !newPage.includes(">\n          Ya jugado\n"), "No deben volver las pestañas Programar / Ya jugado")
assert(personalPage.includes('aria-label="Crear nuevo encuentro"') && personalPage.includes('href="/personal-matches/new"'), "Mis partidos debe ofrecer el botón flotante para crear un encuentro")
assert(detailPage.includes("<MatchDetailView"), "El detalle personal debe usar la pantalla compartida de partido")
assert(matchDetailView.includes("<MatchDetailPairingPanel"), "La pantalla compartida debe ser dueña del emparejamiento")
assert(!detailPage.includes("<MatchScoreboard"), "El detalle personal no debe reutilizar el marcador compacto")
assert(matchDetailView.includes("items-start justify-between"), "El detalle compartido debe reservar la esquina derecha para estado y acciones")
assert(!detailPage.includes('tracking-[0.12em] text-slate-700'), "El detalle amistoso no debe mostrar una etiqueta Amistoso separada")
assert(detailPage.includes("buildPersonalMatchDetailModel"), "El amistoso debe normalizar jugadores y avatares mediante el modelo compartido")
assert(detailPage.includes("<PersonalMatchParticipantsPanel"), "El detalle amistoso debe permitir editar pareja y contrincantes")
assert(participantsPanel.includes('action: "participants"') && participantsPanel.includes("<PersonalMatchParticipantSelector"), "El editor de amistoso debe reutilizar el selector y persistir por PATCH")
assert(detailRoute.includes('action !== "participants"') && detailRoute.includes("replacePersonalMatchParticipants"), "PATCH debe soportar cambios de participantes")
assert(serverHelper.includes("replacePersonalMatchParticipants") && serverHelper.includes("personal_match_requires_current_user"), "El servidor debe reemplazar participantes manteniendo al usuario actual")
assert(requestHelper.includes("normalizePersonalMatchParticipantDrafts"), "Alta y edición deben compartir validación de participantes")
assert(!detailPairingPanel.includes(">\n          Emparejamiento\n        </h2>") && detailPairingPanel.includes("Pareja A") && detailPairingPanel.includes("Pareja B"), "El panel propio debe omitir el titulo Emparejamiento y mantener Pareja A y Pareja B")
assert(detailPairingPanel.includes("const pairPlayers = playerIds.map") && detailPairingPanel.includes("<PlayerAvatar") && detailPairingPanel.includes("`#${position} en liga`") && detailPairingPanel.includes('metadataPlacement={index === 0 ? "before-name" : "after-name"}'), "El panel propio debe separar los avatares y ordenar posicion/perfil/nombre de forma simetrica antes del resultado")
assert(detailPairingPanel.includes("const showAvatars = [...teamA, ...teamB].some") && detailPairingPanel.includes("isSafeImageUrl(getPlayerById(playerId, players)?.avatarUrl)"), "El panel propio debe ocultar las fotos cuando ninguno de los cuatro jugadores tiene imagen real")
assert(detailPairingPanel.includes('alignment="left"') && detailPairingPanel.includes('alignment="right"') && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"'), "Pareja B debe alinear a la derecha todo el contenido textual de cada jugador")
assert(detailPairingPanel.includes("type-caption font-bold uppercase leading-none tracking-wide") && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"') && !detailPairingPanel.includes("truncate text-center text-[12px]"), "Los títulos Pareja A y Pareja B deben ser pequeños y alinearse con los nombres de sus jugadores")
assert(detailPairingPanel.includes('const hasResult = sets.length > 0 || (pointsA !== null && pointsB !== null)') && detailPairingPanel.includes('<FinishedPairRow') && detailPairingPanel.includes('className="space-y-2.5"'), "El detalle debe cambiar a un marcador vertical protagonista cuando ya hay resultado")
assert(detailPairingPanel.includes('function FinishedPlayerName({') && detailPairingPanel.includes('showPendingPlayerMetadata?: boolean') && detailPairingPanel.includes('showFinishedPlayerMetadata?: boolean') && detailPairingPanel.includes('const showPendingMetadata = pendingPlayerMetadata || showRankingPosition') && detailPairingPanel.includes('showMetadata={showPendingMetadata}') && detailPairingPanel.includes('showPlayerMetadata={finishedPlayerMetadata}'), "La posición debe seguir limitada a Liga y el perfil de juego debe usar la misma política de visibilidad en Liga y amistosos")
assert(detailPairingPanel.includes('side: "a" | "b"') && detailPairingPanel.includes('side="a"') && detailPairingPanel.includes('side="b"') && !detailPairingPanel.includes('mb-1.5 text-left type-caption font-bold uppercase leading-none tracking-wide text-neutral-500') && !detailPairingPanel.includes('mt-1.5 text-left type-caption font-bold uppercase leading-none tracking-wide text-neutral-500'), "El resultado debe omitir los textos Pareja A/Pareja B y distinguir los lados solo de forma interna")
assert(!detailPairingPanel.includes('type-caption font-bold uppercase tracking-wide text-neutral-400'), "El resultado no debe mostrar numeracion 1/2/3 sobre los juegos")
assert(!detailPairingPanel.includes('showAvatars={showAvatars}') && !detailPairingPanel.includes('alignment: "left" | "right"\n  showAvatars: boolean'), "El resultado vertical no debe mostrar avatares; las imagenes quedan solo para el modo pendiente")
assert(detailPairingPanel.includes('relative mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4') && detailPairingPanel.includes('pointer-events-none absolute left-1/2 top-1/2 z-20') && detailPairingPanel.includes('>\n                  VS\n                </span>') && detailPairingPanel.includes('flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 type-caption font-black uppercase tracking-wide text-white shadow-sm'), "Sin resultado, el panel de detalle debe mantener el VS pequeño y flotante")
assert(detailPairingPanel.includes('rounded-2xl bg-neutral-50 px-3 py-3 sm:px-4 sm:py-3.5') && detailPairingPanel.includes('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3') && detailPairingPanel.includes('import { SetGameScore } from "@/components/matches/SetGameScore"') && detailPairingPanel.includes('<SetGameScore key={index} value={ownScore} won={ownScore > rivalScore} />') && !detailPairingPanel.includes('bg-neutral-100 font-black text-neutral-800 ring-neutral-200') && !detailPairingPanel.includes('bg-neutral-50 font-bold text-neutral-500 ring-neutral-200') && detailPairingPanel.includes('h-9 min-w-9 items-center justify-center self-center rounded-md') && detailPairingPanel.includes('relative -translate-y-0.5 ml-1 flex h-9 min-w-9 items-center justify-center self-center rounded-md bg-white px-2 text-base font-black leading-none text-neutral-950 ring-1 ring-inset ring-neutral-200 shadow-sm') && detailPairingPanel.includes('mb-1.5 mr-1 border-t border-neutral-300') && detailPairingPanel.includes('className={index === 0 ? "pb-2" : "pt-0"}'), "El resultado debe reutilizar los chips neutros de CALENDARIO, marcar solo el ganador en negrita y estrechar ligeramente cada dato sin cambiar el panel")
assert(detailPairingPanel.includes('className="grid grid-cols-2 items-start gap-2 sm:gap-4"') && detailPairingPanel.includes('{showAvatars ? (') && detailPairingPanel.includes('<PairAvatars playerIds={teamA} players={players} alignment="left" />') && detailPairingPanel.includes('<PairAvatars playerIds={teamB} players={players} alignment="right" />') && detailPairingPanel.includes('className="relative mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4"') && detailPairingPanel.includes('pointer-events-none absolute left-1/2 top-1/2 z-20'), "La vista sin resultado debe conservar exactamente su estructura de dos parejas, avatares y VS flotante")
assert(serverHelper.includes('.select("id,avatar_url")') && serverHelper.includes("avatarUrlByUserId"), "El servidor debe recuperar avatares de participantes vinculados")
assert(detailPage.includes("<PersonalMatchSchedulePanel"), "El detalle debe incluir fecha, ubicación y acciones")
assert(schedulePanel.includes("<MatchScheduleForm"), "La programación personal debe reutilizar MatchScheduleForm de Liga")
assert(newPage.includes("<PersonalMatchLocationPicker") && schedulePanel.includes("<MatchScheduleForm"), "Alta mantiene su selector y el detalle reutiliza el selector global de MatchScheduleForm")
assert(locationPicker.includes('role="dialog"') && locationPicker.includes("backdrop-blur"), "La ubicación personal debe abrirse como popup con fondo difuminado")
assert(participantSelector.includes('createPortal') && participantSelector.includes('aria-modal="true"') && participantSelector.includes('backdrop-blur-[1px]'), "El selector de jugadores debe abrirse como popup flotante con fondo difuminado")
assert(personalChatsPage.includes("data-personal-match-chats-list") && personalChatsPage.includes("Todavía no tienes chats de amistosos"), "Mis partidos debe incluir una bandeja con todos los chats de amistosos")
assert(personalChatsRoute.includes('.from("personal_matches")') && !personalChatsRoute.includes('.eq("status"'), "La bandeja de amistosos no debe filtrar por estado")
assert(personalChatsRoute.includes("personal_match_chat_schema_missing"), "La bandeja de amistosos debe distinguir una migración de chat pendiente")
for (const sharedToken of ["MatchChatScreen", "MatchChatTextMessage", "MatchChatComposer", "MatchChatReadOnlyBar", "MatchChatWriteWindowBanner", "useMatchChatViewport", "useMatchChatAutoScroll"]) {
  assert(personalChatPage.includes(sharedToken), `El chat de amistosos debe reutilizar ${sharedToken}`)
}
assert(sharedMatchChat.includes("<PlayerAvatar") && sharedMatchChat.includes("<MatchChatSendIcon />") && sharedMatchChat.includes("MatchChatMessageReceipt"), "La identidad, envío y recibos del chat deben vivir en la base compartida")
assert(!personalChatPage.includes("<PlayerAvatar") && !personalChatPage.includes("<MatchChatSendIcon"), "El chat de amistosos no debe duplicar avatar ni botón de envío")
assert(bookingMigration.includes("public.personal_match_bookings") && bookingMigration.includes("enable row level security"), "Falta almacenamiento protegido para pagos personales")
assert(bookingMigration.includes("from public, anon, authenticated") && bookingMigration.includes("to service_role"), "Los pagos personales deben quedar cerrados al navegador")
assert(bookingRoute.includes("requireAuthenticatedAppUser") && bookingRoute.includes("getPersonalMatchBookingAccess"), "La reserva personal debe validar autenticación y participación")
assert(bookingTransferRoute.includes("requireAuthenticatedAppUser") && bookingTransferRoute.includes("currentParticipantId"), "Los pagos personales deben validar al participante")
assert(detailPage.includes("<PersonalMatchCourtBookingPanel") && bookingPanel.includes("<CourtBookingPanel"), "El amistoso debe reutilizar Pagos y reservas")
assert(sharedBookingPanel.includes("participantIds.includes(currentUserId)") && sharedBookingPanel.includes("return [currentUserId]"), "Una reserva nueva debe preseleccionar al usuario actual para que el importe de pista sea editable")
assert(sharedBookingPanel.includes("editableBallPurchaseInput") && sharedBookingPanel.includes("onFocus={() =>"), "El importe de bolas debe poder iniciar la selección del comprador sin quedar bloqueado")
assert(paymentLedger.includes('PaymentLedgerSource = "league" | "friendly"'), "El ledger debe distinguir Liga y Amistoso")
assert(paymentLedgerRoute.includes('.from("league_memberships")') && paymentLedgerRoute.includes('.from("personal_match_bookings")'), "Mis pagos debe agregar ligas y amistosos desde servidor")
assert(paymentLedgerRoute.includes('requireAuthenticatedAppUser'), "El ledger global debe exigir autenticación")
assert(paymentsPage.includes('type PaymentScope = "all" | "league" | "friendly"'), "Mis pagos debe ofrecer Todos, Liga actual y Amistosos")
assert(paymentsPage.includes('filterPaymentLedgerItems') && paymentsPage.includes('selectedLeagueId') && paymentsPage.includes('selectedSeasonId'), "Los filtros de Mis pagos deben separar Todos, una liga/temporada concreta y los amistosos")
assert(settingsPage.includes("fetchPaymentLedger") && settingsPage.includes("getPaymentLedgerPendingSummary"), "Ajustes debe mostrar el resumen global de pagos pendientes")
assert(detailPage.includes("<PersonalMatchResultForm"), "El detalle debe permitir registrar/corregir resultado")
assert(schedulePanel.includes("<MatchScheduleForm"), "El detalle debe delegar ubicación y mapa en el panel compartido")
assert(schedulePanel.includes("PersonalAddToCalendarButton"), "El detalle debe permitir añadir al calendario")

assert(appShell.includes("isPersonalMatchesRoute"), "El shell debe detectar el modo personal")
assert(appShell.includes("const shouldShowSettingsButton"), "El modo personal debe conservar Ajustes")
assert(appShell.includes("!isPersonalMatchesRoute"), "El modo personal debe ocultar la navegación completa y los controles de liga")
assert(appShell.includes("shouldShowPersonalMatchesNav"), "El shell debe activar la navegación compacta del modo personal")
assert(appShell.includes("<PersonalMatchesNav"), "El shell debe renderizar la navegación compacta de Mis partidos")
assert(personalNav.includes('aria-label="Navegación de Mis partidos"'), "La navegación personal debe ser accesible")
for (const label of ["Mis ligas", "Mis partidos", "Chats", "Mi perfil"]) {
  assert(personalNav.includes(label), `Falta el destino ${label} en la navegación personal`)
}
assert(!personalNav.includes('label: "+ Partido"'), "La navegación personal no debe incluir + Partido")
assert(personalNav.includes('href: "/leagues"'), "La navegación personal debe enlazar a Mis ligas")
assert(personalNav.includes('href: "/personal-matches/chats"'), "La navegación personal debe enlazar a todos los chats de amistosos")
assert(personalNav.includes('href: "/personal-matches/profile"'), "La navegación personal debe enlazar al perfil global")
assert(personalNav.includes("grid-cols-4"), "La navegación personal debe repartir cuatro destinos")
assert(personalNav.includes('root.dataset.bottomNavVisible = "true"'), "La NAVBAR personal debe activar la superficie segura inferior")
assert(personalNav.includes('paddingBottom: "env(safe-area-inset-bottom)"'), "La NAVBAR personal debe respetar el safe area inferior")
assert(appShell.includes('href={`/settings?returnTo=${encodeURIComponent(pathname)}`}'), "Ajustes debe conservar la ruta personal de origen")
assert(appShell.includes("const isSettingsRoute ="), "El shell debe tratar Ajustes como contexto neutral")
assert(personalProfilePage.includes("Perfil global"), "Debe existir un perfil global dentro de Mis partidos")
assert(personalProfilePage.includes("Todos los partidos") && personalProfilePage.includes("Partidos de liga"), "El perfil global debe filtrar por origen")
assert(personalProfilePage.includes("Todas las ligas") && personalProfilePage.includes("Todas las temporadas"), "El perfil global debe filtrar por liga y temporada")
assert(personalProfileStats.includes("filterPersonalProfileMatches") && personalProfileStats.includes("getPersonalProfileStats"), "Las estadísticas globales deben calcularse desde el historial personal")
assert(personalProfileStats.includes("getPersonalProfileHeadToHead") && personalProfileStats.includes("bestTeammate") && personalProfileStats.includes("nemesis"), "El perfil global debe incluir parejas, rivales y cara a cara")
assert(personalProfileStats.includes("decidingSetMatches") && personalProfileStats.includes("comebackWins") && personalProfileStats.includes("currentForm"), "El perfil global debe incluir rendimiento avanzado y forma reciente")
assert(personalProfilePage.includes("includeAvatars=1"), "El perfil global debe cargar avatares para relaciones y cara a cara")
assert(personalProfileView.includes("Parejas / rivales") && personalProfileView.includes("Cara a cara") && personalProfileView.includes("Mejor pareja") && personalProfileView.includes("Némesis"), "La UI del perfil debe exponer las nuevas estadísticas")
assert(personalProfileView.includes("Enfrentamientos directos") && personalProfileView.includes("Rendimiento de la pareja"), "Cara a cara debe distinguir rivalidad y partidos como pareja")
assert(personalMatchesLib.includes("personKey?: string | null"), "Los participantes del histórico deben exponer una identidad estable opcional")
assert(serverHelper.includes("getParticipantPersonKey") && serverHelper.includes('`user:${userId}`') && serverHelper.includes('`player:${playerId}`'), "El histórico global debe unificar identidades vinculadas entre ligas")
assert(listRoute.includes('searchParams.get("includeAvatars")'), "La API debe permitir cargar avatares solo cuando el perfil global los necesita")
assert(serverHelper.includes("seasonName"), "El historial de liga debe incluir el nombre de temporada para el filtro global")
assert(
  personalPage.includes("<BackButton"),
  "La raíz de Mis partidos debe mostrar Volver",
)
assert(
  !personalPage.includes('href="/leagues"'),
  "La raíz de Mis partidos no debe duplicar el acceso Ligas de la NAVBAR",
)
assert(newPage.includes("<BackButton") && detailPage.includes("<MatchDetailView") && matchDetailView.includes("<BackButton"), "Crear y detalle deben conservar el botón Volver")
for (const forbiddenColor of ["red-", "rose-", "green-", "emerald-", "lime-", "teal-"]) {
  assert(!personalMatchesLib.includes(forbiddenColor), `El origen de partido no debe usar ${forbiddenColor}`)
}
assert(personalMatchesLib.includes("friendlyBadgeStyle"), "Amistoso debe tener un color propio estable")
assert(personalMatchesLib.includes("stableStringHash"), "El color de cada liga debe ser estable entre cargas")
assert(leagueGate.includes("isPersonalMatchesRoute"), "La puerta de liga debe permitir el historial personal")
assert(settingsPage.includes('tour="settings-context-switcher"'), "Ajustes debe señalar el acceso Mis ligas/Mis partidos")
assert(tours.includes("Tus ligas y Mis partidos"), "El tutorial de Ajustes debe explicar ambos contextos")
assert(tours.includes("version: 3"), "La guía de Ajustes debe incrementar versión para volver a mostrarse")
assert(!(baseMigration + extensionMigration).toLowerCase().includes("pretemporada"), "El modelo personal no debe introducir pretemporada")

console.log("Mis partidos v1.10.20 correcto:")
console.log("- historial agregado de liga + amistosos sin duplicar datos competitivos")
console.log("- historial paginado de 10 en 10 y todos los amistosos futuros en Próximos, sin partidos de Liga")
console.log("- liga y amistoso comparten MatchDetailView y una base común de CHAT")
console.log("- amistosos programados permiten editar pareja y contrincantes")
console.log("- origen por liga con color estable y metadatos ausentes ocultos de forma independiente")
console.log("- un único amistoso compartido por cuentas vinculadas y externos permitidos")
console.log("- perfil global con rendimiento, parejas, rivales, rankings y cara a cara filtrable")
console.log("- NAVBAR personal protegida frente a la barra de gestos y Ajustes con retorno de contexto")
console.log("- API autenticada, rate limit y persistencia service-role only")
