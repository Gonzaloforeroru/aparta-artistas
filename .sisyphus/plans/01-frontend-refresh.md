# Plan 01: Frontend Refresh — Apparta

| Campo | Valor |
|---|---|
| **Estado** | Listo para ejecutar |
| **Fecha** | 2026-04-11 |
| **Dependencias** | Ninguna — ejecutable independientemente |
| **Stack** | Next.js 16.2.1 · React 19.2.4 · Tailwind CSS v4 · shadcn/ui base-nova · next-themes |

---

## 1. Objetivo

Transformar la maqueta actual en una UI moderna estilo startup — más colorida, con dark/light mode, animaciones sutiles, y la nueva arquitectura de rutas/sidebar. Al terminar, todas las vistas están rediseñadas y las nuevas páginas existen como shells funcionales con datos mock.

**Entregable**: Una app visualmente terminada que se puede mostrar como producto real, lista para conectar a Supabase.

---

## 2. Decisiones de diseño

| Aspecto | Decisión |
|---|---|
| **Modo** | Dark mode + light mode con toggle. Default: light. |
| **Estilo** | Startup moderna colombiana — vibrante, colorida, gradientes sutiles, sombras, glassmorphism selectivo |
| **Fuente** | Noto Sans (ya configurada) — evaluar si cambiamos a algo más startup-friendly (Inter, Plus Jakarta Sans) |
| **Animaciones** | Micro-interacciones: hover states, page transitions, skeleton loaders, stagger en listas |
| **Mobile** | Mobile-first en `/catalogo` (restaurantes lo usan en el celular) |
| **Icons** | Lucide (ya instalado) — mantener |
| **Componentes** | shadcn/ui base-nova — no crear custom donde shadcn ya resuelve |

---

## 3. Cambios a la arquitectura de rutas

### Rutas que se crean (shells con mock data)

| Ruta | Propósito | Contenido inicial |
|---|---|---|
| `/registro/[token]/page.tsx` | Form de registro protegido por token | Form completo con validación client-side, token param hardcoded como válido |
| `/registro/exito/page.tsx` | Página de éxito post-registro | "Gracias, tu perfil está en revisión" con ícono/ilustración |
| `/admin/importar/page.tsx` | Upload CSV + preview + import | Drag-and-drop zone, tabla de preview con datos mock, botón importar |
| `/admin/invitaciones/page.tsx` | Generar links + tabla de estado | Form email, link copiable (mock), tabla de invitaciones mock |
| `/error/page.tsx` | Error genérico | Mensaje amigable + botón volver |

### Rutas que se modifican

| Ruta | Cambio |
|---|---|
| `/registro/page.tsx` | Devuelve 404 (`notFound()`) — ya no es público |
| `/login/page.tsx` | Remover tarjeta guía. Solo botón Google (mock) + branding. Background con gradiente. |
| `/catalogo/page.tsx` | Rediseño visual: cards más vividas, header con hero/gradiente, filtros modernos |
| `/admin/layout.tsx` | Sin cambios estructurales (sidebar + header + content) |
| `/admin/page.tsx` | Dashboard con cards coloridas, charts actualizados |
| `/admin/lista/page.tsx` | Agregar botones "Importar CSV" + "Invitar Artista" en header. Visual polish. |
| `/admin/crear/page.tsx` | Visual polish, upload de foto con preview (mock — no sube a ningún lado) |
| `/admin/aprobaciones/page.tsx` | Visual polish — esta vista ahora solo muestra artistas que llegaron por link |
| `/admin/metricas/page.tsx` | Charts con nueva paleta de colores |

### Rutas que se eliminan

| Ruta | Motivo |
|---|---|
| ~~`/registro/page.tsx`~~ (contenido actual) | Se reemplaza por `notFound()`. La vista actual se mueve a `/registro/[token]/page.tsx`. |

### Sidebar reorganizado

