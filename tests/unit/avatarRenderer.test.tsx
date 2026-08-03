import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DEFAULT_AVATAR_RECIPE, cloneAvatarRecipe } from "@/features/avatar-lab/recipe"
import { PixelChibiAvatarRenderer } from "@/features/avatar-lab/renderers/PixelChibiAvatarRenderer"

describe("Pixel Chibi renderer", () => {
  it("renders modular crisp SVG instead of a flat image", () => {
    const markup = renderToStaticMarkup(<PixelChibiAvatarRenderer recipe={DEFAULT_AVATAR_RECIPE} showReferenceGrid />)
    expect(markup).toContain('viewBox="0 0 192 240"')
    expect(markup).toContain('shape-rendering="crispEdges"')
    expect(markup).toContain('image-rendering:pixelated')
    expect(markup).toContain('data-avatar-layer="hair"')
    expect(markup).toContain('data-avatar-layer="beard"')
    expect(markup).toContain('data-avatar-layer="shirt"')
    expect(markup).toContain('data-avatar-layer="racket"')
    expect(markup).not.toContain("pixel-chibi-canonical.png")
    expect(markup).not.toContain("<image")
  })

  it("mirrors left-handed geometry but redraws the B unmirrored", () => {
    const recipe = cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    recipe.handedness = "left"
    const markup = renderToStaticMarkup(<PixelChibiAvatarRenderer recipe={recipe} />)
    expect(markup).toContain('data-avatar-handedness="left"')
    expect(markup).toContain('transform="translate(192 0) scale(-1 1)"')
    expect(markup).toContain('data-logo-orientation="unmirrored"')
    expect(markup).toContain('transform="translate(116 0)"')
  })
})
