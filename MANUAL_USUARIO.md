# Manual de Usuario — Apparta

Apparta es una plataforma donde restaurantes colombianos pueden encontrar y contactar artistas para sus eventos, y donde los artistas pueden mostrar su perfil profesional.

---

## Para Visitantes (sin cuenta)

### Ver el catálogo de artistas

1. Entra a la página principal
2. Haz clic en **"Ver catálogo de artistas"**
3. Verás todos los artistas disponibles con su foto, nombre, ciudad, género musical, precio y duración del show

### Buscar artistas

Puedes filtrar artistas por:
- **Nombre**: escribe en la barra de búsqueda
- **Ciudad**: selecciona del menú desplegable
- **Género musical**: haz clic en las etiquetas (Vallenato, Salsa, Pop, etc.)
- **Duración del show**: selecciona cuántas horas necesitas
- **Precio**: mueve los controles del rango de precio para ajustar tu presupuesto

Para quitar todos los filtros, haz clic en **"Limpiar filtros"**.

### Contactar un artista

En la tarjeta de cada artista verás:
- **Contactar**: abre una conversación directa por WhatsApp
- **YouTube / Instagram / Redes**: ver el trabajo y performance del artista

Si el artista tiene varias redes sociales, aparece un botón **"Redes"** que al hacer clic muestra todas sus plataformas (YouTube, Instagram, TikTok, Spotify, Sitio web).

---

## Para Artistas

### Crear tu cuenta

1. Entra a la página de inicio y haz clic en **"Regístrate"**
2. Puedes registrarte de dos formas:
   - **Con Google**: haz clic en "Continuar con Google"
   - **Con correo y contraseña**: llena el formulario con tu nombre, correo, contraseña y confírmala
3. Si te registras con correo, recibirás un email de verificación. Haz clic en el enlace del correo para activar tu cuenta
4. Al entrar por primera vez, verás un formulario para completar tu perfil

### Si ya fuiste agregado por el administrador

Si el administrador ya creó tu perfil (manualmente o desde un archivo), solo necesitas:
1. Registrarte o iniciar sesión con **el mismo correo** que el administrador usó
2. El sistema reconocerá tu correo y te mostrará toda la información que ya fue cargada
3. Puedes editar y actualizar tu perfil

### Completar tu perfil

La primera vez que entras, debes llenar los datos obligatorios (marcados con *):
- Nombre artístico
- Ciudad
- Profesión (Cantante, DJ, Banda, etc.)
- Género musical
- Precio por presentación
- Duración del show
- Teléfono

También puedes agregar opcionalmente:
- Foto de perfil
- Instagram, TikTok, YouTube, Spotify, Sitio web

Haz clic en **"Completar perfil"** para guardar. Hasta que no completes los datos obligatorios, esta pantalla seguirá apareciendo cada vez que entres.

### Ver tu perfil

Una vez completado, verás tu perfil tal como lo ven los restaurantes en el catálogo:
- Tu foto, nombre, ciudad, género, precio y duración
- Tus redes sociales
- Tu estado actual (Pendiente, Aprobado o Rechazado)

### Editar tu perfil

1. En tu perfil, haz clic en **"Editar perfil"**
2. Modifica los datos que quieras
3. Haz clic en **"Guardar cambios"**
4. Si cambias de opinión, haz clic en **"Cancelar"** y nada se guardará

### Cambiar tu correo o contraseña

Solo para cuentas creadas con correo y contraseña (no aplica para cuentas de Google):

1. Haz clic en el ícono de **engranaje** (⚙) en la barra superior
2. Selecciona:
   - **Cambiar correo**: ingresa tu nuevo correo y confirma
   - **Cambiar contraseña**: ingresa tu contraseña actual, la nueva y confírmala

### Cerrar sesión

Haz clic en **"Cerrar sesión"** en la barra superior.

---

## Para Administradores

### Iniciar sesión como administrador

El administrador se identifica por su correo electrónico configurado en el sistema. Al iniciar sesión (con Google o correo/contraseña), el sistema reconoce automáticamente al admin y lo dirige al panel de administración.

### Panel de administración

Desde el menú lateral puedes acceder a:

