


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."league_role" AS ENUM (
    'creator',
    'admin',
    'player'
);


ALTER TYPE "public"."league_role" OWNER TO "postgres";


CREATE TYPE "public"."match_status" AS ENUM (
    'finished',
    'scheduling',
    'scheduled',
    'postponed'
);


ALTER TYPE "public"."match_status" OWNER TO "postgres";


CREATE TYPE "public"."round_window_mode" AS ENUM (
    'none',
    'fixed-days'
);


ALTER TYPE "public"."round_window_mode" OWNER TO "postgres";


CREATE TYPE "public"."season_status" AS ENUM (
    'active',
    'finished',
    'upcoming'
);


ALTER TYPE "public"."season_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "season_id" "uuid",
    "match_id" "uuid",
    "actor_user_id" "uuid",
    "actor_email" "text" NOT NULL,
    "actor_display_name" "text",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "is_superuser" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "can_create_leagues" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "created_by_user_id" "uuid",
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."league_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."league_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."league_memberships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "league_id" "uuid" NOT NULL,
    "player_id" "uuid",
    "role" "public"."league_role" DEFAULT 'player'::"public"."league_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."league_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."league_spectators" (
    "league_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "spectator_invite_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."league_spectators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leagues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "invite_code" "text" NOT NULL,
    "join_mode" "text" DEFAULT 'closed'::"text" NOT NULL,
    "active_season_id" "uuid",
    "created_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locations" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "logo_url" "text",
    "activity_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status_colors_enabled" boolean DEFAULT true NOT NULL,
    "show_ranking_avatars" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."leagues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_result_confirmations" (
    "match_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "match_result_confirmations_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'disputed'::"text"])))
);


ALTER TABLE "public"."match_result_confirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "round" integer NOT NULL,
    "status" "public"."match_status" DEFAULT 'scheduling'::"public"."match_status" NOT NULL,
    "team_a" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "team_b" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "points_a" integer,
    "points_b" integer,
    "sets" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "date_label" "text",
    "location" "text",
    "result_recorded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "court_reserved" boolean DEFAULT false NOT NULL,
    "booking_reservations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "booking_transfers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "booking_updated_at" timestamp with time zone,
    "result_reported_by_player_id" "uuid",
    "result_locked" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvp_manual_selections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "scope" "text" NOT NULL,
    "round" integer,
    "round_key" integer GENERATED ALWAYS AS (COALESCE("round", 0)) STORED,
    "selected_player_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "mvp_manual_selections_round_check" CHECK ((("round" IS NULL) OR ("round" > 0))),
    CONSTRAINT "mvp_manual_selections_scope_check" CHECK (("scope" = ANY (ARRAY['round'::"text", 'season'::"text"])))
);


ALTER TABLE "public"."mvp_manual_selections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mvp_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "round" integer NOT NULL,
    "voter_player_id" "uuid" NOT NULL,
    "selected_player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "match_id" "uuid",
    CONSTRAINT "mvp_votes_no_self_vote" CHECK (("voter_player_id" <> "selected_player_id")),
    CONSTRAINT "mvp_votes_round_check" CHECK (("round" > 0))
);


