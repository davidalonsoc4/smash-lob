-- Scheduled publishing of tutorials.
-- publish_at: until that moment the tutorial behaves as a draft for everyone except its managers.
-- announce_on_publish: the admin asked for the automatic league-chat notice; it is sent when publish_at arrives.
alter table public.tutorial_videos
  add column if not exists publish_at timestamptz,
  add column if not exists announce_on_publish boolean not null default false;

create index if not exists tutorial_videos_due_announcement_idx
  on public.tutorial_videos (publish_at)
  where announce_on_publish;
