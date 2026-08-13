-- Smash & Lob v1.8.0 · mensajes estructurados y respuestas a propuestas
alter table public.match_chat_messages
  add column if not exists kind text not null default 'text',
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.match_chat_messages
  drop constraint if exists match_chat_messages_kind_check;
alter table public.match_chat_messages
  add constraint match_chat_messages_kind_check
  check (kind in ('text', 'date_proposal', 'location_proposal'));

create table if not exists public.match_chat_proposal_responses (
  message_id uuid not null references public.match_chat_messages(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  option_key text not null,
  response text not null,
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id, option_key),
  constraint match_chat_proposal_option_key_check check (char_length(btrim(option_key)) between 1 and 80),
  constraint match_chat_proposal_response_check check (response in ('available', 'unavailable'))
);

create index if not exists match_chat_proposal_responses_message_idx
  on public.match_chat_proposal_responses(message_id, updated_at desc);

alter table public.match_chat_proposal_responses enable row level security;
revoke all on table public.match_chat_proposal_responses from public, anon, authenticated;
grant all on table public.match_chat_proposal_responses to service_role;
