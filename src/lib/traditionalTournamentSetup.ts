import { buildTraditionalDraw, type TraditionalConfiguration, type TraditionalPlan } from "./traditionalTournament"
import type { FixedTournamentTeam } from "./fixedRapidTournament"

export type TraditionalSetup = TraditionalConfiguration & {
  drawMode: "automatic" | "manual"; order: string[]; seedCount: number
  manualGroups: boolean; assignments: Record<string, number>; scheduleMode: "automatic" | "manual"
}
export const defaultTraditionalSetup: TraditionalSetup = { format:"knockout",groupCount:0,qualifiersPerGroup:0,thirdPlace:false,consolation:false,drawMode:"automatic",order:[],seedCount:0,manualGroups:false,assignments:{},scheduleMode:"automatic" }
export function traditionalOrder(teams: readonly FixedTournamentTeam[], order: readonly string[]) {
  const ids=teams.map(team=>team.id)
  return [...order.filter(id=>ids.includes(id)),...ids.filter(id=>!order.includes(id))]
}
export function traditionalDrawOptions(teams: readonly FixedTournamentTeam[], setup: TraditionalSetup) {
  const order=traditionalOrder(teams,setup.order)
  return { ...(setup.drawMode==="manual"?{manualOrder:order}:{seededTeamIds:order.slice(0,Math.min(setup.seedCount,teams.length))}),
    ...(setup.manualGroups && setup.format!=="knockout" ? {manualGroups:Array.from({length:setup.groupCount},(_,i)=>order.filter(id=>setup.assignments[id]===i+1))}:{}), scheduleMode:setup.scheduleMode }
}
export function previewTraditionalSetup(teams: readonly FixedTournamentTeam[], setup: TraditionalSetup): {plan:TraditionalPlan|null;error:string|null} {
  try { return {plan:buildTraditionalDraw({teams,configuration:setup,seed:17,...traditionalDrawOptions(teams,setup)}),error:null} }
  catch(error) {return {plan:null,error:error instanceof Error?error.message:"invalid_traditional_configuration"}}
}
export const traditionalErrorText = (error: string) => ({
  invalid_fixed_teams:"Cada pareja debe tener dos jugadores. Revisa los equipos o restablece las parejas.",
  invalid_traditional_groups:"Cada grupo necesita al menos dos parejas y tamaños equilibrados.",
  invalid_manual_groups:"Reparte todas las parejas en grupos de tamaños equilibrados.",
  invalid_traditional_qualifiers:"El número de clasificados debe caber en todos los grupos.",
  third_place_requires_semifinals:"El tercer puesto necesita al menos cuatro parejas en las eliminatorias.",
  consolation_requires_two_teams:"La consolación necesita al menos dos parejas eliminadas, sin contar pases automáticos.",
  consolation_duplicates_third_place:"Con cuatro parejas, tercer puesto y consolación serían el mismo partido. Elige solo una opción.",
}[error] ?? "Revisa la configuración y completa parejas válidas antes de continuar.")
