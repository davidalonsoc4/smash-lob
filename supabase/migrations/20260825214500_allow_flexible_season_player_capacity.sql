-- v1.12.1: los calendarios equilibrados admiten plantillas con descansos.
-- Conservamos el rango histórico de BBDD para no invalidar temporadas legacy;
-- la aplicación limita las nuevas temporadas a 8..24 jugadores.
ALTER TABLE public.season_settings
  DROP CONSTRAINT IF EXISTS season_settings_player_capacity_check,
  ADD CONSTRAINT season_settings_player_capacity_check
    CHECK (player_capacity IS NULL OR player_capacity BETWEEN 4 AND 32);
