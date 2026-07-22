-- Smash & Lob v0.12.0
-- Incidencias de partido, comunicados y soporte de gestión avanzada.

alter table public.matches
  add column if not exists incident_type text,
  add column if not exists incident_status text,
  add column if not exists incident_reason text,
  add column if not exists incident_notes text,
  add column if not exists incident_reported_by_user_id uuid references public.app_users(id) on delete set null,
  add column if not exists incident_resolved_by_user_id uuid references public.app_users(id) on delete set null,
  add column if not exists incident_created_at timestamptz,
  add column if not exists incident_resolved_at timestamptz,
  add column if not exists resolution_type text,
  add column if not exists ranking_counts boolean not null default true;

alter table public.matches
  drop constraint if exists matches_incident_type_check,
  add constraint matches_incident_type_check
    check (
      incident_type is null or incident_type in (
        'injury',
        'no_show',
        'cancelled',
        'disputed',
        'other'
      )
    ),
  drop constraint if exists matches_incident_status_check,
  add constraint matches_incident_status_check
    check (incident_status is null or incident_status in ('open', 'resolved')),
  drop constraint if exists matches_resolution_type_check,
  add constraint matches_resolution_type_check
    check (
      resolution_type is null or resolution_type in (
        'played',
        'postponed',
        'cancelled',
        'no_show',
        'abandoned',
        'administrative'
      )
    );

create index if not exists matches_open_incident_idx
  on public.matches (league_id, season_id, incident_status)
  where incident_status = 'open';

create table if not exists public.league_announcements (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  created_by_user_id uuid references public.app_users(id) on delete set null,
  title text not null,
  body text not null,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_announcements_title_length_check
    check (char_length(btrim(title)) between 1 and 100),
  constraint league_announcements_body_length_check
    check (char_length(btrim(body)) between 1 and 1500),
  constraint league_announcements_expiry_check
    check (expires_at is null or expires_at > published_at)
);

create index if not exists league_announcements_league_published_idx
  on public.league_announcements (league_id, published_at desc);

create index if not exists league_announcements_visible_idx
  on public.league_announcements (league_id, pinned desc, published_at desc);

alter table public.league_announcements enable row level security;
revoke all on table public.league_announcements from public, anon, authenticated;
grant all on table public.league_announcements to service_role;
