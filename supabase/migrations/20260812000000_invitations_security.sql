-- Cierra dos agujeros de seguridad reales en public.invitations.
--
-- Ambas politicas estaban VIVAS en produccion cuando se detectaron.
--
-- 1. anon_select_invitation  ->  SELECT para anon con USING (true)
--
--    La clave anonima viaja en el bundle del navegador, asi que cualquiera
--    podia hacer GET /rest/v1/invitations?select=* y cosechar TODOS los tokens
--    validos para registrarse por ellos.
--
-- 2. anon_update_used  ->  UPDATE para anon con CHECK (used_at is not null)
--
--    El CHECK solo obligaba a rellenar used_at, pero no impedia tocar el resto
--    de columnas: un anonimo podia modificar email, expires_at o cualquier otra
--    de una invitacion sin usar. Con la insignia de asociacion viviendo en esta
--    tabla, eso la convertiria en falsificable desde el navegador.
--
-- Tras esto, `anon` NO tiene ningun acceso directo a la tabla. El unico camino
-- para el flujo publico son las RPC validate_invitation / redeem_invitation
-- (security definer), que exponen solo lo necesario y no dejan escribir nada
-- que no sea consumir un uso.
--
-- Comprobado que nada del codigo depende de estas politicas:
--   - registerArtistWithToken() y handlePostLogin() usan el cliente de
--     servicio (service_role), que se salta RLS.
--   - /registro/[token] no consulta la tabla.
--   - Las 4 politicas admin_* quedan intactas.

drop policy if exists anon_select_invitation on public.invitations;
drop policy if exists anon_update_used       on public.invitations;
