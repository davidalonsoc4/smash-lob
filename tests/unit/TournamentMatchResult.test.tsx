// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TournamentMatchResult } from "@/components/tournament/TournamentMatchResult"
vi.mock("@/i18n/I18nProvider",()=>({useI18n:()=>({tx:(text:string)=>text})}))
const match={id:"match-1",court:2,teamA:["Ana","Bea"],teamB:["Carla","Diana"],scoreA:null,scoreB:null}
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
describe("shared tournament match result editor",()=>{
  it("retains the existing rapid endpoint and accessible pair labels",async()=>{
    const user=userEvent.setup(),fetch=vi.fn().mockResolvedValue({ok:true}),onSaved=vi.fn()
    vi.stubGlobal("fetch",fetch)
    render(<TournamentMatchResult tournamentId="tournament" match={match} status="in_progress" onSaved={onSaved} canManage />)
    await user.click(screen.getByRole("button",{name:"Registrar resultado"}))
    await user.type(screen.getByLabelText("Puntos de Ana / Bea"),"20")
    await user.type(screen.getByLabelText("Puntos de Carla / Diana"),"10")
    await user.click(screen.getByRole("button",{name:"Guardar resultado"}))
    expect(fetch).toHaveBeenCalledWith("/api/tournaments/tournament/matches/match-1/result",expect.objectContaining({method:"PUT",body:JSON.stringify({scoreA:20,scoreB:10})}))
    expect(onSaved).toHaveBeenCalledOnce()
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument()
  })
  it("uses a traditional callback with the same presentation and surfaces its conflict",async()=>{
    const user=userEvent.setup(),onSaveResult=vi.fn().mockResolvedValue("Este cambio afectaría a un partido ya disputado."),onSaved=vi.fn(),fetch=vi.fn()
    vi.stubGlobal("fetch",fetch)
    render(<TournamentMatchResult tournamentId="tournament" match={match} status="in_progress" onSaved={onSaved} onSaveResult={onSaveResult} title="Semifinal" canManage />)
    expect(screen.getByRole("article")).toHaveAccessibleName("Semifinal: Ana / Bea contra Carla / Diana")
    await user.click(screen.getByRole("button",{name:"Registrar resultado"}))
    await user.type(screen.getByLabelText("Puntos de Ana / Bea"),"10")
    await user.type(screen.getByLabelText("Puntos de Carla / Diana"),"20")
    await user.click(screen.getByRole("button",{name:"Guardar resultado"}))
    expect(onSaveResult).toHaveBeenCalledWith(10,20)
    expect(screen.getByRole("alert")).toHaveTextContent("Este cambio afectaría")
    expect(onSaved).not.toHaveBeenCalled();expect(fetch).not.toHaveBeenCalled()
  })
  it("never submits blank scores or a zero total",async()=>{
    const user=userEvent.setup(),onSaveResult=vi.fn()
    render(<TournamentMatchResult tournamentId="tournament" match={match} status="in_progress" onSaved={vi.fn()} onSaveResult={onSaveResult} canManage />)
    await user.click(screen.getByRole("button",{name:"Registrar resultado"}))
    await user.click(screen.getByRole("button",{name:"Guardar resultado"}))
    expect(screen.getByRole("alert")).toHaveTextContent("Introduce dos números")
    await user.type(screen.getByLabelText("Puntos de Ana / Bea"),"0")
    await user.type(screen.getByLabelText("Puntos de Carla / Diana"),"0")
    await user.click(screen.getByRole("button",{name:"Guardar resultado"}))
    expect(onSaveResult).not.toHaveBeenCalled()
  })
  it.each(["draft","finished"] as const)("keeps %s read-only",status=>{
    render(<TournamentMatchResult tournamentId="tournament" match={match} status={status} onSaved={vi.fn()} canManage />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
  it("keeps participants read-only even during play",()=>{
    render(<TournamentMatchResult tournamentId="tournament" match={{...match,scoreA:20,scoreB:10}} status="in_progress" onSaved={vi.fn()} canManage={false} />)
    expect(screen.getByText("20–10")).toBeVisible()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
