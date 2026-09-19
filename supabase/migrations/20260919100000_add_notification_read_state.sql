create table if not exists public.notification_reads (
  user_id uuid not null references public.app_users(id) on delete cascade,
  event_id uuid not null references public.activity_events(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists notification_reads_user_read_at_idx
  on public.notification_reads (user_id, read_at desc);

alter table public.notification_reads enable row level security;

drop policy if exists notification_reads_service_only on public.notification_reads;
create policy notification_reads_service_only
  on public.notification_reads
  for all to service_role
  using (true) with check (true);

revoke all on public.notification_reads from anon, authenticated;
grant all on public.notification_reads to service_role;