ALTER TABLE "public"."mvp_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "user_email" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{"next_match": true, "booking_i_owe": true, "season_events": true, "my_match_result": true, "booking_paid_to_me": true}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "timezone" "text" DEFAULT 'Europe/Madrid'::"text" NOT NULL,
    "weekly_slots" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "date_overrides" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "avatar_initials" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text"
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "user_email" "text" NOT NULL,
    "player_id" "uuid",
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "user_agent" "text",
    "enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."season_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_settings" (
    "season_id" "uuid" NOT NULL,
    "league_id" "uuid" NOT NULL,
    "round_window_mode" "public"."round_window_mode" DEFAULT 'none'::"public"."round_window_mode" NOT NULL,
    "season_starts_at" "date",
    "round_window_days" integer,
    "requires_three_sets" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "manual_active_round" integer,
    "manual_completed_rounds" integer[] DEFAULT '{}'::integer[] NOT NULL,
    "registration_fee" "jsonb" DEFAULT '{"amount": 0, "enabled": false, "payments": []}'::"jsonb" NOT NULL,
    "mvp_system" "text" DEFAULT 'automatic'::"text" NOT NULL,
    "result_confirmation_mode" "text" DEFAULT 'optional'::"text" NOT NULL,
    CONSTRAINT "season_settings_mvp_system_check" CHECK (("mvp_system" = ANY (ARRAY['none'::"text", 'automatic'::"text", 'voting'::"text"]))),
    CONSTRAINT "season_settings_result_confirmation_mode_check" CHECK (("result_confirmation_mode" = ANY (ARRAY['required'::"text", 'optional'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."season_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "status" "public"."season_status" DEFAULT 'active'::"public"."season_status" NOT NULL,
    "total_rounds" integer NOT NULL,
    "completed_rounds" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seasons_status_check" CHECK ((("status")::"text" = ANY (ARRAY['upcoming'::"text", 'active'::"text", 'finished'::"text"])))
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spectator_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "league_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."spectator_invites" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."league_locations"
    ADD CONSTRAINT "league_locations_league_id_name_key" UNIQUE ("league_id", "name");



ALTER TABLE ONLY "public"."league_locations"
    ADD CONSTRAINT "league_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_league_id_player_id_key" UNIQUE ("league_id", "player_id");



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_user_id_league_id_key" UNIQUE ("user_id", "league_id");



ALTER TABLE ONLY "public"."league_spectators"
    ADD CONSTRAINT "league_spectators_pkey" PRIMARY KEY ("league_id", "user_id");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."match_result_confirmations"
    ADD CONSTRAINT "match_result_confirmations_pkey" PRIMARY KEY ("match_id", "player_id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvp_manual_selections"
    ADD CONSTRAINT "mvp_manual_selections_league_id_season_id_scope_round_key_key" UNIQUE ("league_id", "season_id", "scope", "round_key");



ALTER TABLE ONLY "public"."mvp_manual_selections"
    ADD CONSTRAINT "mvp_manual_selections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_league_id_user_email_key" UNIQUE ("league_id", "user_email");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_league_id_season_id_player_id_key" UNIQUE ("league_id", "season_id", "player_id");



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_league_season_player_unique" UNIQUE ("league_id", "season_id", "player_id");



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_league_id_slug_key" UNIQUE ("league_id", "slug");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_season_id_player_id_key" UNIQUE ("season_id", "player_id");



ALTER TABLE ONLY "public"."season_settings"
    ADD CONSTRAINT "season_settings_pkey" PRIMARY KEY ("season_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spectator_invites"
    ADD CONSTRAINT "spectator_invites_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."spectator_invites"
    ADD CONSTRAINT "spectator_invites_pkey" PRIMARY KEY ("id");



CREATE INDEX "activity_events_league_created_at_idx" ON "public"."activity_events" USING "btree" ("league_id", "created_at" DESC);



CREATE INDEX "league_memberships_joined_at_idx" ON "public"."league_memberships" USING "btree" ("league_id", "player_id", "joined_at");



CREATE INDEX "league_spectators_invite_id_idx" ON "public"."league_spectators" USING "btree" ("spectator_invite_id") WHERE ("spectator_invite_id" IS NOT NULL);



CREATE INDEX "league_spectators_user_id_idx" ON "public"."league_spectators" USING "btree" ("user_id");



CREATE INDEX "matches_result_reported_by_player_id_idx" ON "public"."matches" USING "btree" ("result_reported_by_player_id") WHERE ("result_reported_by_player_id" IS NOT NULL);



CREATE UNIQUE INDEX "mvp_votes_league_season_match_voter_idx" ON "public"."mvp_votes" USING "btree" ("league_id", "season_id", "match_id", "voter_player_id") WHERE ("match_id" IS NOT NULL);



CREATE UNIQUE INDEX "mvp_votes_league_season_round_voter_idx" ON "public"."mvp_votes" USING "btree" ("league_id", "season_id", "round", "voter_player_id") WHERE ("match_id" IS NULL);



CREATE INDEX "mvp_votes_match_id_idx" ON "public"."mvp_votes" USING "btree" ("match_id") WHERE ("match_id" IS NOT NULL);



CREATE INDEX "notification_preferences_league_email_idx" ON "public"."notification_preferences" USING "btree" ("league_id", "user_email");



CREATE INDEX "player_availability_league_season_idx" ON "public"."player_availability" USING "btree" ("league_id", "season_id");



CREATE INDEX "player_availability_player_idx" ON "public"."player_availability" USING "btree" ("player_id");



CREATE INDEX "push_subscriptions_endpoint_idx" ON "public"."push_subscriptions" USING "btree" ("endpoint");



CREATE INDEX "push_subscriptions_league_email_enabled_idx" ON "public"."push_subscriptions" USING "btree" ("league_id", "user_email", "enabled");



CREATE UNIQUE INDEX "spectator_invites_one_active_per_league_idx" ON "public"."spectator_invites" USING "btree" ("league_id") WHERE ("is_active" = true);



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_locations"
    ADD CONSTRAINT "league_locations_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."league_memberships"
    ADD CONSTRAINT "league_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_spectators"
    ADD CONSTRAINT "league_spectators_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."league_spectators"
    ADD CONSTRAINT "league_spectators_spectator_invite_id_fkey" FOREIGN KEY ("spectator_invite_id") REFERENCES "public"."spectator_invites"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."league_spectators"
    ADD CONSTRAINT "league_spectators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_active_season_id_fkey" FOREIGN KEY ("active_season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leagues"
    ADD CONSTRAINT "leagues_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."match_result_confirmations"
    ADD CONSTRAINT "match_result_confirmations_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_result_confirmations"
    ADD CONSTRAINT "match_result_confirmations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_result_reported_by_player_id_fkey" FOREIGN KEY ("result_reported_by_player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_manual_selections"
    ADD CONSTRAINT "mvp_manual_selections_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_manual_selections"
    ADD CONSTRAINT "mvp_manual_selections_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_manual_selections"
    ADD CONSTRAINT "mvp_manual_selections_selected_player_id_fkey" FOREIGN KEY ("selected_player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_selected_player_id_fkey" FOREIGN KEY ("selected_player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mvp_votes"
    ADD CONSTRAINT "mvp_votes_voter_player_id_fkey" FOREIGN KEY ("voter_player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_availability"
    ADD CONSTRAINT "player_availability_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_players"
    ADD CONSTRAINT "season_players_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_settings"
    ADD CONSTRAINT "season_settings_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_settings"
    ADD CONSTRAINT "season_settings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spectator_invites"
    ADD CONSTRAINT "spectator_invites_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."spectator_invites"
    ADD CONSTRAINT "spectator_invites_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE CASCADE;



ALTER TABLE "public"."activity_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_events_insert_open" ON "public"."activity_events" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "activity_events_select_open" ON "public"."activity_events" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated can create leagues" ON "public"."leagues" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can create memberships" ON "public"."league_memberships" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can create players" ON "public"."players" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can create season players" ON "public"."season_players" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can create season settings" ON "public"."season_settings" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can create seasons" ON "public"."seasons" FOR INSERT WITH CHECK (true);



CREATE POLICY "authenticated can manage invites" ON "public"."invites" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated can manage locations" ON "public"."league_locations" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated can manage matches" ON "public"."matches" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated can update leagues" ON "public"."leagues" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "dev all app_users" ON "public"."app_users" USING (true) WITH CHECK (true);



CREATE POLICY "dev all invites" ON "public"."invites" USING (true) WITH CHECK (true);



CREATE POLICY "dev all league_locations" ON "public"."league_locations" USING (true) WITH CHECK (true);



CREATE POLICY "dev all league_memberships" ON "public"."league_memberships" USING (true) WITH CHECK (true);



CREATE POLICY "dev all leagues" ON "public"."leagues" USING (true) WITH CHECK (true);



CREATE POLICY "dev all matches" ON "public"."matches" USING (true) WITH CHECK (true);



CREATE POLICY "dev all players" ON "public"."players" USING (true) WITH CHECK (true);



CREATE POLICY "dev all season_players" ON "public"."season_players" USING (true) WITH CHECK (true);



CREATE POLICY "dev all season_settings" ON "public"."season_settings" USING (true) WITH CHECK (true);



CREATE POLICY "dev all seasons" ON "public"."seasons" USING (true) WITH CHECK (true);



CREATE POLICY "invites readable by code" ON "public"."invites" FOR SELECT USING (("revoked_at" IS NULL));



CREATE POLICY "league members can read leagues" ON "public"."leagues" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."league_memberships" "lm"
     JOIN "public"."app_users" "u" ON (("u"."id" = "lm"."user_id")))
  WHERE ("lm"."league_id" = "leagues"."id"))));



CREATE POLICY "league members can read locations" ON "public"."league_locations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."league_memberships" "lm"
  WHERE ("lm"."league_id" = "league_locations"."league_id"))));



CREATE POLICY "league members can read matches" ON "public"."matches" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."league_memberships" "lm"
  WHERE ("lm"."league_id" = "matches"."league_id"))));



CREATE POLICY "league members can read players" ON "public"."players" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."league_memberships" "lm"
  WHERE ("lm"."league_id" = "players"."league_id"))));



