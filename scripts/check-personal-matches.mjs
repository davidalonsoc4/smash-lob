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
assert(personalPage.includes("!loading && selectedUpcoming ? ("), "Próximo partido debe ocultarse por completo cuando no existe")
assert(personalPage.includes("Próximo partido"), "Falta el bloque condicional de próximo partido")
assert(!personalPage.includes("Sin partidos programados"), "No debe mostrarse un estado vacío para Próximo partido")
assert(personalPage.includes("hasBothUpcoming"), "El selector Liga/Amistoso debe mostrarse solo cuando existen ambos próximos")
assert(personalPage.includes('scope === "league" ? "Liga" : "Amistoso"'), "Falta selector Liga/Amistoso")
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
assert(newPage.includes("Programar") && newPage.includes("Ya jugado"), "El alta debe permitir programar o registrar un partido ya jugado")
assert(detailPage.includes("<MatchDetailView"), "El detalle personal debe usar la pantalla compartida de partido")
assert(matchDetailView.includes("<MatchDetailPairingPanel"), "La pantalla compartida debe ser dueña del emparejamiento")
assert(!detailPage.includes("<MatchScoreboard"), "El detalle personal no debe reutilizar el marcador compacto")
assert(matchDetailView.includes("items-start justify-between"), "El detalle compartido debe reservar la esquina derecha para estado y acciones")
assert(!detailPage.includes('tracking-[0.12em] text-slate-700'), "El detalle amistoso no debe mostrar una etiqueta Amistoso separada")
assert(detailPage.includes("avatarUrl: participant.avatarUrl ?? null"), "El amistoso debe trasladar los avatares al panel de emparejamiento")
assert(detailPage.includes("<PersonalMatchParticipantsPanel"), "El detalle amistoso debe permitir editar pareja y contrincantes")
assert(participantsPanel.includes('action: "participants"') && participantsPanel.includes("<PersonalMatchParticipantSelector"), "El editor de amistoso debe reutilizar el selector y persistir por PATCH")
assert(detailRoute.includes('action !== "participants"') && detailRoute.includes("replacePersonalMatchParticipants"), "PATCH debe soportar cambios de participantes")
assert(serverHelper.includes("replacePersonalMatchParticipants") && serverHelper.includes("personal_match_requires_current_user"), "El servidor debe reemplazar participantes manteniendo al usuario actual")
assert(requestHelper.includes("normalizePersonalMatchParticipantDrafts"), "Alta y edición deben compartir validación de participantes")
assert(!detailPairingPanel.includes(">\n          Emparejamiento\n        </h2>") && detailPairingPanel.includes("Pareja A") && detailPairingPanel.includes("Pareja B"), "El panel propio debe omitir el titulo Emparejamiento y mantener Pareja A y Pareja B")
assert(detailPairingPanel.includes("const pairPlayers = playerIds.map") && detailPairingPanel.includes("<PlayerAvatar") && detailPairingPanel.includes("#{position} en liga"), "El panel propio debe separar los avatares de los paneles de nombre y admitir posición en liga")
assert(detailPairingPanel.includes("const showAvatars = [...teamA, ...teamB].some") && detailPairingPanel.includes("isSafeImageUrl(getPlayerById(playerId, players)?.avatarUrl)"), "El panel propio debe ocultar las fotos cuando ninguno de los cuatro jugadores tiene imagen real")
assert(detailPairingPanel.includes('alignment="left"') && detailPairingPanel.includes('alignment="right"') && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"'), "Pareja B debe alinear a la derecha todo el contenido textual de cada jugador")
assert(detailPairingPanel.includes("type-caption font-bold uppercase leading-none tracking-wide") && detailPairingPanel.includes('alignment === "right" ? "text-right" : "text-left"') && !detailPairingPanel.includes("truncate text-center text-[12px]"), "Los títulos Pareja A y Pareja B deben ser pequeños y alinearse con los nombres de sus jugadores")
assert(detailPairingPanel.includes('const hasResult = sets.length > 0 || (pointsA !== null && pointsB !== null)') && detailPairingPanel.includes('<FinishedPairRow') && detailPairingPanel.includes('className="space-y-2.5"'), "El detalle debe cambiar a un marcador vertical protagonista cuando ya hay resultado")
assert(detailPairingPanel.includes('function FinishedPlayerName({') && detailPairingPanel.includes('positionPlacement: "above" | "below"') && detailPairingPanel.includes('positionPlacement={index === 0 ? "above" : "below"}'), "En resultado, J1 debe mostrar posicion arriba y J2 posicion abajo")
assert(detailPairingPanel.includes('side: "a" | "b"') && detailPairingPanel.includes('side="a"') && detailPairingPanel.includes('side="b"') && !detailPairingPanel.includes('mb-1.5 text-left type-caption font-bold uppercase leading-none tracking-wide text-neutral-500') && !detailPairingPanel.includes('mt-1.5 text-left type-caption font-bold uppercase leading-none tracking-wide text-neutral-500'), "El resultado debe omitir los textos Pareja A/Pareja B y distinguir los lados solo de forma interna")
assert(!detailPairingPanel.includes('type-caption font-bold uppercase tracking-wide text-neutral-400'), "El resultado no debe mostrar numeracion 1/2/3 sobre los juegos")
assert(!detailPairingPanel.includes('showAvatars={showAvatars}') && !detailPairingPanel.includes('alignment: "left" | "right"\n  showAvatars: boolean'), "El resultado vertical no debe mostrar avatares; las imagenes quedan solo para el modo pendiente")
assert(detailPairingPanel.includes('relative mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4') && detailPairingPanel.includes('pointer-events-none absolute left-1/2 top-1/2 z-20') && detailPairingPanel.includes('>\n                  VS\n                </span>') && detailPairingPanel.includes('flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 type-caption font-black uppercase tracking-wide text-white shadow-sm'), "Sin resultado, el panel de detalle debe mantener el VS pequeño y flotante")
assert(detailPairingPanel.includes('rounded-2xl bg-neutral-50 px-3 py-3 sm:px-4 sm:py-3.5') && detailPairingPanel.includes('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3') && detailPairingPanel.includes('h-7 min-w-7 items-center justify-center rounded-lg px-1.5 type-small') && detailPairingPanel.includes('bg-neutral-100 font-black text-neutral-800 ring-neutral-200') && detailPairingPanel.includes('bg-neutral-50 font-bold text-neutral-500 ring-neutral-200') && detailPairingPanel.includes('h-11 min-w-11 items-center justify-center self-center rounded-lg') && detailPairingPanel.includes('relative -translate-y-0.5 ml-1 flex h-11 min-w-11 items-center justify-center self-center rounded-lg bg-white px-3 text-lg font-black leading-none text-neutral-950 ring-1 ring-inset ring-neutral-200 shadow-sm') && detailPairingPanel.includes('mb-1.5 mr-1 border-t border-neutral-300') && detailPairingPanel.includes('className={index === 0 ? "pb-2" : "pt-0"}'), "El resultado debe usar chips suaves como calendario, total de sets mayor y separador extendido a la derecha con mr-1, pb-2 bajo J1 y pt-0 en J2")
assert(detailPairingPanel.includes('className="grid grid-cols-2 items-start gap-2 sm:gap-4"') && detailPairingPanel.includes('{showAvatars ? (') && detailPairingPanel.includes('<PairAvatars playerIds={teamA} players={players} alignment="left" />') && detailPairingPanel.includes('<PairAvatars playerIds={teamB} players={players} alignment="right" />') && detailPairingPanel.includes('className="relative mt-1.5 grid grid-cols-2 items-start gap-2 sm:gap-4"') && detailPairingPanel.includes('pointer-events-none absolute left-1/2 top-1/2 z-20'), "La vista sin resultado debe conservar exactamente su estructura de dos parejas, avatares y VS flotante")
assert(serverHelper.includes('.select("id,avatar_url")') && serverHelper.includes("avatarUrlByUserId"), "El servidor debe recuperar avatares de participantes vinculados")
assert(detailPage.includes("<PersonalMatchSchedulePanel"), "El detalle debe incluir fecha, ubicación y acciones")
assert(detailPage.includes("<PersonalMatchResultForm"), "El detalle debe permitir registrar/corregir resultado")
assert(schedulePanel.includes("Cómo llegar"), "El detalle debe permitir abrir la ubicación")
assert(schedulePanel.includes("PersonalAddToCalendarButton"), "El detalle debe permitir añadir al calendario")

assert(appShell.includes("isPersonalMatchesRoute"), "El shell debe detectar el modo personal")
assert(appShell.includes("const shouldShowSettingsButton"), "El modo personal debe conservar Ajustes")
assert(appShell.includes("!isPersonalMatchesRoute"), "El modo personal debe ocultar la navegación completa y los controles de liga")
assert(appShell.includes("shouldShowPersonalMatchesNav"), "El shell debe activar la navegación compacta del modo personal")
assert(appShell.includes("<PersonalMatchesNav"), "El shell debe renderizar la navegación compacta de Mis partidos")
assert(personalNav.includes('aria-label="Navegación de Mis partidos"'), "La navegación personal debe ser accesible")
for (const label of ["Mis ligas", "Mis partidos", "Mi perfil"]) {
  assert(personalNav.includes(label), `Falta el destino ${label} en la navegación personal`)
}
assert(!personalNav.includes('label: "+ Partido"'), "La navegación personal no debe incluir + Partido")
assert(personalNav.includes('href: "/leagues"'), "La navegación personal debe enlazar a Mis ligas")
assert(personalNav.includes('href: "/personal-matches/profile"'), "La navegación personal debe enlazar al perfil global")
assert(personalNav.includes("grid-cols-3"), "La navegación personal debe repartir tres destinos")
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
assert(!personalPage.includes("<BackButton"), "La raíz de Mis partidos no debe duplicar Volver/Ligas")
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

console.log("Mis partidos v1.5.4 correcto:")
console.log("- historial agregado de liga + amistosos sin duplicar datos competitivos")
console.log("- historial paginado de 10 en 10 y Próximo partido oculto cuando no existe")
console.log("- liga y amistoso comparten una única MatchDetailView")
console.log("- amistosos programados permiten editar pareja y contrincantes")
console.log("- origen por liga con color estable y metadatos ausentes ocultos de forma independiente")
console.log("- un único amistoso compartido por cuentas vinculadas y externos permitidos")
console.log("- perfil global con rendimiento, parejas, rivales, rankings y cara a cara filtrable")
console.log("- API autenticada, rate limit y persistencia service-role only")
