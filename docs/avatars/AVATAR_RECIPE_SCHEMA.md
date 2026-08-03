# Avatar Recipe Schema

`AvatarRecipe` is the single neutral source of represented identity and is versioned with `schemaVersion: 1`.

It groups handedness and skin tone; head, hair, beard, eyes and eyebrows; cap and headband; shirt and shorts; dominant-relative sleeve and wristband; socks, shoes and racket.

`dominant` and `non_dominant` are semantic. Renderers resolve them from handedness, so recipes never encode viewer-left or viewer-right positions.

The recipe must never store SVG paths, URLs, sprite coordinates, Pixel-only colour values, React components or separate per-world configurations.

Portable schema: `public/avatars/shared/schemas/avatar-recipe.schema.json`.
