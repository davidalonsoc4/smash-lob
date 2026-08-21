create table if not exists public.personal_match_notification_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.personal_matches(id) on delete cascade,
  event_key text not null,
  created_at timestamptz not null default now(),
  constraint personal_match_notification_events_key_length_check
    check (char_length(event_key) between 1 and 80),
  constraint personal_match_notification_events_match_key_unique
    unique (match_id, event_key)
);

create index if not exists personal_match_notification_events_created_at_idx
  on public.personal_match_notification_events(created_at desc);

alter table public.personal_match_notification_events enable row level security;
revoke all on table public.personal_match_notification_events from public, anon, authenticated;
grant select, insert, delete on table public.personal_match_notification_events to service_role;
