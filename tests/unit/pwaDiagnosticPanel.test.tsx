// @vitest-environment jsdom
import React from "react"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PwaDiagnosticPanel } from "@/components/settings/PwaDiagnosticPanel"
const { collect } = vi.hoisted(() => ({ collect: vi.fn() }))
vi.mock("@/lib/pwaDiagnostic", () => ({ collectPwaDiagnostic: collect }))
vi.mock("@/i18n/I18nProvider", () => ({ useI18n: () => ({ tx: (value: string) => value }) }))
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
describe("diagnostic panel", () => {
  it("shows the returned code only after the server accepts the report", async () => {
    collect.mockResolvedValue({ schema: 1, values: {} })
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accepted: true, incidenceCode: "SL-12345678" }) })
    vi.stubGlobal("fetch", fetch)
    render(<PwaDiagnosticPanel />)
    fireEvent.click(screen.getByRole("button", { name: "Enviar diagnóstico" }))
    expect(await screen.findByRole("status")).toHaveTextContent("SL-12345678")
    expect(fetch).toHaveBeenCalledOnce()
    expect(screen.getByRole("button", { name: "Descargar diagnóstico JSON" })).toBeEnabled()
  })
  it("keeps the captured JSON available when sending fails", async () => {
    collect.mockResolvedValue({ schema: 1, values: {} })
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    render(<PwaDiagnosticPanel />)
    fireEvent.click(screen.getByRole("button", { name: "Enviar diagnóstico" }))
    expect(await screen.findByRole("alert")).toBeVisible()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar diagnóstico" })).toBeEnabled())
    expect(screen.getByRole("button", { name: "Descargar diagnóstico JSON" })).toBeEnabled()
  })
})
