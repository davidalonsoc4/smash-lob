-- Vídeos tutoriales dentro de la app. Los gestiona el superusuario de la aplicación.
-- audience: 'draft' (solo lo ve quien gestiona), 'public' (cualquier persona con sesión) o
-- 'leagues' (solo miembros de las ligas elegidas en tutorial_video_leagues).
-- Los archivos viven en un bucket PRIVADO: no hay políticas para anon/authenticated y el servidor entrega
-- enlaces firmados de corta duración solo a quien tiene acceso al tutorial.

create table public.tutorial_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  position integer not null default 0,
  audience text not null default 'draft' check (audience in ('draft', 'public', 'leagues')),
  video_path text not null check (char_length(video_path) between 1 and 300),
  poster_path text check (poster_path is null or char_length(poster_path) between 1 and 300),
  width integer check (width is null or width between 1 and 20000),
  height integer check (height is null or height between 1 and 20000),
  duration_ms integer check (duration_ms is null or duration_ms between 0 and 3600000),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutorial_video_leagues (
  tutorial_id uuid not null references public.tutorial_videos(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  primary key (tutorial_id, league_id)
);

create table public.tutorial_video_views (
  tutorial_id uuid not null references public.tutorial_videos(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (tutorial_id, user_id)
);

create index tutorial_videos_order_idx on public.tutorial_videos (position, created_at);
create index tutorial_video_leagues_league_idx on public.tutorial_video_leagues (league_id);
create index tutorial_video_views_user_idx on public.tutorial_video_views (user_id);

alter table public.tutorial_videos enable row level security;
alter table public.tutorial_video_leagues enable row level security;
alter table public.tutorial_video_views enable row level security;
revoke all on public.tutorial_videos, public.tutorial_video_leagues, public.tutorial_video_views
  from public, anon, authenticated;
grant all on public.tutorial_videos, public.tutorial_video_leagues, public.tutorial_video_views to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutorial-videos',
  'tutorial-videos',
  false,
  52428800,
  array['video/mp4', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