```
ANTES                           DESPUÉS
──────────────                  ──────────────
Dashboard                       Dashboard
Artistas                        Artistas
Métricas                        Importar CSV         ← NUEVO
Aprobaciones (badge "3")        Invitaciones         ← NUEVO
                                Aprobaciones (badge dinámico)
──────────────                  Métricas
Footer:                         ──────────────
- Registro de Artista  ❌       Footer:
- Ver Catálogo  ✅              - Ver Catálogo  ✅
```

---

## 4. Entrega por fases

### Phase 1.0 — Prerequisites

- [ ] `bun install`
- [ ] Verificar que `bun run dev` corre sin errores
- [ ] Verificar que `next-themes` está instalado (ya está en `package.json`)

**Criterios**: Dev server levanta en `localhost:3000`.

---

### Phase 1.1 — Design System + Dark/Light Mode

**Objetivo**: Nuevo sistema de colores + toggle funcional dark/light.

- [ ] Configurar `next-themes` provider en `src/app/layout.tsx` (`<ThemeProvider attribute="class" defaultTheme="light">`)
- [ ] Agregar `dark` class al `<html>` en `layout.tsx`
- [ ] Rediseñar variables CSS en `globals.css`:
  - `:root` (light) con paleta vibrante — gradientes cálidos, acentos coloridos
  - `.dark` con paleta complementaria — fondos oscuros profundos, acentos neón/saturados
  - Status colors más vividos (success verde esmeralda, warning ámbar, error coral)
  - Chart colors actualizados (5 colores distintos y armónicos)
  - Sidebar dark independiente del modo (siempre oscuro o que adapte bien)
- [ ] Agregar toggle dark/light en `site-header.tsx` (ícono sun/moon)
- [ ] Verificar que TODOS los componentes shadcn/ui renderizan bien en dark mode
- [ ] Verificar contraste WCAG AA en ambos modos

**Criterios**: Toggle funcional. Ambos modos visualmente coherentes. Sin textos invisibles ni bordes perdidos en dark mode. `bun run build` ok.

---

### Phase 1.2 — Reorganización de Rutas + Sidebar

**Objetivo**: Crear las nuevas páginas (shells), eliminar las obsoletas, actualizar el sidebar.

- [ ] Crear `/registro/[token]/page.tsx` — mover el contenido actual de `/registro/page.tsx` aquí (adaptar para recibir `params.token`). El token se valida contra un array mock: `const VALID_TOKENS = ["demo123"]`.
- [ ] Crear `/registro/exito/page.tsx` — página estática "Gracias, tu perfil está en revisión"
- [ ] Modificar `/registro/page.tsx` — reemplazar contenido por `import { notFound } from 'next/navigation'; export default function() { notFound(); }`
- [ ] Crear `/admin/importar/page.tsx` — shell con drag-and-drop zone + tabla de preview vacía
- [ ] Crear `/admin/invitaciones/page.tsx` — shell con form de email + tabla mock de invitaciones
- [ ] Crear `/error/page.tsx` — mensaje de error genérico
- [ ] Modificar `src/components/app-sidebar.tsx`:
  - Agregar entradas: "Importar CSV" (UploadIcon), "Invitaciones" (MailIcon)
  - Remover footer: "Registro de Artista"
  - Mantener footer: "Ver Catálogo"
  - Badge de Aprobaciones: mantener como `"3"` (mock), se hará dinámico en Supabase plan
- [ ] Verificar navegación: todos los links del sidebar llevan a las páginas correctas

**Criterios**: Navegar por todas las rutas sin 404 (excepto `/registro` que SÍ da 404 intencionalmente). Sidebar muestra las nuevas entradas. `bun run build` ok.

---

### Phase 1.3 — Rediseño: Login

**Objetivo**: Login moderno, limpio, impactante.

- [ ] Remover tarjeta "Guía de la maqueta" (lado derecho)
- [ ] Rediseñar como single-card centrada:
  - Background: gradiente sutil o patrón geométrico (light + dark)
  - Logo "Apparta" prominente con tagline
  - Botón "Continuar con Google" (mock — solo visual, no funcional aún). Logo Google SVG inline.
  - Sin campos de email/password (admin usa solo Google)
  - Footer con link "¿Eres artista? Contacta un administrador" (no link a /registro porque ya no existe)
