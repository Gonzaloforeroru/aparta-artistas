-- Quita associations.logo_url.
--
-- Se creo anticipando un uso que nunca llego: el valor se guardaba y se leia,
-- pero NO se pintaba en ningun sitio. El unico efecto real era un campo mas en
-- el formulario de alta que nadie sabia para que servia.
--
-- Tampoco encaja donde esta hoy la insignia: es un chip de texto a 11 px en la
-- tarjeta del catalogo, donde un logo no se distinguiria. Un logo necesita una
-- superficie mayor -- una ficha publica del artista o una pagina de la propia
-- asociacion -- y ninguna de las dos existe todavia.
--
-- Volver a anadirlo el dia que haya donde ensenarlo es trivial. Mantenerlo
-- mientras tanto solo confunde a quien crea una asociacion.

alter table public.associations drop column if exists logo_url;
