# Asset Specification

Every option has a stable semantic ID, for example `hair.messy_short_01`, `cap.backwards_01` and `racket.round_b_01`.

The shared manifest maps IDs to world variants. `pixel_chibi` resolves to typed SVG renderer primitives. `chibi_illustrated` resolves to `null`.

All Pixel Chibi layers share the 192 × 240 viewBox, integer coordinates, the same outline and lighting tokens, transparent backgrounds and stable head/body/wrist/racket anchors.

Recipe colours are semantic tokens. The Pixel renderer resolves each token to a three-colour surface in `pixelPalette.ts` and `palettes.json`.

Future export should render at integer multiples of the native grid and rasterize with nearest-neighbour scaling.
