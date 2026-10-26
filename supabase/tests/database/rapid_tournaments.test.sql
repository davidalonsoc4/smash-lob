begin;

select plan(43);

select ok((select relrowsecurity from pg_class where oid = 'public.rapid_tournaments'::regclass), 'tournaments enable RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.rapid_tournament_players'::regclass), 'players enable RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.rapid_tournament_rounds'::regclass), 'rounds enable RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.rapid_tournament_matches'::regclass), 'matches enable RLS');

select ok(not has_table_privilege('anon', 'public.rapid_tournaments', 'SELECT'), 'anon cannot query tournaments directly');
select ok(not has_table_privilege('authenticated', 'public.rapid_tournaments', 'SELECT'), 'authenticated cannot query tournaments directly');
select ok(not has_table_privilege('anon', 'public.rapid_tournament_players', 'SELECT'), 'anon cannot query players directly');
select ok(not has_table_privilege('authenticated', 'public.rapid_tournament_players', 'SELECT'), 'authenticated cannot query players directly');
select ok(not has_table_privilege('anon', 'public.rapid_tournament_rounds', 'SELECT'), 'anon cannot query rounds directly');
select ok(not has_table_privilege('authenticated', 'public.rapid_tournament_rounds', 'SELECT'), 'authenticated cannot query rounds directly');
select ok(not has_table_privilege('anon', 'public.rapid_tournament_matches', 'SELECT'), 'anon cannot query matches directly');
select ok(not has_table_privilege('authenticated', 'public.rapid_tournament_matches', 'SELECT'), 'authenticated cannot query matches directly');
select ok(has_function_privilege('service_role', 'public.create_rapid_tournament(uuid,text,text,timestamptz,text,text,text[])', 'EXECUTE'), 'service role can call the atomic create RPC');
select ok(not has_function_privilege('authenticated', 'public.create_rapid_tournament(uuid,text,text,timestamptz,text,text,text[])', 'EXECUTE'), 'authenticated cannot call the create RPC');

insert into public.app_users (id, email, display_name, first_name, last_name, profile_completed_at)
values ('10000000-0000-0000-0000-000000000012', 'rapid-tournament-test@smashandlob.invalid', 'Rapid Tournament Test', 'Rapid', 'Test', now());

create temporary table rapid_tournament_test_fixture (tournament_id uuid not null);
insert into rapid_tournament_test_fixture
select public.create_rapid_tournament(
  '10000000-0000-0000-0000-000000000012', 'Database test', '', '2099-10-17 07:00:00+00', 'Pista 1', 'Pista 2',
  array['A test','B test','C test','D test','E test','F test','G test','H test','I test','J test','K test','L test']
);

select is((select count(*)::integer from public.rapid_tournament_players p join rapid_tournament_test_fixture t using (tournament_id)), 12, 'creation persists exactly twelve manual players');
select is((select count(*)::integer from public.rapid_tournament_rounds r join rapid_tournament_test_fixture t using (tournament_id)), 6, 'creation persists six scheduled rounds');
select is((select count(*)::integer from public.rapid_tournament_matches m join rapid_tournament_test_fixture t using (tournament_id)), 12, 'creation persists twelve matches');

