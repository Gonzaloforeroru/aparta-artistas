# Guía de Uso — Apparta (Directorio de Artistas)

Guía técnica de la plataforma. Para el manual no técnico, ver `MANUAL_USUARIO.md`.

**Producción:** https://aparta-artistas-brown.vercel.app

---

## Accesos

| Rol | Cómo entra | Acceso |
|-----|-----------|--------|
| **Admin** | Correo `gonchyforero@hotmail.com` + contraseña | `/admin` |
| **Artista** | Registro con correo + contraseña | `/artista` |
| **Visitante** | Sin cuenta | `/catalogo` |

> **El admin se determina por la variable `ADMIN_EMAIL`** (configurada en Vercel y `.env.local`). Actualmente es `gonchyforero@hotmail.com`. Quien inicie sesión con ese correo entra como admin; cualquier otro usuario entra como artista.

> **Nota:** El login con Google está **deshabilitado** en esta versión (el botón está oculto). Toda la autenticación es por correo y contraseña.

---

## Roles

### Admin
- Accede a `/admin`
- Crear, editar, aprobar/rechazar y eliminar artistas
- Importar artistas masivamente desde CSV
- Gestionar invitaciones
- Ver métricas
- **Solo puede existir un admin a la vez** (determinado por `ADMIN_EMAIL`)

### Artista
- Accede a `/artista`
- Ve su perfil como aparece en el catálogo
- Edita su perfil (nombre, ciudad, tipo, género, precio, duración, foto, redes, sitio web)
- Cambia su correo y contraseña
- **No puede** cambiar su estado (Pendiente/Aprobado/Rechazado) ni eliminarse

### Visitante (sin cuenta)
- Ve el catálogo público en `/catalogo`
- Filtra por ciudad, género, duración y rango de precio
- Contacta artistas por WhatsApp
- Ve las redes del artista (YouTube, Instagram, TikTok, Spotify, Web)

---

## Flujo de autenticación

### Registro con correo y contraseña
1. Ir a `/registro`
2. Llenar: nombre, correo, contraseña, confirmar contraseña
3. Clic en "Crear cuenta"
4. **Entra directo** (la confirmación de correo está desactivada) → redirige a `/artista`
5. Si el perfil está incompleto → formulario obligatorio en `/artista/completar`
6. Al completar → ve su perfil en `/artista`

### Login con correo y contraseña
1. Ir a `/login`
2. Ingresar correo y contraseña
3. Si el correo coincide con `ADMIN_EMAIL` → `/admin`
4. Si no → `/artista`

> **Importante:** Si ya estás logueado y vas a `/login` o `/registro`, el sistema te redirige automáticamente a tu dashboard.

> **Sobre la confirmación de correo:** Actualmente está **desactivada** para que el registro sea inmediato (evita el límite de correos del plan gratuito de Supabase). Si en el futuro se quiere activar verificación de correo, hay que configurar un SMTP propio (ej. Resend) — ver `README.md`.

---

## Asociación automática de artistas

Cuando un admin crea un artista (manualmente o por CSV) con un correo, y luego ese artista se registra con **el mismo correo**:

1. El sistema detecta que el correo ya existe en la tabla `artists`
2. Vincula la cuenta del usuario con el registro existente
3. El artista ve toda la información que el admin ya cargó
4. Puede editarla desde su perfil

**No se crean duplicados.** La comparación de correo es case-insensitive.

---

## Páginas y rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirige a `/login` |
| `/login` | Público | Login (correo/contraseña) |
| `/registro` | Público | Registro con correo/contraseña |
| `/registro/exito` | Público | Confirmación de registro |
| `/catalogo` | Público | Catálogo de artistas aprobados |
| `/admin` | Admin | Dashboard admin |
| `/admin/lista` | Admin | Lista de todos los artistas |
| `/admin/crear` | Admin | Crear nuevo artista |
| `/admin/crear?id=xxx` | Admin | Editar artista existente |
| `/admin/aprobaciones` | Admin | Cola de aprobaciones pendientes |
| `/admin/importar` | Admin | Importación masiva desde CSV |
| `/admin/invitaciones` | Admin | Gestión de invitaciones |
| `/admin/metricas` | Admin | Estadísticas generales |
| `/artista` | Artista | Vista de perfil del artista |
| `/artista/editar` | Artista | Editar perfil |
| `/artista/completar` | Artista | Formulario obligatorio para perfil incompleto |
| `/artista/cuenta/correo` | Artista | Cambiar correo |
| `/artista/cuenta/contrasena` | Artista | Cambiar contraseña |

