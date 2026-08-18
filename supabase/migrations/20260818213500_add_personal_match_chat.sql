-- Smash & Lob v1.10.10 · chat privado para amistosos con cierre y retención
create table if not exists public.personal_match_chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.personal_matches(id) on delete cascade,
  sender_user_id uuid not null references public.app_users(id) on delete cascade,
  sender_display_name text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint personal_match_chat_messages_body_check
    check (char_length(btrim(body)) between 1 and 2000)
);

create index if not exists personal_match_chat_messages_match_created_idx
  on public.personal_match_chat_messages(match_id, created_at desc);

create index if not exists personal_match_chat_messages_sender_created_idx
  on public.personal_match_chat_messages(sender_user_id, created_at desc);

create table if not exists public.personal_match_chat_reads (
  match_id uuid not null references public.personal_matches(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists personal_match_chat_reads_user_idx
  on public.personal_match_chat_reads(user_id, last_read_at desc);

alter table public.personal_match_chat_messages enable row level security;
alter table public.personal_match_chat_reads enable row level security;

revoke all on table public.personal_match_chat_messages
  from public, anon, authenticated;
revoke all on table public.personal_match_chat_reads
  from public, anon, authenticated;

grant select, insert, update, delete on table public.personal_match_chat_messages
  to service_role;
grant select, insert, update, delete on table public.personal_match_chat_reads
  to service_role;

create or replace function public.cleanup_expired_personal_match_chat()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_messages integer := 0;
begin
  delete from public.personal_match_chat_reads r
  using public.personal_matches m
  where r.match_id = m.id
    and m.status = 'finished'
    and m.result_recorded_at is not null
    and m.result_recorded_at < now() - interval '2 months';

  delete from public.personal_match_chat_messages c
  using public.personal_matches m
  where c.match_id = m.id
    and m.status = 'finished'
    and m.result_recorded_at is not null
    and m.result_recorded_at < now() - interval '2 months';

  get diagnostics deleted_messages = row_count;
  return deleted_messages;
end;
$$;

revoke all on function public.cleanup_expired_personal_match_chat()
  from public, anon, authenticated;
grant execute on function public.cleanup_expired_personal_match_chat()
  to service_role;
