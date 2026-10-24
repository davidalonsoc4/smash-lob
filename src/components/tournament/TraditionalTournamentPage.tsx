import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { resolveTraditionalTournament,type TraditionalResolvedMatch } from "@/lib/traditionalTournament"
import { traditionalMatchLabel,traditionalSourceLabel } from "@/lib/traditionalTournamentLabels"
import { defaultTraditionalSetup,traditionalDrawOptions,previewTraditionalSetup,type TraditionalSetup } from "@/lib/traditionalTournamentSetup"
import type { TraditionalStoredState } from "@/lib/traditionalTournamentState"
import { tournamentAccentStyle } from "@/lib/tournamentStyles"
import { TournamentMatchResult } from "./TournamentMatchResult"
import { TraditionalTournamentDrawFields } from "./TraditionalTournamentDrawFields"
import { TraditionalCalendarEditor } from "./TraditionalCalendarEditor"
import { TournamentTeamOrder } from "./TournamentTeamOrder"
import { SelectChevron } from "./TournamentFormControls"
import type { TournamentData,View } from "./RapidTournamentPage"
import styles from "./Tournament.module.css"

function TieOrder({groupId,initial,names,busy,onSave}:{groupId:string;initial:string[];names:ReadonlyMap<string,string>;busy:boolean;onSave:(order:string[])=>void}){
  const {tx}=useI18n(),[order,setOrder]=useState(initial)
  return <details className={`${styles.help} mt-3`}><summary>{tx("Resolver empate para los cruces")}</summary><p>{tx("Ordena las parejas empatadas y confirma. Solo decide los cruces; sus estadísticas no cambian.")}</p><TournamentTeamOrder order={order} names={names} onChange={setOrder}/><button type="button" disabled={busy} className={`${styles.secondary} mt-2`} aria-label={`${tx("Confirmar orden")}: ${groupId}`} onClick={()=>onSave(order)}>{tx("Confirmar orden")}</button></details>
}
export function TraditionalTournamentPage({data,state,view,onRefresh}:{data:TournamentData;state:TraditionalStoredState;view:View;onRefresh:()=>void}){
  const {tx,locale}=useI18n(),router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(""),[selected,setSelected]=useState(data.players[0]?.id??"")
  const [setup,setSetup]=useState<TraditionalSetup>(()=>({...defaultTraditionalSetup,...state.draw.configuration,order:state.draw.seedOrder}))
  const [drawEdited,setDrawEdited]=useState(false)
  const result=useMemo(()=>resolveTraditionalTournament(state.draw,state.results,state.tieOrders),[state])
  const tournament=data.tournament,canManage=data.access.role==="creator",draw=state.draw
  const names=new Map(draw.teams.map(team=>[team.id,team.playerIds.map(id=>data.players.find(player=>player.id===id)?.name??"").join(" / ")]))
  const format=new Intl.DateTimeFormat(locale==="eu"?"eu-ES":locale==="en"?"en-GB":"es-ES",{dateStyle:"medium",timeStyle:"short"})
  const ready=result.matches.filter(match=>match.state==="ready"),playedIds=new Set(state.results.map(result=>result.matchId))
  const options={startsAt:tournament.startsAt,courts:tournament.courtNames.length,matchMinutes:Number(tournament.configuration.roundMinutes),transitionMinutes:Number(tournament.configuration.transitionMinutes)}
  const status=tx(tournament.status==="draft"?"Borrador":tournament.status==="in_progress"?"En curso":"Finalizado")
  async function requestAction(action:string,payload:Record<string,unknown>={}){
    if(busy)return tx("Espera a que termine la acción actual.")
    setBusy(true)
    try{
      const response=await fetch(`/api/tournaments/${encodeURIComponent(tournament.id)}/traditional`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,revision:state.revision,...payload})})
      if(response.ok)return null
      const body=await response.json().catch(()=>({}))
      return tx(body.error==="played_traditional_match_changed"?"Este cambio alteraría los rivales de un partido ya disputado. Conserva el resultado o revisa la incidencia con el organizador.":body.error==="traditional_knockout_requires_winner"?"Una eliminatoria necesita un ganador. No se puede guardar un empate.":response.status===409?"El torneo ha cambiado o la acción está bloqueada. Actualiza antes de continuar.":"No se ha podido guardar. Revisa los datos y tu conexión.")
    }catch{return tx("No se ha podido guardar. Revisa los datos y tu conexión.")}
    finally{setBusy(false)}
  }
  async function perform(action:string,payload:Record<string,unknown>={}){const message=await requestAction(action,payload);setError(message??"");if(!message){if(action==="draw")setDrawEdited(false);onRefresh();if(action==="start")router.push(`/tournaments/${tournament.id}/live`)}}
  function matchCard(match:TraditionalResolvedMatch){
    const slot=state.schedule.find(slot=>slot.matchId===match.id),label=traditionalMatchLabel(draw,match,tx)
    if(match.state==="bye")return <div key={match.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3 text-xs"><span className="font-semibold">{names.get(match.winnerId??"")}</span><span className={styles.muted}>{tx("Pase automático")}</span></div>
    const teamNames=(id:string|null,side:"a"|"b")=>id?draw.teams.find(team=>team.id===id)!.playerIds.map(id=>data.players.find(player=>player.id===id)?.name??""):[traditionalSourceLabel(draw,match[side],names,tx)]
    return <div key={match.id} className="grid min-w-0 gap-1" data-traditional-match={match.id}>
      <div className={`flex flex-wrap items-center justify-between gap-1 text-xs ${styles.muted}`}><span>{label}</span><span>{slot?format.format(new Date(slot.startsAt)):tx("Pendiente de programar")}</span></div>
      <TournamentMatchResult tournamentId={tournament.id} match={{id:match.id,court:slot?.court??0,teamA:teamNames(match.teamAId,"a"),teamB:teamNames(match.teamBId,"b"),scoreA:match.scoreA,scoreB:match.scoreB}} status={tournament.status} title={slot?`${tx("Pista")} ${slot.court}`:tx("Sin pista asignada")} canManage={canManage&&match.state!=="pending"} onSaved={onRefresh} onSaveResult={(scoreA,scoreB)=>requestAction("result",{matchId:match.id,scoreA,scoreB})}/>
    </div>
  }
  const sections=[...new Set(result.matches.map(match=>match.stage==="group"?match.groupId!:match.stage))]
  const groupsTable=<>{result.groups.map((group,i)=><section key={group.id} className={`${styles.panel} p-3`}><h2 className="type-panel-title font-black">{tx("Grupo")} {i+1}</h2><p className={styles.help}>{tx(group.complete?"Resultados completos":"Clasificación provisional")}</p><div className="mt-2 overflow-x-auto" role="region" tabIndex={0} aria-label={`${tx("Clasificación")}: ${tx("Grupo")} ${i+1}`}><table className="w-full text-left text-xs"><thead><tr>{["#",tx("Pareja"),tx("PJ"),tx("V"),tx("PF"),tx("PC"),tx("Dif.")].map(label=><th key={label} className="px-1 py-2">{label}</th>)}</tr></thead><tbody>{group.table.map(row=><tr key={row.teamId} className="border-t border-neutral-200"><td className="px-1 py-2 font-black">{row.position}</td><td className="min-w-28 max-w-44 break-words px-1 py-2 font-semibold">{names.get(row.teamId)}</td><td className="px-1 py-2">{row.played}</td><td className="px-1 py-2">{row.wins}</td><td className="px-1 py-2">{row.pointsFor}</td><td className="px-1 py-2">{row.pointsAgainst}</td><td className="px-1 py-2">{row.difference}</td></tr>)}</tbody></table></div>
      {canManage&&tournament.status==="in_progress"&&group.complete&&draw.configuration.format==="groups_knockout"&&new Set(group.table.map(row=>row.position)).size<group.table.length?<TieOrder groupId={group.id} initial={state.tieOrders[group.id]??group.table.map(row=>row.teamId)} names={names} busy={busy} onSave={order=>void perform("ties",{tieOrders:{...state.tieOrders,[group.id]:order}})}/>:null}
    </section>)}</>
  const selectedTeam=draw.teams.find(team=>team.playerIds.includes(selected))
  return <div className={`${styles.theme} ${styles.page}`} style={tournamentAccentStyle(tournament.accentColor)}>
    <header className={`app-page-header ${styles.header}`}><Link href="/leagues" className="app-top-back-control"><span aria-hidden="true">← </span>{tx("Competiciones")}</Link><div className="flex min-w-0 items-center gap-2">{tournament.logoUrl?<LeagueLogo league={tournament} size="sm" label={tx("Logo del torneo")}/>:null}<h1 className={`type-page-title font-black ${styles.headerTitle}`}>{tournament.name}</h1></div><p className={styles.headerContext}>{format.format(new Date(tournament.startsAt))} · {status}</p><p className={styles.headerLocation}>{[...new Set(tournament.courtNames.map(name=>name.replace(/ · Pista [1-4]$/,"")))].join(" · ")}</p></header>
    {error?<p role="alert" className="text-sm font-semibold text-red-700">{error}</p>:null}
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="type-panel-title font-black">{tx(view==="summary"?"Inicio":view==="calendar"?"Calendario completo":view==="standings"?"Clasificación":view==="players"?"Mis partidos":"Seguimiento")}</h2><button type="button" className={styles.secondary} disabled={busy} onClick={onRefresh}>{tx("Actualizar")}</button></div>
    {canManage&&tournament.status==="draft"&&(view==="summary"||view==="calendar")?<section className={`${styles.panel} p-3`}><p className="text-sm font-black">{tx("Sorteo provisional")}</p><p className={`${styles.help} mt-1`}>{tx("Revisa las parejas, el cuadro y los horarios antes de iniciar. Después no se podrá volver a sortear.")}</p><TraditionalTournamentDrawFields setup={setup} onChange={value=>{setSetup(value);setDrawEdited(true)}} teams={draw.teams} names={names} plan={draw}/>{drawEdited?<p className={styles.help}>{tx("Aplica el sorteo antes de iniciar.")}</p>:null}<div className="mt-3 grid grid-cols-2 gap-2"><button className={styles.secondary} disabled={busy||Boolean(previewTraditionalSetup(draw.teams,setup).error)} onClick={()=>void perform("draw",traditionalDrawOptions(draw.teams,setup))}>{tx("Volver a sortear")}</button><button className={styles.primary} disabled={busy||drawEdited} onClick={()=>void perform("start")}>{tx("Iniciar torneo")}</button></div></section>:null}
    {tournament.status==="finished"&&result.complete?<section className={`${styles.panel} p-3`}><p className={styles.eyebrow}>{tx(draw.configuration.format==="groups"?"Ganadores de grupo":"Campeones")}</p>{result.championIds.map(id=><p key={id} className="mt-1 text-lg font-black">{names.get(id)}</p>)}{result.thirdPlaceId?<p className="mt-2 text-sm">{tx("Tercer puesto")}: {names.get(result.thirdPlaceId)}</p>:null}{result.consolationWinnerId?<p className="mt-1 text-sm">{tx("Consolación")}: {names.get(result.consolationWinnerId)}</p>:null}</section>:null}
    {view==="summary"?<><section className={`${styles.panel} p-3`}><p className="text-sm font-bold">{tx(draw.configuration.format==="knockout"?"Eliminación directa":draw.configuration.format==="groups"?"Fase de grupos":"Grupos y eliminatorias")}</p>{tournament.description?<p className={`${styles.help} mt-1`}>{tournament.description}</p>:null}<div className={styles.summaryGrid}>{[[tx("Parejas"),draw.teams.length],[tx("Resultados"),`${state.results.length}/${draw.matches.filter(match=>match.a&&match.b).length}`],[tx("Partidos programados"),state.schedule.length],[tx("Cruces disponibles"),ready.length]].map(([label,value])=><div className={styles.metric} key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section><div className="grid grid-cols-2 gap-2"><Link className={styles.secondary} href={`/tournaments/${tournament.id}/calendar`}>{tx("Ver calendario")}</Link><Link className={styles.secondary} href={`/tournaments/${tournament.id}/standings`}>{tx("Ver clasificación")}</Link></div>{ready.slice(0,2).map(matchCard)}</>:null}
    {view==="calendar"?<>{canManage&&tournament.status!=="finished"?<TraditionalCalendarEditor key={state.revision} plan={draw} initial={state.schedule} options={options} playedIds={playedIds} busy={busy} onSave={schedule=>perform("schedule",{schedule})}/>:null}{sections.map(section=>{const matches=result.matches.filter(match=>(match.stage==="group"?match.groupId:match.stage)===section);return <section key={section} className={`${styles.panel} p-3`}><h3 className="mb-3 text-sm font-black">{tx(section.startsWith("group-")?"Grupo":section==="main"?"Cuadro principal":section==="third_place"?"Tercer puesto":"Consolación")} {section.startsWith("group-")?section.split("-").at(-1):""}</h3><div className="grid gap-3">{matches.map(matchCard)}</div></section>})}</>:null}
    {view==="standings"?<>{groupsTable}{draw.configuration.format!=="groups"?<section className={`${styles.panel} p-3`}><p className="text-sm font-bold">{tx("Avance de las eliminatorias")}</p><p className={styles.help}>{tx("El campeón se decide en la final; no se mezclan los puntos de partidos distintos.")}</p><div className="mt-3 grid gap-3">{result.matches.filter(match=>match.stage!=="group").map(matchCard)}</div></section>:null}</>:null}
    {view==="players"?<><label className="grid gap-1 text-sm font-bold">{tx("Jugador")}<SelectChevron><select className={`${styles.field} ${styles.selectField}`} value={selected} onChange={event=>setSelected(event.target.value)}>{data.players.map(player=><option key={player.id} value={player.id}>{player.name}</option>)}</select></SelectChevron></label><p className={styles.help}>{tx("Los siguientes cruces aparecerán cuando se conozcan los rivales. Los pases automáticos no cuentan como partidos jugados.")}</p>{result.matches.filter(match=>selectedTeam&&[match.teamAId,match.teamBId].includes(selectedTeam.id)).map(matchCard)}</>:null}
    {view==="live"?<><p className={styles.help}>{tx("Registra los resultados para habilitar los siguientes cruces. Los horarios son orientativos, sin temporizador automático.")}</p>{ready.map(matchCard)}{!ready.length&&!result.complete?<p className={styles.help}>{tx("Revisa la clasificación de grupos y resuelve los empates pendientes para continuar.")}</p>:null}</>:null}
    {canManage&&tournament.status==="in_progress"&&result.complete?<button className={`${styles.primary} w-full`} disabled={busy} onClick={()=>void perform("finish")}>{tx("Finalizar torneo")}</button>:null}
  </div>
}
