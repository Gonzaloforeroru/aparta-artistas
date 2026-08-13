-- artists.association_id pasa de ON DELETE SET NULL a ON DELETE RESTRICT.
--
-- La regla de producto es "no se puede borrar una asociacion que tenga artistas
-- ligados". deleteAssociation() ya lo comprueba y devuelve un mensaje legible,
-- pero eso es una regla de la APLICACION: un borrado hecho por SQL, o una
-- carrera entre el recuento y el DELETE, dejaria a esos artistas sin insignia
-- en silencio y sin rastro de a quien pertenecian.
--
-- Con RESTRICT la base de datos se niega y la invariante deja de depender de
-- que la interfaz se acuerde de comprobarlo. La comprobacion en la accion se
-- mantiene: es la que da el mensaje entendible; esto es la red por debajo.
--
-- Para retirar una asociacion sin borrarla esta `active = false`, que la saca
-- del catalogo publico conservando el historial.

alter table public.artists
  drop constraint if exists artists_association_id_fkey;

alter table public.artists
  add constraint artists_association_id_fkey
  foreign key (association_id) references public.associations(id)
  on delete restrict;
