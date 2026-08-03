# Avatar Worlds Architecture

```text
AvatarRecipe (neutral identity)
        |
        +--> AvatarRenderer registry
                  |
                  +--> PixelChibiAvatarRenderer (DEMO)
                  +--> ChibiIllustratedAvatarRenderer (future)

AvatarWorldPreference (viewer-local visual choice)
```

`AvatarRecipe` contains semantic choices such as `messy_short_01`, `dominant`, `light_blue` and `round_b_01`. It never contains SVG paths, file paths, coordinates, JSX or per-world configuration.

`AvatarRenderer` is the common public entry point. Consumers pass a recipe and world; they do not import Pixel Chibi geometry directly.

## Implementation

- Contracts: `src/features/avatar-lab/types.ts`.
- Defaults, normalization and validation: `recipe.ts`.
- Catalogue: `catalog.ts` and `public/avatars/shared/manifest.json`.
- Renderer registry: `renderers/AvatarRenderer.tsx`.
- Pixel renderer: `renderers/PixelChibiAvatarRenderer.tsx`.
- Persistence: `storage.ts`.
- Mobile editor: `components/AvatarLabClient.tsx`.

## Rendering decision

The Pixel Chibi DEMO uses typed inline SVG primitives aligned to a 192 × 240 logical grid. This avoids network waterfalls, permits instant palette substitution, preserves integer geometry, supports transparency and lets left-handed geometry be mirrored while letters are redrawn unmirrored.

Public category directories expose stable renderer tokens. The implementation can later move to generated SVG modules or sprites without changing the recipe.
