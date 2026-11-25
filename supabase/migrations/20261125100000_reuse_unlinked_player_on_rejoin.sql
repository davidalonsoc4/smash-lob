-- Al desvincular a alguien de una temporada con calendario ya generado, su jugador conserva los partidos.
-- Guardamos de qué cuenta venía para que, si vuelve a entrar, se reutilice ese jugador en vez de crear un duplicado.
alter table public.players add column if not exists unlinked_user_id uuid references public.app_users(id) on delete set null;

create or replace function public.server_unlink_league_player(p_actor_user_id uuid, p_actor_is_superuser boolean, p_league_id uuid, p_player_id uuid)
 returns table(season_id uuid, season_status text, removed_from_upcoming_roster boolean, registered_count integer, player_capacity integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_actor_membership public.league_memberships%ROWTYPE;
  v_target_membership public.league_memberships%ROWTYPE;
  v_active_season_id uuid;
  v_season_status text;
  v_settings public.season_settings%ROWTYPE;
  v_has_settings boolean := false;
  v_removed boolean := false;
  v_count integer := 0;
  v_capacity integer := NULL;
  v_registration_fee jsonb;
  v_payments jsonb;
BEGIN
  SELECT * INTO v_actor_membership FROM public.league_memberships AS membership
  WHERE membership.user_id = p_actor_user_id AND membership.league_id = p_league_id LIMIT 1;

  SELECT * INTO v_target_membership FROM public.league_memberships AS membership
  WHERE membership.player_id = p_player_id AND membership.league_id = p_league_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'membership_not_found'; END IF;

  IF NOT (
    COALESCE(p_actor_is_superuser, false)
    OR COALESCE(v_actor_membership.role IN ('creator', 'admin'), false)
    OR COALESCE(v_target_membership.user_id = p_actor_user_id, false)
  ) THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF v_target_membership.role = 'creator' THEN RAISE EXCEPTION 'protected_league_creator'; END IF;

  SELECT league.active_season_id INTO v_active_season_id FROM public.leagues AS league WHERE league.id = p_league_id;

  IF v_active_season_id IS NOT NULL THEN
    SELECT season.status::text INTO v_season_status FROM public.seasons AS season
    WHERE season.id = v_active_season_id AND season.league_id = p_league_id;

    SELECT * INTO v_settings FROM public.season_settings AS settings
    WHERE settings.season_id = v_active_season_id AND settings.league_id = p_league_id FOR UPDATE;

    v_has_settings := FOUND;
    IF v_has_settings THEN v_capacity := v_settings.player_capacity; END IF;

    IF v_season_status = 'upcoming' AND v_has_settings AND v_settings.roster_mode = 'self_registration' THEN
      DELETE FROM public.season_players AS season_player
      WHERE season_player.season_id = v_active_season_id AND season_player.player_id = p_player_id;

      v_removed := FOUND;

      IF v_removed THEN
        -- Si el calendario ya esta generado, el jugador sigue en esos partidos: recordamos su cuenta para reutilizarlo.
        IF v_target_membership.user_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.matches AS match_row
          WHERE match_row.season_id = v_active_season_id
            AND (p_player_id = ANY(match_row.team_a) OR p_player_id = ANY(match_row.team_b))
        ) THEN
          UPDATE public.players SET unlinked_user_id = v_target_membership.user_id WHERE id = p_player_id;
        END IF;

        SELECT count(*)::integer INTO v_count FROM public.season_players AS season_player
        WHERE season_player.season_id = v_active_season_id AND season_player.status = 'active';

        v_registration_fee := COALESCE(v_settings.registration_fee, '{}'::jsonb);
        SELECT COALESCE(jsonb_agg(payment), '[]'::jsonb) INTO v_payments
        FROM jsonb_array_elements(COALESCE(v_registration_fee->'payments', '[]'::jsonb)) AS payment
        WHERE payment->>'playerId' <> p_player_id::text;

        UPDATE public.season_settings AS settings
        SET registration_fee = jsonb_set(v_registration_fee, '{payments}', v_payments, true),
            registration_open = true,
            roster_completed_at = NULL
        WHERE settings.season_id = v_active_season_id AND settings.league_id = p_league_id;
      END IF;
    END IF;
  END IF;

  DELETE FROM public.league_memberships AS membership WHERE membership.id = v_target_membership.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'membership_delete_failed'; END IF;

  RETURN QUERY SELECT v_active_season_id, v_season_status, v_removed, v_count, v_capacity;
END;
$function$;
