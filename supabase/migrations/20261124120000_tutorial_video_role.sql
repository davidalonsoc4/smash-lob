-- Destinatario del tutorial: 'player' (cualquier jugador; es el valor de siempre) o 'creator' (solo quien organiza:
-- creadores y administradores de liga, además de quien gestiona los tutoriales). Los jugadores no lo ven ni se enteran.
alter table public.tutorial_videos
  add column if not exists target_role text not null default 'player'
  check (target_role in ('player', 'creator'));
