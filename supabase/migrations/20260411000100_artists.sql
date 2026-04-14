-- 002: Artists table with enums
create type public.artist_type as enum
  ('Cantante', 'DJ', 'Banda', 'Mariachi', 'Grupo Musical', 'Solista');

create type public.genre as enum
  ('Vallenato', 'Salsa', 'Electrónica', 'Pop', 'Rock',
   'Reggaeton', 'Tropical', 'Cumbia', 'Bachata');

create type public.artist_status as enum
  ('Pendiente', 'Aprobado', 'Rechazado');

create table public.artists (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  city             text not null,
  type             public.artist_type not null,
  genre            public.genre not null,
  phone            text not null,
  price            integer not null check (price >= 0),
  duration         text not null,
  photo            text,
  instagram        text,
  tiktok           text,
  youtube          text,
  spotify          text,
  status           public.artist_status not null default 'Pendiente',
  active           boolean not null default true,
  created_by       uuid references auth.users(id),
  invitation_token text,
  approved_by      uuid references auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.artists enable row level security;

create index artists_status_idx on public.artists(status);
create index artists_active_idx on public.artists(active);
create index artists_created_at_idx on public.artists(created_at desc);

create trigger artists_touch_updated_at
  before update on public.artists
  for each row execute function public.touch_updated_at();

-- Fix: Set search_path to empty for touch_updated_at function (security)
ALTER FUNCTION public.touch_updated_at SET search_path = '';
