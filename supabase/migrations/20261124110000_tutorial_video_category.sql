-- Tipo de vídeo: 'app' (tutorial de la aplicación, con su audiencia) o 'social' (material para redes sociales,
-- que solo ve quien gestiona los tutoriales, sea cual sea su audiencia).
alter table public.tutorial_videos
  add column if not exists category text not null default 'app'
  check (category in ('app', 'social'));
