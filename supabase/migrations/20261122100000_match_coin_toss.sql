-- Sorteo de saque con moneda, en liga y en amistosos. Se hace en la pista: lo decide el servidor (50 % para cada equipo)
-- y queda guardado para que todos los participantes vean el mismo resultado. Un partido tiene un único sorteo vigente:
-- repetirlo lo sustituye y suma uno al contador.
--   called_heads_team: el equipo (1 o 2) que cantó cara; el otro equipo canta cruz.
--   winner_choice: lo que elige el equipo ganador (sacar, restar o lado). Con 'side' el otro equipo elige después
--   sacar o restar (other_choice). serving_team es el equipo que saca primero cuando ya se sabe.
-- Solo el servidor lee y escribe.

create table public.match_coin_tosses (
  id uuid primary key default gen_random_uuid(),
  match_id uuid unique references public.matches(id) on delete cascade,
  personal_match_id uuid unique references public.personal_matches(id) on delete cascade,
  called_heads_team smallint not null check (called_heads_team in (1, 2)),
  result text not null check (result in ('heads', 'tails')),
  winner_team smallint not null check (winner_team in (1, 2)),
  winner_choice text check (winner_choice in ('serve', 'return', 'side')),
  other_choice text check (other_choice in ('serve', 'return')),
  serving_team smallint check (serving_team in (1, 2)),
  tossed_by_user_id uuid references public.app_users(id) on delete set null,
  toss_count integer not null default 1 check (toss_count >= 1),
  tossed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_coin_tosses_one_match check ((match_id is null) <> (personal_match_id is null)),
  constraint match_coin_tosses_other_needs_side check (other_choice is null or winner_choice = 'side')
);

alter table public.match_coin_tosses enable row level security;
revoke all on public.match_coin_tosses from public, anon, authenticated;
grant all on public.match_coin_tosses to service_role;
