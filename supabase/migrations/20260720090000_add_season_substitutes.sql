BEGIN;

ALTER TABLE public.season_players
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_from_round integer,
  ADD COLUMN IF NOT EXISTS replaces_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replaced_from_round integer,
  ADD COLUMN IF NOT EXISTS replaced_by_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL;

ALTER TABLE public.season_players
  DROP CONSTRAINT IF EXISTS season_players_status_check;
ALTER TABLE public.season_players
  ADD CONSTRAINT season_players_status_check
  CHECK (status IN ('active', 'withdrawn'));

ALTER TABLE public.season_players
  DROP CONSTRAINT IF EXISTS season_players_joined_from_round_check;
ALTER TABLE public.season_players
  ADD CONSTRAINT season_players_joined_from_round_check
  CHECK (joined_from_round IS NULL OR joined_from_round > 0);

ALTER TABLE public.season_players
  DROP CONSTRAINT IF EXISTS season_players_replaced_from_round_check;
ALTER TABLE public.season_players
  ADD CONSTRAINT season_players_replaced_from_round_check
  CHECK (replaced_from_round IS NULL OR replaced_from_round > 0);

CREATE TABLE IF NOT EXISTS public.season_substitutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  inactive_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT season_substitutes_inactive_reason_check
    CHECK (inactive_reason IS NULL OR inactive_reason IN ('retired', 'promoted')),
  UNIQUE (season_id, player_id)
);

ALTER TABLE public.season_substitutes
  ADD COLUMN IF NOT EXISTS inactive_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.season_substitutes
  DROP CONSTRAINT IF EXISTS season_substitutes_inactive_reason_check;
ALTER TABLE public.season_substitutes
  ADD CONSTRAINT season_substitutes_inactive_reason_check
  CHECK (inactive_reason IS NULL OR inactive_reason IN ('retired', 'promoted'));

CREATE TABLE IF NOT EXISTS public.match_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  original_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  substitute_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  substitution_type text NOT NULL DEFAULT 'single',
  created_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_substitutions_type_check CHECK (substitution_type IN ('single', 'permanent')),
  CONSTRAINT match_substitutions_distinct_players_check CHECK (original_player_id <> substitute_player_id),
  UNIQUE (match_id, original_player_id)
);

ALTER TABLE public.match_substitutions
  DROP CONSTRAINT IF EXISTS match_substitutions_match_id_substitute_player_id_key;

CREATE TABLE IF NOT EXISTS public.season_replacements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  outgoing_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  incoming_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE RESTRICT,
  from_round integer NOT NULL CHECK (from_round > 0),
  created_by_user_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT season_replacements_distinct_players_check CHECK (outgoing_player_id <> incoming_player_id),
  UNIQUE (season_id, outgoing_player_id)
);

CREATE INDEX IF NOT EXISTS season_substitutes_season_idx ON public.season_substitutes(season_id);
CREATE INDEX IF NOT EXISTS match_substitutions_match_idx ON public.match_substitutions(match_id);
CREATE INDEX IF NOT EXISTS match_substitutions_season_idx ON public.match_substitutions(season_id);
CREATE INDEX IF NOT EXISTS match_substitutions_substitute_idx ON public.match_substitutions(season_id, substitute_player_id);
CREATE INDEX IF NOT EXISTS season_replacements_season_idx ON public.season_replacements(season_id);

ALTER TABLE public.season_substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_replacements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.season_substitutes FROM anon, authenticated;
REVOKE ALL ON TABLE public.match_substitutions FROM anon, authenticated;
REVOKE ALL ON TABLE public.season_replacements FROM anon, authenticated;
GRANT ALL ON TABLE public.season_substitutes TO service_role;
GRANT ALL ON TABLE public.match_substitutions TO service_role;
GRANT ALL ON TABLE public.season_replacements TO service_role;

