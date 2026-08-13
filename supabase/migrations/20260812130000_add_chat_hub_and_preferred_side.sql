-- Smash & Lob v1.8.0 · bandeja de chats y posición preferida
alter table public.app_users add column if not exists preferred_side text;
alter table public.app_users drop constraint if exists app_users_preferred_side_check;
alter table public.app_users add constraint app_users_preferred_side_check check (preferred_side is null or preferred_side in ('drive','reves','versatile'));
create index if not exists match_chat_reads_user_idx on public.match_chat_reads(user_id, last_read_at desc);
