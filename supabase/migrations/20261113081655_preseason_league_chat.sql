-- Include registered players in season chat from preseason. Existing grants are retained.
create or replace function public.capture_active_league_chat_participants()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_season uuid; target_league uuid;
begin
  if tg_table_name = 'seasons' then
    target_season := new.id;
    if tg_op = 'UPDATE' then
      if old.status = 'upcoming' and new.status <> 'upcoming' then
        delete from public.league_season_chat_participants p
        where p.season_id = new.id and not exists (
          select 1 from public.season_players sp
          join public.league_memberships lm on lm.league_id = new.league_id and lm.player_id = sp.player_id
          where sp.season_id = new.id and lm.user_id = p.user_id
        );
      end if;
    end if;
  elsif tg_table_name = 'season_players' then
    target_season := new.season_id;
  else
    target_league := new.league_id;
  end if;
  insert into public.league_season_chat_participants (season_id, user_id, player_id)
  select s.id, lm.user_id, sp.player_id
  from public.seasons s
  join public.season_players sp on sp.season_id = s.id
  join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
  where s.status in ('upcoming', 'active')
    and (s.id = target_season or s.league_id = target_league)
  on conflict (season_id, user_id) do nothing;
  return new;
end;
$$;


create or replace function public.send_league_season_chat_message(
  p_season_id uuid, p_user_id uuid, p_sender_display_name text, p_body text
) returns public.league_season_chat_messages
language plpgsql security definer set search_path = '' as $$
declare v_status public.season_status; v_message public.league_season_chat_messages;
begin
  select status into v_status from public.seasons where id = p_season_id for share;
  if v_status is null or v_status not in ('upcoming', 'active') then
    raise exception 'season_chat_read_only' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.league_season_chat_participants where season_id = p_season_id and user_id = p_user_id) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  if v_status = 'upcoming' and not exists (
    select 1 from public.season_players sp
    join public.seasons s on s.id = sp.season_id
    join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
    where sp.season_id = p_season_id and lm.user_id = p_user_id
  ) then
    raise exception 'season_chat_forbidden' using errcode = 'P0001';
  end if;
  insert into public.league_season_chat_messages (season_id, sender_user_id, sender_display_name, body)
  values (p_season_id, p_user_id, p_sender_display_name, p_body)
  returning * into v_message;
  return v_message;
end;
$$;

insert into public.league_season_chat_participants (season_id, user_id, player_id)
select s.id, lm.user_id, sp.player_id
from public.seasons s
join public.season_players sp on sp.season_id = s.id
join public.league_memberships lm on lm.league_id = s.league_id and lm.player_id = sp.player_id
where s.status = 'upcoming'
on conflict (season_id, user_id) do nothing;
