# Plan 02: Supabase Integration — Apparta

| Campo | Valor |
|---|---|
| **Estado** | Listo para ejecutar (después de Plan 01) |
| **Fecha** | 2026-04-11 |
| **Dependencia** | Plan 01 (Frontend Refresh) debe estar completo |
| **Stack** | `@supabase/ssr` ≥0.10.0 · `@supabase/supabase-js` ≥2.x · Supabase CLI |
| **Proyecto** | `lxzojlmnndvodcyulwvu` |

---

## 1. Objetivo

Conectar la UI (ya rediseñada en Plan 01) a Supabase: auth admin con Google OAuth, base de datos PostgreSQL con RLS, sistema de invitaciones con tokens únicos, importación CSV, y storage de fotos.

**Al terminar**: la app es 100% funcional con datos reales y persistencia.

---

## 2. Modelo (referencia rápida)

| Actor | Auth | Flujo |
|---|---|---|
| Admin | Google OAuth | Login → gestiona todo en `/admin/**` |
| Artista | Sin cuenta | Recibe link único → llena form → queda pendiente → admin aprueba |
| Restaurante | Sin cuenta | Browse `/catalogo` → contacta por WhatsApp |

**3 caminos para artistas**: (1) Admin crea manual → Aprobado, (2) CSV import → Aprobado, (3) Link invitación → Pendiente → Aprobación.

---

## 3. Schema SQL

### `profiles` (solo admins)

```sql
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'admin' check (role in ('admin')),
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
```

### `artists`

```sql
create type public.artist_type as enum
  ('Cantante','DJ','Banda','Mariachi','Grupo Musical','Solista');
create type public.genre as enum
  ('Vallenato','Salsa','Electrónica','Pop','Rock','Reggaeton','Tropical','Cumbia','Bachata');
create type public.artist_status as enum
  ('Pendiente','Aprobado','Rechazado');

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
  invitation_token text references public.invitations(token),
  approved_by      uuid references auth.users(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.artists enable row level security;
create index artists_status_idx on public.artists(status);
create index artists_active_idx on public.artists(active);
```

### `invitations`

```sql
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
```

### Triggers

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, display_name, avatar_url)
  values (new.id, 'admin',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger artists_touch before update on public.artists
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
```

### RLS

```sql
-- ARTISTS
create policy "anon_select_approved" on public.artists
  for select to anon using (status = 'Aprobado' and active = true);
create policy "anon_insert_pending" on public.artists
  for insert to anon with check (status = 'Pendiente');
create policy "admin_artists_full" on public.artists
  for all to authenticated using (true) with check (true);

-- INVITATIONS
create policy "anon_select_invitation" on public.invitations
  for select to anon using (true);
create policy "anon_update_used" on public.invitations
  for update to anon using (used_at is null and expires_at > now()) with check (used_at is not null);
create policy "admin_invitations_full" on public.invitations
  for all to authenticated using (true) with check (true);

-- PROFILES
create policy "admin_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "admin_update_own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
```

### Storage

```sql
insert into storage.buckets (id, name, public) values ('artist-photos', 'artist-photos', true);
create policy "anon_read_photos" on storage.objects for select to anon using (bucket_id = 'artist-photos');
create policy "admin_write_photos" on storage.objects for all to authenticated using (bucket_id = 'artist-photos');
```

---

## 4. Entrega por fases

### Phase 2.0 — Prerequisites

- [ ] Verificar si Next.js 16 usa `proxy.ts` o `middleware.ts` (leer `node_modules/next/`)
- [ ] `bun add @supabase/supabase-js @supabase/ssr nanoid`
- [ ] `bun add -d supabase`
- [ ] Crear `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] Crear `.env.example` (sin secrets)
- [ ] `.gitignore` → agregar `.env.local`
- [ ] `bunx supabase init` + `bunx supabase link --project-ref lxzojlmnndvodcyulwvu`

**Criterios**: CLI linked, env vars seteadas, `bun run build` ok.

---

### Phase 2.1 — Supabase Clients + Proxy

