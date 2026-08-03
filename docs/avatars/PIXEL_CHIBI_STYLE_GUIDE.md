# Pixel Chibi Style Guide

The canonical reference is `reference/pixel-chibi-canonical.png`.

## Required appearance

- Full-body adult sports character with a large rounded head.
- Head occupies roughly 40–50% of visible character height.
- Compact torso, short legs, simplified hands and oversized court shoes.
- Near-front pose with a slight three-quarter bias.
- Warm near-black stepped exterior outline.
- Medium, uniform pixel blocks; no antialiasing or blur.
- Limited surface palette: main, shadow and at most one highlight.
- Shared top-left lighting direction.
- Large vertical geometric eyes, thick eyebrows and a tiny neutral mouth.
- Hair and beard are compact masses, not individual strands.
- Sports equipment is deliberately oversized for mobile legibility.

## Pixel rules

- Native viewBox: `192 × 240`.
- Base coordinate unit: 2 logical units.
- Preferred visible step: 4 logical units.
- Coordinates are integers and primarily multiples of 2 or 4.
- SVG root uses `shape-rendering="crispEdges"`.
- CSS uses `image-rendering: pixelated` as a rasterization hint.
- Curved Bézier geometry is not used in DEMO primitives.

## Prohibited

No 3D, Pixar-like rendering, smooth vector cartoon, anime detail, semirealism, gradients, antialiasing, blur, cinematic lighting, realistic textures, thin outlines, mismatched independent pieces, fake brands or a flat filtered copy of the reference.