- [ ] Animación de entrada del card (fade-in + slide-up)
- [ ] Verificar dark/light mode

**Criterios**: Login se ve como producto real. No hay campos de email/password. Dark/light ok.

---

### Phase 1.4 — Rediseño: Catálogo Público

**Objetivo**: Catálogo visualmente atractivo que impresione a los restaurantes.

- [ ] Header/hero:
  - Gradiente de fondo vibrante
  - Título grande "Encuentra tu artista"
  - Barra de búsqueda prominente
- [ ] Filtros:
  - Convertir a chips/pills horizontales en vez de selects apilados
  - Animación de filtro activo
- [ ] Cards de artistas:
  - Sombras más pronunciadas en hover
  - Badge de tipo con color por categoría (Cantante = azul, DJ = púrpura, Banda = verde, etc.)
  - Imagen con overlay gradiente sutil
  - Precio grande y visible
  - Botón WhatsApp más prominente (ya usa `--whatsapp`)
  - Social links con hover animado
- [ ] Stagger animation al cargar cards (entrada secuencial)
- [ ] Empty state mejorado con ilustración o ícono grande
- [ ] Remover fake "Restaurante RE" del header — dejar solo logo + título
- [ ] Mobile: cards en columna única, filtros en sheet/drawer

**Criterios**: Catálogo se ve profesional y vibrante. Mobile usable. Dark/light ok.

---

### Phase 1.5 — Rediseño: Admin Pages

**Objetivo**: Panel admin moderno con personalidad.

- [ ] **Dashboard** (`/admin`):
  - Stat cards con gradientes o iconos coloridos de fondo
  - Chart con nueva paleta
  - Artistas recientes con avatares más grandes
  - Mover cálculos dentro del componente (no a module-level)
- [ ] **Lista** (`/admin/lista`):
  - Header con 3 botones: "+ Nuevo Artista", "↑ Importar CSV", "✉ Invitar Artista"
  - Tabla con zebra striping sutil, hover rows
  - Status badges más coloridos (ya usan --success/--warning/--error, hacerlos más vividos)
  - Avatares redondos más grandes en la tabla
- [ ] **Crear** (`/admin/crear`):
  - Upload de foto con preview visual (client-side `URL.createObjectURL`)
  - Form con secciones colapsables o tabs
  - Mejor spacing y agrupación visual
- [ ] **Aprobaciones** (`/admin/aprobaciones`):
  - Cards con foto más grande
  - Botones aprobar/rechazar más prominentes
  - Animación al aprobar/rechazar (card se desvanece)
- [ ] **Métricas** (`/admin/metricas`):
  - Charts con nueva paleta vibrante
  - Cards de charts con sombras y bordes sutiles
- [ ] **Importar** (`/admin/importar`) — shell visual:
  - Drag-and-drop zone estilizada
  - Tabla de preview con columnas de validación (✓ / ✗)
  - Barra de progreso para import
  - Template CSV descargable (link)
- [ ] **Invitaciones** (`/admin/invitaciones`) — shell visual:
  - Form limpio: campo email + botón "Generar Link"
  - Resultado: card con el link generado (mock) + botón "Copiar"
  - Tabla de invitaciones con columnas: email, estado (pill badge), fecha, acciones
  - Estados: Pendiente (amarillo), Usado (verde), Expirado (gris)

**Criterios**: Todas las admin pages visualmente consistentes. Nuevas vistas (importar, invitaciones) tienen shell funcional con mock data. Dark/light ok. `bun run build` ok.

---

### Phase 1.6 — Rediseño: Registro por Token

**Objetivo**: Form de registro atractivo para artistas que reciben el link.

