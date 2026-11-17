begin;
select plan(19);

insert into public.app_users (id,email,display_name) values
  ('75000000-0000-4000-8000-000000000001','chat-media-creator@example.invalid','Creator'),
  ('75000000-0000-4000-8000-000000000002','chat-media-player@example.invalid','Player');
insert into public.leagues (id,slug,name,invite_code,created_by_user_id) values
  ('76000000-0000-4000-8000-000000000001','chat-media-test','Chat media','CHATMEDIATEST','75000000-0000-4000-8000-000000000001');
insert into public.players (id,league_id,slug,display_name,avatar_initials) values
  ('77000000-0000-4000-8000-000000000001','76000000-0000-4000-8000-000000000001','chat-media-creator','Creator','CR'),
  ('77000000-0000-4000-8000-000000000002','76000000-0000-4000-8000-000000000001','chat-media-player','Player','PL');
insert into public.league_memberships (user_id,league_id,player_id,role) values
  ('75000000-0000-4000-8000-000000000001','76000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000001','creator'),
  ('75000000-0000-4000-8000-000000000002','76000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000002','player');
insert into public.seasons (id,league_id,name,status,total_rounds) values
  ('78000000-0000-4000-8000-000000000001','76000000-0000-4000-8000-000000000001','Season 1','active',1);
insert into public.season_players (season_id,player_id) values
  ('78000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000001'),
  ('78000000-0000-4000-8000-000000000001','77000000-0000-4000-8000-000000000002');

select lives_ok($$select public.send_league_season_chat_media_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','Tutorial 1','video','78000000-0000-4000-8000-000000000001/79000000-0000-4000-8000-000000000001.mp4')$$,'the league creator can publish a video');
select is((select media_kind || ':' || body from public.league_season_chat_messages where season_id = '78000000-0000-4000-8000-000000000001' and media_path is not null),'video:Tutorial 1','the media message keeps kind and caption');
select throws_ok($$select public.send_league_season_chat_media_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000002','Player','Hola','video','78000000-0000-4000-8000-000000000001/79000000-0000-4000-8000-000000000002.mp4')$$,'P0001','season_chat_media_forbidden','a normal participant cannot publish media');
select throws_ok($$select public.send_league_season_chat_media_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','Hola','video','78000000-0000-4000-8000-0000000000ff/79000000-0000-4000-8000-000000000003.mp4')$$,'P0001','season_chat_invalid_media','a path from another season is rejected');
select throws_ok($$select public.send_league_season_chat_media_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','Hola','audio','78000000-0000-4000-8000-000000000001/79000000-0000-4000-8000-000000000004.mp4')$$,'P0001','season_chat_invalid_media','an unknown media kind is rejected');
select lives_ok($$select public.send_league_season_chat_media_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','   ','video','78000000-0000-4000-8000-000000000001/79000000-0000-4000-8000-000000000005.mp4')$$,'a media message may go without text');
select is((select count(*) from public.league_season_chat_messages where media_path like '%79000000-0000-4000-8000-000000000005.mp4' and body = ''),1::bigint,'the empty caption is stored as an empty body');
select throws_ok($$insert into public.league_season_chat_messages (season_id,sender_user_id,sender_display_name,body) values ('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','   ')$$,'23514',null,'a text-only message still needs text');
select ok(not has_function_privilege('authenticated','public.send_league_season_chat_media_message(uuid,uuid,text,text,text,text,uuid,boolean)','execute'),'authenticated cannot execute the media function');
select ok(has_function_privilege('service_role','public.send_league_season_chat_media_message(uuid,uuid,text,text,text,text,uuid,boolean)','execute'),'service_role can execute the media function');
select is((select public from storage.buckets where id = 'league-chat-media'),false,'the media bucket is private');

select lives_ok($$select public.send_league_season_chat_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000002','Player','Respuesta',(select id from public.league_season_chat_messages where body = 'Tutorial 1'))$$,'a participant can reply to a message of the same season');
select is((select count(*) from public.league_season_chat_messages where body = 'Respuesta' and reply_to_id is not null),1::bigint,'the reply keeps its quoted message');
select throws_ok($$select public.send_league_season_chat_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000002','Player','Hola','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')$$,'P0001','season_chat_invalid_reply','a reply to an unknown message is rejected');
select ok(not has_function_privilege('authenticated','public.send_league_season_chat_message(uuid,uuid,text,text,uuid,boolean)','execute'),'authenticated cannot execute the reply-aware send function');
select lives_ok($$delete from public.league_season_chat_messages where body = 'Tutorial 1'$$,'deleting the quoted message keeps the reply');

select lives_ok($$select public.send_league_season_chat_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000001','Creator','Novedad importante',null,true)$$,'the creator can post an announcement');
select is((select is_announcement from public.league_season_chat_messages where body = 'Novedad importante'),true,'the announcement is flagged');
select throws_ok($$select public.send_league_season_chat_message('78000000-0000-4000-8000-000000000001','75000000-0000-4000-8000-000000000002','Player','Intento',null,true)$$,'P0001','season_chat_announcement_forbidden','a normal participant cannot post an announcement');

select * from finish();
rollback;
