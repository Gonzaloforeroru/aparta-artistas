# Guia de Uso — Apparta (Directorio de Artistas)

## Accesos de prueba

| Rol | Email | Contraseña | Acceso |
|-----|-------|------------|--------|
| **Admin** | `maldonadoelir@gmail.com` | Google OAuth | `/admin` |
| **Artista (Beéle)** | `beele@ejemplo.com` | `beele123` | `/artista` |

> **Nota:** El admin se determina por la variable `ADMIN_EMAIL` en `.env.local`. Cualquier otro usuario que se loguee entra como artista.

---

## Roles

### Admin
- Accede a `/admin`
- Puede crear, editar, aprobar/rechazar y eliminar artistas
- Importar artistas masivamente desde CSV
- Gestionar invitaciones
- Ver métricas
- **Solo puede existir un admin a la vez** (determinado por `ADMIN_EMAIL` en `.env.local`)

### Artista
- Accede a `/artista`
- Ve su perfil como aparece en el catálogo
- Puede editar su perfil (nombre, ciudad, tipo, género, precio, duración, foto, redes sociales, sitio web)
- Puede cambiar su correo y contraseña (solo cuentas email, no Google)
- **No puede** cambiar su estado (Pendiente/Aprobado/Rechazado) ni eliminarse

### Visitante (sin cuenta)
- Puede ver el catálogo público en `/catalogo`
- Puede filtrar por ciudad, género, duración y rango de precio
- Puede contactar artistas por WhatsApp
- Puede ver las redes del artista (YouTube, Instagram, TikTok, Spotify, Web)

---

## Flujo de autenticación

### Registro con email y contraseña
1. Ir a `/registro`
2. Llenar: nombre, correo, contraseña, confirmar contraseña
3. Clic en "Crear cuenta"
4. Se envía email de verificación (requiere SMTP configurado)
5. Clic en el link del email → confirma la cuenta
6. Se redirige a `/artista`
7. Si el perfil está incompleto → aparece formulario obligatorio en `/artista/completar`
8. Al completar → ve su perfil en `/artista`

### Registro/Login con Google
1. Ir a `/login`
2. Clic en "Continuar con Google"
3. Se autentica con Google OAuth
4. Si el email coincide con `ADMIN_EMAIL` → redirige a `/admin`
5. Si no → redirige a `/artista` (mismo flujo de completar perfil)

### Login con email y contraseña
1. Ir a `/login`
2. Ingresar correo y contraseña
3. Si es admin → `/admin`
4. Si es artista → `/artista`

> **Importante:** Si ya estás logueado y vas a `/login` o `/registro`, el sistema te redirige automáticamente a tu dashboard correspondiente.

---

## Asociación automática de artistas

Cuando un admin crea un artista (manualmente o por CSV) con un email, y luego ese artista se registra con **el mismo email**:

1. El sistema detecta que el email ya existe en la tabla `artists`
2. Vincula la cuenta del usuario con el registro del artista existente
3. El artista ve toda la información que el admin ya cargó
4. Puede editarla desde su perfil

**No se crean duplicados.** La comparación de email es case-insensitive.

---

## Páginas y rutas

| Ruta | Acceso | Descripción |
|------|--------|-------------|
| `/` | Público | Redirige a `/login` |
| `/login` | Público | Login (Google + email/contraseña) |
| `/registro` | Público | Registro con email/contraseña |
| `/registro/exito` | Público | Confirmación de registro enviado |
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
| `/artista/cuenta/correo` | Artista | Cambiar correo (solo email, no Google) |
| `/artista/cuenta/contrasena` | Artista | Cambiar contraseña (solo email, no Google) |

---

## Probar como Beéle (vista artista)

1. Ir a `/login`
2. Ingresar:
   - **Email:** `beele@ejemplo.com`
   - **Contraseña:** `beele123`
3. Se redirige a `/artista`
4. Verás el perfil de Beéle con:
   - Foto de perfil
   - Nombre: Beéle
   - Ciudad: Barranquilla
   - Tipo: Cantante
   - Género: Reggaeton
   - Precio: $5.000.000 COP
   - Duración: 2 horas
   - 5 redes sociales (Instagram, TikTok, YouTube, Spotify, Web)
   - Estado: Aprobado
5. Clic en "Editar perfil" → formulario con todos los datos pre-cargados
6. Clic en ⚙ (engranaje) → dropdown: "Cambiar correo" / "Cambiar contraseña"

---

## Probar como Admin

1. Ir a `/login`
2. Loguearse con la cuenta de Google asociada a `maldonadoelir@gmail.com`
3. Se redirige a `/admin`
4. Desde el sidebar:
   - **Artistas** → ver lista, editar, eliminar foto, cambiar estado
   - **Aprobaciones** → aprobar/rechazar artistas pendientes
   - **Importar** → cargar CSV con artistas
   - **Invitaciones** → generar links de invitación

---

## Importación CSV

### Formato del archivo

```csv
nombre,email,ciudad,tipo,genero,telefono,precio,duracion,instagram,tiktok,youtube,spotify,website
Juan Pérez,juan@correo.com,Bogotá,Cantante,Vallenato,3101234567,500000,2 horas,https://instagram.com/juan,,,, 
```

### Columnas obligatorias
- `nombre`, `email`, `ciudad`, `tipo`, `genero`, `telefono`, `precio`, `duracion`

### Columnas opcionales
- `instagram`, `tiktok`, `youtube`, `spotify`, `website`

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
- **Género**: pills seleccionables (Vallenato, Salsa, Pop, etc.)
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
| Next.js 16.2.1 | Framework web |
| React 19 | UI |
| TypeScript | Lenguaje |
| Tailwind CSS v4 | Estilos |
| shadcn/ui (base-nova) | Componentes UI |
| Supabase | Auth + Base de datos + Storage |
| Google OAuth | Login con Google |
| Bun | Package manager + runtime |
| Vercel | Deploy |

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=admin@ejemplo.com
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

> **ADMIN_EMAIL** determina quién es admin. Al cambiar este valor y loguearse con el nuevo email, el admin anterior pierde acceso automáticamente.
