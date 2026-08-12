-- Arregla la visibilidad de los tags propuestos, sin recursion entre policies.
--
-- Problema 1 (circulo vicioso): `artist_select_own_proposed_tags` dejaba ver un
-- tag no oficial solo si YA existia la fila de artist_tags que lo enlaza. Pero
-- para crear esa fila hay que poder leer el tag antes, asi que justo despues de
-- que propose_tag() lo creara, su propio autor no podia verlo y la asignacion
-- se perdia en silencio.
--
-- Problema 2 (recursion): esa misma policy consultaba artist_tags, mientras que
-- la policy de INSERT de artist_tags consulta tags para comprobar si es badge.
-- Insertar disparaba tags -> artist_tags -> tags -> ... y Postgres abortaba con
-- "infinite recursion detected in policy for relation artist_tags".
--
-- Solucion: la condicion se reduce a `created_by`, que no toca artist_tags y
-- por tanto no puede recursar. No se pierde nada: un tag no oficial solo puede
-- nacer de propose_tag(), que siempre graba created_by = auth.uid(). Lo que
-- asigna el admin o llega por invitacion es oficial, y las insignias son
-- oficiales por constraint (tags_badge_always_official), asi que esos casos ya
-- los cubre la policy publica.

drop policy if exists artist_select_own_proposed_tags on public.tags;
create policy artist_select_own_proposed_tags on public.tags
  for select to authenticated
  using (created_by = (select auth.uid()));
