-- Smash & Lob v1.7.0 · chat privado por partido
create table if not exists public.match_chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  sender_user_id uuid not null references public.app_users(id) on delete cascade,
  sender_player_id uuid references public.players(id) on delete set null,
  sender_display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint match_chat_messages_body_check check (char_length(btrim(body)) between 1 and 2000)
);
create index if not exists match_chat_messages_match_created_idx on public.match_chat_messages(match_id, created_at desc);
create index if not exists match_chat_messages_season_idx on public.match_chat_messages(season_id);
create table if not exists public.match_chat_reads (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);
alter table public.match_chat_messages enable row level security;
alter table public.match_chat_reads enable row level security;
revoke all on table public.match_chat_messages from public, anon, authenticated;
revoke all on table public.match_chat_reads from public, anon, authenticated;
grant all on table public.match_chat_messages to service_role;
grant all on table public.match_chat_reads to service_role;

create or replace function public.cleanup_old_match_chat() returns trigger
language plpgsql security definer set search_path = public as $$
declare keep_finished integer;
begin
  if new.status <> 'finished' or old.status = 'finished' then return new; end if;
  select case when exists (
    select 1 from public.seasons where league_id = new.league_id and status <> 'finished'
  ) then 2 else 3 end into keep_finished;
  delete from public.match_chat_reads r using public.matches m
   where r.match_id = m.id and m.league_id = new.league_id and m.season_id in (
     select id from public.seasons where league_id = new.league_id and status = 'finished'
     order by created_at desc offset keep_finished
   );
  delete from public.match_chat_messages
   where league_id = new.league_id and season_id in (
     select id from public.seasons where league_id = new.league_id and status = 'finished'
     order by created_at desc offset keep_finished
   );
  return new;
end $$;
revoke all on function public.cleanup_old_match_chat() from public, anon, authenticated;
grant execute on function public.cleanup_old_match_chat() to service_role;
drop trigger if exists cleanup_old_match_chat_after_season_finish on public.seasons;
create trigger cleanup_old_match_chat_after_season_finish
after update of status on public.seasons for each row
when (new.status = 'finished' and old.status is distinct from new.status)
execute function public.cleanup_old_match_chat();