- [ ] Crear `src/lib/supabase/client.ts` (browser — `createBrowserClient`)
- [ ] Crear `src/lib/supabase/server.ts` (server — `createServerClient` con `await cookies()`)
- [ ] Crear `src/lib/supabase/admin.ts` (service role — con `typeof window !== 'undefined'` guard)
- [ ] Crear `src/lib/supabase/proxy.ts` (helper `updateSession` con `getClaims()`)
- [ ] Crear `src/proxy.ts` (o `src/middleware.ts`) con matcher que excluye: `/login`, `/registro/**`, `/catalogo`, `/auth/**`, `/_next/**`, assets
- [ ] Verificar `bun run dev` → proxy corre sin errores en consola

**Criterios**: Clients tipados, proxy funcional, `bun run build` ok.

---

### Phase 2.2 — Schema + Migraciones

- [ ] Crear `supabase/migrations/001_profiles.sql`
- [ ] Crear `supabase/migrations/002_artists.sql` (enums + tabla + índices)
- [ ] Crear `supabase/migrations/003_invitations.sql`
- [ ] Crear `supabase/migrations/004_rls.sql`
- [ ] Crear `supabase/migrations/005_storage.sql`
- [ ] `bunx supabase db push`
- [ ] Crear `supabase/seed.sql` con 5 artistas mock
- [ ] `bunx supabase gen types typescript --linked > src/lib/supabase/database-generated.types.ts`
- [ ] Crear `src/lib/supabase/database.types.ts` con helpers `Tables<T>`, `Enums<T>`
- [ ] Tipar clients con `<Database>`

**Criterios**: Studio muestra 3 tablas, RLS activo, seed cargado, types generados, `bun run build` ok.

---

### Phase 2.3 — Admin Auth (Google OAuth)

- [ ] Google Cloud Console → OAuth 2.0 Client ID → Web app
- [ ] Authorized redirect URIs: `https://lxzojlmnndvodcyulwvu.supabase.co/auth/v1/callback`
- [ ] Supabase → Providers → Google → activar + credenciales
- [ ] Supabase → URL Configuration → Redirect URLs: `http://localhost:3000/auth/callback`
- [ ] Crear `src/app/login/actions.ts`: `signInWithGoogle()` (Server Action con `signInWithOAuth`) + `signOut()`
- [ ] Conectar `src/components/google-sign-in-button.tsx` (creado en Plan 01) al Server Action
- [ ] Crear `src/app/auth/callback/route.ts`: PKCE exchange → redirect a `/admin`
- [ ] Modificar `src/app/admin/layout.tsx`: `await createClient()` → `getUser()` → redirect si no es admin
- [ ] Modificar `src/components/nav-user.tsx`: user real por prop + conectar "Cerrar Sesión" a `signOut`
- [ ] Modificar `src/components/app-sidebar.tsx`: recibir user por prop
- [ ] Modificar `src/app/page.tsx`: redirect basado en sesión
- [ ] Crear primer admin: Google signup → SQL en Studio: `update profiles set role = 'admin' where id = '...'`

**Criterios**: Login Google → `/admin`. Logout → `/login`. Sin sesión → redirect. Nav muestra user real.

---

### Phase 2.4 — Replace Mock Data

- [ ] Limpiar `src/lib/data.ts`: borrar `artists[]`, dejar tipos + `formatPrice` + enum arrays
- [ ] Crear `src/lib/queries/artists.ts`: `getApprovedArtists`, `getAllArtists`, `getPendingArtists`, `getArtistById`, `getArtistStats`, `getPendingCount`
- [ ] Crear `src/app/admin/actions.ts`: `createArtist`, `updateArtist`, `deleteArtist`, `toggleActive`, `approveArtist`, `rejectArtist`
- [ ] Convertir `/catalogo` → Server Component + client hijo para filtros
- [ ] Convertir `/admin/page.tsx` → Server Component + stats reales
- [ ] Convertir `/admin/lista` → Server Component + CRUD actions
- [ ] Convertir `/admin/crear` → Server Actions para insert/update
- [ ] Convertir `/admin/aprobaciones` → Server Component + approve/reject actions
- [ ] Convertir `/admin/metricas` → Server Component wrapper + client charts
- [ ] Sidebar badge dinámico con `getPendingCount()`

**Criterios**: Zero imports de `artists[]` mock. CRUD persiste en DB. `bun run build` ok.

---

### Phase 2.5 — Invitaciones + `/registro/[token]`

