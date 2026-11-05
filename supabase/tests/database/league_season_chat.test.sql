begin;
select plan(9);

insert into public.app_users (id,email,display_name) values
  ('71000000-0000-4000-8000-000000000001','season-chat-a@example.invalid','Player A'),
  ('71000000-0000-4000-8000-000000000002','season-chat-b@example.invalid','Player B');
insert into public.leagues (id,slug,name,invite_code,created_by_user_id) values
  ('72000000-0000-4000-8000-000000000001','season-chat-test','Season chat','SEASONCHATTEST','71000000-0000-4000-8000-000000000001');
insert into public.players (id,league_id,slug,display_name,avatar_initials) values
  ('73000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','season-chat-a','Player A','PA'),
  ('73000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001','season-chat-b','Player B','PB');
insert into public.league_memberships (user_id,league_id,player_id) values
  ('71000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001');
insert into public.seasons (id,league_id,name,status,total_rounds) values
  ('74000000-0000-4000-8000-000000000001','72000000-0000-4000-8000-000000000001','Season 1','upcoming',1),
  ('74000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001','Season 2','upcoming',1);
insert into public.season_players (season_id,player_id) values
  ('74000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001'),
  ('74000000-0000-4000-8000-000000000002','73000000-0000-4000-8000-000000000002');
select is((select count(*) from public.league_season_chat_participants),0::bigint,'upcoming seasons are not captured');
update public.seasons set status = 'active' where id = '74000000-0000-4000-8000-000000000001';
select is((select count(*) from public.league_season_chat_participants),1::bigint,'activation captures the current roster');
update public.seasons set status = 'finished' where id = '74000000-0000-4000-8000-000000000001';
insert into public.league_memberships (user_id,league_id,player_id) values
  ('71000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000002');
select is((select count(*) from public.league_season_chat_participants where user_id = '71000000-0000-4000-8000-000000000002'),0::bigint,'later league membership grants no historical access');
update public.seasons set status = 'active' where id = '74000000-0000-4000-8000-000000000002';
select is((select count(*) from public.league_season_chat_participants where season_id = '74000000-0000-4000-8000-000000000002'),1::bigint,'new season captures its own roster');
select lives_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002','Player B','Hola')$$,'participant may write in an active season');
select throws_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001','Player A','Hola')$$,'P0001','season_chat_forbidden','other league members cannot write');
select throws_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Player A','Hola')$$,'P0001','season_chat_read_only','finished season rejects writes');
select ok(not has_table_privilege('authenticated','public.league_season_chat_messages','select'),'authenticated cannot read messages directly');
select ok(not has_table_privilege('authenticated','public.league_season_chat_participants','insert'),'authenticated cannot modify participant snapshots directly');
select * from finish();
rollback;
