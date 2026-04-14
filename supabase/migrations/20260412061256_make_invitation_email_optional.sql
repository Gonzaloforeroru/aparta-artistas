-- Make email optional on invitations (admin just generates a link)
alter table public.invitations alter column email drop not null;
