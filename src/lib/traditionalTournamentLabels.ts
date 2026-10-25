import type { TraditionalMatch, TraditionalPlan, TraditionalSource } from "./traditionalTournament"
type Translate=(text:string)=>string
export function traditionalMatchLabel(plan:TraditionalPlan,match:TraditionalMatch,tx:Translate):string{
  if(match.stage==="group")return `${tx("Grupo")} ${match.groupId?.split("-").at(-1)} · ${tx("Ronda")} ${match.round}`
  if(match.stage==="third_place")return tx("Tercer puesto")
  const distance=Math.max(...plan.matches.filter(item=>item.stage===match.stage).map(item=>item.round))-match.round
  const title=tx(distance===0?"Final":distance===1?"Semifinal":distance===2?"Cuartos de final":"Octavos de final")
  return `${match.stage==="consolation"?`${tx("Consolación")} · `:""}${title}${distance?` ${match.id.split("-").at(-1)}`:""}`
}
export function traditionalSourceLabel(plan:TraditionalPlan,source:TraditionalSource,names:ReadonlyMap<string,string>,tx:Translate):string{
  if(!source)return tx("Pase automático")
  if(source.kind==="team")return names.get(source.teamId)??source.teamId
  if(source.kind==="group")return tx("Puesto {} del grupo {}").replace("{}",String(source.position)).replace("{}",source.groupId.split("-").at(-1)??"")
  const match=plan.matches.find(match=>match.id===source.matchId)
  return `${tx(source.kind==="winner"?"Ganador de":"Perdedor de")} ${match?traditionalMatchLabel(plan,match,tx):""}`
}
