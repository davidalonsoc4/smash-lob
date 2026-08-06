-- Auditoría de solo lectura. Ejecutar primero en PRE y después en PROD antes
-- de promover v1.2.11. No modifica datos.

WITH linked_players AS (
  SELECT
    membership.league_id,
    league.name AS league_name,
    membership.player_id,
    player.display_name AS visible_player_name,
    player.avatar_initials AS visible_player_initials,
    player.link_identity_snapshot,
    app_user.id AS user_id,
    app_user.email,
    app_user.display_name AS account_display_name,
    app_user.avatar_url IS NOT NULL AS account_has_image
  FROM public.league_memberships AS membership
  JOIN public.leagues AS league ON league.id = membership.league_id
  JOIN public.players AS player
    ON player.id = membership.player_id
   AND player.league_id = membership.league_id
  JOIN public.app_users AS app_user ON app_user.id = membership.user_id
  WHERE membership.player_id IS NOT NULL
)
SELECT *
FROM linked_players
ORDER BY league_name, visible_player_name;

WITH linked_players AS (
  SELECT
    membership.league_id,
    membership.player_id,
    player.display_name,
    player.link_identity_snapshot,
    app_user.display_name AS account_display_name
  FROM public.league_memberships AS membership
  JOIN public.players AS player
    ON player.id = membership.player_id
   AND player.league_id = membership.league_id
  JOIN public.app_users AS app_user ON app_user.id = membership.user_id
  WHERE membership.player_id IS NOT NULL
)
SELECT
  league_id,
  player_id,
  display_name,
  account_display_name,
  link_identity_snapshot,
  (
    lower(trim(COALESCE(link_identity_snapshot->>'displayName', ''))) =
    lower(trim(COALESCE(account_display_name, '')))
  ) AS snapshot_matches_account_name,
  link_identity_snapshot IS NULL AS missing_snapshot
FROM linked_players
WHERE
  link_identity_snapshot IS NULL
  OR lower(trim(COALESCE(link_identity_snapshot->>'displayName', ''))) =
     lower(trim(COALESCE(account_display_name, '')))
ORDER BY league_id, display_name;

SELECT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'league_memberships'
    AND column_name = 'league_avatar_url'
) AS league_avatar_column_still_present;

SELECT count(*) AS player_rows_with_stored_image
FROM public.players
WHERE avatar_url IS NOT NULL;
