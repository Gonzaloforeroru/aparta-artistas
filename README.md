# Apparta — Catálogo de Artistas

Plataforma web para descubrir, gestionar y contratar artistas musicales (cantantes, DJs, bandas, mariachis, etc.) en Colombia. Incluye un **catálogo público**, un **panel de administración** con flujo de aprobación, y un **portal de autoservicio para artistas**.

**Producción:** [https://aparta-artistas-brown.vercel.app](https://aparta-artistas-brown.vercel.app)

---

## Tabla de contenido

- [Stack tecnológico](#stack-tecnológico)
- [Características por rol](#características-por-rol)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Configuración local](#configuración-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [Configuración de autenticación](#configuración-de-autenticación)
- [Despliegue (Vercel)](#despliegue-vercel)
- [Scripts disponibles](#scripts-disponibles)
- [Arquitectura y modelo de datos](#arquitectura-y-modelo-de-datos)
- [Flujo de aprobación de artistas](#flujo-de-aprobación-de-artistas)

---

## Stack tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | [Next.js 16.2](https://nextjs.org) (App Router + Turbopack) |
| UI | React 19.2, TypeScript 5 |
| Estilos | Tailwind CSS v4, `tw-animate-css` |
| Componentes | Radix UI, Base UI, shadcn, HugeIcons |
| Backend / DB | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage) |
| Gráficas | Recharts (panel de métricas) |
| Temas | `next-themes` (modo claro/oscuro) |
| Notificaciones | Sonner (toasts) |
| Gestor de paquetes | [Bun](https://bun.sh) |
| Testing | Vitest, Testing Library, happy-dom |
| Hosting | Vercel |

---

## Características por rol

### Visitante (público, sin login)
- Explorar el **catálogo** de artistas aprobados
- Filtrar por ciudad, tipo de artista, género, duración y precio
- Ver perfil de cada artista (foto, redes sociales, sitio web, tarifa)

### Artista (autenticado)
- Registro con correo y contraseña
- Completar y editar su perfil (foto, ciudad, género, tarifa, redes)
- Gestionar su cuenta (cambiar correo y contraseña)
- Su perfil queda **Pendiente** hasta que el admin lo apruebe

### Administrador (correo configurado en `ADMIN_EMAIL`)
- **Aprobaciones**: aprobar o rechazar artistas pendientes
- **Lista**: ver, editar y administrar todos los artistas
- **Crear**: dar de alta artistas manualmente
- **Importar**: carga masiva de artistas vía CSV
- **Invitaciones**: generar enlaces de invitación de un solo uso (24 h)
- **Métricas**: dashboard con estadísticas y gráficas

---

## Estructura del proyecto

```
aparta-artistas/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Panel de administración
│   │   │   ├── aprobaciones/     # Aprobar/rechazar artistas
│   │   │   ├── crear/            # Alta manual de artistas
│   │   │   ├── importar/         # Importación CSV
│   │   │   ├── invitaciones/     # Enlaces de invitación
│   │   │   ├── lista/            # Listado y edición
│   │   │   ├── metricas/         # Dashboard de métricas
│   │   │   └── actions.ts        # Server Actions del admin
│   │   ├── artista/              # Portal del artista
│   │   │   ├── completar/        # Completar perfil
│   │   │   ├── cuenta/           # Ajustes de cuenta (correo/contraseña)
│   │   │   ├── editar/           # Editar perfil
│   │   │   └── actions.ts        # Server Actions del artista
│   │   ├── auth/                 # Rutas de autenticación
│   │   │   ├── callback/         # Intercambio de código (OAuth/PKCE)
│   │   │   └── confirm/          # Confirmación por token_hash
│   │   ├── catalogo/             # Catálogo público
│   │   ├── login/                # Inicio de sesión
│   │   ├── registro/             # Registro (+ flujo por token)
│   │   ├── layout.tsx            # Layout raíz
│   │   └── page.tsx              # Home
│   ├── components/               # Componentes UI (sidebar, nav, ui/, etc.)
│   ├── lib/
│   │   ├── auth/                 # Lógica post-login (roles, matching)
│   │   ├── queries/              # Consultas a la base de datos
│   │   ├── supabase/             # Clientes Supabase (client/server/admin/storage)
│   │   ├── data.ts              # Tipos y constantes (ciudades, géneros, etc.)
│   │   └── utils.ts             # Utilidades
│   └── proxy.ts                  # Middleware (refresco de sesión)
├── supabase/
│   ├── migrations/               # Migraciones SQL (esquema, RLS, storage)
│   ├── reset_and_migrate.sql     # Script de reset + migración completa
│   └── config.toml               # Configuración del proyecto Supabase
├── next.config.ts                # Config Next.js (incluye hosts de imágenes)
└── package.json
```

---

## Requisitos previos

- [Bun](https://bun.sh) (gestor de paquetes y runtime)
- Una cuenta de [Supabase](https://supabase.com) con un proyecto creado
- (Opcional) [Vercel](https://vercel.com) para despliegue

---

## Configuración local

```bash
# 1. Clonar el repositorio
git clone https://github.com/ElirPereza/aparta-artistas.git
cd aparta-artistas

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno (ver sección siguiente)
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Levantar el servidor de desarrollo
bun run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

Crea un archivo `.env.local` con las siguientes variables (plantilla en `.env.example`):

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (ej. `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (service role) — **secreta**, solo backend |
| `ADMIN_EMAIL` | Correo del administrador. Quien inicie sesión con este correo obtiene rol admin |
| `NEXT_PUBLIC_SITE_URL` | URL base de la app (local: `http://localhost:3000`, prod: dominio de Vercel) |

> Las claves de Supabase se obtienen en **Supabase Dashboard → Project Settings → API**.

> ⚠️ Nunca subas `.env.local` al repositorio (ya está en `.gitignore`).

---

## Base de datos (Supabase)

El esquema completo está en `supabase/migrations/`. Para montar la base de datos en un proyecto **nuevo y vacío**:

1. Ve a **Supabase Dashboard → SQL Editor → New query**
2. Copia y ejecuta el contenido de **`supabase/reset_and_migrate.sql`**

Este script crea de una sola vez:

- **Tablas**: `profiles`, `artists`, `invitations`
- **Tipos enum**: `artist_type`, `genre`, `artist_status`
- **Políticas RLS** (Row Level Security) por rol
- **Triggers**: creación automática de perfil al registrarse, `updated_at` automático
- **Storage bucket** `artist-photos` (público) con sus políticas
- **Cron job** (`pg_cron`) que limpia usuarios sin confirmar cada 24 h

> El script es **idempotente con reset**: borra cualquier estado previo y recrea todo limpio. Úsalo solo en proyectos sin datos importantes.

### Configuración de imágenes

El componente `<Image>` de Next.js solo carga imágenes de hosts autorizados. Si cambias de proyecto Supabase, actualiza el hostname en `next.config.ts`:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "TU-PROYECTO.supabase.co" }, // ← tu proyecto
  ],
}
```

---

## Configuración de autenticación

En **Supabase Dashboard → Authentication**:

1. **URL Configuration**
   - **Site URL**: tu dominio de producción (ej. `https://aparta-artistas-brown.vercel.app`) — con `https://`
   - **Redirect URLs**: agrega `https://tu-dominio.vercel.app/**`

2. **Sign In / Providers → Email**
   - Habilita el proveedor de correo
   - **Confirm email**: actualmente **desactivado** para que el registro sea inmediato. Si lo activas, necesitarás un SMTP propio (ej. Resend) para evitar el límite de correos del plan gratuito.

> El proyecto incluye dos rutas de confirmación: `/auth/callback` (flujo PKCE con `code`) y `/auth/confirm` (flujo `token_hash`, más robusto entre dispositivos). Para usar `/auth/confirm`, configura la plantilla de correo apuntando a `{SITE_URL}/auth/confirm?token_hash={{.TokenHash}}&type=signup` (requiere SMTP propio).

---

## Despliegue (Vercel)

1. Conecta el repositorio a Vercel (**Add New Project → Import**)
2. Configuración del build:
   - **Framework**: Next.js (autodetectado)
   - **Build Command**: `bun run build`
   - **Install Command**: `bun install`
3. Agrega las 5 variables de entorno en **Settings → Environment Variables** (Production + Preview)
4. **Deploy**

Cada push a `main` redespliega automáticamente. También puedes desplegar desde la CLI:

```bash
vercel --prod
```

---

## Scripts disponibles

```bash
bun run dev        # Servidor de desarrollo (Turbopack)
bun run build      # Build de producción
bun run start      # Servir el build de producción
bun run lint       # ESLint
bun run test       # Tests en modo watch (Vitest)
bun run test:run   # Tests una sola vez
```

---

## Arquitectura y modelo de datos

### Tablas principales

**`profiles`** — perfil de cada usuario autenticado
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | FK a `auth.users` |
| `role` | text | `admin` o `artist` (default `artist`) |
| `display_name`, `avatar_url` | text | Datos básicos |

**`artists`** — registros de artistas
| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | uuid | PK |
| `name`, `city`, `phone` | text | Datos básicos |
| `type` | enum | Cantante, DJ, Banda, Mariachi, Grupo Musical, Solista |
| `genre` | enum | Vallenato, Salsa, Electrónica, Pop, Rock, Reggaeton, Tropical, Cumbia, Bachata |
| `price` | integer | Tarifa en COP |
| `duration` | text | Duración del show |
| `photo` | text | URL pública en Storage |
| `instagram`, `tiktok`, `youtube`, `spotify`, `website` | text | Enlaces |
| `status` | enum | **Pendiente**, Aprobado, Rechazado |
| `active` | boolean | Visible en catálogo |
| `user_id` | uuid | FK al usuario dueño (autoservicio) |
| `email` | text | Para vincular registro con artista |

**`invitations`** — tokens de invitación de un solo uso (expiran en 24 h)

### Seguridad (RLS)

Todas las tablas tienen **Row Level Security** activado:
- **Anónimos**: solo ven artistas con `status = 'Aprobado'` y `active = true`
- **Artistas**: solo ven y editan su propio registro
- **Admin**: acceso total (validado contra `profiles.role = 'admin'`)

### Determinación del rol admin

El rol admin se asigna al iniciar sesión: si el correo del usuario coincide con `ADMIN_EMAIL`, se le asigna `role = 'admin'` en `profiles` (solo hay un admin a la vez). El resto son artistas.

---

## Flujo de aprobación de artistas

```
Artista se registra
        │
        ▼
  status = "Pendiente"  ──►  NO aparece en el catálogo
        │
        ▼
  Admin revisa en /admin/aprobaciones
        │
        ▼
  status = "Aprobado"   ──►  ✅ Visible en el catálogo público
```

Un artista recién registrado **no aparece** en el catálogo hasta que el administrador lo apruebe. Esto permite filtrar la calidad de los artistas mostrados.

---

## Documentación adicional

- **`GUIA.md`** — guía completa de la app, usuarios de prueba y flujos
- **`MANUAL_USUARIO.md`** — manual de usuario no técnico (en español)