---

## Probar como Admin

1. Ir a `/registro` (la primera vez) o `/login`
2. Usar el correo `gonchyforero@hotmail.com` + una contraseña
3. Se redirige a `/admin`
4. Desde el sidebar:
   - **Artistas** → ver lista, editar, eliminar foto, cambiar estado
   - **Aprobaciones** → aprobar/rechazar artistas pendientes
   - **Importar** → cargar CSV con artistas
   - **Invitaciones** → generar links de invitación
   - **Métricas** → estadísticas

> La primera vez, el admin debe **registrarse** con ese correo (ya que la base de datos arranca vacía). Al usar `gonchyforero@hotmail.com`, el sistema le asigna rol admin automáticamente.

## Probar como Artista

1. Ir a `/registro`
2. Registrarse con cualquier correo + contraseña (mínimo 6 caracteres)
3. Entra directo a `/artista` → completa el perfil
4. El perfil queda **Pendiente** hasta que el admin lo apruebe
5. Una vez aprobado, aparece en el catálogo público

---

## Importación CSV

### Formato del archivo

```csv
nombre,email,ciudad,tipo,genero,telefono,precio,duracion,instagram,tiktok,youtube,spotify,website
Juan Pérez,juan@correo.com,Bogotá,Cantante,Vallenato,3101234567,500000,2 horas,https://instagram.com/juan,,,,
```

### Columnas obligatorias
`nombre`, `email`, `ciudad`, `tipo`, `genero`, `telefono`, `precio`, `duracion`

### Columnas opcionales
`instagram`, `tiktok`, `youtube`, `spotify`, `website`

### Valores válidos para `tipo`
Cantante, DJ, Banda, Mariachi, Grupo Musical, Solista

### Valores válidos para `genero`
Vallenato, Salsa, Electrónica, Pop, Rock, Reggaeton, Tropical, Cumbia, Bachata

### Pasos
1. Ir a `/admin/importar`
2. Descargar plantilla CSV (botón arriba a la derecha)
3. Llenar con datos de artistas
4. Arrastrar el archivo o seleccionarlo
5. Ver preview: filas verdes = válidas, rojas = con errores
6. Clic "Importar X artistas válidos"
7. Los artistas se crean como **Aprobado + Activo**

---

## Catálogo público

### Filtros disponibles
- **Ciudad**: dropdown con todas las ciudades
- **Género**: selección (Vallenato, Salsa, Pop, etc.)
- **Duración**: dropdown (1 hora, 2 horas, 3 horas, 4 horas, 5+ horas)
- **Costo**: slider de rango en COP ($0 — $10.000.000)
- **Búsqueda**: por nombre del artista

### Tarjeta de artista
- Foto + nombre + ciudad + género (overlay)
- Precio + duración
- Botón **Contactar** (WhatsApp)
- Si tiene 1 red social → botón directo (ej: "YouTube")
- Si tiene 2+ redes → botón **"Redes"** con dropdown (YouTube, Instagram, TikTok, Spotify, Web)

---

## Stack técnico

| Tecnología | Uso |
|-----------|-----|
| Next.js 16.2.1 | Framework web (App Router + Turbopack) |
| React 19 | UI |
| TypeScript | Lenguaje |
| Tailwind CSS v4 | Estilos |
| Radix / Base UI / shadcn | Componentes UI |
| Supabase | Auth + Base de datos + Storage |
| Recharts | Gráficas (métricas) |
| Bun | Package manager + runtime |
| Vercel | Deploy |

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://fplrquayqyudqrwvnlze.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=gonchyforero@hotmail.com
NEXT_PUBLIC_SITE_URL=https://aparta-artistas-brown.vercel.app
```

> **`ADMIN_EMAIL`** determina quién es admin. Al cambiar este valor y loguearse con el nuevo correo, el admin anterior pierde acceso automáticamente.

> Para montar la base de datos desde cero, ejecutar `supabase/reset_and_migrate.sql` en el SQL Editor de Supabase (ver `README.md`).
