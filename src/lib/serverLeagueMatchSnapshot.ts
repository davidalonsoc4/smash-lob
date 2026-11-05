import "server-only"
import type { AuthenticatedAppUser } from "./serverAuth"
import { matchSelect } from "./supabaseMatches"

// Extended 32-player seasons exceed PostgREST's default 1000-row page.
// Keep the caller's authorized league scope on every page and fail as a whole
// if a later page fails, rather than presenting a truncated calendar as valid.
export async function readLeagueMatchSnapshot(supabase:AuthenticatedAppUser["supabase"],leagueIds:string[], overview = false){
  const rows:Record<string,unknown>[]=[]
  for(let offset=0;;offset+=1000){
    const query = overview
      ? supabase.from("matches").select("id,league_id,season_id,round,status,team_a,team_b,sets,scheduled_at,location,result_recorded_at,ranking_counts,resolution_type")
      : supabase.from("matches").select(matchSelect)
    const result=await query.in("league_id",leagueIds).order("id").range(offset,offset+999)
    if(result.error)return {data:null,error:result.error}
    rows.push(...result.data??[])
    if((result.data?.length??0)<1000)return {data:rows,error:null}
  }
}
