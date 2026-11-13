begin;
select plan(19);

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
select is((select count(*) from public.league_season_chat_participants),1::bigint,'preseason captures linked roster players');
select lives_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Player A','Hola pretemporada')$$,'registered participant can write before activation');
delete from public.season_players where season_id = '74000000-0000-4000-8000-000000000001' and player_id = '73000000-0000-4000-8000-000000000001';
select throws_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Player A','Hola')$$,'P0001','season_chat_forbidden','removed preseason player cannot write');
update public.seasons set status = 'active' where id = '74000000-0000-4000-8000-000000000001';
select is((select count(*) from public.league_season_chat_participants),0::bigint,'activation removes stale preseason participants');
insert into public.season_players (season_id,player_id) values ('74000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000001');
select is((select count(*) from public.league_season_chat_participants),1::bigint,'active season captures newly registered players');
update public.seasons set status = 'finished' where id = '74000000-0000-4000-8000-000000000001';
insert into public.league_memberships (user_id,league_id,player_id) values
  ('71000000-0000-4000-8000-000000000002','72000000-0000-4000-8000-000000000001','73000000-0000-4000-8000-000000000002');
select is((select count(*) from public.league_season_chat_participants where season_id = '74000000-0000-4000-8000-000000000001' and user_id = '71000000-0000-4000-8000-000000000002'),0::bigint,'later league membership grants no historical access');
update public.seasons set status = 'active' where id = '74000000-0000-4000-8000-000000000002';
select is((select count(*) from public.league_season_chat_participants where season_id = '74000000-0000-4000-8000-000000000002'),1::bigint,'new season captures its own roster');
select lives_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002','Player B','Hola')$$,'participant may write in an active season');
select throws_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001','Player A','Hola')$$,'P0001','season_chat_forbidden','other league members cannot write');
select throws_ok($$select public.send_league_season_chat_message('74000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000001','Player A','Hola')$$,'P0001','season_chat_read_only','finished season rejects writes');
select ok(not has_table_privilege('authenticated','public.league_season_chat_messages','select'),'authenticated cannot read messages directly');
select ok(not has_table_privilege('authenticated','public.league_season_chat_participants','insert'),'authenticated cannot modify participant snapshots directly');
select lives_ok($sql$select public.change_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002',(select id from public.league_season_chat_messages where body = 'Hola'),'Texto nuevo')$sql$,'the author can edit their message');
select is((select count(*) from public.league_season_chat_messages where body = 'Texto nuevo' and edited_at is not null),1::bigint,'the edit timestamp is stored');
insert into public.league_season_chat_participants(season_id,user_id) values ('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001');
select throws_ok($sql$select public.change_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000001',(select id from public.league_season_chat_messages where body = 'Texto nuevo'),null)$sql$,'P0001','season_chat_message_not_found','another participant cannot delete the message');
select lives_ok($sql$select public.change_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002',(select id from public.league_season_chat_messages where body = 'Texto nuevo'),null)$sql$,'the author can delete the text');
select is((select count(*) from public.league_season_chat_messages where body = '' and deleted_at is not null),1::bigint,'only the deletion marker remains');
select is((select (public.change_league_season_chat_message('74000000-0000-4000-8000-000000000002','71000000-0000-4000-8000-000000000002',(select id from public.league_season_chat_messages where deleted_at is not null),'Resurrect')).body),''::text,'editing a deleted message cannot restore it');
select ok(not has_function_privilege('authenticated','public.change_league_season_chat_message(uuid,uuid,uuid,text)','execute'),'clients cannot invoke the mutation directly');
select * from finish();
rollback;
