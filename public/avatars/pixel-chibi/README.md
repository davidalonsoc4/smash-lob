# Pixel Chibi runtime assets

Avatar Lab DEMO 0.1 renders typed modular SVG primitives on the shared 192 × 240 master grid. Category `index.json` files expose stable renderer tokens used by the shared manifest. The recipe never stores file paths or renderer-specific coordinates.

Inline SVG avoids an asset waterfall, keeps colour changes immediate and preserves integer geometry with `crispEdges`. Future production assets may be generated into external SVG modules without changing recipe IDs.
