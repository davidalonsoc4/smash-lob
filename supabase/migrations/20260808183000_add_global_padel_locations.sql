create table if not exists public.padel_locations (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  name text not null,
  town text,
  address text,
  court_count integer,
  google_place_id text,
  google_place_name text,
  google_maps_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint padel_locations_name_not_blank check (length(trim(name)) > 0),
  constraint padel_locations_court_count_check check (
    court_count is null or court_count between 1 and 99
  )
);

create index if not exists padel_locations_name_idx
  on public.padel_locations (lower(name));

create index if not exists padel_locations_town_idx
  on public.padel_locations (lower(coalesce(town, '')));

alter table public.padel_locations enable row level security;

revoke all on table public.padel_locations from public, anon, authenticated;
grant all on table public.padel_locations to service_role;

comment on table public.padel_locations is
  'Catálogo global de clubes y ubicaciones de pádel. El navegador accede solo mediante APIs autenticadas service-role.';
