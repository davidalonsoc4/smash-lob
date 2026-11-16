-- Public read-only share links for friendly (personal) matches.
--
-- A link only exposes a sanitized, read-only view of one match. The table is
-- reachable exclusively through the service role (server routes); browser
-- roles get no grants and RLS stays enabled with no policies.

create table if not exists public.personal_match_share_links (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.personal_matches(id) on delete cascade,
  code text not null,
  is_active boolean not null default true,
  created_by_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint personal_match_share_links_code_key unique (code),
  constraint personal_match_share_links_code_format_check
    check (code ~ '^[A-Z0-9](?:[A-Z0-9-]{2,62}[A-Z0-9])?$')
);

-- At most one active link per match; the server reuses it on every request.
create unique index if not exists personal_match_share_links_one_active_per_match_idx
  on public.personal_match_share_links(match_id)
  where is_active;

alter table public.personal_match_share_links enable row level security;

revoke all on table public.personal_match_share_links from public, anon, authenticated;
grant select, insert, update, delete on table public.personal_match_share_links to service_role;