- [ ] `/registro/[token]/page.tsx`:
  - Validación mock del token (`params.token === "demo123"` → ok, sino 404)
  - Background con gradiente o patrón (similar a login)
  - Logo + "Registro de Artista" + subtítulo "Completa tus datos para aparecer en nuestro catálogo"
  - Form organizado en secciones visuales claras:
    - Foto de perfil (upload con preview — mock, no sube)
    - Datos personales (nombre, ciudad)
    - Datos profesionales (tipo, género, precio, duración)
    - Contacto (teléfono WhatsApp)
    - Redes sociales (opcional, colapsable)
  - Botón submit prominente
  - Submit → toast "¡Solicitud enviada!" → redirect a `/registro/exito`
- [ ] `/registro/exito/page.tsx`:
  - Ícono de éxito grande (CheckCircle con animación)
  - "¡Gracias! Tu perfil está en revisión"
  - "Un administrador revisará tu información pronto"
  - Sin botón de "volver" ni navigation — el artista terminó

**Criterios**: Form funcional con mock. Token inválido → 404. Submit → éxito. Dark/light ok.

---

### Phase 1.7 — Polish: Animaciones, Responsive, Consistencia

**Objetivo**: Pulir detalles finales.

- [ ] Skeleton loaders en todas las páginas que tendrán Server Components (placeholder para Phase 4 Supabase)
- [ ] Page transition suave (CSS transitions o framer-motion lite)
- [ ] Toast styles consistentes con la nueva paleta
- [ ] Focus states visibles en todos los inputs (accessibility)
- [ ] Sidebar responsive: animación de collapse suave
- [ ] Mobile: verificar TODAS las vistas en viewport 375px y 768px
- [ ] Consistency check: mismo spacing, mismos radii, misma tipografía en todas las vistas
- [ ] `bun run build` → 0 errores
- [ ] `bun run lint` → 0 errores
- [ ] `lsp_diagnostics` limpio en todos los archivos modificados

**Criterios**: Build production sin errores. Todas las vistas consistentes. Mobile usable. Dark/light mode sin glitches.

---

## 5. Inventario de archivos

### Crear

| Archivo | Fase |
|---|---|
| `src/app/registro/[token]/page.tsx` | 1.2 |
| `src/app/registro/exito/page.tsx` | 1.2 |
| `src/app/admin/importar/page.tsx` | 1.2 |
| `src/app/admin/invitaciones/page.tsx` | 1.2 |
| `src/app/error/page.tsx` | 1.2 |
| `src/components/google-sign-in-button.tsx` | 1.3 |
| `src/components/theme-toggle.tsx` | 1.1 |

### Modificar

| Archivo | Fase |
|---|---|
| `src/app/layout.tsx` | 1.1 (ThemeProvider) |
| `src/app/globals.css` | 1.1 (paleta completa light + dark) |
| `src/app/login/page.tsx` | 1.3 |
| `src/app/registro/page.tsx` | 1.2 (→ notFound) |
| `src/app/catalogo/page.tsx` | 1.4 |
| `src/app/admin/page.tsx` | 1.5 |
| `src/app/admin/lista/page.tsx` | 1.5 |
| `src/app/admin/crear/page.tsx` | 1.5 |
| `src/app/admin/aprobaciones/page.tsx` | 1.5 |
| `src/app/admin/metricas/page.tsx` | 1.5 |
| `src/components/app-sidebar.tsx` | 1.2 |
| `src/components/site-header.tsx` | 1.1 (theme toggle) |
| `src/components/nav-user.tsx` | 1.5 (visual polish) |

---

## 6. Notas

- **Este plan NO toca Supabase**. Todos los datos siguen siendo mock. Las nuevas páginas (importar, invitaciones, registro/[token]) son shells funcionales con mock data.
- **Dark/light mode** usa `next-themes` (ya instalado). No necesita dependencias nuevas.
- **Animaciones**: usar `tw-animate-css` (ya instalado) + CSS transitions. NO agregar framer-motion a menos que sea necesario.
- **Fotos**: el upload en los forms es client-side preview solamente (`URL.createObjectURL`). El upload real a Storage va en el plan de Supabase.
- **El botón "Continuar con Google"** es visual (mock). Se conecta a Supabase Auth en el plan 02.

---

**Fin del plan.**
