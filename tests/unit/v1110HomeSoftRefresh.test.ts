import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

describe("v1.11.0 HOME soft refresh", () => {
  it("keeps the current HOME mounted while refreshing its remote data", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain("const [isRefreshingHome, setIsRefreshingHome] = useState(false)")
    expect(home).toContain("await Promise.all([")
    expect(home).toContain("refreshLeagueAccess(),")
    expect(home).toContain("refreshMvpData(),")
    expect(home).toContain("checkForPwaUpdate(),")
    expect(home).toContain("await registration?.update()")
    expect(home).not.toContain("requestPwaUpdate(")
    expect(home).toContain("ANNOUNCEMENTS_REFRESH_EVENT")
    expect(home).toContain('data-refreshing={isRefreshingHome ? "true" : "false"}')
    expect(home).not.toContain("window.location.reload()")
  })

  it("refreshes MVP state on demand instead of only on provider mount", async () => {
    const provider = await readFile("src/context/MvpProvider.tsx", "utf8")

    expect(provider).toContain("refreshMvpData: () => Promise<boolean>")
    expect(provider).toContain("const refreshMvpData = useCallback(async () =>")
    expect(provider).toContain("fetchSupabaseMvpData(supabaseLeagueIds)")
  })

  it("keeps the existing HOME refresh control contract while updating in place", async () => {
    const home = await readFile("src/app/page.tsx", "utf8")

    expect(home).toContain('<BackButton fallbackHref="/" label={t.common.refreshApp} />')
    expect(home).toContain('onClickCapture={(event) => { event.preventDefault(); event.stopPropagation(); void refreshApp(); }}')
    expect(home).toContain('aria-busy={isRefreshingHome}')
  })
})
