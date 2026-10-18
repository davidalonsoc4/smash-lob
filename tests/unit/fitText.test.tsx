// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { FitText } from "@/components/ui/FitText"

afterEach(() => { cleanup(); vi.restoreAllMocks(); document.head.innerHTML = ""; document.documentElement.removeAttribute("style") })
it("keeps a readable minimum, wraps extreme names and fits shorter labels on one line", () => {
  document.documentElement.style.fontSize = "16px"
  document.head.innerHTML = "<style>span { font-size: 12px; }</style>"
  let available = 110
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
    const width = this.parentElement?.tagName === "SPAN" ? 120 * parseFloat(this.style.fontSize || "12") / 12 : available
    return { width, height: 20, x: 0, y: 0, top: 0, right: width, bottom: 20, left: 0, toJSON() {} }
  })
  const { rerender } = render(<FitText>Competiciones</FitText>)
  const text = screen.getByText("Competiciones")
  expect(parseFloat(text.style.fontSize)).toBeGreaterThanOrEqual(10)
  expect(parseFloat(text.style.fontSize)).toBeLessThan(12)
  expect(text.style.whiteSpace).toBe("nowrap")
  available = 60
  rerender(<FitText>Nombre de competición muy largo</FitText>)
  expect(text.style.fontSize).toBe("10px")
  expect(text.style.whiteSpace).toBe("normal")
  expect(text).toHaveTextContent("Nombre de competición muy largo")
})
