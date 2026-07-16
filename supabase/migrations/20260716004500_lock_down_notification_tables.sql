revoke all on table public.notification_preferences from anon;
revoke all on table public.notification_preferences from authenticated;
grant all on table public.notification_preferences to service_role;

revoke all on table public.push_subscriptions from anon;
revoke all on table public.push_subscriptions from authenticated;
grant all on table public.push_subscriptions to service_role;

alter table only public.push_subscriptions
  drop constraint if exists push_subscriptions_endpoint_key;

alter table only public.push_subscriptions
  add constraint push_subscriptions_league_id_endpoint_key
  unique (league_id, endpoint);