- [ ] `bun add nanoid` (si no se hizo en 2.0)
- [ ] Agregar a `src/app/admin/actions.ts`: `createInvitation(email)` → genera nanoid(21), inserta en `invitations`, retorna link
- [ ] Conectar `/admin/invitaciones/page.tsx` (shell de Plan 01) al Server Action
  - Form email → `createInvitation` → mostrar link copiable
  - Tabla: query real a `invitations` con estado calculado (pendiente/usado/expirado)
- [ ] Conectar `/registro/[token]/page.tsx` (shell de Plan 01) a Supabase:
  - Server Component: valida token server-side (exists + not expired + not used)
  - Si inválido → `notFound()` (404)
  - Si válido → renderiza form
  - Submit → Server Action (anon): insert artist (status='Pendiente') + update invitations (used_at=now)
  - Redirect a `/registro/exito`
- [ ] Agregar botón "Invitar Artista" en `/admin/lista` que navega a `/admin/invitaciones`

**Criterios**: Admin genera link → copia → artista abre → llena → submit → aparece en aprobaciones → admin aprueba → aparece en catálogo. Token reusado → 404. Expirado → 404.

---

### Phase 2.6 — CSV Import

- [ ] Conectar `/admin/importar/page.tsx` (shell de Plan 01) a Supabase:
  - Client-side CSV parse (FileReader + split — sin dependencias)
  - Preview table con validación: verificar enums (tipo, género), campos requeridos
  - Rows válidas = verde, inválidas = rojo con tooltip del error
- [ ] Crear Server Action `importArtists(validRows[])`:
  - Bulk insert: `supabase.from('artists').insert(rows)` con `status='Aprobado'`, `created_by=admin_id`
  - Retorna conteo success/errors
- [ ] Crear `public/templates/artistas-template.csv` descargable
- [ ] Agregar botón "Importar CSV" en `/admin/lista`

**Criterios**: CSV 10 artistas → preview → import → 10 filas status=Aprobado en DB → aparecen en catálogo. CSV con errores → rows rojas, no se importan.

---

### Phase 2.7 — Storage (fotos)

- [ ] Aplicar migración `005_storage.sql` (bucket + RLS)
- [ ] Crear `src/lib/supabase/storage.ts`: `uploadArtistPhoto(file)`, `getPublicUrl(path)`
- [ ] Conectar upload en `/registro/[token]` form → sube a Storage → guarda URL en `artists.photo`
- [ ] Conectar upload en `/admin/crear` form → misma lógica
- [ ] Configurar `next.config.ts`: allowlist dominio `*.supabase.co` para `<Image>`

**Criterios**: Foto subida → almacenada → renderiza en catálogo y admin. Anon no puede subir directo (solo via Server Action).

---

### Phase 2.8 — Production Hardening

- [ ] Configurar Gmail SMTP en Supabase (Settings → Auth → SMTP) para emails admin
- [ ] Setear Site URL + Redirect URLs para dominio de producción
- [ ] Env vars en host (Vercel/Netlify)
- [ ] `export const dynamic = 'force-dynamic'` en páginas con Supabase
- [ ] Smoke test RLS: anon no puede ver no-aprobados, anon no puede insert status≠Pendiente
- [ ] Actualizar `AGENTS.md` con sección "Supabase"
- [ ] Verificar dark/light mode en production build
- [ ] Commitear `.env.example`

**Criterios**: Production build sin errores. RLS verificado. Admin flow end-to-end funcional.

---

## 5. Riesgos

| Riesgo | Mitigación |
|---|---|
| Next.js 16 `proxy.ts` vs `middleware.ts` | Phase 2.0 verifica |
| RLS permisivo | Phase 2.8 smoke test |
| Token predecible | `nanoid(21)` — criptográficamente random |
| Service role key filtrada | Guard en `admin.ts` |
| CSV malformado | Validación client-side |
| Google OAuth callback falla en Vercel | Wildcard `*.vercel.app` en redirect URLs |

---

## 6. Referencias

- [Supabase SSR + Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [supabase/examples/auth/nextjs @ e95f1cc](https://github.com/supabase/supabase/tree/e95f1cc67c6a15910e1d85c709542100ef650374/examples/auth/nextjs)
- Proyecto: `lxzojlmnndvodcyulwvu`

---

**Fin del plan.**
