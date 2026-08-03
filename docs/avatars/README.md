# Smash & Lob Avatar Worlds

Avatar Lab is an isolated PRE-only experiment for validating a neutral avatar identity recipe and multiple spectator-selected visual worlds.

## Core model

- The represented player owns one neutral `AvatarRecipe`.
- The viewer owns an independent `AvatarWorldPreference`.
- A renderer interprets the same recipe for a world.
- Every avatar in a future composition must use the viewer's selected world.
- Avatar Lab DEMO 0.1 implements only `pixel_chibi`.
- `chibi_illustrated` is declared but intentionally has no renderer or assets.

## Isolation

Route: `/experimental/avatar-lab`

The route is available only when Smash & Lob resolves the application as PRE/staging. It is absent from normal navigation, bypasses league data providers, stores data only in versioned browser storage and never writes to Supabase.

The canonical visual reference is stored at `reference/pixel-chibi-canonical.png`. It is documentation only and is never rendered as the avatar.