CREATE POLICY "league members can read season players" ON "public"."season_players" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."seasons" "s"
     JOIN "public"."league_memberships" "lm" ON (("lm"."league_id" = "s"."league_id")))
  WHERE ("s"."id" = "season_players"."season_id"))));



CREATE POLICY "league members can read season settings" ON "public"."season_settings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."league_memberships" "lm"
  WHERE ("lm"."league_id" = "season_settings"."league_id"))));



CREATE POLICY "league members can read seasons" ON "public"."seasons" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."league_memberships" "lm"
  WHERE ("lm"."league_id" = "seasons"."league_id"))));



ALTER TABLE "public"."league_locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."league_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."league_spectators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leagues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memberships readable" ON "public"."league_memberships" FOR SELECT USING (true);



CREATE POLICY "mvp_manual_delete" ON "public"."mvp_manual_selections" FOR DELETE USING (true);



CREATE POLICY "mvp_manual_insert" ON "public"."mvp_manual_selections" FOR INSERT WITH CHECK (true);



CREATE POLICY "mvp_manual_select" ON "public"."mvp_manual_selections" FOR SELECT USING (true);



ALTER TABLE "public"."mvp_manual_selections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mvp_manual_update" ON "public"."mvp_manual_selections" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."mvp_votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mvp_votes_insert" ON "public"."mvp_votes" FOR INSERT WITH CHECK (true);



