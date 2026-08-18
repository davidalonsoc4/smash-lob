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
  personalSchedulePanel,
  sharedScheduleForm,
  personalBookingPanel,
  sharedBookingPanel,
  detailModel,
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
  read("src/components/personal/PersonalMatchSchedulePanel.tsx"),
  read("src/components/match/MatchScheduleForm.tsx"),
  read("src/components/personal/PersonalMatchCourtBookingPanel.tsx"),
  read("src/components/match/CourtBookingPanel.tsx"),
  read("src/lib/personalMatchDetailModel.ts"),
])

assert(leaguePage.includes("<MatchDetailView"), "La ruta de liga debe usar MatchDetailView")
assert(
  leaguePage.includes('href={`/round/${match.round}`}') &&
    leaguePage.includes("{t.matches.round} {match.round}"),
  "El partido de liga debe usar Jornada X como título principal enlazado al resumen",
)
assert(
  personalPage.includes('title="Partido"'),
  "El amistoso debe mantener Partido como título principal",
)
assert(personalPage.includes("<MatchDetailView"), "La ruta de amistoso debe usar MatchDetailView")
assert(!leaguePage.includes("<MatchDetailPairingPanel"), "Liga no debe duplicar el emparejamiento")
assert(!personalPage.includes("<MatchDetailPairingPanel"), "Amistoso no debe duplicar el emparejamiento")

for (const marker of ["<BackButton", "<MatchStatusBadge", "<MatchDetailPairingPanel"]) {
  assert(sharedView.includes(marker), `MatchDetailView debe ser dueño de ${marker}`)
}
assert(
  sharedView.includes("headerActions") && sharedView.includes("beforePairing"),
  "MatchDetailView debe admitir extensiones específicas sin duplicar la pantalla",
)

assert(
  pairingPanel.includes('metadataPlacement={index === 0 ? "before-name" : "after-name"}'),
  "El orden visual de metadatos/nombre debe ser compartido",
)
assert(
  pairingPanel.includes("showPendingPlayerMetadata?: boolean") &&
    pairingPanel.includes("showFinishedPlayerMetadata?: boolean"),
  "El componente compartido debe controlar la visibilidad de metadatos por estado",
)
assert(
  pairingPanel.includes("const showPendingMetadata = pendingPlayerMetadata || showRankingPosition"),
  "Los metadatos pendientes deben combinar perfil personal y posición competitiva",
)
assert(
  personalPage.includes("showPendingPlayerMetadata: true") &&
    personalPage.includes("showFinishedPlayerMetadata: false") &&
    !personalPage.includes("rankingPositions:"),
  "El amistoso debe mostrar REVÉS/DRIVE y DIESTRO/ZURDO en los mismos momentos que Liga sin inventar ranking",
)
assert(
  leaguePage.includes("getRankingDisplayPosition(rankingPlayers, playerId)"),
  "Liga debe seguir usando la posición visual exacta de Clasificación",
)

assert(
  personalPage.includes("buildPersonalMatchDetailModel") &&
    personalBookingPanel.includes("buildPersonalMatchDetailModel") &&
    detailModel.includes("preferredSide") &&
    detailModel.includes("dominantHand"),
  "La normalización del amistoso para la UI compartida debe estar centralizada",
)

assert(
  personalSchedulePanel.includes("<MatchScheduleForm") &&
    sharedScheduleForm.includes("actions?: MatchScheduleActions") &&
    sharedScheduleForm.includes("formatMatchScheduleLongLabel"),
  "Liga y amistoso deben reutilizar el mismo panel visual de programación",
)
assert(
  personalBookingPanel.includes("<CourtBookingPanel") &&
    sharedBookingPanel.includes("export function CourtBookingPanel"),
  "Liga y amistoso deben reutilizar Pagos y reservas",
)
assert(
  personalResultForm.includes("<MatchResultForm") && sharedResultForm.includes("persistResult?"),
  "Liga y amistoso deben reutilizar el formulario visual de resultado",
)

assert(personalPage.includes("<PersonalMatchParticipantsPanel"), "El amistoso debe conservar su editor específico de participantes")
assert(participantsPanel.includes('match.status !== "scheduled"'), "Los participantes solo deben editarse antes del resultado")
assert(participantsPanel.includes('action: "participants"'), "El editor debe persistir participantes por PATCH")
assert(participantsPanel.includes("<PersonalMatchParticipantSelector"), "El editor debe reutilizar el selector compartido")
assert(newPersonalPage.includes("<PersonalMatchParticipantSelector"), "Nuevo amistoso debe reutilizar el mismo selector")
assert(participantSelector.includes("Otro jugador..."), "El selector debe admitir jugadores externos")

assert(detailRoute.includes('action !== "participants"'), "PATCH debe aceptar participants")
assert(detailRoute.includes('match.status !== "scheduled"'), "La API debe bloquear participantes una vez jugado")
assert(detailRoute.includes("replacePersonalMatchParticipants"), "PATCH debe delegar el reemplazo al servidor")
assert(listRoute.includes("resolvePersonalMatchParticipantDrafts"), "Alta y edición deben compartir resolución de participantes")
assert(requestHelper.includes("normalizePersonalMatchParticipantDrafts"), "Alta y edición deben compartir validación")
assert(serverHelper.includes("replacePersonalMatchParticipants"), "Falta reemplazo service-role de participantes")

console.log("Detalle de partido unificado v1.10.10 correcto:")
console.log("- Liga y Amistoso comparten MatchDetailView y MatchDetailPairingPanel")
console.log("- REVÉS/DRIVE y DIESTRO/ZURDO usan la misma ubicación y ciclo visual")
console.log("- Amistoso omite únicamente la posición de clasificación que no existe")
console.log("- programación, Pagos y reservas y resultado reutilizan componentes de Liga")
console.log("- solo el editor de participantes permanece específico por diferencia de negocio")
