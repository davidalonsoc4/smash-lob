import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { DEFAULT_AVATAR_RECIPE, cloneAvatarRecipe } from "@/features/avatar-lab/recipe"
import { PixelChibiAvatarRenderer } from "@/features/avatar-lab/renderers/PixelChibiAvatarRenderer"

describe("Pixel Chibi renderer", () => {
  it("renders the canonical raster and modular variant overlays with pixel-safe SVG", () => {
    const recipe = cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    recipe.hair.color = "black"
    recipe.beard.color = "black"
    recipe.shirt.primaryColor = "green"

    const markup = renderToStaticMarkup(
      <PixelChibiAvatarRenderer recipe={recipe} showReferenceGrid />,
    )

    expect(markup).toContain('viewBox="0 0 192 240"')
    expect(markup).toContain('shape-rendering="crispEdges"')
    expect(markup).toContain('image-rendering:pixelated')
    expect(markup).toContain('data-avatar-layer="canonical-base"')
    expect(markup).toContain('/avatars/pixel-chibi/rendered/canonical-base.png')
    expect(markup).toContain('data-avatar-layer="hair"')
    expect(markup).toContain('overlay-hair-black.png')
    expect(markup).toContain('data-avatar-layer="beard"')
    expect(markup).toContain('overlay-beard-black.png')
    expect(markup).toContain('data-avatar-layer="shirt"')
    expect(markup).toContain('overlay-shirt-green.png')
  })

  it("uses the dedicated left-handed base so letters are not mirrored", () => {
    const recipe = cloneAvatarRecipe(DEFAULT_AVATAR_RECIPE)
    recipe.handedness = "left"
    const markup = renderToStaticMarkup(<PixelChibiAvatarRenderer recipe={recipe} />)

    expect(markup).toContain('data-avatar-handedness="left"')
    expect(markup).toContain('/avatars/pixel-chibi/rendered/canonical-base-left.png')
    expect(markup).toContain('data-logo-orientation="unmirrored"')
    expect(markup).toContain('data-avatar-overlays-mirrored="true"')
  })
})
