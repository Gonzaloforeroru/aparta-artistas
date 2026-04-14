-- 003: Invitations table (single-use tokens, 24h expiry)
create table public.invitations (
  token        text primary key,
  email        text not null,
  created_by   uuid references auth.users(id) not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '24 hours'),
  used_at      timestamptz
);

alter table public.invitations enable row level security;

create index invitations_expires_at_idx on public.invitations(expires_at);
create index invitations_email_idx on public.invitations(email);

-- Add FK from artists to invitations (deferred because artists was created first)
alter table public.artists
  add constraint artists_invitation_token_fkey
  foreign key (invitation_token) references public.invitations(token);
