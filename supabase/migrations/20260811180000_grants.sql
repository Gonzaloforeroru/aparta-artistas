-- Privilegios de tabla para los roles de PostgREST.
--
-- RLS decide QUE FILAS ve cada quien, pero antes de eso Postgres exige un
-- GRANT a nivel de tabla. En esta base local ninguna tabla de `public` tenia
-- SELECT para anon/authenticated -- ni siquiera `artists` --, asi que toda
-- consulta del catalogo moria con 42501 (insufficient_privilege) por mas que
-- las policies estuvieran bien escritas.
--
-- En un proyecto Supabase remoto esto ya viene puesto por los default
-- privileges, asi que alla la migracion es practicamente un no-op. Se deja
-- como migracion para que un `db reset` en local reproduzca el mismo estado.
--
-- Se conceden solo los verbos DML, no ALL: TRUNCATE y REFERENCES no tienen por
-- que estar al alcance del rol anonimo.

grant usage on schema public to anon, authenticated, service_role;

grant select                         on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Lo mismo para lo que se cree de aqui en adelante, para no repetir esto en
-- cada migracion nueva.
alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
