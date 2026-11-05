-- Preserve the existing account-deletion behaviour used by match chat.
alter table public.league_season_chat_messages
  drop constraint league_season_chat_messages_sender_user_id_fkey;
alter table public.league_season_chat_messages
  add constraint league_season_chat_messages_sender_user_id_fkey
  foreign key (sender_user_id) references public.app_users(id) on delete cascade;