#### Artistas
- Ver la lista completa de artistas registrados
- Buscar por nombre
- Editar la información de cualquier artista
- Eliminar artistas
- Eliminar la foto de un artista

#### Aprobaciones
- Ver artistas pendientes de aprobación
- Aprobar o rechazar cada artista
- El número en la etiqueta roja indica cuántos artistas están pendientes

#### Importar artistas desde un archivo

Para cargar muchos artistas a la vez:

1. Ve a **Importar** en el menú lateral
2. Haz clic en **"Descargar plantilla CSV"** para obtener el formato correcto
3. Abre la plantilla en Excel o Google Sheets
4. Llena los datos de cada artista (una fila por artista):

| Columna | Obligatorio | Ejemplo |
|---------|:-----------:|---------|
| nombre | Sí | Juan Pérez |
| email | Sí | juan@correo.com |
| ciudad | Sí | Bogotá |
| tipo | Sí | Cantante |
| genero | Sí | Vallenato |
| telefono | Sí | 3101234567 |
| precio | Sí | 500000 |
| duracion | Sí | 2 horas |
| instagram | No | https://instagram.com/juan |
| tiktok | No | https://tiktok.com/@juan |
| youtube | No | https://youtube.com/@juan |
| spotify | No | https://open.spotify.com/artist/xxx |
| website | No | https://juanperez.com |

5. Guarda el archivo como CSV
6. Arrastra el archivo a la zona de carga o haz clic en **"Seleccionar archivo"**
7. Revisa la vista previa: las filas verdes están correctas, las rojas tienen errores
8. Haz clic en **"Importar X artistas válidos"**

**Tipos válidos:** Cantante, DJ, Banda, Mariachi, Grupo Musical, Solista

**Géneros válidos:** Vallenato, Salsa, Electrónica, Pop, Rock, Reggaeton, Tropical, Cumbia, Bachata

> Los artistas importados quedan como **Aprobados** y aparecen directamente en el catálogo.

> Cuando un artista importado se registre con el mismo correo, el sistema vincula su cuenta automáticamente con el perfil que ya existe. No se crean duplicados.

#### Crear un artista manualmente

1. Ve a **Artistas** en el menú lateral
2. Haz clic en **"Nuevo artista"**
3. Llena el formulario con los datos del artista
4. Sube una foto de perfil si la tienes
5. Haz clic en **"Crear artista"**

#### Editar un artista

1. En la lista de artistas, haz clic en el artista que quieras editar
2. Modifica los datos necesarios
3. Para eliminar la foto: haz clic en **"Eliminar foto"** (la foto se borrará al guardar, no antes)
4. Haz clic en **"Actualizar"** para guardar los cambios

#### Invitaciones

Puedes generar enlaces de invitación para que artistas se registren:
1. Ve a **Invitaciones** en el menú lateral
2. Genera un nuevo enlace
3. Comparte el enlace con el artista (por WhatsApp, email, etc.)
4. El artista hace clic en el enlace → lo lleva a iniciar sesión → completa su perfil

---

## Preguntas frecuentes

**¿Puedo registrarme sin que el administrador me agregue?**
Sí. Cualquiera puede crear una cuenta en `/registro`. Tu perfil quedará como "Pendiente" hasta que el administrador lo apruebe.

**¿Qué pasa si me registro con un correo que el admin ya usó para crearme?**
El sistema vincula tu cuenta con el perfil existente. Verás toda la información que el admin ya cargó y podrás editarla.

**¿Puedo usar Google y correo/contraseña?**
Puedes elegir uno al registrarte. Si usas Google, no podrás cambiar tu correo o contraseña desde la plataforma (se gestiona desde tu cuenta de Google).

**¿Por qué no aparezco en el catálogo?**
Tu perfil debe estar **Aprobado** y **Activo** para aparecer. Si tu estado es "Pendiente", espera a que el administrador lo apruebe.

**¿Puedo cambiar mi precio o duración?**
Sí, desde "Editar perfil" puedes cambiar cualquier dato de tu perfil.

**¿Cómo contactan los restaurantes a los artistas?**
A través del botón "Contactar" en el catálogo, que abre una conversación directa por WhatsApp con el número del artista.
