import { readFile } from "node:fs/promises"

const read = (file) => readFile(file, "utf8")
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const [
  leaguePage,
  personalPage,
  sharedView,
  pairingPanel,
  participantsPanel,
  participantSelector,
  newPersonalPage,
  detailRoute,
  listRoute,
  serverHelper,
  requestHelper,
  personalResultForm,
  sharedResultForm,
] = await Promise.all([
  read("src/app/match/[id]/page.tsx"),
  read("src/app/personal-matches/[id]/page.tsx"),
  read("src/components/match/MatchDetailView.tsx"),
  read("src/components/match/MatchDetailPairingPanel.tsx"),
  read("src/components/personal/PersonalMatchParticipantsPanel.tsx"),
  read("src/components/personal/PersonalMatchParticipantSelector.tsx"),
  read("src/app/personal-matches/new/page.tsx"),
  read("src/app/api/personal-matches/[id]/route.ts"),
  read("src/app/api/personal-matches/route.ts"),
  read("src/lib/serverPersonalMatches.ts"),
  read("src/lib/serverPersonalMatchRequest.ts"),
  read("src/components/personal/PersonalMatchResultForm.tsx"),
  read("src/components/match/MatchResultForm.tsx"),
])

assert(leaguePage.includes("<MatchDetailView"), "La ruta de liga debe usar MatchDetailView")
assert(leaguePage.includes('title={`${t.matches.round} ${match.round}`}'), "El partido de liga debe usar Jornada X como título principal")
assert(!leaguePage.includes('subtitle={`${t.matches.round} ${match.round}`}'), "La jornada no debe repetirse como subtítulo")
assert(personalPage.includes('title="Partido"'), "El amistoso debe mantener Partido como título principal")
assert(personalPage.includes("<MatchDetailView"), "La ruta de amistoso debe usar MatchDetailView")
assert(!leaguePage.includes("<MatchDetailPairingPanel"), "La ruta de liga no debe montar el emparejamiento por separado")
assert(!personalPage.includes("<MatchDetailPairingPanel"), "La ruta personal no debe montar el emparejamiento por separado")
for (const marker of ["<BackButton", "<MatchStatusBadge", "<MatchDetailPairingPanel"]) {
  assert(sharedView.includes(marker), `MatchDetailView debe ser dueño de ${marker}`)
}
assert(sharedView.includes("headerActions") && sharedView.includes("beforePairing"), "MatchDetailView debe admitir extensiones específicas sin duplicar la pantalla")
assert(pairingPanel.includes('const hasResult = sets.length > 0'), "El emparejamiento compartido debe conservar la vista con/sin resultado")
assert(
  (pairingPanel.match(/positionPlacement=\{index === 0 \? "above" : "below"\}/g) ?? []).length === 2,
  "Sin resultado y con resultado deben colocar la posición del primer jugador encima y la del segundo debajo",
)
assert(
  pairingPanel.includes('positionLabel && positionPlacement === "above"') &&
    pairingPanel.includes('positionLabel && positionPlacement === "below"'),
  "El jugador pendiente debe renderizar la posición según su colocación",
)

assert(personalPage.includes("<PersonalMatchParticipantsPanel"), "El amistoso debe permitir editar participantes desde PARTIDO")
assert(participantsPanel.includes('match.status !== "scheduled"'), "Los participantes solo deben editarse antes de registrar el resultado")
assert(participantsPanel.includes('action: "participants"'), "El editor debe persistir la pareja y rivales por PATCH")
assert(participantsPanel.includes("<PersonalMatchParticipantSelector"), "El editor debe reutilizar el selector compartido")
assert(newPersonalPage.includes("<PersonalMatchParticipantSelector"), "Nuevo partido debe reutilizar el mismo selector")
assert(participantSelector.includes("Otro jugador..."), "El selector compartido debe admitir jugadores externos")

assert(detailRoute.includes('action !== "participants"'), "PATCH debe aceptar la acción participants")
assert(detailRoute.includes('match.status !== "scheduled"'), "La API debe bloquear cambios de participantes una vez jugado")
assert(detailRoute.includes("replacePersonalMatchParticipants"), "PATCH debe delegar el reemplazo al servidor")
assert(listRoute.includes("resolvePersonalMatchParticipantDrafts"), "Alta y edición deben compartir resolución de participantes")
assert(requestHelper.includes("normalizePersonalMatchParticipantDrafts"), "Alta y edición deben compartir validación de payload")
assert(serverHelper.includes("replacePersonalMatchParticipants"), "Falta el reemplazo service-role de participantes")
assert(serverHelper.includes("personal_match_requires_current_user"), "El usuario actual debe seguir formando parte del amistoso")
assert(serverHelper.includes("originalParticipants"), "El reemplazo debe conservar respaldo para restaurar ante fallo")
assert(personalResultForm.includes("<MatchResultForm"), "El amistoso debe reutilizar el editor visual de resultado de liga")
assert(sharedResultForm.includes("persistResult?"), "El editor compartido debe permitir adaptar la persistencia sin duplicar UI")

assert(
  leaguePage.includes("getRankingDisplayPosition(rankingPlayers, playerId)"),
  "El detalle de liga debe usar la posición visual exacta de Clasificación",
)
assert(
  !leaguePage.includes("getRankingPosition(rankingPlayers, playerId)"),
  "El detalle de liga no debe usar el puesto estadístico compartido por empates",
)

console.log("Detalle de partido v1.6.0 unificado:")
console.log("- liga y amistoso comparten MatchDetailView")
console.log("- liga usa Jornada X como título; amistosos mantienen Partido")
console.log("- la posición de cada jugador replica el orden visual 1, 2, 3… de Clasificación")
console.log("- sin resultado, jugador 1 de cada pareja muestra la posición encima; jugador 2 debajo")
console.log("- cada origen conserva su carga, permisos y persistencia")
console.log("- amistosos programados permiten editar pareja y contrincantes")
console.log("- el formulario de resultado también reutiliza la UI de liga")