select ok(not public.record_rapid_tournament_result((select tournament_id from rapid_tournament_test_fixture), (select id from public.rapid_tournament_matches where tournament_id = (select tournament_id from rapid_tournament_test_fixture) limit 1), '10000000-0000-0000-0000-000000000012', 16, 12), 'draft scores are rejected');
select ok(not public.start_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000013'), 'another creator cannot start');
select ok(public.start_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'creator starts before recording results');
select ok((select started_at is not null from public.rapid_tournaments where id = (select tournament_id from rapid_tournament_test_fixture)), 'actual start is persisted');
select ok(not public.start_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'start cannot be repeated');
select ok(not public.record_rapid_tournament_result((select tournament_id from rapid_tournament_test_fixture), (select id from public.rapid_tournament_matches where tournament_id = (select tournament_id from rapid_tournament_test_fixture) limit 1), '10000000-0000-0000-0000-000000000013', 16, 12), 'another creator cannot record scores');
select ok(not public.reroll_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012', array['A test','B test','C test','D test','E test','F test','G test','H test','I test','J test','K test','L test']), 'draw is locked after start');
select ok(not public.finish_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'cannot finish without all scores');

do $$
declare
  v_tournament_id uuid := (select tournament_id from rapid_tournament_test_fixture);
  v_match record;
begin
  for v_match in select id from public.rapid_tournament_matches where tournament_id = v_tournament_id order by round_number, court_number loop
    perform public.record_rapid_tournament_result(v_tournament_id, v_match.id, '10000000-0000-0000-0000-000000000012', 16, 12);
  end loop;
end;
$$;

select is((select count(*)::integer from public.rapid_tournament_matches m join rapid_tournament_test_fixture t using (tournament_id) where score_a is not null and score_b is not null), 12, 'result RPC persists every score');
select ok(public.finish_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'creator can finish after all twelve results');
select is((select t.status from public.rapid_tournaments t join rapid_tournament_test_fixture f on f.tournament_id = t.id), 'finished', 'finished status persists');

select ok(not has_function_privilege('anon', 'public.restart_rapid_tournament_for_testing(uuid,uuid)', 'EXECUTE'), 'anon cannot restart');
select ok(not has_function_privilege('authenticated', 'public.restart_rapid_tournament_for_testing(uuid,uuid)', 'EXECUTE'), 'authenticated cannot restart directly');
select ok(not has_function_privilege('authenticated', 'public.delete_finished_rapid_tournament(uuid,uuid)', 'EXECUTE'), 'authenticated cannot delete directly');
select ok(not public.restart_rapid_tournament_for_testing((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000013'), 'another creator cannot restart');
select ok(not public.delete_finished_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000013'), 'another creator cannot delete');
create temporary table saved_fixture_matches as select * from public.rapid_tournament_matches where tournament_id = (select tournament_id from rapid_tournament_test_fixture);
select ok(public.restart_rapid_tournament_for_testing((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'creator restarts completed tournament');
select ok((select status = 'in_progress' and finished_at is null and started_at is not null from public.rapid_tournaments where id = (select tournament_id from rapid_tournament_test_fixture)), 'restart persists new active state and clears finish');
select is((select count(*)::integer from public.rapid_tournament_matches where tournament_id = (select tournament_id from rapid_tournament_test_fixture) and score_a is null and score_b is null), 12, 'all twelve results are cleared');
select is((select count(*)::integer from saved_fixture_matches s join public.rapid_tournament_matches m on m.id = s.id and m.round_id = s.round_id and m.team_a_one_id = s.team_a_one_id and m.team_a_two_id = s.team_a_two_id and m.team_b_one_id = s.team_b_one_id and m.team_b_two_id = s.team_b_two_id and m.court_number = s.court_number), 12, 'restart preserves all pairings, courts and round IDs');
select ok(not public.restart_rapid_tournament_for_testing((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'active tournament cannot restart');
select ok(not public.delete_finished_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'active tournament cannot be deleted');
update public.rapid_tournament_matches set score_a = 10, score_b = 15 where tournament_id = (select tournament_id from rapid_tournament_test_fixture);
select public.finish_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012');
select ok(public.delete_finished_rapid_tournament((select tournament_id from rapid_tournament_test_fixture), '10000000-0000-0000-0000-000000000012'), 'creator can delete after finishing again');
select is((select count(*)::integer from public.rapid_tournament_matches where tournament_id = (select tournament_id from rapid_tournament_test_fixture)), 0, 'delete cascades to matches');
select is((select count(*)::integer from public.rapid_tournament_players where tournament_id = (select tournament_id from rapid_tournament_test_fixture)), 0, 'delete cascades to players');
select is((select count(*)::integer from public.rapid_tournament_rounds where tournament_id = (select tournament_id from rapid_tournament_test_fixture)), 0, 'delete cascades to rounds');

select * from finish();
rollback;