CREATE OR REPLACE FUNCTION public.server_substitution_replace_booking_player(
  p_booking jsonb,
  p_old_player_id uuid,
  p_new_player_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_reservations jsonb;
  v_ball_purchases jsonb;
BEGIN
  IF jsonb_typeof(COALESCE(p_booking, '[]'::jsonb)) = 'array' THEN
    v_reservations := COALESCE(p_booking, '[]'::jsonb);
    v_ball_purchases := '[]'::jsonb;
  ELSE
    v_reservations := COALESCE(p_booking->'reservations', '[]'::jsonb);
    v_ball_purchases := COALESCE(p_booking->'ballPurchases', '[]'::jsonb);
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN COALESCE(item->>'playerId', item->>'player_id') = p_old_player_id::text THEN
          CASE
            WHEN item ? 'playerId' THEN jsonb_set(item, '{playerId}', to_jsonb(p_new_player_id::text), true)
            ELSE jsonb_set(item, '{player_id}', to_jsonb(p_new_player_id::text), true)
          END
        ELSE item
      END
    ),
    '[]'::jsonb
  )
  INTO v_reservations
  FROM jsonb_array_elements(v_reservations) AS item;

  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN COALESCE(item->>'playerId', item->>'player_id') = p_old_player_id::text THEN
          CASE
            WHEN item ? 'playerId' THEN jsonb_set(item, '{playerId}', to_jsonb(p_new_player_id::text), true)
            ELSE jsonb_set(item, '{player_id}', to_jsonb(p_new_player_id::text), true)
          END
        ELSE item
      END
    ),
    '[]'::jsonb
  )
  INTO v_ball_purchases
  FROM jsonb_array_elements(v_ball_purchases) AS item;

  RETURN jsonb_build_object(
    'reservations', v_reservations,
    'ballPurchases', v_ball_purchases
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.server_substitution_build_booking_transfers(
  p_participant_ids uuid[],
  p_booking jsonb,
  p_previous_transfers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_payments jsonb := COALESCE(p_booking->'reservations', '[]'::jsonb) || COALESCE(p_booking->'ballPurchases', '[]'::jsonb);
  v_total numeric := 0;
  v_share numeric := 0;
  v_player_id uuid;
  v_paid numeric;
  v_balance numeric;
  v_creditor_ids uuid[] := ARRAY[]::uuid[];
  v_creditor_amounts numeric[] := ARRAY[]::numeric[];
  v_debtor_ids uuid[] := ARRAY[]::uuid[];
  v_debtor_amounts numeric[] := ARRAY[]::numeric[];
  v_creditor_index integer := 1;
  v_debtor_index integer := 1;
  v_amount numeric;
  v_transfer_id text;
  v_previous jsonb;
  v_result jsonb := '[]'::jsonb;
BEGIN
  IF COALESCE(cardinality(p_participant_ids), 0) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(sum((item->>'amount')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(v_payments) AS item
  WHERE (item->>'amount') ~ '^[0-9]+([.][0-9]+)?$';

  IF v_total <= 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  v_share := round(v_total / cardinality(p_participant_ids), 2);

  FOREACH v_player_id IN ARRAY p_participant_ids LOOP
    SELECT COALESCE(sum((item->>'amount')::numeric), 0)
    INTO v_paid
    FROM jsonb_array_elements(v_payments) AS item
    WHERE COALESCE(item->>'playerId', item->>'player_id') = v_player_id::text
      AND (item->>'amount') ~ '^[0-9]+([.][0-9]+)?$';

    v_balance := round(v_paid - v_share, 2);

    IF v_balance > 0.009 THEN
      v_creditor_ids := array_append(v_creditor_ids, v_player_id);
      v_creditor_amounts := array_append(v_creditor_amounts, v_balance);
    ELSIF v_balance < -0.009 THEN
      v_debtor_ids := array_append(v_debtor_ids, v_player_id);
      v_debtor_amounts := array_append(v_debtor_amounts, abs(v_balance));
    END IF;
  END LOOP;

  WHILE v_creditor_index <= COALESCE(cardinality(v_creditor_ids), 0)
    AND v_debtor_index <= COALESCE(cardinality(v_debtor_ids), 0)
  LOOP
    v_amount := round(least(v_creditor_amounts[v_creditor_index], v_debtor_amounts[v_debtor_index]), 2);

    IF v_amount > 0 THEN
      v_transfer_id := v_debtor_ids[v_debtor_index]::text || '--' ||
        v_creditor_ids[v_creditor_index]::text || '--' ||
        to_char(v_amount, 'FM999999990.00');

      SELECT item
      INTO v_previous
      FROM jsonb_array_elements(COALESCE(p_previous_transfers, '[]'::jsonb)) AS item
      WHERE item->>'id' = v_transfer_id
      LIMIT 1;

      v_result := v_result || jsonb_build_array(
        jsonb_build_object(
          'id', v_transfer_id,
          'fromPlayerId', v_debtor_ids[v_debtor_index]::text,
          'toPlayerId', v_creditor_ids[v_creditor_index]::text,
          'amount', v_amount,
          'isPaid', COALESCE((v_previous->>'isPaid')::boolean, false),
          'paidAt', CASE WHEN COALESCE((v_previous->>'isPaid')::boolean, false) THEN v_previous->'paidAt' ELSE 'null'::jsonb END
        )
      );
    END IF;

    v_creditor_amounts[v_creditor_index] := round(v_creditor_amounts[v_creditor_index] - v_amount, 2);
    v_debtor_amounts[v_debtor_index] := round(v_debtor_amounts[v_debtor_index] - v_amount, 2);

    IF v_creditor_amounts[v_creditor_index] <= 0.009 THEN
      v_creditor_index := v_creditor_index + 1;
    END IF;

    IF v_debtor_amounts[v_debtor_index] <= 0.009 THEN
      v_debtor_index := v_debtor_index + 1;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_add_season_substitute(
  p_season_id uuid,
  p_player_id uuid,
  p_display_name text,
  p_slug text,
  p_avatar_initials text
)
RETURNS TABLE (
  substitute_id uuid,
  player_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_season public.seasons%ROWTYPE;
  v_player_id uuid := p_player_id;
BEGIN
  SELECT * INTO v_season
  FROM public.seasons
  WHERE id = p_season_id
  FOR UPDATE;

  IF v_season.id IS NULL THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF v_player_id IS NULL THEN
    IF length(trim(COALESCE(p_display_name, ''))) < 2 OR length(trim(p_display_name)) > 80 THEN
      RAISE EXCEPTION 'invalid_display_name';
    END IF;

    INSERT INTO public.players (league_id, slug, display_name, avatar_initials)
    VALUES (v_season.league_id, p_slug, trim(p_display_name), p_avatar_initials)
    RETURNING id INTO v_player_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = v_player_id AND league_id = v_season.league_id
  ) THEN
    RAISE EXCEPTION 'player_not_found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.season_players
    WHERE season_id = p_season_id AND player_id = v_player_id
  ) THEN
    RAISE EXCEPTION 'season_player_cannot_be_substitute';
  END IF;

  INSERT INTO public.season_substitutes (
    league_id,
    season_id,
    player_id,
    active,
    inactive_reason,
    updated_at
  )
  VALUES (
    v_season.league_id,
    p_season_id,
    v_player_id,
    true,
    NULL,
    now()
  )
  ON CONFLICT (season_id, player_id)
  DO UPDATE SET
    active = true,
    inactive_reason = NULL,
    updated_at = now()
  RETURNING id INTO substitute_id;

  player_id := v_player_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_assign_match_substitute(
  p_match_id uuid,
  p_original_player_id uuid,
  p_substitute_player_id uuid,
  p_display_name text,
  p_slug text,
  p_avatar_initials text,
  p_created_by_user_id uuid
)
RETURNS TABLE (
  match_id uuid,
  substitute_player_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_substitute_player_id uuid := p_substitute_player_id;
  v_booking jsonb;
  v_team_a uuid[];
  v_team_b uuid[];
BEGIN
  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'match_not_found';
  END IF;

  IF v_match.status = 'finished' THEN
    RAISE EXCEPTION 'finished_match_locked';
  END IF;

  IF NOT (p_original_player_id = ANY(v_match.team_a) OR p_original_player_id = ANY(v_match.team_b)) THEN
    RAISE EXCEPTION 'invalid_original_player';
  END IF;

  IF v_substitute_player_id IS NULL THEN
    IF length(trim(COALESCE(p_display_name, ''))) < 2 OR length(trim(p_display_name)) > 80 THEN
      RAISE EXCEPTION 'invalid_display_name';
    END IF;

    INSERT INTO public.players (league_id, slug, display_name, avatar_initials)
    VALUES (v_match.league_id, p_slug, trim(p_display_name), p_avatar_initials)
    RETURNING id INTO v_substitute_player_id;

    INSERT INTO public.season_substitutes (
      league_id,
      season_id,
      player_id,
      active,
      inactive_reason,
      updated_at
    ) VALUES (
      v_match.league_id,
      v_match.season_id,
      v_substitute_player_id,
      true,
      NULL,
      now()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = v_substitute_player_id AND league_id = v_match.league_id
  ) THEN
    RAISE EXCEPTION 'substitute_player_not_found';
  END IF;

  IF v_substitute_player_id = ANY(v_match.team_a) OR v_substitute_player_id = ANY(v_match.team_b) THEN
    RAISE EXCEPTION 'substitute_already_in_match';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.season_players
    WHERE season_id = v_match.season_id AND player_id = v_substitute_player_id
  ) THEN
    RAISE EXCEPTION 'season_player_cannot_be_substitute';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.season_substitutes
    WHERE season_id = v_match.season_id
      AND player_id = v_substitute_player_id
      AND active = true
  ) THEN
    RAISE EXCEPTION 'substitute_not_available';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.match_substitutions
    WHERE match_id = p_match_id AND original_player_id = p_original_player_id
  ) THEN
    RAISE EXCEPTION 'original_player_already_substituted';
  END IF;

  v_team_a := array_replace(v_match.team_a, p_original_player_id, v_substitute_player_id);
  v_team_b := array_replace(v_match.team_b, p_original_player_id, v_substitute_player_id);
  v_booking := public.server_substitution_replace_booking_player(
    v_match.booking_reservations,
    p_original_player_id,
    v_substitute_player_id
  );

  UPDATE public.matches
  SET
    team_a = v_team_a,
    team_b = v_team_b,
    booking_reservations = CASE WHEN court_reserved THEN v_booking ELSE booking_reservations END,
    booking_transfers = CASE
      WHEN court_reserved THEN public.server_substitution_build_booking_transfers(
        v_team_a || v_team_b,
        v_booking,
        booking_transfers
      )
      ELSE booking_transfers
    END,
    booking_updated_at = CASE WHEN court_reserved THEN now() ELSE booking_updated_at END
  WHERE id = p_match_id;

  INSERT INTO public.match_substitutions (
    league_id,
    season_id,
    match_id,
    original_player_id,
    substitute_player_id,
    substitution_type,
    created_by_user_id
  ) VALUES (
    v_match.league_id,
    v_match.season_id,
    p_match_id,
    p_original_player_id,
    v_substitute_player_id,
    'single',
    p_created_by_user_id
  );

  match_id := p_match_id;
  substitute_player_id := v_substitute_player_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_remove_match_substitute(
  p_match_id uuid,
  p_substitute_player_id uuid
)
RETURNS TABLE (
  match_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_match public.matches%ROWTYPE;
  v_substitution public.match_substitutions%ROWTYPE;
  v_booking jsonb;
  v_team_a uuid[];
  v_team_b uuid[];
BEGIN
  SELECT * INTO v_match
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'match_not_found';
  END IF;

  IF v_match.status = 'finished' THEN
    RAISE EXCEPTION 'finished_match_locked';
  END IF;

  SELECT substitution.* INTO v_substitution
  FROM public.match_substitutions AS substitution
  WHERE substitution.match_id = p_match_id
    AND substitution.substitute_player_id = p_substitute_player_id
    AND substitution.substitution_type = 'single'
  FOR UPDATE;

  IF v_substitution.id IS NULL THEN
    RAISE EXCEPTION 'substitution_not_found';
  END IF;

  v_team_a := array_replace(v_match.team_a, p_substitute_player_id, v_substitution.original_player_id);
  v_team_b := array_replace(v_match.team_b, p_substitute_player_id, v_substitution.original_player_id);
  v_booking := public.server_substitution_replace_booking_player(
    v_match.booking_reservations,
    p_substitute_player_id,
    v_substitution.original_player_id
  );

  UPDATE public.matches
  SET
    team_a = v_team_a,
    team_b = v_team_b,
    booking_reservations = CASE WHEN court_reserved THEN v_booking ELSE booking_reservations END,
    booking_transfers = CASE
      WHEN court_reserved THEN public.server_substitution_build_booking_transfers(
        v_team_a || v_team_b,
        v_booking,
        booking_transfers
      )
      ELSE booking_transfers
    END,
    booking_updated_at = CASE WHEN court_reserved THEN now() ELSE booking_updated_at END
  WHERE id = p_match_id;

  DELETE FROM public.match_substitutions
  WHERE id = v_substitution.id;

  match_id := p_match_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.server_apply_season_replacement(
  p_season_id uuid,
  p_outgoing_player_id uuid,
  p_incoming_player_id uuid,
  p_display_name text,
  p_slug text,
  p_avatar_initials text,
  p_from_round integer,
  p_created_by_user_id uuid
)
RETURNS TABLE (
  replacement_id uuid,
  incoming_player_id uuid,
  affected_matches integer
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_season public.seasons%ROWTYPE;
  v_outgoing public.season_players%ROWTYPE;
  v_incoming_player_id uuid := p_incoming_player_id;
  v_match public.matches%ROWTYPE;
  v_booking jsonb;
  v_team_a uuid[];
  v_team_b uuid[];
  v_affected integer := 0;
BEGIN
  SELECT * INTO v_season
  FROM public.seasons
  WHERE id = p_season_id
  FOR UPDATE;

  IF v_season.id IS NULL THEN
    RAISE EXCEPTION 'season_not_found';
  END IF;

  IF p_from_round < 1 OR p_from_round > v_season.total_rounds THEN
    RAISE EXCEPTION 'invalid_from_round';
  END IF;

  SELECT * INTO v_outgoing
  FROM public.season_players
  WHERE season_id = p_season_id
    AND player_id = p_outgoing_player_id
  FOR UPDATE;

  IF v_outgoing.id IS NULL OR v_outgoing.status <> 'active' THEN
    RAISE EXCEPTION 'outgoing_player_not_active';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.matches
    WHERE season_id = p_season_id
      AND round >= p_from_round
      AND status = 'finished'
  ) THEN
    RAISE EXCEPTION 'replacement_round_has_finished_matches';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.match_substitutions substitution
    JOIN public.matches match ON match.id = substitution.match_id
    WHERE substitution.season_id = p_season_id
      AND substitution.original_player_id = p_outgoing_player_id
      AND substitution.substitution_type = 'single'
      AND match.round >= p_from_round
      AND match.status <> 'finished'
  ) THEN
    RAISE EXCEPTION 'outgoing_has_future_substitutions';
  END IF;

  IF v_incoming_player_id IS NULL THEN
    IF length(trim(COALESCE(p_display_name, ''))) < 2 OR length(trim(p_display_name)) > 80 THEN
      RAISE EXCEPTION 'invalid_display_name';
    END IF;

    INSERT INTO public.players (league_id, slug, display_name, avatar_initials)
    VALUES (v_season.league_id, p_slug, trim(p_display_name), p_avatar_initials)
    RETURNING id INTO v_incoming_player_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.players
      WHERE id = v_incoming_player_id AND league_id = v_season.league_id
    ) THEN
      RAISE EXCEPTION 'incoming_player_not_found';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.season_substitutes
      WHERE season_id = p_season_id
        AND player_id = v_incoming_player_id
        AND active = true
    ) THEN
      RAISE EXCEPTION 'incoming_player_not_available';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.season_players
    WHERE season_id = p_season_id AND player_id = v_incoming_player_id
  ) THEN
    RAISE EXCEPTION 'incoming_player_already_in_season';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.match_substitutions substitution
    JOIN public.matches match ON match.id = substitution.match_id
    WHERE substitution.season_id = p_season_id
      AND substitution.substitute_player_id = v_incoming_player_id
      AND substitution.substitution_type = 'single'
      AND match.status <> 'finished'
  ) THEN
    RAISE EXCEPTION 'incoming_has_future_substitutions';
  END IF;

  SELECT count(*) INTO v_affected
  FROM public.matches
  WHERE season_id = p_season_id
    AND round >= p_from_round
    AND status <> 'finished'
    AND (
      p_outgoing_player_id = ANY(team_a)
      OR p_outgoing_player_id = ANY(team_b)
    );

  IF v_affected = 0 THEN
    RAISE EXCEPTION 'replacement_has_no_future_matches';
  END IF;

  INSERT INTO public.season_players (
    season_id,
    player_id,
    status,
    joined_from_round,
    replaces_player_id
  ) VALUES (
    p_season_id,
    v_incoming_player_id,
    'active',
    p_from_round,
    p_outgoing_player_id
  );

  INSERT INTO public.season_replacements (
    league_id,
    season_id,
    outgoing_player_id,
    incoming_player_id,
    from_round,
    created_by_user_id
  ) VALUES (
    v_season.league_id,
    p_season_id,
    p_outgoing_player_id,
    v_incoming_player_id,
    p_from_round,
    p_created_by_user_id
  )
  RETURNING id INTO replacement_id;

  FOR v_match IN
    SELECT * FROM public.matches
    WHERE season_id = p_season_id
      AND round >= p_from_round
      AND status <> 'finished'
      AND (
        p_outgoing_player_id = ANY(team_a)
        OR p_outgoing_player_id = ANY(team_b)
      )
    ORDER BY round, id
    FOR UPDATE
  LOOP
    v_team_a := array_replace(v_match.team_a, p_outgoing_player_id, v_incoming_player_id);
    v_team_b := array_replace(v_match.team_b, p_outgoing_player_id, v_incoming_player_id);
    v_booking := public.server_substitution_replace_booking_player(
      v_match.booking_reservations,
      p_outgoing_player_id,
      v_incoming_player_id
    );

    UPDATE public.matches
    SET
      team_a = v_team_a,
      team_b = v_team_b,
      booking_reservations = CASE WHEN court_reserved THEN v_booking ELSE booking_reservations END,
      booking_transfers = CASE
        WHEN court_reserved THEN public.server_substitution_build_booking_transfers(
          v_team_a || v_team_b,
          v_booking,
          booking_transfers
        )
        ELSE booking_transfers
      END,
      booking_updated_at = CASE WHEN court_reserved THEN now() ELSE booking_updated_at END
    WHERE id = v_match.id;

    INSERT INTO public.match_substitutions (
      league_id,
      season_id,
      match_id,
      original_player_id,
      substitute_player_id,
      substitution_type,
      created_by_user_id
    ) VALUES (
      v_season.league_id,
      p_season_id,
      v_match.id,
      p_outgoing_player_id,
      v_incoming_player_id,
      'permanent',
      p_created_by_user_id
    );
  END LOOP;

  UPDATE public.season_players
  SET
    status = 'withdrawn',
    replaced_from_round = p_from_round,
    replaced_by_player_id = v_incoming_player_id
  WHERE id = v_outgoing.id;

  UPDATE public.season_substitutes
  SET
    active = false,
    inactive_reason = 'promoted',
    updated_at = now()
  WHERE season_id = p_season_id
    AND player_id = v_incoming_player_id;

  incoming_player_id := v_incoming_player_id;
  affected_matches := v_affected;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.server_substitution_replace_booking_player(jsonb, uuid, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_substitution_build_booking_transfers(uuid[], jsonb, jsonb) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_add_season_substitute(uuid, uuid, text, text, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_assign_match_substitute(uuid, uuid, uuid, text, text, text, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_remove_match_substitute(uuid, uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.server_apply_season_replacement(uuid, uuid, uuid, text, text, text, integer, uuid) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.server_substitution_replace_booking_player(jsonb, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_substitution_build_booking_transfers(uuid[], jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_add_season_substitute(uuid, uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_assign_match_substitute(uuid, uuid, uuid, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_remove_match_substitute(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.server_apply_season_replacement(uuid, uuid, uuid, text, text, text, integer, uuid) TO service_role;

COMMIT;