CREATE POLICY "mvp_votes_select" ON "public"."mvp_votes" FOR SELECT USING (true);



CREATE POLICY "mvp_votes_update" ON "public"."mvp_votes" FOR UPDATE USING (true) WITH CHECK (true);



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."season_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."season_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spectator_invites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can insert users" ON "public"."app_users" FOR INSERT WITH CHECK (true);



CREATE POLICY "users can read own user" ON "public"."app_users" FOR SELECT USING (true);



CREATE POLICY "users can update users" ON "public"."app_users" FOR UPDATE USING (true) WITH CHECK (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_events" TO "anon";
GRANT ALL ON TABLE "public"."activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_events" TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."league_locations" TO "anon";
GRANT ALL ON TABLE "public"."league_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."league_locations" TO "service_role";



GRANT ALL ON TABLE "public"."league_memberships" TO "anon";
GRANT ALL ON TABLE "public"."league_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."league_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."league_spectators" TO "service_role";



GRANT ALL ON TABLE "public"."leagues" TO "anon";
GRANT ALL ON TABLE "public"."leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."leagues" TO "service_role";



GRANT ALL ON TABLE "public"."match_result_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."match_result_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."match_result_confirmations" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."mvp_manual_selections" TO "anon";
GRANT ALL ON TABLE "public"."mvp_manual_selections" TO "authenticated";
GRANT ALL ON TABLE "public"."mvp_manual_selections" TO "service_role";



GRANT ALL ON TABLE "public"."mvp_votes" TO "anon";
GRANT ALL ON TABLE "public"."mvp_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."mvp_votes" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."player_availability" TO "anon";
GRANT ALL ON TABLE "public"."player_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."player_availability" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."season_players" TO "anon";
GRANT ALL ON TABLE "public"."season_players" TO "authenticated";
GRANT ALL ON TABLE "public"."season_players" TO "service_role";



GRANT ALL ON TABLE "public"."season_settings" TO "anon";
GRANT ALL ON TABLE "public"."season_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."season_settings" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."spectator_invites" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







